import { describe, it, expect } from 'vitest'
import {
  previewShiftCode,
  previewKioskId,
  previewEmployeeCode,
  removeVietnameseTones,
  extractShiftSlug,
  extractLocationSlug,
  extractDepartmentSlug,
} from '@/utils/codePreview'

describe('codePreview utility tests', () => {
  describe('removeVietnameseTones', () => {
    it('loại bỏ dấu tiếng Việt chính xác', () => {
      expect(removeVietnameseTones('Hành chính')).toBe('Hanh chinh')
      expect(removeVietnameseTones('Kỹ thuật & Tích hợp')).toBe('Ky thuat & Tich hop')
      expect(removeVietnameseTones('Đà Nẵng')).toBe('Da Nang')
      expect(removeVietnameseTones('Hồ Chí Minh')).toBe('Ho Chi Minh')
    })
  })

  describe('previewShiftCode', () => {
    it('sinh mã ca hành chính 08:00 - 17:00 đúng chuẩn SHF-HC-0817', () => {
      expect(previewShiftCode('Hành chính', '08:00', '17:00')).toBe('SHF-HC-0817')
      expect(previewShiftCode('Ca Hành Chính', '08:00', '17:00')).toBe('SHF-HC-0817')
    })

    it('sinh mã ca sáng 06:00 - 14:00 đúng chuẩn SHF-SANG-0614', () => {
      expect(previewShiftCode('Ca Sáng', '06:00', '14:00')).toBe('SHF-SANG-0614')
    })

    it('sinh mã ca chiều 14:00 - 22:00 đúng chuẩn SHF-CHIEU-1422', () => {
      expect(previewShiftCode('Ca Chiều', '14:00', '22:00')).toBe('SHF-CHIEU-1422')
    })

    it('sinh mã ca đêm 22:00 - 06:00 đúng chuẩn SHF-DEM-2206', () => {
      expect(previewShiftCode('Ca Đêm', '22:00', '06:00')).toBe('SHF-DEM-2206')
    })

    it('xử lý ca có số phút lẻ như 08:30 - 17:30', () => {
      expect(previewShiftCode('Ca Gãy', '08:30', '17:30')).toBe('SHF-GAY-08301730')
    })

    it('fallback khi tên ca rỗng hoặc không có giờ', () => {
      expect(extractShiftSlug('')).toBe('CA')
      expect(previewShiftCode('', '', '')).toBe('SHF-CA-0000')
    })
  })

  describe('previewKioskId', () => {
    it('nhận diện các thành phố lớn Hà Nội, TP.HCM, Đà Nẵng, Bắc Ninh', () => {
      expect(extractLocationSlug('Hà Nội')).toBe('HN')
      expect(previewKioskId('Hà Nội')).toBe('KSK-HN-01')
      expect(previewKioskId('Cổng chính Hà Nội')).toBe('KSK-HN-01')
      expect(previewKioskId('Tòa nhà Bitexco, TP.HCM')).toBe('KSK-HCM-01')
      expect(previewKioskId('Văn phòng Hồ Chí Minh')).toBe('KSK-HCM-01')
      expect(previewKioskId('Chi nhánh Đà Nẵng')).toBe('KSK-DN-01')
      expect(previewKioskId('Khu công nghiệp Bắc Ninh')).toBe('KSK-BN-01')
    })

    it('nhận diện kho bãi và địa điểm đặc thù', () => {
      expect(previewKioskId('Kho tổng')).toBe('KSK-KHO-01')
      expect(previewKioskId('Kho vận Long Biên')).toBe('KSK-KHO-01')
    })

    it('nhận diện tầng theo FLOOR_PATTERN (Tầng / Floor / FL)', () => {
      expect(previewKioskId('Tòa nhà A - Tầng 2')).toBe('KSK-TNAT-FL02')
      expect(previewKioskId('Cổng chính Hà Nội - Floor 5')).toBe('KSK-HN-FL05')
      expect(previewKioskId('Tòa nhà Bitexco, TP.HCM, Tang 12')).toBe('KSK-HCM-FL12')
      expect(previewKioskId('Văn phòng Đà Nẵng FL 3')).toBe('KSK-DN-FL03')
    })

    it('fallback chuẩn khi không khớp thành phố', () => {
      expect(previewKioskId('')).toBe('KSK-GEN-01')
      expect(previewKioskId('Phòng họp số 3')).toBe('KSK-PHS-01')
    })
  })

  describe('previewEmployeeCode', () => {
    const yearSuffix = new Date().getFullYear().toString().slice(-2)

    it('sinh mã nhân viên kỹ thuật chuẩn EMP-ENG-26xxxx', () => {
      expect(previewEmployeeCode('Phòng Kỹ thuật')).toBe(`EMP-ENG-${yearSuffix}xxxx`)
      expect(previewEmployeeCode('Phòng Kỹ thuật & Tích hợp')).toBe(`EMP-ENG-${yearSuffix}xxxx`)
    })

    it('sinh mã nhân viên nhân sự chuẩn EMP-HR-26xxxx', () => {
      expect(previewEmployeeCode('Phòng Nhân sự')).toBe(`EMP-HR-${yearSuffix}xxxx`)
      expect(previewEmployeeCode('Phòng Nhân sự & Đào tạo')).toBe(`EMP-HR-${yearSuffix}xxxx`)
    })

    it('sinh mã nhân viên kinh doanh chuẩn EMP-SAL-26xxxx', () => {
      expect(previewEmployeeCode('Phòng Kinh doanh')).toBe(`EMP-SAL-${yearSuffix}xxxx`)
      expect(previewEmployeeCode('Phòng Kinh doanh & Khách hàng')).toBe(`EMP-SAL-${yearSuffix}xxxx`)
    })

    it('sinh mã nhân viên kế toán tài chính chuẩn EMP-ACC-26xxxx', () => {
      expect(previewEmployeeCode('Phòng Kế toán')).toBe(`EMP-ACC-${yearSuffix}xxxx`)
      expect(previewEmployeeCode('Phòng Kế toán - Tài chính')).toBe(`EMP-ACC-${yearSuffix}xxxx`)
    })

    it('sinh mã phòng ban kho vận và R&D', () => {
      expect(previewEmployeeCode('Phòng Kho vận & Logistics')).toBe(`EMP-LOG-${yearSuffix}xxxx`)
      expect(previewEmployeeCode('Trung tâm R&D')).toBe(`EMP-RD-${yearSuffix}xxxx`)
    })

    it('fallback khi phòng ban rỗng', () => {
      expect(extractDepartmentSlug('')).toBe('GEN')
      expect(previewEmployeeCode('')).toBe(`EMP-GEN-${yearSuffix}xxxx`)
    })
  })
})
