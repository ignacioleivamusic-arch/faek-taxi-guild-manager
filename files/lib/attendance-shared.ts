const ATTENDANCE_CODE_LENGTH = 4
const ATTENDANCE_CODE_ALPHABET = '0123456789'

export function generateAttendanceCode() {
  const values = new Uint32Array(ATTENDANCE_CODE_LENGTH)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') crypto.getRandomValues(values)
  return Array.from(values, (value) => ATTENDANCE_CODE_ALPHABET[value % ATTENDANCE_CODE_ALPHABET.length]).join('')
}

export function isAttendanceCode(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9]{4}$/.test(value)
}
