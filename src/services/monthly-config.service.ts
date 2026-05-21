import type { MonthlyConfig, MonthlyConfigView } from "../types";
import { getSupabase, raiseSupabaseError, type DbClient } from "./service-utils";

export type MonthlyConfigCreateInput = Pick<
  MonthlyConfig,
  "id" | "name" | "expected_court_fee" | "expected_shuttlecock_fee" | "expected_other_fee"
> &
  Partial<Pick<MonthlyConfig, "status">>;
export type MonthlyConfigUpdateInput = Partial<Omit<MonthlyConfigCreateInput, "id">>;

export function mapMonthlyConfig(row: MonthlyConfig): MonthlyConfigView {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    expectedCourtFee: row.expected_court_fee,
    expectedShuttlecockFee: row.expected_shuttlecock_fee,
    expectedOtherFee: row.expected_other_fee,
  };
}

export const monthlyConfigService = {
  async getAll(client?: DbClient) {
    const supabase = getSupabase(client);
    const { data, error } = await supabase.from("monthly_configs").select("*").order("id", { ascending: false });
    raiseSupabaseError(error, "Không thể tải cấu hình tháng");
    return (data ?? []).map(mapMonthlyConfig);
  },

  async getById(id: string, client?: DbClient) {
    const supabase = getSupabase(client);
    const { data, error } = await supabase.from("monthly_configs").select("*").eq("id", id).single();
    raiseSupabaseError(error, "Không thể tải cấu hình tháng");
    return mapMonthlyConfig(data);
  },

  async create(input: MonthlyConfigCreateInput, client?: DbClient) {
    const supabase = getSupabase(client);
    const { data, error } = await supabase
      .from("monthly_configs")
      .insert({ ...input, status: input.status ?? "active" } as never)
      .select("*")
      .single();
    raiseSupabaseError(error, "Không thể tạo cấu hình tháng");
    return mapMonthlyConfig(data);
  },

  async update(id: string, input: MonthlyConfigUpdateInput, client?: DbClient) {
    const supabase = getSupabase(client);
    const { data, error } = await supabase.from("monthly_configs").update(input as never).eq("id", id).select("*").single();
    raiseSupabaseError(error, "Không thể cập nhật cấu hình tháng");
    return mapMonthlyConfig(data);
  },

  async delete(id: string, client?: DbClient) {
    return this.update(id, { status: "archived" }, client);
  },
};
