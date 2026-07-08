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
  parseCaDayToHours, parseDMY, isStudentActive, buildSchoolYearMonths, isLessonOffLog,
} from './helpers';
import { buildPaidMap, isPaidFn, getActiveStudents, calcPaidPct, countPaidStudents, isStudentBillableInMonth } from './measures';
import { RULES } from './rules';

interface DomainConfig {
  scriptUrl:   string;
  schoolYear:  string;
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
  setTlogs:         Dispatch<SetStateAction<any[]>>;
  setUClasses:      Dispatch<SetStateAction<any[]>>;
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
    scriptUrl, schoolYear, students, payments, expenses, tlogs, uClasses,
    teachers, materials,
    setStudents, setPayments, setExpenses, setTlogs, setUClasses, setTeachers, setMaterials, setLeaveRequests,
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

  /* ── api helper — kiểm tra HTTP status lẫn GAS response body ── */
  const api = useCallback(async (body: object): Promise<any> => {
    const res = await fetchWithTimeout(scriptUrl, {
      method:   'POST',
      redirect: 'follow',
      headers:  { 'Content-Type': 'text/plain' },
      body:     JSON.stringify(body),
      timeout:  RULES.network.fetchTimeout,
    });
    if (!res.ok) throw new Error(`Server lỗi HTTP ${res.status}`);
    const data = await res.json().catch(() => null);
    // GAS trả về { ok: false, error: "..." } khi ghi Sheet thất bại
    if (data && data.ok === false) {
      throw new Error(data.error || 'GAS ghi thất bại');
    }
    return data;
  }, [scriptUrl]);

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
      // FIX: silentRef=true → không hiện LoadingScreen khi lỗi save
      silentRef.current = true;
      try { loadData(); } catch {}
    } finally {
      savingRef.current = false;
      isSavingRef.current = false;
      setSaving(false);
    }
  }, [isSavingRef, silentRef, loadData]);

  /* FIX S1: setSilent set trực tiếp vào silentRef — không còn hack qua __setSilent
     FIX D4: reset lastLoadTimeRef về 0 → visibility event sẽ force reload ngay */
  const setSilent = useCallback(() => {
    silentRef.current = true;
    lastLoadTimeRef.current = 0;
  }, [silentRef, lastLoadTimeRef]);

  const classCodeOf = (c: any): string =>
    String(c?.['Mã Lớp'] || c?.['Mã lớp'] || c?.MaLop || c?.['Ma Lop'] || c?.classId || c?.id || '').trim().toUpperCase();

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
      const normalizedId = form.id.trim().replace(/\s+/g, '').toUpperCase();
      if (!editStudent && students.some(s => s.id.toUpperCase() === normalizedId))
        throw new Error(`⚠️ Mã HS "${normalizedId}" đã tồn tại!`);
      form = {
        ...form,
        id: normalizedId,
        parentPhone: String(form.parentPhone ?? '').trim(),
        studentPhone: String(form.studentPhone ?? '').trim(),
      };

      // Optimistic update CHỈ sau khi validate xong
      const optimistic: Student = {
        id: normalizedId, name: form.name?.trim() || '',
        dob: form.dob || '', branch: form.branch || '',
        grade: form.grade || '', school: form.school || '',
        teacher: form.teacher || '---', parentName: form.parentName || '',
        parentPhone: String(form.parentPhone ?? ''), studentPhone: String(form.studentPhone ?? ''),
        address: form.address || '', academicLevel: form.academicLevel || '',
        goal: form.goal || '', supportNeeded: form.supportNeeded || '',
        classId: form.classId || '',
        // BUG4 FIX: formatDate để startDate nhất quán với dữ liệu từ GAS (DD/MM/YYYY)
        // tránh parseDMY / billable tự viết tính sai tháng bắt đầu
        startDate: form.startDate ? formatDate(form.startDate) : '',
        endDate: form.endDate ? formatDate(form.endDate) : '',
        status: form.status || 'active',
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
        notes: s.notes || '', facebookUrl: s.facebookUrl || '',
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
      const classCode = classCodeOf(form);
      const originalCode = classCodeOf({ ...editClass, ...(form.__editingId ? { MaLop: form.__editingId } : {}) }) || classCode;
      if (!classCode) throw new Error('⚠️ Lớp là bắt buộc!');

      const normalizedForm = {
        ...form,
        'Mã Lớp': classCode,
        'Tên Lớp': String(form['Tên Lớp'] || form.TenLop || classCode).trim() || classCode,
        'Khối': String(form['Khối'] || form.Khoi || '').trim(),
        'Giáo viên': String(form['Giáo viên'] || form.GiaoVien || '').trim(),
        'Cơ sở': String(form['Cơ sở'] || form.CoSo || '').trim(),
        'Buổi 1': String(form['Buổi 1'] || form.Buoi1 || '').trim(),
        'Buổi 2': String(form['Buổi 2'] || form.Buoi2 || '').trim(),
        'Buổi 3': String(form['Buổi 3'] || form.Buoi3 || '').trim(),
        MaLop: classCode,
        TenLop: String(form['Tên Lớp'] || form.TenLop || classCode).trim() || classCode,
        Khoi: String(form['Khối'] || form.Khoi || '').trim(),
        GiaoVien: String(form['Giáo viên'] || form.GiaoVien || '').trim(),
        CoSo: String(form['Cơ sở'] || form.CoSo || '').trim(),
        Buoi1: String(form['Buổi 1'] || form.Buoi1 || '').trim(),
        Buoi2: String(form['Buổi 2'] || form.Buoi2 || '').trim(),
        Buoi3: String(form['Buổi 3'] || form.Buoi3 || '').trim(),
      };

      // Optimistic update
      if (editClass) {
        setUClasses(prev => {
          let found = false;
          const next = prev.map(c => {
            const sameClass = classCodeOf(c) === originalCode || classCodeOf(c) === classCode;
            if (!sameClass) return c;
            found = true;
            return { ...c, ...normalizedForm };
          });
          return found ? next : [...next, normalizedForm];
        });
      } else {
        setUClasses(prev => [...prev, normalizedForm]);
      }
      // FIX CRITICAL: GAS lopVals reads camelCase (MaLop, TenLop...) NOT Vietnamese keys ('Mã Lớp'...)
      // Phải map sang đúng field name mà GAS expect
      await api({
        action: editClass ? 'updateClass' : 'saveClass',
        MaLop:    normalizedForm.MaLop,
        'Ma Lop': normalizedForm.MaLop,  // backup key GAS cũng check
        TenLop:   normalizedForm.TenLop,
        Khoi:     normalizedForm.Khoi,
        MaGV:     form.MaGV || form.teacherId || editClass?.MaGV || editClass?.teacherId || '',
        GiaoVien: normalizedForm.GiaoVien,
        CoSo:     normalizedForm.CoSo,
        Buoi1:    normalizedForm.Buoi1,
        Buoi2:    normalizedForm.Buoi2,
        Buoi3:    normalizedForm.Buoi3,
      });
      setSilent();
      void loadData();
    }, editClass ? '✅ Đã cập nhật lớp!' : '✅ Đã thêm lớp mới!')
  , [withSave, editClass, api, setUClasses, setSilent, loadData]);

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
      const studentForFee = students.find(s => s.id === maHS);
      const maLop        = String(form.maLop || form.MaLop || form.classId || studentForFee?.classId || '').trim();
      const t            = mkTs(form.date);
      const n            = new Date();
      const yy           = n.getFullYear().toString().slice(2);
      const mm           = (n.getMonth() + 1).toString().padStart(2,'0');
      const dd           = n.getDate().toString().padStart(2,'0');
      // BUG7 FIX: khi edit, soCT phải là docNum cũ để GAS tìm đúng row
      // khi thêm mới, generate soCT mới
      const soCT = editPayment
        ? (editPayment.docNum || form.docNum)
        : (form.docNum || `PT-${yy}${mm}${dd}-${maHS.toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`);
      const dateFormatted = formatDate(form.date);
      const description  = `Học phí tháng ${thangHP} năm ${namHP}`;
      const clean        = sanitizeObject({ ...form, maHS, maLop, MaLop: maLop, classId: maLop, soTien: Number(form.soTien), date: dateFormatted, description, thangHP, namHP });

      const previewPayment: Payment = {
        id: soCT, docNum: soCT, date: dateFormatted,
        studentId: maHS,
        studentName: studentForFee?.name || maHS,
        payer: form.nguoiNop || '', method: form.method || 'Chuyển khoản',
        description, amount: Number(form.soTien), note: form.note || '',
        thangHP, namHP, maLop,
        collector: form.nguoiThu || studentForFee?.teacher || '',
        nguoiThu: form.nguoiThu || studentForFee?.teacher || '',
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
      // BUG7 FIX: khi edit dùng docNum cũ để GAS tìm đúng row
      const soCT = editExpense
        ? (editExpense.docNum || form.docNum)
        : (form.docNum || `PC-${yy}${mm}${dd}-${n.getTime().toString(36).slice(-4).toUpperCase()}`);
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

    // BUG5 FIX: validate trước optimistic update — tránh entry giả xuất hiện rồi bị xóa
    if (!form.content?.trim()) {
      toast.error('⚠️ Vui lòng nhập nội dung bài dạy!');
      return;
    }

    return withSave(async () => {
      /* ── Optimistic update: chỉ chạy sau khi withSave đã lấy khóa lưu ── */
      const attList = sanitizeAttendance(form.attendance || []);
      const present = attList.filter((a: any) => (a.trangThai || a['Trạng thái']) === 'Có mặt').length;
      const absent  = attList.filter((a: any) => {
        const st = a.trangThai || a['Trạng thái'];
        return st === 'Vắng';
      }).length;
      const late    = 0;
      const excused = attList.filter((a: any) => {
        const st = a.trangThai || a['Trạng thái'];
        return st === 'Có phép' || st === 'Nghỉ có phép';
      }).length;
      const dateFormatted = formatDate(form.date);
      const originalId = form.originalId || form.maBuoi || form.id || '';
      const optimisticLog = {
        id: originalId || undefined,
        maBuoi: originalId || undefined,
        rawDate: form.date, date: dateFormatted,
        originalDate: form.originalDate || form.date,
        originalClassId: form.originalClassId || form.classId,
        originalCaDay: form.originalCaDay || form.caDay || '',
        classId: form.classId, content: form.content || '',
        homework: form.homework || '---', teacherNote: form.teacherNote || '',
        teacherName: form.teacherName || '', caDay: form.caDay || '',
        lessonType: form.lessonType || 'regular',
        present, absent, late, excused, attendanceList: attList,
      };
      if (isEdit) {
        setTlogs(prev => prev.map(l =>
          (originalId && ((l as any).maBuoi === originalId || (l as any).id === originalId)) ||
          (!originalId &&
            l.classId === form.originalClassId &&
            formatDate(l.date) === formatDate(form.originalDate) &&
            l.caDay === (form.originalCaDay || form.caDay))
            ? optimisticLog : l
        ));
      } else {
        setTlogs(prev => [optimisticLog, ...prev]);
      }
      setEditDiary(null);

      await api({
        action:         isEdit ? 'updateDiary' : 'saveDiary',
        date:           dateFormatted,
        classId:        form.classId,
        caDay:          form.caDay || '',
        teacherName:    form.teacherName || '',
        attendanceList: attList,
        content:        form.content,
        homework:       form.homework || '---',
        teacherNote:    form.teacherNote || '',
        lessonType:      form.lessonType || 'regular',
        ...(isEdit && {
          originalId,
          originalDate:     form.originalDate,
          originalClassId:  form.originalClassId,
          originalCaDay:    form.originalCaDay || '',
        }),
      });
      setSilent(); loadData();
    }, isEdit ? '✅ Đã cập nhật buổi dạy!' : isLessonOffLog(form) ? '✅ Đã lưu nghỉ buổi!' : '✅ Đã ghi buổi dạy!');
  }, [withSave, api, setTlogs, setSilent, loadData]);

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
    if (delTarget.type === 'class') {
      setUClasses(prev => prev.filter(c => String(c['Mã Lớp'] || c.MaLop || c.classId || '') !== delTarget.id));
      await withSave(async () => {
        await api({ action: 'deleteClass', id: delTarget.id });
        setSilent(); loadData();
      }, '✅ Đã xóa lớp!');
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
    const normText = (raw: any) => String(raw || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd');
    const rawId = String(form.id || '').trim();
    const name = String(form.name || '').trim();
    const isSyntheticId = rawId.toUpperCase().startsWith('SYN-');
    const nextTeacherId = () => {
      const used = new Set(teachers.map(t => String(t.id || '').trim().toUpperCase()));
      const maxNo = teachers.reduce((max, t) => {
        const m = String(t.id || '').trim().toUpperCase().match(/^GV0*(\d+)$/);
        return m ? Math.max(max, Number(m[1])) : max;
      }, 0);
      let nextNo = maxNo + 1;
      let nextId = `GV${String(nextNo).padStart(4, '0')}`;
      while (used.has(nextId)) {
        nextNo += 1;
        nextId = `GV${String(nextNo).padStart(4, '0')}`;
      }
      return nextId;
    };
    const existingById = !isSyntheticId && rawId
      ? teachers.find(t => String(t.id || '').trim() === rawId)
      : undefined;
    const existingByName = name
      ? teachers.find(t =>
          !String(t.id || '').trim().toUpperCase().startsWith('SYN-') &&
          normText(t.name) === normText(name)
        )
      : undefined;
    const targetTeacher = existingById || existingByName;
    const isEdit = !!targetTeacher;
    const teacherId = isEdit ? String(targetTeacher?.id || '').trim() : nextTeacherId();
    const payload: Teacher = {
      ...form,
      id:        teacherId,
      name,
      phone:     String(form.phone || '').trim(),
      email:     String(form.email || '').trim(),
      specialization: String(form.specialization || '').trim(),
      qualification:  String(form.qualification || '').trim(),
      baseSalary: Number(form.baseSalary || 0),
      hourlyRate: Number(form.hourlyRate || 0),
      allowance:  Number(form.allowance || 0),
      notes:      String(form.notes || '').trim(),
      classes:   form.classes  || [],
      status:    form.status   || 'active',
      createdAt: targetTeacher?.createdAt || form.createdAt || new Date().toISOString(),
    };
    await withSave(async () => {
      if (isEdit) {
        setTeachers(prev => prev.map(t => String(t.id || '').trim() === teacherId ? { ...t, ...payload } : t));
      } else {
        setTeachers(prev => [payload, ...prev]);
      }
      // FIX CRITICAL: GAS tvVals reads {subject, degree, salary} NOT {specialization, qualification, baseSalary}
      await api({
        action: isEdit ? 'updateTeacher' : 'saveTeacher',
        ...payload,
        MaGV:       payload.id,
        HoTen:      payload.name,
        SDT:        payload.phone,
        Email:      payload.email,
        TrangThai:  payload.status,
        ChuyenMon:  payload.specialization || '',
        DonGiaMoiBuoi: payload.hourlyRate || 0,
        LuongCoBan: payload.baseSalary || 0,
        PhuCap:     payload.allowance || 0,
        GhiChu:     payload.notes || '',
        subject:    payload.specialization || '',
        degree:     payload.qualification  || '',
        salary:     payload.baseSalary     || 0,
      });
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
    const payload = {
      ...form, id: optimisticId,
      // FIX CRITICAL: GAS hlVals reads d.title, frontend uses d.name → send both
      title: form.name || form.title || '',
      name:  form.name || form.title || '',
      tags: tagsArr.join(','),
      uploadDate: form.uploadDate || new Date().toISOString(),
    };
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
  const [hideInactive, setHideInactive] = useState(true); // default: chỉ hiện học sinh đang học
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

  const isStudentBillableForPeriod = useCallback((s: Student, fm: { m: number; y: number }): boolean => (
    isStudentBillableInMonth(s, fm)
  ), []);

  const filtFin = useMemo(() => {
    const q = qF.toLowerCase().trim();
    const filtered = students.filter(s => {
      if (hideInactive && !isStudentActive(s)) return false;
      if (q    && !s.name.toLowerCase().includes(q) && !s.id.toLowerCase().includes(q)) return false;
      if (fTch && !s.teacher.includes(fTch)) return false;
      if (fFC  && s.classId !== fFC) return false;
      if (fSt === 'paid') return isPaid(s.id, fM, fY);
      if (fSt === 'unpaid') {
        if (!isStudentBillableForPeriod(s, { m: fM, y: fY })) return false;
        return !isPaid(s.id, fM, fY);
      }
      return true;
    });
    if (fSt === 'unpaid') {
      const debtMonths = buildSchoolYearMonths(schoolYear).filter(fm => {
        if (fm.y > curYr) return false;
        if (fm.y === curYr && fm.m > curMo) return false;
        return true;
      });
      return [...filtered].sort((a, b) => {
        const aDebt = debtMonths.filter(fm => isStudentBillableForPeriod(a, fm) && !isPaid(a.id, fm.m, fm.y)).length;
        const bDebt = debtMonths.filter(fm => isStudentBillableForPeriod(b, fm) && !isPaid(b.id, fm.m, fm.y)).length;
        return bDebt - aDebt;
      });
    }
    return filtered;
  }, [students, qF, fTch, fFC, fSt, fM, fY, isPaid, hideInactive, isStudentBillableForPeriod, curMo, curYr, schoolYear]);

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
    isStudentBillableForPeriod,
  };
}
