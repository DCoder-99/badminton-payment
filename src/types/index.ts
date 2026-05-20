export interface Member {
  id: string;
  name: string;
  type: 'fixed' | 'guest'; // fixed: Cố định, guest: Vãng lai
  phone: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface MonthlyConfig {
  id: string; // YYYY-MM (e.g. "2026-05")
  name: string; // Tên hiển thị (e.g. "Tháng 05/2026")
  status: 'active' | 'archived';
  expectedCourtFee: number; // Tiền sân dự kiến (Ví dụ: 3,000,000)
  expectedShuttlecockFee: number; // Tiền cầu dự kiến (Ví dụ: 2,000,000)
  expectedOtherFee: number; // Chi phí khác dự kiến (Ví dụ: 0)
}

export interface GuestAttendance {
  memberId: string; // ID của thành viên vãng lai
  name: string; // Tên lưu trữ nhanh
  paidAmount: number; // Số tiền đã đóng trong buổi chơi
}

export interface Session {
  id: string;
  monthId: string; // Liên kết tới MonthlyConfig
  date: string; // YYYY-MM-DD
  courtFee: number; // Chi phí sân thực tế
  shuttlecockFee: number; // Chi phí cầu thực tế
  otherFee: number; // Chi phí khác thực tế
  guestFeePerPerson: number; // Giá vãng lai trong buổi đó
  attendance: string[]; // Danh sách Member ID của thành viên cố định đi điểm danh
  guests: GuestAttendance[]; // Thành viên vãng lai và số tiền đóng
  notes?: string;
}

export interface PaymentHistory {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface Payment {
  id: string; // memberId-monthId
  memberId: string;
  monthId: string;
  amountPaid: number; // Tổng tiền đã đóng
  history: PaymentHistory[]; // Chi tiết các lần đóng tiền
  notes?: string;
}
