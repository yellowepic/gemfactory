import requests
import time
import os
import datetime
import sys

def get_args():
    args_dict = {"ip": None, "refresh": 10}
    for arg in sys.argv[1:]:
        if "=" in arg:
            key, value = arg.split("=", 1)
            if key in args_dict:
                args_dict[key] = value if key == "ip" else int(value)
    return args_dict

def format_val(val, unit="", decimals=2):
    if val is None or val == "": return "N/A"
    try:
        return f"{float(val):.{decimals}f}{unit}"
    except ValueError:
        # Handle cases where val might be a non-numeric string that can't be converted to float
        return str(val)
    except:
        return str(val)

params = get_args()
if not params["ip"]:
    print("Usage: python monitor.py ip=192.168.x.x")
    sys.exit(1)

URL = f"http://{params['ip']}/api/system/info"
session = requests.Session()
top_shares = []
start_time = datetime.datetime.now()

try:
    response = session.get(URL, timeout=5)
    d = response.json()
    
    # --- Auto-Detection Logic ---
    chips = d.get("asicCount", 4) # Default to 4 for NerdQaxe++
    freq = d.get("frequency", 0)
    expected_gh = freq * 2.06666 * chips
    actual_gh = d.get("hashRate", 0)
    efficiency = (actual_gh / expected_gh * 100) if expected_gh > 0 else 0

    # --- Update Top 10 Shares ---
    best_diff = d.get("bestDiff", 0)
    if best_diff > 0 and best_diff not in top_shares:
        top_shares.append(best_diff)
        top_shares = sorted(top_shares, reverse=True)[:10]

    # Calculate session uptime
    session_uptime = datetime.datetime.now() - start_time

    # os.system('cls' if os.name == 'nt' else 'clear')
    
    # Header with Identity
    print(f"* {d.get('deviceModel', 'NerdQaxe++')} Monitor | Firmware: {d.get('version', 'AxeOS')}")
    print(f"> Host: {d.get('hostname', params['ip'])} | Device Uptime: {d.get('uptime', 'N/A')} | Session Uptime: {str(session_uptime).split('.')[0]}")
    print("="*80)

    # Performance Section
    print(f"[PERFORMANCE]")
    print(f" Hashrate (Actual)  : {format_val(actual_gh, ' GH/s')} (Eff: {efficiency:.1f}%)")
    print(f" Hashrate (Expected): {format_val(expected_gh, ' GH/s')} @ {freq}MHz")
    print(f" Power Consumption  : {format_val(d.get('power'), ' W')} ({format_val(d.get('voltage')/1000, ' V', 3)})")
    
    # Health Section
    print(f"\n[HARDWARE HEALTH]")
    print(f" ASIC Temp / VRM    : {format_val(d.get('temp'))}°C / {format_val(d.get('vrTemp'))}°C")
    print(f" Fan Speed          : {d.get('fanSpeed', '0')} RPM")
    print(f" Free Memory        : {d.get('freeHeap', 0) // 1024} KB")

    # Network & Pool Section
    print(f"\n[NETWORK & POOL]")
    print(f" Connected Pool     : {d.get('poolUser', 'N/A')} @ {d.get('poolUrl', 'N/A')}")
    print(f" Best Share Found   : {format_val(best_diff)}")
    print(f" Network Difficulty : {d.get('networkDifficulty', 'N/A')}")
    
    # Bottom Session Stats
    print("\n# TOP 10 SHARES (SESSION)")
    share_line = " | ".join([f"{s/1e9:.1f}G" if s >= 1e9 else str(int(s)) for s in top_shares])
    print(share_line if top_shares else "No shares found in this session yet...")

except Exception as e:
    print(f"Connection Error: {e}")
