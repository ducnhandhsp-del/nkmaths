export type Screen =
  | 'overview'
  | 'operations'
  | 'room-rental'
  | 'scores'
  | 'training'
  | 'finance'
  | 'reports'
  | 'settings';

export type TrainingSub = 'students' | 'classes' | 'teachers';
export type FinanceSub = 'ledger' | 'debt' | 'expense';
export type OperationsSub = 'schedule' | 'lessons' | 'attendance';
export type ReportsSub = 'training' | 'operations' | 'finance';

export type ScoresSub = 'assessments' | 'gradebook' | 'insights';
export type AssessmentStatus = 'draft' | 'entering' | 'finalized';
export type ScoreEntryStatus = 'scored' | 'absent' | 'exempt';

export interface Assessment {
  id: string;
  name: string;
  classId: string;
  lessonId?: string;
  date: string;
  type: string;
  topic: string;
  maxScore: number;
  weight: number;
  teacherId?: string;
  status: AssessmentStatus;
  note: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScoreEntry {
  id: string;
  assessmentId: string;
  studentId: string;
  score: number | null;
  status: ScoreEntryStatus;
  comment: string;
  createdAt?: string;
  updatedAt?: string;
}

export type RentalBookingStatus = 'confirmed' | 'completed' | 'cancelled';
export type RentalPaymentStatus = 'unpaid' | 'deposit' | 'paid' | 'refunded';
export type RentalTransactionType = 'collection' | 'refund';

export interface RentalBooking {
  id: string;
  seriesId: string;
  customerId: string;
  name: string;
  renterName: string;
  renterPhone: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  airConditioning: boolean;
  amount: number;
  status: RentalBookingStatus;
  note: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RentalPayment {
  id: string;
  bookingId: string;
  date: string;
  amount: number;
  transactionType: RentalTransactionType;
  method: 'cash' | 'bank';
  note: string;
  createdAt?: string;
}

export interface RentalCustomer {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'inactive';
  note: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RentalSeries {
  id: string;
  name: string;
  customerId: string;
  roomName: string;
  startDate: string;
  endDate: string;
  repeatRule: string;
  status: 'active' | 'cancelled';
  note: string;
}

export interface RentalPricePlan {
  id: string;
  name: string;
  amount: number;
  durationMinutes: number;
  airConditioning: boolean;
  status: 'active' | 'inactive';
  order: number;
  note: string;
}

export interface Student {
  id:            string;
  name:          string;
  dob:           string;
  branch:        string;
  grade:         string;
  school:        string;
  teacher:       string;
  parentName:    string;
  parentPhone:   string;
  studentPhone:  string;
  address:       string;
  academicLevel: string;
  goal:          string;
  supportNeeded: string;
  notes?:        string;
  facebookUrl?:  string;
  classId:       string;
  startDate:     string;
  endDate:       string;
  status:        string;
  createdAt?:     string;
  updatedAt?:     string;
}

export interface Payment {
  id:          string;
  date:        string;
  docNum:      string;
  description: string;
  studentId:   string;
  studentName: string;
  payer:       string;
  method:      string;
  amount:      number;
  note:        string;
  thangHP?:    number;
  namHP?:      number;
  maLop?:      string;
  createdAt?:   string;
  updatedAt?:   string;
}

export interface Expense {
  id:          string;
  date:        string;
  docNum:      string;
  description: string;
  category:    string;
  amount:      number;
  spender:     string;
  createdAt?:   string;
  updatedAt?:   string;
}

export interface TeachingLog {
  id?:             string;
  maBuoi?:        string;
  rawDate:         string;
  date:            string;
  originalDate:    string;
  originalClassId: string;
  originalCaDay:   string;
  classId:         string;
  content:         string;
  homework:        string;
  teacherNote:     string;
  teacherName:     string;
  maGV?:           string;
  caDay:           string;
  lessonType?:     string;
  LoaiBuoiHoc?:    string;
  present:         number;
  absent:          number;
  late:            number;
  excused?:        number;
  attendanceList:  AttendanceEntry[];
  createdAt?:      string;
  updatedAt?:      string;
}

export interface AttendanceEntry {
  maHS?:      string;
  'Mã HS'?:   string;
  tenHS?:     string;
  trangThai?: string;
  ghiChu?:    string;
  loaiDiemDanh?: 'regular' | 'extra' | string;
  LoaiDiemDanh?: 'regular' | 'extra' | string;
  attendanceType?: 'regular' | 'extra' | string;
  'Trạng thái'?: string;
  'Ghi chú'?:    string;
}

export interface ChartDataPoint {
  month: string;
  Thu:   number;
  Chi:   number;
}

export interface SummaryData {
  totalRevenue: number;
  totalExpense: number;
  chart:        ChartDataPoint[];
}

export interface CacheMeta {
  cachedAt: string;
  source:   'gas' | 'cache';
  version:  number;
}

export type DataSyncState = 'idle' | 'syncing' | 'fresh' | 'cache' | 'error';

export interface DeleteTarget {
  type: 'student' | 'payment' | 'expense' | 'lead' | 'teacher' | 'class' | 'material';
  id:   string;
  name: string;
}

export interface Teacher {
  id:             string;
  name:           string;
  phone:          string;
  email:          string;
  gender?:        'male' | 'female' | 'other';
  dob?:           string;
  address?:       string;
  idNumber?:      string;
  specialization: string;
  qualification:  string;
  experience?:    number;
  baseSalary?:    number;
  hourlyRate?:    number;
  allowance?:     number;
  status:         'active' | 'inactive' | 'onleave' | string;
  classes:        string[];
  schedule?:      any;
  notes?:         string;
  createdAt:      string;
}

export interface LeaveRequest {
  id:          string;
  studentId:   string;
  studentName: string;
  classId:     string;
  date:        string;
  reason:      string;
  status:      'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  createdAt:   string;
}

export interface Material {
  id:             string;
  name:           string;
  type:           'lesson' | 'exercise' | 'exam' | 'document' | 'image' | 'video' | 'other';
  url:            string;
  fileSize?:      number;
  mimeType?:      string;
  grade?:         string;
  classId?:       string;
  subject:        'Toán' | 'Lý' | 'Hóa' | 'Tổng hợp';
  description?:   string;
  tags:           string[];
  uploadedBy:     string;
  uploadedAt:     string;
  downloadCount?: number;
}

export interface Lead {
  id:               string;
  name:             string;
  phone:            string;
  email?:           string;
  grade?:           string;
  source:           'Facebook' | 'Zalo' | 'Giới thiệu' | 'Website' | 'Khác';
  status:           'new' | 'contacted' | 'appointment' | 'registered' | 'lost';
  notes?:           string;
  appointmentDate?: string;
  createdAt:        string;
}

export interface ClassRecord {
  'Mã Lớp':    string;
  'Tên Lớp'?:  string;
  'Giáo viên'?: string;
  'Cơ sở'?:    string;
  'Khối'?:     string;
  'Buổi 1'?:   string;
  'Buổi 2'?:   string;
  'Buổi 3'?:   string;
  MaGV?:         string;
  GiaoVien?:     string;
  teacherId?:    string;
  [key: string]: string | number | undefined;
}
