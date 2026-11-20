/**
 * Utility sinh mã nghiệp vụ thông minh phía Client (Client-side Smart Preview)
 * Đồng nhất 1:1 với BusinessCodeGenerator phía Backend (TASK-WEB-028, TASK-WEB-029).
 */

export function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

export function extractShiftSlug(name: string): string {
  if (!name || !name.trim()) return 'CA'
  const normalized = removeVietnameseTones(name.trim().toLowerCase())

  if (normalized.includes('hanh chinh') || normalized.includes('hc')) {
    return 'HC'
  }
  if (normalized.includes('sang')) {
    return 'SANG'
  }
  if (normalized.includes('chieu')) {
    return 'CHIEU'
  }
  if (normalized.includes('dem')) {
    return 'DEM'
  }
  if (normalized.includes('toi')) {
    return 'TOI'
  }
  if (normalized.includes('gay')) {
    return 'GAY'
  }
  if (
    normalized.includes('part-time') ||
    normalized.includes('part time') ||
    normalized.includes('ban thoi gian') ||
    normalized.includes('pt')
  ) {
    return 'PT'
  }

  // Fallback: Lấy chữ cái đầu của các từ sau khi bỏ từ "ca" hoặc lấy 3-4 ký tự đầu
  const words = normalized
    .replace(/\bca\b/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length > 1) {
    return words
      .map((w) => w[0].toUpperCase())
      .join('')
      .slice(0, 5)
  }
  if (words.length === 1) {
    return words[0].slice(0, 5).toUpperCase()
  }

  return 'CA'
}

export function extractTimeSlug(startTime: string, endTime: string): string {
  if (!startTime || !endTime) return '0000'
  const [sH = '00', sM = '00'] = startTime.split(':')
  const [eH = '00', eM = '00'] = endTime.split(':')

  const padSH = sH.padStart(2, '0')
  const padSM = sM.padStart(2, '0')
  const padEH = eH.padStart(2, '0')
  const padEM = eM.padStart(2, '0')

  if (padSM === '00' && padEM === '00') {
    return `${padSH}${padEH}`
  }
  return `${padSH}${padSM !== '00' ? padSM : ''}${padEH}${padEM !== '00' ? padEM : ''}`
}

export function previewShiftCode(name: string, startTime: string, endTime: string): string {
  const shiftSlug = extractShiftSlug(name)
  const timeSlug = extractTimeSlug(startTime, endTime)
  return `SHF-${shiftSlug}-${timeSlug}`
}

export function extractLocationSlug(location: string): string {
  if (!location || !location.trim()) return 'GEN'
  const normalized = removeVietnameseTones(location.trim().toLowerCase())

  if (normalized.includes('ha noi') || /\bhn\b/.test(normalized)) {
    return 'HN'
  }
  if (
    normalized.includes('ho chi minh') ||
    normalized.includes('tp.hcm') ||
    normalized.includes('tphcm') ||
    normalized.includes('sai gon') ||
    /\bhcm\b/.test(normalized)
  ) {
    return 'HCM'
  }
  if (normalized.includes('da nang') || /\bdn\b/.test(normalized)) {
    return 'DN'
  }
  if (normalized.includes('bac ninh') || /\bbn\b/.test(normalized)) {
    return 'BN'
  }
  if (normalized.includes('hai phong') || /\bhp\b/.test(normalized)) {
    return 'HP'
  }
  if (normalized.includes('can tho') || /\bct\b/.test(normalized)) {
    return 'CT'
  }
  if (normalized.includes('binh duong') || /\bbd\b/.test(normalized)) {
    return 'BD'
  }
  if (normalized.includes('dong nai') || /\bdni\b/.test(normalized)) {
    return 'DNA'
  }
  if (normalized.includes('kho')) {
    return 'KHO'
  }

  // Fallback: Bóc tách từ đầu hoặc viết tắt (chỉ lấy chữ cái, bỏ số và ký tự lạ)
  const words = normalized
    .replace(/[^a-z\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length > 1) {
    return words
      .map((w) => w[0].toUpperCase())
      .join('')
      .slice(0, 4)
  }
  if (words.length === 1 && words[0].length >= 2) {
    return words[0].slice(0, 4).toUpperCase()
  }

  return 'GEN'
}

export const FLOOR_PATTERN = /(?:tầng|tang|floor|fl)\s*0*(\d+)/i

export function previewKioskId(location: string): string {
  const locSlug = extractLocationSlug(location)
  if (location) {
    const floorMatch = location.match(FLOOR_PATTERN)
    if (floorMatch && floorMatch[1]) {
      const floor = floorMatch[1].padStart(2, '0')
      return `KSK-${locSlug}-FL${floor}`
    }
  }
  return `KSK-${locSlug}-01`
}

export function extractDepartmentSlug(department: string): string {
  if (!department || !department.trim()) return 'GEN'
  const normalized = removeVietnameseTones(department.trim().toLowerCase())

  if (
    normalized.includes('ky thuat') ||
    normalized.includes('engineering') ||
    normalized.includes('eng') ||
    normalized.includes('tich hop')
  ) {
    return 'ENG'
  }
  if (
    normalized.includes('nhan su') ||
    normalized.includes('hr') ||
    normalized.includes('dao tao')
  ) {
    return 'HR'
  }
  if (
    normalized.includes('kinh doanh') ||
    normalized.includes('sales') ||
    normalized.includes('sal') ||
    normalized.includes('khach hang')
  ) {
    return 'SAL'
  }
  if (
    normalized.includes('ke toan') ||
    normalized.includes('tai chinh') ||
    normalized.includes('accounting') ||
    normalized.includes('acc')
  ) {
    return 'ACC'
  }
  if (
    normalized.includes('kho van') ||
    normalized.includes('logistics') ||
    normalized.includes('log') ||
    normalized.includes('kho')
  ) {
    return 'LOG'
  }
  if (
    normalized.includes('quan tri he thong') ||
    normalized.includes('it') ||
    normalized.includes('sys')
  ) {
    return 'IT'
  }
  if (
    normalized.includes('phap che') ||
    normalized.includes('bao mat') ||
    normalized.includes('dpo') ||
    normalized.includes('sec')
  ) {
    return 'SEC'
  }
  if (
    normalized.includes('giam doc') ||
    normalized.includes('bod') ||
    normalized.includes('exec')
  ) {
    return 'BOD'
  }
  if (normalized.includes('r&d') || normalized.includes('rd') || normalized.includes('nghien cuu')) {
    return 'RD'
  }

  // Fallback: Chữ cái đầu hoặc viết tắt
  const words = normalized
    .replace(/\bphong\b|\bban\b/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length > 1) {
    return words
      .map((w) => w[0].toUpperCase())
      .join('')
      .slice(0, 4)
  }
  if (words.length === 1 && words[0].length >= 2) {
    return words[0].slice(0, 4).toUpperCase()
  }

  return 'GEN'
}

export function previewEmployeeCode(department: string): string {
  const deptSlug = extractDepartmentSlug(department)
  const yearSuffix = new Date().getFullYear().toString().slice(-2)
  return `EMP-${deptSlug}-${yearSuffix}xxxx`
}
