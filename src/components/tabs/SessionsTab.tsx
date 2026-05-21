"use client";

import React, { useRef, useState } from "react";
import { Plus, Edit2, Trash2, Calendar, Users, Check, X, ShieldAlert } from "lucide-react";
import { useBadmintonStore } from "../../store/badmintonStore";
import type { SessionView, GuestAttendanceView } from "../../types";
import { useToast } from "../ui/Toast";
import { Dialog } from "../ui/Dialog";
import { formatVND, formatDate } from "../../lib/utils";
import { cn } from "../../lib/utils";

export const SessionsTab: React.FC = () => {
  const {
    sessions,
    members,
    currentMonthId,
    addSession,
    updateSession,
    deleteSession,
  } = useBadmintonStore();

  const { toast } = useToast();
  const quickGuestSequence = useRef(0);

  // Filter current month's sessions
  const monthSessions = sessions
    .filter((s) => s.monthId === currentMonthId)
    .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());

  // Modal & form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionView | null>(null);

  // Custom delete confirmation state
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [deleteSessionDate, setDeleteSessionDate] = useState<string>("");

  const [date, setDate] = useState("");
  const [courtFee, setCourtFee] = useState("");
  const [shuttlecockFee, setShuttlecockFee] = useState("");
  const [otherFee, setOtherFee] = useState("0");
  const [guestFeePerPerson, setGuestFeePerPerson] = useState("60000");
  const [notes, setNotes] = useState("");

  // Attendance check-off state (Member IDs)
  const [attendance, setAttendance] = useState<string[]>([]);
  // Guest attendance logs
  const [sessionGuests, setSessionGuests] = useState<GuestAttendanceView[]>([]);

  // Add guest inline inputs
  const [selectedGuestId, setSelectedGuestId] = useState("");
  const [customGuestName, setCustomGuestName] = useState("");
  const [guestPaidAmount, setGuestPaidAmount] = useState("60000");

  const fixedMembers = members.filter((m) => m.type === "fixed" && m.status === "active");
  const guestMembers = members.filter((m) => m.type === "guest" && m.status === "active");

  const [initialSessionSnapshot, setInitialSessionSnapshot] = useState("");

  const takeSnapshot = (
    sDate: string,
    sCourt: string,
    sShuttle: string,
    sOther: string,
    sGuestFee: string,
    sNotes: string,
    sAttendance: string[],
    sGuests: GuestAttendanceView[]
  ) => {
    return JSON.stringify({
      sDate,
      sCourt,
      sShuttle,
      sOther,
      sGuestFee,
      sNotes,
      sAttendance,
      sGuests,
    });
  };

  const isSessionDirty = initialSessionSnapshot !== takeSnapshot(
    date,
    courtFee,
    shuttlecockFee,
    otherFee,
    guestFeePerPerson,
    notes,
    attendance,
    sessionGuests
  );

  const openAddModal = () => {
    setEditingSession(null);
    
    // Set default date to today or a matching day of active month
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const isCurrentMonth = todayStr.startsWith(currentMonthId);
    
    const defaultDate = isCurrentMonth ? todayStr : `${currentMonthId}-01`;
    setDate(defaultDate);
    setCourtFee("350000");
    setShuttlecockFee("200000");
    setOtherFee("0");
    setGuestFeePerPerson("60000");
    setNotes("");
    setAttendance([]);
    setSessionGuests([]);
    
    // Set initial snapshot
    setInitialSessionSnapshot(takeSnapshot(
      defaultDate,
      "350000",
      "200000",
      "0",
      "60000",
      "",
      [],
      []
    ));

    // Clean inline inputs
    setSelectedGuestId("");
    setCustomGuestName("");
    setGuestPaidAmount("60000");
    setIsModalOpen(true);
  };

  const openEditModal = (session: SessionView) => {
    setEditingSession(session);
    setDate(session.session_date);
    setCourtFee(String(session.courtFee));
    setShuttlecockFee(String(session.shuttlecockFee));
    setOtherFee(String(session.otherFee));
    setGuestFeePerPerson(String(session.guestFeePerPerson));
    setNotes(session.notes || "");
    setAttendance(session.attendance);
    setSessionGuests(session.guests);
    
    // Set initial snapshot
    setInitialSessionSnapshot(takeSnapshot(
      session.session_date,
      String(session.courtFee),
      String(session.shuttlecockFee),
      String(session.otherFee),
      String(session.guestFeePerPerson),
      session.notes || "",
      session.attendance,
      session.guests
    ));

    // Clean inline inputs
    setSelectedGuestId("");
    setCustomGuestName("");
    setGuestPaidAmount(String(session.guestFeePerPerson));
    setIsModalOpen(true);
  };

  // Toggle fixed member attendance check
  const handleToggleAttendance = (memberId: string) => {
    setAttendance((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Quick Select All / Unselect All attendance
  const handleSelectAllAttendance = () => {
    if (attendance.length === fixedMembers.length) {
      setAttendance([]);
    } else {
      setAttendance(fixedMembers.map((m) => m.id));
    }
  };

  // Add guest to temporary session state
  const handleAddGuest = () => {
    let name = "";
    let memberId = "";

    if (selectedGuestId) {
      const gMem = guestMembers.find((m) => m.id === selectedGuestId);
      if (gMem) {
        name = gMem.name;
        memberId = gMem.id;
      }
    } else if (customGuestName.trim()) {
      name = customGuestName.trim();
      memberId = `guest_quick_${quickGuestSequence.current}`;
      quickGuestSequence.current += 1;
    } else {
      toast("Vui lòng chọn thành viên vãng lai hoặc nhập tên vãng lai mới!", "warning");
      return;
    }

    // Check if guest already added
    if (sessionGuests.some((g) => g.memberId === memberId || (memberId.startsWith("guest_quick") && g.name === name))) {
      toast("Thành viên vãng lai này đã được thêm vào danh sách!", "warning");
      return;
    }

    const newGuestAtt: GuestAttendanceView = {
      memberId,
      name,
      paidAmount: Number(guestPaidAmount) || 0,
    };

    setSessionGuests((prev) => [...prev, newGuestAtt]);
    
    // Clear inputs
    setSelectedGuestId("");
    setCustomGuestName("");
    toast(`Đã thêm vãng lai: ${name}`, "success");
  };

  // Remove guest from temporary session state
  const handleRemoveGuest = (memberId: string) => {
    setSessionGuests((prev) => prev.filter((g) => g.memberId !== memberId));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      toast("Vui lòng nhập ngày chơi!", "warning");
      return;
    }

    // Ensure session date matches current monthId YYYY-MM
    if (!date.startsWith(currentMonthId)) {
      toast(
        `Ngày chơi (${formatDate(date)}) phải thuộc tháng đang quản lý (${currentMonthId})!`,
        "error",
        "Sai tháng"
      );
      return;
    }

    const resolvedGuests = sessionGuests.map((g) => {
      if (!g.memberId.startsWith("guest_quick_")) return g;
      const existing = members.find(
        (m) => m.type === "guest" && m.name.toLowerCase() === g.name.toLowerCase() && m.status === "active"
      );
      return existing ? { ...g, memberId: existing.id } : g;
    });

    const sessionData = {
      monthId: currentMonthId,
      session_date: date,
      courtFee: Number(courtFee) || 0,
      shuttlecockFee: Number(shuttlecockFee) || 0,
      otherFee: Number(otherFee) || 0,
      guestFeePerPerson: Number(guestFeePerPerson) || 0,
      attendance,
      guests: resolvedGuests,
      notes: notes.trim(),
    };

    if (editingSession) {
      await updateSession({
        ...editingSession,
        ...sessionData,
      });
      toast(`Đã cập nhật buổi chơi ngày ${formatDate(date)}!`, "success", "Thành công");
    } else {
      await addSession(sessionData);
      toast(`Đã thêm buổi chơi ngày ${formatDate(date)} thành công!`, "success", "Thành công");
    }

    setIsModalOpen(false);
  };

  const handleDeleteSession = (id: string, sDate: string) => {
    setDeleteSessionId(id);
    setDeleteSessionDate(sDate);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 font-sans">
            Ghi Nhận Buổi Chơi
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-sans">
            Nhật ký điểm danh thành viên cố định, thu tiền vãng lai và thống kê chi phí thực tế.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer text-sm font-sans"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          Ghi nhận buổi mới
        </button>
      </div>

      {/* Main content grid */}
      {monthSessions.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mx-auto text-zinc-400">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 font-sans">
              Chưa có buổi chơi nào
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-sans">
              Hiện chưa ghi nhận buổi chơi nào trong tháng này. Hãy bấm Ghi nhận buổi mới để bắt đầu theo dõi thu chi.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {monthSessions.map((session) => {
            const guestRev = session.guests.reduce((sum, g) => sum + g.paidAmount, 0);
            const totalSessionCost = session.courtFee + session.shuttlecockFee + session.otherFee;
            return (
              <div
                key={session.id}
                className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-950 dark:text-white font-bold font-sans">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    {formatDate(session.session_date)}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(session)}
                      className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                      title="Sửa buổi chơi"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSession(session.id, session.session_date)}
                      className="p-1.5 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                      title="Xóa buổi chơi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 space-y-4 flex-1">
                  {/* Financial items */}
                  <div className="grid grid-cols-2 gap-3 text-xs border-b border-dashed border-zinc-100 dark:border-zinc-900 pb-3">
                    <div className="space-y-0.5">
                      <span className="text-zinc-400 font-sans font-medium">Tiền sân:</span>
                      <p className="font-semibold text-zinc-800 dark:text-zinc-200 font-sans">{formatVND(session.courtFee)}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-zinc-400 font-sans font-medium">Tiền cầu:</span>
                      <p className="font-semibold text-zinc-800 dark:text-zinc-200 font-sans">{formatVND(session.shuttlecockFee)}</p>
                    </div>
                    {session.otherFee > 0 && (
                      <div className="space-y-0.5 col-span-2">
                        <span className="text-zinc-400 font-sans font-medium">Phát sinh khác:</span>
                        <p className="font-semibold text-amber-500 font-sans">{formatVND(session.otherFee)}</p>
                      </div>
                    )}
                  </div>

                  {/* Attendance brief */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-sans font-medium">
                      <Users className="w-3.5 h-3.5" />
                      Sĩ số tham gia:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md font-semibold font-sans">
                        {session.attendance.length} Cố định
                      </span>
                      <span className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-md font-semibold font-sans">
                        {session.guests.length} Vãng lai
                      </span>
                    </div>
                  </div>

                  {/* Notes if any */}
                  {session.notes && (
                    <div className="bg-zinc-50 dark:bg-zinc-900 p-2.5 rounded-xl text-xs text-zinc-500 dark:text-zinc-400 font-sans italic border border-zinc-100 dark:border-zinc-900/50">
                      {session.notes}
                    </div>
                  )}
                </div>

                {/* Card Footer Summary */}
                <div className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/20 dark:bg-zinc-950/20 grid grid-cols-2 gap-4">
                  <div className="text-xs">
                    <span className="text-zinc-400 font-sans block mb-0.5">Tổng Chi Thực:</span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-sans">
                      {formatVND(totalSessionCost)}
                    </span>
                  </div>
                  <div className="text-xs text-right">
                    <span className="text-zinc-400 font-sans block mb-0.5">Đã Thu Vãng Lai:</span>
                    <span className="text-sm font-bold text-emerald-500 font-sans">
                      +{formatVND(guestRev)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Play Session Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSession ? "Cập nhật thông tin buổi chơi" : "Ghi nhận buổi chơi mới"}
        className="max-w-2xl"
        isDirty={isSessionDirty}
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5 font-sans">
                Ngày chơi
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5 font-sans">
                Tiền sân thực tế (VND)
              </label>
              <input
                type="number"
                value={courtFee}
                onChange={(e) => setCourtFee(e.target.value)}
                required
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5 font-sans">
                Tiền cầu thực tế (VND)
              </label>
              <input
                type="number"
                value={shuttlecockFee}
                onChange={(e) => setShuttlecockFee(e.target.value)}
                required
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5 font-sans">
                Chi phí phát sinh khác (VND)
              </label>
              <input
                type="number"
                value={otherFee}
                onChange={(e) => setOtherFee(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5 font-sans">
                Giá vãng lai áp dụng (VND)
              </label>
              <input
                type="number"
                value={guestFeePerPerson}
                onChange={(e) => setGuestFeePerPerson(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 font-sans"
              />
            </div>
          </div>

          {/* Fixed Member Attendance */}
          <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-900 pt-4">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-zinc-950 dark:text-zinc-200 uppercase tracking-wider font-sans">
                Điểm danh cố định ({attendance.length}/{fixedMembers.length} có mặt)
              </label>
              <button
                type="button"
                onClick={handleSelectAllAttendance}
                className="text-xs text-emerald-500 hover:text-emerald-600 font-bold font-sans cursor-pointer transition-colors"
              >
                {attendance.length === fixedMembers.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
            </div>

            {fixedMembers.length === 0 ? (
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl flex items-center gap-2 text-xs text-amber-500 border border-amber-100 dark:border-amber-950/20 font-sans">
                <ShieldAlert className="w-4 h-4" />
                Chưa có thành viên cố định hoạt động trên hệ thống để điểm danh!
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-850">
                {fixedMembers.map((m) => {
                  const isChecked = attendance.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleToggleAttendance(m.id)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-all duration-150 cursor-pointer font-medium font-sans border",
                        isChecked
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold"
                          : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                      )}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-all",
                          isChecked
                            ? "bg-emerald-500 border-emerald-500 text-black"
                            : "border-zinc-300 dark:border-zinc-700"
                        )}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">{m.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Guest Attendance Log */}
          <div className="space-y-3 border-t border-zinc-100 dark:border-zinc-900 pt-4">
            <label className="block text-xs font-bold text-zinc-950 dark:text-zinc-200 uppercase tracking-wider font-sans">
              Thành viên vãng lai tham gia ({sessionGuests.length} người)
            </label>

            {/* Inline Add Guest Controls */}
            <div className="bg-zinc-50 dark:bg-zinc-900 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-850 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Dropdown existing guest members */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-sans">
                    Chọn khách lưu sẵn
                  </label>
                  <select
                    value={selectedGuestId}
                    onChange={(e) => {
                      setSelectedGuestId(e.target.value);
                      if (e.target.value) setCustomGuestName(""); // Clear custom name if selected from dropdown
                    }}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-sans"
                  >
                    <option value="">-- Chọn thành viên vãng lai --</option>
                    {guestMembers.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom quick name */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-sans">
                    Hoặc nhập tên nhanh
                  </label>
                  <input
                    type="text"
                    placeholder="Tên khách vãng lai..."
                    value={customGuestName}
                    onChange={(e) => {
                      setCustomGuestName(e.target.value);
                      if (e.target.value) setSelectedGuestId(""); // Clear dropdown if custom name written
                    }}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-sans"
                  />
                </div>

                {/* Paid amount */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-sans">
                    Tiền đóng buổi này (nhập 0 nếu nợ)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={guestPaidAmount}
                      onChange={(e) => setGuestPaidAmount(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-sans"
                    />
                    <button
                      type="button"
                      onClick={handleAddGuest}
                      className="px-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg text-xs transition-colors flex-shrink-0 cursor-pointer font-sans"
                    >
                      Thêm
                    </button>
                  </div>
                </div>
              </div>

              {/* Added guest list pills */}
              {sessionGuests.length > 0 && (
                <div className="flex flex-wrap gap-1.5 border-t border-zinc-200 dark:border-zinc-800 pt-3">
                  {sessionGuests.map((g) => (
                    <div
                      key={g.memberId}
                      className="inline-flex items-center gap-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 pl-3 pr-1.5 py-1 rounded-full text-xs font-sans text-zinc-700 dark:text-zinc-300 font-medium"
                    >
                      <span>
                        {g.name} ({formatVND(g.paidAmount)})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGuest(g.memberId)}
                        className="p-0.5 text-zinc-400 hover:text-red-500 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5 font-sans">
              Ghi chú buổi chơi
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập ghi chú (ví dụ: tiền nước, sân phụ, giải thưởng...)"
              rows={2}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 font-sans"
            />
          </div>

          {/* Submit */}
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
              Lưu buổi chơi
            </button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={deleteSessionId !== null}
        onClose={() => setDeleteSessionId(null)}
        title="Xác nhận xóa buổi chơi"
        className="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-sans">
            Bạn có chắc chắn muốn xóa buổi chơi ngày <span className="font-bold text-zinc-900 dark:text-zinc-100">{formatDate(deleteSessionDate)}</span>? Hành động này sẽ xóa vĩnh viễn dữ liệu buổi chơi và cập nhật lại thu chi trong tháng.
          </p>
          <div className="flex gap-3 justify-end pt-4 border-t border-zinc-100 dark:border-zinc-900">
            <button
              type="button"
              onClick={() => setDeleteSessionId(null)}
              className="px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => {
                if (deleteSessionId) {
                  void deleteSession(deleteSessionId);
                  toast(`Đã xóa buổi chơi ngày ${formatDate(deleteSessionDate)}`, "info", "Đã xóa");
                }
                setDeleteSessionId(null);
              }}
              className="px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors cursor-pointer"
            >
              Đồng ý xóa
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
