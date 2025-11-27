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

# Start DAW Core API with uvicorn
$jawCommand = "$pythonCmd -m uvicorn daw_core.api:app --host 0.0.0.0 --port $Port --log-level info"

if ($VerboseOutput) {
    Write-Info "Running: $jawCommand"
}

$restartCount = 0
$maxRestarts = 5

while ($true) {
    try {
        Write-Info "Attempting to start DAW Core API (attempt $($restartCount + 1))..."
        
        # Run the server
        Invoke-Expression $jawCommand
        
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -eq 0) {
            Write-Success "DAW Core API exited cleanly"
            break
        } else {
            Write-Warning-Custom "DAW Core API exited with code $exitCode"
        }
        
        if (-not $NoRestart) {
            $restartCount++
            if ($restartCount -lt $maxRestarts) {
                Write-Info "Restarting in 3 seconds... (attempt $($restartCount + 1)/$maxRestarts)"
                Start-Sleep -Seconds 3
            } else {
                Write-Error-Custom "Max restart attempts reached ($maxRestarts)"
                exit 1
            }
        } else {
            exit $exitCode
        }
        
    } catch {
        Write-Error-Custom "Error starting server: $_"
        if ($NoRestart) {
            exit 1
        }
        $restartCount++
        if ($restartCount -lt $maxRestarts) {
            Write-Info "Restarting in 3 seconds..."
            Start-Sleep -Seconds 3
        } else {
            exit 1
        }
    }
}
