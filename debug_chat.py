#!/usr/bin/env python
"""Debug chat endpoint issues"""

import sys
sys.path.insert(0, '.')

# Import the chat endpoint function directly
from codette_server_unified import ChatRequest, chat_endpoint
import asyncio
from unittest.mock import AsyncMock

# Create a test request
test_request = ChatRequest(
    message="How should I set up reverb for vocals?"
)

# Run the endpoint
async def test():
    try:
        result = await chat_endpoint(test_request)
        print("Result:", result)
        print("Source:", result.source)
        print("Confidence:", result.confidence)
        print("Response:", result.response[:200])
    except Exception as e:
        import traceback
        print("ERROR:", str(e))
        print("\nTraceback:")
        traceback.print_exc()

# Run
asyncio.run(test())
