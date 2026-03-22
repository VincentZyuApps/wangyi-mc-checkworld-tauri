#!/usr/bin/env python3
import argparse
import re
import json


def update_cargo_toml(version):
    """Update version in Cargo.toml"""
    cargo_path = "src-tauri/Cargo.toml"
    with open(cargo_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Update version line
    new_content = re.sub(r'version = "[^"]+"', f'version = "{version}"', content)
    
    with open(cargo_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"Updated {cargo_path} to version {version}")


def update_tauri_conf(version):
    """Update version in tauri.conf.json"""
    conf_path = "src-tauri/tauri.conf.json"
    with open(conf_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Update version (directly at root level)
    data['version'] = version
    
    with open(conf_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Updated {conf_path} to version {version}")


def main():
    parser = argparse.ArgumentParser(description='Bump version numbers in the project')
    parser.add_argument('--version', default='0.0.0', help='New version number (default: 0.0.0)')
    args = parser.parse_args()
    
    version = args.version
    print(f"Bumping version to {version}")
    
    update_cargo_toml(version)
    update_tauri_conf(version)
    
    print("Version bump completed successfully!")


if __name__ == "__main__":
    main()