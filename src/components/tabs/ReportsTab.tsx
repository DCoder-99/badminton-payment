"use client";

import { TrendingDown, TrendingUp, Wallet, Receipt, Award, Landmark, PieChart as ChartIcon, Printer, FileSpreadsheet } from "lucide-react";
import { useBadmintonStore } from "../../store/badmintonStore";
import { formatVND, cn } from "../../lib/utils";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

export const ReportsTab: React.FC = () => {
  const { currentMonthId, getMonthSummary, getClubFund, monthlyConfigs, sessions, payments, members } = useBadmintonStore();

  const summary = getMonthSummary(currentMonthId);
  const clubFund = getClubFund();

  // Find currently active month metadata
  const currentMonthObj = monthlyConfigs.find((m) => m.id === currentMonthId) || monthlyConfigs[0];

  // 1. All-time global metrics calculations
  const totalAllTimeExpenses = sessions.reduce(
    (sum, s) => sum + s.courtFee + s.shuttlecockFee + s.otherFee,
    0
  );
  const totalAllTimeFixedRevenues = payments.reduce((sum, p) => sum + p.amountPaid, 0);
  const totalAllTimeGuestRevenues = sessions.reduce(
    (sum, s) => sum + s.guests.reduce((gSum, g) => gSum + g.paidAmount, 0),
    0
  );
  const totalAllTimeRevenues = totalAllTimeFixedRevenues + totalAllTimeGuestRevenues;

  // 2. Recharts Expense Breakdown Data
  const expenseData = [
    { name: "Tiền sân", value: summary.actualCourtFee, color: "#10b981" },
    { name: "Tiền cầu", value: summary.actualShuttlecockFee, color: "#3b82f6" },
    { name: "Phát sinh khác", value: summary.actualOtherFee, color: "#f59e0b" },
  ].filter((item) => item.value > 0);

  // 3. Recharts Revenue Breakdown Data
  const revenueData = [
    { name: "Thu cố định", value: summary.totalFixedPaid, color: "#8b5cf6" },
    { name: "Thu vãng lai", value: summary.guestRevenue, color: "#ec4899" },
  ].filter((item) => item.value > 0);

  // Profit / Deficit of current month
  const monthNetProfit = summary.totalRevenue - summary.actualTotal;

  const handleExportCSV = () => {
    // Read FRESH data directly from store at click time to avoid stale closure / SSR hydration issues
    const storeState = useBadmintonStore.getState();
    const freshSessions = storeState.sessions;
    const freshPayments = storeState.payments;
    const freshMembers = storeState.members;
    const freshMonthId = storeState.currentMonthId;
    const freshMonthlyConfigs = storeState.monthlyConfigs;
    const freshSummary = storeState.getMonthSummary(freshMonthId);
    const freshClubFund = storeState.getClubFund();

    const freshMonthObj = freshMonthlyConfigs.find((m) => m.id === freshMonthId) || freshMonthlyConfigs[0];

    // Compute all-time metrics fresh
    const freshTotalAllTimeExpenses = freshSessions.reduce(
      (sum, s) => sum + s.courtFee + s.shuttlecockFee + s.otherFee, 0
    );
    const freshTotalAllTimeFixedRevenues = freshPayments.reduce((sum, p) => sum + p.amountPaid, 0);
    const freshTotalAllTimeGuestRevenues = freshSessions.reduce(
      (sum, s) => sum + s.guests.reduce((gSum, g) => gSum + g.paidAmount, 0), 0
    );
    const freshTotalAllTimeRevenues = freshTotalAllTimeFixedRevenues + freshTotalAllTimeGuestRevenues;
    const freshMonthNetProfit = freshSummary.totalRevenue - freshSummary.actualTotal;

    const BOM = "\uFEFF"; // Vietnamese UTF-8 encoding support
    let csvContent = "";

    // Title
    csvContent += `BÁO CÁO TÀI CHÍNH CHI TIẾT - ${freshMonthObj?.name || freshMonthId}\n`;
    csvContent += `Ngày xuất báo cáo: ${new Date().toLocaleDateString("vi-VN")}\n\n`;

    // Global Metrics
    csvContent += `TỔNG QUAN TÀI CHÍNH HỘI\n`;
    csvContent += `Quỹ két tích lũy:;${freshClubFund} ₫\n`;
    csvContent += `Tổng thu tích lũy toàn thời gian:;${freshTotalAllTimeRevenues} ₫\n`;
    csvContent += `Tổng chi tích lũy toàn thời gian:;${freshTotalAllTimeExpenses} ₫\n\n`;

    // Month Metrics
    csvContent += `TÌNH HÌNH THÁNG NÀY (${freshMonthObj?.name || freshMonthId})\n`;
    csvContent += `Tổng chi thực tế:;${freshSummary.actualTotal} ₫\n`;
    csvContent += `Tổng thu hiện tại:;${freshSummary.totalRevenue} ₫\n`;
    csvContent += `Cân đối thu chi:;${freshMonthNetProfit} ₫ (${freshMonthNetProfit >= 0 ? "Dư thừa" : "Thiếu hụt"})\n\n`;

    // Expense breakdown
    csvContent += `CHI TIẾT KHOẢN CHI THÁNG NÀY\n`;
    csvContent += `Danh mục;Số tiền\n`;
    csvContent += `Tiền thuê sân cầu;${freshSummary.actualCourtFee} ₫\n`;
    csvContent += `Tiền mua cầu lông;${freshSummary.actualShuttlecockFee} ₫\n`;
    csvContent += `Chi phí nước & phát sinh;${freshSummary.actualOtherFee} ₫\n`;
    csvContent += `TỔNG CỘNG CHI;${freshSummary.actualTotal} ₫\n\n`;

    // Revenue breakdown
    csvContent += `CHI TIẾT KHOẢN THU THÁNG NÀY\n`;
    csvContent += `Danh mục;Số tiền\n`;
    csvContent += `Cố định đã nộp quỹ;${freshSummary.totalFixedPaid} ₫\n`;
    csvContent += `Thu từ lượt vãng lai;${freshSummary.guestRevenue} ₫\n`;
    csvContent += `Cố định còn nợ (Chưa nộp);${freshSummary.totalDeficit} ₫\n`;
    csvContent += `TỔNG CỘNG THU;${freshSummary.totalRevenue} ₫\n\n`;

    // Fixed members ledger
    csvContent += `SỔ CÁI ĐÓNG GÓP THÀNH VIÊN CỐ ĐỊNH\n`;
    csvContent += `Họ và tên;Phải đóng;Đã nộp;Còn thiếu;Trạng thái\n`;
    const fixedMembers = freshMembers.filter((m) => m.type === "fixed" && m.status === "active");
    fixedMembers.forEach((m) => {
      const paymentObj = freshPayments.find((p) => p.memberId === m.id && p.monthId === freshMonthId);
      const paid = paymentObj ? paymentObj.amountPaid : 0;
      const remaining = Math.max(0, freshSummary.totalDuePerFixedMember - paid);
      const status = paid >= freshSummary.totalDuePerFixedMember ? "Đã đóng đủ" : paid > 0 ? "Một phần" : "Chưa đóng";
      csvContent += `${m.name};${freshSummary.totalDuePerFixedMember};${paid};${remaining};${status}\n`;
    });
    csvContent += `\n`;

    // Guest ledger
    csvContent += `SỔ CÁI ĐÓNG GÓP KHÁCH VÃNG LAI\n`;
    csvContent += `Họ và tên;Số buổi tham gia;Tổng phải đóng;Đã nộp;Còn thiếu;Trạng thái\n`;
    const monthSessions = freshSessions.filter((s) => s.monthId === freshMonthId);
    const activeGuestMembers = freshMembers.filter((m) => m.type === "guest" && m.status === "active");
    activeGuestMembers.forEach((gMember) => {
      const attended = monthSessions.filter((s) => s.guests.some((g) => g.memberId === gMember.id));
      const totalDue = attended.reduce((sum, s) => sum + s.guestFeePerPerson, 0);
      const paidAtSessions = attended.reduce((sum, s) => {
        const r = s.guests.find((g) => g.memberId === gMember.id);
        return sum + (r ? r.paidAmount : 0);
      }, 0);
      const paymentObj = freshPayments.find((p) => p.memberId === gMember.id && p.monthId === freshMonthId);
      const paidLater = paymentObj ? paymentObj.amountPaid : 0;
      const totalPaid = paidAtSessions + paidLater;
      const remaining = Math.max(0, totalDue - totalPaid);
      const status = totalPaid >= totalDue ? "Đã đóng đủ" : totalPaid > 0 ? "Một phần" : "Chưa đóng";
      csvContent += `${gMember.name};${attended.length};${totalDue};${totalPaid};${remaining};${status}\n`;
    });

    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bao_cao_tai_chinh_${freshMonthId}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Printable Header - Visible ONLY when printing */}
      <div className="hidden print:block border-b border-zinc-200 pb-4 mb-6">
        <h1 className="text-2xl font-black text-black font-sans">
          BÁO CÁO TÀI CHÍNH CLB CẦU LÔNG
        </h1>
        <p className="text-sm text-zinc-650 font-sans mt-1">
          Bảng sao kê chi tiết tình hình thu chi & công nợ quỹ hội - {currentMonthObj?.name || currentMonthId}
        </p>
        <p className="text-[10px] text-zinc-400 font-sans mt-2">
          Ngày xuất bản: {new Date().toLocaleDateString("vi-VN")} | CLB V-Badminton Expense Manager
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 font-sans">
            Báo Cáo Tài Chính Chi Tiết
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-sans">
            Bảng phân tích cơ cấu chi phí, nguồn thu nhập và tình trạng dòng tiền của hội.
          </p>
        </div>
        
        {/* Export action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 font-semibold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-all text-xs font-sans shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            In báo cáo (PDF)
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl transition-all text-xs font-sans shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Xuất Excel (CSV)
          </button>
        </div>
      </div>

      {/* Cumulative global club box */}
      <div className="bg-zinc-900 dark:bg-black text-white p-6 rounded-2xl border border-zinc-800 shadow-xl overflow-hidden relative">
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-4 font-sans">
          <Landmark className="w-4 h-4 text-emerald-400" /> Tích Lũy Toàn Thời Gian (Lũy kế)
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-1">
            <span className="text-xs text-zinc-400 font-sans">Tổng chi tích lũy:</span>
            <p className="text-xl font-bold text-red-400 font-sans">{formatVND(totalAllTimeExpenses)}</p>
          </div>
          <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-zinc-800 pt-4 sm:pt-0 sm:pl-6">
            <span className="text-xs text-zinc-400 font-sans">Tổng thu tích lũy:</span>
            <p className="text-xl font-bold text-emerald-400 font-sans">{formatVND(totalAllTimeRevenues)}</p>
            <span className="text-[10px] text-zinc-500 block">
              Cố định: {formatVND(totalAllTimeFixedRevenues)} | Vãng lai: {formatVND(totalAllTimeGuestRevenues)}
            </span>
          </div>
          <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-zinc-800 pt-4 sm:pt-0 sm:pl-6">
            <span className="text-xs text-zinc-400 font-sans">Quỹ dư trong két:</span>
            <p className="text-2xl font-black text-emerald-400 font-sans">{formatVND(clubFund)}</p>
          </div>
        </div>
      </div>

      {/* Month Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ledger table */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-xs lg:col-span-2 space-y-6">
          <div className="border-b border-zinc-100 dark:border-zinc-900 pb-3">
            <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-200 font-sans">
              Sao Kê Thu Chi Chi Tiết: {currentMonthObj?.name}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Expenses breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                <TrendingDown className="w-4 h-4" /> Danh mục chi
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-900 py-1.5">
                  <span className="text-zinc-500 font-sans">Tiền thuê sân cầu:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-sans">
                    {formatVND(summary.actualCourtFee)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-900 py-1.5">
                  <span className="text-zinc-500 font-sans">Tiền mua cầu lông:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-sans">
                    {formatVND(summary.actualShuttlecockFee)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-900 py-1.5">
                  <span className="text-zinc-500 font-sans">Chi phí nước & phát sinh:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-sans">
                    {formatVND(summary.actualOtherFee)}
                  </span>
                </div>
                <div className="flex justify-between py-2 font-bold border-t border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-900 dark:text-zinc-100 font-sans">TỔNG CHI THỰC TẾ</span>
                  <span className="text-red-500 font-sans">{formatVND(summary.actualTotal)}</span>
                </div>
              </div>
            </div>

            {/* Revenues breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                <TrendingUp className="w-4 h-4" /> Danh mục thu
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-900 py-1.5">
                  <span className="text-zinc-500 font-sans">Cố định đã nộp quỹ:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-sans">
                    {formatVND(summary.totalFixedPaid)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-900 py-1.5">
                  <span className="text-zinc-500 font-sans">Thu từ lượt vãng lai:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-sans">
                    {formatVND(summary.guestRevenue)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-900 py-1.5">
                  <span className="text-zinc-400 font-sans font-medium">Cố định còn nợ (Chưa nộp):</span>
                  <span className="font-semibold text-amber-500 font-sans">
                    {formatVND(summary.totalDeficit)}
                  </span>
                </div>
                <div className="flex justify-between py-2 font-bold border-t border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-900 dark:text-zinc-100 font-sans">TỔNG THU HIỆN TẠI</span>
                  <span className="text-emerald-500 font-sans">{formatVND(summary.totalRevenue)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net balance row of the month */}
          <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="text-xs">
              <span className="text-zinc-400 font-sans block">Cân đối thu chi tháng này (Thu nhập ròng):</span>
              <span className="text-zinc-500 font-sans">Tổng thu tháng - Tổng chi tháng</span>
            </div>
            <div className={cn(
              "px-4 py-2 rounded-xl font-bold font-sans text-sm",
              monthNetProfit >= 0
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-red-500/10 text-red-500"
            )}>
              {monthNetProfit >= 0 ? `Dư thừa: +${formatVND(monthNetProfit)}` : `Thiếu hụt: ${formatVND(monthNetProfit)}`}
            </div>
          </div>
        </div>

        {/* Small column for Month Details */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-xs space-y-6">
          <div className="border-b border-zinc-100 dark:border-zinc-900 pb-3 flex items-center gap-2">
            <ChartIcon className="w-4 h-4 text-emerald-500" />
            <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-200 font-sans">
              Cơ Cấu Thu & Chi Tháng
            </h3>
          </div>

          {expenseData.length === 0 && revenueData.length === 0 ? (
            <div className="text-center py-10 text-zinc-400 text-xs font-sans">
              Chưa có dữ liệu giao dịch tháng này để vẽ biểu đồ cơ cấu!
            </div>
          ) : (
            <div className="space-y-6">
              {/* Expense pie chart */}
              {expenseData.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-sans">
                    Cơ cấu khoản chi thực tế
                  </span>
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseData}
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={45}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {expenseData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any) => formatVND(v)} wrapperStyle={{ fontSize: "10px", fontFamily: "Arial" }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", fontFamily: "Arial" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Revenue pie chart */}
              {revenueData.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-sans">
                    Cơ cấu nguồn thu thực tế
                  </span>
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={revenueData}
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={45}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {revenueData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any) => formatVND(v)} wrapperStyle={{ fontSize: "10px", fontFamily: "Arial" }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", fontFamily: "Arial" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
