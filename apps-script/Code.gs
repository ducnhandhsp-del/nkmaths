// Generated from docs/gas/LOP_TOAN_NK_GAS_2026_2027_FULL.gs.
// Do not edit this generated bundle directly until apps-script/ is promoted to the source of truth.
// LOP_TOAN_NK_2026_2027 - Google Apps Script
// Schema mới theo SHEET_SPEC_2026_2027.md
// Mục tiêu:
// - Sheet mới sạch, ít trùng lặp.
// - Apps Script làm adapter để app React hiện tại vẫn đọc được format cũ.
// - Dễ copy vào Apps Script và deploy mới.
//
// Cách dùng lần đầu:
// 1. Tạo Google Sheet mới theo template hoặc để script tự tạo header.
// 2. Mở Extensions -> Apps Script.
// 3. Dán toàn bộ file này vào Code.gs.
// 4. Chạy setupSheets() một lần để tạo/chuẩn hóa header.
// 5. Deploy Web App:
//    - Execute as: Me
//    - Who has access: Anyone
// 6. Copy Web App URL vào app React.
//
// Lưu ý:
// - Header ở dòng 1.
// - Data bắt đầu dòng 2.
// - Không merge cells.
// - Tất cả ngày nghiệp vụ dùng DD/MM/YYYY.
// - CreatedAt/UpdatedAt dùng timestamp dạng HH:mm:ss - DD/MM/YYYY.

var DATA_START = 2;
var TZ = 'Asia/Ho_Chi_Minh';

var SHEETS = {
  CONFIG: 'Config',
  HOCSINH: 'HocSinh',
  GIAOVIEN: 'GiaoVien',
  LOPHOC: 'LopHoc',
  DANGKYLOP: 'DangKyLop',
  BUOIHOC: 'BuoiHoc',
  DIEMDANH: 'DiemDanh',
  HOCPHI: 'HocPhi',
  CHIPHI: 'ChiPhi',
  NGHIHOC: 'NghiHoc',
  NHATKYHETHONG: 'NhatKyHeThong'
};

var HEADERS = {};
HEADERS[SHEETS.CONFIG] = [
  'Key', 'Value', 'Group', 'Note', 'UpdatedAt'
];

HEADERS[SHEETS.HOCSINH] = [
  'MaHS', 'HoTen', 'NgaySinh', 'CoSo', 'Khoi', 'Truong',
  'TenPhuHuynh', 'SDTPhuHuynh', 'SDTHocSinh', 'DiaChi',
  'HocLucToan', 'MucTieu', 'CanHoTro', 'TrangThai',
  'NgayBatDau', 'NgayKetThuc', 'LyDoNghi',
  'FacebookURL', 'GhiChu', 'CreatedAt', 'UpdatedAt'
];

HEADERS[SHEETS.GIAOVIEN] = [
  'MaGV', 'HoTen', 'SDT', 'Email', 'TrangThai', 'ChuyenMon',
  'DonGiaMoiBuoi', 'LuongCoBan', 'PhuCap',
  'GhiChu', 'CreatedAt', 'UpdatedAt'
];

HEADERS[SHEETS.LOPHOC] = [
  'MaLop', 'TenLop', 'NamHoc', 'Khoi', 'CoSo', 'MaGV',
  'TrangThai', 'HocPhiMacDinh',
  'Buoi1', 'Buoi2', 'Buoi3',
  'NgayBatDau', 'NgayKetThuc',
  'GhiChu', 'CreatedAt', 'UpdatedAt'
];

HEADERS[SHEETS.DANGKYLOP] = [
  'MaDangKy', 'MaHS', 'MaLop', 'NgayVao', 'NgayRa',
  'TrangThai', 'GhiChu', 'CreatedAt', 'UpdatedAt'
];

HEADERS[SHEETS.BUOIHOC] = [
  'MaBuoi', 'Ngay', 'MaLop', 'CaDay', 'MaGV',
  'TrangThai', 'NoiDung', 'BaiTapVeNha', 'GhiChuGV',
  'CreatedAt', 'UpdatedAt'
];

HEADERS[SHEETS.DIEMDANH] = [
  'MaDiemDanh', 'MaBuoi', 'MaHS', 'TrangThai', 'GhiChu', 'UpdatedAt'
];

HEADERS[SHEETS.HOCPHI] = [
  'MaPhieuThu', 'NgayThu', 'MaHS', 'MaLop',
  'ThangHP', 'NamHP', 'SoTien', 'HinhThuc',
  'NguoiNop', 'NguoiThu', 'TrangThai', 'GhiChu',
  'CreatedAt', 'UpdatedAt'
];

HEADERS[SHEETS.CHIPHI] = [
  'MaPhieuChi', 'NgayChi', 'NguoiChi', 'HangMuc',
  'SoTien', 'NoiDung', 'MaLop', 'MaGV',
  'TrangThai', 'GhiChu', 'CreatedAt', 'UpdatedAt'
];

HEADERS[SHEETS.NGHIHOC] = [
  'MaNghi', 'Ngay', 'MaHS', 'MaBuoi', 'LyDo',
  'TrangThai', 'NguoiBao', 'GhiChu',
  'CreatedAt', 'UpdatedAt'
];

HEADERS[SHEETS.NHATKYHETHONG] = [
  'LogId', 'Time', 'Action', 'Entity', 'EntityId', 'User', 'Detail', 'Status'
];

var STATUS_VI_TO_CODE = {
  'Có mặt': 'present',
  'Co mat': 'present',
  'present': 'present',
  'Vắng': 'absent',
  'Vang': 'absent',
  'absent': 'absent',
  'Muộn': 'present',
  'Muon': 'present',
  'late': 'present',
  'Có phép': 'excused',
  'Co phep': 'excused',
  'Nghỉ có phép': 'excused',
  'Nghi co phep': 'excused',
  'excused': 'excused'
};

var STATUS_CODE_TO_VI = {
  present: 'Có mặt',
  absent: 'Vắng',
  late: 'Có mặt',
  excused: 'Có phép'
};

// ─────────────────────────────────────────────────────────────
// Entry points
// ─────────────────────────────────────────────────────────────

function doGet(e) {
  return jsonOut({
    ok: true,
    msg: 'Lop Toan NK GAS 2026-2027',
    version: '2026.2027.1',
    time: nowStr()
  });
}

function doPost(e) {
  var result;
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }

    var action = data.action;
    var map = {
      getData: getData,

      saveHS: saveHS,
      updateHS: updateHS,
      deleteHS: deleteHS,

      saveClass: saveClass,
      updateClass: updateClass,
      deleteClass: deleteClass,

      savePayment: savePayment,
      updatePayment: updatePayment,
      deletePayment: deletePayment,

      saveExpense: saveExpense,
      updateExpense: updateExpense,
      deleteExpense: deleteExpense,

      saveDiary: saveDiary,
      updateDiary: updateDiary,
      deleteDiary: deleteDiary,

      saveTeacher: saveTeacher,
      updateTeacher: updateTeacher,
      deleteTeacher: deleteTeacher,

      saveLeave: saveLeave,
      updateLeave: updateLeave,
      deleteLeave: deleteLeave,

      setupSheets: function() {
        setupSheets();
        return { ok: true, msg: 'setupSheets completed' };
      }
    };

    if (map[action]) result = map[action](data);
    else result = { ok: false, error: 'Unknown action: ' + action };
  } catch (err) {
    result = { ok: false, error: err && err.stack ? err.stack : String(err) };
  }

  return jsonOut(result);
}

// ─────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────

function setupSheets() {
  var names = [
    SHEETS.CONFIG,
    SHEETS.HOCSINH,
    SHEETS.GIAOVIEN,
    SHEETS.LOPHOC,
    SHEETS.DANGKYLOP,
    SHEETS.BUOIHOC,
    SHEETS.DIEMDANH,
    SHEETS.HOCPHI,
    SHEETS.CHIPHI,
    SHEETS.NGHIHOC,
    SHEETS.NHATKYHETHONG
  ];

  names.forEach(function(name) {
    ensureSheet(name, HEADERS[name]);
  });
  applyTextFormats();

  seedConfig();
  logSystem('setupSheets', 'System', '', 'Created/verified headers', 'ok');
}

function ensureSheet(name, headers) {
  var sheet = sh(name);
  if (!sheet) {
    sheet = ss().insertSheet(name);
  }

  var currentLastCol = Math.max(sheet.getLastColumn(), headers.length);
  var existing = [];
  if (sheet.getLastRow() >= 1 && currentLastCol > 0) {
    existing = sheet.getRange(1, 1, 1, currentLastCol).getValues()[0].map(function(v) { return str(v); });
  }

  while (existing.length && !str(existing[existing.length - 1])) existing.pop();

  var finalHeaders = existing.length ? existing.slice() : [];
  var changed = finalHeaders.length === 0;
  headers.forEach(function(h) {
    if (finalHeaders.indexOf(h) < 0) {
      finalHeaders.push(h);
      changed = true;
    }
  });

  if (changed && finalHeaders.length) {
    sheet.getRange(1, 1, 1, finalHeaders.length).setValues([finalHeaders]);
  }

  sheet.setFrozenRows(1);
  try {
    sheet.getRange(1, 1, 1, Math.max(finalHeaders.length, headers.length))
      .setFontWeight('bold')
      .setBackground('#0f172a')
      .setFontColor('#ffffff');
    sheet.autoResizeColumns(1, Math.max(finalHeaders.length, headers.length));
  } catch (e) {}
}

function applyTextFormats() {
  formatColumnsAsText(SHEETS.HOCSINH, [
    'MaHS', 'id',
    'SDT', 'SoDienThoai', 'phone',
    'SDTPhuHuynh', 'SDTHocSinh', 'parentPhone', 'studentPhone'
  ]);
  formatColumnsAsText(SHEETS.GIAOVIEN, ['MaGV', 'id', 'teacherId', 'SDT', 'SDTGV', 'SoDienThoai', 'phone']);
}

function formatColumnsAsText(sheetName, headerNames) {
  var sheet = getSheet(sheetName);
  var headers = getHeaders(sheetName);
  headerNames.forEach(function(headerName) {
    var idx = headers.indexOf(headerName) + 1;
    if (idx > 0) sheet.getRange(1, idx, Math.max(sheet.getMaxRows(), 1), 1).setNumberFormat('@');
  });
}

function seedConfig() {
  var rows = getRows(SHEETS.CONFIG);
  var map = {};
  rows.forEach(function(r) { map[str(r.Key)] = true; });

  var defaults = [
    { Key: 'schoolYear', Value: '2026-2027', Group: 'general', Note: 'Năm học hiện tại' },
    { Key: 'baseTuition', Value: '600000', Group: 'finance', Note: 'Học phí mặc định' },
    { Key: 'caDayOptions', Value: '7h30,9h,13h30,15h30,17h30,19h30', Group: 'schedule', Note: 'Ca dạy chuẩn' }
  ];

  defaults.forEach(function(item) {
    if (!map[item.Key]) {
      item.UpdatedAt = nowStr();
      appendObject(SHEETS.CONFIG, item);
    }
  });
}

// ─────────────────────────────────────────────────────────────
// Core getData adapter
// ─────────────────────────────────────────────────────────────

function getData() {
  try {
    var readRows = createSnapshotReader();
    var studentsRaw = readRows(SHEETS.HOCSINH);
    var teachersRaw = readRows(SHEETS.GIAOVIEN);
    var classesRaw = readRows(SHEETS.LOPHOC);
    var regsRaw = readRows(SHEETS.DANGKYLOP);
    var lessonsRaw = readRows(SHEETS.BUOIHOC);
    var attRaw = readRows(SHEETS.DIEMDANH);
    var paymentsRaw = readRows(SHEETS.HOCPHI);
    var expensesRaw = readRows(SHEETS.CHIPHI);
    var leaveRaw = readRows(SHEETS.NGHIHOC);

    var teacherMap = buildTeacherMap(teachersRaw);
    var teacherNameToId = buildTeacherNameToId(teachersRaw);
    var classMap = buildClassMap(classesRaw);
    var studentMap = buildStudentMap(studentsRaw);

    var activeRegByStudent = buildActiveRegistrationMap(regsRaw);
    var attendanceByLesson = groupAttendanceByLesson(attRaw);

    var hs = studentsRaw
      .filter(function(r) { return studentIdOf(r); })
      .map(function(s) {
        var maHS = studentIdOf(s);
        var reg = activeRegByStudent[maHS] || null;
        var regClassId = reg ? registrationClassIdOf(reg) : '';
        var cls = regClassId ? classMap[regClassId] : null;
        var classTeacherId = cls ? classTeacherIdOf(cls, teacherNameToId) : '';
        var teacher = classTeacherId ? teacherMap[classTeacherId] : null;
        var studentName = str(s.HoTen || s.name || s['Họ và tên học sinh']) || '---';
        var parentName = str(s.TenPhuHuynh || s.PhuHuynh || s.parentName || s['Họ và tên phụ huynh']);
        var parentPhone = str(s.SDTPhuHuynh || s.SDT || s.parentPhone || s['Số điện thoại phụ huynh (Zalo)']);
        var studentPhone = str(s.SDTHocSinh || s.studentPhone || s['Số điện thoại học sinh']);
        var status = normalizeGeneralStatus(s.TrangThai || s.status) || 'active';

        return {
          id: maHS,
          'Mã HS': maHS,
          name: studentName,
          'Họ và tên học sinh': studentName,
          dob: formatDate(s.NgaySinh),
          'Ngày tháng năm sinh': formatDate(s.NgaySinh),
          branch: str(s.CoSo),
          'Cơ sở học tập': str(s.CoSo),
          grade: str(s.Khoi),
          'Khối lớp hiện tại': str(s.Khoi),
          school: str(s.Truong),
          'Trường đang học': str(s.Truong),
          teacher: teacher ? teacherNameOf(teacher) : '',
          'Giáo viên trực tiếp giảng dạy': teacher ? teacherNameOf(teacher) : '',
          parentName: parentName,
          'Họ và tên phụ huynh': parentName,
          parentPhone: parentPhone,
          'Số điện thoại phụ huynh (Zalo)': parentPhone,
          studentPhone: studentPhone,
          'Số điện thoại học sinh': studentPhone,
          address: str(s.DiaChi),
          'Địa chỉ thường trú': str(s.DiaChi),
          academicLevel: str(s.HocLucToan),
          'Học lực môn Toán hiện tại': str(s.HocLucToan),
          goal: str(s.MucTieu),
          'Mục tiêu điểm số học kỳ tới': str(s.MucTieu),
          supportNeeded: str(s.CanHoTro),
          'Kiến thức em cần hỗ trợ thêm': str(s.CanHoTro),
          classId: regClassId,
          'Mã Lớp': regClassId,
          startDate: formatDate(s.NgayBatDau),
          'Ngày bắt đầu': formatDate(s.NgayBatDau),
          endDate: formatDate(s.NgayKetThuc),
          'Ngày kết thúc': formatDate(s.NgayKetThuc),
          status: status,
          'Trạng thái': status,
          notes: str(s.GhiChu),
          facebookUrl: str(s.FacebookURL),
          createdAt: str(s.CreatedAt),
          updatedAt: str(s.UpdatedAt)
        };
      });

    var uCls = classesRaw
      .filter(function(c) { return classIdOf(c); })
      .map(function(c) {
        var classId = classIdOf(c);
        var maGV = classTeacherIdOf(c, teacherNameToId);
        var t = maGV ? teacherMap[maGV] : null;
        var teacherName = t ? teacherNameOf(t) : classTeacherNameOf(c);
        return {
          MaLop: classId,
          'Ma Lop': classId,
          'Mã Lớp': classId,
          TenLop: str(c.TenLop),
          'Tên Lớp': str(c.TenLop),
          Khoi: str(c.Khoi),
          MaGV: maGV,
          teacherId: maGV,
          'Khối': str(c.Khoi),
          GiaoVien: teacherName,
          'Giáo viên': teacherName,
          CoSo: str(c.CoSo),
          'Cơ sở': str(c.CoSo),
          Buoi1: str(c.Buoi1),
          'Buổi 1': str(c.Buoi1),
          Buoi2: str(c.Buoi2),
          'Buổi 2': str(c.Buoi2),
          Buoi3: str(c.Buoi3),
          'Buổi 3': str(c.Buoi3),
          NamHoc: str(c.NamHoc),
          TrangThai: normalizeGeneralStatus(c.TrangThai),
          HocPhiMacDinh: num(c.HocPhiMacDinh)
        };
      });

    var py = paymentsRaw
      .filter(function(p) { return str(p.MaPhieuThu); })
      .map(function(p) {
        var paymentStudentId = str(p.MaHS || p.maHS || p.studentId || p['Mã HS']);
        var paymentClassId = str(p.MaLop || p.classId || p['Mã Lớp']);
        var st = studentMap[paymentStudentId] || {};
        var th = num(p.ThangHP || p.Thang);
        var yr = num(p.NamHP || p.Nam);
        var status = str(p.TrangThai || p.DaDong || p.status) || 'paid';
        return {
          id: str(p.MaPhieuThu),
          date: formatDate(p.NgayThu),
          docNum: str(p.MaPhieuThu),
          description: 'Học phí tháng ' + th + '/' + yr,
          studentId: paymentStudentId,
          studentName: str(st.HoTen || st.name) || paymentStudentId,
          payer: str(p.NguoiNop),
          method: str(p.HinhThuc),
          amount: num(p.SoTien),
          note: str(p.GhiChu),
          thangHP: th,
          namHP: yr,
          Thang: th,
          Nam: yr,
          maLop: paymentClassId,
          status: status,
          DaDong: status,
          createdAt: str(p.CreatedAt),
          updatedAt: str(p.UpdatedAt)
        };
      });

    var ex = expensesRaw
      .filter(function(e) { return str(e.MaPhieuChi); })
      .map(function(e) {
        return {
          id: str(e.MaPhieuChi),
          date: formatDate(e.NgayChi),
          docNum: str(e.MaPhieuChi),
          description: str(e.NoiDung),
          category: str(e.HangMuc),
          amount: num(e.SoTien),
          spender: str(e.NguoiChi),
          maLop: str(e.MaLop),
          maGV: str(e.MaGV),
          status: str(e.TrangThai) || 'active',
          createdAt: str(e.CreatedAt),
          updatedAt: str(e.UpdatedAt)
        };
      });

    var logs = lessonsRaw
      .filter(function(l) { return str(l.MaBuoi); })
      .map(function(l) {
        var maBuoi = str(l.MaBuoi);
        var maGV = lessonTeacherIdOf(l);
        var lessonClassId = str(l.MaLop || l.classId || l['Mã Lớp']);
        var t = maGV ? teacherMap[maGV] : null;
        var attListRaw = attendanceByLesson[maBuoi] || [];
        var attList = attListRaw.map(function(a) {
          var stCode = normalizeAttendanceStatus(a.TrangThai);
          var stVi = statusCodeToVi(stCode);
          var attStudentId = studentIdOf(a);
          var stu = studentMap[attStudentId] || {};
          return {
            maHS: attStudentId,
            'Mã HS': attStudentId,
            MaHS: attStudentId,
            tenHS: str(stu.HoTen || stu.name) || attStudentId,
            trangThai: stVi,
            TrangThai: stVi,
            'Trạng thái': stVi,
            ghiChu: str(a.GhiChu),
            GhiChu: str(a.GhiChu),
            'Ghi chú': str(a.GhiChu)
          };
        });

        var present = 0, absent = 0, late = 0, excused = 0;
        attListRaw.forEach(function(a) {
          var st = normalizeAttendanceStatus(a.TrangThai);
          if (st === 'present') present++;
          else if (st === 'absent') absent++;
          else if (st === 'excused') excused++;
          else if (st === 'late') present++;
        });

        return {
          maBuoi: maBuoi,
          id: maBuoi,
          rawDate: formatDate(l.Ngay),
          date: formatDate(l.Ngay),
          originalDate: formatDate(l.Ngay),
          classId: lessonClassId,
          originalClassId: lessonClassId,
          caDay: str(l.CaDay),
          originalCaDay: str(l.CaDay),
          maGV: maGV,
          MaGV: maGV,
          teacherName: t ? teacherNameOf(t) : str(l.GiaoVien || l.teacherName || l.MaGV),
          content: str(l.NoiDung) || '---',
          homework: str(l.BaiTapVeNha) || '---',
          teacherNote: str(l.GhiChuGV),
          present: present,
          absent: absent,
          late: late,
          excused: excused,
          attendanceList: attList,
          status: str(l.TrangThai) || 'completed',
          createdAt: str(l.CreatedAt),
          updatedAt: str(l.UpdatedAt)
        };
      })
      .sort(function(a, b) {
        return parseDMY(b.date) - parseDMY(a.date);
      });

    var tv = teachersRaw
      .filter(function(t) { return teacherIdOf(t); })
      .map(function(t) {
        var teacherId = teacherIdOf(t);
        var teacherName = teacherNameOf(t);
        var specialization = str(t.ChuyenMon || t.specialization || t.subject || t.MonDay);
        var baseSalary = num(t.LuongCoBan || t.baseSalary || t.salary);
        var hourlyRate = num(t.DonGiaMoiBuoi || t.hourlyRate || t.DonGia);
        var allowance = num(t.PhuCap || t.allowance);
        return {
          id: teacherId,
          MaGV: teacherId,
          name: teacherName,
          HoTen: teacherName,
          TenGV: teacherName,
          GiaoVien: teacherName,
          phone: str(t.SDT || t.phone || t.SDTGV || t.SoDienThoai),
          SDT: str(t.SDT || t.phone || t.SDTGV || t.SoDienThoai),
          email: str(t.Email || t.email),
          Email: str(t.Email || t.email),
          gender: '',
          dob: '',
          address: '',
          idNumber: '',
          specialization: specialization,
          ChuyenMon: specialization,
          subject: specialization,
          qualification: '',
          degree: '',
          experience: 0,
          baseSalary: baseSalary,
          LuongCoBan: baseSalary,
          salary: baseSalary,
          hourlyRate: hourlyRate,
          DonGiaMoiBuoi: hourlyRate,
          allowance: allowance,
          PhuCap: allowance,
          status: normalizeGeneralStatus(t.TrangThai) || 'active',
          TrangThai: normalizeGeneralStatus(t.TrangThai) || 'active',
          notes: str(t.GhiChu || t.notes),
          GhiChu: str(t.GhiChu || t.notes),
          createdAt: str(t.CreatedAt),
          classes: getClassIdsByTeacher(classesRaw, teacherId, teacherNameToId)
        };
      });

    var totalRevenue = py.reduce(function(s, p) { return s + num(p.amount); }, 0);
    var totalExpense = ex.reduce(function(s, e) { return s + num(e.amount); }, 0);

    return {
      ok: true,
      hs: hs,
      uCls: uCls,
      py: py,
      ex: ex,
      logs: logs,
      tv: tv,
      hl: [],
      leaveRequests: readLeaveRequestsAdapter(leaveRaw, studentsRaw, lessonsRaw),
      summary: {
        totalRevenue: totalRevenue,
        totalExpense: totalExpense,
        chart: []
      }
    };
  } catch (err) {
    return { ok: false, error: 'getData: ' + (err && err.stack ? err.stack : String(err)) };
  }
}

// ─────────────────────────────────────────────────────────────
// HocSinh actions
// ─────────────────────────────────────────────────────────────

function saveHS(d) {
  try {
    setupSheetsIfMissingOnly();
    var obj = normalizeStudentInput(d);
    if (!obj.MaHS) obj.MaHS = makeSequentialId(SHEETS.HOCSINH, 'MaHS', 'HS', 3);
    obj.CreatedAt = obj.CreatedAt || nowStr();
    obj.UpdatedAt = nowStr();

    appendObject(SHEETS.HOCSINH, obj);

    var classId = str(d.classId || d.MaLop || d['Mã Lớp']);
    if (classId) {
      ensureActiveEnrollment(obj.MaHS, classId, obj.NgayBatDau || todayStr(), '');
    }

    logSystem('saveHS', SHEETS.HOCSINH, obj.MaHS, 'Created student ' + obj.HoTen, 'ok');
    return { ok: true, id: obj.MaHS };
  } catch (err) {
    return { ok: false, error: 'saveHS: ' + String(err) };
  }
}

function updateHS(d) {
  try {
    setupSheetsIfMissingOnly();
    var obj = normalizeStudentInput(d);
    if (!obj.MaHS) return { ok: false, error: 'Missing MaHS/id' };

    var row = findStudentRow(obj.MaHS);
    var existing = row > 0 ? getObjectAtRow(SHEETS.HOCSINH, row) : null;

    if (existing) {
      obj.CreatedAt = existing.CreatedAt || obj.CreatedAt || nowStr();
    } else {
      obj.CreatedAt = obj.CreatedAt || nowStr();
    }
    obj.UpdatedAt = nowStr();

    if (row > 0) updateRowObject(SHEETS.HOCSINH, row, obj);
    else appendObject(SHEETS.HOCSINH, obj);

    var classId = str(d.classId || d.MaLop || d['Mã Lớp']);
    if (classId) {
      ensureActiveEnrollment(obj.MaHS, classId, obj.NgayBatDau || todayStr(), '');
    }

    logSystem('updateHS', SHEETS.HOCSINH, obj.MaHS, 'Updated student ' + obj.HoTen, 'ok');
    return { ok: true, id: obj.MaHS };
  } catch (err) {
    return { ok: false, error: 'updateHS: ' + String(err) };
  }
}

function deleteHS(d) {
  try {
    var id = str(d.id || d.MaHS || d.maHS || d.studentId || d['Mã HS']);
    if (!id) return { ok: false, error: 'Missing student id' };

    var row = findStudentRow(id);
    if (row > 0) {
      getSheet(SHEETS.HOCSINH).deleteRow(row);
    }

    // Xóa các đăng ký lớp liên quan để app không còn thấy học sinh trong lớp.
    deleteRowsByAnyValue(SHEETS.DANGKYLOP, ['MaHS', 'maHS', 'studentId', 'Mã HS'], id);

    logSystem('deleteHS', SHEETS.HOCSINH, id, 'Deleted student', 'ok');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: 'deleteHS: ' + String(err) };
  }
}

function normalizeStudentInput(d) {
  var name = str(d.HoTen || d.name || d['Họ và tên học sinh']);
  var parentName = str(d.TenPhuHuynh || d.PhuHuynh || d.parentName || d['Họ và tên phụ huynh']);
  var parentPhone = str(d.SDTPhuHuynh || d.SDT || d.parentPhone || d['Số điện thoại phụ huynh (Zalo)']);
  var studentPhone = str(d.SDTHocSinh || d.studentPhone || d['Số điện thoại học sinh']);
  var status = normalizeGeneralStatus(d.TrangThai || d.status || d['Trạng thái']) || 'active';
  var startDate = formatDate(d.NgayBatDau || d.startDate || d['Ngày bắt đầu']) || todayStr();
  var endDate = formatDate(d.NgayKetThuc || d.endDate || d['Ngày kết thúc']);

  return {
    MaHS: str(d.MaHS || d.maHS || d.studentId || d.id || d['Mã HS']),
    HoTen: name,
    name: name,
    NgaySinh: formatDate(d.NgaySinh || d.dob || d['Ngày tháng năm sinh']),
    CoSo: str(d.CoSo || d.branch || d['Cơ sở học tập']),
    Khoi: normalizeGrade(d.Khoi || d.grade || d['Khối lớp hiện tại']),
    Truong: str(d.Truong || d.school || d['Trường đang học']),
    TenPhuHuynh: parentName,
    PhuHuynh: parentName,
    parentName: parentName,
    SDT: parentPhone,
    SDTPhuHuynh: parentPhone,
    parentPhone: parentPhone,
    SDTHocSinh: studentPhone,
    studentPhone: studentPhone,
    DiaChi: str(d.DiaChi || d.address || d['Địa chỉ thường trú']),
    HocLucToan: str(d.HocLucToan || d.academicLevel || d['Học lực môn Toán hiện tại']),
    MucTieu: str(d.MucTieu || d.goal || d['Mục tiêu điểm số học kỳ tới']),
    CanHoTro: str(d.CanHoTro || d.supportNeeded || d['Kiến thức em cần hỗ trợ thêm']),
    TrangThai: status,
    status: status,
    NgayBatDau: startDate,
    startDate: startDate,
    NgayKetThuc: endDate,
    endDate: endDate,
    LyDoNghi: str(d.LyDoNghi || d.reason || ''),
    FacebookURL: str(d.FacebookURL || d.facebookUrl || d['Facebook URL']),
    GhiChu: str(d.GhiChu || d.notes || d['Ghi chú'] || d['Ghi chu GV'])
  };
}

// ─────────────────────────────────────────────────────────────
// LopHoc actions
// ─────────────────────────────────────────────────────────────

function saveClass(d) {
  try {
    setupSheetsIfMissingOnly();
    var obj = normalizeClassInput(d);
    if (!obj.MaLop) return { ok: false, error: 'Missing MaLop' };
    obj.CreatedAt = obj.CreatedAt || nowStr();
    obj.UpdatedAt = nowStr();
    appendObject(SHEETS.LOPHOC, obj);

    logSystem('saveClass', SHEETS.LOPHOC, obj.MaLop, 'Created class ' + obj.TenLop, 'ok');
    return { ok: true, id: obj.MaLop };
  } catch (err) {
    return { ok: false, error: 'saveClass: ' + String(err) };
  }
}

function updateClass(d) {
  try {
    setupSheetsIfMissingOnly();
    var obj = normalizeClassInput(d);
    if (!obj.MaLop) return { ok: false, error: 'Missing MaLop' };

    var row = findClassRow(obj.MaLop);
    var existing = row > 0 ? getObjectAtRow(SHEETS.LOPHOC, row) : null;
    obj.CreatedAt = existing && existing.CreatedAt ? existing.CreatedAt : (obj.CreatedAt || nowStr());
    obj.UpdatedAt = nowStr();

    if (row > 0) updateRowObject(SHEETS.LOPHOC, row, obj);
    else appendObject(SHEETS.LOPHOC, obj);

    logSystem('updateClass', SHEETS.LOPHOC, obj.MaLop, 'Updated class ' + obj.TenLop, 'ok');
    return { ok: true, id: obj.MaLop };
  } catch (err) {
    return { ok: false, error: 'updateClass: ' + String(err) };
  }
}

function deleteClass(d) {
  try {
    var id = str(d.MaLop || d['Ma Lop'] || d['Mã Lớp'] || d.id);
    if (!id) return { ok: false, error: 'Missing class id' };

    var row = findClassRow(id);
    if (row > 0) getSheet(SHEETS.LOPHOC).deleteRow(row);

    logSystem('deleteClass', SHEETS.LOPHOC, id, 'Deleted class', 'ok');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: 'deleteClass: ' + String(err) };
  }
}

function normalizeClassInput(d) {
  var teacherNameOrId = str(d.MaGV || d.teacherId || d.GiaoVien || d.TenGV || d.teacherName || d['Giáo viên']);
  var maGV = teacherNameOrId;
  if (teacherNameOrId && !teacherNameOrId.match(/^GV/i)) {
    maGV = findTeacherIdByName(teacherNameOrId) || teacherNameOrId;
  }
  var teacherName = teacherNameOrId;
  if (maGV && maGV.match(/^GV/i)) {
    teacherName = findTeacherNameById(maGV) || teacherNameOrId;
  }

  return {
    MaLop: str(d.MaLop || d['Ma Lop'] || d['Mã Lớp']),
    TenLop: str(d.TenLop || d['Tên Lớp']),
    NamHoc: str(d.NamHoc || getConfig('schoolYear') || '2026-2027'),
    Khoi: normalizeGrade(d.Khoi || d['Khối']),
    CoSo: str(d.CoSo || d['Cơ sở']),
    MaGV: maGV,
    teacherId: maGV,
    GiaoVien: teacherName,
    TenGV: teacherName,
    teacherName: teacherName,
    TrangThai: normalizeGeneralStatus(d.TrangThai || d.status) || 'active',
    HocPhiMacDinh: num(d.HocPhiMacDinh || d.tuition || getConfig('baseTuition') || 0),
    Buoi1: str(d.Buoi1 || d['Buổi 1']),
    Buoi2: str(d.Buoi2 || d['Buổi 2']),
    Buoi3: str(d.Buoi3 || d['Buổi 3']),
    NgayBatDau: formatDate(d.NgayBatDau || d.startDate),
    NgayKetThuc: formatDate(d.NgayKetThuc || d.endDate),
    GhiChu: str(d.GhiChu || d.notes)
  };
}

// ─────────────────────────────────────────────────────────────
// HocPhi actions
// ─────────────────────────────────────────────────────────────

function savePayment(d) {
  try {
    setupSheetsIfMissingOnly();
    var obj = normalizePaymentInput(d);
    if (!obj.MaPhieuThu) obj.MaPhieuThu = makePaymentId(obj.MaHS, obj.ThangHP, obj.NamHP);
    obj.CreatedAt = obj.CreatedAt || nowStr();
    obj.UpdatedAt = nowStr();

    appendObject(SHEETS.HOCPHI, obj);
    logSystem('savePayment', SHEETS.HOCPHI, obj.MaPhieuThu, 'Created payment', 'ok');
    return { ok: true, id: obj.MaPhieuThu };
  } catch (err) {
    return { ok: false, error: 'savePayment: ' + String(err) };
  }
}

function updatePayment(d) {
  try {
    setupSheetsIfMissingOnly();
    var obj = normalizePaymentInput(d);
    if (!obj.MaPhieuThu) return savePayment(d);

    var row = findRowByValue(SHEETS.HOCPHI, 'MaPhieuThu', obj.MaPhieuThu);
    var existing = row > 0 ? getObjectAtRow(SHEETS.HOCPHI, row) : null;
    obj.CreatedAt = existing && existing.CreatedAt ? existing.CreatedAt : (obj.CreatedAt || nowStr());
    obj.UpdatedAt = nowStr();

    if (row > 0) updateRowObject(SHEETS.HOCPHI, row, obj);
    else appendObject(SHEETS.HOCPHI, obj);

    logSystem('updatePayment', SHEETS.HOCPHI, obj.MaPhieuThu, 'Updated payment', 'ok');
    return { ok: true, id: obj.MaPhieuThu };
  } catch (err) {
    return { ok: false, error: 'updatePayment: ' + String(err) };
  }
}

function deletePayment(d) {
  try {
    var id = str(d.id || d.MaPhieuThu || d.docNum || d.soCT);
    if (!id) return { ok: false, error: 'Missing payment id' };

    var row = findRowByValue(SHEETS.HOCPHI, 'MaPhieuThu', id);
    if (row > 0) getSheet(SHEETS.HOCPHI).deleteRow(row);

    logSystem('deletePayment', SHEETS.HOCPHI, id, 'Deleted payment', 'ok');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: 'deletePayment: ' + String(err) };
  }
}

function normalizePaymentInput(d) {
  var maHS = str(d.MaHS || d.maHS || d.studentId || d['Mã HS']);
  var thang = num(d.ThangHP || d.Thang || d.thangHP || d.month);
  var nam = num(d.NamHP || d.Nam || d.namHP || d.year);
  var date = formatDate(d.NgayThu || d.date || d.timeStamp) || todayStr();
  var classId = str(d.MaLop || d.classId || d['Mã Lớp']) || getActiveClassId(maHS, date);
  var status = str(d.TrangThai || d.DaDong || d.status || 'paid');

  return {
    MaPhieuThu: str(d.MaPhieuThu || d.soCT || d.docNum || d.id),
    NgayThu: date,
    MaHS: maHS,
    MaLop: classId,
    ThangHP: thang,
    Thang: thang,
    NamHP: nam,
    Nam: nam,
    SoTien: num(d.SoTien || d.soTien || d.amount),
    HinhThuc: normalizePaymentMethod(d.HinhThuc || d.method),
    NguoiNop: str(d.NguoiNop || d.nguoiNop || d.payer),
    NguoiThu: str(d.NguoiThu || d.collector || ''),
    TrangThai: status,
    DaDong: status,
    GhiChu: str(d.GhiChu || d.note || d.notes)
  };
}

// ─────────────────────────────────────────────────────────────
// ChiPhi actions
// ─────────────────────────────────────────────────────────────

function saveExpense(d) {
  try {
    setupSheetsIfMissingOnly();
    var obj = normalizeExpenseInput(d);
    if (!obj.MaPhieuChi) obj.MaPhieuChi = makeExpenseId();
    obj.CreatedAt = obj.CreatedAt || nowStr();
    obj.UpdatedAt = nowStr();

    appendObject(SHEETS.CHIPHI, obj);
    logSystem('saveExpense', SHEETS.CHIPHI, obj.MaPhieuChi, 'Created expense', 'ok');
    return { ok: true, id: obj.MaPhieuChi };
  } catch (err) {
    return { ok: false, error: 'saveExpense: ' + String(err) };
  }
}

function updateExpense(d) {
  try {
    setupSheetsIfMissingOnly();
    var obj = normalizeExpenseInput(d);
    if (!obj.MaPhieuChi) return saveExpense(d);

    var row = findRowByValue(SHEETS.CHIPHI, 'MaPhieuChi', obj.MaPhieuChi);
    var existing = row > 0 ? getObjectAtRow(SHEETS.CHIPHI, row) : null;
    obj.CreatedAt = existing && existing.CreatedAt ? existing.CreatedAt : (obj.CreatedAt || nowStr());
    obj.UpdatedAt = nowStr();

    if (row > 0) updateRowObject(SHEETS.CHIPHI, row, obj);
    else appendObject(SHEETS.CHIPHI, obj);

    logSystem('updateExpense', SHEETS.CHIPHI, obj.MaPhieuChi, 'Updated expense', 'ok');
    return { ok: true, id: obj.MaPhieuChi };
  } catch (err) {
    return { ok: false, error: 'updateExpense: ' + String(err) };
  }
}

function deleteExpense(d) {
  try {
    var id = str(d.id || d.MaPhieuChi || d.docNum || d.soCT);
    if (!id) return { ok: false, error: 'Missing expense id' };

    var row = findRowByValue(SHEETS.CHIPHI, 'MaPhieuChi', id);
    if (row > 0) getSheet(SHEETS.CHIPHI).deleteRow(row);

    logSystem('deleteExpense', SHEETS.CHIPHI, id, 'Deleted expense', 'ok');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: 'deleteExpense: ' + String(err) };
  }
}

function normalizeExpenseInput(d) {
  return {
    MaPhieuChi: str(d.MaPhieuChi || d.soCT || d.docNum || d.id),
    NgayChi: formatDate(d.NgayChi || d.date) || todayStr(),
    NguoiChi: str(d.NguoiChi || d.spender),
    HangMuc: str(d.HangMuc || d.category),
    SoTien: num(d.SoTien || d.amount),
    NoiDung: str(d.NoiDung || d.description),
    MaLop: str(d.MaLop || d.classId || ''),
    MaGV: str(d.MaGV || d.teacherId || ''),
    TrangThai: str(d.TrangThai || d.status || 'active'),
    GhiChu: str(d.GhiChu || d.note || '')
  };
}

// ─────────────────────────────────────────────────────────────
// BuoiHoc + DiemDanh actions
// ─────────────────────────────────────────────────────────────

function saveDiary(d) {
  try {
    setupSheetsIfMissingOnly();

    var lesson = normalizeLessonInput(d, false);
    if (!lesson.MaBuoi) lesson.MaBuoi = makeLessonId(lesson.Ngay, lesson.MaLop, lesson.CaDay);

    lesson.CreatedAt = lesson.CreatedAt || nowStr();
    lesson.UpdatedAt = nowStr();

    var existingRow = findRowByValue(SHEETS.BUOIHOC, 'MaBuoi', lesson.MaBuoi);
    if (existingRow > 0) updateRowObject(SHEETS.BUOIHOC, existingRow, lesson);
    else appendObject(SHEETS.BUOIHOC, lesson);

    replaceAttendanceForLesson(lesson.MaBuoi, d.attendanceList || d.attendance || []);

    logSystem('saveDiary', SHEETS.BUOIHOC, lesson.MaBuoi, 'Saved diary/lesson', 'ok');
    return { ok: true, id: lesson.MaBuoi, maBuoi: lesson.MaBuoi };
  } catch (err) {
    return { ok: false, error: 'saveDiary: ' + String(err) };
  }
}

function updateDiary(d) {
  try {
    setupSheetsIfMissingOnly();

    var oldMaBuoi = str(d.MaBuoi || d.maBuoi || d.id);
    if (!oldMaBuoi) {
      var oldDate = formatDate(d.originalDate || d.date);
      var oldClass = str(d.originalClassId || d.classId);
      var oldCa = str(d.originalCaDay || d.caDay);
      oldMaBuoi = makeLessonId(oldDate, oldClass, oldCa);
    }

    var lesson = normalizeLessonInput(d, true);
    if (!lesson.MaBuoi) lesson.MaBuoi = oldMaBuoi || makeLessonId(lesson.Ngay, lesson.MaLop, lesson.CaDay);

    var row = findRowByValue(SHEETS.BUOIHOC, 'MaBuoi', oldMaBuoi);
    var existing = row > 0 ? getObjectAtRow(SHEETS.BUOIHOC, row) : null;
    lesson.CreatedAt = existing && existing.CreatedAt ? existing.CreatedAt : (lesson.CreatedAt || nowStr());
    lesson.UpdatedAt = nowStr();

    if (row > 0) {
      updateRowObject(SHEETS.BUOIHOC, row, lesson);
      if (oldMaBuoi !== lesson.MaBuoi) {
        replaceAttendanceLessonId(oldMaBuoi, lesson.MaBuoi);
      }
    } else {
      appendObject(SHEETS.BUOIHOC, lesson);
    }

    replaceAttendanceForLesson(lesson.MaBuoi, d.attendanceList || d.attendance || []);

    logSystem('updateDiary', SHEETS.BUOIHOC, lesson.MaBuoi, 'Updated diary/lesson', 'ok');
    return { ok: true, id: lesson.MaBuoi, maBuoi: lesson.MaBuoi };
  } catch (err) {
    return { ok: false, error: 'updateDiary: ' + String(err) };
  }
}

function deleteDiary(d) {
  try {
    setupSheetsIfMissingOnly();

    var maBuoi = str(d.MaBuoi || d.maBuoi || d.id);
    if (!maBuoi) {
      maBuoi = makeLessonId(formatDate(d.date), str(d.classId), str(d.caDay));
    }

    var row = findRowByValue(SHEETS.BUOIHOC, 'MaBuoi', maBuoi);
    if (row > 0) getSheet(SHEETS.BUOIHOC).deleteRow(row);

    deleteRowsByValue(SHEETS.DIEMDANH, 'MaBuoi', maBuoi);

    logSystem('deleteDiary', SHEETS.BUOIHOC, maBuoi, 'Deleted lesson and attendance', 'ok');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: 'deleteDiary: ' + String(err) };
  }
}

function normalizeLessonInput(d, isUpdate) {
  var date = formatDate(d.Ngay || d.date || d.rawDate) || todayStr();
  var classId = str(d.MaLop || d.classId || d['Mã Lớp']);
  var caDay = normalizeCaDay(d.CaDay || d.caDay);
  var teacherNameOrId = str(d.MaGV || d.teacherId || d.GiaoVien || d.teacherName || d['Giáo viên']);
  var maGV = teacherNameOrId;

  if (!maGV && classId) {
    var classRow = findClassRow(classId);
    var cls = classRow > 0 ? getObjectAtRow(SHEETS.LOPHOC, classRow) : null;
    if (cls) maGV = classTeacherIdOf(cls, buildTeacherNameToId(getRows(SHEETS.GIAOVIEN)));
  }

  if (maGV && !maGV.match(/^GV/i)) {
    maGV = findTeacherIdByName(maGV) || maGV;
  }
  var teacherName = maGV && maGV.match(/^GV/i) ? findTeacherNameById(maGV) : teacherNameOrId;

  return {
    MaBuoi: str(d.MaBuoi || d.maBuoi || d.id),
    Ngay: date,
    MaLop: classId,
    CaDay: caDay,
    MaGV: maGV,
    GiaoVien: teacherName,
    teacherName: teacherName,
    TrangThai: str(d.TrangThai || d.status || 'completed'),
    NoiDung: str(d.NoiDung || d.content) || '---',
    BaiTapVeNha: str(d.BaiTapVeNha || d.homework) || '---',
    GhiChuGV: str(d.GhiChuGV || d.teacherNote)
  };
}

function replaceAttendanceForLesson(maBuoi, attendanceList) {
  deleteRowsByValue(SHEETS.DIEMDANH, 'MaBuoi', maBuoi);

  if (!attendanceList || attendanceList.length === 0) return;

  var rows = [];
  for (var i = 0; i < attendanceList.length; i++) {
    var a = attendanceList[i];
    var maHS = studentIdOf(a);
    if (!maHS) continue;

    var statusCode = normalizeAttendanceStatus(a.TrangThai || a.trangThai || a['Trạng thái']);
    var obj = {
      MaDiemDanh: makeAttendanceId(maBuoi, maHS),
      MaBuoi: maBuoi,
      MaHS: maHS,
      TrangThai: statusCode || 'present',
      GhiChu: str(a.GhiChu || a.ghiChu || a['Ghi chú']),
      UpdatedAt: nowStr()
    };
    rows.push(obj);
  }

  appendObjects(SHEETS.DIEMDANH, rows);
}

function replaceAttendanceLessonId(oldMaBuoi, newMaBuoi) {
  var sheet = getSheet(SHEETS.DIEMDANH);
  var headers = getHeaders(SHEETS.DIEMDANH);
  var idxMaBuoi = headers.indexOf('MaBuoi') + 1;
  var idxMaDD = headers.indexOf('MaDiemDanh') + 1;
  if (idxMaBuoi < 1) return;

  var last = sheet.getLastRow();
  for (var r = DATA_START; r <= last; r++) {
    var val = str(sheet.getRange(r, idxMaBuoi).getValue());
    if (val === oldMaBuoi) {
      sheet.getRange(r, idxMaBuoi).setValue(newMaBuoi);
      if (idxMaDD > 0) {
        var rowObj = getObjectAtRow(SHEETS.DIEMDANH, r);
        sheet.getRange(r, idxMaDD).setValue(makeAttendanceId(newMaBuoi, str(rowObj.MaHS)));
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────
// GiaoVien actions
// ─────────────────────────────────────────────────────────────

function saveTeacher(d) {
  try {
    setupSheetsIfMissingOnly();
    var obj = normalizeTeacherInput(d);
    if (!obj.MaGV) obj.MaGV = makeSequentialId(SHEETS.GIAOVIEN, 'MaGV', 'GV', 4);
    obj.CreatedAt = obj.CreatedAt || nowStr();
    obj.UpdatedAt = nowStr();

    appendObject(SHEETS.GIAOVIEN, obj);
    logSystem('saveTeacher', SHEETS.GIAOVIEN, obj.MaGV, 'Created teacher ' + obj.HoTen, 'ok');
    return { ok: true, id: obj.MaGV };
  } catch (err) {
    return { ok: false, error: 'saveTeacher: ' + String(err) };
  }
}

function updateTeacher(d) {
  try {
    setupSheetsIfMissingOnly();
    var obj = normalizeTeacherInput(d);
    if (!obj.MaGV) return saveTeacher(d);

    var row = findTeacherRow(obj.MaGV, obj.HoTen);
    var existing = row > 0 ? getObjectAtRow(SHEETS.GIAOVIEN, row) : null;
    obj.CreatedAt = existing && existing.CreatedAt ? existing.CreatedAt : (obj.CreatedAt || nowStr());
    obj.UpdatedAt = nowStr();

    if (row > 0) updateRowObject(SHEETS.GIAOVIEN, row, obj);
    else appendObject(SHEETS.GIAOVIEN, obj);

    logSystem('updateTeacher', SHEETS.GIAOVIEN, obj.MaGV, 'Updated teacher ' + obj.HoTen, 'ok');
    return { ok: true, id: obj.MaGV };
  } catch (err) {
    return { ok: false, error: 'updateTeacher: ' + String(err) };
  }
}

function deleteTeacher(d) {
  try {
    var id = str(d.id || d.MaGV || d.teacherId || d.TenGV || d.GiaoVien || d.name || d.teacherName);
    if (id && !id.match(/^GV/i)) id = findTeacherIdByName(id) || id;
    if (!id) return { ok: false, error: 'Missing teacher id' };

    var row = findTeacherRow(id, str(d.TenGV || d.GiaoVien || d.name || d.teacherName));
    if (row > 0) getSheet(SHEETS.GIAOVIEN).deleteRow(row);

    logSystem('deleteTeacher', SHEETS.GIAOVIEN, id, 'Deleted teacher', 'ok');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: 'deleteTeacher: ' + String(err) };
  }
}

function normalizeTeacherInput(d) {
  var name = str(d.HoTen || d.TenGV || d.GiaoVien || d.name || d.teacherName);
  var phone = str(d.SDT || d.SDTGV || d.SoDienThoai || d.phone);
  var email = str(d.Email || d.email);
  var status = normalizeGeneralStatus(d.TrangThai || d.status) || 'active';
  var specialization = str(d.ChuyenMon || d.specialization || d.subject || 'Toán');
  var hourlyRate = num(d.DonGiaMoiBuoi || d.DonGia || d.hourlyRate);
  var baseSalary = num(d.LuongCoBan || d.baseSalary || d.salary);
  var allowance = num(d.PhuCap || d.allowance);
  var notes = str(d.GhiChu || d.notes || d.Note);

  return {
    MaGV: str(d.MaGV || d.id || d.teacherId),
    HoTen: name,
    TenGV: name,
    GiaoVien: name,
    name: name,
    teacherName: name,
    SDT: phone,
    SDTGV: phone,
    SoDienThoai: phone,
    phone: phone,
    Email: email,
    email: email,
    TrangThai: status,
    status: status,
    ChuyenMon: specialization,
    specialization: specialization,
    subject: specialization,
    DonGiaMoiBuoi: hourlyRate,
    DonGia: hourlyRate,
    hourlyRate: hourlyRate,
    LuongCoBan: baseSalary,
    baseSalary: baseSalary,
    salary: baseSalary,
    PhuCap: allowance,
    allowance: allowance,
    GhiChu: notes,
    notes: notes
  };
}

// ─────────────────────────────────────────────────────────────
// NghiHoc actions
// ─────────────────────────────────────────────────────────────

function findTeacherRow(id, name) {
  id = str(id);
  name = normalizeName(name);

  var headers = getHeaders(SHEETS.GIAOVIEN);
  var idHeaders = ['MaGV', 'id', 'teacherId'];
  for (var i = 0; i < idHeaders.length; i++) {
    if (headers.indexOf(idHeaders[i]) >= 0) {
      var row = findRowByValue(SHEETS.GIAOVIEN, idHeaders[i], id);
      if (row > 0) return row;
    }
  }

  if (!name) return -1;
  var rows = getRows(SHEETS.GIAOVIEN);
  for (var j = 0; j < rows.length; j++) {
    if (normalizeName(teacherNameOf(rows[j])) === name) return DATA_START + j;
  }

  return -1;
}

function findClassRow(id) {
  id = str(id);
  if (!id) return -1;

  var headers = getHeaders(SHEETS.LOPHOC);
  var idHeaders = ['MaLop', 'Ma Lop', 'Mã Lớp', 'classId', 'id'];
  for (var i = 0; i < idHeaders.length; i++) {
    if (headers.indexOf(idHeaders[i]) >= 0) {
      var row = findRowByValue(SHEETS.LOPHOC, idHeaders[i], id);
      if (row > 0) return row;
    }
  }

  return -1;
}

function findStudentRow(id) {
  id = str(id);
  if (!id) return -1;

  var headers = getHeaders(SHEETS.HOCSINH);
  var idHeaders = ['MaHS', 'id', 'studentId', 'Mã HS'];
  for (var i = 0; i < idHeaders.length; i++) {
    if (headers.indexOf(idHeaders[i]) >= 0) {
      var row = findRowByValue(SHEETS.HOCSINH, idHeaders[i], id);
      if (row > 0) return row;
    }
  }

  return -1;
}

function saveLeave(d) {
  try {
    setupSheetsIfMissingOnly();
    var obj = normalizeLeaveInput(d);
    if (!obj.MaNghi) obj.MaNghi = makeLeaveId(obj.Ngay, obj.MaHS);
    obj.CreatedAt = obj.CreatedAt || nowStr();
    obj.UpdatedAt = nowStr();

    appendObject(SHEETS.NGHIHOC, obj);
    logSystem('saveLeave', SHEETS.NGHIHOC, obj.MaNghi, 'Created leave request', 'ok');
    return { ok: true, id: obj.MaNghi };
  } catch (err) {
    return { ok: false, error: 'saveLeave: ' + String(err) };
  }
}

function updateLeave(d) {
  try {
    setupSheetsIfMissingOnly();
    var obj = normalizeLeaveInput(d);
    if (!obj.MaNghi) return saveLeave(d);

    var row = findRowByValue(SHEETS.NGHIHOC, 'MaNghi', obj.MaNghi);
    var existing = row > 0 ? getObjectAtRow(SHEETS.NGHIHOC, row) : null;
    obj.CreatedAt = existing && existing.CreatedAt ? existing.CreatedAt : (obj.CreatedAt || nowStr());
    obj.UpdatedAt = nowStr();

    if (row > 0) updateRowObject(SHEETS.NGHIHOC, row, obj);
    else appendObject(SHEETS.NGHIHOC, obj);

    logSystem('updateLeave', SHEETS.NGHIHOC, obj.MaNghi, 'Updated leave request', 'ok');
    return { ok: true, id: obj.MaNghi };
  } catch (err) {
    return { ok: false, error: 'updateLeave: ' + String(err) };
  }
}

function deleteLeave(d) {
  try {
    var id = str(d.id || d.MaNghi);
    if (!id) return { ok: false, error: 'Missing leave id' };

    var row = findRowByValue(SHEETS.NGHIHOC, 'MaNghi', id);
    if (row > 0) getSheet(SHEETS.NGHIHOC).deleteRow(row);

    logSystem('deleteLeave', SHEETS.NGHIHOC, id, 'Deleted leave request', 'ok');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: 'deleteLeave: ' + String(err) };
  }
}

function normalizeLeaveInput(d) {
  return {
    MaNghi: str(d.MaNghi || d.id),
    Ngay: formatDate(d.Ngay || d.date) || todayStr(),
    MaHS: str(d.MaHS || d.studentId),
    MaBuoi: str(d.MaBuoi || d.maBuoi || d.lessonId),
    LyDo: str(d.LyDo || d.reason),
    TrangThai: str(d.TrangThai || d.status || 'pending'),
    NguoiBao: str(d.NguoiBao || d.reportedBy),
    GhiChu: str(d.GhiChu || d.note || d.notes)
  };
}

function readLeaveRequestsAdapter(rows, studentsRaw, lessonsRaw) {
  rows = rows || [];
  var studentMap = buildMap(studentsRaw || [], 'MaHS');
  var lessonMap = buildMap(lessonsRaw || [], 'MaBuoi');

  return rows.filter(function(r) { return str(r.MaNghi); }).map(function(r) {
    var st = studentMap[str(r.MaHS)] || {};
    var lesson = lessonMap[str(r.MaBuoi)] || {};
    return {
      id: str(r.MaNghi),
      studentId: str(r.MaHS),
      studentName: str(st.HoTen) || str(r.MaHS),
      classId: str(lesson.MaLop),
      date: formatDate(r.Ngay),
      reason: str(r.LyDo),
      status: str(r.TrangThai) || 'pending',
      createdAt: str(r.CreatedAt),
      approvedBy: '',
      approvedAt: ''
    };
  });
}

// ─────────────────────────────────────────────────────────────
// Enrollment helpers
// ─────────────────────────────────────────────────────────────

function ensureActiveEnrollment(maHS, maLop, ngayVao, note) {
  maHS = str(maHS);
  maLop = str(maLop);
  if (!maHS || !maLop) return;

  var regs = getRows(SHEETS.DANGKYLOP);
  var changed = false;

  for (var i = 0; i < regs.length; i++) {
    var r = regs[i];
    if (registrationStudentIdOf(r) === maHS && normalizeGeneralStatus(r.TrangThai || r.status) === 'active') {
      if (registrationClassIdOf(r) === maLop) {
        return;
      }
      var row = DATA_START + i;
      r.NgayRa = formatDate(r.NgayRa) || todayStr();
      r.endDate = r.NgayRa;
      r.TrangThai = 'transferred';
      r.status = 'transferred';
      r.UpdatedAt = nowStr();
      updateRowObject(SHEETS.DANGKYLOP, row, r);
      changed = true;
    }
  }

  var obj = {
    MaDangKy: makeSequentialId(SHEETS.DANGKYLOP, 'MaDangKy', 'DK', 4),
    MaHS: maHS,
    MaLop: maLop,
    NgayVao: formatDate(ngayVao) || todayStr(),
    NgayRa: '',
    TrangThai: 'active',
    GhiChu: note || '',
    CreatedAt: nowStr(),
    UpdatedAt: nowStr()
  };
  appendObject(SHEETS.DANGKYLOP, obj);
}

function buildActiveRegistrationMap(regs) {
  var map = {};
  regs.forEach(function(r) {
    var maHS = registrationStudentIdOf(r);
    if (!maHS) return;
    var status = normalizeGeneralStatus(r.TrangThai || r.status);
    var hasNoEnd = !str(r.NgayRa || r.endDate);
    if (status === 'active' && hasNoEnd) {
      map[maHS] = r;
    }
  });

  // fallback: nếu có active nhưng có NgayRa trống không chuẩn, vẫn lấy dòng active mới nhất
  regs.forEach(function(r) {
    var maHS = registrationStudentIdOf(r);
    if (!maHS || map[maHS]) return;
    var status = normalizeGeneralStatus(r.TrangThai || r.status);
    if (status === 'active' || status === 'trial') {
      map[maHS] = r;
    }
  });

  return map;
}

function getActiveClassId(maHS, refDate) {
  var regs = getRows(SHEETS.DANGKYLOP);
  var best = '';
  maHS = str(maHS);
  refDate = formatDate(refDate) || todayStr();

  for (var i = 0; i < regs.length; i++) {
    var r = regs[i];
    if (registrationStudentIdOf(r) !== maHS) continue;
    var status = normalizeGeneralStatus(r.TrangThai || r.status);
    if (status !== 'active' && status !== 'trial') continue;
    if (isDateInRange(refDate, r.NgayVao || r.startDate, r.NgayRa || r.endDate)) {
      best = registrationClassIdOf(r);
    }
  }

  if (!best) {
    var active = buildActiveRegistrationMap(regs)[maHS];
    if (active) best = registrationClassIdOf(active);
  }

  return best;
}

// ─────────────────────────────────────────────────────────────
// Generic sheet helpers
// ─────────────────────────────────────────────────────────────

function ss() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function sh(name) {
  return ss().getSheetByName(name);
}

function getSheet(name) {
  var sheet = sh(name);
  if (!sheet) {
    ensureSheet(name, HEADERS[name] || []);
    sheet = sh(name);
  }
  return sheet;
}

function jsonOut(obj) {
  var out = ContentService.createTextOutput(JSON.stringify(obj));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}

function setupSheetsIfMissingOnly() {
  var names = Object.keys(SHEETS).map(function(k) { return SHEETS[k]; });
  var created = false;
  names.forEach(function(name) {
    if (!sh(name)) {
      ensureSheet(name, HEADERS[name]);
      created = true;
    }
  });
  if (created) applyTextFormats();
}

function createSnapshotReader() {
  var rowsBySheet = {};
  return function(sheetName) {
    if (!Object.prototype.hasOwnProperty.call(rowsBySheet, sheetName)) {
      rowsBySheet[sheetName] = getRows(sheetName);
    }
    return rowsBySheet[sheetName];
  };
}

function getHeaders(sheetName) {
  var sheet = getSheet(sheetName);
  var defaults = HEADERS[sheetName] || [];
  var lastCol = Math.max(sheet.getLastColumn(), defaults.length);
  if (lastCol < 1) return [];

  var existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(v) { return str(v); });
  while (existing.length && !str(existing[existing.length - 1])) existing.pop();

  if (existing.length === 0) {
    if (defaults.length) sheet.getRange(1, 1, 1, defaults.length).setValues([defaults]);
    return defaults;
  }

  var headers = existing.slice();
  var changed = false;
  defaults.forEach(function(h) {
    if (headers.indexOf(h) < 0) {
      headers.push(h);
      changed = true;
    }
  });

  if (changed) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return headers;
}

function getRows(sheetName) {
  var sheet = getSheet(sheetName);
  var headers = getHeaders(sheetName);
  var last = sheet.getLastRow();
  if (last < DATA_START) return [];

  var range = sheet.getRange(DATA_START, 1, last - DATA_START + 1, headers.length);
  var values = range.getValues();
  var displays = range.getDisplayValues();
  var out = [];

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var displayRow = displays[i];
    var obj = {};
    var allBlank = true;
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = isTextDataColumn(sheetName, headers[j]) ? displayRow[j] : row[j];
      if (str(displayRow[j]) !== '') allBlank = false;
    }
    if (!allBlank) out.push(obj);
  }
  return out;
}

function getObjectAtRow(sheetName, row) {
  var sheet = getSheet(sheetName);
  var headers = getHeaders(sheetName);
  var range = sheet.getRange(row, 1, 1, headers.length);
  var values = range.getValues()[0];
  var displays = range.getDisplayValues()[0];
  var obj = {};
  headers.forEach(function(h, i) {
    obj[h] = isTextDataColumn(sheetName, h) ? displays[i] : values[i];
  });
  return obj;
}

function isTextDataColumn(sheetName, headerName) {
  if (sheetName === SHEETS.HOCSINH) {
    return headerName === 'MaHS' || headerName === 'id' ||
      headerName === 'SDT' || headerName === 'SoDienThoai' || headerName === 'phone' ||
      headerName === 'SDTPhuHuynh' || headerName === 'SDTHocSinh' ||
      headerName === 'parentPhone' || headerName === 'studentPhone';
  }
  if (sheetName === SHEETS.GIAOVIEN) {
    return headerName === 'MaGV' || headerName === 'id' || headerName === 'teacherId' ||
      headerName === 'SDT' || headerName === 'SDTGV' || headerName === 'SoDienThoai' ||
      headerName === 'phone';
  }
  return false;
}

function appendObject(sheetName, obj) {
  var sheet = getSheet(sheetName);
  var headers = getHeaders(sheetName);
  var row = headers.map(function(h) {
    return obj[h] == null ? '' : obj[h];
  });
  sheet.appendRow(row);
}

function appendObjects(sheetName, objs) {
  if (!objs || objs.length === 0) return;
  var sheet = getSheet(sheetName);
  var headers = getHeaders(sheetName);
  var rows = objs.map(function(obj) {
    return headers.map(function(h) {
      return obj[h] == null ? '' : obj[h];
    });
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
}

function updateRowObject(sheetName, row, obj) {
  var sheet = getSheet(sheetName);
  var headers = getHeaders(sheetName);
  var existing = row >= DATA_START ? getObjectAtRow(sheetName, row) : {};
  var values = headers.map(function(h) {
    return Object.prototype.hasOwnProperty.call(obj, h)
      ? (obj[h] == null ? '' : obj[h])
      : (existing[h] == null ? '' : existing[h]);
  });
  sheet.getRange(row, 1, 1, headers.length).setValues([values]);
}

function findRowByValue(sheetName, headerName, value) {
  value = str(value);
  if (!value) return -1;

  var sheet = getSheet(sheetName);
  var headers = getHeaders(sheetName);
  var col = headers.indexOf(headerName) + 1;
  if (col < 1) return -1;

  var last = sheet.getLastRow();
  if (last < DATA_START) return -1;

  var vals = sheet.getRange(DATA_START, col, last - DATA_START + 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (str(vals[i][0]) === value) return DATA_START + i;
  }
  return -1;
}

function findObjectByValue(sheetName, headerName, value) {
  var row = findRowByValue(sheetName, headerName, value);
  if (row > 0) return getObjectAtRow(sheetName, row);
  return null;
}

function deleteRowsByValue(sheetName, headerName, value) {
  value = str(value);
  if (!value) return;

  var sheet = getSheet(sheetName);
  var headers = getHeaders(sheetName);
  var col = headers.indexOf(headerName) + 1;
  if (col < 1) return;

  for (var r = sheet.getLastRow(); r >= DATA_START; r--) {
    if (str(sheet.getRange(r, col).getValue()) === value) {
      sheet.deleteRow(r);
    }
  }
}

function deleteRowsByAnyValue(sheetName, headerNames, value) {
  value = str(value);
  if (!value) return;

  var sheet = getSheet(sheetName);
  var headers = getHeaders(sheetName);
  var cols = [];
  headerNames.forEach(function(headerName) {
    var col = headers.indexOf(headerName) + 1;
    if (col > 0) cols.push(col);
  });
  if (cols.length === 0) return;

  for (var r = sheet.getLastRow(); r >= DATA_START; r--) {
    for (var i = 0; i < cols.length; i++) {
      if (str(sheet.getRange(r, cols[i]).getValue()) === value) {
        sheet.deleteRow(r);
        break;
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Utility functions
// ─────────────────────────────────────────────────────────────

function str(v) {
  if (v == null) return '';
  return String(v).trim();
}

function num(v) {
  if (v == null || v === '') return 0;
  var n = Number(String(v).replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
}

function nowStr() {
  return Utilities.formatDate(new Date(), TZ, 'HH:mm:ss - dd/MM/yyyy');
}

function todayStr() {
  return Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy');
}

function formatDate(val) {
  if (!val) return '';

  if (Object.prototype.toString.call(val) === '[object Date]') {
    if (!isNaN(val.getTime())) {
      return Utilities.formatDate(val, TZ, 'dd/MM/yyyy');
    }
  }

  var s = str(val);
  if (!s) return '';

  // HH:mm - DD/MM/YYYY
  var hm = s.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
  if (hm) return normalizeDMY(hm[2]);

  // DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) return normalizeDMY(s);

  // YYYY-MM-DD or ISO
  var iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    return pad2(iso[3]) + '/' + pad2(iso[2]) + '/' + iso[1];
  }

  // Date string fallback
  var d = new Date(s);
  if (!isNaN(d.getTime())) {
    return Utilities.formatDate(d, TZ, 'dd/MM/yyyy');
  }

  return s;
}

function normalizeDMY(s) {
  var p = str(s).split('/');
  if (p.length !== 3) return s;
  return pad2(p[0]) + '/' + pad2(p[1]) + '/' + p[2];
}

function parseDMY(s) {
  s = formatDate(s);
  if (!s) return 0;
  var p = s.split('/');
  if (p.length !== 3) return 0;
  var d = Number(p[0]);
  var m = Number(p[1]);
  var y = Number(p[2]);
  if (!d || !m || !y) return 0;
  return new Date(y, m - 1, d).getTime();
}

function ymdFromDMY(s) {
  s = formatDate(s);
  var p = s.split('/');
  if (p.length !== 3) return Utilities.formatDate(new Date(), TZ, 'yyyyMMdd');
  return p[2] + pad2(p[1]) + pad2(p[0]);
}

function pad2(v) {
  return String(v).padStart(2, '0');
}

function safeIdPart(v) {
  return str(v)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .replace(/_+/g, '_')
    .toUpperCase();
}

function makeLessonId(date, classId, caDay) {
  return 'BH-' + ymdFromDMY(date) + '-' + safeIdPart(classId) + '-' + safeIdPart(caDay);
}

function makeAttendanceId(maBuoi, maHS) {
  return 'DD-' + safeIdPart(maBuoi) + '-' + safeIdPart(maHS);
}

function makePaymentId(maHS, thang, nam) {
  return 'PT-' + Utilities.formatDate(new Date(), TZ, 'yyyyMMdd-HHmmss') + '-' + safeIdPart(maHS) + '-T' + thang + '-' + nam;
}

function makeExpenseId() {
  return 'PC-' + Utilities.formatDate(new Date(), TZ, 'yyyyMMdd-HHmmss');
}

function makeLeaveId(date, maHS) {
  return 'NG-' + ymdFromDMY(date) + '-' + safeIdPart(maHS);
}

function makeLogId() {
  return 'LOG-' + Utilities.formatDate(new Date(), TZ, 'yyyyMMdd-HHmmss-SSS');
}

function makeSequentialId(sheetName, headerName, prefix, width) {
  var rows = getRows(sheetName);
  var max = 0;
  rows.forEach(function(r) {
    var id = str(r[headerName]);
    var m = id.match(new RegExp('^' + prefix + '(\\d+)$', 'i'));
    if (m) max = Math.max(max, Number(m[1]));
  });
  var n = max + 1;
  return prefix + String(n).padStart(width, '0');
}

function normalizeGrade(v) {
  var s = str(v);
  if (!s) return '';
  var m = s.match(/\d+/);
  return m ? m[0] : s;
}

function normalizeGeneralStatus(v) {
  var s = str(v);
  if (!s) return '';
  var n = removeVietnamese(s).toLowerCase();
  if (n === 'dang hoc' || n === 'dang day' || n === 'active') return 'active';
  if (n === 'da nghi' || n === 'ngung hoat dong' || n === 'inactive') return 'inactive';
  if (n === 'tam nghi' || n === 'nghi phep' || n === 'onleave') return 'onleave';
  if (n === 'hoc thu' || n === 'trial') return 'trial';
  return s;
}

function normalizeAttendanceStatus(v) {
  var s = str(v);
  if (!s) return 'present';
  if (STATUS_VI_TO_CODE[s]) return STATUS_VI_TO_CODE[s];

  var n = removeVietnamese(s).toLowerCase();
  if (n === 'co mat' || n === 'comat' || n === 'present') return 'present';
  if (n === 'vang' || n === 'absent') return 'absent';
  if (n === 'muon' || n === 'late') return 'present';
  if (n === 'co phep' || n === 'nghi co phep' || n === 'excused') return 'excused';
  return s;
}

function statusCodeToVi(code) {
  code = normalizeAttendanceStatus(code);
  return STATUS_CODE_TO_VI[code] || code || 'Có mặt';
}

function removeVietnamese(s) {
  return str(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeCaDay(v) {
  var s = str(v);
  if (!s) return '';
  s = s.replace(':00', 'h').replace(':30', 'h30');
  s = s.replace(/^(\d{1,2})h00$/, '$1h');
  return s;
}

function normalizePaymentMethod(v) {
  var s = str(v);
  var n = removeVietnamese(s).toLowerCase();
  if (!s) return '';
  if (n.indexOf('chuyen') >= 0 || n === 'bank') return 'bank';
  if (n.indexOf('tien mat') >= 0 || n === 'cash') return 'cash';
  if (n.indexOf('momo') >= 0) return 'momo';
  return s;
}

function isDateInRange(date, start, end) {
  var t = parseDMY(date);
  var st = parseDMY(start);
  var en = parseDMY(end);
  if (st && t < st) return false;
  if (en && t > en) return false;
  return true;
}

// ─────────────────────────────────────────────────────────────
// Maps and joins
// ─────────────────────────────────────────────────────────────

function buildMap(rows, key) {
  var map = {};
  rows.forEach(function(r) {
    var k = str(r[key]);
    if (k) map[k] = r;
  });
  return map;
}

function studentIdOf(s) {
  return str(s.MaHS || s.maHS || s.studentId || s.id || s['Mã HS']);
}

function buildStudentMap(rows) {
  var map = {};
  rows.forEach(function(s) {
    var id = studentIdOf(s);
    if (id) map[id] = s;
  });
  return map;
}

function classIdOf(c) {
  return str(c.MaLop || c['Ma Lop'] || c['Mã Lớp'] || c.classId || c.id);
}

function registrationStudentIdOf(r) {
  return str(r.MaHS || r.maHS || r.studentId || r.id || r['Mã HS']);
}

function registrationClassIdOf(r) {
  return str(r.MaLop || r.classId || r['Ma Lop'] || r['Mã Lớp']);
}

function buildClassMap(rows) {
  var map = {};
  rows.forEach(function(c) {
    var id = classIdOf(c);
    if (id) map[id] = c;
  });
  return map;
}

function teacherIdOf(t) {
  return str(t.MaGV || t.id || t.teacherId);
}

function teacherNameOf(t) {
  return str(t.HoTen || t.TenGV || t.GiaoVien || t.name || t.teacherName);
}

function classTeacherNameOf(c) {
  return str(c.GiaoVien || c.TenGV || c.teacherName || c['Giáo viên'] || c['GiÃ¡o viÃªn'] || c.MaGV);
}

function classTeacherIdOf(c, teacherNameToId) {
  var id = str(c.MaGV || c.maGV || c.teacherId);
  if (id) return id;

  var name = classTeacherNameOf(c);
  if (!name || name.match(/^GV/i)) return name;

  return teacherNameToId[normalizeName(name)] || findTeacherIdByName(name) || '';
}

function lessonTeacherIdOf(l) {
  var raw = str(l.MaGV || l.maGV || l.teacherId || l.GiaoVien || l.teacherName || l['Giáo viên'] || l['GiÃ¡o viÃªn']);
  if (!raw) return '';
  if (raw.match(/^GV/i)) return raw;
  return findTeacherIdByName(raw) || raw;
}

function buildTeacherMap(rows) {
  var map = {};
  rows.forEach(function(t) {
    var id = teacherIdOf(t);
    if (id) map[id] = t;
  });
  return map;
}

function buildTeacherNameToId(rows) {
  var map = {};
  rows.forEach(function(t) {
    var name = normalizeName(teacherNameOf(t));
    var id = teacherIdOf(t);
    if (name && id) map[name] = id;
  });
  return map;
}

function normalizeName(v) {
  return removeVietnamese(v).toLowerCase().replace(/\s+/g, ' ').trim();
}

function findTeacherIdByName(name) {
  var rows = getRows(SHEETS.GIAOVIEN);
  var n = normalizeName(name);
  if (!n) return '';

  for (var i = 0; i < rows.length; i++) {
    if (normalizeName(teacherNameOf(rows[i])) === n) return teacherIdOf(rows[i]);
  }

  // fallback theo tên cuối, chỉ dùng nếu match duy nhất
  var last = n.split(' ').pop();
  var matches = [];
  for (var j = 0; j < rows.length; j++) {
    var tn = normalizeName(teacherNameOf(rows[j]));
    if (last && tn.indexOf(last) >= 0) matches.push(rows[j]);
  }
  if (matches.length === 1) return teacherIdOf(matches[0]);

  return '';
}

function findTeacherNameById(id) {
  var t = findObjectByValue(SHEETS.GIAOVIEN, 'MaGV', id);
  return t ? teacherNameOf(t) : '';
}

function getClassIdsByTeacher(classesRaw, maGV, teacherNameToId) {
  var out = [];
  classesRaw.forEach(function(c) {
    if (classTeacherIdOf(c, teacherNameToId || {}) === maGV) out.push(classIdOf(c));
  });
  return out;
}

function groupAttendanceByLesson(rows) {
  var map = {};
  rows.forEach(function(r) {
    var k = str(r.MaBuoi);
    if (!k) return;
    if (!map[k]) map[k] = [];
    map[k].push(r);
  });
  return map;
}

// ─────────────────────────────────────────────────────────────
// Config and logs
// ─────────────────────────────────────────────────────────────

function getConfig(key) {
  var rows = getRows(SHEETS.CONFIG);
  key = str(key);
  for (var i = 0; i < rows.length; i++) {
    if (str(rows[i].Key) === key) return str(rows[i].Value);
  }
  return '';
}

function logSystem(action, entity, entityId, detail, status) {
  try {
    var obj = {
      LogId: makeLogId(),
      Time: nowStr(),
      Action: str(action),
      Entity: str(entity),
      EntityId: str(entityId),
      User: Session.getActiveUser ? String(Session.getActiveUser().getEmail() || '') : '',
      Detail: str(detail),
      Status: str(status || 'ok')
    };
    appendObject(SHEETS.NHATKYHETHONG, obj);
  } catch (e) {
    // Không để log làm hỏng nghiệp vụ chính.
  }
}

// ─────────────────────────────────────────────────────────────
// Debug helpers
// ─────────────────────────────────────────────────────────────

function debugGetData() {
  Logger.log(JSON.stringify(getData(), null, 2));
}

function debugSetup() {
  setupSheets();
}
