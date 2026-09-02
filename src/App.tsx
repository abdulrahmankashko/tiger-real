import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { supabase, supabaseUrl, supabaseAnonKey, isSupabaseConfigured, terminateAndResetAllConnections, clearSupabaseSessionCache, createIsolatedAuthClient, loadAppState, saveAppState } from "./supabase";
import { 
  FashionModel, BomItem, InventoryItem, LogisticsItem, ProductionItem, 
  FinancialsItem, FabricColorArchive, FinancialTransaction, CustomCostLine, ModelSizeQty 
} from "./types";
import TopHeader from "./components/TopHeader";
import BottomNavBar from "./components/BottomNavBar";
import DashboardTab from "./components/DashboardTab";
import LogisticsTab from "./components/LogisticsTab";
import FinancialsTab from "./components/FinancialsTab";
import ModelDetailSheet from "./components/ModelDetailSheet";
import FabricDetailSheet from "./components/FabricDetailSheet";
import FinancialDetailSheet from "./components/FinancialDetailSheet";
import { Sparkles, Shield, User, HelpCircle, Database, AlertTriangle, CheckCircle2, X, Copy, RefreshCw, KeyRound, Users, ArrowRight, UploadCloud } from "lucide-react";
import { Language, translations } from "./translations";

export const resolveUserProfile = async (
  user: { id?: string; email?: string } | null,
  client = supabase
): Promise<{ email: string; user_role: string; brand_code: string }> => {
  if (!user || (!user.email && !user.id)) {
    return { email: "", user_role: "client", brand_code: "NEW-BRAND" };
  }

  const cleanEmail = (user.email || "").trim().toLowerCase();
  
  // FORCE HARDCODED ADMIN OVERRIDE FOR TESTING & KNOWN ADMINS
  const isAdminEmail = 
    cleanEmail === 'celil@gmail.com' || 
    cleanEmail === 'abduleahmankashko3@gmail.com' || 
    cleanEmail === 'abdulrahmankashko3@gmail.com' ||
    cleanEmail === 'abdulrehmankashko3@gmail.com' ||
    cleanEmail === 'saskiuchiha.100@gmail.com' ||
    cleanEmail.includes('kashko') ||
    cleanEmail.includes('admin');

  if (isAdminEmail) {
    return { email: cleanEmail, user_role: "master_admin", brand_code: "TIGER-CORP" };
  }

  if (client && isSupabaseConfigured) {
    try {
      let query = client.from("profiles").select("role, brand_code");
      
      if (user.id) {
        query = query.eq("id", user.id);
      } else if (cleanEmail) {
        query = query.eq("email", cleanEmail);
      }

      const { data: profile, error } = await query.maybeSingle();

      if (error) {
        console.error("Profile fetch error:", error);
      }

      if (!error && profile) {
        const rawRole = profile.role || "client";
        const finalRole = rawRole.toLowerCase().trim();
        
        return {
          email: cleanEmail,
          user_role: finalRole,
          brand_code: profile.brand_code || "NEW-BRAND"
        };
      }
    } catch (err) {
      console.error("Dynamic profiles lookup error:", err);
    }
  }

  return {
    email: cleanEmail,
    user_role: "client",
    brand_code: "NEW-BRAND"
  };
};

export default function App() {
  // Empty placeholders for fresh database binding
  const NEW_SUPABASE_URL = "";
  const NEW_SUPABASE_ANON_KEY = "";

  // Authentication & Dynamic Authorization state (as per Module 4)
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<string>("client");
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [assignedBrandCode, setAssignedBrandCode] = useState<string>("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  
  // Language Support state
  const [language, setLanguage] = useState<Language>("TR");
  const t = translations[language];

  // Core database state lists
  const [models, setModels] = useState<FashionModel[]>([]);
  const [bomItems, setBomItems] = useState<BomItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [logistics, setLogistics] = useState<LogisticsItem[]>([]);
  const [production, setProduction] = useState<ProductionItem[]>([]);
  const [financials, setFinancials] = useState<FinancialsItem[]>([]);
  const [fabricColorArchives, setFabricColorArchives] = useState<FabricColorArchive[]>([]);
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);
  const [customCostLines, setCustomCostLines] = useState<CustomCostLine[]>([]);

  // Supabase Integration state
  const [supabaseStatus, setSupabaseStatus] = useState<{
    configured: boolean;
    connected: boolean;
    table_exists: boolean;
    error_message: string;
    url: string;
  } | null>(null);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(localStorage.getItem("CUSTOM_SUPABASE_URL") || supabaseUrl || "https://itldiebzzxjotounqzez.supabase.co");
  const [customAnonInput, setCustomAnonInput] = useState(localStorage.getItem("CUSTOM_SUPABASE_ANON_KEY") || supabaseAnonKey || "sb_publishable_eR8SLoYX036b8cqrBo-WaA_OCy5Rm5n");
  const [isConfiguringDb, setIsConfiguringDb] = useState(false);

  // Navigation tab states
  const [activeTab, setActiveTab] = useState<"dashboard" | "logistics" | "financials">("dashboard");
  const [loading, setLoading] = useState(true);

  // Clickable drill-down sheet states
  const [selectedModel, setSelectedModel] = useState<FashionModel | null>(null);
  const [selectedFabric, setSelectedFabric] = useState<LogisticsItem | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  // Toast notifications
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  // Brand Management States
  const [customBrands, setCustomBrands] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("TIGER_CUSTOM_BRANDS");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [registeredProfiles, setRegisteredProfiles] = useState<any[]>([]);

  const getBrandNameFromCode = (code: string) => {
    const cleanCode = code.toUpperCase();
    if (customBrands[cleanCode]) return customBrands[cleanCode];
    // Check financials array for brand names match if needed
    const fin = financials.find(f => f.customer_name.toUpperCase() === cleanCode);
    if (fin) return fin.customer_name;
    return code;
  };

  const fetchProfile = async (email: string, userId?: string) => {
    if (!email && !userId) return;
    try {
      const resolved = await resolveUserProfile({ email, id: userId }, supabase);
      setUserRole(resolved.user_role);
      setAssignedBrandCode(resolved.brand_code);
      if (resolved.email) setUserEmail(resolved.email);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setUserRole("client"); setAssignedBrandCode("NEW-BRAND");
    }
  };

  const fetchRegisteredProfiles = async () => {
    if (supabase && isSupabaseConfigured && (userRole === "admin" || userRole === "master_admin")) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .order("email", { ascending: true });
        if (!error && data) {
          setRegisteredProfiles(data);
          return;
        } else if (error) {
          console.warn("Failed to fetch profiles from database (using fallback list):", error.message);
        }
      } catch (err) {
        console.error("Profiles table fetch error (using fallback list):", err);
      }
    }

    // Fallback: load from local storage fallbacks if we don't have database connection or query fails
    try {
      const savedFallbacksRaw = localStorage.getItem("TIGER_LOCAL_FALLBACKS");
      if (savedFallbacksRaw) {
        const savedFallbacks = JSON.parse(savedFallbacksRaw);
        const list = Object.entries(savedFallbacks).map(([email, info]: any) => ({
          email,
          user_role: info.user_role || info.role,
          brand_code: info.brand_code
        }));
        setRegisteredProfiles(list);
      }
    } catch (e) {
      console.error("Local profiles fallback parse error:", e);
    }
  };

  const handleAddCustomBrand = async (code: string, name: string, email: string, password?: string): Promise<boolean> => {
    const cleanCode = code.toUpperCase().trim();
    const cleanName = name.trim();
    const cleanEmail = email.toLowerCase().trim();

    if (!cleanCode || !cleanName || !cleanEmail || !password) {
      triggerToast("Lütfen tüm alanları (Şifre dahil) eksiksiz doldurun!", "error");
      return false;
    }

    // Yeni müşteri hesabını doğrudan Supabase Auth'da oluştur.
    // Ayrı/izole bir client kullanıyoruz ki bu signUp çağrısı, işlemi yapan
    // admin'in kendi oturumunu (session) değiştirip onu çıkışa zorlamasın.
    try {
      const isolated = createIsolatedAuthClient();
      const { data: signUpData, error: signUpError } = await isolated.auth.signUp({
        email: cleanEmail,
        password: password
      });
      if (signUpError) throw signUpError;

      const newUserId = signUpData.user?.id;
      if (newUserId) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: newUserId,
          email: cleanEmail,
          role: "client",
          brand_code: cleanCode
        }, { onConflict: "id" });
        if (profileError) throw profileError;
      }
      triggerToast(`${cleanName} başarıyla eklendi ve Supabase kullanıcısı oluşturuldu!`, "success");
    } catch (e: any) {
      console.warn("User creation issue:", e);
      triggerToast("Supabase Auth hatası: " + (e.message || e), "error");
    }

    // Update brand mapping locally
    const nextBrands = { ...customBrands, [cleanCode]: cleanName };
    setCustomBrands(nextBrands);
    localStorage.setItem("TIGER_CUSTOM_BRANDS", JSON.stringify(nextBrands));

    // Register in localfallback profile mapping
    try {
      const savedFallbacksRaw = localStorage.getItem("TIGER_LOCAL_FALLBACKS");
      const savedFallbacks = savedFallbacksRaw ? JSON.parse(savedFallbacksRaw) : {};
      savedFallbacks[cleanEmail] = { user_role: "client", brand_code: cleanCode };
      localStorage.setItem("TIGER_LOCAL_FALLBACKS", JSON.stringify(savedFallbacks));
    } catch (e) {
      console.error("Failed to save local fallback profiles:", e);
    }

    // Save to the server-side db.json state using saveToServer (which automatically syncs to app_state under key "profiles")
    const newProfile = { email: cleanEmail, user_role: "client", brand_code: cleanCode };
    const nextProfiles = [
      ...registeredProfiles.filter((p) => p.email.toLowerCase().trim() !== cleanEmail),
      newProfile
    ];
    setRegisteredProfiles(nextProfiles);
    saveToServer({ profiles: nextProfiles });

    // Try writing to the dedicated profiles table as an optional backup, but run in background
    if (supabase && isSupabaseConfigured) {
      (async () => {
        try {
          const { error: saveError } = await supabase
            .from("profiles")
            .upsert({
              email: cleanEmail,
              user_role: "client",
              brand_code: cleanCode
            }, { onConflict: "email" });
          if (saveError) {
            console.warn("Optional profiles table backup write failed/skipped:", saveError.message);
          }
        } catch (err: any) {
          console.warn("Optional profiles table backup write caught error:", err.message || err);
        }
      })();
    }

    triggerToast("Marka ve Müşteri Profili başarıyla kaydedildi!", "success");
    setTimeout(() => {
      fetchRegisteredProfiles();
    }, 100);
    return true;
  };

  useEffect(() => {
    if (isLoggedIn && (userRole === "admin" || userRole === "master_admin")) {
      fetchRegisteredProfiles();
    }
  }, [isLoggedIn, userRole, supabaseStatus]);

  // 1. DYNAMICALLY EVALUATE ROLE ON EMAIL CHANGE
  useEffect(() => {
    if (userEmail) {
      fetchProfile(userEmail);
    }
  }, [userEmail]);

  // Tab routing based purely on role
  useEffect(() => {
    if (userRole === "admin" || userRole === "master_admin") {
      // Admin paths unhindered
    } else if (userRole === "client") {
      // Client has read-only access to logistics and financials now, so no redirection is needed

    } else if (userRole === "staff") {
      if (activeTab === "dashboard" || activeTab === "financials") {
        setActiveTab("logistics");
      }
    }
  }, [userRole, activeTab]);

  // Supabase Auth State Change Listener
  useEffect(() => {

    const cacheVersion = localStorage.getItem("TIGER_CACHE_VERSION_5");
    if (cacheVersion !== "5.0") {
      clearSupabaseSessionCache();
      const oldUrl = localStorage.getItem("CUSTOM_SUPABASE_URL");
      if (oldUrl && (oldUrl.includes("mwvsvdqrhyxpcydybntq") || oldUrl.includes("your-project"))) {
        localStorage.removeItem("CUSTOM_SUPABASE_URL");
        localStorage.removeItem("CUSTOM_SUPABASE_ANON_KEY");
      }
      localStorage.setItem("TIGER_CACHE_VERSION_5", "5.0");
      localStorage.removeItem("CUSTOM_SUPABASE_URL");
      localStorage.removeItem("CUSTOM_SUPABASE_ANON_KEY");

      console.log("Purged old project cache and updated to new Supabase project credentials.");
    }
    if (supabase && isSupabaseConfigured) {
      let active = true;

      const checkSession = async () => {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.warn("Supabase session check notice:", error.message);
          }
          if (!active) return;

          const session = data?.session;
          if (session?.user) {
            const resolved = await resolveUserProfile({
              id: session.user.id,
              email: session.user.email
            }, supabase);

            if (!active) return;
            setUserRole(resolved.user_role);
            setAssignedBrandCode(resolved.brand_code);
            setUserEmail(resolved.email || session.user.email || "");
            setIsLoggedIn(true);
          } else {
            setIsLoggedIn(false);
            setUserEmail("");
            setAssignedBrandCode("");
          }
        } catch (err) {
          console.warn("Supabase getSession caught network/fetch error:", err);
        }
      };

      checkSession();

      let subscription: any = null;
      try {
        const authListener = supabase.auth.onAuthStateChange(async (_event, session) => {
          try {
            if (!active) return;
            if (session?.user) {
              const resolved = await resolveUserProfile({
                id: session.user.id,
                email: session.user.email
              }, supabase);

              if (!active) return;
              setUserRole(resolved.user_role);
              setAssignedBrandCode(resolved.brand_code);
              setUserEmail(resolved.email || session.user.email || "");
              setIsLoggedIn(true);
            } else {
              setIsLoggedIn(false);
              setUserEmail("");
              setAssignedBrandCode("");
            }
          } catch (listenerErr) {
            console.warn("Auth state change callback caught error:", listenerErr);
          }
        });
        subscription = authListener?.data?.subscription;
      } catch (subErr) {
        console.warn("Failed to subscribe to Supabase auth state change:", subErr);
      }

      return () => {
        active = false;
        if (subscription?.unsubscribe) {
          subscription.unsubscribe();
        }
      };
    } else {
      setIsLoggedIn(false);
      setUserEmail("");
      setAssignedBrandCode("");
    }
  }, [supabaseStatus]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    setAuthLoading(true);

    const cleanEmail = loginEmail.trim().toLowerCase();

    try {
      if (!supabase) {
        throw new Error("Supabase client is not initialized.");
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: loginPassword,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.user) {
        const resolved = await resolveUserProfile({ id: data.user.id, email: data.user.email || cleanEmail }, supabase);
        setUserRole(resolved.user_role);
        setAssignedBrandCode(resolved.brand_code);
        setUserEmail(cleanEmail);
        setIsLoggedIn(true);
        triggerToast((resolved.user_role === "admin" || resolved.user_role === "master_admin") ? "Yönetici olarak giriş yapıldı." : "Sistem girişi başarıyla sağlandı.", "success");
      }
    } catch (err: any) {
      console.warn("Login exception:", err);
      triggerToast(`Giriş başarısız: ${err.message || err}`, "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (supabase && isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    clearSupabaseSessionCache();
    localStorage.removeItem("TIGER_LOCAL_AUTH_EMAIL");
    setIsLoggedIn(false);
    setUserEmail("");
    setAssignedBrandCode("");
    triggerToast("Sistemden güvenli çıkış yapıldı.", "info");
  };


  const handleSaveCustomDb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput || !customAnonInput) {
      alert("Lütfen hem Proje URL hem de Anon Key değerlerini girin!");
      return;
    }

    const rawUrl = customUrlInput.trim();
    const cleanUrl = rawUrl.replace(/\/+$/, "").replace(/\/rest\/v1$/, "").replace(/\/+$/, "");
    const cleanKey = customAnonInput.trim();

    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      alert("Geçersiz URL! Supabase URL 'https://' ile başlamalıdır.");
      return;
    }

    // Bu sürümde veritabanı bağlantısı sabit (supabase.ts içinde) — çalışma
    // zamanında farklı bir projeye bağlanma özelliği kaldırıldı. Bilgi verelim.
    alert("Bu sürümde veritabanı bağlantısı sabittir ve zaten yapılandırılmıştır. Farklı bir Supabase projesine geçmek isterseniz src/supabase.ts dosyasındaki bilgileri değiştirip yeniden derlemeniz gerekir.");
  };

  const handleResetCustomDb = async () => {
    if (!window.confirm("Tüm veritabanı bağlantılarını sonlandırmak ve bağlantıyı kesmek istediğinize emin misiniz?")) {
      return;
    }

    alert("Bu sürümde veritabanı bağlantısı sabittir, sıfırlama gerekmez.");
  };

  const [isSyncingToCloud, setIsSyncingToCloud] = useState(false);

  const handleSyncToCloud = async () => {
    // Artık her kayıt zaten doğrudan Supabase'e yazılıyor, ayrı bir
    // "buluta eşitle" adımına gerek yok. Sadece bağlantıyı tazeleyelim.
    setIsSyncingToCloud(true);
    await fetchSupabaseStatus();
    triggerToast("Veriler zaten doğrudan Supabase'e kaydediliyor, ekstra eşitleme gerekmiyor.", "info");
    setIsSyncingToCloud(false);
  };


  // 2. CHECK DATABASE CONNECTION (direct Supabase, no backend server involved)
  const fetchSupabaseStatus = async () => {
    try {
      const { error } = await supabase.from("app_state").select("key", { count: "exact", head: true });
      setSupabaseStatus({
        configured: true,
        connected: !error,
        table_exists: !error || !String(error.message || "").includes("does not exist"),
        error_message: error ? error.message : ""
      });
    } catch (err: any) {
      setSupabaseStatus({ configured: true, connected: false, table_exists: false, error_message: err.message });
    }
  };

  useEffect(() => {
    document.documentElement.dir = language === 'AR' ? 'rtl' : 'ltr';
    document.documentElement.lang = language.toLowerCase();
  }, [language]);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await loadAppState();
        
        setModels(data.models || []);
        setBomItems(data.bom_items || []);
        setInventory(data.inventory || []);
        setLogistics(data.logistics || []);
        setProduction(data.production || []);
        setFinancials(data.financials || []);
        setFabricColorArchives(data.fabric_color_archives || []);
        setFinancialTransactions(data.financial_transactions || []);
        setCustomCostLines(data.custom_cost_lines || []);
        
        if (data.profiles && Array.isArray(data.profiles)) {
          setRegisteredProfiles(data.profiles);
          try {
            const savedFallbacksRaw = localStorage.getItem("TIGER_LOCAL_FALLBACKS");
            const savedFallbacks = savedFallbacksRaw ? JSON.parse(savedFallbacksRaw) : {};
            let changed = false;
            data.profiles.forEach((p: any) => {
              if (p && p.email) {
                const emailLower = p.email.toLowerCase().trim();
                if (!savedFallbacks[emailLower] || savedFallbacks[emailLower].brand_code !== p.brand_code || savedFallbacks[emailLower].user_role !== p.user_role) {
                  savedFallbacks[emailLower] = { user_role: p.user_role || "client", brand_code: p.brand_code };
                  changed = true;
                }
              }
            });
            if (changed) {
              localStorage.setItem("TIGER_LOCAL_FALLBACKS", JSON.stringify(savedFallbacks));
            }
          } catch (e) {
            console.error("Failed to sync profiles into local fallbacks on load:", e);
          }
        }
      } catch (err) {
        console.error("Failed to load initial data, using local storage backup", err);
        triggerToast("Veritabanı bağlantısında lokal yedekler yükleniyor.", "info");
      } finally {
        setLoading(false);
      }
    }
    loadData();
    fetchSupabaseStatus();
  }, []);

  // 3. TOAST TRIGGER UTILITY
  const triggerToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // 4. SAVE TO DB INTEGRATION
  const saveToServer = async (updates: Partial<{
    models: FashionModel[];
    bom_items: BomItem[];
    inventory: InventoryItem[];
    logistics: LogisticsItem[];
    production: ProductionItem[];
    financials: FinancialsItem[];
    fabric_color_archives: FabricColorArchive[];
    financial_transactions: FinancialTransaction[];
    custom_cost_lines: CustomCostLine[];
    profiles: any[];
  }>) => {
    try {
      await saveAppState(updates);
      setTimeout(() => {
        fetchSupabaseStatus();
      }, 800);
    } catch (err) {
      console.error("Database sync failed:", err);
      triggerToast("Kaydetme başarısız: veritabanı bağlantısı kontrol edin.", "error");
    }
  };

  // 5. CRUD ACTION HANDLERS WITH REACTIVE SYNC

  // A. Models
  const handleAddModel = (
    name: string, 
    code: string, 
    customer: string, 
    price: number, 
    labor: number, 
    img: string, 
    requestedQty?: number, 
    cutQty?: number, 
    sentQty?: number,
    sizesQty?: ModelSizeQty[],
    date?: string,
    season?: string
  ) => {
    // Determine the exact brand code
    let modelBrandCode = "";
    const cleanCustomer = (customer || "").trim();
    
    // Look up in registeredProfiles
    const foundProfile = (registeredProfiles || []).find(
      (p: any) => p && (
        (p.brand_name && p.brand_name.toLowerCase().trim() === cleanCustomer.toLowerCase()) || 
        (p.brand_code && p.brand_code.toLowerCase().trim() === cleanCustomer.toLowerCase())
      )
    );
    
    if (foundProfile && foundProfile.brand_code) {
      modelBrandCode = foundProfile.brand_code.toUpperCase();
    } else {
      modelBrandCode = cleanCustomer.toUpperCase().replace(/\s+/g, "-");
    }

    const finalDate = date || new Date().toISOString().split("T")[0];

    const newModel: FashionModel = {
      id: "mdl_" + Math.random().toString(36).substring(2, 11),
      smart_id: code,
      name,
      customer_name: customer,
      brand_code: modelBrandCode,
      target_price: price,
      labor_cost: labor,
      photo_url: img,
      created_at: finalDate,
      date: finalDate,
      season: season || "WINTER",
      requested_qty: requestedQty,
      cut_qty: cutQty,
      sent_qty: sentQty,
      sizes_qty: sizesQty
    };

    const nextModels = [newModel, ...models];
    setModels(nextModels);
    saveToServer({ models: nextModels });
    triggerToast(`Yeni model kaydedildi: ${code}`);
  };

  const handleDeleteModel = (id: string) => {
    const nextModels = models.filter(m => m.id !== id);
    const nextBoms = bomItems.filter(b => b.model_id !== id);
    const nextInv = inventory.filter(i => i.model_id !== id);
    const nextOverheads = customCostLines.filter(c => c.model_id !== id);

    setModels(nextModels);
    setBomItems(nextBoms);
    setInventory(nextInv);
    setCustomCostLines(nextOverheads);

    saveToServer({
      models: nextModels,
      bom_items: nextBoms,
      inventory: nextInv,
      custom_cost_lines: nextOverheads
    });

    if (selectedModel?.id === id) {
      setSelectedModel(null);
    }
    triggerToast("Model ve ilişkili tüm reçete/varyantlar silindi.");
  };

  const handleDeleteAllModels = () => {
    setModels([]);
    setBomItems([]);
    setInventory([]);
    setCustomCostLines([]);
    setSelectedModel(null);

    saveToServer({
      models: [],
      bom_items: [],
      inventory: [],
      custom_cost_lines: []
    });

    triggerToast(
      language === "TR" 
        ? "Tüm modeller ve ilişkili veriler sistemden kaldırıldı." 
        : "All models and associated data removed.", 
      "info"
    );
  };

  const handleUpdateModel = (id: string, updates: Partial<FashionModel>) => {
    const nextModels = models.map(m => m.id === id ? { ...m, ...updates } : m);
    setModels(nextModels);
    saveToServer({ models: nextModels });
    
    if (selectedModel?.id === id) {
      setSelectedModel({ ...selectedModel, ...updates });
    }
  };

  // B. Custom Overhead Cost Lines
  const handleAddCustomCost = (name: string, cost: number, photo_url?: string, currency: 'USD' | 'TRY' = 'USD', date?: string) => {
    if (!selectedModel) return;
    const finalDate = date || new Date().toISOString().split("T")[0];
    const newLine: CustomCostLine = {
      id: "cost_" + Math.random().toString(36).substring(2, 11),
      model_id: selectedModel.id,
      name,
      cost,
      currency,
      photo_url,
      created_at: finalDate,
      date: finalDate
    };

    const nextOverheads = [...customCostLines, newLine];
    setCustomCostLines(nextOverheads);
    saveToServer({ custom_cost_lines: nextOverheads });
    triggerToast("Ekstra maliyet kalemi eklendi.");
  };

  const handleRemoveCustomCost = (id: string) => {
    const nextOverheads = customCostLines.filter(c => c.id !== id);
    setCustomCostLines(nextOverheads);
    saveToServer({ custom_cost_lines: nextOverheads });
    triggerToast("Maliyet kalemi kaldırıldı.");
  };

  // C. Size-Color Variant Registry
  const handleRegisterVariant = (color: string, size: string, warehouse: string, colorPhotoUrl?: string, date?: string) => {
    if (!selectedModel) return;
    
    // Generate Smart ID e.g. MDL-202-EMR-36
    const codePrefix = selectedModel.smart_id;
    const colorCode = color.substring(0, 3).toUpperCase().replace(/Ğ/g, "G").replace(/Ü/g, "U").replace(/Ş/g, "S").replace(/I/g, "I").replace(/İ/g, "I").replace(/Ö/g, "O").replace(/Ç/g, "C");
    const variantSmartId = `${codePrefix}-${colorCode}-${size}`;
    const finalDate = date || new Date().toISOString().split("T")[0];

    const newVariant: InventoryItem = {
      id: "inv_" + Math.random().toString(36).substring(2, 11),
      model_id: selectedModel.id,
      variant_smart_id: variantSmartId,
      color,
      size,
      warehouse_name: warehouse,
      stock_count: 0, // starting stock
      color_photo_url: colorPhotoUrl,
      created_at: finalDate,
      date: finalDate
    };

    const nextInv = [newVariant, ...inventory];
    setInventory(nextInv);
    saveToServer({ inventory: nextInv });
    triggerToast(`Yeni ürün varyantı kaydedildi: ${variantSmartId}`);
  };

  const handleRemoveVariant = (id: string) => {
    const nextInv = inventory.filter(i => i.id !== id);
    setInventory(nextInv);
    saveToServer({ inventory: nextInv });
    triggerToast("Ürün varyantı kaldırıldı.");
  };

  // D. BOM Management
  const handleAddBomItem = (item: Omit<BomItem, "id" | "model_id" | "created_at"> & { date?: string }) => {
    if (!selectedModel) return;
    const finalDate = item.date || new Date().toISOString().split("T")[0];
    const newBom: BomItem = {
      ...item,
      id: "bom_" + Math.random().toString(36).substring(2, 11),
      model_id: selectedModel.id,
      created_at: finalDate,
      date: finalDate
    };

    const nextBoms = [...bomItems, newBom];
    setBomItems(nextBoms);
    saveToServer({ bom_items: nextBoms });
    triggerToast("Reçeteye yeni hammadde eklendi.");
  };

  const handleRemoveBomItem = (id: string) => {
    const nextBoms = bomItems.filter(b => b.id !== id);
    setBomItems(nextBoms);
    saveToServer({ bom_items: nextBoms });
    triggerToast("Reçete kalemi silindi.");
  };

  const handleUpdateBomItem = (id: string, updates: Partial<BomItem>) => {
    const nextBoms = bomItems.map(b => b.id === id ? { ...b, ...updates } : b);
    setBomItems(nextBoms);
    saveToServer({ bom_items: nextBoms });
    triggerToast("Reçete kalemi güncellendi.");
  };

  // E. Raw Fabrics Lojistik
  const handleAddFabric = (
    name: string, 
    smartId: string, 
    unit: string,
    incomingMeters: number = 0,
    cutMeters: number = 0,
    imageUrl?: string,
    usedMeters: number = 0,
    color?: string,
    unitPrice: number = 0,
    currency: 'USD' | 'TRY' = 'USD',
    marginPercent: number = 0,
    date?: string,
    brandOwner?: string
  ) => {
    const newId = "log_" + Math.random().toString(36).substring(2, 11);
    const inc = Math.max(0, Number(incomingMeters) || Number(usedMeters) || 0);
    const cut = Math.max(0, Number(cutMeters) || 0);
    const rem = Math.max(0, inc - cut);
    const finalName = name.trim() || `${smartId.trim().toUpperCase()} Kumaşı`;
    const finalImage = imageUrl?.trim() || "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400";
    const finalColor = color?.trim() || "Ana Renk";
    const uPrice = Math.max(0, Number(unitPrice) || 0);
    const mPercent = Math.max(0, Number(marginPercent) || 0);
    const effPrice = uPrice > 0 ? uPrice * (1 + mPercent / 100) : 0;
    const finalDate = date || new Date().toISOString().split("T")[0];

    const newFabric: LogisticsItem = {
      id: newId,
      item_smart_id: smartId.trim().toUpperCase(),
      item_name: finalName,
      incoming: inc,
      cut: cut,
      remaining: rem,
      unit: unit || "Mt",
      image_url: finalImage,
      used_meters: Number(usedMeters) || inc,
      color: finalColor,
      unit_price: uPrice,
      currency: currency,
      margin_percent: mPercent,
      effective_price: effPrice,
      date: finalDate,
      created_at: finalDate,
      customer_name: brandOwner
    };

    const nextLogistics = [newFabric, ...logistics];

    // Create default color archive row so visuals & meters show across detail sheets
    const starterArchive: FabricColorArchive = {
      id: "arch_" + Math.random().toString(36).substring(2, 11),
      fabric_id: newId,
      color: finalColor,
      image_url: finalImage,
      incoming: inc,
      cut: cut,
      unit_price: uPrice,
      currency: currency,
      margin_percent: mPercent,
      effective_price: effPrice
    };
    const nextArchives = [starterArchive, ...fabricColorArchives];

    setLogistics(nextLogistics);
    setFabricColorArchives(nextArchives);

    saveToServer({
      logistics: nextLogistics,
      fabric_color_archives: nextArchives
    });
    triggerToast(`Yeni kumaş kartı oluşturuldu: ${smartId}`);
  };

  const handleDeleteFabric = (id: string) => {
    const nextLogistics = logistics.filter(l => l.id !== id);
    const nextArchives = fabricColorArchives.filter(c => c.fabric_id !== id);

    setLogistics(nextLogistics);
    setFabricColorArchives(nextArchives);

    saveToServer({
      logistics: nextLogistics,
      fabric_color_archives: nextArchives
    });

    if (selectedFabric?.id === id) {
      setSelectedFabric(null);
    }
    triggerToast("Kumaş kartı ve ilişkili tüm fiziksel varyant renkleri silindi.");
  };

  // F. Fabric Multi-Color Archives & Live Meter Adjusters
  const handleAddColorArchive = (color: string, url: string, incoming: number, cut: number, date?: string) => {
    if (!selectedFabric) return;
    const finalDate = date || new Date().toISOString().split("T")[0];
    const newArchive: FabricColorArchive = {
      id: "arch_" + Math.random().toString(36).substring(2, 11),
      fabric_id: selectedFabric.id,
      color,
      image_url: url,
      incoming,
      cut,
      created_at: finalDate,
      date: finalDate
    };

    const nextArchives = [...fabricColorArchives, newArchive];
    setFabricColorArchives(nextArchives);
    saveToServer({ fabric_color_archives: nextArchives });
    triggerToast(`Kumaş rengi galeriye kaydedildi: ${color}`);
  };

  const handleRemoveColorArchive = (id: string) => {
    const nextArchives = fabricColorArchives.filter(c => c.id !== id);
    setFabricColorArchives(nextArchives);
    saveToServer({ fabric_color_archives: nextArchives });
    triggerToast("Kumaş rengi galeriden kaldırıldı.");
  };

  const handleAdjustMeters = (id: string, field: "incoming" | "cut", delta: number) => {
    const nextArchives = fabricColorArchives.map((archive) => {
      if (archive.id === id) {
        const nextValue = Math.max(0, archive[field] + delta);
        return { ...archive, [field]: nextValue };
      }
      return archive;
    });

    setFabricColorArchives(nextArchives);
    saveToServer({ fabric_color_archives: nextArchives });
  };

  const handleUpdateArchiveMeters = (id: string, incoming: number, cut: number) => {
    const nextArchives = fabricColorArchives.map((archive) => {
      if (archive.id === id) {
        return { 
          ...archive, 
          incoming: Math.max(0, incoming), 
          cut: Math.max(0, cut) 
        };
      }
      return archive;
    });

    setFabricColorArchives(nextArchives);
    saveToServer({ fabric_color_archives: nextArchives });
  };

  // G. Üretim / Production Stage & Quantity
  const handleAddProduction = (modelCode: string, name: string, qty: number, stage: string, date?: string) => {
    const finalDate = date || new Date().toISOString().split("T")[0];
    const newJob: ProductionItem = {
      id: "p_" + Math.random().toString(36).substring(2, 11),
      model_smart_id: modelCode,
      model_name: name,
      stage,
      progress: 0,
      target_qty: qty,
      completed_qty: 0,
      status: "active",
      created_at: finalDate,
      order_date: finalDate,
      date: finalDate
    };

    const nextProduction = [newJob, ...production];
    setProduction(nextProduction);
    saveToServer({ production: nextProduction });
    triggerToast(`Üretim iş emri başlatıldı: ${modelCode}`);
  };

  const handleUpdateProgress = (id: string, progress: number, completedQty: number, stage: string) => {
    const nextProduction = production.map((job) => {
      if (job.id === id) {
        return {
          ...job,
          progress,
          completed_qty: completedQty,
          stage,
          status: progress >= 100 ? "success" : "active" as any
        };
      }
      return job;
    });

    setProduction(nextProduction);
    saveToServer({ production: nextProduction });
  };

  const handleDeleteProduction = (id: string) => {
    const nextProduction = production.filter(p => p.id !== id);
    setProduction(nextProduction);
    saveToServer({ production: nextProduction });
    triggerToast("İş emri silindi.");
  };

  // H. Financial Transactions
  const handleAddTransaction = (date: string, docType: string, amount: number, status: "Settled" | "Pending", modelId?: string) => {
    if (!selectedCompany) return;
    const newTx: FinancialTransaction = {
      id: "tx_" + Math.random().toString(36).substring(2, 11),
      customer_name: selectedCompany,
      date,
      doc_type: docType as any,
      amount,
      status,
      model_id: modelId
    };

    const nextTransactions = [...financialTransactions, newTx];
    setFinancialTransactions(nextTransactions);
    saveToServer({ financial_transactions: nextTransactions });
    triggerToast("Yeni finansal işlem yevmiye defterine işlendi.");
  };

  const handleRemoveTransaction = (id: string) => {
    const nextTransactions = financialTransactions.filter(t => t.id !== id);
    setFinancialTransactions(nextTransactions);
    saveToServer({ financial_transactions: nextTransactions });
    triggerToast("İşlem kaydı iptal edildi.");
  };

  const handleAddCompany = (customer_name: string, company_type: "Müşteri" | "Tedarikçi", initialBalance: number, currency: string) => {
    const newCompany: FinancialsItem = {
      id: "f_" + Math.random().toString(36).substring(2, 11),
      customer_name,
      company_type,
      total_ciro: 0,
      received: 0,
      outstanding: 0,
      currency
    };

    const nextFinancials = [...financials, newCompany];
    setFinancials(nextFinancials);
    saveToServer({ financials: nextFinancials });
    triggerToast(`Yeni cari hesap eklendi: ${customer_name}`);

    // Create an initial balance transaction if requested
    if (initialBalance > 0) {
      const isMusteri = company_type === "Müşteri";
      const txDocType = isMusteri ? "Invoice Issued" : "Purchase Invoice"; 
      
      const newTx: FinancialTransaction = {
        id: "tx_" + Math.random().toString(36).substring(2, 11),
        customer_name: customer_name,
        date: new Date().toISOString().split("T")[0],
        amount: initialBalance,
        doc_type: txDocType as any,
        status: "Settled",
      };
      const nextTransactions = [...financialTransactions, newTx];
      setFinancialTransactions(nextTransactions);
      saveToServer({ financial_transactions: nextTransactions });
    }
  };

  const handleDeleteCompany = (id: string, customer_name: string) => {
    const nextFinancials = financials.filter(f => f.id !== id && f.customer_name !== customer_name);
    const nextTransactions = financialTransactions.filter(t => t.customer_name !== customer_name);

    setFinancials(nextFinancials);
    setFinancialTransactions(nextTransactions);

    saveToServer({
      financials: nextFinancials,
      financial_transactions: nextTransactions
    });

    if (selectedCompany === customer_name) {
      setSelectedCompany(null);
    }
    triggerToast(
      language === "TR" 
        ? `"${customer_name}" cari hesabı başarıyla silindi.` 
        : language === "AR" 
        ? `تم حذف حساب "${customer_name}" بنجاح.` 
        : `Account "${customer_name}" successfully deleted.`
    );
  };

  // 6. MULTI-TENANT ROW ISOLATION FILTERING FOR CUSTOMERS
  const getFilteredModels = () => {
    if (userRole !== "client") return models;
    const brandName = getBrandNameFromCode(assignedBrandCode).toLowerCase().trim();
    const brandCode = (assignedBrandCode || "").toLowerCase().trim();
    return models.filter(m => {
      const mCode = (m.brand_code || "").toLowerCase().trim();
      const mCust = (m.customer_name || "").toLowerCase().trim();
      return mCode === brandCode || mCust === brandName || mCust === brandCode;
    });
  };

  const getFilteredFinancials = () => {
    if (userRole !== "client") return financials;
    const brandName = getBrandNameFromCode(assignedBrandCode).toLowerCase().trim();
    const brandCode = (assignedBrandCode || "").toLowerCase().trim();
    return financials.filter(f => {
      const fCust = (f.customer_name || "").toLowerCase().trim();
      return fCust === brandName || fCust === brandCode;
    });
  };

  const getFilteredLogistics = () => {
    if (userRole !== "client") return logistics;
    const brandName = getBrandNameFromCode(assignedBrandCode).toLowerCase().trim();
    const brandCode = (assignedBrandCode || "").toLowerCase().trim();
    return logistics.filter(l => {
      if (l.customer_name) {
        const cName = l.customer_name.toLowerCase().trim();
        return cName === brandName || cName === brandCode;
      }
      return false;
    });
  };

  const getFilteredProduction = () => {
    if (userRole !== "client") return production;
    const myModels = getFilteredModels();
    const myModelSmartIds = new Set(myModels.map(m => m.smart_id.toUpperCase()));
    return production.filter(p => myModelSmartIds.has(p.model_smart_id.toUpperCase()));
  };

  const filteredModels = getFilteredModels();
  const filteredFinancials = getFilteredFinancials();
  const filteredLogistics = getFilteredLogistics();
  const filteredProduction = getFilteredProduction();

  return (
    <div id="glide-app-shell" className="flex items-center justify-center min-h-screen bg-slate-500/10 p-0 md:p-6 select-none font-sans overflow-hidden">
      
      {/* Absolute Beautiful Floating Background Accent */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#1E293B] via-[#0F172A] to-[#312E81] -z-10" />

      {/* Mobile Frame Container (Native Device Feel) */}
      <div id="mobile-viewport" className="w-full max-w-md h-[100dvh] md:h-[840px] bg-white md:rounded-[40px] md:shadow-2xl overflow-hidden flex flex-col relative border-4 border-slate-900">
        
        {!isLoggedIn ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-white relative h-full">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#1E293B] via-[#0F172A] to-[#312E81] -z-10" />
            
            <div className="w-full max-w-sm space-y-6">
              {/* Logo block */}
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="h-6 w-6 text-white fill-white/10" />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-widest uppercase">
                    TIGER ERP // TEXTILE
                  </h1>
                  <p className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-widest mt-1">
                    GÜVENLİ GİRİŞ PANELİ
                  </p>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400">E-Posta Adresi</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="ornek@firma.com"
                    className="w-full bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Şifre</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-2.5 rounded-xl transition-all shadow-md cursor-pointer text-xs flex items-center justify-center gap-2"
                >
                  {authLoading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    "Sistem Girişi"
                  )}
                </button>



                {/* Quick DB Config & Cache Refresh Tools */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <button
                    type="button"
                    onClick={() => setShowSupabaseModal(true)}
                    className="flex items-center gap-1 hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    <Database className="h-3 w-3" />
                    <span>Veritabanı Ayarları</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      terminateAndResetAllConnections();
                      triggerToast("Oturum ve önbellek temizlendi. Sayfa yenileniyor...", "info");
                      setTimeout(() => window.location.reload(), 600);
                    }}
                    className="flex items-center gap-1 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Eski proje bağlantılarını ve oturum önbelleğini sıfırla"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Önbelleği Sıfırla</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* Dynamic Top Status Bar & Header */}
            <TopHeader 
              userEmail={userEmail} 
              userRole={userRole} 
              language={language}
              onLanguageChange={setLanguage}
              onLogout={handleLogout}
              supabaseStatus={supabaseStatus}
              onOpenSupabaseModal={() => setShowSupabaseModal(true)}
                            isSyncingToCloud={isSyncingToCloud}
              onSyncToCloud={handleSyncToCloud}
            />

        {/* Dynamic Main Workspace Tab Body */}
        <div id="app-body-area" className="flex-1 overflow-y-auto p-4 bg-[#F8FAFC] pb-24 relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3 font-semibold text-slate-500">
              <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
              <span>{t.syncData}</span>
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && (
                <DashboardTab
                  models={filteredModels}
                  bomItems={bomItems}
                  customCostLines={customCostLines}
                  logistics={filteredLogistics}
                  production={filteredProduction}
                  userRole={userRole}
                  onSelectModel={setSelectedModel}
                  onAddModel={handleAddModel}
                  onDeleteModel={handleDeleteModel}
                  onDeleteAllModels={handleDeleteAllModels}
                  triggerToast={triggerToast}
                  t={t}
                  language={language}
                  handleSyncToCloud={handleSyncToCloud}
                  isSyncingToCloud={isSyncingToCloud}
                  customBrands={customBrands}
                  onAddCustomBrand={handleAddCustomBrand}
                  registeredProfiles={registeredProfiles}
                />
              )}

              {activeTab === "logistics" && (
                <LogisticsTab
                  logistics={filteredLogistics}
                  colorArchives={fabricColorArchives}
                  models={models}
                  financials={financials}
                  userRole={userRole}
                  onSelectFabric={setSelectedFabric}
                  onAddFabric={handleAddFabric}
                  onDeleteFabric={handleDeleteFabric}
                  triggerToast={triggerToast}
                  t={t}
                  language={language}
                />
              )}

              {activeTab === "financials" && (
                userRole === "client" ? (
                  <FinancialDetailSheet
                    companyName={getBrandNameFromCode(assignedBrandCode)}
                    userRole={userRole}
                    transactions={financialTransactions}
                    inventory={inventory}
                    models={models}
                    customCostLines={customCostLines}
                    bomItems={bomItems}
                    onClose={() => {}}
                    onAddTransaction={handleAddTransaction}
                    onRemoveTransaction={handleRemoveTransaction}
                    triggerToast={triggerToast}
                    t={t}
                    language={language}
                    isInline={true}
                  />
                ) : (
                  <FinancialsTab
                    userRole={userRole}
                    financials={filteredFinancials}
                    transactions={financialTransactions}
                    inventory={inventory}
                    models={models}
                    customCostLines={customCostLines}
                    bomItems={bomItems}
                    onSelectCompany={setSelectedCompany}
                    onAddCompany={handleAddCompany}
                    onDeleteCompany={handleDeleteCompany}
                    t={t}
                    language={language}
                  />
                )
              )}
            </>
          )}
        </div>

        {/* Persistent Bottom Tab Navigation Bar */}
        <BottomNavBar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          userRole={userRole}
          t={t}
        />

        {/* DYNAMIC PUSH SHEETS SECTION */}
        <AnimatePresence>
          {/* 1. Model Master Detail Sheet */}
          {selectedModel && (
            <ModelDetailSheet
              model={selectedModel}
              bomItems={bomItems}
              inventory={inventory}
              customCostLines={customCostLines}
              userRole={userRole}
              onClose={() => setSelectedModel(null)}
              onUpdateModel={handleUpdateModel}
              onDeleteModel={handleDeleteModel}
              onAddCustomCost={handleAddCustomCost}
              onRemoveCustomCost={handleRemoveCustomCost}
              onRegisterVariant={handleRegisterVariant}
              onRemoveVariant={handleRemoveVariant}
              onAddBomItem={handleAddBomItem}
              onRemoveBomItem={handleRemoveBomItem}
              onUpdateBomItem={handleUpdateBomItem}
              triggerToast={triggerToast}
              t={t}
              language={language}
            />
          )}

          {/* 2. Fabric Logistics Management Sheet */}
          {selectedFabric && (
            <FabricDetailSheet
              fabric={selectedFabric}
              colorArchives={fabricColorArchives}
              userRole={userRole}
              onClose={() => setSelectedFabric(null)}
              onAddColorArchive={handleAddColorArchive}
              onRemoveColorArchive={handleRemoveColorArchive}
              onAdjustMeters={handleAdjustMeters}
              onUpdateArchiveMeters={handleUpdateArchiveMeters}
              triggerToast={triggerToast}
              t={t}
              language={language}
            />
          )}

          {/* 3. Cari Transparent Drill-Down Sheet */}
          {selectedCompany && (
            <FinancialDetailSheet
              companyName={selectedCompany}
              companyId={financials.find(f => f.customer_name === selectedCompany)?.id}
              companyType={financials.find(f => f.customer_name === selectedCompany)?.company_type}
              userRole={userRole}
              transactions={financialTransactions}
              inventory={inventory}
              models={models}
              customCostLines={customCostLines}
              bomItems={bomItems}
              onClose={() => setSelectedCompany(null)}
              onAddTransaction={handleAddTransaction}
              onRemoveTransaction={handleRemoveTransaction}
              onDeleteCompany={handleDeleteCompany}
              triggerToast={triggerToast}
              t={t}
              language={language}
            />
          )}
        </AnimatePresence>

          </>
        )}

        {/* TOAST NOTIFICATION RIPPLE */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              className={`absolute bottom-24 left-4 right-4 p-3.5 rounded-2xl text-xs font-bold text-white z-50 flex items-center shadow-lg gap-2 ${
                toast.type === "error" 
                  ? "bg-rose-600" 
                  : toast.type === "info" 
                    ? "bg-slate-800" 
                    : "bg-emerald-600"
              }`}
            >
              <span>{toast.msg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Supabase Database Connection Modal */}
        <AnimatePresence>
          {showSupabaseModal && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[32px] shadow-2xl border border-slate-100 max-w-sm w-full p-6 relative max-h-[90vh] overflow-y-auto text-xs"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-indigo-600" />
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-[13px] tracking-tight">Supabase Veritabanı</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">BULUT BAĞLANTI DURUMU</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowSupabaseModal(false)}
                    className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Status Indicator Panel */}
                <div className="space-y-3 mb-4">
                  {supabaseStatus?.configured ? (
                    supabaseStatus.connected && supabaseStatus.table_exists ? (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 text-emerald-800 flex items-start gap-2.5">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-extrabold text-[11px] uppercase tracking-wide">Bulut Bağlantısı Aktif</p>
                          <p className="text-[10px] text-emerald-700/90 mt-0.5 leading-relaxed">
                            Uygulamanız Supabase PostgreSQL veritabanına sorunsuz bir şekilde bağlı. Tüm veri güncellemeleri anlık olarak bulut üzerine kaydedilmektedir.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3.5 text-rose-800 flex items-start gap-2.5">
                        <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-extrabold text-[11px] uppercase tracking-wide">Tablo veya İzin Hatası</p>
                          <p className="text-[10px] text-rose-700/90 mt-0.5 leading-relaxed">
                            {supabaseStatus.error_message || "Supabase projenizde 'app_state' tablosu bulunamadı. Lütfen aşağıdaki SQL komutunu SQL Editor'de çalıştırın."}
                          </p>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-slate-700 flex items-start gap-2.5">
                      <Database className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-extrabold text-[11px] uppercase tracking-wide">Supabase Henüz Bağlanmadı</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                          Supabase Project URL ve Anon Key bilgilerinizi girerek uygulamanızı canlı bulut veritabanınıza bağlayabilirsiniz.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Seed / Push Cloud Data Button for Admin */}
                  {(userRole === "admin" || userRole === "master_admin") && supabaseStatus?.connected && (
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider">Bulut Veri Yükleme (Seed)</span>
                        <UploadCloud className="h-3.5 w-3.5 text-indigo-600" />
                      </div>
                      <p className="text-[10px] text-indigo-700 leading-relaxed">
                        Yerel bellekteki tüm modelleri, kumaşları, fason ve finansal kayıtları Supabase bulut veritabanına tek tıkla yükleyin.
                      </p>
                      <button
                        type="button"
                        onClick={handleSyncToCloud}
                        disabled={isSyncingToCloud}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        {isSyncingToCloud ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Buluta Aktarılıyor...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="h-3.5 w-3.5" />
                            <span>Tüm Verileri Buluta Aktar</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Dynamic Database Connection Inputs */}
                  <form onSubmit={handleSaveCustomDb} className="bg-slate-50/50 rounded-2xl p-3.5 border border-slate-100 space-y-2.5">
                    <h4 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider flex items-center justify-between">
                      <span>Yeni Veritabanı Bağla</span>
                      <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
                    </h4>
                    
                    <div className="space-y-2 text-[10px]">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Supabase Project URL</label>
                        <input
                          type="url"
                          placeholder="https://your-project.supabase.co"
                          value={customUrlInput}
                          onChange={(e) => setCustomUrlInput(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-[10px] text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
                          disabled={isConfiguringDb}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Supabase Anon Public Key</label>
                        <input
                          type="password"
                          placeholder="eyJhbGciOi..."
                          value={customAnonInput}
                          onChange={(e) => setCustomAnonInput(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-[10px] text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
                          disabled={isConfiguringDb}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={isConfiguringDb}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-2 rounded-lg transition-all shadow-sm cursor-pointer text-center disabled:opacity-50"
                      >
                        {isConfiguringDb ? "Bağlanıyor..." : "Bağlantıyı Kur"}
                      </button>
                      
                      {(localStorage.getItem("CUSTOM_SUPABASE_URL") || supabaseStatus?.configured) && (
                        <button
                          type="button"
                          onClick={handleResetCustomDb}
                          disabled={isConfiguringDb}
                          className="px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold rounded-lg transition-all border border-rose-100 cursor-pointer text-center disabled:opacity-50"
                          title="Bağlantıyı Temizle & Kes"
                        >
                          Temizle
                        </button>
                      )}
                    </div>
                  </form>


                  {/* SQL Schema Command Box */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SQL Başlangıç Kodu</label>
                      <button
                        onClick={() => {
                          const sql = `CREATE TABLE IF NOT EXISTS app_state (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE app_state DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS profiles (
  email text PRIMARY KEY,
  user_role text NOT NULL,
  brand_code text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

INSERT INTO profiles (email, user_role, brand_code)
VALUES ('admin@tigercorp.com', 'admin', 'TIGER-CORP')
ON CONFLICT (email) DO NOTHING;`;
                          navigator.clipboard.writeText(sql);
                          triggerToast("SQL panoya kopyalandı! Supabase SQL Editor'de çalıştırabilirsiniz.", "success");
                        }}
                        className="flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-700 font-bold cursor-pointer"
                      >
                        <Copy className="h-3 w-3" />
                        <span>SQL Kopyala</span>
                      </button>
                    </div>
                    <pre className="p-2.5 bg-slate-900 text-indigo-200 font-mono text-[9px] rounded-xl overflow-x-auto leading-relaxed border border-slate-800">
{`CREATE TABLE IF NOT EXISTS app_state (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE app_state DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS profiles (
  email text PRIMARY KEY,
  user_role text NOT NULL,
  brand_code text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

INSERT INTO profiles (email, user_role, brand_code)
VALUES ('admin@tigercorp.com', 'admin', 'TIGER-CORP')
ON CONFLICT (email) DO NOTHING;`}
                    </pre>
                  </div>
                </div>

                <button
                  onClick={() => setShowSupabaseModal(false)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition-all shadow-md cursor-pointer text-center"
                >
                  Tamam, Kapat
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        
      </div>
    </div>
  );
}
