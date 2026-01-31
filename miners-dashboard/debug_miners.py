import urllib.request
import json
import socket
import sys

miners = [
    {'name': 'nerdqaxe++', 'ip': '192.168.0.154'},
    {'name': 'ak-bitaxe', 'ip': '192.168.0.157'},
    {'name': 'ck-bitaxe', 'ip': '192.168.0.156'},
]

log_file = open("connectivity_log.txt", "w", buffering=1)

def log(msg):
    print(msg)
    log_file.write(msg + "\n")
    log_file.flush()

log("Starting connectivity check...")

for miner in miners:
    url = f"http://{miner['ip']}/api/system/info"
    log(f"\nChecking {miner['name']} ({miner['ip']})...")
    
    # Check TCP connection first
    try:
        sock = socket.create_connection((miner['ip'], 80), timeout=2)
        log(f"  [PASS] TCP Port 80 is open")
        sock.close()
    except Exception as e:
        log(f"  [FAIL] TCP Connect failed: {e}")
        # If TCP fails, no point checking API usually, but we try anyway
    
    # Check API
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            log(f"  [PASS] API responded with code {response.getcode()}")
            data = response.read()
            try:
                json_data = json.loads(data)
                log(f"  [PASS] Valid JSON received. Keys: {list(json_data.keys())}")
            except json.JSONDecodeError:
                log(f"  [FAIL] Invalid JSON: {data[:100]}")
    except Exception as e:
        log(f"  [FAIL] API request failed: {e}")

log("\nDone.")
log_file.close()
