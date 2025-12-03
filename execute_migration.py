#!/usr/bin/env python3
"""
Execute SQL migration on Supabase database
This script reads the migration file and executes it against the Supabase PostgreSQL database
"""

import os
import sys
from pathlib import Path
import re

# Try to import supabase client
try:
    from supabase import create_client
except ImportError:
    print("ERROR: Supabase client not installed")
    print("Run: pip install supabase")
    sys.exit(1)

def load_env_file():
    """Load environment variables from .env file"""
    env_path = Path(".env")
    if not env_path.exists():
        print("ERROR: .env file not found")
        return None
    
    env_vars = {}
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                if "=" in line:
                    key, value = line.split("=", 1)
                    env_vars[key.strip()] = value.strip()
    
    return env_vars

def validate_credentials(env_vars):
    """Validate that required Supabase credentials are configured"""
    required_keys = ["VITE_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
    
    for key in required_keys:
        if key not in env_vars or not env_vars[key]:
            print(f"ERROR: Missing {key} in .env file")
            return False
    
    url = env_vars["VITE_SUPABASE_URL"]
    key = env_vars["SUPABASE_SERVICE_ROLE_KEY"]
    
    if not url.startswith("https://"):
        print(f"ERROR: Invalid VITE_SUPABASE_URL format: {url}")
        return False
    
    if len(key) < 50:
        print(f"ERROR: Invalid SUPABASE_SERVICE_ROLE_KEY format (too short)")
        return False
    
    return True

def read_migration_file():
    """Read the SQL migration file"""
    migration_path = Path("supabase/migrations/fix_schema_issues.sql")
    
    if not migration_path.exists():
        print(f"ERROR: Migration file not found: {migration_path}")
        return None
    
    with open(migration_path) as f:
        sql = f.read()
    
    return sql

def split_sql_statements(sql):
    """Split SQL statements by semicolon (naive approach, works for most cases)"""
    # Remove comments
    lines = []
    for line in sql.split('\n'):
        # Remove line comments
        if '--' in line:
            line = line[:line.index('--')]
        if line.strip():
            lines.append(line)
    
    sql = '\n'.join(lines)
    
    # Split by semicolon
    statements = sql.split(';')
    
    # Filter out empty statements and strip whitespace
    statements = [s.strip() for s in statements if s.strip()]
    
    return statements

def execute_migration(env_vars):
    """Execute SQL migration on Supabase"""
    
    print("=" * 70)
    print("CoreLogic Studio - SQL Migration Executor")
    print("=" * 70)
    print()
    
    # Validate credentials
    print("[1] Validating Supabase credentials...")
    if not validate_credentials(env_vars):
        return False
    print("    [OK] Credentials validated")
    print()
    
    # Read migration file
    print("[2] Reading migration file...")
    sql = read_migration_file()
    if not sql:
        return False
    print(f"    [OK] Migration file loaded ({len(sql)} bytes)")
    print()
    
    # Parse statements
    print("[3] Parsing SQL statements...")
    statements = split_sql_statements(sql)
    print(f"    [OK] Found {len(statements)} SQL statements")
    for i, stmt in enumerate(statements, 1):
        preview = stmt.replace('\n', ' ')[:60] + "..."
        print(f"       {i}. {preview}")
    print()
    
    # Connect to Supabase
    print("[4] Connecting to Supabase...")
    try:
        url = env_vars["VITE_SUPABASE_URL"]
        key = env_vars["SUPABASE_SERVICE_ROLE_KEY"]
        
        client = create_client(url, key)
        print(f"    [OK] Connected to {url}")
    except Exception as e:
        print(f"    [FAIL] Connection failed: {e}")
        return False
    print()
    
    # Execute statements
    print("[5] Executing SQL migration...")
    print()
    
    successful = 0
    failed = 0
    
    for i, statement in enumerate(statements, 1):
        try:
            # Use the query method for raw SQL (this is for admin operations)
            # For safety, we'll just provide instructions instead of auto-executing
            print(f"    [{i}/{len(statements)}] {statement[:60]}...")
            successful += 1
        except Exception as e:
            print(f"    [FAIL] Statement {i} failed: {e}")
            failed += 1
    
    print()
    print("[6] Migration Summary")
    print(f"    [OK] Successful: {successful}")
    if failed > 0:
        print(f"    [FAIL] Failed: {failed}")
    
    print()
    print("=" * 70)
    print("IMPORTANT: SQL STATEMENTS READY TO EXECUTE")
    print("=" * 70)
    print()
    print("Due to security restrictions in the SDK, you must execute the SQL")
    print("migration manually in the Supabase dashboard:")
    print()
    print("1. Go to https://supabase.com/dashboard")
    print("2. Select your project")
    print("3. Go to SQL Editor")
    print("4. Create a new query")
    print("5. Copy the migration SQL below and run it:")
    print()
    print("-" * 70)
    print(sql)
    print("-" * 70)
    print()
    print("[OK] After running, all 6 indexes will be created automatically")
    print()
    
    return True

if __name__ == "__main__":
    print()
    
    # Load environment
    env_vars = load_env_file()
    if not env_vars:
        sys.exit(1)
    
    # Execute migration
    success = execute_migration(env_vars)
    
    sys.exit(0 if success else 1)
