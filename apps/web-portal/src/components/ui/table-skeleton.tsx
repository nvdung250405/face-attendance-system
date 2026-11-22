/**
 * Primitive TableSkeleton Component
 * Hiển thị các hàng giả lập (Skeleton Loading) với hiệu ứng animate-pulse
 * Giúp triệt tiêu hiện tượng giật gián đoạn bố cục (Cumulative Layout Shift - CLS) khi tải dữ liệu bảng.
 */

import React from 'react'

export interface TableSkeletonProps {
  /** Số lượng cột của bảng (dùng để render đúng số ô td) */
  columns: number
  /** Số lượng dòng giả lập cần hiển thị (mặc định: 5) */
  rows?: number
  /** Chiều cao ước tính mỗi dòng hoặc ô (mặc định: 'h-4') */
  cellHeight?: string
  /** Có bao gồm cột hành động cố định bên phải hay không */
  hasActionColumn?: boolean
  /** Văn bản ngữ nghĩa cho Screen Reader (WCAG A11y) */
  ariaLabel?: string
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  columns,
  rows = 5,
  cellHeight = 'h-4',
  hasActionColumn = false,
  ariaLabel = 'Đang tải dữ liệu bảng...',
}) => {
  const rowList = Array.from({ length: rows })
  const colList = Array.from({ length: hasActionColumn ? columns - 1 : columns })

  return (
    <>
      <tr className="sr-only">
        <td colSpan={columns}>
          <span role="status" aria-live="polite">
            {ariaLabel}
          </span>
        </td>
      </tr>
      {rowList.map((_, rIdx) => (
        <tr
          key={`skeleton-row-${rIdx}`}
          data-testid="table-skeleton-row"
          className="border-b border-border-subtle animate-pulse bg-white/60"
        >
          {colList.map((_, cIdx) => {
            // Biến thiên độ rộng ngẫu nhiên nhẹ giữa các ô để tạo cảm giác nội dung chân thực
            const widthVariants = ['w-3/4', 'w-1/2', 'w-4/5', 'w-2/3', 'w-full']
            const widthClass = widthVariants[(rIdx + cIdx) % widthVariants.length]

            return (
              <td key={`skeleton-cell-${rIdx}-${cIdx}`} className="py-3.5 px-4">
                <div className={`${cellHeight} ${widthClass} bg-slate-200/80 rounded-md`} />
              </td>
            )
          })}

          {hasActionColumn && (
            <td className="py-3.5 px-4 text-right">
              <div className={`${cellHeight} w-16 ml-auto bg-slate-200/80 rounded-md`} />
            </td>
          )}
        </tr>
      ))}
    </>
  )
}
