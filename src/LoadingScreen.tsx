import React, { useEffect, useState } from 'react';
import { GraduationCap } from 'lucide-react';

const SLOGANS = [
  'Đang khởi tạo hệ thống Lớp Toán NK...',
  'Đang đồng bộ dữ liệu lớp học...',
  'Đang chuẩn bị bảng điều khiển giảng dạy...',
  'Đang tải thông tin học sinh và lớp học...',
  'Đang thiết lập không gian làm việc...',
  'Đang tối ưu hoá trải nghiệm quản lý...',
  'Sắp hoàn tất — sẵn sàng cho buổi dạy hiệu quả.',
];

export default function LoadingScreen() {
  const [slogan, setSlogan] = useState(SLOGANS[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * SLOGANS.length);
      setSlogan(SLOGANS[randomIndex]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 10% 30%, #6366f1, #312e81)',
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Các hình khối trang trí nền */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <svg width="100%" height="100%" style={{ position: 'absolute' }}>
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        <div style={{
          position: 'absolute',
          top: '5%',
          left: '5%',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
          animation: 'float 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '10%',
          right: '5%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
          animation: 'float 10s ease-in-out infinite reverse',
        }} />
      </div>

      {/* Logo với hiệu ứng nâng cao */}
      <div style={{
        position: 'relative',
        marginBottom: 40,
        animation: 'fadeInDown 1s ease-out',
      }}>
        <div style={{
          width: 120,
          height: 120,
          borderRadius: 30,
          background: 'linear-gradient(135deg, #fff, #e0e7ff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 20px 40px rgba(79,70,229,0.4), 0 0 0 2px rgba(255,255,255,0.3) inset',
          animation: 'logoPulse 2s ease-in-out infinite',
        }}>
          <GraduationCap size={64} color="#4f46e5" />
        </div>
        <div style={{
          position: 'absolute',
          top: -10,
          left: -10,
          right: -10,
          bottom: -10,
          borderRadius: 40,
          border: '2px dashed rgba(255,255,255,0.5)',
          animation: 'spinSlow 12s linear infinite',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Spinner dạng vòng tròn kép */}
      <div style={{ position: 'relative', width: 80, height: 80, marginBottom: 40 }}>
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          border: '4px solid transparent',
          borderTopColor: 'white',
          borderRadius: '50%',
          animation: 'spin 1.2s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite',
        }} />
        <div style={{
          position: 'absolute',
          width: '70%',
          height: '70%',
          top: '15%',
          left: '15%',
          border: '3px solid transparent',
          borderRightColor: 'rgba(255,255,255,0.6)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite reverse',
        }} />
      </div>

      {/* Slogan với hiệu ứng chữ */}
      <h2
        key={slogan}
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: 'white',
          marginBottom: 12,
          textShadow: '0 4px 20px rgba(0,0,0,0.3)',
          textAlign: 'center',
          animation: 'fadeInUp 0.5s ease-out',
        }}
      >
        {slogan}
      </h2>

      <p
        style={{
          fontSize: 16,
          color: 'rgba(255,255,255,0.9)',
          fontWeight: 500,
          letterSpacing: '0.05em',
          background: 'rgba(255,255,255,0.1)',
          padding: '8px 24px',
          borderRadius: 40,
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        Lớp Toán NK
      </p>

      {/* Progress bar ảo (tùy chọn) */}
      <div style={{
        width: 200,
        height: 4,
        background: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        marginTop: 40,
        overflow: 'hidden',
      }}>
        <div style={{
          width: '60%',
          height: '100%',
          background: 'white',
          borderRadius: 2,
          animation: 'loadingProgress 1.5s ease-in-out infinite',
        }} />
      </div>
    </div>
  );
}