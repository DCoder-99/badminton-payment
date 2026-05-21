export type MemberType = "fixed" | "guest";
export type RecordStatus = "active" | "inactive";
export type MonthStatus = "active" | "archived";

export interface Member {
  id: string;
  name: string;
  type: MemberType;
  phone: string | null;
  status: RecordStatus;
  notes?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface MonthlyConfig {
  id: string;
  name: string;
  status: MonthStatus;
  expected_court_fee: number;
  expected_shuttlecock_fee: number;
  expected_other_fee: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SessionAttendance {
  id: string;
  session_id: string;
  member_id: string;
  created_at?: string | null;
  members?: Member | null;
}

export interface GuestAttendance {
  id: string;
  session_id: string;
  member_id: string | null;
  guest_name: string;
  paid_amount: number;
  created_at?: string | null;
  members?: Member | null;
}

export interface Session {
  id: string;
  month_id: string;
  session_date: string;
  court_fee: number;
  shuttlecock_fee: number;
  other_fee: number;
  guest_fee_per_person: number;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  session_attendance?: SessionAttendance[];
  guest_attendance?: GuestAttendance[];
}

export interface PaymentHistory {
  id: string;
  payment_id: string;
  amount: number;
  payment_date: string;
  note?: string | null;
  created_at?: string | null;
}

export interface Payment {
  id: string;
  member_id: string;
  month_id: string;
  amount_paid: number;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  payment_history?: PaymentHistory[];
}

export interface Database {
  public: {
    Tables: {
      members: {
        Row: Member;
        Insert: Omit<Partial<Member>, "id" | "created_at" | "updated_at"> & { id?: string; name: string; type: MemberType };
        Update: Partial<Omit<Member, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      monthly_configs: {
        Row: MonthlyConfig;
        Insert: Omit<Partial<MonthlyConfig>, "created_at" | "updated_at"> & { id: string; name: string };
        Update: Partial<Omit<MonthlyConfig, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      sessions: {
        Row: Session;
        Insert: Omit<Partial<Session>, "id" | "created_at" | "updated_at" | "session_attendance" | "guest_attendance"> & {
          month_id: string;
          session_date: string;
        };
        Update: Partial<Omit<Session, "id" | "created_at" | "updated_at" | "session_attendance" | "guest_attendance">>;
        Relationships: [];
      };
      session_attendance: {
        Row: SessionAttendance;
        Insert: Omit<Partial<SessionAttendance>, "id" | "created_at" | "members"> & { session_id: string; member_id: string };
        Update: Partial<Omit<SessionAttendance, "id" | "created_at" | "members">>;
        Relationships: [];
      };
      guest_attendance: {
        Row: GuestAttendance;
        Insert: Omit<Partial<GuestAttendance>, "id" | "created_at" | "members"> & {
          session_id: string;
          guest_name: string;
        };
        Update: Partial<Omit<GuestAttendance, "id" | "created_at" | "members">>;
        Relationships: [];
      };
      payments: {
        Row: Payment;
        Insert: Omit<Partial<Payment>, "id" | "created_at" | "updated_at" | "payment_history"> & {
          member_id: string;
          month_id: string;
        };
        Update: Partial<Omit<Payment, "id" | "created_at" | "updated_at" | "payment_history">>;
        Relationships: [];
      };
      payment_history: {
        Row: PaymentHistory;
        Insert: Omit<Partial<PaymentHistory>, "id" | "created_at"> & { payment_id: string; amount: number; payment_date: string };
        Update: Partial<Omit<PaymentHistory, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export interface MemberView {
  id: string;
  name: string;
  type: MemberType;
  phone: string;
  status: RecordStatus;
  notes?: string;
  createdAt: string;
}

export interface MonthlyConfigView {
  id: string;
  name: string;
  status: MonthStatus;
  expectedCourtFee: number;
  expectedShuttlecockFee: number;
  expectedOtherFee: number;
}

export interface GuestAttendanceView {
  memberId: string;
  name: string;
  paidAmount: number;
}

export interface SessionView {
  id: string;
  monthId: string;
  session_date: string;
  courtFee: number;
  shuttlecockFee: number;
  otherFee: number;
  guestFeePerPerson: number;
  attendance: string[];
  guests: GuestAttendanceView[];
  notes?: string;
}

export interface PaymentHistoryView {
  id: string;
  amount: number;
  payment_date: string;
  note?: string;
}

export interface PaymentView {
  id: string;
  memberId: string;
  monthId: string;
  amountPaid: number;
  history: PaymentHistoryView[];
  notes?: string;
}

export interface MonthSummary {
  expectedCourtFee: number;
  expectedShuttlecockFee: number;
  expectedOtherFee: number;
  expectedTotal: number;
  prepaidAmountPerFixedMember: number;
  actualCourtFee: number;
  actualShuttlecockFee: number;
  actualOtherFee: number;
  actualTotal: number;
  guestRevenue: number;
  netExtraCost: number;
  extraFeePerFixedMember: number;
  totalDuePerFixedMember: number;
  totalFixedPaid: number;
  totalRevenue: number;
  totalDeficit: number;
  activeFixedCount: number;
  activeGuestCount: number;
  sessionCount: number;
}
