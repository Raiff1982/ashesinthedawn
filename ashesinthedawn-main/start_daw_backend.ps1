#!/usr/bin/env pwsh
<#
.SYNOPSIS
Start DAW Backend (Python FastAPI + Codette AI Server)

.DESCRIPTION
Launches the Python backend services for CoreLogic Studio DAW:
- DAW Core DSP API (port 8000)
- Codette AI Server (port 8001)
- Health checks and auto-restart

.EXAMPLE
.\start_daw_backend.ps1
#>

param(
    [switch]$NoRestart = $false,
    [switch]$VerboseOutput = $false,
    [int]$Port = 8000
)

# Colors for output
$InfoColor = "Cyan"
$SuccessColor = "Green"
$ErrorColor = "Red"
$WarningColor = "Yellow"

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $InfoColor
}

function Write-Success {
    param([string]$Message)
    Write-Host "[✓] $Message" -ForegroundColor $SuccessColor
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "[✗] $Message" -ForegroundColor $ErrorColor
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "[!] $Message" -ForegroundColor $WarningColor
}

# ============================================================================
# VERIFY PYTHON & DEPENDENCIES
# ============================================================================

Write-Info "Verifying Python installation..."

$pythonCmd = $null
$pythonVersion = $null

# Try to find Python
$possiblePaths = @(
    "python",
    "python3",
    "py"
)

foreach ($cmd in $possiblePaths) {
    try {
        $version = & $cmd --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $pythonCmd = $cmd
            $pythonVersion = $version
            break
        }
    } catch {
        # Continue to next
    }
}

if (-not $pythonCmd) {
    Write-Error-Custom "Python not found! Please install Python 3.8+ and add it to PATH"
    exit 1
}

Write-Success "Found Python: $pythonVersion"

# ============================================================================
# CHECK DEPENDENCIES
# ============================================================================

Write-Info "Checking required dependencies..."

$requiredPackages = @(
    "fastapi",
    "uvicorn",
    "pydantic",
    "numpy",
    "scipy"
)

$missingPackages = @()

foreach ($package in $requiredPackages) {
    try {
        & $pythonCmd -c "import $package" 2>&1 | Out-Null
        Write-Success "  ✓ $package"
    } catch {
        Write-Warning-Custom "  ✗ $package (missing)"
        $missingPackages += $package
    }
}

if ($missingPackages.Count -gt 0) {
    Write-Warning-Custom "Installing missing packages..."
    & $pythonCmd -m pip install @missingPackages
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Failed to install dependencies!"
        exit 1
    }
}

# ============================================================================
# CHECK PROJECT STRUCTURE
# ============================================================================

Write-Info "Verifying project structure..."

$requiredFiles = @(
    "daw_core/api.py",
    "daw_core/engine.py",
    "codette_server.py"
)

$missingFiles = @()

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Success "  ✓ $file"
    } else {
        Write-Warning-Custom "  ✗ $file (missing)"
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Error-Custom "Missing files: $($missingFiles -join ', ')"
    Write-Info "Make sure you're running from the project root directory"
    exit 1
}

# ============================================================================
# START BACKEND SERVERS
# ============================================================================

Write-Host "`n" + ("="*70) -ForegroundColor $InfoColor
Write-Host "CoreLogic Studio DAW Backend Launcher" -ForegroundColor $InfoColor
Write-Host ("="*70) -ForegroundColor $InfoColor

Write-Info "Starting DAW Core API on http://localhost:$Port"
Write-Info "Starting Codette AI Server on http://localhost:8001"
Write-Info "Press Ctrl+C to stop all servers"
Write-Host "`n"

# ============================================================================
# START BOTH SERVERS CONCURRENTLY
# ============================================================================

# DAW Core API command
$dawCommand = "$pythonCmd -m uvicorn daw_core.api:app --host 0.0.0.0 --port $Port --log-level info"

# Codette AI Server command
$codetteCommand = "$pythonCmd codette_server.py"

# Codette can also be started with uvicorn explicitly
# $codetteCommand = "$pythonCmd -m uvicorn codette_server:app --host 127.0.0.1 --port 8001 --log-level info"

if ($VerboseOutput) {
    Write-Info "DAW API Command: $dawCommand"
    Write-Info "Codette Command: $codetteCommand"
}

Write-Info "Launching servers..."

# Start DAW Core API in background
Write-Info "Starting DAW Core API (port $Port)..."
$dawProcess = Start-Process -FilePath $pythonCmd `
    -ArgumentList "-m", "uvicorn", "daw_core.api:app", "--host", "0.0.0.0", "--port", $Port, "--log-level", "info" `
    -PassThru `
    -NoNewWindow

$dawProcessId = $dawProcess.Id
Write-Success "DAW Core API started (PID: $dawProcessId)"

# Wait a moment for DAW to start
Start-Sleep -Seconds 2

# Start Codette AI Server in background
Write-Info "Starting Codette AI Server (port 8001)..."
$codetteProcess = Start-Process -FilePath $pythonCmd `
    -ArgumentList "codette_server.py" `
    -PassThru `
    -NoNewWindow

$codetteProcessId = $codetteProcess.Id
Write-Success "Codette AI Server started (PID: $codetteProcessId)"

Write-Host "`n" + ("="*70) -ForegroundColor $SuccessColor
Write-Success "All servers running!"
Write-Host "DAW Core API    : http://localhost:$Port"
Write-Host "Codette AI      : http://localhost:8001"
Write-Host "API Docs        : http://localhost:$Port/docs"
Write-Host ("="*70) -ForegroundColor $SuccessColor + "`n"

# Monitor both processes
Write-Info "Monitoring servers (Press Ctrl+C to stop all)..."

try {
    while ($true) {
        # Check if either process has exited
        if ($dawProcess.HasExited) {
            Write-Error-Custom "DAW Core API process exited (exit code: $($dawProcess.ExitCode))"
            
            # Kill Codette if DAW dies
            if (-not $codetteProcess.HasExited) {
                Write-Info "Stopping Codette AI Server..."
                Stop-Process -Id $codetteProcessId -Force -ErrorAction SilentlyContinue
            }
            
            if (-not $NoRestart) {
                Write-Info "Attempting to restart servers..."
                Start-Sleep -Seconds 3
            } else {
                exit 1
            }
        }
        
        if ($codetteProcess.HasExited) {
            Write-Error-Custom "Codette AI Server process exited (exit code: $($codetteProcess.ExitCode))"
            
            # Kill DAW if Codette dies
            if (-not $dawProcess.HasExited) {
                Write-Info "Stopping DAW Core API..."
                Stop-Process -Id $dawProcessId -Force -ErrorAction SilentlyContinue
            }
            
            exit 1
        }
        
        Start-Sleep -Seconds 5
    }
} finally {
    # Cleanup on exit
    Write-Info "`nShutting down servers..."
    
    if (-not $dawProcess.HasExited) {
        Stop-Process -Id $dawProcessId -Force -ErrorAction SilentlyContinue
        Write-Success "DAW Core API stopped"
    }
    
    if (-not $codetteProcess.HasExited) {
        Stop-Process -Id $codetteProcessId -Force -ErrorAction SilentlyContinue
        Write-Success "Codette AI Server stopped"
    }
    
    Write-Info "All servers stopped"
}
