/**
 * pricingEngine.js – Tính giá vé tự động
 * Key thứ trong tuần: sun/mon/tue/wed/thu/fri/sat (tránh key số)
 */

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// Xác định khung giờ: Sáng, Tối (sau 17h), Khuya (sau 22h)
function getTimeSlot(startTime) {
  const vnHour = (startTime.getUTCHours() + 7) % 24;
  if (vnHour >= 17 && vnHour < 22) return 'evening';
  if (vnHour >= 22) return 'latenight';
  return 'morning';
}

// Phân loại ngày: Lễ, Cuối tuần (T7, CN), Ngày thường
function getDayType(startTime, holidays = []) {
  const vnDate = new Date(startTime.getTime() + 7 * 60 * 60 * 1000);
  const yyyy = vnDate.getUTCFullYear();
  const mm   = String(vnDate.getUTCMonth() + 1).padStart(2, '0');
  const dd   = String(vnDate.getUTCDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;
  // Kiểm tra ngày lễ
  if (holidays.includes(dateStr)) return 'holiday';
  
  const dow = vnDate.getUTCDay();
  // Kiểm tra cuối tuần
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

// Thuật toán: Giá cuối cùng = Giá cơ bản + Phụ thu (Ngày + Giờ + Phim + Phòng + Ghế) - Giảm giá phim cũ
function calculateTicketPrice({ startTime, format = '2D', roomType = 'standard', seatType = 'standard', config, movieReleaseDate }) {
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

  // [GHI CHÚ BẢO VỆ ĐỒ ÁN] - DYNAMIC PRICING (PHIM GIẢM NHIỆT)
  // Ý tưởng: Phim chiếu càng lâu, sức hút càng giảm -> Cần giảm giá vé để kích cầu.
  let lifespanDiscount = 0;
  if (movieReleaseDate) {
    // Đổi ngày khởi chiếu và ngày chiếu suất này ra milliseconds
    const releaseTime = new Date(movieReleaseDate).getTime();
    const showTime = new Date(startTime).getTime();
    
    // Tính khoảng cách bằng Ngày = (Thời gian chiếu - Thời gian khởi chiếu) / (1 ngày = 86400000 ms)
    const daysSinceRelease = (showTime - releaseTime) / (1000 * 60 * 60 * 24);
    
    if (daysSinceRelease >= 30) {
      // Phim đã ra rạp trên 1 tháng (30 ngày) -> Trừ thẳng 20.000 VNĐ vào giá gốc
      lifespanDiscount = -20000; 
    } else if (daysSinceRelease >= 14) {
      // Phim đã ra rạp trên 2 tuần (14 ngày) -> Trừ thẳng 10.000 VNĐ vào giá gốc
      lifespanDiscount = -10000; 
    }
  }

  // Cộng gộp tất cả: Giá gốc + phụ thu ngày + phụ thu giờ + phòng + ghế + (trừ tiền phim cũ)
  const finalPrice = base + weekdayExtra + timeExtra + formatExtra + roomExtra + seatExtra + lifespanDiscount;
  return Math.max(0, finalPrice);
}

// Hàm tính giá vé lúc Admin mới tạo lịch chiếu (chưa tính loại ghế vì khách chưa chọn)
function calculateBaseShowtimePrice({ startTime, format = '2D', roomType = 'standard', config, movieReleaseDate }) {
  return calculateTicketPrice({ startTime, format, roomType, seatType: 'standard', config, movieReleaseDate });
}

function getPriceBreakdown({ startTime, format = '2D', roomType = 'standard', seatType = 'standard', config, movieReleaseDate }) {
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

  // [GHI CHÚ BẢO VỆ ĐỒ ÁN] - DYNAMIC PRICING (PHIM GIẢM NHIỆT)
  // Thực hiện tương tự hàm calculateTicketPrice ở trên, dùng để xem trước (preview) hoặc xem chi tiết cấu thành giá
  let lifespanDiscount = 0;
  if (movieReleaseDate) {
    const releaseTime = new Date(movieReleaseDate).getTime();
    const showTime = new Date(startTime).getTime();
    const daysSinceRelease = (showTime - releaseTime) / (1000 * 60 * 60 * 24);
    
    if (daysSinceRelease >= 30) {
      lifespanDiscount = -20000;
    } else if (daysSinceRelease >= 14) {
      lifespanDiscount = -10000;
    }
  }

  // Đảm bảo giá không bao giờ bị âm (bằng hàm Math.max)
  const finalPrice = Math.max(0, base + weekdayExtra + timeExtra + formatExtra + roomExtra + seatExtra + lifespanDiscount);

  return {
    dayType, timeSlot, weekday, wdKey,
    breakdown: { base, weekdayExtra, timeExtra, formatExtra, roomExtra, seatExtra, lifespanDiscount },
    total: finalPrice,
  };
}

module.exports = { calculateTicketPrice, calculateBaseShowtimePrice, getPriceBreakdown, getDayType, getTimeSlot, getWeekday, getWeekdayKey, WEEKDAY_KEYS };
