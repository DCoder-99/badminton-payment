import { create } from "zustand";
import type { MemberView, MonthlyConfigView, MonthSummary, PaymentView, SessionView } from "../types";
import { getMonthSummary } from "../lib/computed";
import { memberService } from "../services/member.service";
import { monthlyConfigService } from "../services/monthly-config.service";
import { paymentService } from "../services/payment.service";
import { sessionService } from "../services/session.service";

interface BadmintonState {
  members: MemberView[];
  sessions: SessionView[];
  payments: PaymentView[];
  monthlyConfigs: MonthlyConfigView[];
  currentMonthId: string;
  loading: boolean;
  error: string | null;

  loadData: () => Promise<void>;
  addMember: (member: Omit<MemberView, "id" | "createdAt"> & { id?: string }) => Promise<void>;
  updateMember: (member: MemberView) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  addSession: (session: Omit<SessionView, "id">) => Promise<void>;
  updateSession: (session: SessionView) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  addMonthlyConfig: (config: MonthlyConfigView) => Promise<void>;
  updateMonthlyConfig: (config: MonthlyConfigView) => Promise<void>;
  archiveMonthlyConfig: (id: string) => Promise<void>;
  setCurrentMonth: (monthId: string) => void;
  recordPaymentInstallment: (memberId: string, monthId: string, amount: number, note?: string) => Promise<void>;
  deletePaymentInstallment: (memberId: string, monthId: string, installmentId: string) => Promise<void>;
  refreshSupabaseData: () => Promise<void>;
  getMonthSummary: (monthId: string) => MonthSummary;
  getClubFund: () => number;
}

function defaultMonthId(configs: MonthlyConfigView[]) {
  return configs.find((config) => config.status === "active")?.id ?? configs[0]?.id ?? new Date().toISOString().slice(0, 7);
}

async function refreshData(set: (state: Partial<BadmintonState>) => void, get: () => BadmintonState) {
  const [members, monthlyConfigs, sessions, payments] = await Promise.all([
    memberService.getAll(),
    monthlyConfigService.getAll(),
    sessionService.getAll(),
    paymentService.getAll(),
  ]);
  const currentMonthId = get().currentMonthId || defaultMonthId(monthlyConfigs);
  set({
    members,
    monthlyConfigs,
    sessions,
    payments,
    currentMonthId: monthlyConfigs.some((config) => config.id === currentMonthId) ? currentMonthId : defaultMonthId(monthlyConfigs),
    loading: false,
    error: null,
  });
}

async function runMutation(set: (state: Partial<BadmintonState>) => void, get: () => BadmintonState, action: () => Promise<void>) {
  set({ loading: true, error: null });
  try {
    await action();
    await refreshData(set, get);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Thao tác Supabase thất bại";
    set({ loading: false, error: message });
    throw error;
  }
}

export const useBadmintonStore = create<BadmintonState>()((set, get) => ({
  members: [],
  sessions: [],
  payments: [],
  monthlyConfigs: [],
  currentMonthId: "",
  loading: true,
  error: null,

  loadData: async () => {
    set({ loading: true, error: null });
    try {
      await refreshData(set, get);
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "Không thể tải dữ liệu Supabase" });
    }
  },

  addMember: async (member) =>
    runMutation(set, get, async () => {
      await memberService.create({
        id: member.id,
        name: member.name,
        type: member.type,
        phone: member.phone,
        status: member.status,
        notes: member.notes,
      });
    }),

  updateMember: async (member) =>
    runMutation(set, get, async () => {
      await memberService.update(member.id, {
        name: member.name,
        type: member.type,
        phone: member.phone,
        status: member.status,
        notes: member.notes,
      });
    }),

  deleteMember: async (id) =>
    runMutation(set, get, async () => {
      await memberService.delete(id);
    }),

  addSession: async (session) =>
    runMutation(set, get, async () => {
      await sessionService.create(session);
    }),

  updateSession: async (session) =>
    runMutation(set, get, async () => {
      await sessionService.update(session.id, session);
    }),

  deleteSession: async (id) =>
    runMutation(set, get, async () => {
      await sessionService.delete(id);
    }),

  addMonthlyConfig: async (config) =>
    runMutation(set, get, async () => {
      await monthlyConfigService.create({
        id: config.id,
        name: config.name,
        status: config.status,
        expected_court_fee: config.expectedCourtFee,
        expected_shuttlecock_fee: config.expectedShuttlecockFee,
        expected_other_fee: config.expectedOtherFee,
      });
      set({ currentMonthId: config.id });
    }),

  updateMonthlyConfig: async (config) =>
    runMutation(set, get, async () => {
      await monthlyConfigService.update(config.id, {
        name: config.name,
        status: config.status,
        expected_court_fee: config.expectedCourtFee,
        expected_shuttlecock_fee: config.expectedShuttlecockFee,
        expected_other_fee: config.expectedOtherFee,
      });
    }),

  archiveMonthlyConfig: async (id) =>
    runMutation(set, get, async () => {
      await monthlyConfigService.delete(id);
    }),

  setCurrentMonth: (monthId) => set({ currentMonthId: monthId }),

  recordPaymentInstallment: async (memberId, monthId, amount, note) =>
    runMutation(set, get, async () => {
      await paymentService.addHistory(memberId, monthId, amount, note);
    }),

  deletePaymentInstallment: async (memberId, monthId, installmentId) =>
    runMutation(set, get, async () => {
      const payment = get().payments.find((item) => item.memberId === memberId && item.monthId === monthId);
      if (payment) await paymentService.deleteHistory(payment.id, installmentId);
    }),

  refreshSupabaseData: async () => {
    await get().loadData();
  },

  getClubFund: () => {
    const { payments, sessions } = get();
    const totalFixedRevenue = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);
    const totalGuestRevenue = sessions.reduce(
      (sum, session) => sum + session.guests.reduce((guestSum, guest) => guestSum + guest.paidAmount, 0),
      0,
    );
    const totalExpenses = sessions.reduce((sum, session) => sum + session.courtFee + session.shuttlecockFee + session.otherFee, 0);
    return totalFixedRevenue + totalGuestRevenue - totalExpenses;
  },

  getMonthSummary: (monthId) => {
    const { members, sessions, payments, monthlyConfigs } = get();
    return getMonthSummary(monthId, members, sessions, payments, monthlyConfigs);
  },
}));
