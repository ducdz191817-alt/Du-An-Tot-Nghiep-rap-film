/**
 * pricingEngine.js – Tính giá vé tự động
 * Key thứ trong tuần: sun/mon/tue/wed/thu/fri/sat (tránh key số)
 */

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function getTimeSlot(startTime) {
  const vnHour = (startTime.getUTCHours() + 7) % 24;
  if (vnHour >= 17 && vnHour < 22) return 'evening';
  if (vnHour >= 22) return 'latenight';
  return 'morning';
}

function getDayType(startTime, holidays = []) {
  const vnDate = new Date(startTime.getTime() + 7 * 60 * 60 * 1000);
  const yyyy = vnDate.getUTCFullYear();
  const mm   = String(vnDate.getUTCMonth() + 1).padStart(2, '0');
  const dd   = String(vnDate.getUTCDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;
  if (holidays.includes(dateStr)) return 'holiday';
  const dow = vnDate.getUTCDay();
  if (dow === 0 || dow === 6) return 'weekend';
  return 'weekday';
}

function getWeekdayKey(startTime) {
  const vnDate = new Date(startTime.getTime() + 7 * 60 * 60 * 1000);
  return WEEKDAY_KEYS[vnDate.getUTCDay()]; // 'sun','mon',...
}

// Dùng cho UI (trả về số 0-6)
function getWeekday(startTime) {
  const vnDate = new Date(startTime.getTime() + 7 * 60 * 60 * 1000);
  return vnDate.getUTCDay();
}

function calculateTicketPrice({ startTime, format = '2D', roomType = 'standard', seatType = 'standard', config }) {
  if (!config) throw new Error('Thiếu PricingConfig');

  const dayType     = getDayType(startTime, config.holidays || []);
  const wdKey       = getWeekdayKey(startTime);
  const timeSlot    = getTimeSlot(startTime);

  const base        = config.basePrice?.[dayType]                ?? 90000;
  const weekdayExtra = config.weekdaySurcharge?.[wdKey]          ?? 0;
  const timeExtra   = config.timeSlotSurcharge?.[timeSlot]       ?? 0;
  const formatKey   = ['2D','3D','IMAX','GOLDCLASS'].includes(format) ? format : '2D';
  const formatExtra = config.formatSurcharge?.[formatKey]        ?? 0;
  const roomKey     = ['standard','premium','dolby'].includes(roomType) ? roomType : 'standard';
  const roomExtra   = config.roomTypeSurcharge?.[roomKey]        ?? 0;
  const seatKey     = ['standard','vip','couple'].includes(seatType) ? seatType : 'standard';
  const seatExtra   = config.seatTypeSurcharge?.[seatKey]        ?? 0;

  return base + weekdayExtra + timeExtra + formatExtra + roomExtra + seatExtra;
}

function calculateBaseShowtimePrice({ startTime, format = '2D', roomType = 'standard', config }) {
  return calculateTicketPrice({ startTime, format, roomType, seatType: 'standard', config });
}

function getPriceBreakdown({ startTime, format = '2D', roomType = 'standard', seatType = 'standard', config }) {
  if (!config) return null;

  const dayType     = getDayType(startTime, config.holidays || []);
  const wdKey       = getWeekdayKey(startTime);
  const weekday     = getWeekday(startTime);
  const timeSlot    = getTimeSlot(startTime);

  const base        = config.basePrice?.[dayType]                ?? 90000;
  const weekdayExtra = config.weekdaySurcharge?.[wdKey]          ?? 0;
  const timeExtra   = config.timeSlotSurcharge?.[timeSlot]       ?? 0;
  const formatKey   = ['2D','3D','IMAX','GOLDCLASS'].includes(format) ? format : '2D';
  const formatExtra = config.formatSurcharge?.[formatKey]        ?? 0;
  const roomKey     = ['standard','premium','dolby'].includes(roomType) ? roomType : 'standard';
  const roomExtra   = config.roomTypeSurcharge?.[roomKey]        ?? 0;
  const seatKey     = ['standard','vip','couple'].includes(seatType) ? seatType : 'standard';
  const seatExtra   = config.seatTypeSurcharge?.[seatKey]        ?? 0;

  return {
    dayType, timeSlot, weekday, wdKey,
    breakdown: { base, weekdayExtra, timeExtra, formatExtra, roomExtra, seatExtra },
    total: base + weekdayExtra + timeExtra + formatExtra + roomExtra + seatExtra,
  };
}

module.exports = { calculateTicketPrice, calculateBaseShowtimePrice, getPriceBreakdown, getDayType, getTimeSlot, getWeekday, getWeekdayKey, WEEKDAY_KEYS };
