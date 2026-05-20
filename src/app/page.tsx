"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { DashboardTab } from "../components/tabs/DashboardTab";
import { MembersTab } from "../components/tabs/MembersTab";
import { SessionsTab } from "../components/tabs/SessionsTab";
import { PaymentsTab } from "../components/tabs/PaymentsTab";
import { ReportsTab } from "../components/tabs/ReportsTab";
import { ToastProvider } from "../components/ui/Toast";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(true); // Default to gorgeous Dark Mode
  const [mounted, setMounted] = useState(false);

  // Avoid Hydration Mismatch by waiting for mount
  useEffect(() => {
    setMounted(true);
    // Read local dark theme preferences if any
    const savedTheme = localStorage.getItem("badminton-theme");
    if (savedTheme === "light") {
      setDarkMode(false);
    }
  }, []);

  // Sync dark class to html document element
  useEffect(() => {
    if (!mounted) return;
    
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("badminton-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("badminton-theme", "light");
    }
  }, [darkMode, mounted]);

  // Loading skeleton layout
  if (!mounted) {
    return (
      <div className="flex h-screen w-full bg-zinc-950 items-center justify-center">
        <div className="space-y-4 text-center">
          {/* Pulsing shuttlecock-like logo */}
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-emerald-500" />
          </div>
          <h2 className="text-sm font-bold text-zinc-200 tracking-wider uppercase animate-pulse">
            Đang tải dữ liệu...
          </h2>
          <div className="w-32 h-1.5 bg-zinc-800 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full animate-progress" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="flex flex-col md:flex-row min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
        {/* Sidebar Left */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        {/* Workspace Right */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto h-screen md:max-h-screen">
          {activeTab === "dashboard" && <DashboardTab setActiveTab={setActiveTab} />}
          {activeTab === "members" && <MembersTab />}
          {activeTab === "sessions" && <SessionsTab />}
          {activeTab === "payments" && <PaymentsTab />}
          {activeTab === "reports" && <ReportsTab />}
        </main>
      </div>
    </ToastProvider>
  );
}
