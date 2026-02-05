import os
import re

project_dir = os.getcwd()
report = []

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
        pass
    return secrets

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

with open("code_scan_results.txt", "w") as f:
    f.write("\n".join(report))
print("Scan done")
