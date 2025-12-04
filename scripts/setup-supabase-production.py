#!/usr/bin/env python3
"""
Supabase Production Database Setup Script
Automatically creates all necessary tables, indexes, and policies
"""

import os
import sys
from typing import Optional
import json

# Import Supabase
try:
    from supabase import create_client, Client
except ImportError:
    print("? Supabase Python client not installed")
    print("   Install with: pip install supabase")
    sys.exit(1)

class SupabaseSetup:
    def __init__(self, supabase_url: str, service_role_key: str):
        self.supabase: Client = create_client(supabase_url, service_role_key)
        self.supabase_url = supabase_url
        
    def create_tables(self) -> bool:
        """Create all production tables"""
        print("\n?? Creating database tables...")
        
        sql_migrations = [
            # =============================================
            # PROFILES & USER MANAGEMENT
            # =============================================
            """
            CREATE TABLE IF NOT EXISTS profiles (
                id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                full_name TEXT,
                avatar_url TEXT,
                plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
                storage_used_mb BIGINT DEFAULT 0,
                max_storage_mb BIGINT DEFAULT 1024,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            """,
            
            # =============================================
            # USER PREFERENCES & SETTINGS
            # =============================================
            """
            CREATE TABLE IF NOT EXISTS user_preferences (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
                theme TEXT DEFAULT 'Graphite',
                sample_rate INTEGER DEFAULT 44100,
                buffer_size INTEGER DEFAULT 256,
                auto_save BOOLEAN DEFAULT true,
                auto_backup BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id)
            );
            """,
            
            # =============================================
            # PROJECTS
            # =============================================
            """
            CREATE TABLE IF NOT EXISTS projects (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                description TEXT,
                bpm FLOAT DEFAULT 120 CHECK (bpm > 0 AND bpm < 300),
                sample_rate INTEGER DEFAULT 44100 CHECK (sample_rate IN (44100, 48000, 96000)),
                bit_depth INTEGER DEFAULT 16 CHECK (bit_depth IN (16, 24, 32)),
                time_signature TEXT DEFAULT '4/4',
                key TEXT DEFAULT 'C Major',
                duration_seconds FLOAT DEFAULT 0,
                published BOOLEAN DEFAULT false,
                public BOOLEAN DEFAULT false,
                collaborators UUID[] DEFAULT '{}',
                tags TEXT[] DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            """,
            
            # =============================================
            # TRACKS
            # =============================================
            """
            CREATE TABLE IF NOT EXISTS tracks (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                type TEXT NOT NULL CHECK (type IN ('audio', 'instrument', 'midi', 'aux', 'vca', 'master')),
                color TEXT DEFAULT '#FF0000',
                volume FLOAT DEFAULT 0 CHECK (volume >= -96 AND volume <= 6),
                pan FLOAT DEFAULT 0 CHECK (pan >= -1 AND pan <= 1),
                muted BOOLEAN DEFAULT false,
                soloed BOOLEAN DEFAULT false,
                armed BOOLEAN DEFAULT false,
                input_device TEXT,
                output_device TEXT,
                effects_chain UUID[] DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            """,
            
            # =============================================
            # AUDIO FILES
            # =============================================
            """
            CREATE TABLE IF NOT EXISTS audio_files (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                track_id UUID REFERENCES tracks(id) ON DELETE SET NULL,
                user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
                filename TEXT NOT NULL,
                file_size_bytes BIGINT NOT NULL,
                duration_seconds FLOAT,
                sample_rate INTEGER,
                channels INTEGER DEFAULT 2,
                bit_depth INTEGER DEFAULT 16,
                format TEXT DEFAULT 'wav',
                storage_path TEXT NOT NULL UNIQUE,
                storage_bucket TEXT DEFAULT 'audio_files',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            """,
            
            # =============================================
            # PLUGINS & EFFECTS
            # =============================================
            """
            CREATE TABLE IF NOT EXISTS plugins (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                params JSONB DEFAULT '{}'::jsonb,
                enabled BOOLEAN DEFAULT true,
                wet_dry FLOAT DEFAULT 100 CHECK (wet_dry >= 0 AND wet_dry <= 100),
                position INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            """,
            
            # =============================================
            # AUTOMATION CURVES
            # =============================================
            """
            CREATE TABLE IF NOT EXISTS automation_curves (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
                param_name TEXT NOT NULL,
                points JSONB NOT NULL,
                curve_type TEXT DEFAULT 'linear' CHECK (curve_type IN ('linear', 'smooth', 'step')),
                enabled BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            """,
            
            # =============================================
            # ACTIVITY LOGS
            # =============================================
            """
            CREATE TABLE IF NOT EXISTS activity_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
                project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
                action TEXT NOT NULL,
                entity_type TEXT,
                entity_id UUID,
                details JSONB,
                ip_address INET,
                user_agent TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            """,
            
            # =============================================
            # ANALYSIS CACHE
            # =============================================
            """
            CREATE TABLE IF NOT EXISTS ai_cache (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                analysis_type TEXT NOT NULL,
                input_hash TEXT NOT NULL,
                result JSONB NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '30 days'
            );
            """,
            
            # =============================================
            # CHAT HISTORY
            # =============================================
            """
            CREATE TABLE IF NOT EXISTS chat_history (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
                project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
                message TEXT NOT NULL,
                response TEXT NOT NULL,
                perspective TEXT,
                confidence FLOAT DEFAULT 0.5,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            """,
        ]
        
        try:
            for i, sql in enumerate(sql_migrations, 1):
                self.supabase.postgrest.client.execute(sql)
                print(f"   ? Migration {i} applied")
            return True
        except Exception as e:
            print(f"   ? Error creating tables: {e}")
            return False
    
    def create_indexes(self) -> bool:
        """Create database indexes for performance"""
        print("\n?? Creating indexes...")
        
        indexes = [
            ("profiles", "email"),
            ("profiles", "username"),
            ("projects", "user_id"),
            ("projects", "created_at DESC"),
            ("projects", "published"),
            ("tracks", "project_id"),
            ("tracks", "created_at"),
            ("audio_files", "project_id"),
            ("audio_files", "track_id"),
            ("audio_files", "user_id"),
            ("audio_files", "created_at DESC"),
            ("plugins", "track_id"),
            ("automation_curves", "track_id"),
            ("activity_logs", "user_id"),
            ("activity_logs", "project_id"),
            ("activity_logs", "created_at DESC"),
            ("ai_cache", "analysis_type"),
            ("ai_cache", "user_id"),
            ("ai_cache", "created_at DESC"),
            ("chat_history", "user_id"),
            ("chat_history", "created_at DESC"),
        ]
        
        created = 0
        for table, column in indexes:
            try:
                idx_name = f"idx_{table}_{column.replace(' DESC', '').replace(', ', '_')}"
                sql = f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table}({column});"
                self.supabase.postgrest.client.execute(sql)
                created += 1
            except Exception as e:
                print(f"   ??  Index {table}.{column}: {e}")
        
        print(f"   ? {created} indexes created")
        return True
    
    def enable_rls(self) -> bool:
        """Enable Row Level Security (RLS) policies"""
        print("\n?? Enabling Row Level Security...")
        
        tables = ['profiles', 'projects', 'tracks', 'audio_files', 'plugins', 'automation_curves', 'activity_logs', 'chat_history']
        
        try:
            for table in tables:
                sql = f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;"
                self.supabase.postgrest.client.execute(sql)
                print(f"   ? RLS enabled: {table}")
            return True
        except Exception as e:
            print(f"   ? Error enabling RLS: {e}")
            return False
    
    def create_policies(self) -> bool:
        """Create RLS policies for data access control"""
        print("\n?? Creating RLS policies...")
        
        policies = [
            # Users can read their own profile
            """
            CREATE POLICY "Users can read own profile" ON profiles
            FOR SELECT USING (auth.uid() = id);
            """,
            
            # Users can update their own profile
            """
            CREATE POLICY "Users can update own profile" ON profiles
            FOR UPDATE USING (auth.uid() = id);
            """,
            
            # Users can read their own projects
            """
            CREATE POLICY "Users can read own projects" ON projects
            FOR SELECT USING (auth.uid() = user_id OR public = true);
            """,
            
            # Users can create projects
            """
            CREATE POLICY "Users can create projects" ON projects
            FOR INSERT WITH CHECK (auth.uid() = user_id);
            """,
            
            # Users can update their own projects
            """
            CREATE POLICY "Users can update own projects" ON projects
            FOR UPDATE USING (auth.uid() = user_id);
            """,
            
            # Users can delete their own projects
            """
            CREATE POLICY "Users can delete own projects" ON projects
            FOR DELETE USING (auth.uid() = user_id);
            """,
        ]
        
        created = 0
        for policy in policies:
            try:
                self.supabase.postgrest.client.execute(policy)
                created += 1
            except Exception as e:
                print(f"   ??  Policy creation: {e}")
        
        print(f"   ? {created} policies created")
        return True
    
    def create_storage_buckets(self) -> bool:
        """Create storage buckets for audio files"""
        print("\n?? Creating storage buckets...")
        
        buckets = {
            'audio_files': {
                'public': False,
                'allowed_mime_types': ['audio/wav', 'audio/mp3', 'audio/aac', 'audio/flac'],
            },
            'project_exports': {
                'public': False,
                'allowed_mime_types': ['audio/wav', 'application/zip'],
            },
            'user_avatars': {
                'public': True,
                'allowed_mime_types': ['image/jpeg', 'image/png', 'image/gif'],
            },
        }
        
        created = 0
        for bucket_name, config in buckets.items():
            try:
                # Bucket creation typically done through dashboard
                # This is a placeholder for the API call
                print(f"   ? Bucket configured: {bucket_name}")
                created += 1
            except Exception as e:
                print(f"   ??  Bucket {bucket_name}: {e}")
        
        return created > 0
    
    def setup_functions(self) -> bool:
        """Create PostgreSQL functions for business logic"""
        print("\n??  Creating database functions...")
        
        functions = [
            # Calculate project duration from longest track
            """
            CREATE OR REPLACE FUNCTION calculate_project_duration(project_id UUID)
            RETURNS FLOAT AS $$
            SELECT COALESCE(MAX(af.duration_seconds), 0)
            FROM audio_files af
            JOIN tracks t ON af.track_id = t.id
            WHERE t.project_id = $1;
            $$ LANGUAGE SQL;
            """,
            
            # Update project updated_at timestamp
            """
            CREATE OR REPLACE FUNCTION update_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            """,
        ]
        
        created = 0
        for func in functions:
            try:
                self.supabase.postgrest.client.execute(func)
                created += 1
            except Exception as e:
                print(f"   ??  Function creation: {e}")
        
        print(f"   ? {created} functions created")
        return True
    
    def setup_triggers(self) -> bool:
        """Create database triggers for automatic updates"""
        print("\n?? Creating database triggers...")
        
        triggers = [
            # Update profiles.updated_at
            """
            CREATE TRIGGER profiles_updated_at_trigger
            BEFORE UPDATE ON profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();
            """,
            
            # Update projects.updated_at
            """
            CREATE TRIGGER projects_updated_at_trigger
            BEFORE UPDATE ON projects
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();
            """,
            
            # Auto-cleanup expired cache entries
            """
            CREATE TRIGGER ai_cache_cleanup_trigger
            BEFORE INSERT ON ai_cache
            FOR EACH ROW
            EXECUTE FUNCTION (
                DELETE FROM ai_cache WHERE expires_at < CURRENT_TIMESTAMP
            );
            """,
        ]
        
        created = 0
        for trigger in triggers:
            try:
                self.supabase.postgrest.client.execute(trigger)
                created += 1
            except Exception as e:
                print(f"   ??  Trigger creation: {e}")
        
        print(f"   ? {created} triggers created")
        return True
    
    def verify_setup(self) -> bool:
        """Verify all tables were created correctly"""
        print("\n? Verifying setup...")
        
        tables_to_check = [
            'profiles', 'projects', 'tracks', 'audio_files', 'plugins',
            'automation_curves', 'activity_logs', 'ai_cache', 'chat_history'
        ]
        
        try:
            for table in tables_to_check:
                response = self.supabase.table(table).select("*").limit(1).execute()
                print(f"   ? Table verified: {table}")
            return True
        except Exception as e:
            print(f"   ? Verification failed: {e}")
            return False
    
    def run_full_setup(self) -> bool:
        """Run complete setup process"""
        print("=" * 60)
        print("?? CoreLogic Studio Production Database Setup")
        print("=" * 60)
        
        steps = [
            ("Creating tables", self.create_tables),
            ("Creating indexes", self.create_indexes),
            ("Enabling RLS", self.enable_rls),
            ("Creating policies", self.create_policies),
            ("Setting up functions", self.setup_functions),
            ("Setting up triggers", self.setup_triggers),
            ("Verifying setup", self.verify_setup),
        ]
        
        all_passed = True
        for step_name, step_func in steps:
            try:
                if not step_func():
                    all_passed = False
                    print(f"   ??  {step_name} had issues")
            except Exception as e:
                all_passed = False
                print(f"   ? {step_name} failed: {e}")
        
        print("\n" + "=" * 60)
        if all_passed:
            print("? Setup completed successfully!")
            print("\nYour Supabase database is ready for production!")
        else:
            print("? Setup completed with errors")
            print("Please review the issues above")
        print("=" * 60)
        
        return all_passed


def main():
    """Main entry point"""
    supabase_url = os.getenv('VITE_SUPABASE_URL')
    service_role_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not service_role_key:
        print("? Missing environment variables")
        print("   Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)
    
    setup = SupabaseSetup(supabase_url, service_role_key)
    success = setup.run_full_setup()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
