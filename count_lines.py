import os
import glob

def count_lines_in_files():
    """Count lines in all relevant files"""
    
    # Backend Python files
    backend_files = glob.glob("backend/*.py")
    backend_lines = 0
    for file in backend_files:
        if os.path.exists(file):
            try:
                with open(file, 'r', encoding='utf-8') as f:
                    lines = len(f.readlines())
                    backend_lines += lines
                    print(f"{file}: {lines} lines")
            except Exception as e:
                print(f"Error reading {file}: {e}")
    
    print(f"\nBackend total: {backend_lines} lines")
    
    # Frontend TSX/TS files - search more thoroughly
    frontend_files = []
    
    # Search in src directory
    for root, dirs, files in os.walk("src"):
        for file in files:
            if file.endswith(('.tsx', '.ts', '.js')):
                full_path = os.path.join(root, file)
                frontend_files.append(full_path)
    
    frontend_lines = 0
    for file in frontend_files:
        if os.path.exists(file):
            try:
                with open(file, 'r', encoding='utf-8') as f:
                    lines = len(f.readlines())
                    frontend_lines += lines
                    print(f"{file}: {lines} lines")
            except Exception as e:
                print(f"Error reading {file}: {e}")
    
    print(f"\nFrontend total: {frontend_lines} lines")
    print(f"\nTotal application: {backend_lines + frontend_lines} lines")
    
    # Also show what we found
    print(f"\nFound {len(frontend_files)} frontend files")
    print("Frontend files:", frontend_files[:10])  # Show first 10 files

if __name__ == "__main__":
    count_lines_in_files()
