import type { MemberView, MonthlyConfigView, MonthSummary, PaymentView, SessionView } from "../types";

export function monthlyTotalExpenses(sessions: SessionView[], monthId: string) {
  return sessions
    .filter((session) => session.monthId === monthId)
    .reduce(
      (sum, session) => ({
        courtFee: sum.courtFee + session.courtFee,
        shuttlecockFee: sum.shuttlecockFee + session.shuttlecockFee,
        otherFee: sum.otherFee + session.otherFee,
        total: sum.total + session.courtFee + session.shuttlecockFee + session.otherFee,
      }),
      { courtFee: 0, shuttlecockFee: 0, otherFee: 0, total: 0 },
    );
}

export function monthlyTotalPayments(payments: PaymentView[], monthId: string) {
  return payments.filter((payment) => payment.monthId === monthId).reduce((sum, payment) => sum + payment.amountPaid, 0);
}

export function guestRevenue(sessions: SessionView[], payments: PaymentView[], members: MemberView[], monthId: string) {
  const sessionRevenue = sessions
    .filter((session) => session.monthId === monthId)
    .reduce((sum, session) => sum + session.guests.reduce((guestSum, guest) => guestSum + guest.paidAmount, 0), 0);

  const guestPaymentRevenue = payments
    .filter((payment) => payment.monthId === monthId)
    .reduce((sum, payment) => {
      const member = members.find((item) => item.id === payment.memberId);
      return member?.type === "guest" ? sum + payment.amountPaid : sum;
    }, 0);

  return sessionRevenue + guestPaymentRevenue;
}

export function averageCostPerFixedMember(totalCost: number, members: MemberView[]) {
  const fixedCount = members.filter((member) => member.type === "fixed" && member.status === "active").length;
  return fixedCount > 0 ? Math.round(totalCost / fixedCount) : 0;
}

export function memberDebt(member: MemberView, monthId: string, sessions: SessionView[], payments: PaymentView[], summary: MonthSummary) {
  const payment = payments.find((item) => item.memberId === member.id && item.monthId === monthId);
  if (member.type === "fixed") {
    return Math.max(0, summary.totalDuePerFixedMember - (payment?.amountPaid ?? 0));
  }

  const attended = sessions.filter((session) => session.monthId === monthId && session.guests.some((guest) => guest.memberId === member.id));
  const totalDue = attended.reduce((sum, session) => sum + session.guestFeePerPerson, 0);
  const paidAtSessions = attended.reduce((sum, session) => {
    const guest = session.guests.find((item) => item.memberId === member.id);
    return sum + (guest?.paidAmount ?? 0);
  }, 0);
  return Math.max(0, totalDue - paidAtSessions - (payment?.amountPaid ?? 0));
}

export function getMonthSummary(
  monthId: string,
  members: MemberView[],
  sessions: SessionView[],
  payments: PaymentView[],
  monthlyConfigs: MonthlyConfigView[],
): MonthSummary {
  const config = monthlyConfigs.find((item) => item.id === monthId) ?? {
    id: monthId,
    name: `Tháng ${monthId.split("-")[1]}/${monthId.split("-")[0]}`,
    status: "active" as const,
    expectedCourtFee: 0,
    expectedShuttlecockFee: 0,
    expectedOtherFee: 0,
  };
  const activeFixedMembers = members.filter((member) => member.type === "fixed" && member.status === "active");
  const activeFixedCount = activeFixedMembers.length;
  const activeGuestCount = members.filter((member) => member.type === "guest" && member.status === "active").length;
  const monthSessions = sessions.filter((session) => session.monthId === monthId);
  const monthPayments = payments.filter((payment) => payment.monthId === monthId);
  const expectedTotal = config.expectedCourtFee + config.expectedShuttlecockFee + config.expectedOtherFee;
  const expenses = monthlyTotalExpenses(sessions, monthId);
  const totalGuestRevenue = guestRevenue(sessions, payments, members, monthId);
  const netExtraCost = Math.max(0, expenses.total - expectedTotal - totalGuestRevenue);
  const prepaidAmountPerFixedMember = activeFixedCount > 0 ? Math.round(expectedTotal / activeFixedCount) : 0;
  const extraFeePerFixedMember = activeFixedCount > 0 ? Math.round(netExtraCost / activeFixedCount) : 0;
  const totalDuePerFixedMember = prepaidAmountPerFixedMember + extraFeePerFixedMember;

  const totalFixedPaid = monthPayments.reduce((sum, payment) => {
    const member = members.find((item) => item.id === payment.memberId);
    return member?.type === "fixed" ? sum + payment.amountPaid : sum;
  }, 0);

  const baseSummary = {
    expectedCourtFee: config.expectedCourtFee,
    expectedShuttlecockFee: config.expectedShuttlecockFee,
    expectedOtherFee: config.expectedOtherFee,
    expectedTotal,
    prepaidAmountPerFixedMember,
    actualCourtFee: expenses.courtFee,
    actualShuttlecockFee: expenses.shuttlecockFee,
    actualOtherFee: expenses.otherFee,
    actualTotal: expenses.total,
    guestRevenue: totalGuestRevenue,
    netExtraCost,
    extraFeePerFixedMember,
    totalDuePerFixedMember,
    totalFixedPaid,
    totalRevenue: totalFixedPaid + totalGuestRevenue,
    totalDeficit: 0,
    activeFixedCount,
    activeGuestCount,
    sessionCount: monthSessions.length,
  };

  const totalDeficit = members
    .filter((member) => member.status === "active")
    .reduce((sum, member) => sum + memberDebt(member, monthId, sessions, payments, baseSummary), 0);

  return { ...baseSummary, totalDeficit };
}
