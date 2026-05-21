import type { Payment, PaymentHistory, PaymentView } from "../types";
import { getSupabase, raiseSupabaseError, type DbClient } from "./service-utils";

const PAYMENT_SELECT = "*, payment_history(*)";

export type PaymentCreateInput = Pick<Payment, "member_id" | "month_id"> & Partial<Pick<Payment, "amount_paid" | "notes">>;
export type PaymentUpdateInput = Partial<Pick<Payment, "amount_paid" | "notes">>;

export function mapPayment(row: Payment): PaymentView {
  return {
    id: row.id,
    memberId: row.member_id,
    monthId: row.month_id,
    amountPaid: row.amount_paid,
    notes: row.notes ?? undefined,
    history: (row.payment_history ?? [])
      .map((item: PaymentHistory) => ({
        id: item.id,
        amount: item.amount,
        payment_date: item.payment_date,
        note: item.note ?? undefined,
      }))
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()),
  };
}

export const paymentService = {
  async getAll(client?: DbClient) {
    const supabase = getSupabase(client);
    const { data, error } = await supabase.from("payments").select(PAYMENT_SELECT).order("created_at", { ascending: false });
    raiseSupabaseError(error, "Không thể tải danh sách thanh toán");
    return (data ?? []).map((row) => mapPayment(row as Payment));
  },

  async getById(id: string, client?: DbClient) {
    const supabase = getSupabase(client);
    const { data, error } = await supabase.from("payments").select(PAYMENT_SELECT).eq("id", id).single();
    raiseSupabaseError(error, "Không thể tải thanh toán");
    return mapPayment(data as Payment);
  },

  async create(input: PaymentCreateInput, client?: DbClient) {
    const supabase = getSupabase(client);
    const { data, error } = await supabase.from("payments").insert(input as never).select(PAYMENT_SELECT).single();
    raiseSupabaseError(error, "Không thể tạo thanh toán");
    return mapPayment(data as Payment);
  },

  async update(id: string, input: PaymentUpdateInput, client?: DbClient) {
    const supabase = getSupabase(client);
    const { data, error } = await supabase.from("payments").update(input as never).eq("id", id).select(PAYMENT_SELECT).single();
    raiseSupabaseError(error, "Không thể cập nhật thanh toán");
    return mapPayment(data as Payment);
  },

  async delete(id: string, client?: DbClient) {
    const supabase = getSupabase(client);
    const { error } = await supabase.from("payments").delete().eq("id", id);
    raiseSupabaseError(error, "Không thể xóa thanh toán");
  },

  async addHistory(memberId: string, monthId: string, amount: number, note?: string, client?: DbClient) {
    const supabase = getSupabase(client);
    const { data: existing, error: existingError } = await supabase
      .from("payments")
      .select("*")
      .eq("member_id", memberId)
      .eq("month_id", monthId)
      .maybeSingle();
    raiseSupabaseError(existingError, "Không thể kiểm tra thanh toán hiện tại");
    const existingPayment = existing as Payment | null;

    const payment = existingPayment
      ? await this.update(existingPayment.id, { amount_paid: existingPayment.amount_paid + amount }, supabase)
      : await this.create({ member_id: memberId, month_id: monthId, amount_paid: amount }, supabase);

    const { error: historyError } = await supabase.from("payment_history").insert({
      payment_id: payment.id,
      amount,
      payment_date: new Date().toISOString().slice(0, 10),
      note: note || "Thanh toán",
    } as never);
    raiseSupabaseError(historyError, "Không thể lưu lịch sử thanh toán");
    return this.getById(payment.id, supabase);
  },

  async deleteHistory(paymentId: string, historyId: string, client?: DbClient) {
    const supabase = getSupabase(client);
    const { data: history, error: historyLoadError } = await supabase
      .from("payment_history")
      .select("*")
      .eq("id", historyId)
      .single();
    raiseSupabaseError(historyLoadError, "Không thể tải lịch sử thanh toán");
    const historyRow = history as PaymentHistory;

    const { error: deleteError } = await supabase.from("payment_history").delete().eq("id", historyId);
    raiseSupabaseError(deleteError, "Không thể xóa lịch sử thanh toán");

    const { data: paymentRow, error: paymentLoadError } = await supabase.from("payments").select("*").eq("id", paymentId).single();
    raiseSupabaseError(paymentLoadError, "Không thể tải thanh toán");
    const currentPayment = paymentRow as Payment;

    const nextAmount = Math.max(0, currentPayment.amount_paid - historyRow.amount);
    if (nextAmount === 0) {
      const { count, error: countError } = await supabase
        .from("payment_history")
        .select("*", { count: "exact", head: true })
        .eq("payment_id", paymentId);
      raiseSupabaseError(countError, "Không thể kiểm tra lịch sử thanh toán");
      if ((count ?? 0) === 0) {
        await this.delete(paymentId, supabase);
        return;
      }
    }

    await this.update(paymentId, { amount_paid: nextAmount }, supabase);
  },
};
