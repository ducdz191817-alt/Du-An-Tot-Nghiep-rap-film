import React, { useState, useEffect, useCallback } from 'react';
import {
  Save, Tag, Clock, Calendar, Film, Sofa, Monitor,
  AlertCircle, CheckCircle2, Loader2, ChevronDown, ChevronUp, Calculator,
} from 'lucide-react';
import adminService from '../../services/admin.service';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n ?? 0) + ' ₫';

// Map getDay() → key trong weekdaySurcharge
const WD_KEYS  = ['sun','mon','tue','wed','thu','fri','sat'];
const WD_LABELS = ['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];

// ── PriceInput ──────────────────────────────────────────────────────────────
const PriceInput = ({ label, value, onChange, description }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0 gap-4">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-800">{label}</p>
      {description && <p className="text-[11px] text-gray-400 mt-0.5">{description}</p>}
    </div>
    <div className="flex items-center gap-1.5 shrink-0">
      <input
        type="number"
        value={value ?? 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-28 text-right bg-gray-50 border border-gray-200 text-gray-800 rounded-lg px-3 py-1.5 text-sm font-bold focus:border-brand focus:ring-1 focus:ring-brand/20 outline-none"
        step="1000"
        min="0"
      />
      <span className="text-xs text-gray-400 font-semibold w-4">₫</span>
    </div>
  </div>
);

// ── Section card ────────────────────────────────────────────────────────────
const Section = ({ icon, title, subtitle, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <span className="p-2 bg-brand/10 rounded-xl text-brand shrink-0">{icon}</span>
        <div className="flex-1">
          <p className="font-extrabold text-gray-800 text-sm">{title}</p>
          {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
};

// ── Preview Panel ───────────────────────────────────────────────────────────
const PricePreview = ({ config }) => {
  const [params, setParams] = useState({
    date: new Date().toISOString().slice(0, 10),
    hour: '19',
    format: '3D',
    roomType: 'premium',
    seatType: 'vip',
  });
  const [result, setResult] = useState(null);

  const calculate = useCallback(() => {
    if (!config) return;
    try {
      const startTime = new Date(`${params.date}T${String(params.hour).padStart(2,'0')}:00:00+07:00`);
      const vnDate = new Date(startTime.getTime() + 7 * 3600 * 1000);
      const dateStr = `${vnDate.getUTCFullYear()}-${String(vnDate.getUTCMonth()+1).padStart(2,'0')}-${String(vnDate.getUTCDate()).padStart(2,'0')}`;

      const holidays = config.holidays || [];
      const dow      = vnDate.getUTCDay();
      const wdKey    = WD_KEYS[dow];
      const dayType  = holidays.includes(dateStr) ? 'holiday' : (dow===0||dow===6) ? 'weekend' : 'weekday';
      const vnHour   = (startTime.getUTCHours() + 7) % 24;
      const timeSlot = vnHour>=17&&vnHour<22 ? 'evening' : vnHour>=22 ? 'latenight' : 'morning';

      const base        = config.basePrice?.[dayType]                   ?? 90000;
      const weekdayExtra = config.weekdaySurcharge?.[wdKey]             ?? 0;
      const timeExtra   = config.timeSlotSurcharge?.[timeSlot]          ?? 0;
      const formatExtra = config.formatSurcharge?.[params.format]       ?? 0;
      const roomExtra   = config.roomTypeSurcharge?.[params.roomType]   ?? 0;
      const seatExtra   = config.seatTypeSurcharge?.[params.seatType]   ?? 0;

      setResult({ dayType, timeSlot, dow, wdKey, breakdown: { base, weekdayExtra, timeExtra, formatExtra, roomExtra, seatExtra }, total: base+weekdayExtra+timeExtra+formatExtra+roomExtra+seatExtra });
    } catch (e) {
      console.error('Preview error:', e);
    }
  }, [config, params]);

  useEffect(() => { calculate(); }, [calculate]);

  const DAY_TYPE_LABELS = { weekday: 'Ngày thường', weekend: 'Cuối tuần', holiday: 'Ngày lễ' };
  const TIME_LABELS = { morning: 'Sáng / Chiều (< 17h)', evening: 'Buổi tối (17–22h)', latenight: 'Khuya (≥ 22h)' };

  return (
    <div className="bg-gradient-to-br from-brand/5 to-sky-50 border border-brand/20 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Calculator size={16} className="text-brand" />
        <h4 className="font-extrabold text-gray-800 text-sm">Preview Giá Vé</h4>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Ngày chiếu', el: <input type="date" value={params.date} onChange={(e)=>setParams(p=>({...p,date:e.target.value}))} className="w-full mt-1 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none focus:border-brand" /> },
          { label: 'Giờ chiếu', el:
            <select value={params.hour} onChange={(e)=>setParams(p=>({...p,hour:e.target.value}))} className="w-full mt-1 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none focus:border-brand cursor-pointer">
              {Array.from({length:16},(_,i)=>i+8).map(h=><option key={h} value={String(h)}>{String(h).padStart(2,'0')}:00</option>)}
            </select> },
          { label: 'Format', el:
            <select value={params.format} onChange={(e)=>setParams(p=>({...p,format:e.target.value}))} className="w-full mt-1 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none focus:border-brand cursor-pointer">
              {['2D','3D','IMAX','GOLDCLASS'].map(f=><option key={f} value={f}>{f==='GOLDCLASS'?'4DX/GOLD':f}</option>)}
            </select> },
          { label: 'Loại phòng', el:
            <select value={params.roomType} onChange={(e)=>setParams(p=>({...p,roomType:e.target.value}))} className="w-full mt-1 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none focus:border-brand cursor-pointer">
              <option value="standard">Standard</option><option value="premium">Premium</option><option value="dolby">Dolby Atmos</option>
            </select> },
          { label: 'Loại ghế', el:
            <select value={params.seatType} onChange={(e)=>setParams(p=>({...p,seatType:e.target.value}))} className="w-full mt-1 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none focus:border-brand cursor-pointer">
              <option value="standard">Normal</option><option value="vip">VIP</option><option value="couple">Couple</option>
            </select> },
        ].map(({label,el})=>(
          <div key={label}>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</label>
            {el}
          </div>
        ))}
      </div>

      {result && (
        <div className="bg-white rounded-xl p-4 space-y-1.5 border border-gray-100 shadow-sm">
          <div className="flex justify-between text-xs text-gray-500 font-semibold">
            <span>Loại ngày</span>
            <span className="font-bold text-gray-700">{DAY_TYPE_LABELS[result.dayType]} ({WD_LABELS[result.dow]})</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 font-semibold">
            <span>Khung giờ</span>
            <span className="font-bold text-gray-700">{TIME_LABELS[result.timeSlot]}</span>
          </div>
          <div className="border-t border-dashed border-gray-100 pt-2 mt-1 space-y-1">
            {[
              ['Giá cơ bản',      result.breakdown.base],
              ['Phụ thu thứ',     result.breakdown.weekdayExtra],
              ['Phụ thu giờ',     result.breakdown.timeExtra],
              ['Phụ thu format',  result.breakdown.formatExtra],
              ['Phụ thu phòng',   result.breakdown.roomExtra],
              ['Phụ thu ghế',     result.breakdown.seatExtra],
            ].map(([label, val])=>(
              <div key={label} className="flex justify-between text-xs">
                <span className="text-gray-500">{label}</span>
                <span className={val > 0 ? 'text-green-600 font-bold' : 'text-gray-400'}>
                  {val > 0 ? `+${fmt(val)}` : fmt(0)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center border-t border-gray-200 pt-2">
            <span className="text-sm font-extrabold text-gray-800">Tổng giá vé</span>
            <span className="text-xl font-black text-brand">{fmt(result.total)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main ────────────────────────────────────────────────────────────────────
export const PricingManager = () => {
  const [config, setConfig]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);
  const [holidayInput, setHolidayInput] = useState('');

  useEffect(() => {
    adminService.getPricingConfig()
      .then((res) => {
        // api interceptor: response → response.data = {success, data}
        // adminService: return response.data → returns the config object directly
        console.log('[PricingManager] loaded config:', res);
        const cfg = res?.data ?? res; // handle both shapes
        if (cfg && (cfg.basePrice || cfg._id)) {
          setConfig(cfg);
        } else {
          setToast({ type: 'error', msg: 'Dữ liệu bảng giá không hợp lệ từ server' });
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('[PricingManager] error:', err);
        setToast({ type: 'error', msg: 'Lỗi tải bảng giá: ' + (err?.message || 'Không kết nối được backend') });
      })
      .finally(() => setLoading(false));
  }, []);

  const setField = (path, value) => {
    setConfig((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]] = obj[keys[i]] || {};
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await adminService.updatePricingConfig(config);
      setConfig(res.data);
      setToast({ type: 'success', msg: 'Đã lưu bảng giá thành công!' });
    } catch (err) {
      setToast({ type: 'error', msg: err?.message || 'Lỗi khi lưu bảng giá' });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3500);
    }
  };

  const addHoliday = () => {
    const val = holidayInput.trim();
    if (!val || !/^\d{4}-\d{2}-\d{2}$/.test(val)) return;
    if (!(config.holidays || []).includes(val)) {
      setConfig((p) => ({ ...p, holidays: [...(p.holidays || []), val].sort() }));
    }
    setHolidayInput('');
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
      <Loader2 size={20} className="animate-spin" />
      <span className="text-sm font-semibold">Đang tải bảng giá...</span>
    </div>
  );

  if (!config) return (
    <div className="flex items-center justify-center py-24 gap-3 text-red-400 bg-red-50 rounded-2xl border border-red-200">
      <AlertCircle size={20} />
      <span className="text-sm font-semibold">Không thể tải bảng giá. Vui lòng kiểm tra backend.</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-gray-200 pb-4">
        <div>
          <h3 className="text-lg font-black text-gray-800">Cấu Hình Bảng Giá Vé</h3>
          <p className="text-xs text-gray-500 mt-1">
            Giá vé tự động tính khi tạo suất chiếu. Công thức: <strong>Cơ bản + Thứ + Giờ + Format + Phòng + Ghế</strong>
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-hover transition-all shadow-md shadow-brand/20 active:scale-95 disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? 'Đang lưu...' : 'Lưu Bảng Giá'}
        </button>
      </div>

      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-semibold border ${
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">

          {/* 1. Giá cơ bản */}
          <Section icon={<Tag size={16} />} title="Giá Cơ Bản Theo Loại Ngày" subtitle="Nền tảng tính toán">
            <PriceInput label="Ngày thường (T2–T5)" value={config.basePrice?.weekday} onChange={(v) => setField('basePrice.weekday', v)} description="Áp dụng từ Thứ Hai đến Thứ Năm" />
            <PriceInput label="Cuối tuần (T6–CN)" value={config.basePrice?.weekend} onChange={(v) => setField('basePrice.weekend', v)} description="Thứ Sáu, Thứ Bảy, Chủ Nhật" />
            <PriceInput label="Ngày lễ" value={config.basePrice?.holiday} onChange={(v) => setField('basePrice.holiday', v)} description="Ngày lễ được khai báo dưới đây" />
          </Section>

          {/* 2. Phụ thu thứ */}
          <Section icon={<Calendar size={16} />} title="Phụ Thu Theo Thứ" subtitle="Cộng thêm vào giá cơ bản" defaultOpen={false}>
            {WD_KEYS.map((key, i) => (
              <PriceInput key={key} label={WD_LABELS[i]} value={config.weekdaySurcharge?.[key] ?? 0} onChange={(v) => setField(`weekdaySurcharge.${key}`, v)} />
            ))}
          </Section>

          {/* 3. Phụ thu giờ */}
          <Section icon={<Clock size={16} />} title="Phụ Thu Theo Khung Giờ" subtitle="Cộng thêm vào giá theo giờ bắt đầu">
            <PriceInput label="Sáng / Chiều (08:00 – 16:59)" value={config.timeSlotSurcharge?.morning} onChange={(v) => setField('timeSlotSurcharge.morning', v)} />
            <PriceInput label="Buổi tối (17:00 – 21:59)" value={config.timeSlotSurcharge?.evening} onChange={(v) => setField('timeSlotSurcharge.evening', v)} />
            <PriceInput label="Khuya (22:00 – 23:59)" value={config.timeSlotSurcharge?.latenight} onChange={(v) => setField('timeSlotSurcharge.latenight', v)} />
          </Section>

          {/* 4. Phụ thu format */}
          <Section icon={<Film size={16} />} title="Phụ Thu Theo Định Dạng Chiếu" defaultOpen={false}>
            <PriceInput label="2D" value={config.formatSurcharge?.['2D']} onChange={(v) => setField('formatSurcharge.2D', v)} />
            <PriceInput label="3D" value={config.formatSurcharge?.['3D']} onChange={(v) => setField('formatSurcharge.3D', v)} />
            <PriceInput label="IMAX" value={config.formatSurcharge?.['IMAX']} onChange={(v) => setField('formatSurcharge.IMAX', v)} />
            <PriceInput label="4DX / GOLDCLASS" value={config.formatSurcharge?.['GOLDCLASS']} onChange={(v) => setField('formatSurcharge.GOLDCLASS', v)} />
          </Section>

          {/* 5. Phụ thu phòng */}
          <Section icon={<Monitor size={16} />} title="Phụ Thu Theo Loại Phòng" defaultOpen={false}>
            <PriceInput label="Standard" value={config.roomTypeSurcharge?.standard} onChange={(v) => setField('roomTypeSurcharge.standard', v)} />
            <PriceInput label="Premium" value={config.roomTypeSurcharge?.premium} onChange={(v) => setField('roomTypeSurcharge.premium', v)} />
            <PriceInput label="Dolby Atmos" value={config.roomTypeSurcharge?.dolby} onChange={(v) => setField('roomTypeSurcharge.dolby', v)} />
          </Section>

          {/* 6. Phụ thu ghế */}
          <Section icon={<Sofa size={16} />} title="Phụ Thu Theo Loại Ghế" defaultOpen={false}>
            <PriceInput label="Ghế Thường (Normal)" value={config.seatTypeSurcharge?.standard} onChange={(v) => setField('seatTypeSurcharge.standard', v)} />
            <PriceInput label="Ghế VIP" value={config.seatTypeSurcharge?.vip} onChange={(v) => setField('seatTypeSurcharge.vip', v)} />
            <PriceInput label="Ghế Đôi (Couple)" value={config.seatTypeSurcharge?.couple} onChange={(v) => setField('seatTypeSurcharge.couple', v)} />
          </Section>

          {/* 7. Ngày lễ */}
          <Section icon={<Calendar size={16} />} title="Danh Sách Ngày Lễ" subtitle="Định dạng YYYY-MM-DD" defaultOpen={false}>
            <div className="flex gap-2 mb-3">
              <input
                type="date"
                value={holidayInput}
                onChange={(e) => setHolidayInput(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-200 text-gray-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand"
              />
              <button type="button" onClick={addHoliday}
                className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover transition-all">
                Thêm
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(config.holidays || []).map((d) => (
                <span key={d} className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">
                  {d}
                  <button type="button" onClick={() => setConfig((p) => ({ ...p, holidays: p.holidays.filter((x) => x !== d) }))}
                    className="text-amber-400 hover:text-amber-700">×</button>
                </span>
              ))}
              {!(config.holidays?.length) && <p className="text-xs text-gray-400 italic">Chưa có ngày lễ nào</p>}
            </div>
          </Section>
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <PricePreview config={config} />
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-700 font-medium space-y-1.5">
              <p className="font-bold flex items-center gap-1.5"><AlertCircle size={13} /> Lưu ý quan trọng</p>
              <p>• Giá tự động tính khi <strong>tạo suất chiếu mới</strong>.</p>
              <p>• Suất chiếu đã tạo <strong>không bị thay đổi</strong> khi sửa bảng giá.</p>
              <p>• Phụ thu ghế VIP/Couple được cộng thêm lúc khách <strong>chọn ghế</strong>.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingManager;
