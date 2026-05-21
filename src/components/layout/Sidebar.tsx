"use client";

import React, { useState } from "react";
import {
  LayoutGrid,
  Users,
  Calendar,
  Receipt,
  BarChart3,
  Plus,
  Edit,
  Moon,
  Sun,
  RotateCcw,
  Menu,
  X,
  ChevronDown
} from "lucide-react";
import { useBadmintonStore } from "../../store/badmintonStore";
import { useToast } from "../ui/Toast";
import { Dialog } from "../ui/Dialog";
import { cn } from "../../lib/utils";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
}) => {
  const {
    monthlyConfigs,
    currentMonthId,
    setCurrentMonth,
    addMonthlyConfig,
    updateMonthlyConfig,
    archiveMonthlyConfig,
    refreshSupabaseData,
  } = useBadmintonStore();

  const { toast } = useToast();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isNewMonthModalOpen, setIsNewMonthModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isEditMonthModalOpen, setIsEditMonthModalOpen] = useState(false);
  const [editExpectedCourt, setEditExpectedCourt] = useState("");
  const [editExpectedShuttle, setEditExpectedShuttle] = useState("");

  const openEditMonthModal = () => {
    const currentMonthObj = monthlyConfigs.find((m) => m.id === currentMonthId);
    if (currentMonthObj) {
      setEditExpectedCourt(String(currentMonthObj.expectedCourtFee));
      setEditExpectedShuttle(String(currentMonthObj.expectedShuttlecockFee));
      setIsEditMonthModalOpen(true);
    }
  };

  const handleEditMonthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentMonthObj = monthlyConfigs.find((m) => m.id === currentMonthId);
    if (!currentMonthObj) return;

    await updateMonthlyConfig({
      ...currentMonthObj,
      expectedCourtFee: Number(editExpectedCourt) || 0,
      expectedShuttlecockFee: Number(editExpectedShuttle) || 0,
    });

    toast(`Đã cập nhật chi phí dự kiến cho ${currentMonthObj.name}!`, "success", "Cập nhật thành công");
    setIsEditMonthModalOpen(false);
  };

  // Form states for new month
  const [newMonthYear, setNewMonthYear] = useState("2026");
  const [newMonthNumber, setNewMonthNumber] = useState("06");
  const [expectedCourt, setExpectedCourt] = useState("3000000");
  const [expectedShuttle, setExpectedShuttle] = useState("2000000");

  const handleCreateMonthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `${newMonthYear}-${newMonthNumber}`;
    const name = `Tháng ${newMonthNumber}/${newMonthYear}`;

    // Validate
    if (monthlyConfigs.some((c) => c.id === id)) {
      toast("Tháng này đã tồn tại trên hệ thống!", "error", "Lỗi tạo tháng");
      return;
    }

    await addMonthlyConfig({
      id,
      name,
      status: "active",
      expectedCourtFee: Number(expectedCourt) || 0,
      expectedShuttlecockFee: Number(expectedShuttle) || 0,
      expectedOtherFee: 0,
    });

    toast(`Đã khởi tạo thành công ${name}!`, "success", "Tạo tháng mới");
    setIsNewMonthModalOpen(false);
  };

  const handleResetData = () => {
    setIsResetConfirmOpen(true);
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { id: "members", label: "Thành viên", icon: Users },
    { id: "sessions", label: "Buổi chơi", icon: Calendar },
    { id: "payments", label: "Thanh toán", icon: Receipt },
    { id: "reports", label: "Báo cáo", icon: BarChart3 },
  ];

  const currentMonthObj = monthlyConfigs.find((m) => m.id === currentMonthId) || monthlyConfigs[0];

  const isNewMonthDirty = 
    newMonthYear !== "2026" || 
    newMonthNumber !== "06" || 
    expectedCourt !== "3000000" || 
    expectedShuttle !== "2000000";

  const isEditMonthDirty = currentMonthObj ? (
    editExpectedCourt !== String(currentMonthObj.expectedCourtFee) ||
    editExpectedShuttle !== String(currentMonthObj.expectedShuttlecockFee)
  ) : false;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-zinc-900 dark:bg-black text-zinc-100 p-5 select-none border-r border-zinc-800">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 py-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Calendar className="w-6 h-6 text-black stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent font-sans leading-tight">
            V-Badminton
          </h1>
          <p className="text-xs text-zinc-400 font-medium font-sans">
            Expense Manager
          </p>
        </div>
      </div>

      {/* Active Month Selector */}
      <div className="mb-6 px-2">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2 font-sans">
          Tháng Đang Quản Lý
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <select
              value={currentMonthId}
              onChange={(e) => {
                setCurrentMonth(e.target.value);
                toast(`Đã chuyển sang ${monthlyConfigs.find((m) => m.id === e.target.value)?.name}`, "info");
              }}
              className="w-full bg-zinc-800 dark:bg-zinc-900 border border-zinc-700 text-sm text-zinc-100 rounded-xl px-3 py-2.5 pr-8 appearance-none focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium font-sans cursor-pointer"
            >
              {monthlyConfigs.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.status === "archived" ? "(Lưu trữ)" : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-3.5 pointer-events-none" />
          </div>
          <button
            onClick={openEditMonthModal}
            className="p-2.5 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-zinc-200 hover:text-white rounded-xl transition-all cursor-pointer"
            title="Chỉnh sửa chi phí dự kiến tháng này"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsNewMonthModalOpen(true)}
            className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
            title="Tạo tháng mới"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 space-y-1.5 px-1">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block px-1 mb-2 font-sans">
          Menu Điều Hướng
        </label>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer font-sans",
                isActive
                  ? "bg-emerald-500 text-black font-semibold shadow-lg shadow-emerald-500/15"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "stroke-[2.5]" : "text-zinc-400")} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer Settings */}
      <div className="border-t border-zinc-800 pt-4 space-y-2.5 px-1">
        {/* Toggle Dark Mode */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-all cursor-pointer font-sans"
        >
          <div className="flex items-center gap-3">
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            <span>Giao Diện</span>
          </div>
          <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md font-medium">
            {darkMode ? "Tối" : "Sáng"}
          </span>
        </button>

        {/* Refresh Supabase Data */}
        <button
          onClick={handleResetData}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer font-sans"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* New Month Modal */}
      <Dialog
        isOpen={isNewMonthModalOpen}
        onClose={() => setIsNewMonthModalOpen(false)}
        title="Khởi tạo tháng quản lý mới"
        isDirty={isNewMonthDirty}
      >
        <form onSubmit={handleCreateMonthSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5 font-sans">
                Năm
              </label>
              <select
                value={newMonthYear}
                onChange={(e) => setNewMonthYear(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 font-sans"
              >
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5 font-sans">
                Tháng
              </label>
              <select
                value={newMonthNumber}
                onChange={(e) => setNewMonthNumber(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 font-sans"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const m = String(i + 1).padStart(2, "0");
                  return (
                    <option key={m} value={m}>
                      Tháng {m}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5 font-sans">
              Tiền Sân Dự Kiến (VND)
            </label>
            <input
              type="number"
              value={expectedCourt}
              onChange={(e) => setExpectedCourt(e.target.value)}
              placeholder="Ví dụ: 3,000,000"
              required
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5 font-sans">
              Tiền Cầu Dự Kiến (VND)
            </label>
            <input
              type="number"
              value={expectedShuttle}
              onChange={(e) => setExpectedShuttle(e.target.value)}
              placeholder="Ví dụ: 2,000,000"
              required
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 font-sans"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-zinc-100 dark:border-zinc-900">
            <button
              type="button"
              onClick={() => setIsNewMonthModalOpen(false)}
              className="px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl transition-colors cursor-pointer"
            >
              Khởi tạo
            </button>
          </div>
        </form>
      </Dialog>

      {/* Edit Month Config Modal */}
      <Dialog
        isOpen={isEditMonthModalOpen}
        onClose={() => setIsEditMonthModalOpen(false)}
        title={currentMonthObj ? `Cấu hình chi phí dự kiến: ${currentMonthObj.name}` : "Cấu hình chi phí dự kiến"}
        isDirty={isEditMonthDirty}
      >
        <form onSubmit={handleEditMonthSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5 font-sans">
              Tiền Sân Dự Kiến (VND)
            </label>
            <input
              type="number"
              value={editExpectedCourt}
              onChange={(e) => setEditExpectedCourt(e.target.value)}
              placeholder="Ví dụ: 3,000,000"
              required
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 font-sans"
            />
            <p className="text-[10px] text-zinc-400 mt-1">Chi phí ước lượng cố định cho tiền thuê sân cầu lông trong cả tháng.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5 font-sans">
              Tiền Cầu Dự Kiến (VND)
            </label>
            <input
              type="number"
              value={editExpectedShuttle}
              onChange={(e) => setEditExpectedShuttle(e.target.value)}
              placeholder="Ví dụ: 2,000,000"
              required
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 font-sans"
            />
            <p className="text-[10px] text-zinc-400 mt-1">Chi phí ước lượng cho tiền mua quả cầu lông phục vụ hội trong cả tháng.</p>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-zinc-100 dark:border-zinc-900">
            {currentMonthObj?.status === "active" && (
              <button
                type="button"
                onClick={async () => {
                  await archiveMonthlyConfig(currentMonthObj.id);
                  toast(`Đã lưu trữ ${currentMonthObj.name}`, "info", "Lưu trữ tháng");
                  setIsEditMonthModalOpen(false);
                }}
                className="mr-auto px-4 py-2 text-sm font-semibold bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 rounded-xl transition-colors cursor-pointer"
              >
                Lưu trữ tháng
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsEditMonthModalOpen(false)}
              className="px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl transition-colors cursor-pointer"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        title="Làm mới dữ liệu Supabase"
        className="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-400 font-sans">
            Thao tác này tải lại dữ liệu mới nhất từ Supabase và không xóa bản ghi nào.
          </p>
          <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(false)}
              className="px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => {
                void refreshSupabaseData();
                toast("Đã tải lại dữ liệu từ Supabase", "success", "Làm mới dữ liệu");
                setIsResetConfirmOpen(false);
              }}
              className="px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors cursor-pointer"
            >
              Làm mới
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-zinc-900 dark:bg-black text-white border-b border-zinc-800 w-full sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-black stroke-[2.5]" />
          </div>
          <span className="font-bold text-sm bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            V-Badminton
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-zinc-800 px-3 py-1 rounded-lg text-xs font-semibold text-emerald-400">
            {currentMonthObj?.name}
          </div>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Desktop Sidebar (Persistent) */}
      <div className="hidden md:block w-64 flex-shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </div>

      {/* Mobile Side Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsMobileOpen(false)}
          />
          {/* Drawer Content */}
          <div className="relative w-64 max-w-xs flex-1 flex flex-col h-full bg-zinc-900 z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
