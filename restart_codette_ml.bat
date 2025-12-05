@echo off
REM Restart Codette Server with ML Features
echo ========================================
echo Restarting Codette AI Server with ML
echo ========================================

REM Stop any running Python servers
echo Stopping existing server...
taskkill /F /IM python.exe /FI "MEMUSAGE gt 50000" 2>nul
timeout /t 2 /nobreak > nul

REM Start server
echo.
echo Starting Codette server with ML features enabled...
echo.
python codette_server_unified.py

pause
