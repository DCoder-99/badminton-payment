"use client";

import React, { useState } from "react";
import { Search, Receipt, Plus, History, CheckCircle, HelpCircle, AlertCircle, FileText, Trash2 } from "lucide-react";
import { useBadmintonStore } from "../../store/badmintonStore";
import { Member, Payment } from "../../types";
import { useToast } from "../ui/Toast";
import { Dialog } from "../ui/Dialog";
import { formatVND, formatDate } from "../../lib/utils";
import { cn } from "../../lib/utils";

export const PaymentsTab: React.FC = () => {
  const {
    members,
    payments,
    sessions,
    currentMonthId,
    getMonthSummary,
    recordPaymentInstallment,
    deletePaymentInstallment,
  } = useBadmintonStore();

  const { toast } = useToast();

  const summary = getMonthSummary(currentMonthId);
  const monthSessions = sessions.filter((s) => s.monthId === currentMonthId);

  // Toggle state between fixed members and guest members
  const [memberTypeTab, setMemberTypeTab] = useState<"fixed" | "guest">("fixed");

  // Filter & search states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "partial" | "unpaid" | "no_participation">("all");

  // Record Payment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMember, setActiveMember] = useState<Member | null>(null);

  // New Installment input state
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [initialPayAmount, setInitialPayAmount] = useState("");
  const [initialPayNote, setInitialPayNote] = useState("");

  const isPaymentModalDirty = payAmount !== initialPayAmount || payNote !== initialPayNote;

  const activeFixedMembers = members.filter((m) => m.type === "fixed" && m.status === "active");
  const activeGuestMembers = members.filter((m) => m.type === "guest" && m.status === "active");

  const openPaymentModal = (member: Member, outstandingAmount: number, totalDue: number) => {
    setActiveMember(member);
    const defaultVal = outstandingAmount > 0 
      ? outstandingAmount 
      : (totalDue > 0 ? totalDue : (member.type === "fixed" ? 500000 : 60000));
    setPayAmount(String(defaultVal));
    setInitialPayAmount(String(defaultVal));
    const defaultNote = member.type === "fixed" ? "Nộp tiền quỹ tháng" : "Thanh toán nợ vãng lai";
    setPayNote(defaultNote);
    setInitialPayNote(defaultNote);
    setIsModalOpen(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMember) return;

    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      toast("Vui lòng nhập số tiền thanh toán hợp lệ!", "warning");
      return;
    }

    recordPaymentInstallment(activeMember.id, currentMonthId, amount, payNote.trim());
    
    toast(
      `Đã ghi nhận thanh toán ${formatVND(amount)} cho thành viên ${activeMember.name}!`,
      "success",
      "Ghi nhận thành công"
    );
    setIsModalOpen(false);
  };

  // Compile member billing lists with calculated statuses
  const memberBillings = activeFixedMembers
    .map((member) => {
      const paymentObj = payments.find(
        (p) => p.memberId === member.id && p.monthId === currentMonthId
      );
      
      const prepaid = summary.prepaidAmountPerFixedMember;
      const extra = summary.extraFeePerFixedMember;
      const totalDue = summary.totalDuePerFixedMember;
      const amountPaid = paymentObj ? paymentObj.amountPaid : 0;
      const remaining = Math.max(0, totalDue - amountPaid);
      const history = paymentObj ? paymentObj.history : [];

      let status: "paid" | "partial" | "unpaid" = "unpaid";
      if (amountPaid >= totalDue) {
        status = "paid";
      } else if (amountPaid > 0) {
        status = "partial";
      }

      return {
        member,
        prepaid,
        extra,
        totalDue,
        amountPaid,
        remaining,
        status,
        history,
      };
    })
    .filter((billing) => {
      const matchesSearch = billing.member.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || billing.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

  // Compile guest billing lists
  const guestBillings = activeGuestMembers
    .map((member) => {
      const attended = monthSessions.filter((s) => 
        s.guests.some((g) => g.memberId === member.id)
      );
      const sessionsCount = attended.length;
      
      const totalDue = attended.reduce((sum, s) => sum + s.guestFeePerPerson, 0);
      const paidAtSessions = attended.reduce((sum, s) => {
        const guestRec = s.guests.find((g) => g.memberId === member.id);
        return sum + (guestRec ? guestRec.paidAmount : 0);
      }, 0);
      
      const paymentObj = payments.find(
        (p) => p.memberId === member.id && p.monthId === currentMonthId
      );
      const paidLater = paymentObj ? paymentObj.amountPaid : 0;
      const history = paymentObj ? paymentObj.history : [];
      
      const amountPaid = paidAtSessions + paidLater;
      const remaining = Math.max(0, totalDue - amountPaid);
      
      let status: "paid" | "partial" | "unpaid" | "no_participation" = "unpaid";
      if (totalDue === 0) {
        status = "no_participation";
      } else if (amountPaid >= totalDue) {
        status = "paid";
      } else if (amountPaid > 0) {
        status = "partial";
      }

      return {
        member,
        sessionsCount,
        totalDue,
        paidAtSessions,
        paidLater,
        amountPaid,
        remaining,
        status,
        history,
      };
    })
    .filter((billing) => {
      const matchesSearch = billing.member.name.toLowerCase().includes(search.toLowerCase());
      let matchesStatus = true;
      if (statusFilter === "all") {
        matchesStatus = billing.status !== "no_participation";
      } else if (statusFilter === "no_participation") {
        matchesStatus = billing.status === "no_participation";
      } else {
        matchesStatus = billing.status === statusFilter;
      }
      return matchesSearch && matchesStatus;
    });

  // Calculate guest debt total for active guests
  const guestDebtTotal = activeGuestMembers.reduce((sum, member) => {
    const attended = monthSessions.filter((s) => s.guests.some((g) => g.memberId === member.id));
    const totalDue = attended.reduce((sSum, s) => sSum + s.guestFeePerPerson, 0);
    const paidAtSessions = attended.reduce((sSum, s) => {
      const guestRec = s.guests.find((g) => g.memberId === member.id);
      return sSum + (guestRec ? guestRec.paidAmount : 0);
    }, 0);
    const paymentObj = payments.find((p) => p.memberId === member.id && p.monthId === currentMonthId);
    const paidLater = paymentObj ? paymentObj.amountPaid : 0;
    return sum + Math.max(0, totalDue - (paidAtSessions + paidLater));
  }, 0);

  // Active member's billing details for the open modal
  const activeBillingDetails = activeMember
    ? (() => {
        if (activeMember.type === "fixed") {
          const paymentObj = payments.find((p) => p.memberId === activeMember.id && p.monthId === currentMonthId);
          return paymentObj 
            ? { 
                amountPaid: paymentObj.amountPaid, 
                remaining: Math.max(0, summary.totalDuePerFixedMember - paymentObj.amountPaid), 
                totalDue: summary.totalDuePerFixedMember,
                history: paymentObj.history,
                paidAtSessions: 0,
                paidLater: paymentObj.amountPaid
              }
            : { 
                amountPaid: 0, 
                remaining: summary.totalDuePerFixedMember, 
                totalDue: summary.totalDuePerFixedMember,
                history: [],
                paidAtSessions: 0,
                paidLater: 0
              };
        }
        const attended = monthSessions.filter((s) => s.guests.some((g) => g.memberId === activeMember.id));
        const totalDue = attended.reduce((sum, s) => sum + s.guestFeePerPerson, 0);
        const paidAtSessions = attended.reduce((sum, s) => {
          const guestRec = s.guests.find((g) => g.memberId === activeMember.id);
          return sum + (guestRec ? guestRec.paidAmount : 0);
        }, 0);
        const paymentObj = payments.find((p) => p.memberId === activeMember.id && p.monthId === currentMonthId);
        const paidLater = paymentObj ? paymentObj.amountPaid : 0;
        const totalPaid = paidAtSessions + paidLater;
        const history = paymentObj ? paymentObj.history : [];
        return {
          amountPaid: totalPaid,
          remaining: Math.max(0, totalDue - totalPaid),
          totalDue,
          paidAtSessions,
          paidLater,
          history
        };
      })()
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 font-sans">
            Thanh Toán & Công Nợ
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-sans mt-0.5">
            {memberTypeTab === "fixed"
              ? "Quản lý phần đóng góp tiền tháng của các thành viên cố định, hỗ trợ đóng góp nhiều lần."
              : "Quản lý doanh thu chơi ngày của khách vãng lai, theo dõi nợ và thu tiền nợ còn thiếu."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-zinc-100 dark:bg-zinc-900/60 p-1 rounded-xl w-full md:w-auto border border-zinc-200/50 dark:border-zinc-800/50 shadow-xs">
          <button
            onClick={() => {
              setMemberTypeTab("fixed");
              setStatusFilter("all");
              setSearch("");
            }}
            className={cn(
              "flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-semibold font-sans transition-all cursor-pointer",
              memberTypeTab === "fixed"
                ? "bg-white dark:bg-zinc-850 text-zinc-900 dark:text-zinc-50 shadow-xs border border-zinc-200/20"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            )}
          >
            Thành viên cố định
          </button>
          <button
            onClick={() => {
              setMemberTypeTab("guest");
              setStatusFilter("all");
              setSearch("");
            }}
            className={cn(
              "flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-semibold font-sans transition-all cursor-pointer",
              memberTypeTab === "guest"
                ? "bg-white dark:bg-zinc-850 text-zinc-900 dark:text-zinc-50 shadow-xs border border-zinc-200/20"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            )}
          >
            Khách vãng lai
          </button>
        </div>
      </div>

      {/* Overview stats cards */}
      {memberTypeTab === "fixed" ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs">
            <span className="text-xs text-zinc-400 font-sans font-semibold uppercase">Mức Đóng Cố Định/Người</span>
            <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1 font-sans">
              {formatVND(summary.totalDuePerFixedMember)}
            </p>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-1 font-sans">
              Gồm: {formatVND(summary.prepaidAmountPerFixedMember)} dự kiến + {formatVND(summary.extraFeePerFixedMember)} phát sinh
            </span>
          </div>
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs">
            <span className="text-xs text-zinc-400 font-sans font-semibold uppercase text-emerald-500">Đã Thu Cố Định</span>
            <p className="text-xl font-bold text-emerald-500 mt-1 font-sans">
              {formatVND(summary.totalFixedPaid)}
            </p>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-1 font-sans">
              Tiền đóng góp của các thành viên cố định
            </span>
          </div>
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs">
            <span className="text-xs text-zinc-400 font-sans font-semibold uppercase text-amber-500">Tổng Nợ Cố Định</span>
            <p className="text-xl font-bold text-amber-500 mt-1 font-sans">
              {formatVND(summary.totalDeficit - guestDebtTotal)}
            </p>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-1 font-sans">
              Tiền còn nợ chưa thu được
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs">
            <span className="text-xs text-zinc-400 font-sans font-semibold uppercase">Số Buổi Có Khách Vãng Lai</span>
            <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1 font-sans">
              {monthSessions.filter((s) => s.guests.length > 0).length} buổi chơi
            </p>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-1 font-sans">
              Tổng cộng {monthSessions.length} buổi chơi trong tháng này
            </span>
          </div>
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs">
            <span className="text-xs text-zinc-400 font-sans font-semibold uppercase text-emerald-500">Tổng Thu Vãng Lai</span>
            <p className="text-xl font-bold text-emerald-500 mt-1 font-sans">
              {formatVND(summary.guestRevenue)}
            </p>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-1 font-sans">
              Đã thu trực tiếp tại sân + nộp bổ sung
            </span>
          </div>
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs">
            <span className="text-xs text-zinc-400 font-sans font-semibold uppercase text-amber-500">Còn Nợ Vãng Lai</span>
            <p className="text-xl font-bold text-amber-500 mt-1 font-sans">
              {formatVND(guestDebtTotal)}
            </p>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-1 font-sans">
              Khách chơi ngày chưa thanh toán đủ tiền
            </span>
          </div>
        </div>
      )}

      {/* Filter Ledger */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder={memberTypeTab === "fixed" ? "Tìm thành viên cố định..." : "Tìm thành viên vãng lai..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 font-sans"
          />
        </div>

        {/* Filters */}
        <div className="flex bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-xl overflow-x-auto">
          <button
            onClick={() => setStatusFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-colors cursor-pointer whitespace-nowrap",
              statusFilter === "all"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            Tất cả
          </button>
          <button
            onClick={() => setStatusFilter("paid")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-colors cursor-pointer whitespace-nowrap",
              statusFilter === "paid"
                ? "bg-white dark:bg-zinc-800 text-emerald-500 dark:text-emerald-400 shadow-xs"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            Đã đóng đủ
          </button>
          <button
            onClick={() => setStatusFilter("partial")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-colors cursor-pointer whitespace-nowrap",
              statusFilter === "partial"
                ? "bg-white dark:bg-zinc-800 text-amber-500 dark:text-amber-400 shadow-xs"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            Một phần
          </button>
          <button
            onClick={() => setStatusFilter("unpaid")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-colors cursor-pointer whitespace-nowrap",
              statusFilter === "unpaid"
                ? "bg-white dark:bg-zinc-800 text-red-500 dark:text-red-400 shadow-xs"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            Chưa đóng
          </button>
          {memberTypeTab === "guest" && (
            <button
              onClick={() => setStatusFilter("no_participation")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-colors cursor-pointer whitespace-nowrap",
                statusFilter === "no_participation"
                  ? "bg-white dark:bg-zinc-800 text-zinc-400 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              Không chơi
            </button>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
        {memberTypeTab === "fixed" ? (
          memberBillings.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 font-sans border-2 border-dashed border-zinc-100 dark:border-zinc-900 m-4 rounded-xl">
              Không tìm thấy thành viên cố định nào khớp điều kiện.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-900 text-zinc-400 font-semibold bg-zinc-50/50 dark:bg-zinc-900/10">
                    <th className="py-3.5 px-6 font-sans">Thành viên</th>
                    <th className="py-3.5 px-6 font-sans">Tiền dự tính</th>
                    <th className="py-3.5 px-6 font-sans">Phát sinh cuối</th>
                    <th className="py-3.5 px-6 font-sans">Tổng phải đóng</th>
                    <th className="py-3.5 px-6 font-sans">Đã nộp</th>
                    <th className="py-3.5 px-6 font-sans">Còn thiếu</th>
                    <th className="py-3.5 px-6 font-sans">Trạng thái</th>
                    <th className="py-3.5 px-6 text-right font-sans">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {memberBillings.map(({ member, prepaid, extra, totalDue, amountPaid, remaining, status }) => (
                    <tr
                      key={member.id}
                      className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/40 dark:hover:bg-zinc-900/10 text-zinc-700 dark:text-zinc-300 transition-colors"
                    >
                      <td className="py-4 px-6 font-semibold dark:text-zinc-200 font-sans">
                        {member.name}
                      </td>
                      <td className="py-4 px-6 font-sans text-zinc-500 dark:text-zinc-400">
                        {formatVND(prepaid)}
                      </td>
                      <td className="py-4 px-6 font-sans text-zinc-500 dark:text-zinc-400">
                        +{formatVND(extra)}
                      </td>
                      <td className="py-4 px-6 font-bold text-zinc-900 dark:text-zinc-200 font-sans">
                        {formatVND(totalDue)}
                      </td>
                      <td className="py-4 px-6 font-sans text-emerald-500 font-medium">
                        {amountPaid > 0 ? formatVND(amountPaid) : "-"}
                      </td>
                      <td className="py-4 px-6 font-sans font-bold text-amber-500">
                        {remaining > 0 ? formatVND(remaining) : "-"}
                      </td>
                      <td className="py-4 px-6 font-sans">
                        {status === "paid" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 font-sans">
                            <CheckCircle className="w-3 h-3" /> Đã đóng đủ
                          </span>
                        )}
                        {status === "partial" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 font-sans">
                            <HelpCircle className="w-3 h-3" /> Một phần
                          </span>
                        )}
                        {status === "unpaid" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 font-sans">
                            <AlertCircle className="w-3 h-3" /> Chưa đóng
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right font-sans">
                        <button
                          onClick={() => openPaymentModal(member, remaining, totalDue)}
                          className={cn(
                            "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-sans",
                            remaining === 0 && totalDue > 0
                              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800/80"
                              : "bg-emerald-500 hover:bg-emerald-600 text-black shadow-md shadow-emerald-500/5"
                          )}
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          Ghi nhận
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          guestBillings.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 font-sans border-2 border-dashed border-zinc-100 dark:border-zinc-900 m-4 rounded-xl">
              Không tìm thấy thành viên vãng lai nào chơi trong tháng này hoặc khớp điều kiện.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-900 text-zinc-400 font-semibold bg-zinc-50/50 dark:bg-zinc-900/10">
                    <th className="py-3.5 px-6 font-sans">Khách vãng lai</th>
                    <th className="py-3.5 px-6 font-sans">Số buổi tham gia</th>
                    <th className="py-3.5 px-6 font-sans">Tổng phải đóng</th>
                    <th className="py-3.5 px-6 font-sans">Đã nộp</th>
                    <th className="py-3.5 px-6 font-sans">Còn thiếu</th>
                    <th className="py-3.5 px-6 font-sans">Trạng thái</th>
                    <th className="py-3.5 px-6 text-right font-sans">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {guestBillings.map(({ member, sessionsCount, totalDue, paidAtSessions, paidLater, amountPaid, remaining, status }) => (
                    <tr
                      key={member.id}
                      className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/40 dark:hover:bg-zinc-900/10 text-zinc-700 dark:text-zinc-300 transition-colors"
                    >
                      <td className="py-4 px-6 font-semibold dark:text-zinc-200 font-sans">
                        {member.name}
                      </td>
                      <td className="py-4 px-6 font-sans text-zinc-500 dark:text-zinc-400">
                        {sessionsCount} buổi
                      </td>
                      <td className="py-4 px-6 font-bold text-zinc-900 dark:text-zinc-200 font-sans">
                        {formatVND(totalDue)}
                      </td>
                      <td className="py-4 px-6 font-sans text-emerald-500 font-medium">
                        {amountPaid > 0 ? (
                          <div className="flex flex-col">
                            <span>{formatVND(amountPaid)}</span>
                            {paidLater > 0 && (
                              <span className="text-[10px] text-zinc-400 font-normal">
                                (Tại sân: {formatVND(paidAtSessions)} + nộp sau: {formatVND(paidLater)})
                              </span>
                            )}
                          </div>
                        ) : "-"}
                      </td>
                      <td className="py-4 px-6 font-sans font-bold text-amber-500">
                        {remaining > 0 ? formatVND(remaining) : "-"}
                      </td>
                      <td className="py-4 px-6 font-sans">
                        {status === "paid" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 font-sans">
                            <CheckCircle className="w-3 h-3" /> Đã đóng đủ
                          </span>
                        )}
                        {status === "partial" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 font-sans">
                            <HelpCircle className="w-3 h-3" /> Một phần
                          </span>
                        )}
                        {status === "unpaid" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 font-sans">
                            <AlertCircle className="w-3 h-3" /> Chưa đóng
                          </span>
                        )}
                        {status === "no_participation" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-400 dark:text-zinc-500 font-sans">
                            Không tham gia
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right font-sans">
                        {status === "no_participation" ? (
                          <span className="text-xs text-zinc-400 font-sans">Không chơi</span>
                        ) : (
                          <button
                            onClick={() => openPaymentModal(member, remaining, totalDue)}
                            className={cn(
                              "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-sans",
                              remaining === 0 && totalDue > 0
                                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800/80"
                                : "bg-emerald-500 hover:bg-emerald-600 text-black shadow-md shadow-emerald-500/5"
                            )}
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            Thu nợ
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Record Payment Installment Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          activeMember 
            ? activeMember.type === "fixed"
              ? `Thu tiền quỹ: ${activeMember.name}`
              : `Thu nợ vãng lai: ${activeMember.name}`
            : "Ghi nhận đóng tiền"
        }
        className="max-w-lg"
        isDirty={isPaymentModalDirty}
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-5">
          {/* Billing info details */}
          <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-100 dark:border-zinc-850 grid grid-cols-2 gap-4 text-xs font-sans">
            <div>
              <span className="text-zinc-400 block mb-0.5">
                {activeMember?.type === "fixed" ? "Tiền cố định tháng này:" : "Tổng phí vãng lai tháng này:"}
              </span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {activeBillingDetails ? formatVND(activeBillingDetails.totalDue) : formatVND(0)}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 block mb-0.5">Đã đóng tích lũy:</span>
              <span className="font-semibold text-emerald-500">
                {activeBillingDetails ? formatVND(activeBillingDetails.amountPaid) : formatVND(0)}
              </span>
              {activeMember?.type === "guest" && activeBillingDetails && (
                <span className="text-[10px] text-zinc-400 block mt-0.5 font-normal">
                  (Tại sân: {formatVND((activeBillingDetails as any).paidAtSessions || 0)})
                </span>
              )}
            </div>
          </div>

          {/* Previous installments history list */}
          {activeBillingDetails && activeBillingDetails.history.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-sans">
                Lịch sử các đợt đóng ngoài sân bổ sung
              </label>
              <div className="space-y-1.5 max-h-28 overflow-y-auto bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-lg border border-zinc-100 dark:border-zinc-900">
                {activeBillingDetails.history.map((hist) => (
                  <div
                    key={hist.id}
                    className="flex justify-between items-center text-xs p-1.5 bg-white dark:bg-zinc-950 rounded-md border border-zinc-100 dark:border-zinc-900 gap-2"
                  >
                    <div className="flex items-center gap-1 text-zinc-500 truncate flex-1">
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{formatDate(hist.date)} - "{hist.note || "Thanh toán"}"</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-emerald-500">+{formatVND(hist.amount)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (activeMember) {
                            deletePaymentInstallment(activeMember.id, currentMonthId, hist.id);
                            toast(`Đã xóa đợt đóng ${formatVND(hist.amount)} của ${activeMember.name}`, "info", "Đã xóa");
                          }
                        }}
                        className="p-1 text-zinc-400 hover:text-red-500 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                        title="Xóa đợt đóng này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New payment record */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5 font-sans">
              Số tiền nộp đợt này (VND)
            </label>
            <input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="Nhập số tiền..."
              required
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5 font-sans">
              Ghi chú đợt đóng tiền
            </label>
            <input
              type="text"
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
              placeholder={activeMember?.type === "fixed" ? "Ví dụ: Đóng đợt 1 đầu tháng..." : "Ví dụ: Trả nợ tiền buổi chơi..."}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 font-sans"
            />
          </div>

          {/* Submit buttons */}
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
              Ghi nhận giao dịch
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
