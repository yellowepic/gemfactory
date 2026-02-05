import urllib.request
import json
import socket

miners = [
    {'name': 'nerdqaxe++', 'ip': '192.168.0.154'},
    {'name': 'ak-bitaxe', 'ip': '192.168.0.157'}, 
    {'name': 'ck-bitaxe', 'ip': '192.168.0.156'},
]

output_file = "miner_dump.txt"

def log(msg):
    with open(output_file, "a") as f:
        f.write(msg + "\n")

def get_json(ip, endpoint):
    url = f"http://{ip}{endpoint}"
    log(f"--- FETCHING {url} ---")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=3) as response:
            data = response.read()
            try:
                j = json.loads(data)
                log(json.dumps(j, indent=2))
                return j
            except:
                log(f"Invalid JSON: {data}")
    except Exception as e:
        log(f"FAILED: {e}")
    return None

# Clear file
open(output_file, "w").close()

for miner in miners:
    log(f"\n\n=== {miner['name']} ({miner['ip']}) ===")
    
    # Check info
    info = get_json(miner['ip'], "/api/system/info")
    
    # Check stats
    stats = get_json(miner['ip'], "/api/system/stats")
