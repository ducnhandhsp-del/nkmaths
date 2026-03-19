/**
 * useDomains.ts — Domain Hooks (Skill Layer)
 * Lớp Toán NK · v28.0
 *
 * Tách toàn bộ CRUD handlers + derived state ra khỏi App.tsx.
 * Mỗi domain là một hook độc lập, testable, tái dùng được.
 *
 * App.tsx trước đây chứa ~200 dòng handlers.
 * Sau khi tách: App.tsx chỉ gọi hooks và render layout.
 */

import { useState, useMemo, useCallback, useRef, type Dispatch, type SetStateAction } from 'react';
import toast from 'react-hot-toast';

import type { Student, Payment, Expense, Teacher, LeaveRequest, Material, DeleteTarget } from './types';
import {
  fetchWithTimeout, formatDate, sanitizeObject, sanitizeAttendance,
  parseCaDayToHours, parseDMY, isStudentActive,
} from './helpers';
import { buildPaidMap, isPaidFn, getActiveStudents, calcPaidPct, countPaidStudents } from './measures';
import { RULES } from './rules';

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */

interface DomainConfig {
  scriptUrl:   string;
  students:    Student[];
  payments:    Payment[];
  expenses:    Expense[];
  tlogs:       any[];
  uClasses:    any[];
  teachers:    Teacher[];
  materials:   Material[];
  setStudents:      Dispatch<SetStateAction<Student[]>>;
  setPayments:      Dispatch<SetStateAction<Payment[]>>;
  setExpenses:      Dispatch<SetStateAction<Expense[]>>;
  setTeachers:      Dispatch<SetStateAction<Teacher[]>>;
  setMaterials:     Dispatch<SetStateAction<Material[]>>;
  setLeaveRequests: Dispatch<SetStateAction<LeaveRequest[]>>;
  loadData:    () => Promise<void>;
}

/* ─────────────────────────────────────────────
   HOOK CHÍNH: useDomains
───────────────────────────────────────────── */

export function useDomains(cfg: DomainConfig) {
  const {
    scriptUrl, students, payments, expenses, tlogs, uClasses,
    teachers, materials,
    setStudents, setPayments, setExpenses, setTeachers, setMaterials, setLeaveRequests,
    loadData,
  } = cfg;

  const [saving,    setSaving]    = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editClass,   setEditClass]   = useState<any>(null);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [editDiary,   setEditDiary]   = useState<any>(null);

  const savingRef = useRef(false);

  /* ── api helper ── */
  const api = useCallback((body: object) =>
    fetchWithTimeout(scriptUrl, {
      method: 'POST',
      body: JSON.stringify(body),
      timeout: RULES.network.fetchTimeout,
    })
  , [scriptUrl]);

  /* ── withSave: error handling tập trung, đảm bảo saving luôn reset ── */
  const withSave = useCallback(async (fn: () => Promise<void>, successMsg?: string) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await fn();
      if (successMsg) toast.success(successMsg);
    } catch (err: any) {
      toast.error('❌ ' + (err.message || 'Lỗi khi lưu'));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, []);

  /* ── mkTs: timestamp string ── */
  const mkTs = (d: string) => {
    const n = new Date();
    return `${n.getHours().toString().padStart(2,'0')}:${n.getMinutes().toString().padStart(2,'0')} - ${formatDate(d)}`;
  };

  /* ── setSilent để reload không flash loading ── */
  const setSilent = useCallback(() => {
    (loadData as any).__setSilent?.();
  }, [loadData]);

  /* ════════════════════════════════════════════
     STUDENTS DOMAIN
  ════════════════════════════════════════════ */
  const handleSaveStudent = useCallback(async (form: any) =>
    withSave(async () => {
      if (!form.id?.trim() || !form.name?.trim())
        throw new Error('⚠️ Mã HS và Tên là bắt buộc!');
      const normalizedId = form.id.trim().replace(/\s+/g, '');
      if (!editStudent && students.some(s => s.id === normalizedId))
        throw new Error(`⚠️ Mã HS "${normalizedId}" đã tồn tại!`);
      form = { ...form, id: normalizedId };
      await api({
        action:    editStudent ? 'updateHS' : 'saveHS',
        ...sanitizeObject({ ...form, startDate: form.startDate ? formatDate(form.startDate) : '' }),
      });
      setEditStudent(null);
      setSilent(); loadData();
    }, editStudent ? '✅ Đã cập nhật học sinh!' : '✅ Đã thêm học sinh mới!')
  , [withSave, editStudent, students, api, setSilent, loadData]);

  const handleToggleStudentStatus = useCallback(async (s: Student, chosenEndDate?: string) => {
    const isInactive = s.status === 'inactive' || (s.endDate && s.endDate !== '---' && s.endDate !== '');
    return withSave(async () => {
      let endDateStr = '';
      if (!isInactive) {
        if (chosenEndDate) {
          const [y, m, d] = chosenEndDate.split('-');
          endDateStr = `${d}/${m}/${y}`;
        } else {
          const today = new Date();
          endDateStr = `${today.getDate().toString().padStart(2,'0')}/${(today.getMonth()+1).toString().padStart(2,'0')}/${today.getFullYear()}`;
        }
      }
      await api({
        action: 'updateHS', id: s.id, name: s.name, dob: s.dob, branch: s.branch,
        grade: s.grade, school: s.school, teacher: s.teacher, parentName: s.parentName,
        parentPhone: s.parentPhone, studentPhone: s.studentPhone, address: s.address,
        academicLevel: s.academicLevel, goal: s.goal, supportNeeded: s.supportNeeded,
        classId: s.classId, startDate: s.startDate,
        endDate: isInactive ? '' : endDateStr,
        status:  isInactive ? 'active' : 'inactive',
      });
      setSilent(); loadData();
    }, isInactive ? '✅ Đã kích hoạt lại!' : '✅ Đã đánh dấu nghỉ học!');
  }, [withSave, api, setSilent, loadData]);

  const handleSaveFacebook = useCallback(async (s: Student, facebookUrl: string) =>
    withSave(async () => {
      await api({
        action: 'updateHS', id: s.id, name: s.name, dob: s.dob, branch: s.branch,
        grade: s.grade, school: s.school, teacher: s.teacher, parentName: s.parentName,
        parentPhone: s.parentPhone, studentPhone: s.studentPhone, address: s.address,
        academicLevel: s.academicLevel, goal: s.goal, supportNeeded: s.supportNeeded,
        notes: s.notes || '', facebookUrl,
        classId: s.classId, startDate: s.startDate, endDate: s.endDate || '', status: s.status,
      });
      setSilent(); loadData();
    }, '✅ Đã lưu Facebook URL!')
  , [withSave, api, setSilent, loadData]);

  const handleSaveNote = useCallback(async (s: Student, notes: string) =>
    withSave(async () => {
      await api({
        action: 'updateHS', id: s.id, name: s.name, dob: s.dob, branch: s.branch,
        grade: s.grade, school: s.school, teacher: s.teacher, parentName: s.parentName,
        parentPhone: s.parentPhone, studentPhone: s.studentPhone, address: s.address,
        academicLevel: s.academicLevel, goal: s.goal, supportNeeded: s.supportNeeded,
        notes, classId: s.classId, startDate: s.startDate, endDate: s.endDate || '', status: s.status,
      });
      setSilent(); loadData();
    }, '✅ Đã lưu nhận xét!')
  , [withSave, api, setSilent, loadData]);

  /* ════════════════════════════════════════════
     CLASSES DOMAIN
  ════════════════════════════════════════════ */
  const handleSaveClass = useCallback(async (form: any) =>
    withSave(async () => {
      if (!form['Mã Lớp']?.trim()) throw new Error('⚠️ Mã lớp là bắt buộc!');
      await api({ action: editClass ? 'updateClass' : 'saveClass', ...sanitizeObject(form) });
      setEditClass(null);
      setSilent(); loadData();
    }, editClass ? '✅ Đã cập nhật lớp!' : '✅ Đã thêm lớp mới!')
  , [withSave, editClass, api, setSilent, loadData]);

  /* Bulk transfer nhiều học sinh */
  const [bulkStudents, setBulkStudents] = useState<Student[]>([]);

  const handleConfirmBulkTransfer = useCallback(async (newClassId: string, transferDate: string) =>
    withSave(async () => {
      const [ty, tm, td] = transferDate.split('-');
      await Promise.all(bulkStudents.map(s =>
        api({ action: 'updateHS', ...s, classId: newClassId, fromClassId: s.classId, transferDate: `${td}/${tm}/${ty}` })
      ));
      setBulkStudents([]);
      setSilent(); loadData();
    }, `✅ Đã chuyển ${bulkStudents.length} học sinh!`)
  , [withSave, bulkStudents, api, setSilent, loadData]);

  /* ════════════════════════════════════════════
     FINANCE DOMAIN
  ════════════════════════════════════════════ */
  const [vInvoice, setVInvoice] = useState<Payment | null>(null);

  const handleSaveFee = useCallback(async (form: any) =>
    withSave(async () => {
      const rawId = (form.maHS || '').trim();
      const maHS  = rawId.includes(' - ') ? rawId.split(' - ')[0].trim() : rawId;
      if (!maHS)                              throw new Error('⚠️ Vui lòng nhập mã HS!');
      if (!form.date)                         throw new Error('⚠️ Vui lòng chọn ngày thu!');
      if (!form.soTien || Number(form.soTien) <= 0) throw new Error('⚠️ Số tiền không hợp lệ!');
      if (!form.thangHP)                      throw new Error('⚠️ Vui lòng chọn tháng học phí!');
      const thangHP      = Number(form.thangHP);
      const namHP        = Number(form.namHP || new Date().getFullYear());
      const t            = mkTs(form.date);
      const n            = new Date();
      const yy           = n.getFullYear().toString().slice(2);
      const mm           = (n.getMonth() + 1).toString().padStart(2,'0');
      const dd           = n.getDate().toString().padStart(2,'0');
      const soCT         = form.docNum || `PT-${yy}${mm}${dd}-${maHS.toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
      const dateFormatted = formatDate(form.date);
      const description  = `Học phí tháng ${thangHP} năm ${namHP}`;
      const clean        = sanitizeObject({ ...form, maHS, soTien: Number(form.soTien), date: dateFormatted, description, thangHP, namHP });
      await api({ action: editPayment ? 'updatePayment' : 'savePayment', timeStamp: t, soCT, ...clean });
      setEditPayment(null);
      const previewPayment: Payment = {
        id: soCT, docNum: soCT, date: dateFormatted,
        studentId: maHS,
        studentName: students.find(s => s.id === maHS)?.name || maHS,
        payer:  form.nguoiNop || '',
        method: form.method   || 'Chuyển khoản',
        description, amount: Number(form.soTien), note: form.note || '',
        thangHP, namHP,
      } as any;
      setVInvoice(previewPayment);
      setSilent(); loadData();
    }, editPayment ? '✅ Đã cập nhật phiếu thu!' : '✅ Đã ghi phiếu thu!')
  , [withSave, editPayment, students, api, setSilent, loadData]);

  const handleSaveExpense = useCallback(async (form: any) =>
    withSave(async () => {
      if (!form.description?.trim()) throw new Error('⚠️ Vui lòng nhập lý do!');
      if (!form.amount || Number(form.amount) <= 0) throw new Error('⚠️ Số tiền không hợp lệ!');
      if (!form.date)                throw new Error('⚠️ Vui lòng chọn ngày chi!');
      const t  = mkTs(form.date);
      const n  = new Date();
      const yy = n.getFullYear().toString().slice(2);
      const mm = (n.getMonth() + 1).toString().padStart(2,'0');
      const dd = n.getDate().toString().padStart(2,'0');
      const soCT = form.docNum || `PC-${yy}${mm}${dd}-${n.getTime().toString(36).slice(-4).toUpperCase()}`;
      await api({
        action: editExpense ? 'updateExpense' : 'saveExpense',
        timeStamp: t, soCT,
        ...sanitizeObject({ ...form, amount: Number(form.amount), date: formatDate(form.date) }),
      });
      setEditExpense(null);
      setSilent(); loadData();
    }, editExpense ? '✅ Đã cập nhật phiếu chi!' : '✅ Đã ghi phiếu chi!')
  , [withSave, editExpense, api, setSilent, loadData]);

  /* ════════════════════════════════════════════
     DIARY DOMAIN
  ════════════════════════════════════════════ */
  const handleSaveDiary = useCallback(async (form: any) => {
    const isEdit = !!form.originalDate;
    return withSave(async () => {
      if (!form.content?.trim()) throw new Error('⚠️ Vui lòng nhập nội dung bài dạy!');
      const clean        = sanitizeObject(form);
      const dateForGAS   = formatDate(clean.date);
      await api({
        action:      isEdit ? 'updateDaily' : 'saveDaily',
        date:        dateForGAS,
        maLop:       clean.classId,
        caDay:       clean.caDay || '',
        teacherName: clean.teacherName,
        attendance:  sanitizeAttendance(form.attendance),
        content:     clean.content,
        homework:    clean.homework || '---',
        ...(isEdit && {
          originalDate:     clean.originalDate,
          originalClassId:  clean.originalClassId,
          originalCaDay:    clean.originalCaDay || '',
        }),
      });
      setEditDiary(null);
      setSilent(); loadData();
    }, isEdit ? '✅ Đã cập nhật buổi dạy!' : '✅ Đã ghi buổi dạy!');
  }, [withSave, api, setSilent, loadData]);

  /* ════════════════════════════════════════════
     DELETE (chung)
  ════════════════════════════════════════════ */
  const handleDelete = useCallback(async (delTarget: DeleteTarget) => {
    if (!delTarget) return;

    /* Teacher: gọi GAS deleteTeacher */
    if (delTarget.type === 'teacher') {
      await withSave(async () => {
        await api({ action: 'deleteTeacher', id: delTarget.id });
        setSilent(); loadData();
      }, '✅ Đã xóa giáo viên!');
      return;
    }
    /* Material: gọi GAS deleteMaterial */
    if (delTarget.type === 'material') {
      await withSave(async () => {
        await api({ action: 'deleteMaterial', id: delTarget.id });
        setSilent(); loadData();
      }, '✅ Đã xóa học liệu!');
      return;
    }

    const actionMap: Record<string, string> = {
      student: 'deleteHS', payment: 'deletePayment', expense: 'deleteExpense',
    };
    await withSave(async () => {
      await api({
        action:   actionMap[delTarget.type],
        [delTarget.type === 'student' ? 'id' : 'docNum']: delTarget.id,
      });
      setSilent(); loadData();
    }, '✅ Đã xóa thành công!');
  }, [withSave, api, setSilent, loadData, setTeachers, setMaterials]);

  /* ════════════════════════════════════════════
     TEACHERS DOMAIN — đồng bộ GAS sheet GiaoVien
  ════════════════════════════════════════════ */
  const handleSaveTeacher = useCallback(async (form: any) => {
    const isEdit = !!(form.id?.trim()) && teachers.some(t => t.id === form.id.trim());
    const payload = {
      ...form,
      id:       isEdit ? form.id.trim() : `GV${Date.now()}`,
      classes:  form.classes || [],
      status:   form.status  || 'active',
    };
    await withSave(async () => {
      await api({ action: isEdit ? 'updateTeacher' : 'saveTeacher', ...payload });
      setSilent(); loadData();
    }, '✅ Đã lưu giáo viên!');
  }, [teachers, withSave, api, setSilent, loadData]);

  /* ════════════════════════════════════════════
     MATERIALS DOMAIN — đồng bộ GAS sheet HocLieu
  ════════════════════════════════════════════ */
  const handleSaveMaterial = useCallback(async (form: any) => {
    const isEdit = !!(form.id) && materials.some(m => m.id === form.id);
    const payload = {
      ...form,
      id:         isEdit ? form.id : `HL${Date.now()}`,
      tags:       Array.isArray(form.tags) ? form.tags.join(',') : (form.tags || ''),
      uploadDate: form.uploadDate || new Date().toISOString(),
    };
    await withSave(async () => {
      await api({ action: isEdit ? 'updateMaterial' : 'saveMaterial', ...payload });
      setSilent(); loadData();
    }, '✅ Đã lưu học liệu!');
  }, [materials, withSave, api, setSilent, loadData]);

  const handleDeleteMaterial = useCallback(async (id: string) => {
    await withSave(async () => {
      await api({ action: 'deleteMaterial', id });
      setSilent(); loadData();
    }, '✅ Đã xóa học liệu!');
  }, [withSave, api, setSilent, loadData]);

  /* leaveRequests đã bỏ tính năng */
  const handleApproveLeave = useCallback((_id: string) => {}, []);
  const handleRejectLeave  = useCallback((_id: string) => {}, []);

  /* ════════════════════════════════════════════
     DERIVED STATE — tính từ data, không phải UI state
  ════════════════════════════════════════════ */
  const curMo = new Date().getMonth() + 1;
  const curYr = new Date().getFullYear();

  const paidMap = useMemo(() => buildPaidMap(payments, curYr), [payments, curYr]);
  const isPaid  = useMemo(() => isPaidFn(paidMap), [paidMap]);

  const activeStudents  = useMemo(() => getActiveStudents(students),                             [students]);
  const paidNow         = useMemo(() => countPaidStudents(activeStudents, isPaid, curMo, curYr), [activeStudents, isPaid, curMo, curYr]);
  const paidPct         = useMemo(() => calcPaidPct(paidNow, activeStudents.length),             [paidNow, activeStudents.length]);

  const prevMo          = curMo === 1 ? 12 : curMo - 1;
  const prevYr          = curMo === 1 ? curYr - 1 : curYr;
  const prevPaidNow     = useMemo(() => countPaidStudents(activeStudents, isPaid, prevMo, prevYr), [activeStudents, isPaid, prevMo, prevYr]);

  const uniqueBranches  = useMemo(() =>
    [...new Set(students.map(s => (s.branch||'').replace(/\s*\(.*?\)/g,'').trim()).filter(Boolean))].sort()
  , [students]);

  /* filtS — học sinh sau khi filter */
  const [qS,          setQS]    = useState('');
  const [fCls,        setFCls]  = useState('');
  const [hideInactive, setHideInactive] = useState(false);
  const [pgS,         setPgS]   = useState(1);

  const filtS = useMemo(() => students.filter(s =>
    (!hideInactive || isStudentActive(s)) &&
    (s.name.toLowerCase().includes(qS.toLowerCase()) || s.id.toLowerCase().includes(qS.toLowerCase())) &&
    (!fCls || s.classId === fCls)
  ), [students, qS, fCls, hideInactive]);

  /* filtD — nhật ký sau filter */
  const [qD,  setQD]  = useState('');
  const [dCls, setDCls] = useState('');
  const [pgD,  setPgD]  = useState(1);

  const filtD = useMemo(() =>
    [...tlogs].filter(l =>
      (!dCls || l.classId === dCls) &&
      (!qD   || l.classId.toLowerCase().includes(qD.toLowerCase()) || (l.content || '').toLowerCase().includes(qD.toLowerCase()))
    ).sort((a, b) => {
      const dd = parseDMY(b.date) - parseDMY(a.date);
      return dd !== 0 ? dd : parseCaDayToHours(a.caDay) - parseCaDayToHours(b.caDay);
    })
  , [tlogs, dCls, qD]);

  /* filtFin — học sinh filter cho tab tài chính */
  const [qF,   setQF]   = useState('');
  const [fMo,  setFMo]  = useState(`${(new Date().getMonth()+1).toString().padStart(2,'0')}/${new Date().getFullYear()}`);
  const [fTch, setFTch] = useState('');
  const [fFC,  setFFC]  = useState('');
  const [fSt,  setFSt]  = useState('unpaid');
  const [pgF,  setPgF]  = useState(1);

  const [fM, fY] = (fMo || '01/2026').split('/').map(Number);
  const filtFin = useMemo(() => {
    const q = qF.toLowerCase().trim();
    const filtered = students.filter(s => {
      if (hideInactive && !isStudentActive(s)) return false;
      if (q    && !s.name.toLowerCase().includes(q) && !s.id.toLowerCase().includes(q)) return false;
      if (fTch && !s.teacher.includes(fTch)) return false;
      if (fFC  && s.classId !== fFC) return false;
      if (fSt === 'paid')   return  isPaid(s.id, fM, fY);
      if (fSt === 'unpaid') return !isPaid(s.id, fM, fY);
      return true;
    });
    if (fSt === 'unpaid') {
      const now = new Date();
      const debtMonths: { m: number; y: number }[] = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        return { m: d.getMonth() + 1, y: d.getFullYear() };
      });
      return [...filtered].sort((a, b) => {
        const aDebt = debtMonths.filter(fm => !isPaid(a.id, fm.m, fm.y)).length;
        const bDebt = debtMonths.filter(fm => !isPaid(b.id, fm.m, fm.y)).length;
        return bDebt - aDebt;
      });
    }
    return filtered;
  }, [students, qF, fTch, fFC, fSt, fM, fY, isPaid, hideInactive]);

  /* classes filter */
  const [qCls, setQCls]           = useState('');
  const [fClsTeacher, setFClsTeacher] = useState('');

  return {
    /* saving state */
    saving,

    /* edit states */
    editStudent, setEditStudent,
    editClass,   setEditClass,
    editPayment, setEditPayment,
    editExpense, setEditExpense,
    editDiary,   setEditDiary,

    /* handlers */
    handleSaveStudent,
    handleSaveClass,
    handleSaveFee,
    handleSaveExpense,
    handleSaveDiary,
    handleDelete,
    handleToggleStudentStatus,
    handleSaveNote,
    handleSaveFacebook,
    handleSaveTeacher,
    handleSaveMaterial,
    handleDeleteMaterial,
    handleApproveLeave,
    handleRejectLeave,

    /* bulk transfer */
    bulkStudents, setBulkStudents,
    handleConfirmBulkTransfer,

    /* invoice preview */
    vInvoice, setVInvoice,

    /* derived metrics */
    curMo, curYr, prevMo, prevYr,
    isPaid, paidNow, paidPct, prevPaidNow,
    activeStudents, uniqueBranches,

    /* filter state — students */
    qS, setQS, fCls, setFCls, hideInactive, setHideInactive, pgS, setPgS, filtS,

    /* filter state — diary */
    qD, setQD, dCls, setDCls, pgD, setPgD, filtD,

    /* filter state — finance */
    qF, setQF, fMo, setFMo, fTch, setFTch, fFC, setFFC, fSt, setFSt, pgF, setPgF, filtFin,

    /* filter state — classes */
    qCls, setQCls, fClsTeacher, setFClsTeacher,
  };
}
