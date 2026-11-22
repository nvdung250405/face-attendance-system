import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * useDebounce: Trả về giá trị đã được debounce theo khoảng thời gian delayMs (mặc định 350ms)
 * (STAB-004, PERF-003)
 */
export function useDebounce<T>(value: T, delayMs: number = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delayMs])

  return debouncedValue
}

/**
 * useDebouncedCallback: Bọc một hàm callback thực thi trễ sau delayMs (mặc định 350ms)
 * (STAB-004)
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delayMs: number = 350
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delayMs)
    },
    [delayMs]
  )
}
