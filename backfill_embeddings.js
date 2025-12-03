#!/usr/bin/env node
/**
 * Backfill Embeddings Script
 * 
 * Reads rows from public.music_knowledge where embedding IS NULL in batches
 * and calls the Edge Function to generate embeddings.
 * 
 * Uses project environment variables from .env (Vite format):
 *   - VITE_SUPABASE_URL: Your Supabase project URL
 *   - VITE_SUPABASE_ANON_KEY: Anon key for API access
 *   - SUPABASE_SERVICE_ROLE_KEY (optional): For full database access
 * 
 * Or direct environment variables:
 *   - SUPABASE_URL: Explicit Supabase URL
 *   - SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY: Auth keys
 *   - BATCH_SIZE (optional): Number of rows per batch (default 50)
 * 
 * Usage:
 *   # Load from .env and run
 *   node backfill_embeddings.js
 *   
 *   # Or with explicit environment
 *   export VITE_SUPABASE_URL=https://your-project.supabase.co
 *   export VITE_SUPABASE_ANON_KEY=your-anon-key
 *   node backfill_embeddings.js
 */

import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';

// ============================================================================
// Load .env File (Parse Vite Format)
// ============================================================================

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  const envLocalPath = path.join(process.cwd(), '.env.local');
  
  const files = [envLocalPath, envPath].filter(f => fs.existsSync(f));
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const match = trimmed.match(/^([^=]+)=(.*)$/);
          if (match) {
            const [, key, value] = match;
            // Only set if not already set via environment
            if (!process.env[key]) {
              process.env[key] = value.replace(/^['"]|['"]$/g, '');
            }
          }
        }
      });
    } catch (err) {
      // Silently skip if file doesn't exist
    }
  }
}

loadEnvFile();

// ============================================================================
// Configuration (Vite-Compatible with Fallbacks)
// ============================================================================

// Try Vite format first, then direct env vars
const SUPABASE_URL = 
  process.env.VITE_SUPABASE_URL || 
  process.env.SUPABASE_URL;

if (!SUPABASE_URL) {
  console.error('❌ Error: Missing Supabase configuration');
  console.error('   Set VITE_SUPABASE_URL in .env or .env.local');
  console.error('   Or: export VITE_SUPABASE_URL=https://your-project.supabase.co');
  process.exit(1);
}

const ANON_KEY = 
  process.env.VITE_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_ANON_KEY;

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AUTH_KEY = SERVICE_ROLE_KEY || ANON_KEY;

if (!AUTH_KEY) {
  console.error('❌ Error: Missing authentication key');
  console.error('   Set VITE_SUPABASE_ANON_KEY in .env or .env.local');
  console.error('   Or: export VITE_SUPABASE_ANON_KEY=your-anon-key');
  process.exit(1);
}

// Support both Supabase Edge Function and local backend API
const CODETTE_API = 
  process.env.VITE_CODETTE_API ||
  process.env.CODETTE_API ||
  'http://localhost:8000';

const EDGE_FN_URL = `${SUPABASE_URL}/functions/v1/upsert-embeddings`;
const LOCAL_API_URL = `${CODETTE_API}/api/upsert-embeddings`;
const BATCH_SIZE = Number(process.env.BATCH_SIZE) || 50;
const MAX_RETRIES = 1;

// Auto-detect which endpoint to use
const USE_LOCAL_API = process.env.USE_LOCAL_API !== 'false'; // Default to local API

console.log('📋 Configuration (from .env + environment):');
console.log(`   Supabase URL: ${SUPABASE_URL}`);
console.log(`   Backend API: ${CODETTE_API}`);
if (USE_LOCAL_API) {
  console.log(`   Embedding Endpoint: ${LOCAL_API_URL} (local)`);
} else {
  console.log(`   Embedding Endpoint: ${EDGE_FN_URL} (Supabase Edge Function)`);
}
console.log(`   Batch Size: ${BATCH_SIZE}`);
console.log(`   Max Retries: ${MAX_RETRIES}`);
console.log(`   Auth Key: ${SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON'}`);
console.log('');

// ============================================================================
// Fetch Functions
// ============================================================================

/**
 * Fetch a batch of music_knowledge rows where embedding IS NULL
 */
async function fetchBatch(offset = 0, limit = BATCH_SIZE) {
  const url = `${SUPABASE_URL}/rest/v1/music_knowledge?select=id,topic,category,suggestion,embedding&embedding=is.null&limit=${limit}&offset=${offset}`;
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': AUTH_KEY,
        'Authorization': `Bearer ${AUTH_KEY}`,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    return await res.json();
  } catch (err) {
    throw new Error(`Failed to fetch batch at offset ${offset}: ${err.message}`);
  }
}

/**
 * Transform database rows to embedding rows
 */
function toEmbedRows(rows) {
  return rows.map(r => ({
    id: r.id,
    text: `${r.topic ?? ''} ${r.category ?? ''} ${r.suggestion ?? ''}`.trim(),
  }));
}

/**
 * Call the embedding generation endpoint (local API or Edge Function)
 */
async function callEdgeFunction(rows) {
  const body = { rows };
  
  const headers = {
    'Content-Type': 'application/json',
    // If function requires a secret header
    ...(process.env.FUNCTION_SECRET && { 'x-functions-secret': process.env.FUNCTION_SECRET }),
  };

  const url = USE_LOCAL_API ? LOCAL_API_URL : EDGE_FN_URL;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const txt = await res.text();

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${txt}`);
    }

    try {
      return JSON.parse(txt);
    } catch {
      return { raw: txt };
    }
  } catch (err) {
    throw new Error(`Embedding endpoint call failed: ${err.message}`);
  }
}

// ============================================================================
// Main Backfill Logic
// ============================================================================

async function main() {
  console.log('🚀 Starting embedding backfill...\n');

  let offset = 0;
  let totalProcessed = 0;
  let totalSucceeded = 0;
  let totalFailed = 0;
  const failedBatches = [];
  const failedIds = [];
  let batchNum = 0;

  try {
    while (true) {
      batchNum++;
      console.log(`📦 Batch ${batchNum}: Fetching from offset ${offset}...`);

      let rows;
      try {
        rows = await fetchBatch(offset, BATCH_SIZE);
      } catch (err) {
        console.error(`❌ Failed to fetch batch: ${err.message}`);
        break;
      }

      if (!rows || rows.length === 0) {
        console.log('✅ No more rows to process.\n');
        break;
      }

      console.log(`   Found ${rows.length} rows without embeddings`);

      const payloadRows = toEmbedRows(rows);
      let attempt = 0;
      let success = false;

      while (attempt <= MAX_RETRIES && !success) {
        attempt++;
        try {
          const endpoint = USE_LOCAL_API ? 'local API' : 'Edge Function';
          console.log(`   🔄 Calling ${endpoint} (attempt ${attempt}/${MAX_RETRIES + 1})...`);
          const resp = await callEdgeFunction(payloadRows);

          console.log(`   ✅ Embedding endpoint succeeded`);
          console.log(`      Response:`, JSON.stringify(resp, null, 2));

          success = true;
          totalSucceeded += rows.length;
        } catch (err) {
          console.error(`   ❌ Embedding endpoint error: ${err.message}`);
          attempt++;

          if (attempt > MAX_RETRIES) {
            console.error(`   ❌ Max retries exceeded for batch ${batchNum}`);
            totalFailed += rows.length;
            failedBatches.push({ batchNum, offset, rowCount: rows.length });
            rows.forEach(r => failedIds.push(r.id));
          } else {
            console.log(`   🔄 Retrying batch ${batchNum}...\n`);
          }
        }
      }

      totalProcessed += rows.length;
      offset += rows.length;
      console.log('');
    }
  } catch (err) {
    console.error(`\n❌ Fatal error: ${err.message}`);
    process.exit(1);
  }

  // =========================================================================
  // Summary
  // =========================================================================

  console.log('═'.repeat(60));
  console.log('📊 Backfill Summary');
  console.log('═'.repeat(60));
  console.log(`Total Batches Processed: ${batchNum - 1}`);
  console.log(`Total Rows Processed:    ${totalProcessed}`);
  console.log(`Total Rows Succeeded:    ${totalSucceeded}`);
  console.log(`Total Rows Failed:       ${totalFailed}`);

  if (failedIds.length > 0) {
    console.log('\n⚠️  Failed Row IDs:');
    failedIds.forEach(id => console.log(`   - ${id}`));

    console.log('\n⚠️  Failed Batches:');
    failedBatches.forEach(batch => {
      console.log(`   - Batch ${batch.batchNum} (offset ${batch.offset}, ${batch.rowCount} rows)`);
    });

    console.log('\n💡 Tip: Retry these batches after checking Edge Function logs');
  } else if (totalSucceeded > 0) {
    console.log('\n✅ All rows processed successfully!');
  }

  console.log('═'.repeat(60));

  process.exit(failedIds.length > 0 ? 1 : 0);
}

main();
