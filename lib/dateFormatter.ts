/**
 * Date Formatter Utility
 * รองรับการ format วันที่ในรูปแบบต่างๆ สำหรับระบบ Order Report
 */

// เดือนไทยเต็ม
const THAI_MONTHS_FULL: { [key: string]: string } = {
  '01': 'มกราคม', '02': 'กุมภาพันธ์', '03': 'มีนาคม',
  '04': 'เมษายน', '05': 'พฤษภาคม', '06': 'มิถุนายน',
  '07': 'กรกฎาคม', '08': 'สิงหาคม', '09': 'กันยายน',
  '10': 'ตุลาคม', '11': 'พฤศจิกายน', '12': 'ธันวาคม'
}

// เดือนไทยย่อ
const THAI_MONTHS_SHORT: { [key: string]: string } = {
  '01': 'ม.ค.', '02': 'ก.พ.', '03': 'มี.ค.',
  '04': 'เม.ย.', '05': 'พ.ค.', '06': 'มิ.ย.',
  '07': 'ก.ค.', '08': 'ส.ค.', '09': 'ก.ย.',
  '10': 'ต.ค.', '11': 'พ.ย.', '12': 'ธ.ค.'
}

// เดือนอังกฤษเต็ม
const ENG_MONTHS_FULL: { [key: string]: string } = {
  '01': 'January', '02': 'February', '03': 'March',
  '04': 'April', '05': 'May', '06': 'June',
  '07': 'July', '08': 'August', '09': 'September',
  '10': 'October', '11': 'November', '12': 'December'
}

// เดือนอังกฤษย่อ
const ENG_MONTHS_SHORT: { [key: string]: string } = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar',
  '04': 'Apr', '05': 'May', '06': 'Jun',
  '07': 'Jul', '08': 'Aug', '09': 'Sep',
  '10': 'Oct', '11': 'Nov', '12': 'Dec'
}

export type DateFormatType = 
  | 'th_full_be_full'   // มกราคม 2568
  | 'th_short_be_short' // ม.ค. 68
  | 'th_full_ad_full'   // มกราคม 2025
  | 'th_short_ad_short' // ม.ค. 25
  | 'en_full_be_full'   // January 2568
  | 'en_short_be_short' // Jan 68
  | 'en_full_ad_full'   // January 2025
  | 'en_short_ad_short' // Jan 25

/**
 * แปลง YYYY-MM เป็นรูปแบบที่ต้องการ
 * 
 * @param monthString รูปแบบ "2025-01"
 * @param format รูปแบบที่ต้องการ (default: 'th_full_be_full')
 * @returns string เช่น "มกราคม 2568"
 * 
 * @example
 * formatMonthLabel('2025-01', 'th_full_be_full')  // "มกราคม 2568"
 * formatMonthLabel('2025-01', 'th_short_be_short') // "ม.ค. 68"
 * formatMonthLabel('2025-01', 'en_full_be_full')   // "January 2568"
 * formatMonthLabel('2025-01', 'en_short_ad_short') // "Jan 25"
 */
export function formatMonthLabel(
  monthString: string, 
  format: DateFormatType = 'th_full_be_full'
): string {
  const [year, month] = monthString.split('-')
  const yearNum = parseInt(year)

  // เลือกเดือน
  let monthName = ''
  if (format.startsWith('th_full')) {
    monthName = THAI_MONTHS_FULL[month]
  } else if (format.startsWith('th_short')) {
    monthName = THAI_MONTHS_SHORT[month]
  } else if (format.startsWith('en_full')) {
    monthName = ENG_MONTHS_FULL[month]
  } else if (format.startsWith('en_short')) {
    monthName = ENG_MONTHS_SHORT[month]
  }

  // เลือกปี
  let yearStr = ''
  if (format.includes('_be_full')) {
    yearStr = String(yearNum + 543) // พ.ศ. เต็ม
  } else if (format.includes('_be_short')) {
    yearStr = String(yearNum + 543).slice(-2) // พ.ศ. ย่อ
  } else if (format.includes('_ad_full')) {
    yearStr = String(yearNum) // ค.ศ. เต็ม
  } else if (format.includes('_ad_short')) {
    yearStr = String(yearNum).slice(-2) // ค.ศ. ย่อ
  }

  return `${monthName} ${yearStr}`
}

/**
 * แปลงวันที่เต็ม YYYY-MM-DD เป็น DD/MM/YYYY พ.ศ.
 * 
 * @param dateString รูปแบบ "2025-01-14"
 * @returns string เช่น "14/01/2568"
 * 
 * @example
 * formatFullDate('2025-01-14') // "14/01/2568"
 */
export function formatFullDate(dateString: string): string {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear() + 543
    
    return `${day}/${month}/${year}`
  } catch {
    return ''
  }
}

/**
 * ตรวจสอบว่า format ที่ส่งมาถูกต้องหรือไม่
 */
export function isValidDateFormat(format: string): format is DateFormatType {
  const validFormats: DateFormatType[] = [
    'th_full_be_full',
    'th_short_be_short',
    'th_full_ad_full',
    'th_short_ad_short',
    'en_full_be_full',
    'en_short_be_short',
    'en_full_ad_full',
    'en_short_ad_short'
  ]
  return validFormats.includes(format as DateFormatType)
}

/**
 * รายการ format ทั้งหมดที่รองรับ พร้อมตัวอย่าง
 */
export const DATE_FORMAT_EXAMPLES = {
  'th_full_be_full': 'มกราคม 2568',
  'th_short_be_short': 'ม.ค. 68',
  'th_full_ad_full': 'มกราคม 2025',
  'th_short_ad_short': 'ม.ค. 25',
  'en_full_be_full': 'January 2568',
  'en_short_be_short': 'Jan 68',
  'en_full_ad_full': 'January 2025',
  'en_short_ad_short': 'Jan 25'
}
