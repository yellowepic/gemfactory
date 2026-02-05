import subprocess
import os
import re
import sys
import json

def run_command(command, cwd=None):
    try:
        result = subprocess.run(
            command, 
            cwd=cwd, 
            shell=True, 
            capture_output=True, 
            text=True
        )
        return result.stdout, result.stderr, result.returncode
    except Exception as e:
        return "", str(e), -1

def check_npm_audit(cwd):
    print("Running npm audit...")
    stdout, stderr, code = run_command("npm audit --json", cwd=cwd)
    try:
        data = json.loads(stdout)
        vulnerabilities = data.get('metadata', {}).get('vulnerabilities', {})
        return vulnerabilities
    except:
        return {"error": "Could not parse npm audit output", "raw": stdout[:200]}

def scan_file_for_secrets(filepath):
    secrets = []
    # Basic patterns
    patterns = {
        'Private Key': r'-----BEGIN PRIVATE KEY-----',
        'API Key': r'api[_-]?key\s*[:=]\s*[\'"][a-zA-Z0-9]{20,}[\'"]',
        'Password': r'password\s*[:=]\s*[\'"][^\'"]{4,}[\'"]',
        'Hardcoded IP': r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b'
    }
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f, 1):
                for name, pattern in patterns.items():
                    if re.search(pattern, line, re.IGNORECASE):
                        # Filter out common false positives for IPs (local)
                        if name == 'Hardcoded IP' and ('127.0.0.1' in line or '0.0.0.0' in line or 'localhost' in line):
                            continue
                        secrets.append(f"Line {i}: Possible {name} found")
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        
    return secrets

def scan_python_safety():
    # Simple checks without external deps if bandit isn't there
    issues = []
    # Check for debug=True in run
    return issues

def main():
    report = []
    project_dir = os.getcwd()
    
    report.append(f"# Security Scan Report")
    report.append(f"Target: {project_dir}\n")

    # 1. NPM Audit
    report.append("## 1. NPM Dependency Audit")
    vulns = check_npm_audit(project_dir)
    report.append("```json")
    report.append(json.dumps(vulns, indent=2))
    report.append("```\n")

    # 2. Secret Scanning & Code Safety
    report.append("## 2. Code Safety & Secrets")
    
    files_to_scan = []
    for root, dirs, files in os.walk(project_dir):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.git' in dirs:
            dirs.remove('.git')
            
        for file in files:
            if file.endswith(('.js', '.py', '.json', '.env', '.html')):
                files_to_scan.append(os.path.join(root, file))
                
    for filepath in files_to_scan:
        rel_path = os.path.relpath(filepath, project_dir)
        secrets = scan_file_for_secrets(filepath)
        
        if secrets:
            report.append(f"### File: {rel_path}")
            for s in secrets:
                report.append(f"- [WARNING] {s}")
            report.append("")
            
    # 3. Server Check for Host Binding
    if os.path.exists("server.py"):
        with open("server.py", "r") as f:
            content = f.read()
            if "0.0.0.0" in content:
                report.append("## 3. Network Configuration")
                report.append("- [CAUTION] server.py appears to bind to 0.0.0.0. Ensure this is trusted network only.")

    report_content = "\n".join(report)
    print(report_content)
    
    # Create public directory if not exists
    public_dir = os.path.join(project_dir, 'public')
    if not os.path.exists(public_dir):
        os.makedirs(public_dir)

    with open(os.path.join(public_dir, "security_report.md"), "w") as f:
        f.write(report_content)
    print("\nReport saved to security_report.md")

if __name__ == "__main__":
    main()
