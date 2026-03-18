/**
 * rules.ts — Instruction Layer
 * Lớp Toán NK · v28.0
 *
 * Tập trung TOÀN BỘ business constants, thresholds, alert rules.
 * Trước đây rải rác: FEE_DEFAULT ở helpers.ts, LEVEL_COLOR ở StudentsTab,
 * threshold hardcode trong FinanceTab, teacher fallback ở ModalClass.
 *
 * Nguyên tắc: mọi "magic number" và "business decision" nằm ở đây,
 * không hardcode trong UI component.
 */

/* ─────────────────────────────────────────────
   HỌC PHÍ & TÀI CHÍNH
───────────────────────────────────────────── */
export const RULES = {
  finance: {
    /** Học phí cơ bản mặc định (VNĐ) — override được trong Settings */
    baseTuition: 600_000,
    /** Nợ >= N tháng → hiển thị cảnh báo đỏ */
    debtAlertMonths: 2,
    /** Số tháng lịch sử hiển thị trên biểu đồ */
    chartHistoryMonths: 12,
  },

  /* ─────────────────────────────────────────
     HỌC SINH & HỌC LỰC
  ───────────────────────────────────────── */
  academic: {
    /** Thứ tự học lực từ cao xuống thấp */
    levelOrder: ['Xuất sắc', 'Giỏi', 'Khá', 'Trung bình', 'Yếu'] as const,
    /** Mức học lực bị coi là "yếu" → cảnh báo */
    weakThreshold: 'Yếu' as const,
    /** Mapping học lực → màu badge (BadgeColor từ dsComponents) */
    levelColor: {
      'Xuất sắc': 'emerald',
      'Giỏi':     'emerald',
      'Khá':      'indigo',
      'Trung bình': 'amber',
      'Yếu':      'rose',
    } as Record<string, 'emerald' | 'indigo' | 'amber' | 'rose' | 'slate'>,
    /** Màu mặc định khi học lực không khớp */
    levelColorDefault: 'slate' as const,
  },

  /* ─────────────────────────────────────────
     CHUYÊN CẦN
  ───────────────────────────────────────── */
  attendance: {
    /** Vắng >= N buổi trong tháng → cảnh báo */
    absentAlertThreshold: 3,
    /** Tỷ lệ chuyên cần tốt (%) */
    goodAttendancePct: 90,
    /** Tỷ lệ chuyên cần trung bình (%) */
    avgAttendancePct: 70,
    /** Muộn có tính là có mặt cho mục đích cảnh báo không */
    lateCountsAsPresent: true,
  },

  /* ─────────────────────────────────────────
     PHÂN TRANG
  ───────────────────────────────────────── */
  pagination: {
    /** Items per page mặc định */
    defaultIPP: 10,
  },

  /* ─────────────────────────────────────────
     GIÁO VIÊN MẶC ĐỊNH
  ───────────────────────────────────────── */
  teachers: {
    /** Danh sách mặc định khi chưa cấu hình trong Settings */
    defaultList: ['Lê Đức Nhân', 'Nguyễn Thị Kiên'] as string[],
  },

  /* ─────────────────────────────────────────
     CA DẠY MẶC ĐỊNH
  ───────────────────────────────────────── */
  schedule: {
    defaultCaDayOptions: ['7h30', '9h', '13h30', '15h30', '17h30', '19h30'] as string[],
  },

  /* ─────────────────────────────────────────
     FETCH / NETWORK
  ───────────────────────────────────────── */
  network: {
    /** Timeout fetch (ms) */
    fetchTimeout: 30_000,
    /** Interval tự động reload khi tab active (ms) */
    autoReloadInterval: 5 * 60 * 1000,
    /** Minimum thời gian giữa 2 lần reload silent (ms) */
    silentReloadCooldown: 2 * 60 * 1000,
  },
} as const;

/* ─────────────────────────────────────────────
   HELPER TYPES
───────────────────────────────────────────── */
export type AcademicLevel = typeof RULES.academic.levelOrder[number];
export type BadgeLevelColor = typeof RULES.academic.levelColorDefault;
