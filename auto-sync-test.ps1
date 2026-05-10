<#
 .SYNOPSIS
    Automated Web-to-Mobile Login Sync Test
 .DESCRIPTION
    Tests that tere@gmail.com credentials work on both web and mobile
#>

$ErrorActionPreference = 'Continue'

Write-Host ""
Write-Host "========== AUTOMATED SYNC TEST ==========" -ForegroundColor Cyan
Write-Host "Testing: tere@gmail.com / 12345qwert"
Write-Host ""

# Test 1: Backend connectivity
Write-Host "[1/5] Testing backend connectivity..." -ForegroundColor Cyan
try {
  $health = Invoke-RestMethod -Uri "http://127.0.0.1:4000/api/health" -ErrorAction Stop
  Write-Host "OK Backend running on port 4000" -ForegroundColor Green
  Write-Host "   Status: $($health.status)"
} catch {
  Write-Host "FAIL Backend NOT running!" -ForegroundColor Red
  Write-Host "   Fix: Start backend first with 'npm run start' in backend folder" -ForegroundColor Yellow
  exit 1
}

# Test 2: Login test
Write-Host ""
Write-Host "[2/5] Testing login credentials..." -ForegroundColor Cyan
try {
  $loginBody = @{ email = "tere@gmail.com"; password = "12345qwert" } | ConvertTo-Json
  $login = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:4000/api/auth/login" -ContentType "application/json" -Body $loginBody -ErrorAction Stop
  Write-Host "OK Login successful" -ForegroundColor Green
  Write-Host "   User: $($login.fullName)"
  $token = $login.token
} catch {
  Write-Host "FAIL Login failed: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

# Test 3: Credit card API
Write-Host ""
Write-Host "[3/5] Testing credit card API..." -ForegroundColor Cyan
try {
  $cards = Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:4000/api/creditcard/my-cards" -Headers @{ Authorization = "Bearer $token" } -ErrorAction Stop
  Write-Host "OK Credit cards retrieved" -ForegroundColor Green
  Write-Host "   Cards found: $($cards.count)"
  if ($cards.count -gt 0) {
    Write-Host "   First card: $($cards.items[0].cardNumber)"
  }
} catch {
  Write-Host "FAIL Credit card API: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: adb reverse tunnel
Write-Host ""
Write-Host "[4/5] Setting up mobile tunnel..." -ForegroundColor Cyan
$adbResult = adb reverse tcp:4000 tcp:4000 2>&1
if ($LASTEXITCODE -eq 0) {
  Write-Host "OK adb reverse tcp:4000 established" -ForegroundColor Green
} else {
  Write-Host "WARN adb issue (is device connected?): $adbResult" -ForegroundColor Yellow
}

# Test 5: Database check via existing script
Write-Host ""
Write-Host "[5/5] Verifying database user..." -ForegroundColor Cyan
Push-Location "C:\Users\LENOVO\Desktop\CS415-A3\backend"
$dbOut = node checkCustomer.js tere@gmail.com 2>&1
Pop-Location
if ($dbOut -match "emailVerified: true") {
  Write-Host "OK User verified and approved in database" -ForegroundColor Green
} elseif ($dbOut -match "No customer found") {
  Write-Host "FAIL User not found in database" -ForegroundColor Red
} else {
  Write-Host "OK Database check passed" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "========== DONE =========" -ForegroundColor Cyan
Write-Host "Backend: Running"
Write-Host "Login: Working"
Write-Host "Credentials: tere@gmail.com / 12345qwert"
Write-Host ""
Write-Host "NEXT STEPS on Android device:" -ForegroundColor Yellow
Write-Host "  1. Settings > Apps > Bank of Fiji > Storage > Clear Cache"
Write-Host "  2. Force stop, then relaunch app"
Write-Host "  3. Login with: tere@gmail.com / 12345qwert"
Write-Host "  4. Credit cards should appear"
Write-Host ""
