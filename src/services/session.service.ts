import type { GuestAttendance, Session, SessionView } from "../types";
import { getSupabase, raiseSupabaseError, type DbClient } from "./service-utils";

export type SessionCreateInput = Omit<SessionView, "id">;
export type SessionUpdateInput = SessionCreateInput;

const SESSION_SELECT = "*, session_attendance(*, members(*)), guest_attendance(*, members(*))";

export function mapSession(row: Session): SessionView {
  return {
    id: row.id,
    monthId: row.month_id,
    session_date: row.session_date,
    courtFee: row.court_fee,
    shuttlecockFee: row.shuttlecock_fee,
    otherFee: row.other_fee,
    guestFeePerPerson: row.guest_fee_per_person,
    attendance: (row.session_attendance ?? []).map((item) => item.member_id),
    guests: (row.guest_attendance ?? []).map((item) => ({
      memberId: item.member_id ?? `guest_${item.id}`,
      name: item.guest_name || item.members?.name || "Khách vãng lai",
      paidAmount: item.paid_amount,
    })),
    notes: row.notes ?? undefined,
  };
}

function isPersistedMemberId(memberId: string) {
  return !memberId.startsWith("guest_quick_") && !memberId.startsWith("guest_");
}

function guestPayload(sessionId: string, guest: SessionView["guests"][number]): GuestAttendance["session_id"] extends string
  ? { session_id: string; member_id: string | null; guest_name: string; paid_amount: number }
  : never {
  return {
    session_id: sessionId,
    member_id: isPersistedMemberId(guest.memberId) ? guest.memberId : null,
    guest_name: guest.name,
    paid_amount: guest.paidAmount,
  };
}

async function replaceChildren(supabase: DbClient, sessionId: string, input: Pick<SessionCreateInput, "attendance" | "guests">) {
  const [{ error: attendanceDeleteError }, { error: guestDeleteError }] = await Promise.all([
    supabase.from("session_attendance").delete().eq("session_id", sessionId),
    supabase.from("guest_attendance").delete().eq("session_id", sessionId),
  ]);
  raiseSupabaseError(attendanceDeleteError, "Không thể xóa điểm danh cũ");
  raiseSupabaseError(guestDeleteError, "Không thể xóa khách vãng lai cũ");

  const attendanceRows = input.attendance.map((memberId) => ({ session_id: sessionId, member_id: memberId }));
  const guestRows = input.guests.map((guest) => guestPayload(sessionId, guest));

  const insertions = [];
  if (attendanceRows.length > 0) insertions.push(supabase.from("session_attendance").insert(attendanceRows as never));
  if (guestRows.length > 0) insertions.push(supabase.from("guest_attendance").insert(guestRows as never));

  const results = await Promise.all(insertions);
  results.forEach((result) => raiseSupabaseError(result.error, "Không thể lưu điểm danh buổi chơi"));
}

export const sessionService = {
  async getAll(client?: DbClient) {
    const supabase = getSupabase(client);
    const { data, error } = await supabase.from("sessions").select(SESSION_SELECT).order("session_date", { ascending: false });
    raiseSupabaseError(error, "Không thể tải danh sách buổi chơi");
    return (data ?? []).map((row) => mapSession(row as Session));
  },

  async getById(id: string, client?: DbClient) {
    const supabase = getSupabase(client);
    const { data, error } = await supabase.from("sessions").select(SESSION_SELECT).eq("id", id).single();
    raiseSupabaseError(error, "Không thể tải buổi chơi");
    return mapSession(data as Session);
  },

  async create(input: SessionCreateInput, client?: DbClient) {
    const supabase = getSupabase(client);
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        month_id: input.monthId,
        session_date: input.session_date,
        court_fee: input.courtFee,
        shuttlecock_fee: input.shuttlecockFee,
        other_fee: input.otherFee,
        guest_fee_per_person: input.guestFeePerPerson,
        notes: input.notes ?? null,
      } as never)
      .select("*")
      .single();
    raiseSupabaseError(error, "Không thể tạo buổi chơi");
    const created = data as Session;
    await replaceChildren(supabase, created.id, input);
    return this.getById(created.id, supabase);
  },

  async update(id: string, input: SessionUpdateInput, client?: DbClient) {
    const supabase = getSupabase(client);
    const { error } = await supabase
      .from("sessions")
      .update({
        month_id: input.monthId,
        session_date: input.session_date,
        court_fee: input.courtFee,
        shuttlecock_fee: input.shuttlecockFee,
        other_fee: input.otherFee,
        guest_fee_per_person: input.guestFeePerPerson,
        notes: input.notes ?? null,
      } as never)
      .eq("id", id);
    raiseSupabaseError(error, "Không thể cập nhật buổi chơi");
    await replaceChildren(supabase, id, input);
    return this.getById(id, supabase);
  },

  async delete(id: string, client?: DbClient) {
    const supabase = getSupabase(client);
    await replaceChildren(supabase, id, { attendance: [], guests: [] });
    const { error } = await supabase.from("sessions").delete().eq("id", id);
    raiseSupabaseError(error, "Không thể xóa buổi chơi");
  },
};
