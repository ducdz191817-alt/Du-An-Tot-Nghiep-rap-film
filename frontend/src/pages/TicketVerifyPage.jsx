import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Ticket,
  MapPin,
  Calendar,
  Users,
  Clock,
  Film,
  CreditCard,
  ArrowLeft,
  ShoppingBag,
} from 'lucide-react';
import bookingService from '../services/booking.service';

// Bảng ánh xạ nhãn phương thức thanh toán
const PAYMENT_METHOD_LABEL = {
  card: 'Thẻ tín dụng / Ghi nợ',
  vnpay: 'VNPay',
  momo: 'Ví MoMo',
  vietqr: 'VietQR Chuyển khoản',
  cash: 'Tiền mặt',
};

// Bảng ánh xạ trạng thái vé sang màu / nhãn
const TICKET_STATUS_CONFIG = {
  issued: {
    label: 'VÉ HỢP LỆ — CHƯA SỬ DỤNG',
    color: 'emerald',
    icon: CheckCircle2,
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    glow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]',
  },
  checked_in: {
    label: 'VÉ ĐÃ ĐƯỢC SỬ DỤNG',
    color: 'amber',
    icon: AlertTriangle,
    bar: 'bg-amber-500',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.15)]',
  },
  cancelled: {
    label: 'VÉ ĐÃ BỊ HỦY / THANH TOÁN THẤT BẠI',
    color: 'red',
    icon: XCircle,
    bar: 'bg-red-500',
    badge: 'bg-red-500/10 text-red-400 border-red-500/30',
    glow: 'shadow-[0_0_30px_rgba(239,68,68,0.15)]',
  },
  pending: {
    label: 'VÉ CHƯA HOÀN TẤT THANH TOÁN',
    color: 'amber',
    icon: Clock,
    bar: 'bg-amber-500',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.15)]',
  },
};

const InfoRow = ({ icon: Icon, label, value, accent = false }) => (
  <div className="flex items-start justify-between gap-3 px-4 py-3">
    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider shrink-0 mt-0.5">
      <Icon size={12} />
      {label}
    </div>
    <div className={`text-xs font-semibold text-right leading-snug ${accent ? 'text-brand font-black text-sm' : 'text-zinc-300'}`}>
      {value}
    </div>
  </div>
);

export const TicketVerifyPage = () => {
  const { ticketCode } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState('loading'); // 'loading' | 'found' | 'not_found' | 'error'
  const [ticketData, setTicketData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchTicket = async () => {
      if (!ticketCode) {
        setStatus('not_found');
        return;
      }
      try {
        const result = await bookingService.verifyTicket(ticketCode);
        if (result?.success && result?.data) {
          setTicketData(result.data);
          setStatus('found');
        } else {
          setStatus('not_found');
        }
      } catch (err) {
        if (err?.response?.status === 404) {
          setStatus('not_found');
          setErrorMsg('Không tìm thấy vé với mã này.');
        } else {
          setStatus('error');
          setErrorMsg(err?.message || 'Lỗi hệ thống khi tra cứu vé.');
        }
      }
    };
    fetchTicket();
  }, [ticketCode]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0d0d14]">
        <Loader2 className="w-12 h-12 text-brand animate-spin" />
        <p className="text-zinc-400 font-bold text-sm">Đang tra cứu thông tin vé...</p>
        <p className="text-zinc-600 text-xs font-mono">{ticketCode}</p>
      </div>
    );
  }

  // ── Not found / Error ────────────────────────────────────────────────────────
  if (status === 'not_found' || status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#0d0d14] px-4">
        <div className="bg-[#13131c] border border-zinc-800 rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
            <XCircle size={36} />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-white">Không tìm thấy vé</h2>
            <p className="text-xs text-zinc-500 font-semibold">
              {errorMsg || 'Mã vé không hợp lệ hoặc không tồn tại trong hệ thống.'}
            </p>
            <p className="font-mono text-xs text-zinc-600 mt-2 bg-zinc-900 px-3 py-1 rounded-lg inline-block">{ticketCode}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 mx-auto text-zinc-400 hover:text-white text-sm font-bold transition-colors"
          >
            <ArrowLeft size={16} /> Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  // ── Found ────────────────────────────────────────────────────────────────────
  const ticket = ticketData;
  let computedStatus = 'issued';
  if (ticket.paymentStatus === 'failed' || ticket.ticketStatus === 'cancelled') {
    computedStatus = 'cancelled';
  } else if (ticket.paymentStatus === 'pending' || ticket.ticketStatus === 'pending') {
    computedStatus = 'pending';
  } else if (ticket.isCheckedIn || ticket.ticketStatus === 'checked_in') {
    computedStatus = 'checked_in';
  }
  const config = TICKET_STATUS_CONFIG[computedStatus] || TICKET_STATUS_CONFIG.pending;
  const StatusIcon = config.icon;

  const startTime = ticket.showtime?.startTime ? new Date(ticket.showtime.startTime) : null;
  const dateStr = startTime?.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' }) || '---';
  const timeStr = startTime?.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) || '---';

  const checkedInAtStr = ticket.checkedInAt
    ? new Date(ticket.checkedInAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-[#0d0d14] flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-4">

        {/* Header */}
        <div className="text-center mb-2">
          <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Nova Cinematic</p>
          <h1 className="text-lg font-black text-zinc-300 mt-1">Xác Minh Vé Điện Tử</h1>
        </div>

        {/* Status Card */}
        <div className={`bg-[#13131c] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl ${config.glow}`}>
          {/* Colored top bar */}
          <div className={`h-1.5 ${config.bar}`} />

          <div className="p-6 space-y-5">

            {/* Status badge */}
            <div className="flex flex-col items-center gap-3">
              <div className={`w-16 h-16 rounded-full border flex items-center justify-center ${config.badge}`}>
                <StatusIcon size={34} strokeWidth={1.8} />
              </div>
              <span className={`text-xs font-black tracking-widest px-4 py-1.5 rounded-full border uppercase ${config.badge}`}>
                {config.label}
              </span>
              {ticket.isCheckedIn && checkedInAtStr && (
                <p className="text-[11px] text-zinc-500 font-semibold">
                  Đã check-in lúc: <span className="text-zinc-300">{checkedInAtStr}</span>
                </p>
              )}
            </div>

            {/* Movie info */}
            {ticket.movie?.title && (
              <div className="bg-gradient-to-r from-brand/10 to-transparent border border-dark-border/50 rounded-2xl px-4 py-3 flex items-center gap-3">
                {ticket.movie?.posterUrl && (
                  <img
                    src={ticket.movie.posterUrl}
                    alt={ticket.movie.title}
                    className="w-10 h-14 object-cover rounded-lg shrink-0 border border-zinc-700"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Film size={10} /> Phim
                  </p>
                  <p className="text-sm font-black text-white leading-tight">{ticket.movie.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {ticket.movie.duration && (
                      <span className="text-[10px] text-zinc-500 font-semibold">{ticket.movie.duration} phút</span>
                    )}
                    {ticket.movie.rating && (
                      <span className="text-[10px] font-black bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                        {ticket.movie.rating}
                      </span>
                    )}
                    {ticket.showtime?.format && (
                      <span className="text-[10px] font-black bg-brand/20 text-brand px-1.5 py-0.5 rounded">
                        {ticket.showtime.format}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Details grid */}
            <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl divide-y divide-zinc-800/60">
              <InfoRow icon={MapPin} label="Rạp & Phòng" value={`${ticket.showtime?.theater || '---'} • ${ticket.showtime?.room || '---'}`} />
              <InfoRow icon={Calendar} label="Suất chiếu" value={`${timeStr} — ${dateStr}`} />
              <InfoRow icon={Ticket} label="Ghế ngồi" value={
                <div className="flex flex-wrap gap-1 justify-end mt-0.5">
                  {(ticket.seats || []).map(s => (
                    <span key={s} className="bg-zinc-800 border border-zinc-700 text-brand font-black px-1.5 py-0.5 rounded text-[10px]">{s}</span>
                  ))}
                </div>
              } accent />
              <InfoRow icon={Users} label="Khách hàng" value={`${ticket.customer?.username || '---'} (${ticket.customer?.email || '---'})`} />
              <InfoRow icon={CreditCard} label="Thanh toán" value={PAYMENT_METHOD_LABEL[ticket.paymentMethod] || ticket.paymentMethod} />
              {ticket.concessions?.length > 0 && (
                <InfoRow icon={ShoppingBag} label="Đồ ăn uống" value={
                  <div className="text-right space-y-0.5">
                    {ticket.concessions.map((c, i) => (
                      <div key={i} className="text-zinc-300 text-[11px]">{c.name} × {c.quantity}</div>
                    ))}
                  </div>
                } />
              )}
            </div>

            {/* Ticket code + total */}
            <div className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800 rounded-2xl px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Mã vé</p>
                <p className="font-mono text-sm font-black text-brand tracking-widest">{ticket.ticketCode}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Tổng thanh toán</p>
                <p className="text-lg font-black text-emerald-400">{(ticket.totalPrice || 0).toLocaleString()} VND</p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[10px] text-zinc-600 font-semibold leading-relaxed px-4">
          Trang này dành cho nhân viên soát vé xác minh tính hợp lệ của vé điện tử.<br />
          Mọi thắc mắc vui lòng liên hệ quầy hỗ trợ Nova Cinematic.
        </p>

        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-zinc-500 hover:text-zinc-300 text-xs font-bold flex items-center gap-1.5 mx-auto transition-colors"
          >
            <ArrowLeft size={14} /> Về trang chủ
          </button>
        </div>

      </div>
    </div>
  );
};

export default TicketVerifyPage;
