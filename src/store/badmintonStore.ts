import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Member, MonthlyConfig, Session, Payment, PaymentHistory } from "../types";

// Seed/Mock Data
const INITIAL_MEMBERS: Member[] = [
  { id: "m1", name: "Quânla5", type: "fixed", phone: "0987654321", status: "active", createdAt: "2026-04-01" },
  { id: "m2", name: "Anhnt653", type: "fixed", phone: "0912345678", status: "active", createdAt: "2026-04-01" },
  { id: "m3", name: "Chungnm2", type: "fixed", phone: "0905123456", status: "active", createdAt: "2026-04-01" },
  { id: "m4", name: "Mếntt7", type: "fixed", phone: "0934567890", status: "active", createdAt: "2026-04-01" },
  { id: "m5", name: "Châu", type: "fixed", phone: "0976543210", status: "active", createdAt: "2026-04-02" },
  { id: "m6", name: "Hảo", type: "fixed", phone: "0943210987", status: "active", createdAt: "2026-04-02" },
  { id: "m7", name: "Jenifer Vu", type: "fixed", phone: "0911223344", status: "active", createdAt: "2026-04-03" },
  { id: "m8", name: "Long", type: "fixed", phone: "0922334455", status: "active", createdAt: "2026-04-04" },
  { id: "m9", name: "Linh", type: "fixed", phone: "0933445566", status: "active", createdAt: "2026-04-04" },
  { id: "m10", name: "Yến", type: "fixed", phone: "0944556677", status: "active", createdAt: "2026-04-05" },
  { id: "m11", name: "Anh Báchvh", type: "guest", phone: "0955667788", status: "active", createdAt: "2026-04-05" }
];

const INITIAL_MONTHS: MonthlyConfig[] = [
  {
    id: "2026-05",
    name: "Tháng 05/2026",
    status: "active",
    expectedCourtFee: 0,
    expectedShuttlecockFee: 0,
    expectedOtherFee: 0,
  },
];

const INITIAL_SESSIONS: Session[] = [];

const INITIAL_PAYMENTS: Payment[] = [];

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
  netExtraCost: number; // delta cost - guest revenue
  extraFeePerFixedMember: number; // netExtraCost / N_fixed
  totalDuePerFixedMember: number; // prepaid + extra
  
  totalFixedPaid: number;
  totalRevenue: number; // fixed paid + guest paid
  totalDeficit: number; // total outstanding debt
  activeFixedCount: number;
  activeGuestCount: number;
  sessionCount: number;
}

interface BadmintonState {
  members: Member[];
  sessions: Session[];
  payments: Payment[];
  monthlyConfigs: MonthlyConfig[];
  currentMonthId: string;
  
  // Actions
  addMember: (member: Omit<Member, "id" | "createdAt"> & { id?: string }) => void;
  updateMember: (member: Member) => void;
  deleteMember: (id: string) => void;
  
  addSession: (session: Omit<Session, "id">) => void;
  updateSession: (session: Session) => void;
  deleteSession: (id: string) => void;
  
  addMonthlyConfig: (config: MonthlyConfig) => void;
  updateMonthlyConfig: (config: MonthlyConfig) => void;
  setCurrentMonth: (monthId: string) => void;
  
  recordPaymentInstallment: (memberId: string, monthId: string, amount: number, note?: string) => void;
  deletePaymentInstallment: (memberId: string, monthId: string, installmentId: string) => void;
  resetToDemoData: () => void;
  
  // Getters & Calculations
  getMonthSummary: (monthId: string) => MonthSummary;
  getClubFund: () => number;
}

export const useBadmintonStore = create<BadmintonState>()(
  persist(
    (set, get) => ({
      members: INITIAL_MEMBERS,
      sessions: INITIAL_SESSIONS,
      payments: INITIAL_PAYMENTS,
      monthlyConfigs: INITIAL_MONTHS,
      currentMonthId: "2026-05",
      
      addMember: (memberData) => set((state) => {
        const id = memberData.id || "m_" + Date.now();
        const newMember: Member = {
          ...memberData,
          id,
          createdAt: new Date().toISOString().split("T")[0],
        };
        return { members: [...state.members, newMember] };
      }),
      
      updateMember: (updatedMember) => set((state) => ({
        members: state.members.map((m) => m.id === updatedMember.id ? updatedMember : m),
      })),
      
      deleteMember: (id) => set((state) => ({
        members: state.members.filter((m) => m.id !== id),
        // Clean up session attendance and guest references
        sessions: state.sessions.map((s) => ({
          ...s,
          attendance: s.attendance.filter((mId) => mId !== id),
          guests: s.guests.filter((g) => g.memberId !== id),
        })),
        // Clean up payments
        payments: state.payments.filter((p) => p.memberId !== id),
      })),
      
      addSession: (sessionData) => set((state) => {
        const id = "s_" + Date.now();
        const newSession: Session = {
          ...sessionData,
          id,
        };
        return { sessions: [...state.sessions, newSession] };
      }),
      
      updateSession: (updatedSession) => set((state) => ({
        sessions: state.sessions.map((s) => s.id === updatedSession.id ? updatedSession : s),
      })),
      
      deleteSession: (id) => set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== id),
      })),
      
      addMonthlyConfig: (config) => set((state) => {
        // If there's an existing one with same ID, overwrite it, otherwise append
        const exists = state.monthlyConfigs.some((c) => c.id === config.id);
        const configs = exists
          ? state.monthlyConfigs.map((c) => c.id === config.id ? config : c)
          : [...state.monthlyConfigs, config];
        return {
          monthlyConfigs: configs,
          currentMonthId: config.id, // Auto switch to newly created month
        };
      }),
      
      updateMonthlyConfig: (config) => set((state) => ({
        monthlyConfigs: state.monthlyConfigs.map((c) => c.id === config.id ? config : c),
      })),
      
      setCurrentMonth: (monthId) => set({ currentMonthId: monthId }),
      
      recordPaymentInstallment: (memberId, monthId, amount, note) => set((state) => {
        const paymentId = `${memberId}-${monthId}`;
        const existingPayment = state.payments.find((p) => p.id === paymentId);
        
        const newInstallment: PaymentHistory = {
          id: "h_" + Date.now(),
          amount,
          date: new Date().toISOString().split("T")[0],
          note: note || "Thanh toán",
        };
        
        let updatedPayments;
        if (existingPayment) {
          updatedPayments = state.payments.map((p) => {
            if (p.id === paymentId) {
              return {
                ...p,
                amountPaid: p.amountPaid + amount,
                history: [...p.history, newInstallment],
              };
            }
            return p;
          });
        } else {
          const newPayment: Payment = {
            id: paymentId,
            memberId,
            monthId,
            amountPaid: amount,
            history: [newInstallment],
          };
          updatedPayments = [...state.payments, newPayment];
        }
        
        return { payments: updatedPayments };
      }),
      
      deletePaymentInstallment: (memberId, monthId, installmentId) => set((state) => {
        const paymentId = `${memberId}-${monthId}`;
        const existingPayment = state.payments.find((p) => p.id === paymentId);
        if (!existingPayment) return {};
        
        const installmentToDelete = existingPayment.history.find((h) => h.id === installmentId);
        if (!installmentToDelete) return {};
        
        const newHistory = existingPayment.history.filter((h) => h.id !== installmentId);
        
        let updatedPayments;
        if (newHistory.length === 0) {
          updatedPayments = state.payments.filter((p) => p.id !== paymentId);
        } else {
          updatedPayments = state.payments.map((p) => {
            if (p.id === paymentId) {
              return {
                ...p,
                amountPaid: Math.max(0, p.amountPaid - installmentToDelete.amount),
                history: newHistory,
              };
            }
            return p;
          });
        }
        
        return { payments: updatedPayments };
      }),
      
      resetToDemoData: () => set({
        members: INITIAL_MEMBERS,
        sessions: INITIAL_SESSIONS,
        payments: INITIAL_PAYMENTS,
        monthlyConfigs: INITIAL_MONTHS,
        currentMonthId: "2026-05",
      }),
      
      getClubFund: () => {
        const { payments, sessions } = get();
        // Total revenue = Sum of all fixed member payments + Sum of all guest payments in sessions
        const totalFixedRevenue = payments.reduce((sum, p) => sum + p.amountPaid, 0);
        
        const totalGuestRevenue = sessions.reduce((sum, s) => {
          const sessionGuestSum = s.guests.reduce((gSum, g) => gSum + g.paidAmount, 0);
          return sum + sessionGuestSum;
        }, 0);
        
        // Total actual expenses = Sum of courtFee + shuttlecockFee + otherFee of all sessions
        const totalExpenses = sessions.reduce((sum, s) => {
          return sum + s.courtFee + s.shuttlecockFee + s.otherFee;
        }, 0);
        
        return totalFixedRevenue + totalGuestRevenue - totalExpenses;
      },
      
      getMonthSummary: (monthId) => {
        const { members, sessions, payments, monthlyConfigs } = get();
        
        // Find configuration
        const config = monthlyConfigs.find((c) => c.id === monthId) || {
          id: monthId,
          name: `Tháng ${monthId.split("-")[1]}/${monthId.split("-")[0]}`,
          status: "active" as const,
          expectedCourtFee: 0,
          expectedShuttlecockFee: 0,
          expectedOtherFee: 0,
        };
        
        // 1. Expected calculations
        const expectedTotal = config.expectedCourtFee + config.expectedShuttlecockFee + config.expectedOtherFee;
        const activeFixedMembers = members.filter((m) => m.type === "fixed" && m.status === "active");
        const activeFixedCount = activeFixedMembers.length;
        const activeGuestCount = members.filter((m) => m.type === "guest" && m.status === "active").length;
        
        const prepaidAmountPerFixedMember = activeFixedCount > 0 ? Math.round(expectedTotal / activeFixedCount) : 0;
        
        // 2. Actual expenses of sessions in this month
        const monthSessions = sessions.filter((s) => s.monthId === monthId);
        const sessionCount = monthSessions.length;
        
        let actualCourtFee = 0;
        let actualShuttlecockFee = 0;
        let actualOtherFee = 0;
        
        let guestRevenue = 0;
        
        // Sum guest payments recorded directly at the sessions
        monthSessions.forEach((s) => {
          actualCourtFee += s.courtFee;
          actualShuttlecockFee += s.shuttlecockFee;
          actualOtherFee += s.otherFee;
          
          s.guests.forEach((g) => {
            guestRevenue += g.paidAmount;
          });
        });

        // Sum guest payments paid later (recorded in payments ledger)
        const monthPayments = payments.filter((p) => p.monthId === monthId);
        monthPayments.forEach((p) => {
          const memberObj = members.find((m) => m.id === p.memberId);
          if (memberObj && memberObj.type === "guest") {
            guestRevenue += p.amountPaid;
          }
        });
        
        const actualTotal = actualCourtFee + actualShuttlecockFee + actualOtherFee;
        
        // 3. Business logic calculations
        // Extra cost = Actual Total - Expected Total
        const totalDeltaCost = actualTotal - expectedTotal;
        
        // Net extra = max(0, Delta - guest revenue)
        const netExtraCost = Math.max(0, totalDeltaCost - guestRevenue);
        
        // Extra fee per fixed member
        const extraFeePerFixedMember = activeFixedCount > 0 ? Math.round(netExtraCost / activeFixedCount) : 0;
        
        // Total due per fixed member
        const totalDuePerFixedMember = prepaidAmountPerFixedMember + extraFeePerFixedMember;
        
        // 4. Payments received
        const totalFixedPaid = monthPayments.reduce((sum, p) => {
          // Verify if member is a fixed member
          const memberObj = members.find((m) => m.id === p.memberId);
          if (memberObj && memberObj.type === "fixed") {
            return sum + p.amountPaid;
          }
          return sum;
        }, 0);
        
        const totalRevenue = totalFixedPaid + guestRevenue;
        
        // Calculate outstanding debt (Công nợ)
        // Fixed members debt
        let fixedDebt = 0;
        activeFixedMembers.forEach((m) => {
          const payObj = monthPayments.find((p) => p.memberId === m.id);
          const paid = payObj ? payObj.amountPaid : 0;
          const due = totalDuePerFixedMember;
          if (due > paid) {
            fixedDebt += (due - paid);
          }
        });
        
        // Guest debt (normally 0, but calculated if guest owes money for sessions)
        let guestDebt = 0;
        
        // Calculate guest debt accurately for database guest members
        const activeGuestMembers = members.filter((m) => m.type === "guest" && m.status === "active");
        activeGuestMembers.forEach((gMember) => {
          // Attended sessions:
          const attended = monthSessions.filter((s) => s.guests.some((g) => g.memberId === gMember.id));
          const totalGuestDue = attended.reduce((sum, s) => sum + s.guestFeePerPerson, 0);
          const paidAtSessions = attended.reduce((sum, s) => {
            const r = s.guests.find((g) => g.memberId === gMember.id);
            return sum + (r ? r.paidAmount : 0);
          }, 0);
          const payLaterObj = monthPayments.find((p) => p.memberId === gMember.id);
          const paidLater = payLaterObj ? payLaterObj.amountPaid : 0;
          
          const remainingDebt = Math.max(0, totalGuestDue - (paidAtSessions + paidLater));
          guestDebt += remainingDebt;
        });

        // Also add debt from guest sessions for "custom" guests (not in members DB) who paid less than the session fee
        monthSessions.forEach((s) => {
          s.guests.forEach((g) => {
            const isDbGuest = members.some((m) => m.id === g.memberId);
            if (!isDbGuest) {
              const expectedFee = s.guestFeePerPerson;
              if (expectedFee > g.paidAmount) {
                guestDebt += (expectedFee - g.paidAmount);
              }
            }
          });
        });
        
        const totalDeficit = fixedDebt + guestDebt;
        
        return {
          expectedCourtFee: config.expectedCourtFee,
          expectedShuttlecockFee: config.expectedShuttlecockFee,
          expectedOtherFee: config.expectedOtherFee,
          expectedTotal,
          prepaidAmountPerFixedMember,
          
          actualCourtFee,
          actualShuttlecockFee,
          actualOtherFee,
          actualTotal,
          
          guestRevenue,
          netExtraCost,
          extraFeePerFixedMember,
          totalDuePerFixedMember,
          
          totalFixedPaid,
          totalRevenue,
          totalDeficit,
          activeFixedCount,
          activeGuestCount,
          sessionCount,
        };
      },
    }),
    {
      name: "badminton-club-expense-store",
      version: 1,
    }
  )
);
