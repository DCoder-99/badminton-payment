"use client";

import React, { useState } from "react";
import { Plus, Search, Edit2, Trash2, Phone, Shield, UserCheck, UserX } from "lucide-react";
import { useBadmintonStore } from "../../store/badmintonStore";
import { Member } from "../../types";
import { useToast } from "../ui/Toast";
import { Dialog } from "../ui/Dialog";
import { cn } from "../../lib/utils";

export const MembersTab: React.FC = () => {
  const { members, addMember, updateMember, deleteMember } = useBadmintonStore();
  const { toast } = useToast();

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "fixed" | "guest">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Custom delete confirmation state
  const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);
  const [deleteMemberName, setDeleteMemberName] = useState<string>("");

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState<"fixed" | "guest">("fixed");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const [initialMemberSnapshot, setInitialMemberSnapshot] = useState("");

  const takeMemberSnapshot = (
    sName: string,
    sType: "fixed" | "guest",
    sPhone: string,
    sStatus: "active" | "inactive"
  ) => {
    return JSON.stringify({ sName, sType, sPhone, sStatus });
  };

  const isMemberDirty = initialMemberSnapshot !== takeMemberSnapshot(name, type, phone, status);

  const openAddModal = () => {
    setEditingMember(null);
    setName("");
    setType("fixed");
    setPhone("");
    setStatus("active");
    setInitialMemberSnapshot(takeMemberSnapshot("", "fixed", "", "active"));
    setIsModalOpen(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setName(member.name);
    setType(member.type);
    setPhone(member.phone || "");
    setStatus(member.status);
    setInitialMemberSnapshot(takeMemberSnapshot(member.name, member.type, member.phone || "", member.status));
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast("Vui lòng nhập tên thành viên", "warning");
      return;
    }

    if (editingMember) {
      updateMember({
        ...editingMember,
        name: name.trim(),
        type,
        phone: phone.trim(),
        status,
      });
      toast(`Đã cập nhật thông tin cho ${name}!`, "success", "Cập nhật thành công");
    } else {
      addMember({
        name: name.trim(),
        type,
        phone: phone.trim(),
        status,
      });
      toast(`Đã thêm thành viên ${name} thành công!`, "success", "Thêm mới thành công");
    }

    setIsModalOpen(false);
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteMemberId(id);
    setDeleteMemberName(name);
  };

  // Filter Logic
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search);
    const matchesType = typeFilter === "all" || m.type === typeFilter;
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 font-sans">
            Quản Lý Thành Viên
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-sans">
            Thêm mới, tìm kiếm và phân loại thành viên cố định / vãng lai.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer text-sm font-sans"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          Thêm thành viên
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 font-sans"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setTypeFilter("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-colors cursor-pointer",
                typeFilter === "all"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              Tất cả
            </button>
            <button
              onClick={() => setTypeFilter("fixed")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-colors cursor-pointer",
                typeFilter === "fixed"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              Cố định
            </button>
            <button
              onClick={() => setTypeFilter("guest")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-colors cursor-pointer",
                typeFilter === "guest"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              Vãng lai
            </button>
          </div>

          <div className="flex bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-colors cursor-pointer",
                statusFilter === "all"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              Tất cả trạng thái
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-colors cursor-pointer",
                statusFilter === "active"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              Hoạt động
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-colors cursor-pointer",
                statusFilter === "inactive"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              Tạm nghỉ
            </button>
          </div>
        </div>
      </div>

      {/* Members List Table */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-16 text-zinc-400 font-sans border-2 border-dashed border-zinc-100 dark:border-zinc-900 m-4 rounded-xl">
            Không tìm thấy thành viên nào khớp với điều kiện lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-900 text-zinc-400 font-semibold bg-zinc-50/50 dark:bg-zinc-900/10">
                  <th className="py-3.5 px-6 font-sans">Họ và Tên</th>
                  <th className="py-3.5 px-6 font-sans">Số điện thoại</th>
                  <th className="py-3.5 px-6 font-sans">Loại thành viên</th>
                  <th className="py-3.5 px-6 font-sans">Trạng thái</th>
                  <th className="py-3.5 px-6 font-sans">Ngày tham gia</th>
                  <th className="py-3.5 px-6 text-right font-sans">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/40 dark:hover:bg-zinc-900/10 text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    <td className="py-4 px-6 font-semibold dark:text-zinc-200 font-sans">
                      {m.name}
                    </td>
                    <td className="py-4 px-6 font-sans">
                      <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                        <Phone className="w-3.5 h-3.5" />
                        {m.phone || "Chưa có"}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-sans">
                      {m.type === "fixed" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                          <Shield className="w-3 h-3" />
                          Cố định
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                          Vãng lai
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-sans">
                      {m.status === "active" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-500 font-sans">
                          <UserCheck className="w-3 h-3" /> Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 font-sans">
                          <UserX className="w-3 h-3" /> Tạm nghỉ
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400 font-sans">
                      {m.createdAt.split("-").reverse().join("/")}
                    </td>
                    <td className="py-4 px-6 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(m)}
                          className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                          title="Sửa thông tin"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(m.id, m.name)}
                          className="p-1.5 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                          title="Xóa thành viên"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Member Form Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMember ? "Cập nhật thành viên" : "Thêm thành viên mới"}
        isDirty={isMemberDirty}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5 font-sans">
              Họ và Tên
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên thành viên..."
              required
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5 font-sans">
              Số điện thoại
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nhập số điện thoại..."
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5 font-sans">
              Loại thành viên
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "fixed" | "guest")}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 font-sans"
            >
              <option value="fixed">Cố định (Đóng theo tháng & chia sẻ chi phí)</option>
              <option value="guest">Vãng lai (Đóng tiền theo từng buổi chơi)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5 font-sans">
              Trạng thái hoạt động
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 font-sans"
            >
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm nghỉ / Ngừng hoạt động</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-zinc-100 dark:border-zinc-900">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl transition-colors cursor-pointer"
            >
              Lưu lại
            </button>
          </div>
        </form>
      </Dialog>

      {/* Delete Member Confirmation Dialog */}
      <Dialog
        isOpen={deleteMemberId !== null}
        onClose={() => setDeleteMemberId(null)}
        title="Xác nhận xóa thành viên"
        className="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-sans">
            Bạn có chắc chắn muốn xóa thành viên <span className="font-bold text-zinc-900 dark:text-zinc-100">"{deleteMemberName}"</span>? Hành động này sẽ xóa vĩnh viễn dữ liệu thành viên, bao gồm toàn bộ nhật ký điểm danh và lịch sử đóng tiền quỹ của người này.
          </p>
          <div className="flex gap-3 justify-end pt-4 border-t border-zinc-100 dark:border-zinc-900">
            <button
              type="button"
              onClick={() => setDeleteMemberId(null)}
              className="px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => {
                if (deleteMemberId) {
                  deleteMember(deleteMemberId);
                  toast(`Đã xóa thành viên "${deleteMemberName}" khỏi danh sách`, "info", "Đã xóa");
                }
                setDeleteMemberId(null);
              }}
              className="px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-650 text-white rounded-xl transition-colors cursor-pointer"
            >
              Đồng ý xóa
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
