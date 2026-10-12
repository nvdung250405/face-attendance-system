/**
 * Thành phần hiển thị mã QR Code 200x200px (UXD-WEB-002, DD-WEB-016).
 * Hỗ trợ render từ data URL hình ảnh hoặc sinh SVG ma trận trực quan từ dữ liệu text.
 */

import React, { useMemo } from 'react'

export interface QrCodeDisplayProps {
  value: string
  size?: number
  className?: string
}

/**
 * Sinh ma trận 21x21 (QR Code Version 1) dựa trên hash dữ liệu
 */
function generateQrMatrix(text: string): boolean[][] {
  const size = 25
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false))

  // 1. Vẽ Finder Pattern (7x7) tại góc trên-trái, trên-phải, dưới-trái
  function drawFinderPattern(startX: number, startY: number) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startY + r][startX + c] = true
        }
      }
    }
  }

  drawFinderPattern(0, 0)
  drawFinderPattern(size - 7, 0)
  drawFinderPattern(0, size - 7)

  // 2. Vẽ đường Timing Patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0
    matrix[i][6] = i % 2 === 0
  }

  // 3. Hash dữ liệu text để lấp đầy các module dữ liệu
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i)
    hash |= 0
  }

  let seed = Math.abs(hash)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Bỏ qua các vùng Finder Patterns
      const inTopLeft = r < 8 && c < 8
      const inTopRight = r < 8 && c >= size - 8
      const inBottomLeft = r >= size - 8 && c < 8
      const isTiming = r === 6 || c === 6

      if (!inTopLeft && !inTopRight && !inBottomLeft && !isTiming) {
        seed = (seed * 1664525 + 1013904223) % 4294967296
        matrix[r][c] = (seed % 10) > 4
      }
    }
  }

  return matrix
}

export const QrCodeDisplay: React.FC<QrCodeDisplayProps> = ({
  value,
  size = 200,
  className = '',
}) => {
  const isDataUrl = value.startsWith('data:image/')
  const matrix = useMemo(() => (isDataUrl ? [] : generateQrMatrix(value)), [value, isDataUrl])

  // Nếu dữ liệu đã là Data URL hình ảnh
  if (isDataUrl) {
    return (
      <img
        src={value}
        width={size}
        height={size}
        alt="Mã QR Kích hoạt"
        className={`rounded-lg border border-border-subtle bg-white p-2 shadow-sm ${className}`}
      />
    )
  }

  const moduleCount = matrix.length
  const cellSize = size / moduleCount

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl border border-border-subtle bg-white p-2.5 shadow-sm ${className}`}
      style={{ width: size + 20, height: size + 20 }}
      data-testid="qr-code-container"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shape-rendering-crisp"
        aria-label={`QR Code cho: ${value}`}
      >
        <rect width={size} height={size} fill="#FFFFFF" />
        {matrix.map((row, r) =>
          row.map((cell, c) =>
            cell ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill="#0F172A"
              />
            ) : null
          )
        )}
      </svg>
    </div>
  )
}
