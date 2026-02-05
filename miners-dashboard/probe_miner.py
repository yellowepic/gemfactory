import urllib.request
import urllib.error

# NerdQaxe++ IP
MINER_IP = "192.168.0.154"
# Using the proxy port
PROXY_URL = "http://localhost:8000/proxy/" + MINER_IP

COMMON_ENDPOINTS = [
    "/api/stats",
    "/api/v1/stats",
    "/stats",
    "/api/miner/stats",
    "/api/status",
    "/info",
    "/api/info" # We know api/system/info works, checking if others do
]

print(f"Probing {MINER_IP} via proxy...")

for endpoint in COMMON_ENDPOINTS:
    url = f"{PROXY_URL}{endpoint}"
    print(f"Checking {endpoint}...", end=" ")
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'miners-dashboard-probe'}
        )
        with urllib.request.urlopen(req, timeout=2) as response:
            content = response.read()
            # Check if it looks like JSON (starts with {) and not HTML (<)
            if content.strip().startswith(b'{'):
                print(f"SUCCESS! Found JSON response.")
                print(f"Preview: {content[:100]}")
            elif content.strip().startswith(b'<'):
                print("Failed (Returned HTML)")
            else:
                print(f"Unknown Content: {content[:20]}")
    except Exception as e:
        print(f"Error: {e}")
