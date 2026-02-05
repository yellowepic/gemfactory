
import http.server
import socketserver
import urllib.request
import urllib.error
import json
import re
import socket

PORT = 8000

# Use ThreadingTCPServer to handle multiple requests simultaneously
# This prevents one slow/offline miner from blocking the entire dashboard
class ThreadingHTTPServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True

class CORSProxyRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Regex to match /proxy/<ip>/<endpoint>
        match = re.match(r'^/proxy/([^/]+)/(.*)', self.path)
        
        if match:
            target_ip = match.group(1)
            target_path = match.group(2)
            # Encode spaces in path just in case, though unlikely for API
            target_path = urllib.parse.quote(target_path)
            target_url = f"http://{target_ip}/{target_path}"
            
            print(f"Proxying: {target_url}")
            
            try:
                # Set a strict timeout so we don't hang forever
                # Use a custom UA to avoid getting served the HTML dashboard by accident
                req = urllib.request.Request(
                    target_url, 
                    headers={'User-Agent': 'miners-dashboard-proxy'}
                )
                
                # 3 second timeout - miners should reply fast
                with urllib.request.urlopen(req, timeout=3) as response:
                    content = response.read()
                    status_code = response.getcode()
                    
                    # Debug: Check for compression
                    encoding = response.info().get('Content-Encoding')
                    if encoding == 'gzip':
                        print(f"  -> {target_url} Decompressing GZIP...")
                        import gzip
                        content = gzip.decompress(content)
                    elif encoding:
                        print(f"  -> {target_url} Encoding: {encoding} (Not handled)")
                    
                    self.send_response(status_code)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(content)
                    try:
                        scan_text = content.decode('utf-8', errors='ignore')
                        preview = scan_text[:100].replace('\n', ' ')
                        print(f"  -> Success: {target_url} [len={len(content)}] Preview: {preview}")
                    except:
                        print(f"  -> Success: {target_url} [len={len(content)}] (Binary/Unprintable)")
                    
            except urllib.error.URLError as e:
                error_msg = str(e.reason) if hasattr(e, 'reason') else str(e)
                print(f"  -> Failed {target_url}: {error_msg}")
                self.send_error_json(502, f"Connection Failed: {error_msg}")
            except socket.timeout:
                print(f"  -> Timeout {target_url}")
                self.send_error_json(504, "Connection Timed Out")
            except Exception as e:
                print(f"  -> Error {target_url}: {str(e)}")
                self.send_error_json(500, f"Proxy Error: {str(e)}")
        else:
            super().do_GET()

    def send_error_json(self, code, message):
        try:
            self.send_response(code)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': message, 'status': 'offline'}).encode('utf-8'))
        except Exception:
            pass # Socket might be closed already

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def log_message(self, format, *args):
        # Only log errors (4xx, 5xx) to reduce noise, we print our own proxy logs
        if int(args[1]) >= 400:
             sys.stderr.write("%s - - [%s] %s\n" %
                             (self.address_string(),
                              self.log_date_time_string(),
                              format%args))

import sys
class Tee:
    def __init__(self, stream, file):
        self.stream = stream
        self.file = file

    def write(self, data):
        self.stream.write(data)
        self.file.write(data)
        self.file.flush()  # Ensure it is written immediately

    def flush(self):
        self.stream.flush()
        self.file.flush()

if __name__ == "__main__":
    # Setup logging to both console and file
    log_file = open("dashboard.log", "a", buffering=1)
    original_stdout = sys.stdout
    original_stderr = sys.stderr
    
    sys.stdout = Tee(sys.stdout, log_file)
    sys.stderr = Tee(sys.stderr, log_file)

    print(f"Starting Multi-Threaded Miner Console on port {PORT}...")
    print(f"Open http://localhost:{PORT}")

    with ThreadingHTTPServer(("", PORT), CORSProxyRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down...")
            httpd.shutdown()
        except Exception as e:
            print(f"\nCRITICAL SERVER ERROR: {e}")
            import traceback
            traceback.print_exc()

