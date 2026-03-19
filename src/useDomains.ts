/**
 * useDomains.ts — Domain Hooks (Skill Layer)
 * Lớp Toán NK · v29.0
 *
 * PHASE 1 FIXES:
 *  [S1] Nhận silentRef trực tiếp từ useAppData — không còn __setSilent hack
 *  [S3] Race condition biến mất — silentRef là cùng 1 Ref instance
 *  [L1] Optimistic delete cho student / payment / expense
 *  [L4] curMo/curYr reactive: check mỗi phút, đúng khi app dùng qua đêm
 *  [D3] Pagination reset sau khi filtS/filtD/filtFin thay đổi độ dài
 *  [D4] lastLoadTimeRef reset về 0 sau manual save → force reload ngay khi tab active
 */

import { useState, useMemo, useCallback, useRef, useEffect, type Dispatch, type SetStateAction, type MutableRefObject } from 'react';
import toast from 'react-hot-toast';

import type { Student, Payment, Expense, Teacher, LeaveRequest, Material, DeleteTarget } from './types';
import {
  fetchWithTimeout, formatDate, sanitizeObject, sanitizeAttendance,
  parseCaDayToHours, parseDMY, isStudentActive,
} from './helpers';
import { buildPaidMap, isPaidFn, getActiveStudents, calcPaidPct, countPaidStudents } from './measures';
import { RULES } from './rules';

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
  loadData:         () => Promise<void>;
  /* FIX S1: refs từ useAppData — không còn cần __setSilent */
  silentRef:        MutableRefObject<boolean>;
  lastLoadTimeRef:  MutableRefObject<number>;
  /* FIX D5: useDomains write vào đây trong withSave để chặn auto-reload */
  isSavingRef:      MutableRefObject<boolean>;
}

export function useDomains(cfg: DomainConfig) {
  const {
    scriptUrl, students, payments, expenses, tlogs, uClasses,
    teachers, materials,
    setStudents, setPayments, setExpenses, setTeachers, setMaterials, setLeaveRequests,
    loadData,
    silentRef, lastLoadTimeRef, isSavingRef,
  } = cfg;

  const [saving,      setSaving]      = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editClass,   setEditClass]   = useState<any>(null);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [editExpense, setEditExpense] = useState<any | null>(null);
  const [editDiary,   setEditDiary]   = useState<any>(null);

  const savingRef = useRef(false);

  /* ── api helper ── */
  const api = useCallback((body: object) =>
    fetchWithTimeout(scriptUrl, {
      method:   'POST',
      redirect: 'follow',
      headers:  { 'Content-Type': 'text/plain' },
      body:     JSON.stringify(body),
      timeout:  RULES.network.fetchTimeout,
    })
  , [scriptUrl]);

  /* ── withSave ── */
  const withSave = useCallback(async (fn: () => Promise<void>, successMsg?: string) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      isSavingRef.current = true; // chặn auto-reload trong khi save
      await fn();
      if (successMsg) toast.success(successMsg);
    } catch (err: any) {
      toast.error('❌ ' + (err.message || 'Lỗi khi lưu'));
    } finally {
      savingRef.current = false;
      isSavingRef.current = false;
      setSaving(false);
    }
  }, [isSavingRef]);

  /* FIX S1: setSilent set trực tiếp vào silentRef — không còn hack qua __setSilent
     FIX D4: reset lastLoadTimeRef về 0 → visibility event sẽ force reload ngay */
  const setSilent = useCallback(() => {
    silentRef.current = true;
    lastLoadTimeRef.current = 0;
  }, [silentRef, lastLoadTimeRef]);

  const mkTs = (d: string) => {
    const n = new Date();
    return `${n.getHours().toString().padStart(2,'0')}:${n.getMinutes().toString().padStart(2,'0')} - ${formatDate(d)}`;
  };

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

      const optimistic: Student = {
        id: normalizedId, name: form.name?.trim() || '',
        dob: form.dob || '', branch: form.branch || '',
        grade: form.grade || '', school: form.school || '',
        teacher: form.teacher || '---', parentName: form.parentName || '',
        parentPhone: form.parentPhone || '', studentPhone: form.studentPhone || '',
        address: form.address || '', academicLevel: form.academicLevel || '',
        goal: form.goal || '', supportNeeded: form.supportNeeded || '',
        classId: form.classId || '', startDate: form.startDate || '',
        endDate: form.endDate || '', status: form.status || 'active',
        notes: form.notes || '', facebookUrl: form.facebookUrl || '',
      };
      if (editStudent) {
        setStudents(prev => prev.map(s => s.id === normalizedId ? { ...s, ...optimistic } : s));
      } else {
        setStudents(prev => [optimistic, ...prev]);
      }
      setEditStudent(null);

      await api({
        action: editStudent ? 'updateHS' : 'saveHS',
        ...sanitizeObject({ ...form, startDate: form.startDate ? formatDate(form.startDate) : '' }),
      });
      setSilent(); loadData();
    }, editStudent ? '✅ Đã cập nhật học sinh!' : '✅ Đã thêm học sinh mới!')
  , [withSave, editStudent, students, api, setStudents, setSilent, loadData]);

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
      /* Optimistic toggle */
      setStudents(prev => prev.map(st => st.id === s.id
        ? { ...st, status: isInactive ? 'active' : 'inactive', endDate: isInactive ? '' : endDateStr }
        : st
      ));
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
  }, [withSave, api, setStudents, setSilent, loadData]);

  const handleSaveFacebook = useCallback(async (s: Student, facebookUrl: string) =>
    withSave(async () => {
      setStudents(prev => prev.map(st => st.id === s.id ? { ...st, facebookUrl } : st));
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
  , [withSave, api, setStudents, setSilent, loadData]);

  const handleSaveNote = useCallback(async (s: Student, notes: string) =>
    withSave(async () => {
      setStudents(prev => prev.map(st => st.id === s.id ? { ...st, notes } : st));
      await api({
        action: 'updateHS', id: s.id, name: s.name, dob: s.dob, branch: s.branch,
        grade: s.grade, school: s.school, teacher: s.teacher, parentName: s.parentName,
        parentPhone: s.parentPhone, studentPhone: s.studentPhone, address: s.address,
        academicLevel: s.academicLevel, goal: s.goal, supportNeeded: s.supportNeeded,
        notes, classId: s.classId, startDate: s.startDate, endDate: s.endDate || '', status: s.status,
      });
      setSilent(); loadData();
    }, '✅ Đã lưu nhận xét!')
  , [withSave, api, setStudents, setSilent, loadData]);

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

  const [bulkStudents, setBulkStudents] = useState<Student[]>([]);

  const handleConfirmBulkTransfer = useCallback(async (newClassId: string, transferDate: string) =>
    withSave(async () => {
      const [ty, tm, td] = transferDate.split('-');
      const dateStr = `${td}/${tm}/${ty}`;
      /* Optimistic bulk update */
      setStudents(prev => prev.map(s =>
        bulkStudents.some(b => b.id === s.id) ? { ...s, classId: newClassId } : s
      ));
      await Promise.all(bulkStudents.map(s =>
        api({ action: 'updateHS', ...s, classId: newClassId, fromClassId: s.classId, transferDate: dateStr })
      ));
      setBulkStudents([]);
      setSilent(); loadData();
    }, `✅ Đã chuyển ${bulkStudents.length} học sinh!`)
  , [withSave, bulkStudents, api, setStudents, setSilent, loadData]);

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

      const previewPayment: Payment = {
        id: soCT, docNum: soCT, date: dateFormatted,
        studentId: maHS,
        studentName: students.find(s => s.id === maHS)?.name || maHS,
        payer: form.nguoiNop || '', method: form.method || 'Chuyển khoản',
        description, amount: Number(form.soTien), note: form.note || '',
        thangHP, namHP,
      } as any;
      setEditPayment(null);
      if (!editPayment) {
        setPayments(prev => [previewPayment, ...prev]);
      } else {
        setPayments(prev => prev.map(p => p.id === editPayment.id ? previewPayment : p));
      }
      setVInvoice(previewPayment);

      await api({ action: editPayment ? 'updatePayment' : 'savePayment', timeStamp: t, soCT, ...clean });
      setSilent(); loadData();
    }, editPayment ? '✅ Đã cập nhật phiếu thu!' : '✅ Đã ghi phiếu thu!')
  , [withSave, editPayment, students, api, setPayments, setSilent, loadData]);

  const handleSaveExpense = useCallback(async (form: any) =>
    withSave(async () => {
      if (!form.description?.trim()) throw new Error('⚠️ Vui lòng nhập lý do!');
      if (!form.amount || Number(form.amount) <= 0) throw new Error('⚠️ Số tiền không hợp lệ!');
      if (!form.date) throw new Error('⚠️ Vui lòng chọn ngày chi!');
      const t  = mkTs(form.date);
      const n  = new Date();
      const yy = n.getFullYear().toString().slice(2);
      const mm = (n.getMonth() + 1).toString().padStart(2,'0');
      const dd = n.getDate().toString().padStart(2,'0');
      const soCT = form.docNum || `PC-${yy}${mm}${dd}-${n.getTime().toString(36).slice(-4).toUpperCase()}`;
      const dateFormatted = formatDate(form.date);

      const optimistic = {
        id: soCT, docNum: soCT, date: dateFormatted,
        description: form.description?.trim() || '',
        category: form.category || '',
        amount: Number(form.amount),
        spender: form.spender || '',
      };
      setEditExpense(null);
      if (!editExpense) {
        setExpenses(prev => [optimistic, ...prev]);
      } else {
        setExpenses(prev => prev.map((e: any) => e.id === editExpense.id ? optimistic : e));
      }

      await api({
        action: editExpense ? 'updateExpense' : 'saveExpense',
        timeStamp: t, soCT,
        ...sanitizeObject({ ...form, amount: Number(form.amount), date: dateFormatted }),
      });
      setSilent(); loadData();
    }, editExpense ? '✅ Đã cập nhật phiếu chi!' : '✅ Đã ghi phiếu chi!')
  , [withSave, editExpense, api, setExpenses, setSilent, loadData]);

  /* ════════════════════════════════════════════
     DIARY DOMAIN
  ════════════════════════════════════════════ */
  const handleSaveDiary = useCallback(async (form: any) => {
    const isEdit = !!form.originalDate;
    return withSave(async () => {
      if (!form.content?.trim()) throw new Error('⚠️ Vui lòng nhập nội dung bài dạy!');
      const clean = sanitizeObject(form);
      await api({
        action:      isEdit ? 'updateDaily' : 'saveDaily',
        date:        formatDate(clean.date),
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

    if (delTarget.type === 'teacher') {
      /* Optimistic cho teacher */
      setTeachers(prev => prev.filter(t => t.id !== delTarget.id));
      await withSave(async () => {
        await api({ action: 'deleteTeacher', id: delTarget.id });
        setSilent(); loadData();
      }, '✅ Đã xóa giáo viên!');
      return;
    }
    if (delTarget.type === 'material') {
      setMaterials(prev => prev.filter(m => m.id !== delTarget.id));
      await withSave(async () => {
        await api({ action: 'deleteMaterial', id: delTarget.id });
        setSilent(); loadData();
      }, '✅ Đã xóa học liệu!');
      return;
    }

    /* FIX L1: Optimistic delete cho student / payment / expense */
    if (delTarget.type === 'student') {
      setStudents(prev => prev.filter(s => s.id !== delTarget.id));
    } else if (delTarget.type === 'payment') {
      setPayments(prev => prev.filter(p => p.id !== delTarget.id));
    } else if (delTarget.type === 'expense') {
      setExpenses(prev => prev.filter((e: any) => e.id !== delTarget.id));
    }

    const actionMap: Record<string, string> = {
      student: 'deleteHS', payment: 'deletePayment', expense: 'deleteExpense',
    };
    await withSave(async () => {
      await api({
        action: actionMap[delTarget.type],
        [delTarget.type === 'student' ? 'id' : 'docNum']: delTarget.id,
      });
      setSilent(); loadData();
    }, '✅ Đã xóa thành công!');
  }, [withSave, api, setStudents, setPayments, setExpenses, setTeachers, setMaterials, setSilent, loadData]);

  /* ════════════════════════════════════════════
     TEACHERS DOMAIN
  ════════════════════════════════════════════ */
  const handleSaveTeacher = useCallback(async (form: any) => {
    const isEdit = !!(form.id?.trim()) && teachers.some(t => t.id === form.id.trim());
    const payload: Teacher = {
      ...form,
      id:        isEdit ? form.id.trim() : `GV${Date.now()}`,
      classes:   form.classes  || [],
      status:    form.status   || 'active',
      createdAt: form.createdAt || new Date().toISOString(),
    };
    await withSave(async () => {
      if (isEdit) {
        setTeachers(prev => prev.map(t => t.id === payload.id ? { ...t, ...payload } : t));
      } else {
        setTeachers(prev => [payload, ...prev]);
      }
      await api({ action: isEdit ? 'updateTeacher' : 'saveTeacher', ...payload });
      setSilent(); loadData();
    }, '✅ Đã lưu giáo viên!');
  }, [teachers, withSave, api, setTeachers, setSilent, loadData]);

  /* ════════════════════════════════════════════
     MATERIALS DOMAIN
  ════════════════════════════════════════════ */
  const handleSaveMaterial = useCallback(async (form: any) => {
    const isEdit = !!(form.id) && materials.some(m => m.id === form.id);
    const optimisticId = isEdit ? form.id : `HL${Date.now()}`;
    const tagsArr: string[] = Array.isArray(form.tags)
      ? form.tags
      : (form.tags ? String(form.tags).split(',').map((t: string) => t.trim()).filter(Boolean) : []);
    const payload    = { ...form, id: optimisticId, tags: tagsArr.join(','), uploadDate: form.uploadDate || new Date().toISOString() };
    const optimistic = { ...form, id: optimisticId, tags: tagsArr, uploadedAt: form.uploadedAt || new Date().toISOString(), uploadedBy: form.uploadedBy || '' };
    await withSave(async () => {
      if (isEdit) {
        setMaterials(prev => prev.map(m => m.id === optimisticId ? { ...m, ...optimistic } : m));
      } else {
        setMaterials(prev => [optimistic, ...prev]);
      }
      await api({ action: isEdit ? 'updateMaterial' : 'saveMaterial', ...payload });
      setSilent(); loadData();
    }, '✅ Đã lưu học liệu!');
  }, [materials, withSave, api, setMaterials, setSilent, loadData]);

  const handleDeleteMaterial = useCallback(async (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
    await withSave(async () => {
      await api({ action: 'deleteMaterial', id });
      setSilent(); loadData();
    }, '✅ Đã xóa học liệu!');
  }, [withSave, api, setMaterials, setSilent, loadData]);

  const handleApproveLeave = useCallback((_id: string) => {}, []);
  const handleRejectLeave  = useCallback((_id: string) => {}, []);

  /* ════════════════════════════════════════════
     DERIVED STATE
  ════════════════════════════════════════════ */

  /* FIX L4: curMo/curYr reactive — check mỗi phút, tự cập nhật khi sang tháng mới */
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const iv = setInterval(() => {
      setNow(prev => {
        const n = new Date();
        return n.getMonth() !== prev.getMonth() || n.getFullYear() !== prev.getFullYear() ? n : prev;
      });
    }, 60_000);
    return () => clearInterval(iv);
  }, []);
  const curMo = now.getMonth() + 1;
  const curYr = now.getFullYear();

  const paidMap = useMemo(() => buildPaidMap(payments, curYr), [payments, curYr]);
  const isPaid  = useMemo(() => isPaidFn(paidMap), [paidMap]);

  const activeStudents = useMemo(() => getActiveStudents(students), [students]);
  const paidNow        = useMemo(() => countPaidStudents(activeStudents, isPaid, curMo, curYr), [activeStudents, isPaid, curMo, curYr]);
  const paidPct        = useMemo(() => calcPaidPct(paidNow, activeStudents.length), [paidNow, activeStudents.length]);

  const prevMo      = curMo === 1 ? 12 : curMo - 1;
  const prevYr      = curMo === 1 ? curYr - 1 : curYr;
  const prevPaidNow = useMemo(() => countPaidStudents(activeStudents, isPaid, prevMo, prevYr), [activeStudents, isPaid, prevMo, prevYr]);

  const uniqueBranches = useMemo(() =>
    [...new Set(students.map(s => (s.branch||'').replace(/\s*\(.*?\)/g,'').trim()).filter(Boolean))].sort()
  , [students]);

  /* ── Filters ── */
  const [qS, setQS]           = useState('');
  const [fCls, setFCls]       = useState('');
  const [hideInactive, setHideInactive] = useState(false);
  const [pgS, setPgS]         = useState(1);

  const filtS = useMemo(() => students.filter(s =>
    (!hideInactive || isStudentActive(s)) &&
    (s.name.toLowerCase().includes(qS.toLowerCase()) || s.id.toLowerCase().includes(qS.toLowerCase())) &&
    (!fCls || s.classId === fCls)
  ), [students, qS, fCls, hideInactive]);

  /* FIX D3: reset pagination khi kết quả lọc thay đổi số lượng */
  const prevFiltSLen = useRef(filtS.length);
  useEffect(() => {
    if (filtS.length !== prevFiltSLen.current) { setPgS(1); prevFiltSLen.current = filtS.length; }
  }, [filtS.length]);

  const [qD, setQD]   = useState('');
  const [dCls, setDCls] = useState('');
  const [pgD, setPgD]  = useState(1);

  const filtD = useMemo(() =>
    [...tlogs].filter(l =>
      (!dCls || l.classId === dCls) &&
      (!qD   || l.classId.toLowerCase().includes(qD.toLowerCase()) || (l.content || '').toLowerCase().includes(qD.toLowerCase()))
    ).sort((a, b) => {
      const dd = parseDMY(b.date) - parseDMY(a.date);
      return dd !== 0 ? dd : parseCaDayToHours(a.caDay) - parseCaDayToHours(b.caDay);
    })
  , [tlogs, dCls, qD]);

  const prevFiltDLen = useRef(filtD.length);
  useEffect(() => {
    if (filtD.length !== prevFiltDLen.current) { setPgD(1); prevFiltDLen.current = filtD.length; }
  }, [filtD.length]);

  const [qF, setQF]   = useState('');
  const [fMo, setFMo] = useState(`${(new Date().getMonth()+1).toString().padStart(2,'0')}/${new Date().getFullYear()}`);
  const [fTch, setFTch] = useState('');
  const [fFC, setFFC] = useState('');
  const [fSt, setFSt] = useState('unpaid');
  const [pgF, setPgF] = useState(1);

  const [fM, fY] = (fMo || '01/2026').split('/').map(Number);

  const isMonthBillableForStudent = useCallback((s: Student, fm: { m: number; y: number }): boolean => {
    const monthStart = new Date(fm.y, fm.m - 1, 1).getTime();
    const startTs = parseDMY(s.startDate || '');
    if (startTs) {
      const enrollStart = new Date(new Date(startTs).getFullYear(), new Date(startTs).getMonth(), 1).getTime();
      if (monthStart < enrollStart) return false;
    }
    const endTs = parseDMY(s.endDate || '');
    if (endTs && s.endDate !== '---' && s.endDate !== '') {
      const leaveMonth = new Date(new Date(endTs).getFullYear(), new Date(endTs).getMonth(), 1).getTime();
      if (monthStart >= leaveMonth) return false;
    }
    return true;
  }, []);

  const filtFin = useMemo(() => {
    const q = qF.toLowerCase().trim();
    const filtered = students.filter(s => {
      if (hideInactive && !isStudentActive(s)) return false;
      if (q    && !s.name.toLowerCase().includes(q) && !s.id.toLowerCase().includes(q)) return false;
      if (fTch && !s.teacher.includes(fTch)) return false;
      if (fFC  && s.classId !== fFC) return false;
      if (fSt === 'paid') return isPaid(s.id, fM, fY);
      if (fSt === 'unpaid') {
        if (!isMonthBillableForStudent(s, { m: fM, y: fY })) return false;
        return !isPaid(s.id, fM, fY);
      }
      return true;
    });
    if (fSt === 'unpaid') {
      const n = new Date();
      const debtMonths = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(n.getFullYear(), n.getMonth() - i, 1);
        return { m: d.getMonth() + 1, y: d.getFullYear() };
      });
      return [...filtered].sort((a, b) => {
        const aDebt = debtMonths.filter(fm => isMonthBillableForStudent(a, fm) && !isPaid(a.id, fm.m, fm.y)).length;
        const bDebt = debtMonths.filter(fm => isMonthBillableForStudent(b, fm) && !isPaid(b.id, fm.m, fm.y)).length;
        return bDebt - aDebt;
      });
    }
    return filtered;
  }, [students, qF, fTch, fFC, fSt, fM, fY, isPaid, hideInactive, isMonthBillableForStudent]);

  const prevFiltFinLen = useRef(filtFin.length);
  useEffect(() => {
    if (filtFin.length !== prevFiltFinLen.current) { setPgF(1); prevFiltFinLen.current = filtFin.length; }
  }, [filtFin.length]);

  const [qCls, setQCls]               = useState('');
  const [fClsTeacher, setFClsTeacher] = useState('');

  return {
    saving,
    editStudent, setEditStudent,
    editClass,   setEditClass,
    editPayment, setEditPayment,
    editExpense, setEditExpense,
    editDiary,   setEditDiary,
    handleSaveStudent, handleSaveClass, handleSaveFee, handleSaveExpense,
    handleSaveDiary, handleDelete, handleToggleStudentStatus,
    handleSaveNote, handleSaveFacebook,
    handleSaveTeacher, handleSaveMaterial, handleDeleteMaterial,
    handleApproveLeave, handleRejectLeave,
    bulkStudents, setBulkStudents, handleConfirmBulkTransfer,
    vInvoice, setVInvoice,
    curMo, curYr, prevMo, prevYr,
    isPaid, paidNow, paidPct, prevPaidNow,
    activeStudents, uniqueBranches,
    qS, setQS, fCls, setFCls, hideInactive, setHideInactive, pgS, setPgS, filtS,
    qD, setQD, dCls, setDCls, pgD, setPgD, filtD,
    qF, setQF, fMo, setFMo, fTch, setFTch, fFC, setFFC, fSt, setFSt, pgF, setPgF, filtFin,
    qCls, setQCls, fClsTeacher, setFClsTeacher,
    isMonthBillableForStudent,
  };
}
