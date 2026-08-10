import React, { useState } from 'react';
import { Printer, X } from 'lucide-react';

export const PrintTicketModal = ({ booking, onClose }) => {
  if (!booking) return null;

  const showtime = booking.showtime || {};
  const movie = showtime.movie || {};
  const theater = showtime.theater || {};
  const room = showtime.room || {};
  const user = booking.user || {};
  const code = booking.ticketCode || `TKT-${String(booking._id).slice(-8).toUpperCase()}`;

  const allSeats = booking.seats && booking.seats.length > 0 ? booking.seats : [];
  const concessions = (booking.concessions || []).filter((c) => c.quantity > 0);

  const [selectedSeats, setSelectedSeats] = useState([...allSeats]);
  const [includeConcessions, setIncludeConcessions] = useState(concessions.length > 0);

  // Calculate individual seat prices
  const basePrice = showtime.ticketPrice || showtime.price || 0;
  const roomSeats = room.seats || [];
  const discountAmount = booking.discountAmount || 0;
  const totalPrice = booking.totalPrice || 0;
  const originalTotal = totalPrice + discountAmount;
  const concessionSubtotal = concessions.reduce((acc, c) => acc + ((c.concession?.price || 0) * (c.quantity || 0)), 0);
  const ticketSubtotal = Math.max(0, originalTotal - concessionSubtotal);

  const getSeatPrice = (seatCode) => {
    const match = seatCode.match(/^([A-Z]+)(\d+)$/);
    let seatType = 'standard';
    let extraPrice = 0;
    let multiplier = 1;

    if (match) {
      const rName = match[1];
      const num = parseInt(match[2], 10);
      const found = roomSeats.find((s) => s.row === rName && s.number === num);
      if (found) {
        seatType = found.type || 'standard';
        extraPrice = found.price || 0;
        multiplier = seatType === 'couple' ? 2 : 1;
      }
    }

    if (basePrice > 0) {
      return (basePrice * multiplier) + extraPrice;
    }
    return Math.round(ticketSubtotal / (allSeats.length || 1));
  };

  const toggleSeat = (seatCode) => {
    setSelectedSeats((prev) =>
      prev.includes(seatCode) ? prev.filter((s) => s !== seatCode) : [...prev, seatCode]
    );
  };

  const toggleAllSeats = () => {
    if (selectedSeats.length === allSeats.length && (includeConcessions || concessions.length === 0)) {
      setSelectedSeats([]);
      setIncludeConcessions(false);
    } else {
      setSelectedSeats([...allSeats]);
      if (concessions.length > 0) setIncludeConcessions(true);
    }
  };

  const totalPagesToPrint = selectedSeats.length + (includeConcessions && concessions.length > 0 ? 1 : 0);

  const fmt = (num) => (num || 0).toLocaleString('vi-VN') + 'đ';

  const printStyles = `
    @media print {
      body * {
        visibility: hidden !important;
      }
      .print-ticket-container, .print-ticket-container * {
        visibility: visible !important;
      }
      .print-ticket-container {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .print-ticket-slip {
        page-break-after: always !important;
        break-after: page !important;
        box-shadow: none !important;
        border: 1px solid #333 !important;
        background: #fff !important;
        color: #000 !important;
        margin-bottom: 0 !important;
      }
      .no-print-btn {
        display: none !important;
      }
    }
  `;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <style>{printStyles}</style>

      <div
        className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 border border-gray-200 my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b pb-3 no-print-btn">
          <div>
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <Printer size={18} className="text-brand" /> Mẫu In Vé & Bắp Nước
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Mỗi vé / phiếu bắp nước sẽ tự động in trên 1 trang riêng biệt
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Selection panel for individual print items */}
        <div className="no-print-btn bg-gray-50 border border-gray-200 rounded-2xl p-3.5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between font-extrabold text-gray-800 border-b border-gray-200 pb-2">
            <span>Tùy chọn mục cần in:</span>
            <button
              type="button"
              onClick={toggleAllSeats}
              className="text-brand text-[11px] font-bold hover:underline flex items-center gap-1"
            >
              {selectedSeats.length === allSeats.length && (includeConcessions || concessions.length === 0) ? (
                <>Bỏ chọn tất cả</>
              ) : (
                <>Chọn tất cả</>
              )}
            </button>
          </div>

          {/* Vé xem phim từng ghế */}
          {allSeats.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Vé xem phim ({allSeats.length} ghế):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allSeats.map((seatCode) => {
                  const isChecked = selectedSeats.includes(seatCode);
                  const price = getSeatPrice(seatCode);
                  return (
                    <label
                      key={seatCode}
                      className={`flex items-center justify-between gap-2 p-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                          : 'bg-white border-gray-200 text-gray-400 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSeat(seatCode)}
                          className="accent-brand rounded"
                        />
                        <span>Ghế {seatCode}</span>
                      </div>
                      <span className="text-[10px] font-black text-brand">{fmt(price)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Phiếu bắp nước */}
          {concessions.length > 0 && (
            <div className="pt-2 border-t border-gray-200 space-y-1.5">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Đồ ăn & Bắp nước:
              </span>
              <label
                className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  includeConcessions
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                    : 'bg-white border-gray-200 text-gray-400 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeConcessions}
                    onChange={(e) => setIncludeConcessions(e.target.checked)}
                    className="accent-emerald-600 rounded"
                  />
                  <span>Phiếu đổi bắp nước ({concessions.map((c) => `${c.concession?.name || 'Món'} x${c.quantity}`).join(', ')})</span>
                </div>
                <span className="text-[10px] font-black text-emerald-700">{fmt(concessionSubtotal)}</span>
              </label>
            </div>
          )}
        </div>

        {/* Scrollable Printable Container */}
        <div className="print-ticket-container overflow-y-auto space-y-4 pr-1 max-h-[50vh]">
          {totalPagesToPrint === 0 ? (
            <div className="text-center py-8 text-gray-400 font-medium text-xs border border-dashed rounded-2xl">
              Vui lòng chọn ít nhất 1 vé hoặc phiếu bắp nước để xem bản in
            </div>
          ) : (
            <>
              {/* Printable Movie Seats (1 page per seat) */}
              {allSeats
                .filter((seatCode) => selectedSeats.includes(seatCode))
                .map((seatCode, index) => {
                  const price = getSeatPrice(seatCode);
                  return (
                    <div
                      key={seatCode}
                      className="print-ticket-slip border-2 border-dashed border-gray-300 p-5 rounded-2xl space-y-4 font-mono text-xs bg-amber-50/30 relative"
                    >
                      <div className="text-center space-y-1 border-b border-dashed border-gray-300 pb-3">
                        <h3 className="font-black text-base uppercase text-gray-900 tracking-wider">NOVA CINEMA</h3>
                        <p className="text-[10px] text-gray-500">{theater.name || 'Rạp Nova Cinema'}</p>
                        <p className="text-[10px] font-bold text-brand mt-1">{code}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="font-black text-sm text-gray-900 uppercase">{movie.title || 'Phim'}</div>
                        <div className="flex justify-between text-gray-700">
                          <span>Định dạng:</span>
                          <span className="font-bold">{showtime.format || '2D'}</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                          <span>Suất chiếu:</span>
                          <span className="font-bold">
                            {showtime.startTime ? new Date(showtime.startTime).toLocaleString('vi-VN') : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                          <span>Phòng chiếu:</span>
                          <span className="font-bold">{room.name || 'Phòng 1'}</span>
                        </div>

                        {/* Vị trí ghế duy nhất của tờ vé này */}
                        <div className="flex justify-between items-center text-gray-700 text-sm bg-amber-100/60 p-2.5 rounded-xl border border-amber-300/70 my-1">
                          <span className="font-bold text-gray-800">VỊ TRÍ GHẾ:</span>
                          <span className="font-black text-brand text-lg tracking-wider">{seatCode}</span>
                        </div>

                        <div className="flex justify-between text-gray-700 border-t border-dashed border-gray-300 pt-2">
                          <span>Khách hàng:</span>
                          <span className="font-bold">{user.username || 'Khách vãng lai'}</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                          <span>Giá vé ghế này:</span>
                          <span className="font-black text-gray-900">{fmt(price)}</span>
                        </div>
                      </div>

                      {/* Barcode / QR placeholder */}
                      <div className="text-center pt-2 border-t border-dashed border-gray-300 space-y-1">
                        <div className="font-mono text-[10px] tracking-widest text-gray-400">||| | |||| ||| || ||||| |||</div>
                        <p className="text-[9px] text-gray-400">Vui lòng xuất trình vé này khi vào phòng chiếu (Ghế {seatCode})</p>
                      </div>
                    </div>
                  );
                })}

              {/* Printable Concession Stub (1 page for all snacks) */}
              {includeConcessions && concessions.length > 0 && (
                <div className="print-ticket-slip border-2 border-dashed border-emerald-400 p-5 rounded-2xl space-y-4 font-mono text-xs bg-emerald-50/40 relative">
                  <div className="text-center space-y-1 border-b border-dashed border-emerald-300 pb-3">
                    <span className="bg-emerald-600 text-white font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      PHIẾU ĐỔI BẮP NƯỚC & ĐỒ ĂN
                    </span>
                    <h3 className="font-black text-base uppercase text-gray-900 tracking-wider pt-1">NOVA CINEMA</h3>
                    <p className="text-[10px] text-gray-500">{theater.name || 'Rạp Nova Cinema'}</p>
                    <p className="text-[10px] font-bold text-emerald-700 mt-1">{code}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-700">
                      <span>Khách hàng:</span>
                      <span className="font-bold">{user.username || 'Khách vãng lai'}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Phim:</span>
                      <span className="font-bold">{movie.title || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Suất chiếu:</span>
                      <span className="font-bold">
                        {showtime.startTime ? new Date(showtime.startTime).toLocaleString('vi-VN') : 'N/A'}
                      </span>
                    </div>

                    <div className="border-t border-b border-dashed border-emerald-300 py-2.5 my-2 space-y-1.5">
                      <span className="font-bold text-gray-900 text-xs block">DANH SÁCH MÓN ĐÃ ĐẶT:</span>
                      {concessions.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-gray-900 text-xs font-bold pl-1">
                          <span>• {item.concession?.name || 'Món'} x{item.quantity}</span>
                          <span>{fmt((item.concession?.price || 0) * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between text-gray-800 text-sm font-black pt-1">
                      <span>TỔNG TIỀN BẮP NƯỚC:</span>
                      <span className="text-emerald-700">{fmt(concessionSubtotal)}</span>
                    </div>
                  </div>

                  <div className="text-center pt-3 border-t border-dashed border-emerald-300 space-y-1">
                    <div className="font-mono text-[9px] text-gray-400 tracking-widest uppercase">
                      ||||| ||||||| ||||| ||||||| |||||
                    </div>
                    <p className="text-[10px] text-emerald-800 font-bold">
                      Vui lòng xuất trình phiếu này tại Quầy Bắp Nước để nhận đồ ăn/thức uống.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="flex gap-2 pt-2 border-t no-print-btn">
          <button
            type="button"
            disabled={totalPagesToPrint === 0}
            onClick={() => window.print()}
            className="flex-1 py-3 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-hover transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer size={16} /> In {totalPagesToPrint} trang đã chọn ra máy in
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintTicketModal;
