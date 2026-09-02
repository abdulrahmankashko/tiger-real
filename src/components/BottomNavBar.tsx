import React from "react";
import { FolderGit2, Boxes, Repeat, DollarSign } from "lucide-react";
import { TranslationDictionary } from "../translations";

interface BottomNavBarProps {
  activeTab: "dashboard" | "logistics" | "financials";
  setActiveTab: (tab: "dashboard" | "logistics" | "financials") => void;
  userRole: string;
  t: TranslationDictionary;
}

export default function BottomNavBar({ activeTab, setActiveTab, userRole, t }: BottomNavBarProps) {
  // If user is STAFF, they can only access logistics & production.
  // If user is CUSTOMER, they can access dashboard, logistics, production (optional depending on config, but user wanted view access).
  
  const tabs = [
    { id: "dashboard", label: t.tabDashboard, icon: FolderGit2, roles: ["admin", "master_admin", "client"] },
    { id: "logistics", label: t.tabLogistics, icon: Boxes, roles: ["admin", "master_admin", "client"] },
    { id: "financials", label: t.tabFinancials, icon: DollarSign, roles: ["admin", "master_admin", "client"] },
  ] as const;

  const visibleTabs = tabs.filter(tab => (tab.roles as readonly string[]).includes(userRole));

  return (
    <div id="bottom-navbar" className="absolute bottom-0 inset-x-0 bg-white border-t border-slate-100 h-20 px-4 flex items-center justify-around shadow-lg z-10 shrink-0">
      {visibleTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`nav-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all cursor-pointer ${
              isActive
                ? "text-indigo-600 bg-indigo-50/70 scale-105 font-bold"
                : "text-slate-400 hover:text-slate-600 font-medium"
            }`}
          >
            <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5px]" : "stroke-[2px]"}`} />
            <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
