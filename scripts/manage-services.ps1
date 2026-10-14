<#
.SYNOPSIS
    Script quản lý tập trung toàn diện các dịch vụ hạ tầng và phân hệ qua Docker Compose.
.DESCRIPTION
    Điều phối vòng đời (build, start, stop, restart, status, logs, down, seed) cho:
      - fas-postgres: Cơ sở dữ liệu trung tâm PostgreSQL 16
      - fas-backend:  Máy chủ nghiệp vụ Spring Boot 4 / Java 21
      - fas-web:      Cổng Web Quản trị React 19 / Nginx Reverse Proxy
    Kèm hướng dẫn khởi chạy phân hệ Kiosk Desktop App (PySide6 / Edge Client).
.PARAMETER Action
    Hành động cần thực thi: start, build, stop, restart, status, logs, down, seed.
    Mặc định: 'status'.
.PARAMETER Service
    Phân hệ chỉ định áp dụng: all, web, backend, db.
    Mặc định: 'all'.
.PARAMETER NoBuild
    Bỏ qua bước đóng gói lại Docker images khi thực thi 'start'.
.PARAMETER Volumes
    Xóa toàn bộ volumes dữ liệu bền vững (pgdata) khi thực thi 'down'.
.EXAMPLE
    .\scripts\manage-services.ps1 start
    .\scripts\manage-services.ps1 start -NoBuild
    .\scripts\manage-services.ps1 build
    .\scripts\manage-services.ps1 status
    .\scripts\manage-services.ps1 logs -Service backend
    .\scripts\manage-services.ps1 logs -Service web
    .\scripts\manage-services.ps1 seed
    .\scripts\manage-services.ps1 down -Volumes
#>

[CmdletBinding()]
param (
    [Parameter(Position = 0)]
    [ValidateSet("start", "build", "stop", "restart", "status", "logs", "down", "seed")]
    [string]$Action = "status",

    [Parameter(Position = 1)]
    [ValidateSet("all", "web", "backend", "db")]
    [string]$Service = "all",

    [switch]$NoBuild,
    [switch]$Volumes
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# Ánh xạ nhóm dịch vụ logic sang tên container trong docker-compose.yml
$ServiceMap = @{
    "all"     = @("fas-postgres", "fas-backend", "fas-web")
    "web"     = @("fas-web")
    "backend" = @("fas-backend")
    "db"      = @("fas-postgres")
}
$TargetServices = $ServiceMap[$Service]

function Test-HttpEndpoint {
    param (
        [string]$Url,
        [string]$Name,
        [int]$TimeoutSeconds = 30
    )
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    Write-Host "    [?] Đang kiểm tra kết nối $Name ($Url)... " -NoNewline
    while ($stopwatch.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
        try {
            $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
                Write-Host " [OK]" -ForegroundColor Green
                return $true
            }
        }
        catch {
            Start-Sleep -Seconds 1
        }
    }
    Write-Host " [CHỜ PHẢN HỒI]" -ForegroundColor Yellow
    return $false
}

function Show-ServiceDashboard {
    Write-Host "`n================================================================================" -ForegroundColor Cyan
    Write-Host "   HỆ THỐNG ĐIỂM DANH KHUÔN MẶT (FAS) - THÔNG TIN TRUY CẬP CÁC PHÂN HỆ" -ForegroundColor Cyan
    Write-Host "================================================================================" -ForegroundColor Cyan
    Write-Host "  1. Web Portal (Cổng Web Quản trị & Giám sát):" -ForegroundColor White
    Write-Host "     - Địa chỉ:       http://localhost:3000" -ForegroundColor Green
    Write-Host "     - Tài khoản:     admin@fas.com / Admin@123456"
    Write-Host "     - Healthcheck:   http://localhost:3000/healthz"
    Write-Host ""
    Write-Host "  2. Backend Service (Spring Boot 4.x / Java 21):" -ForegroundColor White
    Write-Host "     - API Base:      http://localhost:8080/api/v1"
    Write-Host "     - Swagger UI:    http://localhost:8080/swagger-ui/index.html" -ForegroundColor Green
    Write-Host "     - OpenAPI JSON:  http://localhost:8080/v3/api-docs"
    Write-Host "     - Actuator:      http://localhost:8080/actuator/health" -ForegroundColor Green
    Write-Host ""
    Write-Host "  3. PostgreSQL Database (PostgreSQL 16):" -ForegroundColor White
    Write-Host "     - Máy chủ/Cổng:  localhost:5432 (database: fas_db, user: fas_admin)"
    Write-Host ""
    Write-Host "  4. Kiosk Desktop App (PySide6 / Edge Client):" -ForegroundColor White
    Write-Host "     - Thư mục:       app/kiosk-app"
    Write-Host "     - Lệnh chạy:     python app/kiosk-app/main.py" -ForegroundColor Yellow
    Write-Host "     - Hoặc venv:     .\app\kiosk-app\.venv\Scripts\python.exe app\kiosk-app\main.py" -ForegroundColor Yellow
    Write-Host "================================================================================`n" -ForegroundColor Cyan
}

Push-Location $ProjectRoot

try {
    # Kiểm tra Docker daemon đang chạy
    try {
        $null = docker info --format '{{.ServerVersion}}' 2>$null
    }
    catch {
        Write-Error "Không thể kết nối đến Docker daemon. Vui lòng khởi động Docker Desktop trước khi chạy script."
        return
    }

    # Đảm bảo tệp .env đã tồn tại
    if (-not (Test-Path "$ProjectRoot\.env")) {
        if (Test-Path "$ProjectRoot\.env.example") {
            Write-Host ">>> Tệp .env chưa tồn tại. Đang tự động sao chép từ .env.example..." -ForegroundColor Yellow
            Copy-Item "$ProjectRoot\.env.example" "$ProjectRoot\.env"
            Write-Host ">>> Đã tạo tệp .env thành công." -ForegroundColor Green
        }
    }

    switch ($Action) {
        "build" {
            Write-Host ">>> Đang đóng gói Docker images cho phân hệ: $($TargetServices -join ', ')..." -ForegroundColor Cyan
            docker compose build $TargetServices
            Write-Host "`n>>> Đóng gói Docker hoàn tất!" -ForegroundColor Green
        }

        "start" {
            $buildFlag = if ($NoBuild) { @() } else { @("--build") }
            Write-Host ">>> Đang khởi chạy phân hệ: $($TargetServices -join ', ')..." -ForegroundColor Cyan
            docker compose up -d $buildFlag $TargetServices

            Write-Host "`n>>> Đang chờ các phân hệ khởi động và sẵn sàng hoạt động..." -ForegroundColor Yellow
            Start-Sleep -Seconds 3

            # Kiểm tra nhanh sức khỏe dịch vụ nếu có khởi chạy
            if ($TargetServices -contains "fas-backend") {
                Test-HttpEndpoint -Url "http://localhost:8080/actuator/health" -Name "Backend Service" -TimeoutSeconds 25 | Out-Null
            }
            if ($TargetServices -contains "fas-web") {
                Test-HttpEndpoint -Url "http://localhost:3000/healthz" -Name "Web Portal" -TimeoutSeconds 15 | Out-Null
            }

            Write-Host "`n>>> Trạng thái các containers:" -ForegroundColor Cyan
            docker compose ps $TargetServices

            Show-ServiceDashboard
        }

        "stop" {
            Write-Host ">>> Đang dừng phân hệ: $($TargetServices -join ', ')..." -ForegroundColor Yellow
            docker compose stop $TargetServices
            Write-Host "`n>>> Trạng thái hiện tại:" -ForegroundColor Cyan
            docker compose ps $TargetServices
        }

        "restart" {
            Write-Host ">>> Đang khởi động lại phân hệ: $($TargetServices -join ', ')..." -ForegroundColor Cyan
            docker compose restart $TargetServices
            Start-Sleep -Seconds 3
            Write-Host "`n>>> Trạng thái hiện tại:" -ForegroundColor Cyan
            docker compose ps $TargetServices
        }

        "status" {
            Write-Host ">>> Trạng thái các dịch vụ Docker Compose:" -ForegroundColor Cyan
            docker compose ps $TargetServices

            # Thăm dò kiểm tra sức khỏe
            Write-Host "`n>>> Kiểm tra kết nối dịch vụ trực tiếp:" -ForegroundColor Cyan
            $beUp = $false
            $webUp = $false
            try {
                $beRes = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -Method Get -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
                if ($beRes.StatusCode -eq 200) { $beUp = $true }
            } catch {}

            try {
                $webRes = Invoke-WebRequest -Uri "http://localhost:3000/healthz" -Method Get -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
                if ($webRes.StatusCode -eq 200) { $webUp = $true }
            } catch {}

            $beColor = if ($beUp) { "Green" } else { "DarkGray" }
            $beStatus = if ($beUp) { "[UP - HTTP 200]" } else { "[DOWN / UNREACHABLE]" }
            Write-Host "    - Backend Actuator (http://localhost:8080/actuator/health): $beStatus" -ForegroundColor $beColor

            $webColor = if ($webUp) { "Green" } else { "DarkGray" }
            $webStatus = if ($webUp) { "[UP - HTTP 200]" } else { "[DOWN / UNREACHABLE]" }
            Write-Host "    - Web Portal (http://localhost:3000): $webStatus" -ForegroundColor $webColor
            Write-Host ""
        }

        "logs" {
            Write-Host ">>> Đang theo dõi nhật ký dịch vụ ($($TargetServices -join ', ')) (Ctrl+C để thoát)..." -ForegroundColor Cyan
            docker compose logs -f --tail=100 $TargetServices
        }

        "down" {
            $downArgs = if ($Volumes) { @("-v") } else { @() }
            Write-Host ">>> Đang dừng và giải phóng toàn bộ containers$([string]::Join(' ', $downArgs))..." -ForegroundColor Red
            docker compose down $downArgs
            Write-Host ">>> Đã giải phóng containers thành công." -ForegroundColor Green
        }

        "seed" {
            Write-Host ">>> Nạp dữ liệu mẫu E2E (scripts/seed-e2e-data.sql) vào fas-postgres..." -ForegroundColor Cyan
            $seedFile = Join-Path $ProjectRoot "scripts\seed-e2e-data.sql"
            if (-not (Test-Path $seedFile)) {
                Write-Error "Không tìm thấy tệp dữ liệu mẫu: $seedFile"
                return
            }

            # Lấy thông tin user và db từ môi trường hoặc mặc định
            $dbUser = if ($env:DB_USER) { $env:DB_USER } else { "fas_admin" }
            $dbName = if ($env:DB_NAME) { $env:DB_NAME } else { "fas_db" }

            docker cp "$seedFile" "fas-postgres:/tmp/seed.sql"
            docker exec fas-postgres psql -U $dbUser -d $dbName -f /tmp/seed.sql
            docker exec fas-postgres rm /tmp/seed.sql
            Write-Host ">>> Đã nạp dữ liệu mẫu E2E thành công vào CSDL $dbName!" -ForegroundColor Green
        }
    }
}
finally {
    Pop-Location
}
