import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { Assessment, ScoreEntry } from './types';
import { fetchWithTimeout, formatDate } from './helpers';
import { RULES } from './rules';

export type AssessmentInput = Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };
export type ScoreDraft = Pick<ScoreEntry, 'studentId' | 'score' | 'status' | 'comment'>;
export type ScoreEnrollment = {
  studentId: string;
  classId: string;
  startDate: string;
  endDate: string;
  status: string;
};

const CACHE_KEY = 'ltn-scores-cache-v2';

function txAssessment(raw: any): Assessment {
  return {
    id: String(raw.MaBaiKT || raw.id || ''),
    name: String(raw.TenBaiKT || raw.name || ''),
    classId: String(raw.MaLop || raw.classId || ''),
    lessonId: String(raw.MaBuoi || raw.lessonId || ''),
    date: formatDate(String(raw.NgayKiemTra || raw.date || '')),
    type: String(raw.LoaiBaiKT || raw.type || 'quick'),
    topic: String(raw.ChuyenDe || raw.topic || ''),
    maxScore: Number(raw.DiemToiDa ?? raw.maxScore) || 10,
    weight: Number(raw.TrongSo ?? raw.weight) || 1,
    teacherId: String(raw.MaGV || raw.teacherId || ''),
    status: String(raw.TrangThai || raw.status || 'draft') as Assessment['status'],
    note: String(raw.GhiChu || raw.note || ''),
    createdAt: String(raw.CreatedAt || raw.createdAt || ''),
    updatedAt: String(raw.UpdatedAt || raw.updatedAt || ''),
  };
}

function txScore(raw: any): ScoreEntry {
  const scoreRaw = raw.Diem ?? raw.score;
  return {
    id: String(raw.MaKetQua || raw.id || ''),
    assessmentId: String(raw.MaBaiKT || raw.assessmentId || ''),
    studentId: String(raw.MaHS || raw.studentId || ''),
    score: scoreRaw === '' || scoreRaw == null ? null : Number(scoreRaw),
    status: String(raw.TrangThai || raw.status || 'scored') as ScoreEntry['status'],
    comment: String(raw.NhanXet || raw.comment || ''),
    createdAt: String(raw.CreatedAt || raw.createdAt || ''),
    updatedAt: String(raw.UpdatedAt || raw.updatedAt || ''),
  };
}

function txEnrollment(raw: any): ScoreEnrollment {
  return {
    studentId: String(raw.MaHS || raw.studentId || ''),
    classId: String(raw.MaLop || raw.classId || ''),
    startDate: formatDate(String(raw.NgayVao || raw.startDate || '')),
    endDate: formatDate(String(raw.NgayRa || raw.endDate || '')),
    status: String(raw.TrangThai || raw.status || ''),
  };
}

function requestId(action: string) {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `REQ_${Date.now()}_${action.toUpperCase()}_${random}`;
}

export function useScores({ scriptUrl, adminToken, enabled = true }: { scriptUrl: string; adminToken: string; enabled?: boolean }) {
  const readCache = () => {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
  };
  const initial = readCache();
  const [assessments, setAssessments] = useState<Assessment[]>(() => initial.assessments || []);
  const [scores, setScores] = useState<ScoreEntry[]>(() => initial.scores || []);
  const [enrollments, setEnrollments] = useState<ScoreEnrollment[]>(() => initial.enrollments || []);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const persist = useCallback((nextAssessments: Assessment[], nextScores: ScoreEntry[], nextEnrollments: ScoreEnrollment[]) => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ assessments: nextAssessments, scores: nextScores, enrollments: nextEnrollments })); } catch {}
  }, []);

  const request = useCallback(async (body: Record<string, unknown>) => {
    const action = String(body.action || 'write');
    const res = await fetchWithTimeout(scriptUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ ...body, adminToken, ...(action === 'getScores' ? {} : { requestId: requestId(action) }) }),
      timeout: RULES.network.writeTimeout,
    });
    if (!res.ok) throw new Error(`Server lỗi HTTP ${res.status}`);
    const data = await res.json();
    if (data?.ok === false) throw new Error(data.error || 'Không thể xử lý dữ liệu điểm số');
    return data;
  }, [adminToken, scriptUrl]);

  const load = useCallback(async () => {
    if (!scriptUrl || !adminToken) return;
    setLoading(true);
    try {
      const data = await request({ action: 'getScores' });
      const nextAssessments = (data.assessments || []).map(txAssessment);
      const nextScores = (data.scores || []).map(txScore);
      const nextEnrollments = (data.enrollments || []).map(txEnrollment);
      setAssessments(nextAssessments);
      setScores(nextScores);
      setEnrollments(nextEnrollments);
      persist(nextAssessments, nextScores, nextEnrollments);
    } catch (err: any) {
      toast.error(err.message || 'Chưa tải được dữ liệu điểm số');
    } finally {
      setLoading(false);
    }
  }, [adminToken, persist, request, scriptUrl]);

  useEffect(() => {
    if (enabled) void load();
  }, [enabled, load]);

  const saveAssessment = useCallback(async (input: AssessmentInput) => {
    setSaving(true);
    try {
      const data = await request({ action: input.id ? 'updateAssessment' : 'saveAssessment', ...input });
      await load();
      toast.success(input.id ? 'Đã cập nhật bài kiểm tra' : 'Đã tạo bài kiểm tra');
      return String(data.id || input.id || '');
    } finally {
      setSaving(false);
    }
  }, [load, request]);

  const saveScoreDraft = useCallback(async (assessmentId: string, entries: ScoreDraft[], expectedStudentIds: string[], finalize = false) => {
    setSaving(true);
    try {
      await request({ action: 'saveScores', assessmentId, entries, expectedStudentIds, finalize });
      await load();
      toast.success(finalize ? 'Đã chốt điểm' : 'Đã lưu nháp điểm');
    } finally {
      setSaving(false);
    }
  }, [load, request]);

  const reopenAssessment = useCallback(async (id: string) => {
    setSaving(true);
    try {
      await request({ action: 'reopenAssessment', id });
      await load();
      toast.success('Đã mở lại bài kiểm tra');
    } finally {
      setSaving(false);
    }
  }, [load, request]);

  const deleteAssessment = useCallback(async (id: string) => {
    setSaving(true);
    try {
      await request({ action: 'deleteAssessment', id });
      await load();
      toast.success('Đã xóa bài kiểm tra');
    } finally {
      setSaving(false);
    }
  }, [load, request]);

  return useMemo(() => ({
    assessments, scores, enrollments, loading, saving,
    saveAssessment, saveScoreDraft, reopenAssessment, deleteAssessment, reload: load,
  }), [assessments, deleteAssessment, enrollments, load, loading, reopenAssessment, saveAssessment, saveScoreDraft, saving, scores]);
}
