"""
Quick diagnostic for Codette response issues
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_chat_response():
    """Test if chat endpoint returns formatted responses"""
    print("?? Testing Chat Response Format...")
    print("="*60)
    
    try:
        response = requests.post(
            f"{BASE_URL}/codette/chat",
            json={"message": "How do I EQ vocals?", "perspective": "mix_engineering"},
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"? HTTP {response.status_code}")
            print(f"Response: {response.text[:200]}")
            return False
        
        data = response.json()
        
        print("\n?? Response Keys:")
        for key in data.keys():
            print(f"  ? {key}")
        
        print("\n?? Response Content:")
        response_text = data.get('response', '')
        print(f"Length: {len(response_text)} characters")
        print(f"First 200 chars:\n{response_text[:200]}")
        
        # Check for formatters
        has_icons = any(icon in response_text for icon in ['??', '??', '??', '??', '??'])
        has_context_banner = '???' in response_text
        has_formatting = '**' in response_text
        
        print("\n? Format Checks:")
        print(f"  {'?' if has_icons else '?'} Has perspective icons")
        print(f"  {'?' if has_context_banner else '?'} Has context banner")
        print(f"  {'?' if has_formatting else '?'} Has markdown formatting")
        
        # Check for mixing intent
        if 'mixing_intent' in data:
            intent = data['mixing_intent']
            print(f"\n?? Intent Detection:")
            print(f"  Category: {intent.get('category')}")
            print(f"  Confidence: {intent.get('confidence', 0):.1%}")
        
        return True
        
    except Exception as e:
        print(f"? Error: {e}")
        return False

def test_fallback_response():
    """Test fallback response behavior"""
    print("\n\n?? Testing Fallback Responses...")
    print("="*60)
    
    try:
        response = requests.post(
            f"{BASE_URL}/codette/chat",
            json={"message": "test error case", "perspective": "mix_engineering"},
            timeout=10
        )
        
        data = response.json()
        
        if 'fallback' in data and data['fallback']:
            print("? Fallback mode activated")
            print(f"Response: {data.get('response', '')[:100]}")
        else:
            print("? Normal response (no fallback)")
        
        return True
        
    except Exception as e:
        print(f"? Error: {e}")
        return False

def main():
    print("\n" + "?"*60)
    print("   CODETTE RESPONSE DIAGNOSTIC")
    print("?"*60 + "\n")
    
    # Check server health
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("? Server is running\n")
        else:
            print("? Server returned HTTP", response.status_code)
            return
    except Exception as e:
        print(f"? Server not available: {e}")
        print("   Start server: python codette_server_unified.py")
        return
    
    # Run tests
    test1 = test_chat_response()
    test2 = test_fallback_response()
    
    # Summary
    print("\n" + "="*60)
    print("?? DIAGNOSTIC SUMMARY")
    print("="*60)
    print(f"Chat Response Test: {'? PASS' if test1 else '? FAIL'}")
    print(f"Fallback Test: {'? PASS' if test2 else '? FAIL'}")
    
    if test1 and test2:
        print("\n? All tests passed!")
        print("\nIf you're still seeing fallback responses in UI:")
        print("  1. Check browser console for errors")
        print("  2. Clear browser cache and reload")
        print("  3. Verify codetteBridge.ts is calling correct endpoint")
        print("  4. Check if ML features are enabled in server logs")
    else:
        print("\n??  Some tests failed - review output above")

if __name__ == "__main__":
    main()
