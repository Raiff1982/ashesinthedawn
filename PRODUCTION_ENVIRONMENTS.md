# CoreLogic Studio Production Environment Configuration

## Overview
This template shows how to configure CoreLogic Studio for production deployment across different environments.

---

## Environment: Production

### File: `.env.production`

```bash
# ===================================================================
# PRODUCTION ENVIRONMENT - CoreLogic Studio v7.0
# ===================================================================
# Generated: 2025-11-24
# For deployment to: yourdomain.com
# Database: Supabase PostgreSQL
# Hosting: Vercel (Frontend) + Railway/AWS (Backend)

# ===================================================================
# SUPABASE / AUTHENTICATION (Production)
# ===================================================================
# These credentials enable real data persistence and user authentication
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ===================================================================
# API ENDPOINTS (Production)
# ===================================================================
VITE_API_URL=https://api.yourdomain.com
VITE_CODETTE_API=https://api.yourdomain.com/codette

# ===================================================================
# SECURITY (Production)
# ===================================================================
# Force HTTPS
VITE_FORCE_HTTPS=true

# CORS Origins - Only allow your production domain
VITE_CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting (100 requests per 60 seconds per IP)
VITE_RATE_LIMIT=100
VITE_RATE_LIMIT_WINDOW=60

# JWT Secret for token signing (generate with: openssl rand -base64 32)
JWT_SECRET=your_very_secure_jwt_secret_here

# ===================================================================
# DATABASE (Production)
# ===================================================================
# PostgreSQL connection string (from Supabase)
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres

# Database pooling
DATABASE_POOL_SIZE=20
DATABASE_POOL_TIMEOUT=30

# ===================================================================
# CACHE (Production)
# ===================================================================
# Redis for caching (if using external cache)
REDIS_URL=redis://your-redis-instance:6379
CACHE_TTL=3600
CACHE_STRATEGY=redis  # or memory

# ===================================================================
# STORAGE (Production)
# ===================================================================
# S3-compatible storage for audio files
S3_BUCKET=corelogic-audio-prod
S3_REGION=us-east-1
S3_ACCESS_KEY=your_s3_access_key
S3_SECRET_KEY=your_s3_secret_key
S3_ENDPOINT=https://s3.amazonaws.com

# Max file upload size (in MB)
MAX_UPLOAD_SIZE=500

# ===================================================================
# LOGGING & MONITORING
# ===================================================================
# Sentry for error tracking
SENTRY_DSN=https://your-sentry-key@sentry.io/your-project-id
SENTRY_ENVIRONMENT=production
SENTRY_SAMPLE_RATE=0.1

# DataDog for infrastructure monitoring
DATADOG_API_KEY=your_datadog_api_key
DATADOG_SITE=datadoghq.com

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
ENABLE_PERFORMANCE_MONITORING=true

# ===================================================================
# EMAIL (Production)
# ===================================================================
# SendGrid for email notifications
SENDGRID_API_KEY=SG.xxx...
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# ===================================================================
# AUDIO ENGINE (Production)
# ===================================================================
VITE_DEFAULT_SAMPLE_RATE=44100
VITE_DEFAULT_BUFFER_SIZE=256
VITE_MAX_TRACKS=256
VITE_MAX_CHANNELS=64

# ===================================================================
# SYSTEM CONFIGURATION (Production)
# ===================================================================
VITE_APP_NAME=CoreLogic Studio
VITE_APP_VERSION=7.0.0
VITE_APP_BUILD=1
VITE_APP_ENV=production

# UI
VITE_DEFAULT_THEME=Graphite
VITE_FPS_LIMIT=60

# Performance
VITE_ENABLE_SERVICE_WORKER=true
VITE_ENABLE_COMPRESSION=true

# ===================================================================
# FEATURES (Production - All Enabled)
# ===================================================================
VITE_FEATURE_REAL_TIME_COLLAB=true
VITE_FEATURE_CLOUD_SYNC=true
VITE_FEATURE_AI_ANALYSIS=true
VITE_FEATURE_EXPORT_MULTIFORMAT=true
VITE_FEATURE_PLUGIN_HOSTING=true

# ===================================================================
# DEBUG (Production - DISABLED)
# ===================================================================
# These should ALL be false in production
VITE_LOG_LEVEL=warn
VITE_SHOW_PERF_MONITOR=false
VITE_SHOW_LAYOUT_GUIDES=false
VITE_SHOW_DEV_TOOLS=false
VITE_REDUX_DEVTOOLS=false
VITE_MOCK_AUDIO=false
VITE_MOCK_API=false
VITE_MOCK_DATABASE=false
VITE_DEBUG_MODE=false

# ===================================================================
# DEPLOYMENT INFO
# ===================================================================
# Frontend Hosting
FRONTEND_PLATFORM=vercel  # vercel, netlify, aws, gcp
FRONTEND_REGION=us-east-1

# Backend Hosting
BACKEND_PLATFORM=railway  # railway, aws, render, heroku
BACKEND_REGION=us-east-1

# Database
DATABASE_PLATFORM=supabase  # supabase (managed PostgreSQL)
DATABASE_REGION=us-east-1

# ===================================================================
# MAINTENANCE (Production)
# ===================================================================
# Maintenance mode flag
MAINTENANCE_MODE=false
MAINTENANCE_MESSAGE=

# Scheduled maintenance windows (UTC)
MAINTENANCE_WINDOW_START=
MAINTENANCE_WINDOW_END=

# ===================================================================
# COMPLIANCE (Production)
# ===================================================================
# Enable GDPR features
GDPR_ENABLED=true
GDPR_COOKIE_CONSENT_REQUIRED=true

# Enable HIPAA compliance (if applicable)
HIPAA_ENABLED=false

# Data retention policy (days)
DATA_RETENTION_DAYS=365
LOG_RETENTION_DAYS=90
```

---

## Environment: Staging

### File: `.env.staging`

```bash
# ===================================================================
# STAGING ENVIRONMENT - CoreLogic Studio v7.0
# ===================================================================
# For testing before production release

VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=staging_anon_key...
SUPABASE_SERVICE_ROLE_KEY=staging_service_key...

VITE_API_URL=https://api-staging.yourdomain.com
VITE_CODETTE_API=https://api-staging.yourdomain.com/codette

# Security (less strict for testing)
VITE_FORCE_HTTPS=true
VITE_CORS_ORIGINS=https://staging.yourdomain.com,http://localhost:5173

# Database
DATABASE_URL=postgresql://postgres:password@db-staging.supabase.co:5432/postgres

# Monitoring (trace everything)
LOG_LEVEL=debug
SENTRY_SAMPLE_RATE=1.0
ENABLE_PERFORMANCE_MONITORING=true

# Debug (enabled for troubleshooting)
VITE_LOG_LEVEL=debug
VITE_SHOW_PERF_MONITOR=true
VITE_SHOW_LAYOUT_GUIDES=false
VITE_REDUX_DEVTOOLS=true
VITE_MOCK_AUDIO=false

# Features (all enabled for testing)
VITE_FEATURE_REAL_TIME_COLLAB=true
VITE_FEATURE_CLOUD_SYNC=true
VITE_FEATURE_AI_ANALYSIS=true
```

---

## Environment: Development (Local)

### File: `.env.development` or `.env.local`

```bash
# ===================================================================
# DEVELOPMENT ENVIRONMENT - Local
# ===================================================================
# Use these for local development

VITE_SUPABASE_URL=http://127.0.0.1:54321  # Supabase local emulator
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MjAwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.PLACEHOLDER
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYyMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.PLACEHOLDER

VITE_API_URL=http://localhost:8000
VITE_CODETTE_API=http://localhost:8000/codette

# Security (relaxed for local development)
VITE_FORCE_HTTPS=false
VITE_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000

# Database (local)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/corelogic_dev

# Logging (verbose)
LOG_LEVEL=debug
SENTRY_DSN=  # Disabled locally

# Debug (all enabled)
VITE_LOG_LEVEL=debug
VITE_SHOW_PERF_MONITOR=true
VITE_SHOW_LAYOUT_GUIDES=true
VITE_REDUX_DEVTOOLS=true
VITE_MOCK_AUDIO=false
VITE_DEBUG_MODE=true

# Features (all enabled for development)
VITE_FEATURE_REAL_TIME_COLLAB=true
VITE_FEATURE_CLOUD_SYNC=true
VITE_FEATURE_AI_ANALYSIS=true

# Mock data (for testing without full setup)
VITE_MOCK_API=false
VITE_MOCK_DATABASE=false
```

---

## Switching Environments

### Using npm scripts

Update `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:supabase": "supabase start && vite",
    "build": "vite build",
    "build:staging": "cross-env NODE_ENV=staging vite build",
    "build:prod": "cross-env NODE_ENV=production vite build",
    "preview": "vite preview",
    "deploy:staging": "npm run build:staging && vercel --prod --scope=your-org",
    "deploy:prod": "npm run build:prod && vercel --prod --scope=your-org"
  }
}
```

### Using Vite environment detection

In your code:

```typescript
const env = import.meta.env.MODE;

if (env === 'production') {
  // Production-only code
} else if (env === 'staging') {
  // Staging-only code
} else {
  // Development code
}
```

---

## Validation

### Script: `scripts/validate-config.ts`

```typescript
import { z } from 'zod';

const productionSchema = z.object({
  VITE_SUPABASE_URL: z.string().url().startsWith('https://'),
  VITE_SUPABASE_ANON_KEY: z.string().min(50),
  VITE_API_URL: z.string().url().startsWith('https://'),
  VITE_FORCE_HTTPS: z.literal('true'),
  LOG_LEVEL: z.enum(['warn', 'error']),
  VITE_DEBUG_MODE: z.literal('false'),
  VITE_MOCK_DATABASE: z.literal('false'),
});

const stagingSchema = productionSchema.partial().merge(z.object({
  LOG_LEVEL: z.enum(['debug', 'info', 'warn']),
}));

const developmentSchema = z.object({}).passthrough();

export function validateEnv(env: Record<string, string>, mode: 'production' | 'staging' | 'development') {
  const schema = mode === 'production' ? productionSchema : mode === 'staging' ? stagingSchema : developmentSchema;
  
  try {
    schema.parse(env);
    console.log(`? ${mode} environment configuration valid`);
  } catch (error) {
    console.error(`? ${mode} environment configuration invalid:`);
    console.error(error);
    process.exit(1);
  }
}

// Run validation
const mode = (process.env.NODE_ENV as any) || 'development';
const env = process.env;
validateEnv(env, mode);
```

---

## Security Notes

### ?? Protecting Secrets

1. **Never commit `.env` files to git**
   ```bash
   # Add to .gitignore
   .env
   .env.local
   .env.*.local
   .env.production
   ```

2. **Use managed secrets in CI/CD**
   - Vercel: Settings ? Environment Variables
   - Railway: Project ? Variables
   - GitHub: Settings ? Secrets
   - GitLab: CI/CD ? Variables

3. **Rotate secrets periodically**
   - JWT secrets: Every 90 days
   - Database passwords: Every 90 days
   - API keys: Every 180 days

4. **Audit secret access**
   - Enable Supabase audit logs
   - Review who has access
   - Revoke unused credentials

### ??? Environment-Specific Security

| Setting | Development | Staging | Production |
|---------|-------------|---------|------------|
| HTTPS | Optional | Required | Required |
| Debug Mode | Enabled | Disabled | Disabled |
| Mock Data | Allowed | No | No |
| CORS | Permissive | Restricted | Restricted |
| Rate Limiting | Disabled | Enabled | Enabled |
| Logging | Verbose | Normal | Minimal |

---

## Deployment Checklist

Before deploying to each environment:

### Pre-Deployment
- [ ] All environment variables set in platform
- [ ] Secrets encrypted and secured
- [ ] Database migrations tested
- [ ] Backups configured
- [ ] Monitoring configured

### Post-Deployment
- [ ] Health checks passing
- [ ] Error tracking working
- [ ] Performance metrics normal
- [ ] Database connectivity verified
- [ ] External APIs responsive

---

## Quick Reference

```bash
# Development
npm run dev

# Build for staging
npm run build:staging

# Build for production
npm run build:prod

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod

# Validate configuration
npm run validate:config
```

---

**Questions about configuration?** See PRODUCTION_DEPLOYMENT_GUIDE.md for detailed phase-by-phase instructions.
