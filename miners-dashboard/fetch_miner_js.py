import urllib.request
import re
import os

PROXY_BASE = "http://localhost:8000/proxy/192.168.0.154"
OUTPUT_FILE = "miner_analysis.txt"

def fetch(url):
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'miners-dashboard-probe'}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            return response.read().decode('utf-8', errors='ignore')
    except Exception as e:
        return f"Error: {e}"

def analyze():
    with open(OUTPUT_FILE, "w") as f:
        f.write(f"Analyzing {PROXY_BASE}...\n")
        
        # 1. Fetch Index
        html = fetch(PROXY_BASE + "/")
        f.write(f"Index Length: {len(html)}\n")
        
        # 2. Find scripts
        scripts = re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', html)
        f.write(f"Found scripts: {scripts}\n")
        
        # 3. Analyze scripts
        for script in scripts:
            if script.startswith("http"): continue # Skip external
            
            # Handle relative paths
            script_url = PROXY_BASE + "/" + script.lstrip("/")
            f.write(f"Fetching {script_url}...\n")
            js_content = fetch(script_url)
            
            f.write(f"  Length: {len(js_content)}\n")
            
            # Look for API patterns
            matches = re.findall(r'["\'](/api/[^"\']+)["\']', js_content)
            matches += re.findall(r'["\'](api/[^"\']+)["\']', js_content)
            
            if matches:
                f.write(f"  Found potential endpoints: {matches}\n")
            
            # Simple keyword search
            if "stats" in js_content:
                f.write("  'stats' keyword found.\n")
                # Context
                idx = js_content.find("stats")
                f.write(f"  Context: {js_content[max(0, idx-20):min(len(js_content), idx+50)]}\n")

analyze()
