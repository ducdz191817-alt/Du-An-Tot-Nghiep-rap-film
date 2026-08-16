import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Upload, RefreshCw, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

// Audio feedback helper using Web Audio API
const playBeep = (type = 'success') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      // High double chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else {
      // Low alert buzzer
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.setValueAtTime(140, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (e) {
    console.warn('Audio playback error:', e);
  }
};

export const QRScanner = ({ onScanSuccess, isProcessing = false, lastScanResult = null }) => {
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [fileScanning, setFileScanning] = useState(false);

  const scannerRef = useRef(null);
  const lastScannedTextRef = useRef('');
  const cooldownTimerRef = useRef(null);

  // Play audio whenever lastScanResult changes
  useEffect(() => {
    if (!lastScanResult || isMuted) return;
    if (lastScanResult.success) {
      playBeep('success');
    } else {
      playBeep('error');
    }
  }, [lastScanResult, isMuted]);

  // Fetch available camera devices
  const getCameraDevices = async () => {
    try {
      setCameraError(null);
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        setSelectedCameraId(devices[0].id);
      } else {
        setCameraError('Không tìm thấy thiết bị Camera/Webcam trên máy tính của bạn.');
      }
    } catch (err) {
      console.error('Lỗi tìm camera:', err);
      let msg = 'Không thể truy cập camera.';
      if (err?.name === 'NotAllowedError' || String(err).includes('Permission denied')) {
        msg = 'Trình duyệt đã bị từ chối quyền camera. Vui lòng nhấn biểu tượng ổ khóa/camera trên thanh địa chỉ để BẬT QUYỀN CAMERA.';
      } else if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        msg = 'Quét QR camera yêu cầu kết nối bảo mật (HTTPS) hoặc localhost.';
      }
      setCameraError(msg);
    }
  };

  useEffect(() => {
    getCameraDevices();

    return () => {
      stopCamera();
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  const startCamera = async (cameraIdToUse) => {
    setCameraError(null);
    const targetCameraId = cameraIdToUse || selectedCameraId;

    try {
      if (scannerRef.current) {
        await stopCamera();
      }

      const html5QrCode = new Html5Qrcode('qr-reader-video-container');
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 240, height: 240 },
        aspectRatio: 1.0,
      };

      const cameraConstraint = targetCameraId ? { deviceId: { exact: targetCameraId } } : { facingMode: 'environment' };

      await html5QrCode.start(
        cameraConstraint,
        config,
        (decodedText) => {
          // Debounce same scan
          if (decodedText === lastScannedTextRef.current) return;
          lastScannedTextRef.current = decodedText;

          if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
          cooldownTimerRef.current = setTimeout(() => {
            lastScannedTextRef.current = '';
          }, 3000);

          if (onScanSuccess) {
            onScanSuccess(decodedText);
          }
        },
        () => {
          // Ignore frame decode errors
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Error starting camera:', err);
      setIsScanning(false);
      let msg = 'Lỗi khởi chạy camera.';
      if (String(err).includes('Permission denied') || err?.name === 'NotAllowedError') {
        msg = 'Bạn chưa cấp quyền sử dụng camera cho trình duyệt. Vui lòng cho phép truy cập camera.';
      } else if (String(err).includes('already in use')) {
        msg = 'Camera đang được sử dụng bởi ứng dụng khác trên máy tính.';
      }
      setCameraError(msg);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Stop scanner warning:', err);
      } finally {
        scannerRef.current = null;
        setIsScanning(false);
      }
    } else {
      setIsScanning(false);
    }
  };

  const handleToggleCamera = () => {
    if (isScanning) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const handleCameraChange = (e) => {
    const newCamId = e.target.value;
    setSelectedCameraId(newCamId);
    if (isScanning) {
      startCamera(newCamId);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileScanning(true);
    setCameraError(null);

    try {
      const html5QrCode = new Html5Qrcode('qr-reader-file-temp');
      const result = await html5QrCode.scanFileV2(file);
      html5QrCode.clear();

      if (result && result.decodedText) {
        if (onScanSuccess) {
          onScanSuccess(result.decodedText);
        }
      } else {
        setCameraError('Không tìm thấy mã QR hợp lệ trong hình ảnh đã chọn.');
      }
    } catch (err) {
      console.error('Lỗi quét file QR:', err);
      setCameraError('Không thể giải mã QR từ hình ảnh này. Vui lòng chọn ảnh QR rõ nét hơn.');
    } finally {
      setFileScanning(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top controls & camera selection */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 border border-gray-200 p-3 rounded-2xl">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Camera size={18} className="text-brand shrink-0" />
          {cameras.length > 0 ? (
            <select
              value={selectedCameraId}
              onChange={handleCameraChange}
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-800 focus:outline-none focus:border-brand"
            >
              {cameras.map((cam) => (
                <option key={cam.id} value={cam.id}>
                  {cam.label || `Camera ${cam.id.slice(0, 5)}...`}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-gray-500 font-semibold">Webcam Laptop</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mute button */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-xl border text-xs font-bold transition-all ${
              isMuted
                ? 'bg-gray-200 text-gray-500 border-gray-300'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
            title={isMuted ? 'Bật âm thanh báo' : 'Tắt âm thanh báo'}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          {/* Refresh cameras */}
          <button
            type="button"
            onClick={getCameraDevices}
            className="p-2 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition-all"
            title="Tìm lại Camera"
          >
            <RefreshCw size={15} />
          </button>

          {/* Toggle camera button */}
          <button
            type="button"
            onClick={handleToggleCamera}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm ${
              isScanning
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
            }`}
          >
            {isScanning ? (
              <>
                <CameraOff size={15} /> Tắt Camera
              </>
            ) : (
              <>
                <Camera size={15} /> Bật Camera Quét
              </>
            )}
          </button>
        </div>
      </div>

      {/* Video Scanner Stream Viewport */}
      <div className="relative w-full aspect-square max-w-sm mx-auto bg-zinc-950 rounded-3xl overflow-hidden border-2 border-zinc-800 shadow-2xl flex flex-col items-center justify-center group">
        {/* Container for html5-qrcode video element */}
        <div id="qr-reader-video-container" className="w-full h-full object-cover rounded-3xl" />
        <div id="qr-reader-file-temp" className="hidden" />

        {/* Laser / Scanner Viewport Overlay */}
        {isScanning ? (
          <div className="absolute inset-8 pointer-events-none border-2 border-dashed border-emerald-400/80 rounded-2xl flex items-center justify-center">
            {/* Corner guides */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

            {/* Animated Laser line */}
            <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_15px_#10b981] animate-pulse" />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-900/90 space-y-3">
            <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
              <Camera size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-zinc-200">Camera Quét Mã QR Chưa Bật</p>
              <p className="text-[11px] text-zinc-400">
                Nhấn <span className="text-emerald-400 font-bold">"Bật Camera Quét"</span> để truy cập camera laptop của bạn.
              </p>
            </div>
          </div>
        )}

        {/* Processing Spinner Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
            <RefreshCw size={28} className="text-emerald-400 animate-spin" />
            <span className="text-xs font-bold text-white">Đang kiểm tra thông tin vé...</span>
          </div>
        )}
      </div>

      {/* Camera error / Permission Notice */}
      {cameraError && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-600 flex items-start gap-2.5 text-xs">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
          <div className="space-y-1">
            <p className="font-bold">{cameraError}</p>
            <p className="text-[11px] text-gray-500">
              Mẹo: Kiểm tra quyền cấp camera trong ô cài đặt trình duyệt (biểu tượng ổ khóa kế bên URL).
            </p>
          </div>
        </div>
      )}

      {/* Upload image fallback */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-3 shadow-xs">
        <span className="text-xs font-semibold text-gray-600">Hoặc tải ảnh QR từ máy tính:</span>
        <label className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 border border-gray-200">
          <Upload size={14} />
          <span>{fileScanning ? 'Đang đọc ảnh...' : 'Chọn tệp ảnh QR'}</span>
          <input type="file" accept="image/*" onChange={handleFileUpload} disabled={fileScanning} className="hidden" />
        </label>
      </div>
    </div>
  );
};

export default QRScanner;
