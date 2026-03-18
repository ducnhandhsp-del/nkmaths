/**
 * hooks/useCommands.ts — Lớp Toán NK v23.0
 * Command Palette: danh sách lệnh tìm kiếm & hành động nhanh.
 */

import { useMemo } from 'react';
import type { Student } from './types';
import type { Screen } from './types';

export interface Command {
  id:       string;
  group:    string;
  label:    string;
  keywords: string[];
  icon:     string;
  handler:  () => void;
}

interface UseCommandsParams {
  students:     Student[];
  uClasses:     any[];
  goScreen:     (s: Screen) => void;
  onAddStudent: () => void;
  onAddClass:   () => void;
  onAddDiary:   (classId?: string) => void;
  onAddPayment: () => void;
}

export function useCommands({
  students, uClasses,
  goScreen, onAddStudent, onAddClass, onAddDiary, onAddPayment,
}: UseCommandsParams): Command[] {

  return useMemo<Command[]>(() => {
    const cmds: Command[] = [];

    /* ── Điều hướng ── */
    const navItems: [Screen, string, string, string][] = [
      ['overview',  'Tổng quan',         'tong quan dashboard',       '🏠'],
      ['operations', 'Nhật ký giảng dạy', 'nhat ky diem danh diary',   '📖'],
      ['students',  'Học sinh',          'hoc sinh danh sach student', '👥'],
      ['classes',   'Lớp học',           'lop hoc class',              '🏫'],
      ['finance',   'Tài chính',         'tai chinh thu chi finance',  '💰'],
      ['settings',  'Cài đặt',           'cai dat settings',           '⚙️'],
    ];
    navItems.forEach(([id, label, kw, icon]) => {
      cmds.push({
        id:       `nav-${id}`,
        group:    'Điều hướng',
        label,
        keywords: kw.split(' '),
        icon,
        handler:  () => goScreen(id),
      });
    });

    /* ── Hành động nhanh ── */
    cmds.push(
      {
        id: 'add-student', group: 'Thêm mới', label: 'Thêm học sinh mới',
        keywords: ['them', 'hoc sinh', 'add', 'student', 'moi'],
        icon: '➕', handler: onAddStudent,
      },
      {
        id: 'add-class', group: 'Thêm mới', label: 'Thêm lớp học mới',
        keywords: ['them', 'lop', 'add', 'class', 'moi'],
        icon: '🏫', handler: onAddClass,
      },
      {
        id: 'add-diary', group: 'Thêm mới', label: 'Ghi buổi dạy mới',
        keywords: ['them', 'ghi', 'nhat ky', 'buoi day', 'diem danh', 'diary', 'dd'],
        icon: '📝', handler: () => onAddDiary(),
      },
      {
        id: 'add-payment', group: 'Thêm mới', label: 'Thu học phí',
        keywords: ['thu', 'phi', 'hoc phi', 'payment', 'tien'],
        icon: '💳', handler: onAddPayment,
      },
    );

    /* ── Điểm danh theo lớp ── */
    uClasses.forEach(c => {
      const id   = c['Mã Lớp'] || '';
      const name = c['Tên Lớp'] || id;
      cmds.push({
        id:       `diary-${id}`,
        group:    'Điểm danh',
        label:    `Điểm danh lớp ${id}`,
        keywords: ['diem danh', 'dd', 'diary', id.toLowerCase(), name.toLowerCase()],
        icon:     '✅',
        handler:  () => { goScreen('operations'); onAddDiary(id); },
      });
    });

    /* ── Tìm học sinh ── */
    students.slice(0, 80).forEach(s => {
      cmds.push({
        id:       `student-${s.id}`,
        group:    'Học sinh',
        label:    `${s.name} — Lớp ${s.classId}`,
        keywords: s.name.toLowerCase().split(' ').concat([s.id.toLowerCase(), s.classId.toLowerCase()]),
        icon:     '👤',
        handler:  () => goScreen('students'),
      });
    });

    return cmds;
  }, [students, uClasses, goScreen, onAddStudent, onAddClass, onAddDiary, onAddPayment]);
}
