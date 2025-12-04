@echo off
REM ============================================================================
REM Codette AI Enhanced - Quick Start Script
REM Restarts server and runs tests automatically
REM ============================================================================

echo.
echo ================================================================================
echo                      CODETTE AI 2.0 - ENHANCED INTELLIGENCE
echo ================================================================================
echo.

echo [Step 1/5] Stopping existing Python processes...
taskkill /F /IM python.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   ? Python processes stopped
) else (
    echo   i No Python processes running
)
timeout /t 2 /nobreak >nul

echo.
echo [Step 2/5] Clearing Python cache...
if exist __pycache__ (
    rmdir /S /Q __pycache__ >nul 2>&1
    echo   ? Root cache cleared
)
if exist Codette\__pycache__ (
    rmdir /S /Q Codette\__pycache__ >nul 2>&1
    echo   ? Codette cache cleared
)
echo   ? Cache cleanup complete

echo.
echo [Step 3/5] Starting Codette server...
echo   Please wait for: "? SERVER READY - Codette AI is listening"
echo.
start "Codette Server" cmd /k "python codette_server_unified.py"

echo   Waiting for server startup...
timeout /t 10 /nobreak >nul

echo.
echo [Step 4/5] Testing existing Supabase table integration...
timeout /t 2 /nobreak >nul
python test_existing_tables.py

echo.
echo [Step 5/5] Testing response variety...
timeout /t 2 /nobreak >nul
python test_codette_enhanced.py

echo.
echo ================================================================================
echo                                  COMPLETE!
echo ================================================================================
echo.
echo ? Server running in separate window
echo ? Supabase integration tested (see results above)
echo ? Response variety tested (see results above)
echo.
echo NEXT STEPS:
echo   1. Check test results above for "? SUCCESS"
echo   2. Open your DAW at: http://localhost:5173
echo   3. Try Codette panel - ask "how do I improve my mixing?" multiple times
echo   4. Each response should be unique with different personality!
echo   5. (Optional) Check Supabase Table Editor for saved conversations
echo.
echo FEATURES ENABLED:
echo   • 85+ unique responses with 5 personality modes
echo   • Integration with your music_knowledge_dedupe_backup table
echo   • Conversation saving to your chat_history table
echo   • Context memory and learning from interactions
echo.
echo To stop server: Close "Codette Server" window or run: taskkill /F /IM python.exe
echo.
pause
