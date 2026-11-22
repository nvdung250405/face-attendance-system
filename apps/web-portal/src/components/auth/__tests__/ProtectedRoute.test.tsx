/**
 * Unit Tests cho ProtectedRoute & Role Guards (SOL-WEB-001, TST-WEB-013, TASK-WEB-016).
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '../ProtectedRoute'
import { PublicRoute } from '../PublicRoute'
import { useAuthStore } from '@/store/authStore'
import type { AuthSession } from '@/types'

describe('ProtectedRoute & Role Guard (TASK-WEB-016)', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({
      session: null,
      user: null,
      isAuthenticated: false,
      isInitialized: true,
    })
  })

  it('chặn truy cập trái phép và chuyển hướng về /login khi chưa đăng nhập', () => {
    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Trang Đăng Nhập</div>} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['HR_MANAGER']}>
                <div>Admin Secret Page</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.queryByText('Admin Secret Page')).toBeNull()
    expect(screen.getByText('Trang Đăng Nhập')).toBeDefined()
  })

  it('cho phép truy cập khi người dùng đã đăng nhập và đúng role', () => {
    const hrSession: AuthSession = {
      accessToken: 'token-hr',
      refreshToken: 'refresh-hr',
      tokenType: 'Bearer',
      expiresAt: Date.now() + 3600000,
      user: {
        id: 1,
        employeeCode: 'NV-HR-001',
        fullName: 'HR Manager',
        email: 'hr@company.com',
        role: 'HR_MANAGER',
        status: 'ACTIVE',
        department: 'HR',
      },
    }
    useAuthStore.setState({ session: hrSession, user: hrSession.user, isAuthenticated: true })

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Trang Đăng Nhập</div>} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['HR_MANAGER']}>
                <div>Admin Secret Page</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Admin Secret Page')).toBeDefined()
    expect(screen.queryByText('Trang Đăng Nhập')).toBeNull()
  })

  it('điều hướng về đúng portal khi truy cập sai quyền (Role Guard: EMPLOYEE cố vào Admin)', () => {
    const empSession: AuthSession = {
      accessToken: 'token-emp',
      refreshToken: 'refresh-emp',
      tokenType: 'Bearer',
      expiresAt: Date.now() + 3600000,
      user: {
        id: 1042,
        employeeCode: 'NV-1042',
        fullName: 'Employee',
        email: 'emp@company.com',
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        department: 'Engineering',
      },
    }
    useAuthStore.setState({ session: empSession, user: empSession.user, isAuthenticated: true })

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/employee/dashboard" element={<div>Trang Nhân Viên Cá Nhân</div>} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['HR_MANAGER']}>
                <div>Admin Secret Page</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.queryByText('Admin Secret Page')).toBeNull()
    expect(screen.getByText('Trang Nhân Viên Cá Nhân')).toBeDefined()
  })

  it('PublicRoute tự động chuyển hướng người dùng đã đăng nhập sang portal mặc định', () => {
    const empSession: AuthSession = {
      accessToken: 'token-emp',
      refreshToken: 'refresh-emp',
      tokenType: 'Bearer',
      expiresAt: Date.now() + 3600000,
      user: {
        id: 1042,
        employeeCode: 'NV-1042',
        fullName: 'Employee',
        email: 'emp@company.com',
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        department: 'Engineering',
      },
    }
    useAuthStore.setState({ session: empSession, user: empSession.user, isAuthenticated: true })

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <div>Màn Hình Login</div>
              </PublicRoute>
            }
          />
          <Route path="/employee/dashboard" element={<div>Trang Nhân Viên Cá Nhân</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.queryByText('Màn Hình Login')).toBeNull()
    expect(screen.getByText('Trang Nhân Viên Cá Nhân')).toBeDefined()
  })
})
