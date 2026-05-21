import type { Member, MemberView } from "../types";
import { getSupabase, raiseSupabaseError, type DbClient } from "./service-utils";

export type MemberCreateInput = Pick<Member, "name" | "type"> & Partial<Pick<Member, "id" | "phone" | "status" | "notes">>;
export type MemberUpdateInput = Partial<Pick<Member, "name" | "type" | "phone" | "status" | "notes">>;

export function mapMember(row: Member): MemberView {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    phone: row.phone ?? "",
    status: row.status,
    notes: row.notes ?? undefined,
    createdAt: row.created_at?.slice(0, 10) ?? "",
  };
}

export const memberService = {
  async getAll(client?: DbClient) {
    const supabase = getSupabase(client);
    const { data, error } = await supabase.from("members").select("*").order("created_at", { ascending: true });
    raiseSupabaseError(error, "Không thể tải danh sách thành viên");
    return (data ?? []).map(mapMember);
  },

  async getById(id: string, client?: DbClient) {
    const supabase = getSupabase(client);
    const { data, error } = await supabase.from("members").select("*").eq("id", id).single();
    raiseSupabaseError(error, "Không thể tải thành viên");
    return mapMember(data);
  },

  async create(input: MemberCreateInput, client?: DbClient) {
    const supabase = getSupabase(client);
    const payload = {
        id: input.id,
        name: input.name,
        type: input.type,
        phone: input.phone ?? "",
        status: input.status ?? "active",
        notes: input.notes ?? null,
      };
    const { data, error } = await supabase
      .from("members")
      .insert(payload as never)
      .select("*")
      .single();
    raiseSupabaseError(error, "Không thể tạo thành viên");
    return mapMember(data);
  },

  async update(id: string, input: MemberUpdateInput, client?: DbClient) {
    const supabase = getSupabase(client);
    const { data, error } = await supabase.from("members").update(input as never).eq("id", id).select("*").single();
    raiseSupabaseError(error, "Không thể cập nhật thành viên");
    return mapMember(data);
  },

  async delete(id: string, client?: DbClient) {
    return this.update(id, { status: "inactive" }, client);
  },
};
