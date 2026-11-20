import React, { useState } from 'react'

export const ErrorBoundaryTriggerView: React.FC = () => {
  const [shouldCrash, setShouldCrash] = useState(true)

  if (shouldCrash) {
    throw new Error('Test 500 Error: Mô phỏng lỗi unhandled runtime exception để kiểm định GlobalErrorBoundary')
  }

  return (
    <div className="p-8">
      <button onClick={() => setShouldCrash(true)}>Kích hoạt lỗi 500</button>
    </div>
  )
}
