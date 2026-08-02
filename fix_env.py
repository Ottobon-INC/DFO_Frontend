import os

env_path = r'c:\Users\adrad\OneDrive\Desktop\dfo-frontend\.env'

with open(env_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.startswith('VITE_API_URL='):
        lines[i] = 'VITE_API_URL=http://localhost:8000\n'

with open(env_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
