import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Tiện ích kết hợp và chuẩn hóa class Tailwind (Generic UI Helper).
 * Giải quyết xung đột class (Tailwind merge) và xử lý điều kiện (clsx).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
