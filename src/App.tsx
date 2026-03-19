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

import React, { useState, useEffect, useCallback, useRef } from 'react';

import { loadSettings, parseDMY, SCRIPT_URL_DEFAULT, FEE_DEFAULT, CA_DAY_DEFAULT, TEACHER_LIST_DEFAULT } from './helpers';
import { RULES } from './rules';
import type { Screen, Student, DeleteTarget } from './types';

import { Sidebar, MobileHeader, BottomNav, useIsDesktop } from './Layout';
import { ErrorBoundary } from './AppComponents';
import CommandPalette from './CommandPalette';
import { useCommands } from './useCommands';
import { useAppData } from './useAppData';
import { useDomains } from './useDomains';

import { StudentModal, StudentDetailModal } from './ModalStudent';
import { ClassModal, BulkTransferModal } from './ModalClass';
import { FABModal, InvoiceModal, ExpenseModal, FinanceDetailModal } from './ModalFinance';
import { DiaryModal, DiaryDetailModal } from './ModalDiary';
import { DeleteModal } from './UIComponents';
import LoadingScreen from './LoadingScreen';

import OverviewTab    from './OverviewTab';
import OperationsTab  from './OperationsTab';
import StudentsTab    from './StudentsTab';
import ClassesTab     from './ClassesTab';
import FinanceTab     from './FinanceTab';
import SettingsTab    from './SettingsTab';
import TeachersTab    from './TeachersTab';
import MaterialsTab   from './MaterialsTab';
import ReportsTab     from './ReportsTab';

export default function App() {

  /* ── Routing ── */
  const [screen, setScreen] = useState<Screen>('overview');
  const goScreen = useCallback((s: Screen) => setScreen(s), []);

  /* ── Settings (localStorage) ── */
  const _saved        = useRef(loadSettings());
  const [baseTuition,  setBaseTuition]  = useState<number>(_saved.current?.baseTuition  ?? FEE_DEFAULT);
  const [schoolYear,   setSchoolYear]   = useState<string>(_saved.current?.schoolYear   ?? '2025-2026');
  const [zaloTpl,      setZaloTpl]      = useState<string>(_saved.current?.zaloTpl      ?? 'Chào anh/chị, học phí tháng [Thang] của cháu [Ten] là [SoTien]. Xin cảm ơn.');
  const [scriptUrl,    setScriptUrl]    = useState<string>(_saved.current?.scriptUrl    ?? SCRIPT_URL_DEFAULT);
  const [centerName,   setCenterName]   = useState<string>(_saved.current?.centerName   ?? 'Lớp Toán NK');
  const [teacher,      setTeacher]      = useState<string>(_saved.current?.teacher      ?? 'LÊ ĐỨC NHÂN');
  const [addr1,        setAddr1]        = useState<string>(_saved.current?.addr1        ?? '15/80 Đào Tấn');
  const [addr2,        setAddr2]        = useState<string>(_saved.current?.addr2        ?? '30 Nguyễn Quang Bích');
  const [phone,        setPhone]        = useState<string>(_saved.current?.phone        ?? '0383634949');
  const [bankId,       setBankId]       = useState<string>(_saved.current?.bankId       ?? 'VCB');
  const [accountNo,    setAccountNo]    = useState<string>(_saved.current?.accountNo    ?? '1234567890');
  const [accountName,  setAccountName]  = useState<string>(_saved.current?.accountName  ?? 'LOP TOAN NK');
  const [accentColor,  setAccentColor]  = useState<'teal'|'indigo'|'rose'|'orange'>(_saved.current?.accentColor ?? 'teal');
  const [showId,       setShowId]       = useState<boolean>(_saved.current?.showId       ?? true);
  const [caDayOptions, setCaDayOptions] = useState<string[]>(_saved.current?.caDayOptions ?? CA_DAY_DEFAULT);
  const [teacherList,  setTeacherList]  = useState<string[]>(_saved.current?.teacherList  ?? TEACHER_LIST_DEFAULT);

  /* ── Responsive — 1 listener duy nhất cho toàn app ── */
  const isDesktop = useIsDesktop();

  /* ── Data layer ── */
  const appData = useAppData({ scriptUrl, teacherList });
  const {
    students, uClasses, payments, expenses, tlogs,
    teachers, leaveRequests, materials, summary,
    loading, gsOk, loadData,
    setStudents, setPayments, setExpenses,
    setTeachers, setMaterials, setLeaveRequests,
  } = appData;

  /* ── Domain hooks (business logic + CRUD) ── */
  const d = useDomains({
    scriptUrl, students, payments, expenses, tlogs, uClasses,
    teachers, materials,
    setStudents, setPayments, setExpenses,
    setTeachers, setMaterials, setLeaveRequests,
    loadData,
  });

  /* ── Modal UI state ── */
  const [showStudent,  setShowStudent]  = useState(false);
  const [showClass,    setShowClass]    = useState(false);
  const [showFAB,      setShowFAB]      = useState(false);
  const [showDiary,    setShowDiary]    = useState(false);
  const [showBulkXfer, setShowBulkXfer] = useState(false);
  const [fabInitialTab, setFabInitialTab] = useState<'income'|'expense'>('income');
  const [preselectedDiaryClass, setPreselectedDiaryClass] = useState('');
  const [preselectedDiaryDate,  setPreselectedDiaryDate]  = useState('');
  const [preselectedDiaryCaDay, setPreselectedDiaryCaDay] = useState('');

  const [vStudent,  setVStudent]  = useState<Student | null>(null);
  const [vDiary,    setVDiary]    = useState<any>(null);
  const [vFinance,  setVFinance]  = useState<Student | null>(null);
  const [vExpense,  setVExpense]  = useState<any>(null);
  const [delTarget, setDelTarget] = useState<DeleteTarget | null>(null);

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
    setPreselectedDiaryClass(classId || '');
    setPreselectedDiaryDate(date || '');
    setPreselectedDiaryCaDay(caDay || '');
    d.setEditDiary(null);
    setShowDiary(true);
  }, [d]);

  const commands = useCommands({
    students, uClasses, goScreen,
    onAddStudent: () => { d.setEditStudent(null); setShowStudent(true); },
    onAddClass:   () => { d.setEditClass(null);   setShowClass(true);  },
    onAddDiary:   handleAddDiary,
    onAddPayment: () => { d.setEditPayment(null); d.setEditExpense(null); setShowFAB(true); },
  });

  /* ── Prev-month deltas ── */
  const prevStudentCount = students.filter(s => {
    const thisMonthStart = new Date(d.curYr, d.curMo - 1, 1).getTime();
    const ts = parseDMY(s.startDate || '');
    return ts > 0 && ts < thisMonthStart;
  }).length;
  const prevTlogCount = tlogs.filter(l => {
    const dt = new Date(parseDMY(l.date || ''));
    return dt.getMonth() + 1 === d.prevMo && dt.getFullYear() === d.prevYr;
  }).length;

  if (loading) return <LoadingScreen />;

  return (
    <div style={{ minHeight: '100dvh', background: '#F0F2F5', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex' }}>
        <Sidebar active={screen} set={goScreen} centerName={centerName} isDesktop={isDesktop} />

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
          <MobileHeader active={screen} set={goScreen} centerName={centerName} isDesktop={isDesktop} />

          <main
            style={{ flex: 1, width: '100%', padding: '20px 24px 32px', boxSizing: 'border-box' }}
            className="print:p-0 mobile-main-content"
          >
            {screen === 'overview' && (
              <ErrorBoundary fallbackLabel="Tổng quan">
                <OverviewTab
                  students={students} payments={payments} expenses={expenses}
                  tlogs={tlogs} uClasses={uClasses} summary={summary}
                  curMo={d.curMo} curYr={d.curYr} paidNow={d.paidNow}
                  goScreen={goScreen} isPaid={d.isPaid}
                  onAddDiary={handleAddDiary}
                  onAddPayment={() => { setFabInitialTab('income'); d.setEditPayment(null); d.setEditExpense(null); setShowFAB(true); }}
                  onAddStudent={() => { d.setEditStudent(null); setShowStudent(true); }}
                  onViewMaterials={() => goScreen('materials')}
                  materialCount={materials.length}
                  prevPaidNow={d.prevPaidNow} prevStudentCount={prevStudentCount} prevTlogCount={prevTlogCount}
                />
              </ErrorBoundary>
            )}

            {screen === 'operations' && (
              <ErrorBoundary fallbackLabel="Vận hành">
                <OperationsTab
                  filtD={d.filtD} pgD={d.pgD} setPgD={d.setPgD} qD={d.qD} setQD={d.setQD}
                  dCls={d.dCls} setDCls={d.setDCls} uClasses={uClasses}
                  IPP={RULES.pagination.defaultIPP}
                  students={students} tlogs={tlogs} leaveRequests={leaveRequests}
                  onViewDiary={log => setVDiary(log)}
                  onEditDiary={log => { d.setEditDiary(log); setShowDiary(true); }}
                  onAddDiary={handleAddDiary}
                  onApproveLeave={d.handleApproveLeave} onRejectLeave={d.handleRejectLeave}
                />
              </ErrorBoundary>
            )}

            {screen === 'teachers' && (
              <ErrorBoundary fallbackLabel="Giáo viên">
                <TeachersTab teachers={teachers} uClasses={uClasses} tlogs={tlogs} onSave={d.handleSaveTeacher} isSaving={d.saving} />
              </ErrorBoundary>
            )}

            {screen === 'classes' && (
              <ErrorBoundary fallbackLabel="Lớp học">
                <ClassesTab
                  uClasses={uClasses} students={students} tlogs={tlogs}
                  curMo={d.curMo} curYr={d.curYr} paidNow={d.paidNow} paidPct={d.paidPct}
                  qCls={d.qCls} setQCls={d.setQCls} fClsTeacher={d.fClsTeacher} setFClsTeacher={d.setFClsTeacher}
                  isPaid={d.isPaid}
                  onEditClass={c => { d.setEditClass(c); setShowClass(true); }}
                  onAddClass={() => { d.setEditClass(null); setShowClass(true); }}
                  uniqueBranches={d.uniqueBranches}
                />
              </ErrorBoundary>
            )}

            {screen === 'students' && (
              <ErrorBoundary fallbackLabel="Học sinh">
                <StudentsTab
                  filtS={d.filtS} pgS={d.pgS} setPgS={d.setPgS} students={students}
                  qS={d.qS} setQS={d.setQS} fCls={d.fCls} setFCls={d.setFCls} uClasses={uClasses}
                  onViewStudent={s => setVStudent(s)}
                  onEditStudent={s => { d.setEditStudent(s); setShowStudent(true); }}
                  onDeleteStudent={t => setDelTarget(t)}
                  onAddStudent={() => { d.setEditStudent(null); setShowStudent(true); }}
                  onBulkTransfer={ss => { d.setBulkStudents(ss); setShowBulkXfer(true); }}
                  curMo={d.curMo} curYr={d.curYr} isPaid={d.isPaid}
                  zaloTpl={zaloTpl} baseTuition={baseTuition}
                />
              </ErrorBoundary>
            )}

            {screen === 'materials' && (
              <ErrorBoundary fallbackLabel="Học liệu">
                <MaterialsTab
                  materials={materials} uClasses={uClasses}
                  onSave={d.handleSaveMaterial}
                  onDelete={d.handleDeleteMaterial}
                  isSaving={d.saving}
                />
              </ErrorBoundary>
            )}

            {screen === 'finance' && (
              <ErrorBoundary fallbackLabel="Tài chính">
                <FinanceTab
                  summary={summary} payments={payments} expenses={expenses}
                  students={students} uClasses={uClasses} tlogs={tlogs}
                  curMo={d.curMo} curYr={d.curYr}
                  qF={d.qF} setQF={d.setQF} fMo={d.fMo} setFMo={d.setFMo}
                  fTch={d.fTch} setFTch={d.setFTch} fFC={d.fFC} setFFC={d.setFFC}
                  fSt={d.fSt} setFSt={d.setFSt} pgF={d.pgF} setPgF={d.setPgF}
                  filtFin={d.filtFin} isPaid={d.isPaid}
                  zaloTpl={zaloTpl} baseTuition={baseTuition} schoolYear={schoolYear}
                  onViewInvoice={p => d.setVInvoice(p)}
                  onViewFinance={s => setVFinance(s)}
                  onShowFAB={() => { setFabInitialTab('income'); d.setEditPayment(null); d.setEditExpense(null); setShowFAB(true); }}
                  onEditPayment={p => { setFabInitialTab('income'); d.setEditPayment(p); d.setEditExpense(null); setShowFAB(true); }}
                  onDeletePayment={p => setDelTarget({ type:'payment', id:p.docNum, name:`${p.studentName} (${p.docNum})` })}
                  onEditExpense={e => { setFabInitialTab('expense'); d.setEditExpense(e); d.setEditPayment(null); setShowFAB(true); }}
                  onDeleteExpense={e => setDelTarget({ type:'expense', id:e.docNum, name:`${e.description} (${e.docNum})` })}
                  onViewExpense={e => setVExpense(e)}
                />
              </ErrorBoundary>
            )}

            {screen === 'reports' && (
              <ErrorBoundary fallbackLabel="Báo cáo">
                <ReportsTab
                  students={students} payments={payments} expenses={expenses}
                  tlogs={tlogs} uClasses={uClasses} summary={summary}
                  curMo={d.curMo} curYr={d.curYr} isPaid={d.isPaid}
                />
              </ErrorBoundary>
            )}

            {screen === 'settings' && (
              <ErrorBoundary fallbackLabel="Cài đặt">
                <SettingsTab
                  baseTuition={baseTuition} setBaseTuition={setBaseTuition}
                  schoolYear={schoolYear}   setSchoolYear={setSchoolYear}
                  zaloTpl={zaloTpl}         setZaloTpl={setZaloTpl}
                  bankId={bankId}           setBankId={setBankId}
                  accountNo={accountNo}     setAccountNo={setAccountNo}
                  accountName={accountName} setAccountName={setAccountName}
                  scriptUrl={scriptUrl}     setScriptUrl={setScriptUrl}
                  gsOk={gsOk} centerName={centerName} setCenterName={setCenterName}
                  teacher={teacher}         setTeacher={setTeacher}
                  addr1={addr1}             setAddr1={setAddr1}
                  addr2={addr2}             setAddr2={setAddr2}
                  phone={phone}             setPhone={setPhone}
                  accentColor={accentColor} setAccentColor={setAccentColor}
                  showId={showId}           setShowId={setShowId}
                  hideInactive={d.hideInactive} setHideInactive={d.setHideInactive}
                  caDayOptions={caDayOptions}   setCaDayOptions={setCaDayOptions}
                  teacherList={teacherList}     setTeacherList={setTeacherList}
                  uniqueBranches={d.uniqueBranches} saving={d.saving} loadData={loadData}
                />
              </ErrorBoundary>
            )}
          </main>

          <footer
            style={{ textAlign:'center', paddingBottom:20, paddingTop:12, fontSize:11, fontWeight:700, color:'#cbd5e1', textTransform:'uppercase', letterSpacing:'0.3em' }}
            className="print:hidden"
          >
            LỚP TOÁN NK • 2026 • v28.0
          </footer>
        </div>
      </div>

      <BottomNav active={screen} set={goScreen} isDesktop={isDesktop} />
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} commands={commands} />

      <StudentModal
        open={showStudent}
        onClose={() => { setShowStudent(false); d.setEditStudent(null); }}
        editing={d.editStudent} uniqueClasses={uClasses} uniqueBranches={d.uniqueBranches}
        isSaving={d.saving} onSave={async (f) => { await d.handleSaveStudent(f); setShowStudent(false); }}
        existingIds={students.map(s => s.id)}
      />
      <ClassModal
        open={showClass}
        onClose={() => { setShowClass(false); d.setEditClass(null); }}
        editing={d.editClass} isSaving={d.saving}
        onSave={async (f) => { await d.handleSaveClass(f); setShowClass(false); }}
        uniqueBranches={d.uniqueBranches} teacherList={teacherList}
      />
      <FABModal
        open={showFAB}
        onClose={() => { setShowFAB(false); d.setEditPayment(null); d.setEditExpense(null); }}
        students={students} baseTuition={baseTuition} isSaving={d.saving}
        onSaveFee={d.handleSaveFee} onSaveExpense={d.handleSaveExpense}
        editingPayment={d.editPayment} editingExpense={d.editExpense} initialTab={fabInitialTab}
      />
      <DiaryModal
        open={showDiary}
        onClose={() => { setShowDiary(false); d.setEditDiary(null); setPreselectedDiaryClass(''); setPreselectedDiaryDate(''); setPreselectedDiaryCaDay(''); }}
        uniqueClasses={uClasses} students={students} isSaving={d.saving}
        onSave={async (f) => { await d.handleSaveDiary(f); setShowDiary(false); }}
        editingLog={d.editDiary} caDayOptions={caDayOptions}
        preselectedClassId={preselectedDiaryClass}
        preselectedDate={preselectedDiaryDate}
        preselectedCaDay={preselectedDiaryCaDay}
      />
      <BulkTransferModal
        open={showBulkXfer}
        onClose={() => { setShowBulkXfer(false); d.setBulkStudents([]); }}
        selectedStudents={d.bulkStudents} uniqueClasses={uClasses}
        isSaving={d.saving} onConfirm={d.handleConfirmBulkTransfer}
      />

      {vStudent   && <StudentDetailModal student={vStudent} onClose={() => setVStudent(null)} tlogs={tlogs} payments={payments} onToggleStatus={d.handleToggleStudentStatus} onSaveNote={d.handleSaveNote} onSaveFacebook={d.handleSaveFacebook} />}
      {vDiary     && <DiaryDetailModal log={vDiary} onClose={() => setVDiary(null)} />}
      {d.vInvoice && <InvoiceModal payment={d.vInvoice} onClose={() => d.setVInvoice(null)} centerName={centerName} bankId={bankId} accountNo={accountNo} accountName={accountName} />}
      {vExpense   && <ExpenseModal expense={vExpense} onClose={() => setVExpense(null)} centerName={centerName} />}
      {vFinance   && <FinanceDetailModal student={vFinance} payments={payments} onClose={() => setVFinance(null)} isPaid={d.isPaid} />}
      {delTarget  && <DeleteModal target={delTarget} onClose={() => setDelTarget(null)} onConfirm={() => { d.handleDelete(delTarget!); setDelTarget(null); }} isSaving={d.saving} />}
    </div>
  );
}
