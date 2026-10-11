<#
.SYNOPSIS
    Script quản lý tập trung các dịch vụ hạ tầng (Database & Backend Service) qua Docker Compose.
.DESCRIPTION
    Hỗ trợ khởi động, dừng, kiểm tra trạng thái và theo dõi nhật ký của fas-postgres và fas-backend.
.PARAMETER Action
    Hành động cần thực thi: start, stop, restart, status, logs, down
.EXAMPLE
    .\scripts\manage-services.ps1 start
    .\scripts\manage-services.ps1 status
    .\scripts\manage-services.ps1 logs
#>

param (
    [Parameter(Position = 0)]
    [ValidateSet("start", "stop", "restart", "status", "logs", "down")]
    [string]$Action = "status"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

Push-Location $ProjectRoot

try {
    switch ($Action) {
        "start" {
            Write-Host ">>> Khởi động tập trung PostgreSQL 16 và Backend Service..." -ForegroundColor Cyan
            docker compose up -d --build fas-postgres fas-backend
            Write-Host "`n>>> Đang chờ dịch vụ sẵn sàng..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
            docker compose ps fas-postgres fas-backend
            Write-Host "`n>>> Dịch vụ sẵn sàng:" -ForegroundColor Green
            Write-Host "    - Swagger UI: http://localhost:8080/swagger-ui/index.html"
            Write-Host "    - OpenAPI Docs: http://localhost:8080/v3/api-docs"
            Write-Host "    - Actuator Health: http://localhost:8080/actuator/health"
        }
        "stop" {
            Write-Host ">>> Dừng các dịch vụ Backend & Database..." -ForegroundColor Yellow
            docker compose stop fas-backend fas-postgres
            docker compose ps fas-postgres fas-backend
        }
        "restart" {
            Write-Host ">>> Khởi động lại Backend Service..." -ForegroundColor Cyan
            docker compose restart fas-backend
            docker compose ps fas-backend
        }
        "status" {
            Write-Host ">>> Trạng thái các dịch vụ tập trung:" -ForegroundColor Cyan
            docker compose ps fas-postgres fas-backend
        }
        "logs" {
            Write-Host ">>> Theo dõi nhật ký Backend Service (Ctrl+C để thoát)..." -ForegroundColor Cyan
            docker compose logs -f fas-backend
        }
        "down" {
            Write-Host ">>> Dừng và giải phóng containers..." -ForegroundColor Red
            docker compose down
        }
    }
}
finally {
    Pop-Location
}
