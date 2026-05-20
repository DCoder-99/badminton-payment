"use client";

import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertCircle,
  Users,
  Calendar,
  Flame,
  ArrowRight
} from "lucide-react";
import { useBadmintonStore } from "../../store/badmintonStore";
import { formatVND } from "../../lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

interface DashboardTabProps {
  setActiveTab: (tab: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ setActiveTab }) => {
  const { currentMonthId, getMonthSummary, getClubFund, sessions, members } = useBadmintonStore();

  const summary = getMonthSummary(currentMonthId);
  const clubFund = getClubFund();

  // Find current month's sessions
  const currentMonthSessions = sessions
    .filter((s) => s.monthId === currentMonthId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Recharts Data Setup
  const chartData = [
    {
      name: "Tiền Sân",
      "Dự Kiến": summary.expectedCourtFee,
      "Thực Tế": summary.actualCourtFee,
    },
    {
      name: "Tiền Cầu",
      "Dự Kiến": summary.expectedShuttlecockFee,
      "Thực Tế": summary.actualShuttlecockFee,
    },
    {
      name: "Tổng Chi",
      "Dự Kiến": summary.expectedTotal,
      "Thực Tế": summary.actualTotal,
    },
  ];

  // Calculate total guest visits
  const totalGuestVisits = sessions
    .filter((s) => s.monthId === currentMonthId)
    .reduce((sum, s) => sum + s.guests.length, 0);

  const stats = [
    {
      title: "Tổng Chi Tháng",
      value: formatVND(summary.actualTotal),
      sub: `Dự tính: ${formatVND(summary.expectedTotal)}`,
      icon: TrendingDown,
      color: "text-red-500 bg-red-500/10 dark:bg-red-500/20",
    },
    {
      title: "Tổng Thu Tháng",
      value: formatVND(summary.totalRevenue),
      sub: `Cố định: ${formatVND(summary.totalFixedPaid)} | Vãng lai: ${formatVND(summary.guestRevenue)}`,
      icon: TrendingUp,
      color: "text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20",
    },
    {
      title: "Quỹ CLB Hiện Tại",
      value: formatVND(clubFund),
      sub: "Tích lũy từ trước tới nay",
      icon: Wallet,
      color: "text-blue-500 bg-blue-500/10 dark:bg-blue-500/20",
    },
    {
      title: "Công Nợ Chưa Thu",
      value: formatVND(summary.totalDeficit),
      sub: "Cần thu thêm của thành viên",
      icon: AlertCircle,
      color: "text-amber-500 bg-amber-500/10 dark:bg-amber-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-zinc-900 text-white p-6 rounded-2xl border border-zinc-800 shadow-xl overflow-hidden relative">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="space-y-1">
          <h2 className="text-xl font-bold font-sans flex items-center gap-2">
            Hệ Thống Quản Lý Câu Lạc Bộ <Flame className="w-5 h-5 text-emerald-400 fill-emerald-400" />
          </h2>
          <p className="text-zinc-400 text-sm font-sans">
            Thống kê tình hình chi phí, quỹ chung và công nợ của hội.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 bg-emerald-500 text-black px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20">
          Chỉ số tháng đang chọn: {currentMonthId.split("-")[1]}/{currentMonthId.split("-")[0]}
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-sans">
                  {stat.title}
                </span>
                <div className={`p-2.5 rounded-xl ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight font-sans">
                  {stat.value}
                </h3>
                <p className="text-xs text-zinc-400 font-medium mt-1 font-sans">
                  {stat.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Center Layout: Charts and Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Card */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 font-sans">
              So Sánh Thu Chi & Dự Tính
            </h3>
            <span className="text-xs text-zinc-400 font-sans">
              Đơn vị: VND
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272A" className="hidden dark:block" />
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip
                  formatter={(value: any) => formatVND(value)}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e4e4e7",
                    fontSize: "12px",
                    fontFamily: "Arial",
                  }}
                  itemStyle={{
                    fontFamily: "Arial",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", fontFamily: "Arial" }} />
                <Bar
                  dataKey="Dự Kiến"
                  fill="#71717a"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={50}
                />
                <Bar
                  dataKey="Thực Tế"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Small Analytics Indicators & Recent Sessions */}
        <div className="space-y-6 lg:col-span-1">
          {/* Quick Metrics */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 font-sans">
              Thông Số Buổi Chơi
            </h3>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400 font-sans">
                  Số Buổi
                </span>
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-sans mt-1">
                  {summary.sessionCount}
                </p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400 font-sans">
                  Cố Định
                </span>
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-sans mt-1">
                  {summary.activeFixedCount}
                </p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400 font-sans">
                  Lượt Vãng
                </span>
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-sans mt-1">
                  {totalGuestVisits}
                </p>
              </div>
            </div>

            <div className="border-t border-zinc-100 dark:border-zinc-900 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 font-sans">Prepaid cố định/người</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-200 font-sans">
                  {formatVND(summary.prepaidAmountPerFixedMember)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 font-sans">Phát sinh ròng tháng này</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-200 font-sans">
                  {formatVND(summary.netExtraCost)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 font-sans">Đóng thêm/người</span>
                <span className="font-semibold text-amber-500 font-sans">
                  + {formatVND(summary.extraFeePerFixedMember)}
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-2 font-bold">
                <span className="text-zinc-950 dark:text-white font-sans">Tổng tiền cố định</span>
                <span className="text-emerald-500 font-sans">
                  {formatVND(summary.totalDuePerFixedMember)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Layout: Recent sessions list */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 font-sans">
              Các Buổi Chơi Gần Nhất
            </h3>
          </div>
          <button
            onClick={() => setActiveTab("sessions")}
            className="text-xs text-emerald-500 hover:text-emerald-600 font-bold font-sans flex items-center gap-1 cursor-pointer transition-colors"
          >
            Quản lý buổi chơi <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {currentMonthSessions.length === 0 ? (
          <div className="text-center py-8 text-zinc-400 font-sans border-2 border-dashed border-zinc-100 dark:border-zinc-900 rounded-xl">
            Chưa có buổi chơi nào được ghi nhận trong tháng này.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-900 text-zinc-400 font-semibold">
                  <th className="py-3 px-4 font-sans">Ngày chơi</th>
                  <th className="py-3 px-4 font-sans">Tiền sân</th>
                  <th className="py-3 px-4 font-sans">Tiền cầu</th>
                  <th className="py-3 px-4 font-sans">Thu vãng lai</th>
                  <th className="py-3 px-4 font-sans">Sĩ số</th>
                  <th className="py-3 px-4 font-sans">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {currentMonthSessions.slice(0, 4).map((s) => {
                  const guestRevenue = s.guests.reduce((sum, g) => sum + g.paidAmount, 0);
                  const attendeeCount = s.attendance.length;
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 text-zinc-700 dark:text-zinc-300 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium dark:text-zinc-200 font-sans">
                        {s.date.split("-")[2]}/{s.date.split("-")[1]}/{s.date.split("-")[0]}
                      </td>
                      <td className="py-3.5 px-4 font-sans">{formatVND(s.courtFee)}</td>
                      <td className="py-3.5 px-4 font-sans">{formatVND(s.shuttlecockFee)}</td>
                      <td className="py-3.5 px-4 text-emerald-500 font-semibold font-sans">
                        +{formatVND(guestRevenue)}
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        {attendeeCount} Cố định | {s.guests.length} Vãng lai
                      </td>
                      <td className="py-3.5 px-4 text-xs font-sans max-w-[200px] truncate" title={s.notes}>
                        {s.notes || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
