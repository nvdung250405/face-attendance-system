import { describe, it, expect } from 'vitest'
import nginxConfigContent from '../../nginx.conf?raw'

describe('Nginx Reverse Proxy & CORS Mitigation Config (TASK-WEB-031, FND-WEB-006)', () => {
  it('1. Tệp nginx.conf tồn tại và không rỗng', () => {
    expect(nginxConfigContent).toBeDefined()
    expect(nginxConfigContent.length).toBeGreaterThan(100)
  })

  it('2. Khai báo map nâng cấp giao thức WebSocket ($http_upgrade -> $connection_upgrade)', () => {
    expect(nginxConfigContent).toContain('map $http_upgrade $connection_upgrade')
    expect(nginxConfigContent).toContain('default upgrade;')
    expect(nginxConfigContent).toMatch(/''\s+close;/)
  })

  it('3. Định nghĩa cụm máy chủ nội bộ upstream backend_upstream trỏ tới fas-backend:8080', () => {
    expect(nginxConfigContent).toContain('upstream backend_upstream')
    expect(nginxConfigContent).toContain('server fas-backend:8080;')
    expect(nginxConfigContent).toContain('keepalive')
  })

  it('4. Cấu hình Reverse Proxy /api/ với CORS Preflight và chuyển tiếp backend_upstream', () => {
    expect(nginxConfigContent).toContain('location /api/')
    expect(nginxConfigContent).toContain('proxy_pass http://backend_upstream;')
    expect(nginxConfigContent).toContain("if ($request_method = 'OPTIONS')")
    expect(nginxConfigContent).toContain('Access-Control-Allow-Origin')
    expect(nginxConfigContent).toContain('Access-Control-Allow-Methods')
    expect(nginxConfigContent).toContain('Access-Control-Allow-Headers')
    expect(nginxConfigContent).toContain('Access-Control-Allow-Credentials')
    expect(nginxConfigContent).toContain('return 204;')
    expect(nginxConfigContent).toContain('proxy_set_header Host $host;')
    expect(nginxConfigContent).toContain('proxy_set_header X-Real-IP $remote_addr;')
    expect(nginxConfigContent).toContain('proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;')
    expect(nginxConfigContent).toContain('proxy_set_header X-Forwarded-Proto $scheme;')
  })

  it('5. Cấu hình Reverse Proxy WebSocket /ws-attendance với Upgrade header và timeout bền vững', () => {
    expect(nginxConfigContent).toContain('location /ws-attendance')
    expect(nginxConfigContent).toContain('proxy_pass http://backend_upstream/ws-attendance;')
    expect(nginxConfigContent).toContain('proxy_set_header Upgrade $http_upgrade;')
    expect(nginxConfigContent).toContain('proxy_set_header Connection $connection_upgrade;')
    expect(nginxConfigContent).toContain('proxy_read_timeout 3600s;')
    expect(nginxConfigContent).toContain('proxy_send_timeout 3600s;')
    expect(nginxConfigContent).toContain('proxy_buffering off;')
  })

  it('6. Cấu hình Reverse Proxy WebSocket /ws dự phòng', () => {
    expect(nginxConfigContent).toContain('location /ws')
    expect(nginxConfigContent).toContain('proxy_pass http://backend_upstream/ws;')
    expect(nginxConfigContent).toContain('proxy_set_header Upgrade $http_upgrade;')
    expect(nginxConfigContent).toContain('proxy_set_header Connection $connection_upgrade;')
  })

  it('7. Bảo đảm duy trì SPA Fallback routing và Healthcheck endpoint /healthz', () => {
    expect(nginxConfigContent).toContain('try_files $uri $uri/ /index.html;')
    expect(nginxConfigContent).toContain('location /healthz')
    expect(nginxConfigContent).toContain('return 200 "healthy\\n";')
  })
})
