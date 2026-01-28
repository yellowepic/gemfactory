
import os
import csv
import datetime
import time
import random

# The log file is located in the `logs` directory, relative to this script.
LOG_FILE = os.path.join(os.path.dirname(__file__), '..', 'logs', 'miner_stats.csv')

def get_hashrate():
    """
    Returns the hashrate of the ASIC.
    This is a mock function, returning a random number.
    In a real-world scenario, this function would communicate with the ASIC
    to get the actual hashrate.
    """
    # NerdQaxe++ hashrate is around 220 MH/s. We'll simulate that.
    return random.randint(200, 250)

def main():
    """
    Monitors the ASIC hashrate and logs it to a CSV file.
    """
    # Create the log file with a header if it doesn't exist
    if not os.path.exists(LOG_FILE):
        with open(LOG_FILE, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['timestamp', 'hashrate'])

    # Start monitoring
    while True:
        hashrate = get_hashrate()
        timestamp = datetime.datetime.now().isoformat()
        
        with open(LOG_FILE, 'a', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([timestamp, hashrate])
        
        print(f"Logged: {timestamp}, {hashrate} MH/s")
        
        time.sleep(60)

if __name__ == '__main__':
    main()
