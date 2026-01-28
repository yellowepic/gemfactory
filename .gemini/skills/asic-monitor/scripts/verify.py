import sys

def check_governance(content):
    # Check for Australian spelling
    if "optimize" in content or "program" in content:
        print("FAIL: Use Australian spelling (optimise/programme).")
        return False
    # Check for ASIC safety (basic example)
    if "set_voltage" in content and "unverified" in content:
        print("FAIL: Voltage changes require manual override.")
        return False
    return True

if __name__ == "__main__":
    # Logic to read the worker's proposed output and run checks
    pass