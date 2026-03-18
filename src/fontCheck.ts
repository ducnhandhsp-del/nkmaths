/**
 * fontCheck.ts — Kiểm tra font tiếng Việt có load thành công không
 * Nếu fail → cảnh báo developer và dùng fallback an toàn
 *
 * Cơ chế: So sánh width render của 1 ký tự đặc trưng tiếng Việt
 * trong target font vs Arial. Nếu bằng nhau → font chưa load.
 */

const VN_TEST_CHARS = 'Tiếng Việt ộ ề ữ ặ';
const TARGET_FONTS = ['Be Vietnam Pro', 'Nunito'];

function measureText(text: string, fontFamily: string, size = 16): number {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;
    ctx.font = `${size}px "${fontFamily}", monospace`;
    return ctx.measureText(text).width;
  } catch {
    return 0;
  }
}

export async function checkVietnameseFonts(): Promise<{
  loaded: boolean;
  font: string;
  fallback: boolean;
}> {
  // Dùng Font Loading API nếu có (modern browsers)
  if ('fonts' in document) {
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise<void>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
      ]);
    } catch {
      console.warn('[FontCheck] Font loading timeout — using fallback');
      return { loaded: false, font: 'system', fallback: true };
    }
  }

  // Kiểm tra từng font
  for (const fontName of TARGET_FONTS) {
    const targetW = measureText(VN_TEST_CHARS, fontName);
    const arialW  = measureText(VN_TEST_CHARS, 'Arial');
    if (targetW > 0 && Math.abs(targetW - arialW) > 2) {
      return { loaded: true, font: fontName, fallback: false };
    }
  }

  // Không font nào load được → log warning
  console.warn(
    '[FontCheck] Không load được Be Vietnam Pro / Nunito.\n' +
    'Tiếng Việt có thể hiển thị sai trên thiết bị này.\n' +
    'Kiểm tra: 1) Kết nối mạng  2) CSP headers  3) WebView font policy'
  );
  return { loaded: false, font: 'system-fallback', fallback: true };
}

/**
 * Gọi khi app khởi động để log font status
 * Không block render — chạy background
 */
export function initFontCheck(): void {
  if (typeof window === 'undefined') return;
  // Delay nhỏ để không block first paint
  setTimeout(() => {
    checkVietnameseFonts().then(result => {
      if (result.fallback) {
        // Thêm class vào body để CSS biết đang dùng fallback font
        document.body.classList.add('font-fallback');
      } else {
        document.body.classList.add('font-loaded');
      }
    });
  }, 1000);
}
