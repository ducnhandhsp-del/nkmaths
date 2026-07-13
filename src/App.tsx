/**
 * App.tsx — Shell Component
 * Lớp Toán NK · v28.0
 *
 * Sau refactor: ~250 dòng thay vì ~730 dòng.
 * Chỉ còn: gọi hooks, render layout, quản lý modal state, routing.
 *
 * Business logic → useDomains.ts
 * Data fetch     → useAppData.ts
 * KPI / measures → measures.ts
 * Business rules → rules.ts
 * Aggregations   → aggregations.ts
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { BookOpenCheck, CircleDollarSign, LockKeyhole, ReceiptText, UserPlus } from 'lucide-react';

import { loadSettings, saveSettings, parseDMY, SCRIPT_URL_DEFAULT, FEE_DEFAULT, CA_DAY_DEFAULT, TEACHER_LIST_DEFAULT, normalizeCaDayOptions, LESSON_OFF_NOTE_TAG } from './helpers';
import { RULES } from './rules';
import type { Screen, Student, DeleteTarget, TrainingSub, OperationsSub, FinanceSub, ReportsSub } from './types';

import { Sidebar, MobileHeader, BottomNav, useIsDesktop } from './Layout';
import { ErrorBoundary, MobileActionFab } from './AppComponents';
import CommandPalette from './CommandPalette';
import { useCommands } from './useCommands';
import { useAppData } from './useAppData';
import { useDomains } from './useDomains';

import { StudentModal, StudentDetailModal } from './ModalStudent';
import { ClassModal, BulkTransferModal } from './ModalClass';
import { PaymentFormModal, ExpenseFormModal, InvoiceModal, ExpenseModal, FinanceDetailModal } from './ModalFinance';
import { DiaryModal, DiaryDetailModal } from './ModalDiary';
import { DeleteModal } from './UIComponents';
import LoadingScreen from './LoadingScreen';

import OverviewTab    from './OverviewTab';
import OperationsTab  from './OperationsTab';
import LearningTab    from './LearningTab';
import FinanceTab     from './FinanceTab';
import ReportsTab     from './ReportsTab';
import SettingsTab    from './SettingsTab';

const ADMIN_SESSION_TOKEN_KEY = 'ltn-admin-token';

function readAdminSessionToken(): string {
  try { return sessionStorage.getItem(ADMIN_SESSION_TOKEN_KEY) || ''; }
  catch { return ''; }
}

function writeAdminSessionToken(token: string) {
  try { sessionStorage.setItem(ADMIN_SESSION_TOKEN_KEY, token); } catch {}
}

function clearAdminSessionToken() {
  try { sessionStorage.removeItem(ADMIN_SESSION_TOKEN_KEY); } catch {}
}

function stripLegacyAdminToken(settings: any) {
  if (!settings || typeof settings !== 'object') return settings || {};
  const { adminToken: _legacyAdminToken, ...rest } = settings;
  return rest;
}

export default function App() {
  return <AdminGate />;
}

function AdminGate() {
  const [saved] = useState(() => loadSettings());
  const [adminTokenInput, setAdminTokenInput] = useState('');
  const [adminToken, setAdminToken] = useState(readAdminSessionToken);
  const scriptUrl = String(saved?.scriptUrl ?? SCRIPT_URL_DEFAULT).trim();
  const ready = Boolean(scriptUrl && adminToken.trim());

  const handleEnter = useCallback(() => {
    const nextToken = adminTokenInput.trim();
    if (!scriptUrl || !nextToken) return;
    const current = stripLegacyAdminToken(loadSettings() || {});
    saveSettings({ ...current, scriptUrl });
    writeAdminSessionToken(nextToken);
    setAdminToken(nextToken);
    setAdminTokenInput('');
  }, [adminTokenInput, scriptUrl]);

  const handleChangeAdminAccess = useCallback(() => {
    clearAdminSessionToken();
    setAdminToken('');
    setAdminTokenInput('');
  }, []);

  if (ready) return <AdminApp adminToken={adminToken.trim()} onChangeAdminAccess={handleChangeAdminAccess} />;

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: 20,
        background: 'linear-gradient(180deg, #f7fafc 0%, #eef4f8 100%)',
        color: '#0f172a',
      }}
    >
      <form
        onSubmit={e => { e.preventDefault(); handleEnter(); }}
        style={{
          width: 'min(100%, 430px)',
          display: 'grid',
          gap: 18,
          padding: 24,
          borderRadius: 16,
          background: '#fff',
          border: '1px solid #d9e4ef',
          boxShadow: '0 22px 60px rgba(15,23,42,0.10)',
        }}
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 950, color: '#047857', letterSpacing: '0.12em' }}>LOP TOAN NK</div>
              <div style={{ marginTop: 4, fontSize: 13, fontWeight: 800, color: '#64748b' }}>Quản trị trung tâm</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', background: '#ecfdf5', color: '#047857', border: '1px solid #bbf7d0' }}>
              <LockKeyhole size={22} />
            </div>
          </div>

          <div>
            <h1 style={{ margin: 0, fontSize: 24, lineHeight: 1.18, fontWeight: 950, color: '#0f172a', letterSpacing: 0 }}>
              Mở khóa quản trị
            </h1>
            <div style={{ marginTop: 7, fontSize: 14, fontWeight: 700, color: '#64748b', lineHeight: 1.5 }}>
              Nhập mã admin để tiếp tục.
            </div>
          </div>
        </div>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 850, color: '#334155' }}>Admin token</span>
          <input
            type="password"
            value={adminTokenInput}
            onChange={e => setAdminTokenInput(e.target.value)}
            placeholder="Nhập mã admin"
            autoComplete="current-password"
            autoFocus
            style={{
              minHeight: 46,
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              padding: '0 13px',
              fontSize: 15,
              fontWeight: 800,
              color: '#0f172a',
              outline: 'none',
              boxShadow: 'inset 0 1px 2px rgba(15,23,42,0.04)',
            }}
          />
        </label>

        <button
          type="submit"
          disabled={!adminTokenInput.trim()}
          style={{
            minHeight: 42,
            border: 0,
            borderRadius: 10,
            background: !adminTokenInput.trim() ? '#cbd5e1' : '#047857',
            color: '#fff',
            fontSize: 14,
            fontWeight: 900,
            cursor: !adminTokenInput.trim() ? 'not-allowed' : 'pointer',
            boxShadow: !adminTokenInput.trim() ? 'none' : '0 10px 24px rgba(4,120,87,0.24)',
          }}
        >
          Vào hệ thống
        </button>

        <div style={{ borderTop: '1px solid #edf2f7', paddingTop: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>Dữ liệu quản trị được bảo vệ</span>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.08em' }}>ADMIN</span>
        </div>
      </form>
    </div>
  );
}

function AdminApp({ adminToken, onChangeAdminAccess }: { adminToken: string; onChangeAdminAccess: () => void }) {

  /* ── Routing ── */
  const [screen, setScreen] = useState<Screen>('overview');
  const goScreen = useCallback((s: Screen) => setScreen(s), []);
  const [trainingSubtab, setTrainingSubtab] = useState<TrainingSub>('students');
  const goTraining = useCallback((sub: TrainingSub = 'students') => {
    setTrainingSubtab(sub);
    setScreen('training');
  }, []);
  const [operationsSubtab, setOperationsSubtab] = useState<OperationsSub>('schedule');
  const goOperations = useCallback((sub: OperationsSub = 'schedule') => {
    setOperationsSubtab(sub);
    setScreen('operations');
  }, []);
  const [financeSubtab, setFinanceSubtab] = useState<FinanceSub>('debt');
  const goFinance = useCallback((sub: FinanceSub = 'debt') => {
    setFinanceSubtab(sub);
    setScreen('finance');
  }, []);
  const [reportsSubtab, setReportsSubtab] = useState<ReportsSub>('finance');
  const goReports = useCallback((sub: ReportsSub = 'finance') => {
    setReportsSubtab(sub);
    setScreen('reports');
  }, []);

  /* ── Settings (localStorage) ── */
  const _saved        = useRef(loadSettings());
  const [baseTuition,  setBaseTuition]  = useState<number>(_saved.current?.baseTuition  ?? FEE_DEFAULT);
  const [schoolYear,   setSchoolYear]   = useState<string>(_saved.current?.schoolYear   ?? '2026-2027');
  const [tuitionDueDay, setTuitionDueDay] = useState<number>(_saved.current?.tuitionDueDay ?? 15);
  const [, setZaloTpl] = useState<string>(_saved.current?.zaloTpl ?? 'Chào phụ huynh em [Ten], LỚP TOÁN NK thông báo học phí theo chu kỳ học hiện tại của em đang cần thu [SoTien]. Phụ huynh vui lòng kiểm tra và thanh toán giúp lớp. Em cảm ơn ạ.');
  const [scriptUrl]    = useState<string>(_saved.current?.scriptUrl    ?? SCRIPT_URL_DEFAULT);
  const [centerName,   setCenterName]   = useState<string>(_saved.current?.centerName   ?? 'LỚP TOÁN NK');
  const [teacher,      setTeacher]      = useState<string>(_saved.current?.teacher      ?? 'LÊ ĐỨC NHÂN');
  const [addr1,        setAddr1]        = useState<string>(_saved.current?.addr1        ?? '15/80 Đào Tấn');
  const [addr2,        setAddr2]        = useState<string>(_saved.current?.addr2        ?? '30 Nguyễn Quang Bích');
  const [phone,        setPhone]        = useState<string>(_saved.current?.phone        ?? '0383634949');
  const [bankId,       setBankId]       = useState<string>(_saved.current?.bankId       ?? 'VCB');
  const [accountNo,    setAccountNo]    = useState<string>(_saved.current?.accountNo    ?? '1234567890');
  const [accountName,  setAccountName]  = useState<string>(_saved.current?.accountName  ?? 'LOP TOAN NK');
  const [caDayOptions, setCaDayOptions] = useState<string[]>(normalizeCaDayOptions(_saved.current?.caDayOptions ?? CA_DAY_DEFAULT));
  const [teacherList,  setTeacherList]  = useState<string[]>(_saved.current?.teacherList  ?? TEACHER_LIST_DEFAULT);

  /* ── Responsive — 1 listener duy nhất cho toàn app ── */
  const isDesktop = useIsDesktop();

  /* ── Data layer ── */
  const appData = useAppData({ scriptUrl, teacherList, adminToken });
  const {
    students, uClasses, payments, expenses, tlogs,
    teachers, leaveRequests, materials, summary,
    loading, gsOk, loadData, cacheMeta, syncState, initialLoadError,
    setStudents, setUClasses, setPayments, setExpenses, setTlogs,
    setTeachers, setMaterials, setLeaveRequests,
    silentRef, lastLoadTimeRef, isSavingRef,
  } = appData;

  /* ── Domain hooks (business logic + CRUD) ── */
  const d = useDomains({
    scriptUrl, adminToken, schoolYear, students, payments, expenses, tlogs, uClasses,
    teachers, materials,
    setStudents, setUClasses, setPayments, setExpenses, setTlogs,
    setTeachers, setMaterials, setLeaveRequests,
    loadData,
    silentRef,
    lastLoadTimeRef,
    isSavingRef,
  });

  /* ── Modal UI state ── */
  const [showStudent,  setShowStudent]  = useState(false);
  const [showClass,    setShowClass]    = useState(false);
  const [showPayment,  setShowPayment]  = useState(false);
  const [showExpense,  setShowExpense]  = useState(false);
  const [showDiary,    setShowDiary]    = useState(false);
  const [showBulkXfer, setShowBulkXfer] = useState(false);
  const [paymentDraft, setPaymentDraft] = useState<any>(null);
  const [preselectedDiaryClass, setPreselectedDiaryClass] = useState('');
  const [preselectedDiaryDate,  setPreselectedDiaryDate]  = useState('');
  const [preselectedDiaryCaDay, setPreselectedDiaryCaDay] = useState('');

  const [vStudent,  setVStudent]  = useState<Student | null>(null);
  const [vDiary,    setVDiary]    = useState<any>(null);
  const [vFinance,  setVFinance]  = useState<Student | null>(null);
  const [vExpense,  setVExpense]  = useState<any>(null);
  const [delTarget, setDelTarget] = useState<DeleteTarget | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);
  const lastRouteRef = useRef('');

  /* ── Ctrl+K ── */
  const [cmdOpen, setCmdOpen] = useState(false);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(p => !p); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const handleAddDiary = useCallback((classId?: string, date?: string, caDay?: string) => {
    // Guard: các button onClick đôi khi pass MouseEvent thay vì string
    const safeClassId = typeof classId === 'string' ? classId : '';
    const safeDate    = typeof date    === 'string' ? date    : '';
    const safeCaDay   = typeof caDay   === 'string' ? caDay   : '';
    setPreselectedDiaryClass(safeClassId);
    setPreselectedDiaryDate(safeDate);
    setPreselectedDiaryCaDay(safeCaDay);
    d.setEditDiary(null);
    setShowDiary(true);
  }, [d.setEditDiary]); // stable: useState setter không thay đổi

  const handleMarkLessonOff = useCallback((classId: string, date: string, caDay: string, reason: string, teacherName?: string) => {
    const cleanReason = reason.trim() || 'Lớp nghỉ/GV bận.';
    return d.handleSaveDiary({
      date,
      classId,
      caDay,
      content: 'Lớp nghỉ',
      homework: '---',
      teacherNote: `${LESSON_OFF_NOTE_TAG} ${cleanReason}`,
      teacherName: teacherName || '',
      attendance: [],
    });
  }, [d.handleSaveDiary]);

  const commands = useCommands({
    students, uClasses, goScreen, goTraining,
    onAddStudent: () => { goTraining('students'); d.setEditStudent(null); setShowStudent(true); },
    onAddClass:   () => { goTraining('classes'); d.setEditClass(null); setShowClass(true); },
    onAddDiary:   (classId?: string) => { goOperations('schedule'); handleAddDiary(classId); },
    onAddPayment: () => { goFinance('ledger'); d.setEditPayment(null); d.setEditExpense(null); setPaymentDraft(null); setShowPayment(true); },
  });

  useEffect(() => {
    const routeKey = `${screen}:${trainingSubtab}:${operationsSubtab}:${financeSubtab}:${reportsSubtab}`;
    if (lastRouteRef.current === routeKey) return;
    lastRouteRef.current = routeKey;

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    mainRef.current?.scrollTo?.({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });

    if (screen === 'training') {
      if (trainingSubtab === 'students') {
        d.setQS('');
        d.setFCls('');
        d.setHideInactive(true);
        d.setPgS(1);
      } else if (trainingSubtab === 'classes') {
        d.setQCls('');
        d.setFClsTeacher('');
      }
    }
    if (screen === 'operations') {
      d.setQD('');
      d.setDCls('');
      d.setPgD(1);
    }
    if (screen === 'finance') {
      d.setQF('');
      d.setFTch('');
      d.setFFC('');
      d.setFMo(`${String(d.curMo).padStart(2, '0')}/${d.curYr}`);
      d.setFSt(financeSubtab === 'debt' ? 'all' : '');
      d.setPgF(1);
    }
  }, [screen, trainingSubtab, operationsSubtab, financeSubtab, reportsSubtab]);

  /* ── Prev-month deltas ── */
  // prevStudentCount = số HS active đầu tháng này (để delta = active now - active last month)
  const prevStudentCount = useMemo(() => {
    const thisMonthStart = new Date(d.curYr, d.curMo - 1, 1).getTime();
    return students.filter(s => {
      const startTs = parseDMY(s.startDate || '');
      if (!startTs || startTs >= thisMonthStart) return false; // bắt đầu tháng này → không tính
      // Còn active đầu tháng = chưa nghỉ hoặc nghỉ từ tháng này trở đi
      const endTs = parseDMY(s.endDate || '');
      return !endTs || endTs >= thisMonthStart;
    }).length;
  }, [students, d.curYr, d.curMo]);

  // prevTlogCount: encode để delta = tháng này - tháng trước
  // OverviewTab tính: delta = tlogs.length - prevTlogCount
  // → prevTlogCount = tlogs.length - (thisMonth - lastMonth)
  const prevTlogCount = useMemo(() => {
    const thisM = tlogs.filter(l => {
      const dt = new Date(parseDMY(l.date || ''));
      return dt.getMonth() + 1 === d.curMo && dt.getFullYear() === d.curYr;
    }).length;
    const lastM = tlogs.filter(l => {
      const dt = new Date(parseDMY(l.date || ''));
      return dt.getMonth() + 1 === d.prevMo && dt.getFullYear() === d.prevYr;
    }).length;
    return tlogs.length - thisM + lastM;
  }, [tlogs, d.curMo, d.curYr, d.prevMo, d.prevYr]);

  const mobileQuickActions = useMemo(() => [
    {
      key: 'lesson',
      label: 'Ghi buổi học',
      icon: <BookOpenCheck size={15} />,
      tone: 'primary' as const,
      onClick: () => {
        goOperations('schedule');
        handleAddDiary();
      },
    },
    {
      key: 'student',
      label: 'Thêm học sinh',
      icon: <UserPlus size={15} />,
      tone: 'success' as const,
      onClick: () => {
        goTraining('students');
        d.setEditStudent(null);
        setShowStudent(true);
      },
    },
    {
      key: 'payment',
      label: 'Phiếu thu',
      icon: <ReceiptText size={15} />,
      tone: 'success' as const,
      onClick: () => {
        goFinance('ledger');
        d.setEditPayment(null);
        d.setEditExpense(null);
        setPaymentDraft(null);
        setShowPayment(true);
      },
    },
    {
      key: 'expense',
      label: 'Phiếu chi',
      icon: <CircleDollarSign size={15} />,
      tone: 'danger' as const,
      onClick: () => {
        goFinance('expense');
        d.setEditPayment(null);
        d.setEditExpense(null);
        setShowExpense(true);
      },
    },
  ], [d.setEditExpense, d.setEditPayment, d.setEditStudent, goFinance, goOperations, goTraining, handleAddDiary]);

  if (loading) {
    return (
      <LoadingScreen
        error={initialLoadError}
        onRetry={() => { void loadData({ mode: 'foreground', reason: 'manual' }); }}
        secondaryActionLabel="Đổi admin token"
        onSecondaryAction={onChangeAdminAccess}
      />
    );
  }
  return (
    <div style={{ minHeight: '100dvh', background: '#F0F2F8', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex' }}>
        <Sidebar
          active={screen}
          set={goScreen}
          centerName={centerName}
          isDesktop={isDesktop}
          trainingSubtab={trainingSubtab}
          setTrainingSubtab={setTrainingSubtab}
          operationsSubtab={operationsSubtab}
          setOperationsSubtab={setOperationsSubtab}
          financeSubtab={financeSubtab}
          setFinanceSubtab={setFinanceSubtab}
          reportsSubtab={reportsSubtab}
          setReportsSubtab={setReportsSubtab}
          cacheMeta={cacheMeta}
          syncState={syncState}
        />

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
          <MobileHeader
            active={screen}
            set={goScreen}
            centerName={centerName}
            isDesktop={isDesktop}
            trainingSubtab={trainingSubtab}
            setTrainingSubtab={setTrainingSubtab}
            operationsSubtab={operationsSubtab}
            setOperationsSubtab={setOperationsSubtab}
            financeSubtab={financeSubtab}
            setFinanceSubtab={setFinanceSubtab}
            reportsSubtab={reportsSubtab}
            setReportsSubtab={setReportsSubtab}
            cacheMeta={cacheMeta}
            syncState={syncState}
          />

          <main
            ref={mainRef}
            style={{ flex: 1, width: '100%', padding: isDesktop ? '24px 28px 32px' : '14px 16px 24px', boxSizing: 'border-box' }}
            className="print:p-0 mobile-main-content"
          >
            {screen === 'overview' && (
              <ErrorBoundary fallbackLabel="Tổng quan">
                <OverviewTab
                  students={students} payments={payments}
                  tlogs={tlogs} uClasses={uClasses}
                  curMo={d.curMo} curYr={d.curYr} baseTuition={baseTuition}
                  goTraining={goTraining} goOperations={goOperations} goFinance={goFinance} isPaid={d.isPaid}
                  onAddDiary={(classId, date, caDay) => { goOperations('schedule'); handleAddDiary(classId, date, caDay); }}
                  onAddIncome={() => { goFinance('ledger'); d.setEditPayment(null); d.setEditExpense(null); setPaymentDraft(null); setShowPayment(true); }}
                  onAddExpense={() => { goFinance('expense'); d.setEditPayment(null); d.setEditExpense(null); setShowExpense(true); }}
                />
              </ErrorBoundary>
            )}

            {screen === 'operations' && (
              <ErrorBoundary fallbackLabel="Vận hành">
                <OperationsTab
                  key={operationsSubtab}
                  sub={operationsSubtab} setSub={setOperationsSubtab}
                  filtD={d.filtD} pgD={d.pgD} setPgD={d.setPgD} qD={d.qD} setQD={d.setQD}
                  dCls={d.dCls} setDCls={d.setDCls} uClasses={uClasses}
                  IPP={RULES.pagination.defaultIPP}
                  students={students} tlogs={tlogs} leaveRequests={leaveRequests}
                  onViewDiary={log => setVDiary(log)}
                  onEditDiary={log => { d.setEditDiary(log); setShowDiary(true); }}
                  onAddDiary={handleAddDiary}
                  onMarkLessonOff={handleMarkLessonOff}
                  onApproveLeave={d.handleApproveLeave} onRejectLeave={d.handleRejectLeave}
                />
              </ErrorBoundary>
            )}

            {screen === 'training' && (
              <ErrorBoundary fallbackLabel="Đào tạo">
                <LearningTab
                  key={trainingSubtab}
                  trainingSubtab={trainingSubtab}
                  setTrainingSubtab={setTrainingSubtab}
                  uClasses={uClasses} students={students}
                  teachers={teachers} payments={payments} tlogs={tlogs}
                  curMo={d.curMo} curYr={d.curYr}
                  baseTuition={baseTuition}
                  qCls={d.qCls} setQCls={d.setQCls}
                  fClsTeacher={d.fClsTeacher} setFClsTeacher={d.setFClsTeacher}
                  isPaid={d.isPaid}
                  onEditClass={c => { d.setEditClass(c); setShowClass(true); }}
                  onDeleteClass={t => setDelTarget(t)}
                  onAddClass={() => { d.setEditClass(null); setShowClass(true); }}
                  uniqueBranches={d.uniqueBranches}
                  filtS={d.filtS} pgS={d.pgS} setPgS={d.setPgS}
                  qS={d.qS} setQS={d.setQS}
                  fCls={d.fCls} setFCls={d.setFCls}
                  hideInactive={d.hideInactive} setHideInactive={d.setHideInactive}
                  onViewStudent={s => setVStudent(s)}
                  onEditStudent={s => { d.setEditStudent(s); setShowStudent(true); }}
                  onDeleteStudent={t => setDelTarget(t)}
                  onAddStudent={() => { d.setEditStudent(null); setShowStudent(true); }}
                  onCollectFee={s => setVFinance(s)}
                  onBulkTransfer={ss => { d.setBulkStudents(ss); setShowBulkXfer(true); }}
                  onSaveTeacher={d.handleSaveTeacher}
                  onDeleteTeacher={t => setDelTarget(t)}
                  isSaving={d.isSaving('teacher')}
                  onAddDiary={handleAddDiary}
                />
              </ErrorBoundary>
            )}

            {screen === 'finance' && (
              <ErrorBoundary fallbackLabel="Tài chính">
                <FinanceTab
                  key={financeSubtab}
                  financeSubtab={financeSubtab}
                  setFinanceSubtab={setFinanceSubtab}
                  payments={payments} expenses={expenses}
                  students={students} uClasses={uClasses} tlogs={tlogs}
                  curMo={d.curMo} curYr={d.curYr}
                  qF={d.qF} setQF={d.setQF} fMo={d.fMo} setFMo={d.setFMo}
                  fTch={d.fTch} setFTch={d.setFTch} fFC={d.fFC} setFFC={d.setFFC}
                  fSt={d.fSt} setFSt={d.setFSt} pgF={d.pgF} setPgF={d.setPgF}
                  filtFin={d.filtFin} isPaid={d.isPaid}
                  baseTuition={baseTuition} schoolYear={schoolYear} tuitionDueDay={tuitionDueDay}
                  onViewInvoice={p => d.setVInvoice(p)}
                  onViewFinance={s => setVFinance(s)}
                  onShowFAB={(tab: 'income' | 'expense' = 'income', draft?: any) => {
                    d.setEditPayment(null);
                    d.setEditExpense(null);
                    if (tab === 'expense') {
                      setPaymentDraft(null);
                      setShowExpense(true);
                    } else {
                      setPaymentDraft(draft || null);
                      setShowPayment(true);
                    }
                  }}
                  onEditPayment={p => { d.setEditPayment(p); d.setEditExpense(null); setPaymentDraft(null); setShowPayment(true); }}
                  onDeletePayment={p => setDelTarget({ type:'payment', id:p.docNum, name:`${p.studentName} (${p.docNum})` })}
                  onEditExpense={e => { d.setEditExpense(e); d.setEditPayment(null); setShowExpense(true); }}
                  onDeleteExpense={e => setDelTarget({ type:'expense', id:e.docNum, name:`${e.description} (${e.docNum})` })}
                  onViewExpense={e => setVExpense(e)}
                />
              </ErrorBoundary>
            )}

            {screen === 'reports' && (
              <ErrorBoundary fallbackLabel="Báo cáo">
                <ReportsTab
                  key={reportsSubtab}
                  reportsSubtab={reportsSubtab}
                  setReportsSubtab={setReportsSubtab}
                  students={students}
                  payments={payments}
                  expenses={expenses}
                  tlogs={tlogs}
                  uClasses={uClasses}
                  summary={summary}
                  curMo={d.curMo}
                  curYr={d.curYr}
                  isPaid={d.isPaid}
                  baseTuition={baseTuition}
                />
              </ErrorBoundary>
            )}

            {screen === 'settings' && (
              <ErrorBoundary fallbackLabel="Cài đặt">
                <SettingsTab
                  baseTuition={baseTuition} setBaseTuition={setBaseTuition}
                  schoolYear={schoolYear}   setSchoolYear={setSchoolYear}
                  tuitionDueDay={tuitionDueDay} setTuitionDueDay={setTuitionDueDay}
                  setZaloTpl={setZaloTpl}
                  bankId={bankId}           setBankId={setBankId}
                  accountNo={accountNo}     setAccountNo={setAccountNo}
                  accountName={accountName} setAccountName={setAccountName}
                  scriptUrl={scriptUrl}
                  adminToken={adminToken}
                  gsOk={gsOk}
                  cacheMeta={cacheMeta}
                  syncState={syncState}
                  saving={d.saving} loadData={loadData}
                />
              </ErrorBoundary>
            )}
          </main>

          <footer
            style={{ textAlign:'center', paddingBottom:20, paddingTop:12, fontSize:11, fontWeight:700, color:'#cbd5e1', textTransform:'uppercase', letterSpacing:'0.3em' }}
            className="print:hidden"
          >
            LỚP TOÁN NK
          </footer>
        </div>
      </div>

      <BottomNav active={screen} set={goScreen} isDesktop={isDesktop} />
      {!isDesktop && <MobileActionFab actions={mobileQuickActions} label="Thao tác nhanh" />}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} commands={commands} />

      <StudentModal
        open={showStudent}
        onClose={() => { setShowStudent(false); d.setEditStudent(null); }}
        editing={d.editStudent} uniqueClasses={uClasses} uniqueBranches={d.uniqueBranches}
        isSaving={d.isSaving('student')} onSave={(f) => { setShowStudent(false); d.setEditStudent(null); return d.handleSaveStudent(f); }}
        existingIds={students.map(s => s.id)}
      />
      <ClassModal
        open={showClass}
        onClose={() => { setShowClass(false); d.setEditClass(null); }}
        editing={d.editClass} isSaving={d.isSaving('class')}
        onSave={(f) => d.handleSaveClass(f).then(() => { setShowClass(false); d.setEditClass(null); })}
        uniqueBranches={d.uniqueBranches} teacherList={teacherList}
      />
      <PaymentFormModal
        open={showPayment}
        onClose={() => { setShowPayment(false); d.setEditPayment(null); setPaymentDraft(null); }}
        students={students} classes={uClasses} baseTuition={baseTuition} isSaving={d.isSaving('payment')}
        teacherList={teacherList}
        payments={payments}
        tlogs={tlogs}
        onSave={d.handleSaveFee}
        editingPayment={d.editPayment}
        initialPayment={paymentDraft}
      />
      <ExpenseFormModal
        open={showExpense}
        onClose={() => { setShowExpense(false); d.setEditExpense(null); }}
        expenses={expenses}
        isSaving={d.isSaving('expense')}
        onSave={d.handleSaveExpense}
        editingExpense={d.editExpense}
      />
      <DiaryModal
        open={showDiary}
        onClose={() => { setShowDiary(false); d.setEditDiary(null); setPreselectedDiaryClass(''); setPreselectedDiaryDate(''); setPreselectedDiaryCaDay(''); }}
        uniqueClasses={uClasses} students={students} isSaving={d.isSaving('lesson')}
        leaveRequests={leaveRequests}
        onSave={(f) => {
          // Đóng modal ngay lập tức — save chạy background, toast báo kết quả
          setShowDiary(false);
          d.setEditDiary(null);
          setPreselectedDiaryClass('');
          setPreselectedDiaryDate('');
          setPreselectedDiaryCaDay('');
          return d.handleSaveDiary(f);
        }}
        editingLog={d.editDiary} caDayOptions={caDayOptions}
        preselectedClassId={preselectedDiaryClass}
        preselectedDate={preselectedDiaryDate}
        preselectedCaDay={preselectedDiaryCaDay}
      />
      <BulkTransferModal
        open={showBulkXfer}
        onClose={() => { setShowBulkXfer(false); d.setBulkStudents([]); }}
        selectedStudents={d.bulkStudents} uniqueClasses={uClasses}
        isSaving={d.isSaving('student')} onConfirm={d.handleConfirmBulkTransfer}
      />

      {vStudent   && <StudentDetailModal student={vStudent} onClose={() => setVStudent(null)} tlogs={tlogs} payments={payments} onToggleStatus={d.handleToggleStudentStatus} onSaveNote={d.handleSaveNote} onSaveFacebook={d.handleSaveFacebook} onEdit={(s) => { setVStudent(null); d.setEditStudent(s); setShowStudent(true); }} onDelete={(target) => { setVStudent(null); setDelTarget(target); }} />}
      {vDiary     && <DiaryDetailModal log={vDiary} onClose={() => setVDiary(null)} onEdit={(log) => { setVDiary(null); d.setEditDiary(log); setShowDiary(true); }} />}
      {d.vInvoice && <InvoiceModal payment={d.vInvoice} onClose={() => d.setVInvoice(null)} centerName={centerName} bankId={bankId} accountNo={accountNo} accountName={accountName} students={students} classes={uClasses} />}
      {vExpense   && <ExpenseModal expense={vExpense} onClose={() => setVExpense(null)} centerName={centerName} />}
      {vFinance   && <FinanceDetailModal student={vFinance} classes={uClasses} payments={payments} tlogs={tlogs} baseTuition={baseTuition} onClose={() => setVFinance(null)} />}
      {delTarget  && <DeleteModal target={delTarget} onClose={() => setDelTarget(null)} onConfirm={() => { d.handleDelete(delTarget!); setDelTarget(null); }} isSaving={d.isSaving('delete')} />}
    </div>
  );
}
