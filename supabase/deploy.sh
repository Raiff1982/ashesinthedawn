#!/bin/bash
# Deploy Codette AI Chat Edge Function to Supabase

set -e

echo "?? Deploying Codette AI Chat Edge Function..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "? Supabase CLI not found. Install with: npm install -g supabase"
    exit 1
fi

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "? Not logged in to Supabase. Run: supabase login"
    exit 1
fi

# Deploy function
echo "?? Deploying codette-chat function..."
supabase functions deploy codette-chat

echo ""
echo "? Deployment complete!"
echo ""
echo "?? Next steps:"
echo "1. Set environment variables:"
echo "   supabase secrets set CODETTE_API_URL=http://your-codette-server:8000"
echo ""
echo "2. Test the function:"
echo "   curl https://[project-ref].supabase.co/functions/v1/codette-chat/health"
echo ""
echo "3. Test WebSocket:"
echo "   wscat -c wss://[project-ref].supabase.co/functions/v1/codette-chat/ws"
echo ""
echo "4. View logs:"
echo "   supabase functions logs codette-chat"
echo ""
