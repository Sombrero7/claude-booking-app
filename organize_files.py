#!/usr/bin/env python3
import os
import re
import sys
import argparse
from pathlib import Path
import shutil

def extract_file_info(content):
    """Extract file paths and content from the artifacts."""
    # Regular expressions to find file paths and content
    file_patterns = [
        # Match path patterns like: // apps/frontend/src/pages/_app.tsx
        r'(?:\/\/|#) ((?:apps|packages)\/[\w\/-]+\.\w+)',
        # Match absolute paths at the beginning of lines
        r'^((?:apps|packages)\/[\w\/-]+\.\w+)',
    ]
    
    current_file = None
    current_content = []
    files_data = []
    
    lines = content.split('\n')
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # Look for file path indicators
        file_path = None
        for pattern in file_patterns:
            match = re.match(pattern, line.strip())
            if match:
                file_path = match.group(1)
                break
        
        if file_path:
            # If we were already collecting content for a file, save it
            if current_file:
                files_data.append((current_file, '\n'.join(current_content).strip()))
            
            # Start a new file
            current_file = file_path
            current_content = []
            
            # Skip any empty lines or comment lines before content starts
            i += 1
            while i < len(lines) and (not lines[i].strip() or lines[i].strip().startswith('//') or lines[i].strip().startswith('#')):
                i += 1
        else:
            # Add line to current file content
            if current_file:
                current_content.append(line)
            i += 1
    
    # Add the last file if it exists
    if current_file and current_content:
        files_data.append((current_file, '\n'.join(current_content).strip()))
    
    return files_data

def process_file(file_path, dest_dir):
    """Process a single file and extract/write file contents."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    files_data = extract_file_info(content)
    
    for file_path, file_content in files_data:
        # Handle cases where file paths might have leading or trailing quotes or spaces
        file_path = file_path.strip('\'"').strip()
        
        # Create the full path in the destination directory
        full_path = os.path.join(dest_dir, file_path)
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        # Write the file
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(file_content)
        
        print(f"Created file: {full_path}")

def main():
    parser = argparse.ArgumentParser(description='Organize code files from artifacts.')
    parser.add_argument('source_dir', help='Directory containing the saved artifacts')
    parser.add_argument('dest_dir', help='Destination directory for organized files')
    
    args = parser.parse_args()
    
    source_dir = args.source_dir
    dest_dir = args.dest_dir
    
    # Create destination directory if it doesn't exist
    os.makedirs(dest_dir, exist_ok=True)
    
    # Process all files in the source directory
    for root, _, files in os.walk(source_dir):
        for file in files:
            file_path = os.path.join(root, file)
            try:
                process_file(file_path, dest_dir)
            except Exception as e:
                print(f"Error processing {file_path}: {e}")
    
    print(f"\nFiles have been organized in {dest_dir}")

if __name__ == "__main__":
    main()
    