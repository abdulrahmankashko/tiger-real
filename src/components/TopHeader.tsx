import React from "react";
import { Shield, Sparkles, User, LogOut, Key, Globe, Database, UploadCloud, RefreshCw, KeyRound, Users } from "lucide-react";
import { Language } from "../translations";

interface TopHeaderProps {
  userEmail: string;
  userRole: string;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onLogout?: () => void;
  supabaseStatus: {
    configured: boolean;
    connected: boolean;
    table_exists: boolean;
    error_message: string;
    url: string;
  } | null;
  onOpenSupabaseModal: () => void;
  isSyncingToCloud?: boolean;
  onSyncToCloud?: () => Promise<void> | void;
}

export default function TopHeader({ 
  userEmail, 
  userRole, 
  language, 
  onLanguageChange, 
  onLogout,
  supabaseStatus,
  onOpenSupabaseModal,
  isSyncingToCloud,
  onSyncToCloud
}: TopHeaderProps) {
  return (
    <div id="top-header" className="bg-slate-900 text-white px-4 py-3.5 flex flex-col gap-2 shrink-0 shadow-sm border-b border-slate-800">
      {/* Top row with Logo and User profile */}
      <div className="flex items-center justify-between">
        {/* Title block */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
            <Sparkles className="h-4 w-4 text-white fill-white/10" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-widest uppercase">
              {language === "AR" ? "تايجر ERP // المنسوجات" : "TIGER ERP // TEXTILE"}
            </h1>
            <p className="text-[8px] text-slate-400 font-medium tracking-wider">
              {language === "AR" 
                ? "واجهة نظام المؤسسة" 
                : language === "EN" 
                ? "ENTERPRISE SYSTEM INTERFACE" 
                : "KURUMSAL SİSTEM ARABİRİMİ"}
            </p>
          </div>
        </div>

        {/* Role and Email visibility */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-100 block max-w-[120px] truncate">
              {userEmail}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5 justify-end">
              <span className={`text-[8px] font-black tracking-wider uppercase px-2 py-0.5 rounded-sm inline-block ${
                (userRole === "admin" || userRole === "master_admin") 
                  ? "bg-indigo-500 text-white" 
                  : userRole === "staff" 
                    ? "bg-amber-500 text-slate-950" 
                    : "bg-emerald-500 text-white"
              }`}>
                {userRole} {language === "TR" ? "YETKİLERİ" : language === "AR" ? "صلاحيات" : "PERMISSIONS"}
              </span>
              {(userRole === "admin" || userRole === "master_admin") && onSyncToCloud && (
                <button
                  type="button"
                  onClick={onSyncToCloud}
                  disabled={isSyncingToCloud}
                  title={language === "TR" ? "Tüm Verileri Supabase Bulutuna Aktar (Seeding / Sync)" : "Sync All Data to Supabase"}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white px-2 py-0.5 rounded-sm text-[8px] font-black flex items-center gap-1 transition-all cursor-pointer h-[15px]"
                >
                  {isSyncingToCloud ? (
                    <RefreshCw className="h-2 w-2 animate-spin" />
                  ) : (
                    <UploadCloud className="h-2.5 w-2.5" />
                  )}
                  <span>{isSyncingToCloud ? (language === "TR" ? "EŞİTLENİYOR..." : "SYNCING...") : (language === "TR" ? "BULUT" : "SYNC")}</span>
                </button>
              )}
            </div>
          </div>

          {/* User circle profile avatar or Logout button */}
          {onLogout ? (
            <button 
              onClick={onLogout}
              title={language === "TR" ? "Sistemden Çıkış" : "Sign Out"}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-slate-300" />
            </div>
          )}
        </div>
      </div>

      {/* Language Switcher Row */}
      <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 mt-1">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Globe className="h-3 w-3 text-indigo-400" />
          <span className="text-[9px] font-black uppercase tracking-wider">
            {language === "TR" ? "Dil Seçimi" : language === "AR" ? "اختر اللغة" : "Select Language"}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {([
            { code: "TR", label: "Türkçe", flag: "🇹🇷" },
            { code: "EN", label: "English", flag: "🇬🇧" },
            { code: "AR", label: "العربية (سوريا)", flag: "🇸🇾" }
          ] as const).map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                id={`lang-btn-${lang.code.toLowerCase()}`}
                type="button"
                onClick={() => onLanguageChange(lang.code)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black transition-all cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600/80 text-white shadow-xs border border-indigo-500"
                    : "bg-slate-800 hover:bg-slate-700/80 text-slate-300 border border-transparent"
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.code}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}


