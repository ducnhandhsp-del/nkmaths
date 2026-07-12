import React, { useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, CalendarCheck, CheckCircle2, Loader2, Phone, Search, ShieldCheck, WalletCards } from 'lucide-react';

import { fetchWithTimeout, fmtVND, parseDMY } from './helpers';
import { getPaymentTuitionPeriod, getTuitionCycleState, type Period } from './measures';
import type { ClassRecord, Payment, Student, TeachingLog } from './types';

type PortalStudent = Pick<Student, 'id' | 'name' | 'classId' | 'grade' | 'school' | 'parentName' | 'status' | 'startDate' | 'endDate'>;

interface PortalPayment extends Pick<Payment, 'id' | 'date' | 'docNum' | 'amount' | 'method' | 'note'> {
  thangHP?: number;
  namHP?: number;
  maLop?: string;
  status?: string;
}

interface PortalAttendance {
  lessonId: string;
  date: string;
  classId: string;
  caDay: string;
  status: string;
  note: string;
  type: string;
  content?: string;
}

interface PortalResult {
  student: PortalStudent;
  tuitionAmount?: number;
  payments: PortalPayment[];
  attendance: PortalAttendance[];
  tuitionCycle?: {
    target: number;
    collectionThreshold: number;
  };
  generatedAt?: string;
}

interface ParentPortalProps {
  scriptUrl: string;
  centerName: string;
  baseTuition: number;
  phone: string;
}

const currentPeriod = (): Period => {
  const now = new Date();
  return { m: now.getMonth() + 1, y: now.getFullYear() };
};

const norm = (value: unknown) => String(value || '').trim();

const sortByDateDesc = <T extends { date?: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => parseDMY(b.date || '') - parseDMY(a.date || ''));

const paymentPeriodOf = (payment: PortalPayment, fallbackYear: number): Period | null => {
  const m = Number(payment.thangHP);
  const y = Number(payment.namHP);
  if (m >= 1 && m <= 12 && y >= 2000) return { m, y };
  return getPaymentTuitionPeriod(payment as Payment, fallbackYear);
};

const statusTone = (status: string) => {
  if (status === 'Có mặt') return 'good';
  if (status === 'Có phép') return 'warn';
  return 'bad';
};

export default function ParentPortal({ scriptUrl, centerName, baseTuition, phone }: ParentPortalProps) {
  const [studentId, setStudentId] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [result, setResult] = useState<PortalResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const period = useMemo(currentPeriod, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const cleanId = studentId.trim().toUpperCase();
    const cleanPhone = parentPhone.replace(/\D/g, '');
    if (!cleanId || cleanPhone.length < 10) {
      setError('Vui lòng nhập mã học sinh và số điện thoại phụ huynh hợp lệ.');
      setResult(null);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetchWithTimeout(scriptUrl, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'lookupStudentPortal',
          studentId: cleanId,
          parentPhone: cleanPhone,
        }),
        timeout: 20000,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json().catch(() => null);
      if (!data || data.ok === false) throw new Error(data?.error || 'Không tra cứu được dữ liệu.');
      setResult({
        student: data.student,
        tuitionAmount: Number(data.tuitionAmount) || undefined,
        payments: Array.isArray(data.payments) ? data.payments : [],
        attendance: Array.isArray(data.attendance) ? data.attendance : [],
        tuitionCycle: data.tuitionCycle && typeof data.tuitionCycle === 'object' ? {
          target: Number(data.tuitionCycle.target) || 0,
          collectionThreshold: Number(data.tuitionCycle.collectionThreshold) || 0,
        } : undefined,
        generatedAt: data.generatedAt,
      });
    } catch {
      setResult(null);
      setError('Không tìm thấy thông tin phù hợp. Vui lòng kiểm tra mã học sinh và số điện thoại phụ huynh.');
    } finally {
      setLoading(false);
    }
  };

  const tuition = useMemo(() => {
    if (!result?.student) return null;
    const target = Number(result.tuitionCycle?.target) || 0;
    const slotCount = target >= 12 ? 3 : target >= 8 ? 2 : target >= 4 ? 1 : 0;
    const classRecord = {
      MaLop: result.student.classId,
      Buoi1: slotCount >= 1 ? 'slot-1' : '',
      Buoi2: slotCount >= 2 ? 'slot-2' : '',
      Buoi3: slotCount >= 3 ? 'slot-3' : '',
    } as unknown as ClassRecord;
    const cyclePayments = result.payments.map(payment => ({
      ...payment,
      studentId: result.student.id,
    })) as Payment[];
    const cycleLogs = result.attendance.map(row => ({
      id: row.lessonId,
      maBuoi: row.lessonId,
      rawDate: row.date,
      date: row.date,
      classId: row.classId,
      attendanceList: [{ maHS: result.student.id, trangThai: row.status }],
    })) as TeachingLog[];
    const state = getTuitionCycleState({
      student: result.student as Student,
      classes: [classRecord],
      payments: cyclePayments,
      tlogs: cycleLogs,
      baseTuition: Number(result.tuitionAmount) || baseTuition,
    });
    return state;
  }, [baseTuition, period, result]);

  const attendance = useMemo(() => {
    const rows = sortByDateDesc(result?.attendance || []);
    const total = rows.length;
    const present = rows.filter(row => row.status === 'Có mặt').length;
    const absent = rows.filter(row => row.status === 'Vắng').length;
    const excused = rows.filter(row => row.status === 'Có phép').length;
    const rate = total ? Math.round((present / total) * 100) : 0;
    return { rows, recent: rows.slice(0, 10), total, present, absent, excused, rate };
  }, [result]);

  const sortedPayments = useMemo(() => sortByDateDesc(result?.payments || []).slice(0, 8), [result]);
  const tuitionMeta = tuition?.status === 'overdue'
    ? { label: 'Quá hạn', tone: 'bad', message: 'Chu kỳ đã vượt số buổi dự kiến. Vui lòng liên hệ trung tâm để đối soát học phí.' }
    : tuition?.status === 'due'
      ? { label: 'Cần thu', tone: 'warn', message: 'Học sinh đã đến ngưỡng thu học phí của chu kỳ hiện tại.' }
      : tuition?.status === 'paid'
        ? { label: 'Đã thu', tone: 'good', message: 'Phiếu thu gần nhất đã được ghi nhận và chu kỳ mới chưa đến ngưỡng thu.' }
        : tuition?.status === 'needs_review'
          ? { label: 'Cần kiểm tra', tone: 'warn', message: 'Dữ liệu chu kỳ cần được trung tâm kiểm tra trước khi kết luận học phí.' }
          : tuition?.status === 'not_due'
            ? { label: 'Chưa đến hạn', tone: 'good', message: 'Chu kỳ hiện tại chưa đến ngưỡng cần thu học phí.' }
            : tuition?.status === 'no_schedule'
              ? { label: 'Chưa có lịch', tone: 'warn', message: 'Lớp chưa có lịch học để xác định chu kỳ học phí.' }
              : tuition?.status === 'not_started'
                ? { label: 'Chưa nhập học', tone: 'warn', message: 'Học sinh chưa bắt đầu học tại thời điểm hiện tại.' }
                : { label: 'Đã nghỉ', tone: 'warn', message: 'Học sinh hiện không còn trong kỳ học đang hoạt động.' };

  return (
    <div className="portal-page">
      <style>{`
        .portal-page{min-height:100dvh;background:#f4f7fb;color:#0f172a;font-family:inherit;padding:20px;box-sizing:border-box}
        .portal-shell{max-width:1080px;margin:0 auto;display:grid;gap:16px}
        .portal-top{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap}
        .portal-brand{display:grid;gap:4px}
        .portal-eyebrow{margin:0;font-size:12px;font-weight:900;color:#047857;text-transform:uppercase;letter-spacing:.08em}
        .portal-title{margin:0;font-size:28px;line-height:1.15;font-weight:950;color:#0f172a;letter-spacing:0}
        .portal-sub{margin:0;font-size:13px;font-weight:700;color:#64748b;max-width:620px;line-height:1.55}
        .portal-contact{display:inline-flex;align-items:center;gap:8px;border:1px solid #dbe7f3;background:#fff;border-radius:999px;padding:9px 12px;font-size:13px;font-weight:900;color:#0369a1;text-decoration:none}
        .portal-card{background:#fff;border:1px solid #dbe7f3;border-radius:10px;box-shadow:0 10px 24px rgba(15,23,42,.06)}
        .portal-form{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;gap:10px;padding:14px}
        .portal-field{display:grid;gap:6px;min-width:0}
        .portal-label{font-size:12px;font-weight:900;color:#475569}
        .portal-input{height:44px;border:1px solid #cbd5e1;border-radius:8px;padding:0 12px;font:inherit;font-size:15px;font-weight:800;outline:none;background:#fff;color:#0f172a}
        .portal-input:focus{border-color:#059669;box-shadow:0 0 0 3px rgba(5,150,105,.14)}
        .portal-button{height:44px;align-self:end;border:0;border-radius:8px;background:#047857;color:white;font:inherit;font-size:14px;font-weight:950;padding:0 16px;display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;white-space:nowrap}
        .portal-button:disabled{opacity:.65;cursor:not-allowed}
        .portal-note{display:flex;align-items:flex-start;gap:8px;border-top:1px solid #edf2f7;padding:10px 14px;color:#64748b;font-size:12px;font-weight:700;line-height:1.45}
        .portal-error{display:flex;align-items:flex-start;gap:8px;border:1px solid #fecaca;background:#fff1f2;color:#be123c;border-radius:10px;padding:11px 12px;font-size:13px;font-weight:850;line-height:1.45}
        .portal-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:16px;align-items:start}
        .portal-section{padding:14px;display:grid;gap:12px}
        .portal-section-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
        .portal-section-title{display:flex;align-items:center;gap:8px;margin:0;font-size:15px;font-weight:950;color:#0f172a}
        .portal-pill{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:5px 9px;background:#ecfdf5;color:#047857;font-size:11px;font-weight:950;white-space:nowrap}
        .portal-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
        .portal-kpi{border:1px solid #e2e8f0;border-radius:8px;padding:10px;background:#f8fafc;min-width:0}
        .portal-kpi span{display:block;font-size:11px;font-weight:850;color:#64748b}
        .portal-kpi strong{display:block;margin-top:4px;font-size:18px;line-height:1.1;font-weight:950;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .portal-kpi.good strong{color:#047857}.portal-kpi.warn strong{color:#b45309}.portal-kpi.bad strong{color:#be123c}
        .portal-lines{display:grid;gap:8px}
        .portal-line{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #edf2f7;padding-bottom:8px;font-size:13px}
        .portal-line:last-child{border-bottom:0;padding-bottom:0}
        .portal-line span{color:#64748b;font-weight:750}.portal-line strong{color:#0f172a;font-weight:950;text-align:right}
        .portal-table{display:grid;gap:7px}
        .portal-row{display:grid;grid-template-columns:110px minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid #e2e8f0;border-radius:8px;padding:9px 10px;background:#fff}
        .portal-row-date{font-size:14px;line-height:1.2;font-weight:950;color:#0f172a;white-space:nowrap}
        .portal-row-main{min-width:0}.portal-row-title{margin:0;font-size:13px;font-weight:950;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.portal-row-sub{margin:2px 0 0;font-size:11px;font-weight:750;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .portal-badge{border-radius:999px;padding:4px 8px;font-size:11px;font-weight:950;white-space:nowrap;background:#f1f5f9;color:#475569}
        .portal-badge.good{background:#dcfce7;color:#047857}.portal-badge.warn{background:#fef3c7;color:#b45309}.portal-badge.bad{background:#fee2e2;color:#be123c}
        .portal-empty{border:1px dashed #cbd5e1;border-radius:10px;padding:18px;text-align:center;color:#64748b;font-size:13px;font-weight:800;background:#f8fafc}
        @media(max-width:820px){.portal-page{padding:14px}.portal-title{font-size:22px}.portal-form{grid-template-columns:1fr}.portal-button{width:100%}.portal-grid{grid-template-columns:1fr}.portal-kpis{grid-template-columns:1fr 1fr}.portal-row{grid-template-columns:minmax(0,1fr) auto;gap:5px 10px;align-items:start}.portal-row-date{grid-column:1;grid-row:1;font-size:13px}.portal-row-main{grid-column:1;grid-row:2}.portal-row .portal-badge{grid-column:2;grid-row:1 / span 2;justify-self:end;align-self:center}}
      `}</style>

      <div className="portal-shell">
        <header className="portal-top">
          <div className="portal-brand">
            <p className="portal-eyebrow">{centerName}</p>
            <h1 className="portal-title">Tra cứu học phí và điểm danh</h1>
            <p className="portal-sub">Phụ huynh và học sinh nhập đúng mã học sinh cùng số điện thoại phụ huynh để xem dữ liệu cá nhân đã được lớp cập nhật.</p>
          </div>
          {phone && (
            <a className="portal-contact" href={`tel:${phone.replace(/\s/g, '')}`}>
              <Phone size={16} /> {phone}
            </a>
          )}
        </header>

        <section className="portal-card">
          <form className="portal-form" onSubmit={submit}>
            <label className="portal-field">
              <span className="portal-label">Mã học sinh</span>
              <input className="portal-input" value={studentId} onChange={event => setStudentId(event.target.value)} placeholder="Ví dụ: HS0001" autoCapitalize="characters" />
            </label>
            <label className="portal-field">
              <span className="portal-label">Số điện thoại phụ huynh</span>
              <input className="portal-input" value={parentPhone} onChange={event => setParentPhone(event.target.value)} placeholder="Số Zalo phụ huynh" inputMode="tel" />
            </label>
            <button className="portal-button" disabled={loading} type="submit">
              {loading ? <Loader2 size={17} className="animate-spin" /> : <Search size={17} />}
              Tra cứu
            </button>
          </form>
          <div className="portal-note">
            <ShieldCheck size={16} />
            <span>Trang này chỉ trả dữ liệu khi mã học sinh và số điện thoại phụ huynh khớp. Thông tin tra cứu không được lưu trong cache quản trị.</span>
          </div>
        </section>

        {error && (
          <div className="portal-error">
            <AlertTriangle size={17} />
            <span>{error}</span>
          </div>
        )}

        {result && tuition && (
          <div className="portal-grid">
            <section className="portal-card portal-section">
              <div className="portal-section-head">
                <h2 className="portal-section-title"><WalletCards size={18} /> Trạng thái học phí hiện tại</h2>
                <span className="portal-pill">{result.student.classId || 'Chưa có lớp'}</span>
              </div>
              <div className="portal-kpis">
                <div className={`portal-kpi ${tuitionMeta.tone}`}><span>Trạng thái</span><strong>{tuitionMeta.label}</strong></div>
                <div className="portal-kpi"><span>Tiến độ chu kỳ</span><strong>{tuition.target > 0 ? `${tuition.done}/${tuition.target}` : '—'}</strong></div>
                <div className={tuition.outstandingAmount > 0 ? 'portal-kpi bad' : 'portal-kpi good'}><span>Cần thu</span><strong>{fmtVND(tuition.outstandingAmount)}</strong></div>
              </div>
              <div className="portal-lines">
                <div className="portal-line"><span>Học sinh</span><strong>{result.student.name}</strong></div>
                <div className="portal-line"><span>Mã học sinh</span><strong>{result.student.id}</strong></div>
                <div className="portal-line"><span>Bắt đầu cần thu</span><strong>{tuition.collectionThreshold > 0 ? `${tuition.collectionThreshold}/${tuition.target} buổi` : '—'}</strong></div>
                <div className="portal-line"><span>Phiếu gần nhất</span><strong>{tuition.lastPayment ? `${tuition.lastPayment.date} · ${fmtVND(tuition.paidAmount)}` : 'Chưa có'}</strong></div>
              </div>
              <div className="portal-note" style={{ borderTop: 0, borderRadius: 8, background: tuitionMeta.tone === 'good' ? '#ecfdf5' : tuitionMeta.tone === 'bad' ? '#fff1f2' : '#fff7ed', color: tuitionMeta.tone === 'good' ? '#047857' : tuitionMeta.tone === 'bad' ? '#be123c' : '#9a3412' }}>
                {tuitionMeta.tone === 'good' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{tuitionMeta.message}</span>
              </div>
            </section>

            <section className="portal-card portal-section">
              <div className="portal-section-head">
                <h2 className="portal-section-title"><CalendarCheck size={18} /> Điểm danh</h2>
                <span className="portal-pill">{attendance.total} buổi</span>
              </div>
              <div className="portal-kpis">
                <div className="portal-kpi good"><span>Có mặt</span><strong>{attendance.present}</strong></div>
                <div className="portal-kpi bad"><span>Vắng</span><strong>{attendance.absent}</strong></div>
                <div className="portal-kpi warn"><span>Có phép</span><strong>{attendance.excused}</strong></div>
              </div>
              <div className="portal-kpi"><span>Tỷ lệ có mặt</span><strong>{attendance.rate}%</strong></div>
            </section>

            <section className="portal-card portal-section">
              <div className="portal-section-head">
                <h2 className="portal-section-title">Phiếu thu gần đây</h2>
              </div>
              {sortedPayments.length ? (
                <div className="portal-table">
                  {sortedPayments.map(payment => {
                    const p = paymentPeriodOf(payment, period.y);
                    return (
                      <div className="portal-row" key={payment.id || payment.docNum}>
                        <strong className="portal-row-date">{payment.date || '---'}</strong>
                        <div className="portal-row-main">
                          <p className="portal-row-title">{p ? `Học phí T${p.m}/${p.y}` : 'Phiếu thu học phí'}</p>
                          <p className="portal-row-sub">{payment.method || '---'}{payment.note ? ` · ${payment.note}` : ''}</p>
                        </div>
                        <span className="portal-badge good">{fmtVND(Number(payment.amount) || 0)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="portal-empty">Chưa có phiếu thu nào được ghi nhận cho học sinh này.</div>
              )}
            </section>

            <section className="portal-card portal-section">
              <div className="portal-section-head">
                <h2 className="portal-section-title">10 buổi học gần nhất</h2>
              </div>
              {attendance.recent.length ? (
                <div className="portal-table">
                  {attendance.recent.map(row => (
                    <div className="portal-row" key={`${row.lessonId}-${row.date}-${row.classId}`}>
                      <strong className="portal-row-date">{row.date || '---'}</strong>
                      <div className="portal-row-main">
                        <p className="portal-row-title">{row.classId || result.student.classId || '---'} · {row.caDay || '---'}</p>
                        <p className="portal-row-sub">{norm(row.note) || norm(row.content) || 'Đã ghi điểm danh'}</p>
                      </div>
                      <span className={`portal-badge ${statusTone(row.status)}`}>{row.status || '---'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="portal-empty">Chưa có dữ liệu điểm danh cho học sinh này.</div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
