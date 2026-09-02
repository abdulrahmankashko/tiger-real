import React, { useState } from "react";
import { 
  X, ArrowLeft, Download, Plus, Trash2, Layers, DollarSign, Package, Percent, 
  Settings, Image as ImageIcon, Sparkles, CheckCircle2, ChevronRight, HelpCircle, Upload,
  Scissors, Boxes, FileCheck, ShieldCheck, ChevronDown, ChevronUp,
  ZoomIn, ZoomOut, Maximize2, RotateCcw, Palette, Camera, Check, Calculator, Coins,
  Calendar, Snowflake, Sun, Wind
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import { robotoRegular, robotoBold } from "../utils/fonts";
import autoTable from "jspdf-autotable";
// @ts-ignore
import reshaper from "arabic-persian-reshaper";
import { FashionModel, BomItem, InventoryItem, CustomCostLine, ModelSizeQty, ProductionItem, ModelColorPhoto } from "../types";
import { Language, TranslationDictionary } from "../translations";
import HandwritingSizeInput from "./HandwritingSizeInput";

const pdfTranslations = {
  TR: {
    title: "LOGO TIGER 3 // ERP - MALZEME (MODEL) KARTI VE RECETE DOKUMU",
    date: "Tarih",
    time: "Saat",
    page: "Sayfa",
    analysisTitle: "MODEL VE URETIM BILGILERI",
    modelCode: "Model Kodu:",
    modelName: "Model Adi:",
    season: "Sezon:",
    materialClass: "Malzeme Sinifi:",
    materialClassVal: "MAMUL - TEKSTIL HAZIR GIYIM",
    customerBrand: "Musteri / Marka:",
    docDate: "Kayit Tarihi:",
    laborCost: "Iscilik Gideri:",
    totalStockLabel: "Toplam Stok:",
    sec1Title: "SECTION [1]: DEPO VE VARYANT BAZINDA MAMUL STOK DAGILIMI",
    sec1Headers: ["Varyant Kodu", "Renk Aciklamasi", "Beden", "Ambar / Depo Adi", "Mevcut Stok (Adet)"],
    sec1Total: "GENEL STOK TOPLAMI",
    sec2Title: "SECTION [2]: URETIM RECETESI (BOM) - KUMAS BILESENLERI",
    sec2Headers: ["Kumas Kodu", "Kumas Aciklamasi / Renk", "Parti / Lot No", "Birim Sarfiyat", "Depo Stogu", "Birim Fiyat", "Toplam Tutar"],
    sec2Total: "KUMAS TOPLAMI",
    sec3Title: "SECTION [3]: URETIM RECETESI (BOM) - AKSESUAR BILESENLERI",
    sec3Headers: ["Malzeme Kodu", "Malzeme Aciklamasi", "Birim", "Birim Sarfiyat", "Depo Stogu", "Birim Fiyat", "Toplam Tutar"],
    sec3Total: "AKSESUAR TOPLAMI",
    sec4Title: "SECTION [4]: EKSTRA MALIYET VE GENEL GIDER SATIRLARI",
    sec4Headers: ["Gider / Islem Aciklamasi", "Tarih", "Birim Tutar"],
    sec4Total: "EKSTRA GIDERLER TOPLAMI",
    summaryTitle: "NET BIRIM MALIYET OZETI (1:1 HAM VERI - DONUSUMSUZ)",
    summaryFabric: "Kumas Maliyeti:",
    summaryAcc: "Aksesuar Maliyeti:",
    summaryLabor: "Iscilik Maliyeti:",
    summaryOverhead: "Ekstra Giderler:",
    summaryTotalUsd: "TOPLAM USD MALIYETI:",
    summaryTotalTry: "TOPLAM TRY (TL) MALIYETI:",
    summaryNote: "Net 1:1 hesaplama: Girdiginiz tutarlar birebir toplanmistir. Otomatik kur cevrimi veya katsayi uygulanmaz.",
    footerText: "TIGER ERP Maliyet Grubu ve Uretim Recetesi (BOM) Raporu.",
    photoMode: "Fotograf Modu",
    imagePlaceholder: "[ GORSEL YOK ]",
    unitPhoto: "Model Foto"
  },
  EN: {
    title: "LOGO TIGER 3 // ERP - MATERIAL (MODEL) CARD AND BOM REPORT",
    date: "Date",
    time: "Time",
    page: "Page",
    analysisTitle: "MODEL AND PRODUCTION DETAILS",
    modelCode: "Model Code:",
    modelName: "Model Name:",
    season: "Season:",
    materialClass: "Material Class:",
    materialClassVal: "FINISHED PRODUCT - READY WEAR",
    customerBrand: "Customer / Brand:",
    docDate: "Record Date:",
    laborCost: "Labor Cost:",
    totalStockLabel: "Total Stock:",
    sec1Title: "SECTION [1]: FINISHED PRODUCT STOCK DISTRIBUTION BY WAREHOUSE",
    sec1Headers: ["Variant Code", "Color", "Size", "Warehouse Name", "Current Stock (Pcs)"],
    sec1Total: "TOTAL FINISHED STOCK",
    sec2Title: "SECTION [2]: PRODUCTION RECIPE (BOM) - FABRIC COMPONENTS",
    sec2Headers: ["Fabric Code", "Fabric Description / Color", "Batch / Lot No", "Unit Usage", "Warehouse Stock", "Unit Price", "Total Cost"],
    sec2Total: "TOTAL FABRIC",
    sec3Title: "SECTION [3]: PRODUCTION RECIPE (BOM) - ACCESSORY COMPONENTS",
    sec3Headers: ["Material Code", "Description", "Unit", "Unit Usage", "Warehouse Stock", "Unit Price", "Total Cost"],
    sec3Total: "TOTAL ACCESSORY",
    sec4Title: "SECTION [4]: EXTRA OVERHEAD & CUSTOM COST LINES",
    sec4Headers: ["Expense / Process Description", "Date", "Unit Amount"],
    sec4Total: "TOTAL EXTRA OVERHEAD",
    summaryTitle: "NET UNIT COST SUMMARY (1:1 RAW PASS-THROUGH)",
    summaryFabric: "Fabric Cost:",
    summaryAcc: "Accessory Cost:",
    summaryLabor: "Labor Cost:",
    summaryOverhead: "Extra Overheads:",
    summaryTotalUsd: "TOTAL USD COST:",
    summaryTotalTry: "TOTAL TRY (TL) COST:",
    summaryNote: "Strict 1:1 calculation: Raw sum of entered item costs. No automated conversions or markups.",
    footerText: "TIGER ERP Cost Group and Production Recipe (BOM) Report.",
    photoMode: "Photo Mode",
    imagePlaceholder: "[ NO IMAGE ]",
    unitPhoto: "Model Photo"
  },
  AR: {
    title: "لوجو تايجر 3 // كشف بطاقة الموديل وجدول مستلزمات الإنتاج (BOM)",
    date: "تاريخ الكشف",
    time: "وقت الإصدار",
    page: "الصفحة",
    analysisTitle: "بيانات الموديل والإنتاج التفصيلية",
    modelCode: "رمز الموديل:",
    modelName: "اسم الموديل:",
    season: "الموسم:",
    materialClass: "تصنيف المادة:",
    materialClassVal: "ألبسة جاهزة - صناعة نسيجية سورية",
    customerBrand: "الزبون / الماركة:",
    docDate: "تاريخ التسجيل:",
    laborCost: "أجور الورشة / اليد العاملة:",
    totalStockLabel: "إجمالي الرصيد:",
    sec1Title: "الفقرة [1]: توزيع بضاعة الموديل الجاهزة في المستودعات (اللون والقياس)",
    sec1Headers: ["كود المتغير", "اسم اللون", "القياس", "المستودع / الصالة", "الرصيد الفعلي (قطعة)"],
    sec1Total: "مجموع البضاعة الجاهزة",
    sec2Title: "الفقرة [2]: أرصدة الأقمشة المخصصة لإنتاج الموديل (كشف الـ BOM)",
    sec2Headers: ["كود القماش", "وصف القماش / اللون", "رقم اللوت / الطبخة", "مصرف القطعة", "رصيد المستودع", "سعر الوحدة", "إجمالي الكلفة"],
    sec2Total: "إجمالي كلفة الأقمشة",
    sec3Title: "الفقرة [3]: أرصدة الملحقات والإكسسوارات الجارية للموديل",
    sec3Headers: ["كود المادة", "بيان المادة", "الوحدة", "مصرف القطعة", "رصيد المستودع", "سعر المفرد", "إجمالي الكلفة"],
    sec3Total: "إجمالي كلفة الإكسسوار",
    sec4Title: "الفقرة [4]: التكاليف الإضافية والمصاريف العامة",
    sec4Headers: ["بيان المصروف / العملية", "التاريخ", "المبلغ الفعلي"],
    sec4Total: "إجمالي المصاريف الإضافية",
    summaryTitle: "ملخص الكلفة الإفرادية الصافية (1:1 مطابقة تامة)",
    summaryFabric: "كلفة الأقمشة:",
    summaryAcc: "كلفة الإكسسوارات:",
    summaryLabor: "أجور الورشة:",
    summaryOverhead: "المصاريف الإضافية:",
    summaryTotalUsd: "إجمالي الكلفة بالدولار ($):",
    summaryTotalTry: "إجمالي الكلفة بالليرة التركية (₺):",
    summaryNote: "حساب مطابق 1:1: جمع مباشر للمبالغ المدخلة دون تحويل أسعار صرف أو مضاعفات.",
    footerText: "كشف حساب متكامل صادر عن نظام TIGER ERP لقسم الجودة والمطابقة والإنتاج.",
    photoMode: "معاينة الصور",
    imagePlaceholder: "[ لا توجد صورة ]",
    unitPhoto: "صورة الموديل"
  }
};

interface ModelDetailSheetProps {
  model: FashionModel;
  bomItems: BomItem[];
  inventory: InventoryItem[];
  customCostLines: CustomCostLine[];
  userRole: string;
  onClose: () => void;
  onUpdateModel?: (id: string, updates: Partial<FashionModel>) => void;
  onDeleteModel?: (id: string) => void;
  onAddCustomCost: (name: string, cost: number, photo_url?: string, currency?: 'USD' | 'TRY', date?: string) => void;
  onRemoveCustomCost: (id: string) => void;
  onRegisterVariant: (color: string, size: string, warehouse: string, colorPhotoUrl?: string, date?: string) => void;
  onRemoveVariant: (id: string) => void;
  onAddBomItem: (item: Omit<BomItem, "id" | "model_id" | "created_at"> & { date?: string }) => void;
  onRemoveBomItem: (id: string) => void;
  onUpdateBomItem?: (id: string, updates: Partial<BomItem>) => void;
  triggerToast: (msg: string, type?: "success" | "error" | "info") => void;
  t: TranslationDictionary;
  language: Language;
  production?: ProductionItem[];
  registeredProfiles?: any[];
  customBrands?: Record<string, string>;
}

export default function ModelDetailSheet({
  model,
  bomItems,
  inventory,
  customCostLines,
  userRole,
  onClose,
  onUpdateModel,
  onDeleteModel,
  onAddCustomCost,
  onRemoveCustomCost,
  onRegisterVariant,
  onRemoveVariant,
  onAddBomItem,
  onRemoveBomItem,
  onUpdateBomItem,
  triggerToast,
  t,
  language,
  production = [],
  registeredProfiles = [],
  customBrands = {}
}: ModelDetailSheetProps) {

  // Delete Model Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Multi-Currency & Inline Editing states
  const [activeCurrency, setActiveCurrency] = useState<"USD" | "TRY" | "EUR">("USD");
  const [notes, setNotes] = useState((model as any).notes || "");
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState(model.name);
  const [editSmartId, setEditSmartId] = useState(model.smart_id);
  const [editCustomerName, setEditCustomerName] = useState(model.customer_name || "");
  const [editTargetPrice, setEditTargetPrice] = useState(model.target_price.toString());
  const [editLaborCost, setEditLaborCost] = useState(model.labor_cost.toString());
  const [editSeason, setEditSeason] = useState(model.season || "WINTER");
  const [editStage, setEditStage] = useState(model.stage || "Kalıp & Pastal");

  const convertCost = (costInUsd: number) => {
    return costInUsd;
  };
  
  const getCurrencySymbol = () => {
    if (activeCurrency === "TRY") return "₺";
    if (activeCurrency === "EUR") return "€";
    return "$";
  };

  const handleSaveNotes = () => {
    if (onUpdateModel) {
      onUpdateModel(model.id, { notes });
      triggerToast(language === "TR" ? "Notlar başarıyla kaydedildi." : "Notes saved successfully.", "success");
    }
  };

  const handleSaveInfo = () => {
    if (!editName.trim() || !editSmartId.trim()) {
      triggerToast(language === "TR" ? "Model adı ve kodu boş bırakılamaz." : "Model name and code cannot be empty.", "error");
      return;
    }
    
    // Determine the exact brand code based on selected customer name
    let modelBrandCode = "";
    const cleanCustomer = editCustomerName.trim();
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

    if (onUpdateModel) {
      onUpdateModel(model.id, {
        name: editName.trim(),
        smart_id: editSmartId.trim().toUpperCase(),
        customer_name: editCustomerName.trim(),
        brand_code: modelBrandCode,
        target_price: parseFloat(editTargetPrice) || 0,
        labor_cost: parseFloat(editLaborCost) || 0,
        season: editSeason as any,
        stage: editStage
      });
    }
    setIsEditingInfo(false);
    triggerToast(language === "TR" ? "Model bilgileri ve sezonu güncellendi." : "Model info and season updated.", "success");
  };

  // Production quantities editing state
  const [isEditingQuantities, setIsEditingQuantities] = useState(false);
  const [editRequestedQty, setEditRequestedQty] = useState("0");
  const [editCutQty, setEditCutQty] = useState("0");
  const [editSentQty, setEditSentQty] = useState("0");
  const [editSizesQty, setEditSizesQty] = useState<ModelSizeQty[]>([]);

  // Quick Quantity Calculator state
  const [calcColors, setCalcColors] = useState("4");
  const [calcSeries, setCalcSeries] = useState("11");
  const [calcSizes, setCalcSizes] = useState("8");

  // Active Selected Color / Photo
  const [activeColorId, setActiveColorId] = useState<string>("main"); // "main" or color photo id
  
  // Bom Editing State
  const [editingBomId, setEditingBomId] = useState<string | null>(null);
  const [editBomData, setEditBomData] = useState<{ consumption: string; unit_cost: string }>({ consumption: "0", unit_cost: "0" });

  // Lightbox / Fullscreen Zoom modal states
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Color Photos management modal / form
  const [showAddColorModal, setShowAddColorModal] = useState(false);
  const [newColorName, setNewColorName] = useState("");
  const [newColorCode, setNewColorCode] = useState("#4f46e5");
  const [newColorPhotoUrl, setNewColorPhotoUrl] = useState("");
  const [newColorPreview, setNewColorPreview] = useState<string | null>(null);
  const [newColorDate, setNewColorDate] = useState(new Date().toISOString().split("T")[0]);
  const [isUploadingColorPhoto, setIsUploadingColorPhoto] = useState(false);

  // Quick preset colors for quick creation (Blue, Beige, Green, Light Green + Classics)
  const PRESET_COLORS = [
    { name: "Mavi (Blue)", code: "#2563eb" },
    { name: "Bej (Beige)", code: "#d8c8b4" },
    { name: "Yeşil (Green)", code: "#16a34a" },
    { name: "Açık Yeşil (Light Green)", code: "#86efac" },
    { name: "Siyah (Black)", code: "#1e293b" },
    { name: "Beyaz (White)", code: "#f8fafc" },
    { name: "Haki Yeşili", code: "#4d5b43" },
    { name: "Lacivert", code: "#1e3a8a" },
    { name: "Kırmızı", code: "#dc2626" },
    { name: "Antrasit", code: "#334155" },
    { name: "Pudra", code: "#f472b6" },
    { name: "Vizon", code: "#78716c" },
  ];

  const PRESET_PHOTO_TAGS = [
    { label: "Ön Görünüm 1", icon: "📸" },
    { label: "Ön Görünüm 2", icon: "📸" },
    { label: "Arka Görünüm 1", icon: "📸" },
    { label: "Arka Görünüm 2", icon: "📸" },
    { label: "Bej Maliyet Görseli", icon: "🧾" },
    { label: "File / Mesh Ekranı", icon: "🕸️" },
  ];

  const handleColorPhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingColorPhoto(true);
    try {
      const { compressImage } = await import('../imageUtils');
      const compressedBase64 = await compressImage(file);
      setNewColorPreview(compressedBase64);
      setIsUploadingColorPhoto(false);
    } catch (err) {
      console.error(err);
      setIsUploadingColorPhoto(false);
    }
  };

  const handleAddColorPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColorName.trim()) {
      triggerToast(language === "TR" ? "Lütfen bir renk adı girin." : "Please enter a color name.", "error");
      return;
    }
    const finalPhotoUrl = newColorPreview || newColorPhotoUrl.trim();
    if (!finalPhotoUrl) {
      triggerToast(language === "TR" ? "Lütfen bu renge ait bir fotoğraf yükleyin veya URL girin." : "Please upload or provide a photo URL for this color.", "error");
      return;
    }

    const newColorItem: ModelColorPhoto = {
      id: "cp_" + Math.random().toString(36).substring(2, 9),
      color: newColorName.trim(),
      color_code: newColorCode,
      photo_url: finalPhotoUrl,
      created_at: newColorDate || new Date().toISOString().split("T")[0],
      date: newColorDate || new Date().toISOString().split("T")[0]
    };

    const updatedColorPhotos = [...(model.color_photos || []), newColorItem];
    if (onUpdateModel) {
      onUpdateModel(model.id, {
        color_photos: updatedColorPhotos
      });
    }

    setActiveColorId(newColorItem.id);
    setNewColorName("");
    setNewColorPhotoUrl("");
    setNewColorPreview(null);
    setNewColorDate(new Date().toISOString().split("T")[0]);
    setShowAddColorModal(false);
    triggerToast(language === "TR" ? `"${newColorItem.color}" renk varyantı fotoğrafı eklendi!` : `Color variant "${newColorItem.color}" added!`, "success");
  };

  const handleDeleteColorPhoto = (colorPhotoId: string, colorName: string) => {
    const updatedColorPhotos = (model.color_photos || []).filter(cp => cp.id !== colorPhotoId);
    if (onUpdateModel) {
      onUpdateModel(model.id, {
        color_photos: updatedColorPhotos
      });
    }
    if (activeColorId === colorPhotoId) {
      setActiveColorId("main");
    }
    triggerToast(language === "TR" ? `"${colorName}" renk fotoğrafı silindi.` : `Color photo "${colorName}" removed.`, "info");
  };

  const openLightbox = (colorId?: string) => {
    if (colorId) setActiveColorId(colorId);
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
    setIsLightboxOpen(true);
  };

  const handleZoomIn = () => {
    setLightboxZoom(prev => Math.min(Number((prev + 0.5).toFixed(1)), 4));
  };

  const handleZoomOut = () => {
    setLightboxZoom(prev => {
      const next = Math.max(Number((prev - 0.5).toFixed(1)), 1);
      if (next === 1) setLightboxPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
  };

  // Add new size row state during editing
  const [newEditSize, setNewEditSize] = useState("0-3 Ay");
  const [newEditColor, setNewEditColor] = useState("");
  const [newEditReq, setNewEditReq] = useState("0");
  const [newEditCut, setNewEditCut] = useState("0");
  const [newEditSent, setNewEditSent] = useState("0");

  const startEditingQuantities = () => {
    setEditRequestedQty((model.requested_qty || 0).toString());
    setEditCutQty((model.cut_qty || 0).toString());
    setEditSentQty((model.sent_qty || 0).toString());
    setEditSizesQty(model.sizes_qty || []);
    setIsEditingQuantities(true);
  };

  const handleStartEditBom = (bom: BomItem) => {
    setEditingBomId(bom.id);
    setEditBomData({ consumption: bom.consumption.toString(), unit_cost: bom.unit_cost.toString() });
  };

  const handleSaveEditBom = () => {
    if (!editingBomId || !onUpdateBomItem) return;
    onUpdateBomItem(editingBomId, { 
      consumption: parseFloat(editBomData.consumption) || 0,
      unit_cost: parseFloat(editBomData.unit_cost) || 0,
    });
    setEditingBomId(null);
  };

  const handleSaveQuantities = () => {
    if (!onUpdateModel) return;

    let finalRequested = parseInt(editRequestedQty) || 0;
    let finalCut = parseInt(editCutQty) || 0;
    let finalSent = parseInt(editSentQty) || 0;

    onUpdateModel(model.id, {
      requested_qty: finalRequested,
      cut_qty: finalCut,
      sent_qty: finalSent,
      sizes_qty: editSizesQty
    });

    setIsEditingQuantities(false);
    triggerToast(language === "TR" ? "Üretim adetleri başarıyla güncellendi." : "Production quantities updated successfully.", "success");
  };

  const handleAddEditSizeRow = () => {
    const req = parseInt(newEditReq) || 0;
    const cut = parseInt(newEditCut) || 0;
    const sent = parseInt(newEditSent) || 0;
    const colorVal = newEditColor.trim();

    if (editSizesQty.some(item => item.size === newEditSize && (item.color || "") === colorVal)) {
      triggerToast(language === "TR" ? "Bu beden ve renk kombinasyonu zaten listede var." : "This size and color combination already exists in the list.", "error");
      return;
    }

    const newItem: ModelSizeQty = {
      size: newEditSize,
      color: colorVal || undefined,
      requested_qty: req,
      cut_qty: cut,
      sent_qty: sent
    };

    const nextList = [...editSizesQty, newItem];
    setEditSizesQty(nextList);

    const totalReq = nextList.reduce((sum, i) => sum + i.requested_qty, 0);
    const totalCut = nextList.reduce((sum, i) => sum + i.cut_qty, 0);
    const totalSent = nextList.reduce((sum, i) => sum + i.sent_qty, 0);
    setEditRequestedQty(totalReq.toString());
    setEditCutQty(totalCut.toString());
    setEditSentQty(totalSent.toString());

    setNewEditReq("0");
    setNewEditCut("0");
    setNewEditSent("0");
    setNewEditColor("");
  };

  const handleRemoveEditSizeRow = (sizeToRemove: string, colorToRemove?: string) => {
    const nextList = editSizesQty.filter(item => !(item.size === sizeToRemove && (item.color || "") === (colorToRemove || "")));
    setEditSizesQty(nextList);

    const totalReq = nextList.reduce((sum, i) => sum + i.requested_qty, 0);
    const totalCut = nextList.reduce((sum, i) => sum + i.cut_qty, 0);
    const totalSent = nextList.reduce((sum, i) => sum + i.sent_qty, 0);
    setEditRequestedQty(totalReq.toString());
    setEditCutQty(totalCut.toString());
    setEditSentQty(totalSent.toString());
  };

  const handleUpdateEditSizeItem = (index: number, field: "requested_qty" | "cut_qty" | "sent_qty", value: string) => {
    const val = parseInt(value) || 0;
    const nextList = editSizesQty.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: val };
      }
      return item;
    });
    setEditSizesQty(nextList);

    const totalReq = nextList.reduce((sum, i) => sum + i.requested_qty, 0);
    const totalCut = nextList.reduce((sum, i) => sum + i.cut_qty, 0);
    const totalSent = nextList.reduce((sum, i) => sum + i.sent_qty, 0);
    setEditRequestedQty(totalReq.toString());
    setEditCutQty(totalCut.toString());
    setEditSentQty(totalSent.toString());
  };
  
  // Custom Cost Modal state
  const [showCostModal, setShowCostModal] = useState(false);
  const [newCostName, setNewCostName] = useState("");
  const [newCostValue, setNewCostValue] = useState("1.00");
  const [newCostCurrency, setNewCostCurrency] = useState<"USD" | "TRY">("USD");
  const [newCostPhotoUrl, setNewCostPhotoUrl] = useState("");
  const [newCostFilePreview, setNewCostFilePreview] = useState<string | null>(null);
  const [newCostDragActive, setNewCostDragActive] = useState(false);
  const [newCostDate, setNewCostDate] = useState(new Date().toISOString().split("T")[0]);

  const handleCostDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setNewCostDragActive(true);
    } else if (e.type === "dragleave") {
      setNewCostDragActive(false);
    }
  };

  const processCostImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      triggerToast(language === "TR" ? "Lütfen geçerli bir resim dosyası seçin." : language === "AR" ? "يرجى تحديد ملف صورة صالح." : "Please select a valid image file.", "error");
      return;
    }

    try {
      const { compressImage } = await import('../imageUtils');
      const compressedBase64 = await compressImage(file);
      setNewCostPhotoUrl(compressedBase64);
      setNewCostFilePreview(compressedBase64);
      triggerToast(language === "TR" ? "Maliyet görseli başarıyla yüklendi!" : language === "AR" ? "تم تحميل صورة التكلفة بنجاح!" : "Cost image uploaded successfully!");
    } catch (err) {
      console.error(err);
      triggerToast("Görsel yüklenemedi.", "error");
    }
  };

  const handleCostDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNewCostDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processCostImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleCostFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processCostImageFile(e.target.files[0]);
    }
  };

  const handleVariantDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setVariantDragActive(true);
    } else if (e.type === "dragleave") {
      setVariantDragActive(false);
    }
  };

  const processVariantImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      triggerToast(language === "TR" ? "Lütfen geçerli bir resim dosyası seçin." : language === "AR" ? "يرجى تحديد ملف صورة صالح." : "Please select a valid image file.", "error");
      return;
    }

    try {
      const { compressImage } = await import('../imageUtils');
      const compressedBase64 = await compressImage(file);
      setVariantPhotoUrl(compressedBase64);
      setVariantFilePreview(compressedBase64);
      triggerToast(language === "TR" ? "Varyant görseli başarıyla yüklendi!" : language === "AR" ? "تم تحميل صورة Varyant بنجاح!" : "Variant image uploaded successfully!");
    } catch (err) {
      console.error(err);
      triggerToast("Görsel yüklenemedi.", "error");
    }
  };

  const handleVariantDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setVariantDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processVariantImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleVariantFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processVariantImageFile(e.target.files[0]);
    }
  };

  // Variant Registry state
  const [variantColor, setVariantColor] = useState("");
  const [variantSize, setVariantSize] = useState("0 Yaş");
  const [variantWarehouse, setVariantWarehouse] = useState("01 - Merkez Depo");
  const [variantPhotoUrl, setVariantPhotoUrl] = useState("");
  const [variantFilePreview, setVariantFilePreview] = useState<string | null>(null);
  const [variantDragActive, setVariantDragActive] = useState(false);
  const [variantDate, setVariantDate] = useState(new Date().toISOString().split("T")[0]);

  // BOM Form state
  const [showBomForm, setShowBomForm] = useState(false);
  const [bomItemType, setBomItemType] = useState<"Kumaş" | "Aksesuar">("Kumaş");
  const [bomItemName, setBomItemName] = useState("");
  const [bomItemSmartId, setBomItemSmartId] = useState("");
  const [bomItemPatternName, setBomItemPatternName] = useState("");
  const [bomItemColorName, setBomItemColorName] = useState("");
  const [bomItemColorCode, setBomItemColorCode] = useState("");
  const [bomItemIncomingMeters, setBomItemIncomingMeters] = useState("");
  const [bomItemColorIncomingMeters, setBomItemColorIncomingMeters] = useState("");
  const [bomItemLotNo, setBomItemLotNo] = useState("");
  const [bomItemConsumption, setBomItemConsumption] = useState("1.0");
  const [bomItemUnit, setBomItemUnit] = useState("Mt");
  const [bomItemUnitCost, setBomItemUnitCost] = useState("");
  const [bomItemCurrency, setBomItemCurrency] = useState<"USD" | "TRY">("USD");
  const [bomItemPhotoUrl, setBomItemPhotoUrl] = useState("");
  const [bomItemDate, setBomItemDate] = useState(new Date().toISOString().split("T")[0]);

  // PDF Export Option
  const [withPhotos, setWithPhotos] = useState(true);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfLang, setPdfLang] = useState<Language>("TR");
  const [isDownloadingFont, setIsDownloadingFont] = useState(false);

  // BOM Image drag & drop states
  const [bomDragActive, setBomDragActive] = useState(false);
  const [bomFilePreview, setBomFilePreview] = useState<string | null>(null);

  const handleBomDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setBomDragActive(true);
    } else if (e.type === "dragleave") {
      setBomDragActive(false);
    }
  };

  const processBomImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      triggerToast(language === "TR" ? "Lütfen geçerli bir resim dosyası seçin." : language === "AR" ? "يرجى تحديد ملف صورة صالح." : "Please select a valid image file.", "error");
      return;
    }

    try {
      const { compressImage } = await import('../imageUtils');
      const compressedBase64 = await compressImage(file);
      setBomItemPhotoUrl(compressedBase64);
      setBomFilePreview(compressedBase64);
      triggerToast(language === "TR" ? "Malzeme görseli başarıyla yüklendi!" : language === "AR" ? "تم تحميل صورة المادة بنجاح!" : "Material image uploaded successfully!");
    } catch (err) {
      console.error(err);
      triggerToast("Görsel yüklenemedi.", "error");
    }
  };

  const handleBomDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBomDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processBomImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleBomFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processBomImageFile(e.target.files[0]);
    }
  };

  const loadArabicFont = async (doc: jsPDF) => {
    try {
      const fontUrl = "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/Amiri-Regular.ttf";
      const response = await fetch(fontUrl);
      if (!response.ok) throw new Error("Font fetch failed");
      const arrayBuffer = await response.arrayBuffer();
      
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      const chunk = 8192;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
      }
      const base64 = window.btoa(binary);
      
      doc.addFileToVFS("Amiri-Regular.ttf", base64);
      doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
      return true;
    } catch (error) {
      console.error("Arabic font load failed, falling back to Helvetica:", error);
      return false;
    }
  };

  // Currency helper
  const getItemCurrency = (curr?: string): "USD" | "TRY" => {
    if (curr === "TRY" || curr === "TL" || curr === "₺") return "TRY";
    return "USD";
  };

  // Filter items for this specific model
  const modelBoms = bomItems.filter(b => b.model_id === model.id);
  const modelInventory = inventory.filter(i => i.model_id === model.id);
  const modelOverheads = customCostLines.filter(c => c.model_id === model.id);

  // Calculations - Strict 1:1 separate USD and TRY (No automatic cross-conversion, no inflation)
  const bomCostUsd = modelBoms
    .filter(b => getItemCurrency(b.currency) === "USD")
    .reduce((sum, item) => sum + (item.consumption * item.unit_cost), 0);

  const bomCostTry = modelBoms
    .filter(b => getItemCurrency(b.currency) === "TRY")
    .reduce((sum, item) => sum + (item.consumption * item.unit_cost), 0);

  const overheadCostUsd = modelOverheads
    .filter(c => getItemCurrency(c.currency) === "USD")
    .reduce((sum, item) => sum + item.cost, 0);

  const overheadCostTry = modelOverheads
    .filter(c => getItemCurrency(c.currency) === "TRY")
    .reduce((sum, item) => sum + item.cost, 0);

  const laborCostUsd = model.labor_cost || 0;

  const totalCostUsd = bomCostUsd + overheadCostUsd + laborCostUsd;
  const totalCostTry = bomCostTry + overheadCostTry;

  // Strict 1:1 pass-through references (NO cross-currency conversion / no hidden inflation)
  const materialCost = bomCostUsd;
  const laborCost = laborCostUsd;
  const overheadCost = overheadCostUsd;
  const totalCost = totalCostUsd;
  const targetPrice = model.target_price || 0;
  const profit = targetPrice - totalCost;
  const margin = targetPrice > 0 ? (profit / targetPrice) * 100 : 0;

  // Handlers
  const handleAddCustomCostLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCostName.trim() || isNaN(parseFloat(newCostValue))) {
      triggerToast("Lütfen geçerli bir açıklama ve tutar girin.", "error");
      return;
    }
    onAddCustomCost(newCostName.trim(), parseFloat(newCostValue), newCostPhotoUrl || undefined, newCostCurrency, newCostDate);
    setNewCostName("");
    setNewCostValue("1.00");
    setNewCostCurrency("USD");
    setNewCostPhotoUrl("");
    setNewCostFilePreview(null);
    setNewCostDate(new Date().toISOString().split("T")[0]);
    setShowCostModal(false);
  };

  const handleRegisterVariantLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!variantColor.trim()) {
      triggerToast("Lütfen bir renk girin.", "error");
      return;
    }
    onRegisterVariant(variantColor.trim(), variantSize, variantWarehouse, variantPhotoUrl || undefined, variantDate);
    setVariantColor("");
    setVariantPhotoUrl("");
    setVariantFilePreview(null);
    setVariantDate(new Date().toISOString().split("T")[0]);
  };

  const handleAddBomItemLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bomItemName.trim() || !bomItemSmartId.trim() || isNaN(parseFloat(bomItemConsumption))) {
      triggerToast("Lütfen zorunlu alanları (Kumaş Adı, Kod, Sarfiyat) girin.", "error");
      return;
    }

    const enteredUnitCost = parseFloat(bomItemUnitCost) || 0;
    const incMeters = bomItemIncomingMeters ? parseFloat(bomItemIncomingMeters) : undefined;
    const colorIncMeters = bomItemColorIncomingMeters ? parseFloat(bomItemColorIncomingMeters) : undefined;
    
    onAddBomItem({
      item_smart_id: bomItemSmartId.trim().toUpperCase(),
      item_name: bomItemName.trim(),
      item_type: bomItemType,
      pattern_name: bomItemPatternName.trim() || undefined,
      color_name: bomItemColorName.trim() || undefined,
      color_code: bomItemColorCode.trim() || undefined,
      incoming_meters: incMeters,
      color_incoming_meters: colorIncMeters,
      lot_no: bomItemLotNo.trim() || "Lot: N/A",
      consumption: parseFloat(bomItemConsumption) || 1.0,
      unit: bomItemUnit,
      warehouse_stock: incMeters || 500,
      unit_cost: enteredUnitCost,
      currency: bomItemCurrency,
      item_photo_url: bomItemPhotoUrl.trim() || "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=200",
      date: bomItemDate
    });

    // Reset form
    setBomItemName("");
    setBomItemSmartId("");
    setBomItemPatternName("");
    setBomItemColorName("");
    setBomItemColorCode("");
    setBomItemIncomingMeters("");
    setBomItemColorIncomingMeters("");
    setBomItemLotNo("");
    setBomItemConsumption("1.0");
    setBomItemUnit(bomItemType === "Kumaş" ? "Mt" : "Adet");
    setBomItemUnitCost("");
    setBomItemCurrency("USD");
    setBomItemPhotoUrl("");
    setBomItemDate(new Date().toISOString().split("T")[0]);
    setBomFilePreview(null);
    setShowBomForm(false);
  };

  const cleanText = (str: string): string => {
    if (!str) return "";
    return str
      .replace(/ğ/g, "g").replace(/Ğ/g, "G")
      .replace(/ü/g, "u").replace(/Ü/g, "U")
      .replace(/ş/g, "s").replace(/Ş/g, "S")
      .replace(/ı/g, "i").replace(/İ/g, "I")
      .replace(/ö/g, "o").replace(/Ö/g, "O")
      .replace(/ç/g, "c").replace(/Ç/g, "C")
      .replace(/Â/g, "A").replace(/â/g, "a")
      .replace(/Î/g, "I").replace(/î/g, "i");
  };

  const fixArabicText = (text: string): string => {
    if (!text) return "";
    
    // Check if it actually contains Arabic characters
    const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
    if (!hasArabic) {
      return text;
    }

    let reshaped = text;
    try {
      const shaperModule = reshaper as any;
      const arabicShaper = shaperModule?.ArabicShaper || shaperModule?.default?.ArabicShaper;
      if (arabicShaper && typeof arabicShaper.convertArabic === "function") {
        reshaped = arabicShaper.convertArabic(text);
      } else {
        const convertFn = shaperModule?.convert || shaperModule?.default?.convert || shaperModule;
        if (typeof convertFn === "function") {
          reshaped = convertFn(text);
        }
      }
    } catch (err) {
      console.error("Arabic reshape convert failed:", err);
    }

    // Process word by word to preserve correct flow of English words/numbers in RTL layout
    const words = reshaped.split(" ");
    const processedWords = words.map((word) => {
      const wordHasArabic = /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(word);
      if (wordHasArabic) {
        // Reverse characters of the Arabic word
        return word.split("").reverse().join("");
      }
      return word;
    });

    // Reverse the overall words sequence to match RTL reading order
    return processedWords.reverse().join(" ");
  };

  const handleGeneratePdf = async () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    
    // Add Turkish Fonts
    doc.addFileToVFS("Roboto-Regular.ttf", robotoRegular);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.addFileToVFS("Roboto-Bold.ttf", robotoBold);
    doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

    const now = new Date();
    const formattedDate = now.toLocaleDateString("tr-TR");

    // Colors
    const primaryColor = [91, 33, 182]; // violet-800
    const subtitleColor = [100, 116, 139]; // slate-500
    
    // Header
    doc.setFont("Roboto", "bold");
    doc.setFontSize(16);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("TEKSTİL FABRİKA YÖNETİM SİSTEMİ", 12, 16);
    
    // Subtitle
    doc.setDrawColor(217, 70, 239); // fuchsia-500
    doc.setLineWidth(0.8);
    doc.line(12, 19, 12, 23);
    
    doc.setFontSize(10);
    doc.setTextColor(subtitleColor[0], subtitleColor[1], subtitleColor[2]);
    doc.text("FOTOĞRAFLI, FİYATLI MODEL VE STOK YÖNETİM RAPORU", 14, 22.5);
    
    // Date and Currency
    doc.setFont("Roboto", "normal");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text("Rapor Tarihi: " + formattedDate, 198, 18, { align: "right" });
    doc.text("Para Birimi: USD ($) / TRY (₺)", 198, 22, { align: "right" });
    
    // Thick Header Line
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.6);
    doc.line(12, 26, 198, 26);
    
    // --- Model Information Box ---
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(12, 32, 40, 50, 1, 1, "FD");
    
    if (model.photo_url) {
      try {
        const base64Img = model.photo_url;
        // Check if it's already a data URL, otherwise assume we might need to handle it or it's a direct URL
        if (base64Img.startsWith("data:image")) {
          // Extracts type (e.g. image/png -> PNG, image/jpeg -> JPEG)
          let format = "JPEG";
          if (base64Img.indexOf("image/png") !== -1 || base64Img.indexOf("image/PNG") !== -1) {
             format = "PNG";
          }
          doc.addImage(base64Img, format, 13, 33, 38, 48);
        } else {
          // If it's a URL, jsPDF can sometimes fetch it if CORS allows, but adding base64 is safer.
          // Since our app uses compressImage, photo_url is almost certainly a data URI.
          // If it isn't, we'll try to add it as JPEG.
          doc.addImage(base64Img, "JPEG", 13, 33, 38, 48);
        }
      } catch (err) {
        doc.setFont("Roboto", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("[ GÖRSEL YÜKLENEMEDİ ]", 32, 58, { align: "center" });
      }
    } else {
      doc.setFont("Roboto", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("[ MODEL GÖRSELİ ]", 32, 58, { align: "center" });
    }
    
    // --- CALCULATIONS (Strict Currency Separation) ---
    const fabrics = modelBoms.filter(b => b.item_type === "Kumaş");
    const accessories = modelBoms.filter(b => b.item_type === "Aksesuar");
    
    let materialCostUsd = 0;
    let materialCostTry = 0;
    modelBoms.forEach(item => {
      const cost = item.consumption * item.unit_cost;
      if (getItemCurrency(item.currency) === "TRY") materialCostTry += cost;
      else materialCostUsd += cost;
    });

    let customCostUsd = 0;
    let customCostTry = 0;
    customCostLines.forEach(item => {
      if (getItemCurrency(item.currency) === "TRY") customCostTry += item.cost;
      else customCostUsd += item.cost;
    });

    let laborCostUsd = (model.labor_cost || 0) + customCostUsd;
    let laborCostTry = customCostTry;
    
    let totalCostUsd = materialCostUsd + laborCostUsd;
    let totalCostTry = materialCostTry + laborCostTry;
    
    const targetPrice = model.target_price || 0; // target price is USD in this domain
    
    // Note: Profit margin is hard to calculate properly with mixed currencies without an exchange rate. 
    // We'll calculate it just on USD for simplicity, or exclude TRY from percentage if it's mixed.
    // For now, we do ((targetPrice - totalCostUsd) / targetPrice) * 100 as a base, 
    // but we can just show it cleanly.
    let margin = 0;
    if (targetPrice > 0) {
      margin = ((targetPrice - totalCostUsd) / targetPrice) * 100;
    }
    
    const formatCost = (usd, tryCost) => {
      let parts = [];
      if (usd > 0 || tryCost === 0) parts.push(`$${usd.toFixed(2)}`);
      if (tryCost > 0) parts.push(`₺${tryCost.toFixed(2)}`);
      return parts.join(" + ");
    };
    
    // Grid Setup
    const leftColX = 56;
    const leftValX = 86;
    const rightColX = 135;
    const rightValX = 170;
    let currentY = 36;
    const yStep = 9;
    
    const drawField = (label, val, xL, xV, y, isRight=false, subtitle='') => {
      doc.setFont("Roboto", "bold");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(label, xL, y);
      
      doc.setFont("Roboto", "normal");
      doc.setTextColor(30, 41, 59);
      if(isRight && (val.includes("$") || val.includes("₺"))) {
         doc.setTextColor(190, 24, 93); // rose-700
         doc.setFont("Roboto", "bold");
      }
      doc.text(val, xV, y);
      
      if (subtitle) {
         doc.setFont("Roboto", "normal");
         doc.setFontSize(7);
         doc.setTextColor(148, 163, 184); // slate-400
         doc.text(subtitle, xV, y + 4);
      }
    };
    
    drawField("Model Kodu:", model.smart_id, leftColX, leftValX, currentY);
    drawField("Planlanan Satış:", `$${targetPrice.toFixed(2)}`, rightColX, rightValX, currentY, true);
    
    currentY += yStep;
    drawField("Model Adı:", model.name || "-", leftColX, leftValX, currentY);
    drawField("Toplam Malzeme\nMaliyeti:", formatCost(materialCostUsd, materialCostTry), rightColX, rightValX, currentY - 3, true);

    currentY += yStep;
    drawField("Grup / Kategori:", model.season || "-", leftColX, leftValX, currentY);
    drawField("Fason İşçilik\nMaliyeti:", formatCost(laborCostUsd, laborCostTry), rightColX, rightValX, currentY - 3, true);

    currentY += yStep;
    drawField("Ana Kumaş:", fabrics[0]?.item_name || "-", leftColX, leftValX, currentY);
    drawField("Toplam Üretim\nMaliyeti:", formatCost(totalCostUsd, totalCostTry), rightColX, rightValX, currentY - 3, true);

    currentY += yStep;
    drawField("Hedef Kitle / Sezon:", (model.season || "2026") + " Koleksiyonu", leftColX, leftValX, currentY);
    
    // Margin display
    doc.setFont("Roboto", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("Brüt Kar Marjı (%):", rightColX, currentY);
    doc.setFont("Roboto", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("%" + margin.toFixed(2), rightValX, currentY);
    
    const profitDiff = targetPrice - totalCostUsd;
    doc.setFont("Roboto", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`(+$${profitDiff.toFixed(2)} excl. TRY)`, rightValX + 10, currentY);
    
    // Divider for Logistics / Production Summary
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(12, 85, 198, 85);
    
    // PRODUCTION & LOGISTICS SUMMARY BLOCK
    const totalInventoryStock = modelInventory.reduce((s, i) => s + (i.stock_count || 0), 0);
    
    doc.setFont("Roboto", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text("TOPLAM KESİLEN / ÜRETİLEN ADET:", 12, 91);
    doc.setFont("Roboto", "normal");
    doc.text(`${model.cut_qty || 0} Adet`, 63, 91);

    doc.setFont("Roboto", "bold");
    doc.text("SEVK EDİLEN / MÜŞTERİYE GİDEN:", 88, 91);
    doc.setFont("Roboto", "normal");
    doc.text(`${model.sent_qty || 0} Adet`, 139, 91);

    doc.setFont("Roboto", "bold");
    doc.text("MEVCUT DEPO STOĞU:", 162, 91);
    doc.setFont("Roboto", "normal");
    if (totalInventoryStock > 0) doc.setTextColor(22, 163, 74); else doc.setTextColor(220, 38, 38);
    doc.text(`${totalInventoryStock} Adet`, 198, 91, { align: "right" });
    
    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(12, 95, 198, 95);
    
    let pageY = 103;

    const drawSectionTitle = (num, title, subtitle, y) => {
      doc.setDrawColor(190, 24, 93); // rose-700
      doc.setLineWidth(1.2);
      doc.line(12, y-3, 12, y+1);
      doc.setFont("Roboto", "bold");
      doc.setFontSize(9);
      doc.setTextColor(88, 28, 135); // violet-900
      doc.text(num + ". " + title, 15, y);
      
      doc.setFont("Roboto", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(subtitle, 12, y + 5);
      return y + 9;
    };
    
    // Section 1: Depo
    pageY = drawSectionTitle("1", "BİTMİŞ ÜRÜN (MAMUL) ASKI DEPO STOKLARI VE FİNANSAL DEĞERİ", "Depoda hazır bulunan ürünlerin beden bazlı dağılımı, maliyet ve toplam ciro değerleri.", pageY);
    
    const invHeaders = [["Smart ID", "Renk", "Beden", "Stok\n(Adet)", "Birim\nMaliyet ($)", "Birim\nMaliyet (₺)", "Birim\nSatış", "Toplam Satış\nDeğeri", "Durum"]];
    
    const invRows: any[] = modelInventory.map(item => {
      const stock = item.stock_count || 0;
      const isYeterli = stock >= 10;
      const isKritik = stock > 0 && stock < 10;
      let durumText = "Tükendi";
      if (isYeterli) durumText = "Yeterli";
      else if (isKritik) durumText = "Kritik";
      
      return [
        item.variant_smart_id,
        item.color,
        item.size,
        `${stock} Adet`,
        "$" + totalCostUsd.toFixed(2),
        "₺" + totalCostTry.toFixed(2),
        "$" + targetPrice.toFixed(2),
        "$" + (stock * targetPrice).toFixed(2),
        durumText
      ];
    });
    
    if (invRows.length === 0) {
      invRows.push(["-", "-", "-", "0 Adet", "-", "-", "-", "-", "-"]);
    }
    
    autoTable(doc, {
      head: invHeaders,
      body: invRows,
      startY: pageY,
      margin: { left: 12, right: 12 },
      styles: { fontSize: 7, font: "Roboto", halign: "center", cellPadding: 2, textColor: [30, 41, 59] },
      headStyles: { fillColor: [76, 52, 107], textColor: [255, 255, 255], fontStyle: "bold" },
      columnStyles: {
        0: { halign: "left" },
        1: { halign: "left" },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right" },
        6: { halign: "right" },
        7: { halign: "right" }
      },
      didParseCell: function(data) {
        if (data.section === "body" && data.column.index === 8 && data.cell.raw !== "-") {
          data.cell.text = [];
        }
      },
      didDrawCell: function(data) {
        if (data.section === "body" && data.column.index === 8 && data.cell.raw !== "-") {
          const text = data.cell.raw;
          let bgColor = [254, 226, 226]; // red-100
          let textColor = [220, 38, 38]; // red-600
          if (text === "Yeterli") {
            bgColor = [220, 252, 231]; // green-100
            textColor = [22, 163, 74]; // green-600
          } else if (text === "Kritik") {
            bgColor = [254, 249, 195]; // yellow-100
            textColor = [202, 138, 4]; // yellow-600
          }
          
          doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
          doc.rect(data.cell.x + 2, data.cell.y + 1, data.cell.width - 4, data.cell.height - 2, "F");
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          doc.setFont("Roboto", "bold");
          const icon = text === "Yeterli" ? "v" : text === "Kritik" ? "!" : "x";
          doc.text(icon + " " + text, data.cell.x + data.cell.width/2, data.cell.y + data.cell.height/2 + 1, { align: "center" });
        }
      }
    });
    
    pageY = (doc as any).lastAutoTable.finalY + 2;
    
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(12, pageY, 198, pageY);
    doc.setFont("Roboto", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text("TOPLAM DEPO:", 30, pageY + 5, { align: "right" });
    doc.text(`${totalInventoryStock} Adet`, 52, pageY + 5, { align: "right" });
    
    doc.text("Toplam Depo Maliyeti:", 106, pageY + 5, { align: "right" });
    doc.setTextColor(220, 38, 38); // red-600
    doc.text(`$${(totalInventoryStock * totalCostUsd).toFixed(2)} + ₺${(totalInventoryStock * totalCostTry).toFixed(2)}`, 140, pageY + 5, { align: "right" });
    
    doc.setTextColor(37, 99, 235); // blue-600
    doc.text("$" + (totalInventoryStock * targetPrice).toFixed(2), 175, pageY + 5, { align: "right" });
    
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("Beklenen\nCiro", 195, pageY + 4, { align: "center" });
    
    pageY += 14;
    
    // Section 2: Kumas
    pageY = drawSectionTitle("2", "MODELE AİT KUMAŞ STOKLARI VE BİRİM MALİYETLERİ", "1 adet abiye üretimi için harcanan (sarfiyat) kumaş miktarları ve depodaki mevcut kumaşların maliyet değeri.", pageY);
    
    const fabricHeaders = [["Smart ID", "Kumaş Tanımı", "Renk", "Birim\nSarfiyat", "Mevcut\nStok", "Birim\nFiyatı", "Birim Model\nMaliyeti", "Toplam Stok\nMaliyet Değeri"]];
    
    const fabricRows: any[] = fabrics.map(f => {
      const sym = getItemCurrency(f.currency) === "TRY" ? "₺" : "$";
      return [
        f.item_smart_id,
        f.item_name,
        f.color_name || "-",
        f.consumption + " mt",
        f.warehouse_stock + " mt",
        sym + f.unit_cost.toFixed(2),
        sym + (f.consumption * f.unit_cost).toFixed(2),
        sym + (f.warehouse_stock * f.unit_cost).toFixed(2)
      ];
    });
    
    if (fabricRows.length === 0) {
      fabricRows.push(["-", "Kumaş Yok", "-", "0", "0", "-", "-", "-"]);
    }
    autoTable(doc, {
      head: fabricHeaders,
      body: fabricRows,
      startY: pageY,
      margin: { left: 12, right: 12 },
      styles: { fontSize: 7, font: "Roboto", halign: "center", cellPadding: 2, textColor: [30, 41, 59], fillColor: [250, 250, 250] },
      headStyles: { fillColor: [76, 52, 107], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      columnStyles: {
        0: { halign: "left" },
        1: { halign: "left" },
        2: { halign: "left" },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right" },
        6: { halign: "right" },
        7: { halign: "right" }
      }
    });
    
    pageY = (doc as any).lastAutoTable.finalY + 2;
    const fabricSumUsd = fabrics.filter(f => getItemCurrency(f.currency) !== "TRY").reduce((s, i) => s + (i.consumption * i.unit_cost), 0);
    const fabricSumTry = fabrics.filter(f => getItemCurrency(f.currency) === "TRY").reduce((s, i) => s + (i.consumption * i.unit_cost), 0);
    const fabricMetres = fabrics.reduce((s, i) => s + i.consumption, 0);
    
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(12, pageY, 198, pageY);
    doc.setFont("Roboto", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text("Toplam Kumaş Maliyetleri:", 80, pageY + 5, { align: "right" });
    doc.text(fabricMetres.toFixed(2) + " mt", 100, pageY + 5, { align: "right" });
    
    doc.text("Model Başına:", 140, pageY + 5, { align: "right" });
    doc.setTextColor(220, 38, 38); // red-600
    doc.text(formatCost(fabricSumUsd, fabricSumTry), 170, pageY + 5, { align: "right" });
    
    doc.addPage();
    let page2Y = 16;
    
    // Section 3: Aksesuar
    page2Y = drawSectionTitle("3", "MODELE AİT AKSESUAR STOKLARI VE BİRİM MALİYETLERİ", "1 adet abiye üretimi için harcanan aksesuar miktarları ve depodaki mevcut stok maliyetleri.", page2Y);
    
    const accHeaders = [["Smart\nID", "Aksesuar Adı", "Birim", "Model\nSarfiyat", "Mevcut\nStok", "Birim Alış\nFiyatı", "Birim Model\nMaliyeti", "Durum"]];
    const accRows = accessories.map(a => {
      const sym = getItemCurrency(a.currency) === "TRY" ? "₺" : "$";
      const isYeterli = a.warehouse_stock >= a.consumption * 10;
      let durumText = "Sipariş";
      if (isYeterli) durumText = "Güvenli";
      else if (a.warehouse_stock < a.consumption) durumText = "Yetersiz";
      
      return [
        a.item_smart_id,
        a.item_name,
        a.unit,
        a.consumption + " " + a.unit,
        a.warehouse_stock + " " + a.unit,
        sym + a.unit_cost.toFixed(2),
        sym + (a.consumption * a.unit_cost).toFixed(2),
        durumText
      ];
    });
    
    if (accRows.length === 0) {
      accRows.push(["-", "Aksesuar Yok", "-", "-", "-", "-", "-", "-"]);
    }
    
    autoTable(doc, {
      head: accHeaders,
      body: accRows,
      startY: page2Y,
      margin: { left: 12, right: 12 },
      styles: { fontSize: 7, font: "Roboto", halign: "center", cellPadding: 2, textColor: [30, 41, 59], fillColor: [250, 250, 250] },
      headStyles: { fillColor: [76, 52, 107], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      columnStyles: {
        0: { halign: "left" },
        1: { halign: "left" },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right" },
        6: { halign: "right" }
      },
      didParseCell: function(data) {
        if (data.section === "body" && data.column.index === 7 && data.cell.raw !== "-") {
          data.cell.text = [];
        }
      },
      didDrawCell: function(data) {
        if (data.section === "body" && data.column.index === 7 && data.cell.raw !== "-") {
          const text = data.cell.raw;
          let bgColor = [254, 226, 226]; // red-100
          let textColor = [220, 38, 38]; // red-600
          if (text === "Güvenli") {
            bgColor = [220, 252, 231]; // green-100
            textColor = [22, 163, 74]; // green-600
          } else if (text === "Sipariş" || text === "Yetersiz") {
            bgColor = [254, 249, 195]; // yellow-100
            textColor = [202, 138, 4]; // yellow-600
          }
          
          doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
          doc.rect(data.cell.x + 2, data.cell.y + 1, data.cell.width - 4, data.cell.height - 2, "F");
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          doc.setFont("Roboto", "bold");
          const icon = text === "Güvenli" ? "v" : text === "Sipariş" ? "!" : "x";
          doc.text(icon + " " + text, data.cell.x + data.cell.width/2, data.cell.y + data.cell.height/2 + 1, { align: "center" });
        }
      }
    });
    
    page2Y = (doc as any).lastAutoTable.finalY + 2;
    const accSumUsd = accessories.filter(a => getItemCurrency(a.currency) !== "TRY").reduce((s, i) => s + (i.consumption * i.unit_cost), 0);
    const accSumTry = accessories.filter(a => getItemCurrency(a.currency) === "TRY").reduce((s, i) => s + (i.consumption * i.unit_cost), 0);
    
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(12, page2Y, 198, page2Y);
    doc.setFont("Roboto", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text("Toplam Aksesuar Maliyetleri:", 100, page2Y + 5, { align: "right" });
    
    doc.text("Model\nBaşına:", 125, page2Y + 4, { align: "center" });
    doc.setTextColor(220, 38, 38); // red-600
    doc.text(formatCost(accSumUsd, accSumTry), 160, page2Y + 5, { align: "right" });
    
    doc.setFont("Roboto", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("Reçete\nTamam", 180, page2Y + 4, { align: "center" });
    
    // Footer notes
    page2Y += 20;
    doc.setFont("Roboto", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("* Bu entegre rapor, Maliyet Muhasebesi ve Depo Yönetimi ortak verisidir.", 12, page2Y);
    doc.text("* Fason işçilik artışları, Kumaş ve Aksesuar maliyetleri direkt Üretim Maliyetini oluşturur.", 12, page2Y + 4);
    
    doc.setFont("Roboto", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    
    doc.text("TOTAL USD COST ($): $" + totalCostUsd.toFixed(2), 12, page2Y + 10);
    doc.text("TOTAL TRY COST (₺): ₺" + totalCostTry.toFixed(2), 12, page2Y + 14);

    doc.text("Mali Kontrol & Fabrika Müdürü", 160, page2Y + 4, { align: "center" });
    doc.setFont("Roboto", "normal");
    doc.setFontSize(7);
    doc.text("Onay İmzası", 160, page2Y + 8, { align: "center" });

    // Page numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont("Roboto", "normal");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(model.smart_id + " Özel Abiye Stok ve Maliyet Raporu", 12, 290);
      doc.text(i + " / " + totalPages, 198, 290, { align: "right" });
    }

    doc.save("TIGER_ERP_REPORT_" + model.smart_id + ".pdf");
    triggerToast("PDF Başarıyla İndirildi", "success");
    setShowPdfModal(false);
  };

  const colorPhotos: ModelColorPhoto[] = model.color_photos || [];
  
  const allGalleryItems = [
    {
      id: "main",
      color: language === "TR" ? "Ana Model Görseli" : "Main Photo",
      color_code: "#6366f1",
      photo_url: model.photo_url || "",
      is_main: true
    },
    ...colorPhotos
  ].filter(item => Boolean(item.photo_url));

  const currentDisplayedItem = allGalleryItems.find(item => item.id === activeColorId) || allGalleryItems[0] || {
    id: "main",
    color: language === "TR" ? "Ana Model Görseli" : "Main Photo",
    color_code: "#6366f1",
    photo_url: model.photo_url || "",
    is_main: true
  };

  const currentDisplayedPhoto = currentDisplayedItem.photo_url;
  const currentDisplayedColorName = currentDisplayedItem.color;

  return (
    <motion.div
      id="model-detail-sheet"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 24, stiffness: 220 }}
      className="absolute inset-0 bg-[#F8FAFC] z-20 flex flex-col h-full"
    >
      {/* Detailed Sheet Header Bar */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-xs shrink-0">
        <button 
          id="back-to-collection-btn"
          onClick={onClose}
          className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold text-xs cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t.tabDashboard}</span>
        </button>

        <h2 className="text-xs font-extrabold text-slate-800 tracking-wider uppercase">{language === "TR" ? "Model Kartı & Reçete" : language === "AR" ? "بطاقة المodيل وقائمة المواد" : "Model Card & BOM"}</h2>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          {onDeleteModel && (
            <button
              id="sheet-delete-model-btn"
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold px-2.5 py-1.5 rounded-xl border border-rose-200 transition-colors cursor-pointer"
              title={language === "TR" ? "Modeli Sil" : language === "AR" ? "حذف الموديل" : "Delete Model"}
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-600" />
              <span className="hidden sm:inline">{language === "TR" ? "Modeli Sil" : "Delete"}</span>
            </button>
          )}

          {userRole !== "staff" && (
            <button
              id="open-pdf-modal-btn"
              onClick={() => {
                setPdfLang(language); // default modal language to active system language
                setShowPdfModal(true);
              }}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Tiger 3 Raporu İndir"
            >
              <Download className="h-3.5 w-3.5" />
              <span>PDF Raporu</span>
            </button>
          )}
        </div>
      </div>

      {/* Sheet Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        
        {/* Main Image Banner with Zoom & Color Switcher */}
        <div className="rounded-3xl overflow-hidden shadow-xs bg-white border border-slate-150 p-2 space-y-2">
          {/* Main Visual Frame */}
          <div 
            id="model-main-photo-frame"
            className="h-56 sm:h-64 rounded-2xl overflow-hidden relative shadow-inner bg-slate-900 border border-slate-200/60 shrink-0 group cursor-zoom-in"
            onClick={() => openLightbox(activeColorId)}
          >
            {currentDisplayedPhoto ? (
              <img 
                src={currentDisplayedPhoto} 
                alt={`${model.name} - ${currentDisplayedColorName}`} 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-xs text-slate-400 font-mono gap-1">
                <ImageIcon className="h-8 w-8 text-slate-500 stroke-1" />
                <span>Görsel Mevcut Değil</span>
              </div>
            )}

            {/* Top Bar Badges & Zoom Trigger */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-1.5 pointer-events-auto">
                <span className="text-[10px] font-mono bg-indigo-600/90 backdrop-blur-md text-white px-2.5 py-1 rounded-xl font-extrabold uppercase shadow-xs">
                  {model.smart_id}
                </span>
                {activeColorId !== "main" && (
                  <span className="text-[10px] font-bold bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1">
                    <span 
                      className="w-2 h-2 rounded-full inline-block border border-white/40" 
                      style={{ backgroundColor: currentDisplayedItem.color_code || '#6366f1' }}
                    />
                    <span>{currentDisplayedColorName}</span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openLightbox(activeColorId);
                }}
                className="pointer-events-auto bg-black/60 hover:bg-black/80 backdrop-blur-md text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md hover:scale-105 cursor-pointer"
                title="Görseli Tam Ekran Büyüt"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span className="text-[10px] font-extrabold">{language === "TR" ? "Büyüt & İncele" : "Zoom Fullscreen"}</span>
              </button>
            </div>

            {/* Bottom Gradient with Model Info */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-3.5 text-white">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-sm sm:text-base font-black leading-tight">{model.name}</h3>
                  <p className="text-[10px] text-slate-300 mt-0.5 font-medium">
                    {language === "TR" ? "Müşteri" : language === "AR" ? "العميل" : "Customer"}: <strong className="text-white">{model.customer_name || "Fashion Luxe Inc."}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider block">
                    {allGalleryItems.length > 1 ? `${allGalleryItems.length} Renk & Fotoğraf` : "Tek Görsel"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* COLOR VARIATIONS & PHOTO SELECTOR STRIP */}
          <div className="pt-1 pb-1">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <div className="flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-indigo-600" />
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                  {language === "TR" ? "Model Renkleri & Fotoğrafları" : "Model Color Variants"}
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-bold">({allGalleryItems.length})</span>
              </div>

              {(userRole === "admin" || userRole === "master_admin") && (
                <button
                  type="button"
                  onClick={() => {
                    setNewColorName("");
                    setNewColorPhotoUrl("");
                    setNewColorPreview(null);
                    setShowAddColorModal(true);
                  }}
                  className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>{language === "TR" ? "Farklı Renk Ekle" : "Add Color Variant"}</span>
                </button>
              )}
            </div>

            {/* Horizontal Color Chips / Thumbnail Strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
              {allGalleryItems.map((item) => {
                const isActive = activeColorId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveColorId(item.id)}
                    className={`shrink-0 flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl border transition-all cursor-pointer select-none ${
                      isActive
                        ? "bg-indigo-50/90 border-indigo-500 shadow-2xs ring-2 ring-indigo-500/20"
                        : "bg-slate-50 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300 text-slate-600"
                    }`}
                  >
                    {/* Mini thumbnail */}
                    <div className="w-7 h-7 rounded-xl overflow-hidden bg-slate-200 border border-slate-200/80 shrink-0 relative">
                      {item.photo_url ? (
                        <img 
                          src={item.photo_url} 
                          alt={item.color} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-300">
                          <ImageIcon className="h-3 w-3 text-slate-500" />
                        </div>
                      )}
                      {item.color_code && (
                        <span 
                          className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-tl-md border-t border-l border-white"
                          style={{ backgroundColor: item.color_code }}
                        />
                      )}
                    </div>

                    <div className="text-left">
                      <span className={`text-[10px] font-black block leading-none ${isActive ? "text-indigo-900" : "text-slate-700"}`}>
                        {item.color}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 block mt-0.5">
                        {item.is_main ? (language === "TR" ? "Varsayılan" : "Default") : (language === "TR" ? "Renk Varyantı" : "Color")}
                        {(item.date || item.created_at) && (
                          <span className="ml-1 text-[8px] text-slate-400 font-mono">
                            • {item.date || (item.created_at ? item.created_at.split('T')[0] : '')}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Delete button for custom color photo (Admin only, not main) */}
                    {(userRole === "admin" || userRole === "master_admin") && !item.is_main && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(language === "TR" ? `"${item.color}" renk fotoğrafını silmek istiyor musunuz?` : `Delete color photo "${item.color}"?`)) {
                            handleDeleteColorPhoto(item.id, item.color);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded-lg hover:bg-rose-50 transition-colors ml-1 cursor-pointer"
                        title="Rengi Sil"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION 1: CORE MODEL INFO & PRODUCTION STATUS BADGE */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded font-extrabold uppercase">
                  {model.smart_id}
                </span>
                {(model.date || model.created_at) && (
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 flex items-center gap-1 font-mono">
                    <Calendar className="h-3 w-3 text-slate-500" />
                    <span>{model.date || (model.created_at ? model.created_at.split('T')[0] : '')}</span>
                  </span>
                )}
                {/* Model Season Badge */}
                {(() => {
                  const s = (model.season || "WINTER").toUpperCase();
                  const isSummer = s === "SUMMER" || s === "YAZ";
                  const isTrans = s === "TRANSITION" || s === "MEVSİM GEÇİŞİ" || s === "GEÇİŞ";
                  return (
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded border flex items-center gap-1 ${
                      isSummer ? "bg-amber-50 text-amber-900 border-amber-300" :
                      isTrans ? "bg-teal-50 text-teal-900 border-teal-300" :
                      "bg-sky-50 text-sky-900 border-sky-300"
                    }`}>
                      <span>{isSummer ? "☀️" : isTrans ? "🍂" : "❄️"}</span>
                      <span>
                        {isSummer 
                          ? (language === "TR" ? "Yaz Sezonu" : language === "AR" ? "الموسم الصيفي" : "Summer Season")
                          : isTrans
                          ? (language === "TR" ? "Mevsim Geçişi" : language === "AR" ? "موسم بين الفصول" : "Change of Seasons")
                          : (language === "TR" ? "Kış Sezonu" : language === "AR" ? "الموسم الشتوي" : "Winter Season")}
                      </span>
                    </span>
                  );
                })()}
              </div>
              <h3 className="text-base font-black text-slate-800 mt-2 leading-tight">{model.name}</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                {language === "TR" ? "Müşteri" : language === "AR" ? "العميل" : "Customer"}: <strong className="text-slate-600">{model.customer_name || "Fashion Luxe Inc."}</strong>
                {model.brand_code && <span className="ml-2 font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[9px] font-extrabold">{model.brand_code}</span>}
                <span className="ml-2 font-mono bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] font-extrabold">📌 {model.stage || "Kalıp & Pastal"}</span>
              </p>
            </div>
            
            {(userRole === "admin" || userRole === "master_admin") && (
              <button
                type="button"
                onClick={() => setIsEditingInfo(!isEditingInfo)}
                className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              >
                {isEditingInfo ? (language === "TR" ? "Vazgeç" : "Cancel") : (language === "TR" ? "Bilgileri Düzenle" : "Edit Info")}
              </button>
            )}
          </div>

          {/* Core Info Editing Form */}
          {isEditingInfo && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">{language === "TR" ? "Model Adı" : "Model Name"} *</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">{language === "TR" ? "Model Kodu" : "Model Code"} *</label>
                  <input
                    type="text"
                    value={editSmartId}
                    onChange={(e) => setEditSmartId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Sezon Düzenleme */}
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400">{language === "TR" ? "Model Sezonu" : "Model Season"}</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditSeason("WINTER")}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      editSeason === "WINTER" 
                        ? "bg-sky-500 text-white border-sky-600 shadow-xs" 
                        : "bg-white text-slate-600 border-slate-200 hover:bg-sky-50"
                    }`}
                  >
                    <Snowflake className="h-3.5 w-3.5" />
                    <span>{language === "TR" ? "Kış" : "Winter"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditSeason("SUMMER")}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      editSeason === "SUMMER" 
                        ? "bg-amber-500 text-slate-950 border-amber-600 shadow-xs" 
                        : "bg-white text-slate-600 border-slate-200 hover:bg-amber-50"
                    }`}
                  >
                    <Sun className="h-3.5 w-3.5" />
                    <span>{language === "TR" ? "Yaz" : "Summer"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditSeason("TRANSITION")}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      editSeason === "TRANSITION" 
                        ? "bg-teal-600 text-white border-teal-700 shadow-xs" 
                        : "bg-white text-slate-600 border-slate-200 hover:bg-teal-50"
                    }`}
                  >
                    <Wind className="h-3.5 w-3.5" />
                    <span>{language === "TR" ? "Geçiş" : "Transition"}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400">{language === "TR" ? "Müşteri / Marka" : "Brand / Customer"}</label>
                <select
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                >
                  <option value="">{language === "TR" ? "-- Marka Seçin --" : "Select Brand"}</option>
                  {registeredProfiles && registeredProfiles.map((p: any, idx) => (
                    <option key={idx} value={p.brand_name || p.brand_code || p.email}>
                      {p.brand_name || p.brand_code || p.email} ({p.brand_code || "N/A"})
                    </option>
                  ))}
                  {customBrands && Object.keys(customBrands).map((code) => (
                    <option key={code} value={customBrands[code]}>
                      {customBrands[code]} ({code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">{language === "TR" ? "Planlanan Satış ($)" : "Target Price ($)"}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editTargetPrice}
                    onChange={(e) => setEditTargetPrice(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">{language === "TR" ? "İşçilik Maliyeti ($)" : "Labor Cost ($)"}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editLaborCost}
                    onChange={(e) => setEditLaborCost(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400">{language === "TR" ? "Üretim Aşaması / Durumu" : "Production Stage"}</label>
                <select
                  value={editStage}
                  onChange={(e) => setEditStage(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                >
                  <option value="Kalıp & Pastal">{language === "TR" ? "Kalıp & Pastal" : "Pattern & Marker"}</option>
                  <option value="Kesimde">{language === "TR" ? "Kesimde" : "In Cutting"}</option>
                  <option value="Tasnifte">{language === "TR" ? "Tasnifte" : "In Sorting"}</option>
                  <option value="Dikimde">{language === "TR" ? "Dikimde" : "In Sewing"}</option>
                  <option value="Yıkamada">{language === "TR" ? "Yıkamada" : "In Washing"}</option>
                  <option value="Ütü - Paket">{language === "TR" ? "Ütü - Paket" : "Iron & Pack"}</option>
                  <option value="Sevkiyatta">{language === "TR" ? "Sevkiyatta" : "In Transit"}</option>
                  <option value="Tamamlandı">{language === "TR" ? "Tamamlandı" : "Completed"}</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleSaveInfo}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-xl transition-all cursor-pointer"
              >
                {language === "TR" ? "Model Bilgilerini Güncelle" : "Update Model Info"}
              </button>
            </div>
          )}

        </div>

        {/* SECTION 2: SIZE & QUANTITY PLANNING */}
            {/* PRODUCTION QUANTITIES CARD */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-3">
              {!isEditingQuantities ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      {language === "TR" ? "Üretim Adet Takibi" : language === "AR" ? "متابعة كميات الإنتاج" : "Production Quantity Tracking"}
                    </span>
                    {userRole !== "client" && onUpdateModel && (
                      <button
                        id="edit-quantities-mode-btn"
                        onClick={startEditingQuantities}
                        className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <Settings className="h-3 w-3" />
                        <span>{language === "TR" ? "Adetleri Düzenle" : "Edit Quantities"}</span>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-indigo-50/30 p-2.5 rounded-2xl border border-indigo-100/40 text-center">
                      <span className="text-[9px] text-slate-400 block font-medium uppercase">
                        {language === "TR" ? "İstenen" : language === "AR" ? "المطلب" : "Requested"}
                      </span>
                      <span className="text-sm font-black text-slate-800">{model.requested_qty || 0}</span>
                    </div>
                    <div className="bg-indigo-50/30 p-2.5 rounded-2xl border border-indigo-100/40 text-center">
                      <span className="text-[9px] text-slate-400 block font-medium uppercase">
                        {language === "TR" ? "Kesilen" : language === "AR" ? "المقصوص" : "Cut"}
                      </span>
                      <span className="text-sm font-black text-slate-800">{model.cut_qty || 0}</span>
                    </div>
                    <div className="bg-indigo-50/30 p-2.5 rounded-2xl border border-indigo-100/40 text-center">
                      <span className="text-[9px] text-slate-400 block font-medium uppercase">
                        {language === "TR" ? "Müşteriye Giden" : language === "AR" ? "المرسل للعميل" : "Sent"}
                      </span>
                      <span className="text-sm font-black text-indigo-600">{model.sent_qty || 0}</span>
                    </div>
                  </div>

                  {/* Size-specific production quantities table */}
                  {model.sizes_qty && model.sizes_qty.length > 0 && (
                    <div className="border border-slate-100 rounded-2xl overflow-hidden mt-3 bg-slate-50/30">
                      <table className="w-full text-left border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold">
                            <th className="p-2">{language === "TR" ? "Beden" : "Size"}</th>
                            <th className="p-2">{language === "TR" ? "Renk" : "Color"}</th>
                            <th className="p-2 text-right">{language === "TR" ? "İstenen" : "Requested"}</th>
                            <th className="p-2 text-right">{language === "TR" ? "Kesilen" : "Cut"}</th>
                            <th className="p-2 text-right">{language === "TR" ? "Giden" : "Sent"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {model.sizes_qty.map((item, idx) => (
                            <tr key={`${item.size}-${item.color || ""}-${idx}`} className="text-slate-700 hover:bg-slate-100/40 bg-white/20">
                              <td className="p-2 font-black text-indigo-600">{item.size}</td>
                              <td className="p-2 text-slate-500 font-bold">{item.color || "-"}</td>
                              <td className="p-2 text-right font-mono font-bold">{item.requested_qty}</td>
                              <td className="p-2 text-right font-mono font-bold">{item.cut_qty}</td>
                              <td className="p-2 text-right font-mono font-bold text-emerald-600">{item.sent_qty}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600">
                      {language === "TR" ? "Üretim Adetlerini Düzenle" : "Edit Production Quantities"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setIsEditingQuantities(false)}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-slate-100 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                      >
                        {language === "TR" ? "İptal" : "Cancel"}
                      </button>
                      <button
                        onClick={handleSaveQuantities}
                        className="text-[10px] font-black text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer"
                      >
                        {language === "TR" ? "Kaydet" : "Save"}
                      </button>
                    </div>
                  </div>

                  {/* Quick Calculator Panel */}
                  <div className="bg-emerald-50/50 p-2.5 rounded-2xl border border-emerald-100/60 mt-3 space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                        {language === "TR" ? "Hızlı Üretim Adedi Hesaplayıcı" : "Quick Quantity Calculator"}
                      </span>
                    </div>
                    <div className="flex items-end gap-1.5">
                      <div className="space-y-1 flex-1">
                        <label className="text-[8px] font-bold text-slate-500 uppercase px-1 truncate">{language === "TR" ? "Renk Sayısı" : "Colors"}</label>
                        <input
                          type="number"
                          min="1"
                          value={calcColors}
                          onChange={(e) => setCalcColors(e.target.value)}
                          className="w-full bg-white border border-emerald-200/60 rounded-xl px-1.5 py-1.5 text-xs font-bold text-center text-slate-700 focus:outline-emerald-500"
                        />
                      </div>
                      <div className="pb-2 text-slate-300 font-black text-xs">x</div>
                      <div className="space-y-1 flex-1">
                        <label className="text-[8px] font-bold text-slate-500 uppercase px-1 truncate">{language === "TR" ? "Seri / Renk" : "Series/Col"}</label>
                        <input
                          type="number"
                          min="1"
                          value={calcSeries}
                          onChange={(e) => setCalcSeries(e.target.value)}
                          className="w-full bg-white border border-emerald-200/60 rounded-xl px-1.5 py-1.5 text-xs font-bold text-center text-slate-700 focus:outline-emerald-500"
                        />
                      </div>
                      <div className="pb-2 text-slate-300 font-black text-xs">x</div>
                      <div className="space-y-1 flex-1">
                        <label className="text-[8px] font-bold text-slate-500 uppercase px-1 truncate">{language === "TR" ? "Adet / Seri" : "Qty/Series"}</label>
                        <input
                          type="number"
                          min="1"
                          value={calcSizes}
                          onChange={(e) => setCalcSizes(e.target.value)}
                          className="w-full bg-white border border-emerald-200/60 rounded-xl px-1.5 py-1.5 text-xs font-bold text-center text-slate-700 focus:outline-emerald-500"
                        />
                      </div>
                      <div className="pb-2 text-slate-300 font-black text-xs">=</div>
                      <div className="space-y-1 flex-[1.2]">
                        <label className="text-[8px] font-bold text-slate-500 uppercase px-1 text-center block">{language === "TR" ? "Toplam" : "Result"}</label>
                        <div className="w-full bg-emerald-100/50 border border-emerald-200 rounded-xl px-1.5 py-1.5 text-xs font-black text-center text-emerald-700 font-mono">
                          {(parseInt(calcColors) || 0) * (parseInt(calcSeries) || 0) * (parseInt(calcSizes) || 0)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const total = (parseInt(calcColors) || 0) * (parseInt(calcSeries) || 0) * (parseInt(calcSizes) || 0);
                          setEditRequestedQty(total.toString());
                          triggerToast(language === "TR" ? `Toplam İstenen adet ${total} olarak ayarlandı.` : `Total Requested set to ${total}.`, "success");
                        }}
                        className="flex-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold py-1.5 rounded-xl transition-colors cursor-pointer"
                      >
                        {language === "TR" ? "İstenen'e Uygula" : "Apply to Req"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const total = (parseInt(calcColors) || 0) * (parseInt(calcSeries) || 0) * (parseInt(calcSizes) || 0);
                          setEditCutQty(total.toString());
                          triggerToast(language === "TR" ? `Toplam Kesilen adet ${total} olarak ayarlandı.` : `Total Cut set to ${total}.`, "success");
                        }}
                        className="flex-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold py-1.5 rounded-xl transition-colors cursor-pointer"
                      >
                        {language === "TR" ? "Kesilen'e Uygula" : "Apply to Cut"}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 mt-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase block">{language === "TR" ? "İstenen Toplam" : "Total Req"}</label>
                        <input
                          type="number"
                          min="0"
                          value={editRequestedQty}
                          onChange={(e) => setEditRequestedQty(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold font-mono text-slate-800 focus:outline-indigo-600"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase block">{language === "TR" ? "Kesilen Toplam" : "Total Cut"}</label>
                        <input
                          type="number"
                          min="0"
                          value={editCutQty}
                          onChange={(e) => setEditCutQty(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold font-mono text-slate-800 focus:outline-indigo-600"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase block">{language === "TR" ? "Giden Toplam" : "Total Sent"}</label>
                        <input
                          type="number"
                          min="0"
                          value={editSentQty}
                          onChange={(e) => setEditSentQty(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold font-mono text-indigo-600 focus:outline-indigo-600"
                        />
                      </div>
                    </div>

                    {editSizesQty.length > 0 && (
                      <>
                        <div className="flex justify-between items-center px-1 mt-4">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                            {language === "TR" ? "Beden Listesi" : language === "AR" ? "قائمة المقاسات" : "Sizes List"} ({editSizesQty.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditSizesQty([]);
                              triggerToast(language === "TR" ? "Tüm bedenler listeden kaldırıldı." : "All sizes removed.", "info");
                            }}
                            className="text-[9px] font-extrabold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-200/60 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                            <span>{language === "TR" ? "Hepsini Kaldır" : language === "AR" ? "حذف الكل" : "Remove All"}</span>
                          </button>
                        </div>

                        <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/20 max-h-56 overflow-y-auto">
                          <table className="w-full text-left border-collapse text-[10px]">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold">

                              <th className="p-1.5">{language === "TR" ? "Beden" : "Size"}</th>
                              <th className="p-1.5">{language === "TR" ? "Renk" : "Color"}</th>
                              <th className="p-1.5 text-right w-16">{language === "TR" ? "İstenen" : "Req"}</th>
                              <th className="p-1.5 text-right w-16">{language === "TR" ? "Kesilen" : "Cut"}</th>
                              <th className="p-1.5 text-right w-16">{language === "TR" ? "Giden" : "Sent"}</th>
                              <th className="p-1.5 text-center w-8"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium bg-white">
                            {editSizesQty.map((item, idx) => (
                              <tr key={`${item.size}-${item.color || ""}-${idx}`} className="text-slate-700">
                                <td className="p-1.5 font-black text-indigo-600">{item.size}</td>
                                <td className="p-1.5 text-slate-600 font-bold">{item.color || "-"}</td>
                                <td className="p-1.5 text-right">
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.requested_qty}
                                    onChange={(e) => handleUpdateEditSizeItem(idx, "requested_qty", e.target.value)}
                                    className="w-14 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-right font-mono font-bold"
                                  />
                                </td>
                                <td className="p-1.5 text-right">
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.cut_qty}
                                    onChange={(e) => handleUpdateEditSizeItem(idx, "cut_qty", e.target.value)}
                                    className="w-14 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-right font-mono font-bold"
                                  />
                                </td>
                                <td className="p-1.5 text-right">
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.sent_qty}
                                    onChange={(e) => handleUpdateEditSizeItem(idx, "sent_qty", e.target.value)}
                                    className="w-14 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-right font-mono font-bold text-emerald-600"
                                  />
                                </td>
                                <td className="p-1.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveEditSizeRow(item.size, item.color)}
                                    className="text-rose-500 hover:text-rose-700 p-0.5 rounded transition-colors inline-flex cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      </>
                  )}
                  </div>

                  {/* Append Size Row module inside edit quantities pane */}
                  <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-200/80 space-y-2.5 mt-2">
                    <span className="text-[9px] font-black text-slate-500 uppercase block">
                      {language === "TR" ? "+ Yeni Beden & Renk Satırı" : "+ Add Size & Color Row"}
                    </span>
                    
                    <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                      <HandwritingSizeInput
                        id="edit-sheet-size-input"
                        value={newEditSize}
                        onChange={(val) => setNewEditSize(val)}
                        language={language}
                        triggerToast={triggerToast}
                        placeholder={language === "TR" ? "Beden (Örn: 6-9 Ay, 4 Yaş, 38, XL...)" : "Size (e.g. 6-9 Months, 4 Years...)"}
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 items-end">
                      <div className="space-y-0.5">
                        <label className="text-[8px] font-bold text-slate-400 uppercase block truncate">{language === "TR" ? "Renk" : "Color"}</label>
                        <input 
                          type="text"
                          placeholder={language === "TR" ? "Örn: Mavi" : "Blue"}
                          value={newEditColor}
                          onChange={(e) => setNewEditColor(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-[10px] font-bold"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[8px] font-bold text-slate-400 uppercase">{language === "TR" ? "İst" : "Req"}</label>
                        <input 
                          type="number"
                          value={newEditReq}
                          onChange={(e) => setNewEditReq(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-[10px] font-bold font-mono"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[8px] font-bold text-slate-400 uppercase">{language === "TR" ? "Kes" : "Cut"}</label>
                        <input 
                          type="number"
                          value={newEditCut}
                          onChange={(e) => setNewEditCut(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-[10px] font-bold font-mono"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[8px] font-bold text-slate-400 uppercase">{language === "TR" ? "Gid" : "Sent"}</label>
                        <input 
                          type="number"
                          value={newEditSent}
                          onChange={(e) => setNewEditSent(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-[10px] font-bold font-mono"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddEditSizeRow}
                      className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[9px] py-1.5 rounded-lg border border-indigo-100 cursor-pointer flex items-center justify-center gap-1 transition-all"
                    >
                      <Plus className="h-3 w-3" />
                      <span>{language === "TR" ? "Yeni Beden/Renk Satırı Ekle" : "Add New Size/Color Row"}</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* SECTION 3: DESCRIPTION & NOTEPAD LEDGER */}
            <div className="space-y-4">
              {/* DESCRIPTION & NOTEPAD LEDGER */}
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Açıklama & Özel Not Defteri</h4>
                    <p className="text-[9px] text-slate-400">Model detayları, ek müşteri talepleri ve atölye notları</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    className="text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl cursor-pointer"
                  >
                    {language === "TR" ? "Notu Kaydet" : "Save Notes"}
                  </button>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={language === "TR" ? "Model hakkında ek açıklama veya üretim detaylarını buraya kaydedebilirsiniz..." : "Enter technical notes or special requests for production..."}
                  className="w-full h-24 bg-slate-50 border border-slate-150 rounded-2xl p-3 text-xs text-slate-700 placeholder-slate-400 focus:outline-indigo-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* CUSTOM OVERHEAD COST LINES SECTION */}
            {(userRole === "admin" || userRole === "master_admin") && (
              <div className="bg-white p-4 rounded-3xl border border-slate-150 shadow-xs space-y-3.5">
                <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800">Yerel Ekstra Maliyet Payları</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Birim maliyete eklenen nakliye, gümrük vb. ekler (TL ve USD ayrı)</p>
                  </div>
                  
                  <button
                    id="add-custom-cost-btn"
                    onClick={() => setShowCostModal(true)}
                    className="flex items-center gap-1.5 text-xs font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Maliyet Ekle</span>
                  </button>
                </div>

                {/* Overhead Lines List */}
                {modelOverheads.length === 0 ? (
                  <div className="text-center py-5 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400 font-medium">
                    Henüz tanımlanmış ekstra maliyet satırı bulunmuyor.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {modelOverheads.map((c) => {
                      const isTry = getItemCurrency(c.currency) === "TRY";
                      return (
                        <div key={c.id} className="bg-slate-50/80 border border-slate-200/70 p-3 rounded-2xl flex justify-between items-center">
                          <div className="flex items-center gap-3.5">
                            {c.photo_url && (
                              <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 shadow-2xs transition-transform hover:scale-[1.05]">
                                <img 
                                  src={c.photo_url} 
                                  alt={c.name} 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-sm text-slate-800">{c.name}</span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md font-mono ${isTry ? "bg-sky-100 text-sky-800 border border-sky-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"}`}>
                                  {isTry ? "₺ TL" : "$ USD"}
                                </span>
                                {(c.date || c.created_at) && (
                                  <span className="text-[9px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono flex items-center gap-1">
                                    📅 {c.date || (c.created_at ? c.created_at.split('T')[0] : '')}
                                  </span>
                                )}
                              </div>
                              {c.photo_url && (
                                <span className="text-[10px] text-slate-400 font-semibold">Görsel Yüklendi</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3.5">
                            <div className="text-right">
                              <span className={`font-black text-base font-mono block ${isTry ? "text-sky-700" : "text-emerald-700"}`}>
                                +{isTry ? `${c.cost.toFixed(2)} ₺` : `$${c.cost.toFixed(2)}`}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Ekstra Pay</span>
                            </div>
                            <button
                              onClick={() => onRemoveCustomCost(c.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Overhead subtotal summary cards in large format */}
                    <div className="pt-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Ekstra Maliyet Toplamı:
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-2.5 flex flex-col justify-between">
                          <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wide">Dolar Ekstra Toplam</span>
                          <span className="text-lg font-black text-emerald-700 font-mono mt-0.5">
                            +${overheadCostUsd.toFixed(2)} <span className="text-xs font-bold">USD</span>
                          </span>
                        </div>
                        <div className="bg-sky-50/80 border border-sky-200/80 rounded-2xl p-2.5 flex flex-col justify-between">
                          <span className="text-[10px] font-extrabold text-sky-800 uppercase tracking-wide">TL Ekstra Toplam</span>
                          <span className="text-lg font-black text-sky-700 font-mono mt-0.5">
                            +{overheadCostTry.toFixed(2)} <span className="text-xs font-bold">₺ TL</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

        {/* SECTION 5: REGISTERED INVENTORY VARIANTS */}
        <div className="space-y-4">
            {(userRole === "admin" || userRole === "master_admin") && (
              <form onSubmit={handleRegisterVariantLocal} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-800">Beden-Renk Giriş Paneli</h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400">Renk Adı</label>
                    <input 
                      type="text" 
                      placeholder="Örn: Siyah, Haki" 
                      value={variantColor}
                      onChange={(e) => setVariantColor(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400">Beden Seçimi</label>
                    <select 
                      value={variantSize}
                      onChange={(e) => setVariantSize(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2 py-2 text-xs font-bold"
                    >
                      {Array.from({ length: 17 }, (_, i) => `${i} Yaş`).map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400">Atanan Ambar / Depo</label>
                    <select 
                      value={variantWarehouse}
                      onChange={(e) => setVariantWarehouse(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2 py-2 text-xs"
                    >
                      <option value="01 - Merkez Depo">01 - Merkez Depo</option>
                      <option value="02 - Sevkiyat Deposu">02 - Sevkiyat Deposu</option>
                      <option value="03 - E-Ticaret Deposu">03 - E-Ticaret Deposu</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span>Kayıt Tarihi</span>
                    </label>
                    <input 
                      type="date"
                      value={variantDate}
                      onChange={(e) => setVariantDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-xs font-bold font-mono text-slate-700"
                    />
                  </div>
                </div>

                {/* Variant Color Photo Drag & Drop / URL */}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Renk Görseli / Fotoğrafı</label>
                  
                  <div
                    onDragEnter={handleVariantDrag}
                    onDragOver={handleVariantDrag}
                    onDragLeave={handleVariantDrag}
                    onDrop={handleVariantDrop}
                    className={`border-2 border-dashed rounded-2xl p-3 text-center cursor-pointer transition-all relative ${
                      variantDragActive 
                        ? "border-indigo-600 bg-indigo-50/50" 
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleVariantFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    {variantFilePreview ? (
                      <div className="flex flex-col items-center gap-1">
                        <img 
                          src={variantFilePreview} 
                          alt="Renk Görseli Önizleme" 
                          className="w-12 h-12 rounded-lg object-cover border border-slate-100 shadow-xs"
                        />
                        <span className="text-[8px] font-bold text-emerald-600">
                          Görsel Yüklendi!
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 py-1">
                        <Upload className="h-4 w-4 text-slate-400" />
                        <p className="text-[9px] font-bold text-slate-600">Sürükle bırak veya seç</p>
                      </div>
                    )}
                  </div>

                  <input 
                    type="url" 
                    placeholder="Veya URL girin..."
                    value={variantPhotoUrl}
                    onChange={(e) => {
                      setVariantPhotoUrl(e.target.value);
                      if (e.target.value.trim().startsWith("http")) {
                        setVariantFilePreview(e.target.value.trim());
                      } else {
                        setVariantFilePreview(null);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5 text-xs mt-1"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors mt-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Varyant Kaydet</span>
                </button>
              </form>
            )}

            {/* List of registered product variants */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-800">Kayıtlı Stok Dağılımı</h4>
              {modelInventory.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 font-medium">Model için henüz bir varyant stok kaydı bulunmamaktadır.</div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {modelInventory.map((item) => (
                    <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2.5">
                        {item.color_photo_url ? (
                          <img 
                            src={item.color_photo_url} 
                            alt={item.color} 
                            className="w-10 h-10 rounded-lg object-cover border border-slate-100 shadow-xs"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">
                            NO IMG
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[9px]">
                              {item.variant_smart_id}
                            </span>
                            <span className="font-semibold text-slate-700">{item.color} | {item.size}</span>
                            {(item.date || item.created_at) && (
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                                📅 {item.date || (item.created_at ? item.created_at.split('T')[0] : '')}
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-400 mt-0.5">{item.warehouse_name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="font-bold text-slate-800 block">{item.stock_count} Adet</span>
                          <span className="text-[9px] text-slate-400 font-medium">Mevcut Stok</span>
                        </div>
                        {(userRole === "admin" || userRole === "master_admin") && (
                          <button 
                            onClick={() => onRemoveVariant(item.id)}
                            className="text-slate-300 hover:text-rose-500 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        {/* SUB-TAB 3: BOM MANAGEMENT SLOTS */}
        <div className="space-y-4">
            {(userRole === "admin" || userRole === "master_admin") && (
              <div className="bg-white p-4 rounded-3xl border border-slate-150 shadow-xs space-y-3.5">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800">
                      {language === "TR" ? "Kumaş & Reçete (BOM) Yönetimi" : "Fabric & BOM Repertoire"}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {language === "TR" 
                        ? "Modele ait kumaş türleri, doku görselleri, birim metraj ve hammadde sarfiyatları" 
                        : "Fabric swatches, texture photos, unit meterage, and material consumption"}
                    </p>
                  </div>
                  <button
                    id="open-bom-form-btn"
                    onClick={() => setShowBomForm(!showBomForm)}
                    className="flex items-center gap-1.5 text-xs font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{showBomForm ? (language === "TR" ? "Vazgeç" : "Cancel") : (language === "TR" ? "Kumaş / Malzeme Ekle" : "Add Fabric / Material")}</span>
                  </button>
                </div>

                {showBomForm && (
                  <form onSubmit={handleAddBomItemLocal} className="space-y-3.5 mt-2 border-t border-slate-100 pt-3.5 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-wide">
                        {language === "TR" ? "Yeni Kumaş veya Malzeme Tanımla" : "Define New Fabric or Material"}
                      </span>
                      <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        {bomItemType === "Kumaş" ? (language === "TR" ? "Kumaş, Kalıp & Metraj Kaydı" : "Fabric, Pattern & Meterage") : (language === "TR" ? "Aksesuar Kaydı" : "Trim/Accessory")}
                      </span>
                    </div>

                    {/* Material Type Selector */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-400">Malzeme Tipi</label>
                        <select 
                          value={bomItemType}
                          onChange={(e) => {
                            const val = e.target.value as "Kumaş" | "Aksesuar";
                            setBomItemType(val);
                            setBomItemUnit(val === "Kumaş" ? "Mt" : "Adet");
                            if (val === "Kumaş" && !bomItemSmartId.startsWith("KMS")) {
                              setBomItemSmartId(`KMS-${Math.floor(100 + Math.random() * 900)}`);
                            } else if (val === "Aksesuar" && !bomItemSmartId.startsWith("AKS")) {
                              setBomItemSmartId(`AKS-${Math.floor(100 + Math.random() * 900)}`);
                            }
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold"
                        >
                          <option value="Kumaş">🧵 Kumaş (Fabric / Raw Meterage)</option>
                          <option value="Aksesuar">🔘 Aksesuar (Accessory / Trim)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-400">Malzeme Kodu (Smart ID) *</label>
                        <input 
                          type="text" 
                          placeholder={bomItemType === "Kumaş" ? "Örn: KMS-101" : "Örn: AKS-202"}
                          value={bomItemSmartId}
                          onChange={(e) => setBomItemSmartId(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold uppercase"
                          required
                        />
                      </div>
                    </div>

                    {/* Row: Fabric Pattern (Kalıp) - MANDATORY / CORE REQUIREMENT */}
                    {bomItemType === "Kumaş" && (
                      <div className="space-y-1.5 bg-white p-2.5 rounded-xl border border-slate-200/80">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase font-black text-slate-700 flex items-center gap-1">
                            <span>📐 Kumaş Kalıbı / Kesim Kalıbı</span>
                          </label>
                          <span className="text-[9px] font-bold text-slate-400">
                            {bomItemPatternName ? `Seçili: ${bomItemPatternName}` : "(İsteğe bağlı)"}
                          </span>
                        </div>
                        <input 
                          type="text" 
                          placeholder="Örn: Oversize Kalıp, Slim Fit, Standart Fit, A-Kesim, Pastal Kalıbı 1..."
                          value={bomItemPatternName}
                          onChange={(e) => setBomItemPatternName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800"
                        />
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {["Oversize Kalıp", "Slim Fit", "Standart Fit", "A-Kesim", "Dökümlü Kalıp", "Pastal Kalıbı 1"].map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setBomItemPatternName(p)}
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                bomItemPatternName === p 
                                  ? "bg-indigo-600 text-white border-indigo-600" 
                                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Row: Fabric Color & Color Name - CORE REQUIREMENT */}
                    {bomItemType === "Kumaş" && (
                      <div className="space-y-1.5 bg-white p-2.5 rounded-xl border border-slate-200/80">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase font-black text-slate-700 flex items-center gap-1">
                            <span>🎨 Kumaş Rengi & Renk İsmi</span>
                          </label>
                          <span className="text-[9px] font-bold text-slate-400">
                            {bomItemColorName ? `Seçili: ${bomItemColorName}` : "(İsteğe bağlı)"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="text" 
                            placeholder="Renk İsmi (Örn: Ekru, Haki Yeşili, Siyah...)"
                            value={bomItemColorName}
                            onChange={(e) => setBomItemColorName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800"
                          />
                          <input 
                            type="text" 
                            placeholder="Renk Kodu / Lot (Örn: #F5F5DC, RNK-04)"
                            value={bomItemColorCode}
                            onChange={(e) => setBomItemColorCode(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800"
                          />
                        </div>
                        {/* Color presets */}
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {[
                            { name: "Ekru", hex: "#FDFBF7", border: true },
                            { name: "Siyah", hex: "#0F172A" },
                            { name: "Haki Yeşili", hex: "#4D5D43" },
                            { name: "Lacivert", hex: "#1E293B" },
                            { name: "Antrasit", hex: "#334155" },
                            { name: "Bordo", hex: "#881337" },
                            { name: "Bej", hex: "#E2D9CC" },
                            { name: "Beyaz", hex: "#FFFFFF", border: true }
                          ].map((c) => (
                            <button
                              key={c.name}
                              type="button"
                              onClick={() => {
                                setBomItemColorName(c.name);
                                setBomItemColorCode(c.hex);
                              }}
                              className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                bomItemColorName === c.name 
                                  ? "ring-2 ring-indigo-600 border-indigo-600 bg-white font-extrabold" 
                                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full inline-block ${c.border ? "border border-slate-300" : ""}`} style={{ backgroundColor: c.hex }} />
                              <span>{c.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Fabric Presets */}
                    {bomItemType === "Kumaş" && (
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase font-bold text-slate-400 block">Hızlı Kumaş Türü Seçin:</label>
                        <div className="flex flex-wrap gap-1">
                          {["%100 Pamuk Süprem", "2 İplik Şardonlu", "3 İplik Diyagonal", "Viskon Dokuma", "Poplin Kumaş", "Likralı İnterlok", "Denim Kot", "Şifon İpek", "Kaşkorse Fitilli"].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                setBomItemName(preset);
                                if (!bomItemSmartId) {
                                  setBomItemSmartId(`KMS-${preset.slice(0, 3).toUpperCase()}`);
                                }
                              }}
                              className="text-[9px] font-bold bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 px-2 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer"
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400">
                        {bomItemType === "Kumaş" ? "Kumaş Adı / Kalitesi / İçeriği *" : "Aksesuar Açıklaması / Adı *"}
                      </label>
                      <input 
                        type="text" 
                        placeholder={bomItemType === "Kumaş" ? "Örn: 30/1 Penye Süprem %100 Pamuk" : "Örn: Kemik Düğme 14mm Mat Siyah"}
                        value={bomItemName}
                        onChange={(e) => setBomItemName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold"
                        required
                      />
                    </div>

                    {/* Incoming Meters & Color Incoming Meters - CORE REQUIREMENT */}
                    {bomItemType === "Kumaş" && (
                      <div className="grid grid-cols-2 gap-2 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-indigo-900 block">
                            Toplam Gelen Kumaş Metrajı
                          </label>
                          <div className="relative">
                            <input 
                              type="number" 
                              step="0.1" 
                              min="0"
                              placeholder="Örn: 500"
                              value={bomItemIncomingMeters}
                              onChange={(e) => setBomItemIncomingMeters(e.target.value)}
                              className="w-full bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-indigo-900"
                            />
                            <span className="absolute right-2.5 top-1.5 text-[9px] font-bold text-indigo-400">Mt</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-indigo-900 block">
                            Bu Rengin Gelen Metrajı
                          </label>
                          <div className="relative">
                            <input 
                              type="number" 
                              step="0.1" 
                              min="0"
                              placeholder="Örn: 200"
                              value={bomItemColorIncomingMeters}
                              onChange={(e) => setBomItemColorIncomingMeters(e.target.value)}
                              className="w-full bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-indigo-900"
                            />
                            <span className="absolute right-2.5 top-1.5 text-[9px] font-bold text-indigo-400">Mt</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Meterage Consumption & Unit Details */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-500">
                          {bomItemType === "Kumaş" ? "Birim Sarfiyat (Model Başına) *" : "Birim Sarfiyat *"}
                        </label>
                        <div className="relative">
                          <input 
                            type="number" 
                            step="0.01" 
                            min="0.01"
                            value={bomItemConsumption}
                            onChange={(e) => setBomItemConsumption(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold"
                            required
                          />
                          <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">
                            {bomItemUnit} / Adet
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-400">Birim Ölçü</label>
                        <select 
                          value={bomItemUnit}
                          onChange={(e) => setBomItemUnit(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold"
                        >
                          {bomItemType === "Kumaş" ? (
                            <>
                              <option value="Mt">Mt (Metre)</option>
                              <option value="Kg">Kg (Kilogram)</option>
                              <option value="Yds">Yds (Yarda)</option>
                            </>
                          ) : (
                            <>
                              <option value="Adet">Adet</option>
                              <option value="Takım">Takım</option>
                              <option value="Mt">Mt</option>
                              <option value="Gr">Gr</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Kumaş Giriş & Stok Metraj Özeti */}
                    {bomItemType === "Kumaş" && (bomItemIncomingMeters || bomItemColorIncomingMeters) && (
                      <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[9px] font-black uppercase text-indigo-900 block">Kumaş Giriş & Stok Özeti:</span>
                          <span className="text-[10px] text-slate-600 font-medium">
                            Gelen Metraj: <strong className="text-indigo-900 font-mono">{bomItemIncomingMeters || bomItemColorIncomingMeters || "0"} {bomItemUnit}</strong>
                            {bomItemColorIncomingMeters && bomItemIncomingMeters && (
                              <span> (Bu Renk: {bomItemColorIncomingMeters} {bomItemUnit})</span>
                            )}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black font-mono text-indigo-700">
                            {bomItemIncomingMeters || bomItemColorIncomingMeters || "0"} {bomItemUnit}
                          </span>
                          <span className="text-[8px] font-bold text-slate-400 block">Kalan / Mevcut Stok</span>
                        </div>
                      </div>
                    )}

                    {/* Price, Currency, Lot No & Date */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-400">Para Birimi</label>
                        <div className="flex bg-slate-200/70 p-0.5 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setBomItemCurrency("USD")}
                            className={`flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                              bomItemCurrency === "USD" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            $ USD
                          </button>
                          <button
                            type="button"
                            onClick={() => setBomItemCurrency("TRY")}
                            className={`flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                              bomItemCurrency === "TRY" ? "bg-sky-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            ₺ TL
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-400">
                          Birim Fiyat ({bomItemCurrency === "TRY" ? "₺" : "$"})
                        </label>
                        <input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00"
                          value={bomItemUnitCost}
                          onChange={(e) => setBomItemUnitCost(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-400">Parti / Lot No</label>
                        <input 
                          type="text" 
                          placeholder="Örn: Lot: L-5021" 
                          value={bomItemLotNo}
                          onChange={(e) => setBomItemLotNo(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>Eklenme Tarihi</span>
                        </label>
                        <input 
                          type="date"
                          value={bomItemDate}
                          onChange={(e) => setBomItemDate(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold font-mono text-slate-700"
                        />
                      </div>
                    </div>

                    {/* DRAG AND DROP & FILE PICKER FOR FABRIC TEXTURE / PHOTO */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500 flex items-center justify-between">
                        <span>{bomItemType === "Kumaş" ? "Kumaş Doku / Kartela / Numune Görseli" : "Aksesuar Görseli"}</span>
                        <span className="text-[8px] text-slate-400 font-normal">Sürükle-bırak veya dosya seç</span>
                      </label>

                      <div
                        onDragEnter={handleBomDrag}
                        onDragOver={handleBomDrag}
                        onDragLeave={handleBomDrag}
                        onDrop={handleBomDrop}
                        className={`border-2 border-dashed rounded-2xl p-3 text-center cursor-pointer transition-all relative ${
                          bomDragActive 
                            ? "border-indigo-600 bg-indigo-50/60" 
                            : "border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400"
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBomFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />

                        {bomFilePreview ? (
                          <div className="flex items-center justify-center gap-3">
                            <img 
                              src={bomFilePreview} 
                              alt="Kumaş Numune Görseli" 
                              className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-2xs"
                            />
                            <div className="text-left">
                              <span className="text-xs font-bold text-emerald-700 block">Kumaş Görseli Eklendi ✓</span>
                              <span className="text-[9px] text-slate-400">Değiştirmek için üzerine tıklayın veya yeni dosya sürükleyin</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1 py-1.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-700">Kumaş görselini buraya sürükleyin veya tıklayıp seçin</p>
                            <p className="text-[8px] text-slate-400">PNG, JPG, WEBP fotoğrafları desteklenir</p>
                          </div>
                        )}
                      </div>

                      {/* Optional URL input fallback */}
                      <input 
                        type="url" 
                        placeholder="Veya web görsel linki (URL) yapıştırın..." 
                        value={bomItemPhotoUrl}
                        onChange={(e) => {
                          setBomItemPhotoUrl(e.target.value);
                          if (e.target.value.trim().startsWith("http")) {
                            setBomFilePreview(e.target.value.trim());
                          } else if (!e.target.value.trim()) {
                            setBomFilePreview(null);
                          }
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl transition-colors mt-2 cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{bomItemType === "Kumaş" ? "Kumaşı & Metrajı Modele Ekle" : "Aksesuarı Reçeteye Ekle"}</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* SEPARATE FABRIC & ACCESSORY (BOM) BREAKDOWN */}
            <div className="bg-white p-4 rounded-3xl border border-slate-150 shadow-xs space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h4 className="text-sm font-extrabold text-slate-800">
                  {language === "TR" ? "Modele Eklenen Kumaşlar & Metraj Dökümü" : "Assigned Fabrics & Meterage"}
                </h4>
              </div>

              {/* Kumaşlar Listesi (Fabrics Group) */}
              {(() => {
                const fabricList = modelBoms.filter(b => b.item_type === "Kumaş");
                const accessoryList = modelBoms.filter(b => b.item_type !== "Kumaş");
                const totalModelOrderQty = model.requested_qty || model.cut_qty || 0;

                return (
                  <div className="space-y-4">
                    {/* SECTION: KUMAŞLAR */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[11px] font-black uppercase text-indigo-900 tracking-wide flex items-center gap-1.5">
                          <span>🧵 Kumaş Kalemleri</span>
                          <span className="bg-indigo-100 text-indigo-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded-md font-mono">
                            {fabricList.length} Çeşit
                          </span>
                        </span>
                        {fabricList.length > 0 && (
                          <span className="text-[10px] text-slate-500 font-bold">
                            Toplam Sarfiyat: <strong className="font-mono text-indigo-700">{fabricList.reduce((acc, f) => acc + f.consumption, 0).toFixed(2)} Mt / Adet</strong>
                          </span>
                        )}
                      </div>

                      {fabricList.length === 0 ? (
                        <div className="text-center py-5 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400 font-medium">
                          Modele henüz kumaş ve metraj tanımı eklenmedi. Yukarıdaki <strong>"Kumaş / Malzeme Ekle"</strong> butonundan görsel ve metraj ekleyebilirsiniz.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {fabricList.map((bom) => {
                            const isTry = getItemCurrency(bom.currency) === "TRY";
                            const effectiveMeters = bom.incoming_meters || bom.color_incoming_meters || (bom.warehouse_stock > 0 ? bom.warehouse_stock : 0);
                            const totalIncomingCost = effectiveMeters > 0 ? (effectiveMeters * bom.unit_cost) : (bom.consumption * bom.unit_cost);
                            const perPieceCost = bom.consumption * bom.unit_cost;

                            return (
                              <div key={bom.id} className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 transition-all hover:bg-slate-50">
                                {editingBomId === bom.id ? (
                                  <div className="w-full flex items-center gap-3">
                                    <div className="flex-1 space-y-1">
                                      <label className="text-[9px] font-bold text-slate-500 uppercase">{language === "TR" ? "Sarfiyat (" + bom.unit + ")" : "Consumption"}</label>
                                      <input 
                                        type="number" 
                                        step="0.01"
                                        value={editBomData.consumption}
                                        onChange={(e) => setEditBomData(prev => ({ ...prev, consumption: e.target.value }))}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold font-mono"
                                      />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                      <label className="text-[9px] font-bold text-slate-500 uppercase">{language === "TR" ? "Birim Fiyat (" + (isTry ? "₺" : "$") + ")" : "Unit Cost"}</label>
                                      <input 
                                        type="number" 
                                        step="0.01"
                                        value={editBomData.unit_cost}
                                        onChange={(e) => setEditBomData(prev => ({ ...prev, unit_cost: e.target.value }))}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold font-mono"
                                      />
                                    </div>
                                    <div className="flex items-end gap-1.5 shrink-0">
                                      <button onClick={() => setEditingBomId(null)} className="h-[34px] px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] rounded-lg">
                                        {language === "TR" ? "İptal" : "Cancel"}
                                      </button>
                                      <button onClick={handleSaveEditBom} className="h-[34px] px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg">
                                        {language === "TR" ? "Kaydet" : "Save"}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-3">
                                      {/* Fabric Swatch / Texture Thumbnail */}
                                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 border border-slate-200 shrink-0 shadow-2xs">
                                        {bom.item_photo_url ? (
                                          <img 
                                            src={bom.item_photo_url} 
                                            alt={bom.item_name} 
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-[10px] text-indigo-700 bg-indigo-50 font-black">
                                            KUMAŞ
                                          </div>
                                        )}
                                      </div>

                                      <div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-mono text-[9px] font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">
                                            {bom.item_smart_id}
                                          </span>
                                          {bom.pattern_name && (
                                            <span className="text-[9px] font-black text-indigo-900 bg-indigo-100/70 px-1.5 py-0.5 rounded-md border border-indigo-200">
                                              📐 {bom.pattern_name}
                                            </span>
                                          )}
                                          {bom.color_name && (
                                            <span className="text-[9px] font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                                              {bom.color_code && (
                                                <span 
                                                  className="w-2 h-2 rounded-full inline-block border border-slate-300"
                                                  style={{ backgroundColor: bom.color_code }}
                                                />
                                              )}
                                              <span>🎨 {bom.color_name}</span>
                                            </span>
                                          )}
                                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md font-mono ${isTry ? "bg-sky-100 text-sky-800 border border-sky-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"}`}>
                                            {isTry ? "₺ TL" : "$ USD"}
                                          </span>
                                          {bom.lot_no && (
                                            <span className="text-[9px] text-slate-500 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-100 font-bold">
                                              {bom.lot_no}
                                            </span>
                                          )}
                                          {(bom.date || bom.created_at) && (
                                            <span className="text-[9px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono flex items-center gap-1">
                                              📅 {bom.date || (bom.created_at ? bom.created_at.split('T')[0] : '')}
                                            </span>
                                          )}
                                        </div>
                                        <h5 className="text-xs font-black text-slate-800 mt-1 leading-tight">{bom.item_name}</h5>
                                          
                                        {/* Meterage & Quantities Details */}
                                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-600 flex-wrap">
                                          <span>
                                            Sarfiyat: <strong className="text-indigo-700 font-mono font-bold">{bom.consumption} {bom.unit}</strong>
                                          </span>
                                          {bom.incoming_meters !== undefined && bom.incoming_meters > 0 && (
                                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                              Gelen Toplam: <strong className="font-mono text-slate-900">{bom.incoming_meters} {bom.unit}</strong>
                                            </span>
                                          )}
                                          {bom.color_incoming_meters !== undefined && bom.color_incoming_meters > 0 && (
                                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                                              Bu Renk Gelen: <strong className="font-mono text-indigo-900">{bom.color_incoming_meters} {bom.unit}</strong>
                                            </span>
                                          )}
                                          {bom.warehouse_stock !== undefined && (
                                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                              Kalan Stok: <strong className="font-mono text-emerald-900">{bom.warehouse_stock} {bom.unit}</strong>
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <div className="text-right mr-2">
                                        <span className={`font-black text-sm font-mono block ${isTry ? "text-sky-700" : "text-emerald-700"}`}>
                                          {isTry ? `${totalIncomingCost.toFixed(2)} ₺` : `$${totalIncomingCost.toFixed(2)}`}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-500 uppercase block">
                                          {isTry ? `${bom.unit_cost.toFixed(2)} ₺ / ${bom.unit}` : `$${bom.unit_cost.toFixed(2)} / ${bom.unit}`}
                                        </span>
                                        {effectiveMeters > 0 && (
                                          <span className="text-[8px] font-medium text-slate-400 block font-mono">
                                            ({effectiveMeters} {bom.unit} × {bom.unit_cost.toFixed(2)})
                                          </span>
                                        )}
                                      </div>

                                      {(userRole === "admin" || userRole === "master_admin") && (
                                        <>
                                          <button
                                            onClick={() => handleStartEditBom(bom)}
                                            className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-xl transition-all cursor-pointer"
                                            title={language === "TR" ? "Düzenle" : "Edit"}
                                          >
                                            <Settings className="h-4 w-4" />
                                          </button>
                                          <button
                                            onClick={() => onRemoveBomItem(bom.id)}
                                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-xl transition-all cursor-pointer"
                                            title="Kumaşı Kaldır"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* SECTION: AKSESUARLAR & DİĞER BİLEŞENLER */}
                    {accessoryList.length > 0 && (
                      <div className="space-y-2.5 pt-3 border-t border-slate-100">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[11px] font-black uppercase text-slate-700 tracking-wide flex items-center gap-1.5">
                            <span>🔘 Aksesuarlar & Malzemeler</span>
                            <span className="bg-slate-100 text-slate-700 text-[9px] font-extrabold px-1.5 py-0.2 rounded-md font-mono">
                              {accessoryList.length} Kalem
                            </span>
                          </span>
                        </div>

                        <div className="space-y-2">
                          {accessoryList.map((bom) => {
                            const isTry = getItemCurrency(bom.currency) === "TRY";
                            const totalCostVal = bom.consumption * bom.unit_cost;

                            return (
                              <div key={bom.id} className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 transition-all hover:bg-slate-50">
                                {editingBomId === bom.id ? (
                                  <div className="w-full flex items-center gap-3">
                                    <div className="flex-1 space-y-1">
                                      <label className="text-[9px] font-bold text-slate-500 uppercase">{language === "TR" ? "Sarfiyat (" + bom.unit + ")" : "Consumption"}</label>
                                      <input 
                                        type="number" 
                                        step="0.01"
                                        value={editBomData.consumption}
                                        onChange={(e) => setEditBomData(prev => ({ ...prev, consumption: e.target.value }))}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold font-mono"
                                      />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                      <label className="text-[9px] font-bold text-slate-500 uppercase">{language === "TR" ? "Birim Fiyat (" + (isTry ? "₺" : "$") + ")" : "Unit Cost"}</label>
                                      <input 
                                        type="number" 
                                        step="0.01"
                                        value={editBomData.unit_cost}
                                        onChange={(e) => setEditBomData(prev => ({ ...prev, unit_cost: e.target.value }))}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold font-mono"
                                      />
                                    </div>
                                    <div className="flex items-end gap-1.5 shrink-0">
                                      <button onClick={() => setEditingBomId(null)} className="h-[34px] px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] rounded-lg">
                                        {language === "TR" ? "İptal" : "Cancel"}
                                      </button>
                                      <button onClick={handleSaveEditBom} className="h-[34px] px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg">
                                        {language === "TR" ? "Kaydet" : "Save"}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 border border-slate-200 shrink-0 shadow-2xs">
                                        {bom.item_photo_url ? (
                                          <img 
                                            src={bom.item_photo_url} 
                                            alt={bom.item_name} 
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 uppercase font-black bg-slate-100">
                                            AKS
                                          </div>
                                        )}
                                      </div>

                                      <div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-mono text-[9px] font-extrabold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                            {bom.item_smart_id}
                                          </span>
                                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md font-mono ${isTry ? "bg-sky-100 text-sky-800 border border-sky-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"}`}>
                                            {isTry ? "₺ TL" : "$ USD"}
                                          </span>
                                          {(bom.date || bom.created_at) && (
                                            <span className="text-[9px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono flex items-center gap-1">
                                              📅 {bom.date || (bom.created_at ? bom.created_at.split('T')[0] : '')}
                                            </span>
                                          )}
                                        </div>
                                        <h5 className="text-xs font-black text-slate-800 mt-1 leading-tight">{bom.item_name}</h5>
                                        <span className="text-[11px] text-slate-500 font-medium">
                                          Sarfiyat: <strong className="text-slate-700">{bom.consumption} {bom.unit}</strong>
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <div className="text-right mr-2">
                                        <span className={`font-black text-sm font-mono block ${isTry ? "text-sky-700" : "text-emerald-700"}`}>
                                          {isTry ? `${totalCostVal.toFixed(2)} ₺` : `$${totalCostVal.toFixed(2)}`}
                                        </span>
                                      </div>

                                      {(userRole === "admin" || userRole === "master_admin") && (
                                        <>
                                          <button
                                            onClick={() => handleStartEditBom(bom)}
                                            className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-xl transition-all cursor-pointer"
                                            title={language === "TR" ? "Düzenle" : "Edit"}
                                          >
                                            <Settings className="h-4 w-4" />
                                          </button>
                                          <button
                                            onClick={() => onRemoveBomItem(bom.id)}
                                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-xl transition-all cursor-pointer"
                                            title="Aksesuarı Kaldır"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>



      </div>

      {/* OVERHEAD CUSTOM COST INPUT MODAL */}
      <AnimatePresence>
        {showCostModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs z-30 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-5 shadow-xl w-full max-w-[360px] space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-slate-800">Özel Maliyet Satırı Ekle</h3>
                <button onClick={() => setShowCostModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAddCustomCostLocal} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-400 block">Maliyet Kalemi Adı</label>
                  <input 
                    type="text" 
                    placeholder="Örn: Ekstra Gümrük Primi, Ambalaj"
                    value={newCostName}
                    onChange={(e) => setNewCostName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-400 block">Para Birimi</label>
                  <div className="flex bg-slate-100 p-0.5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setNewCostCurrency("USD")}
                      className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                        newCostCurrency === "USD" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      $ USD
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCostCurrency("TRY")}
                      className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                        newCostCurrency === "TRY" ? "bg-sky-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      ₺ TL
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400 block">
                      Birim Tutarı ({newCostCurrency === "TRY" ? "₺ TL" : "$ USD"})
                    </label>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="1.00"
                      value={newCostValue}
                      onChange={(e) => setNewCostValue(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-xs font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400 block flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span>Kayıt / Eklenme Tarihi</span>
                    </label>
                    <input 
                      type="date"
                      value={newCostDate}
                      onChange={(e) => setNewCostDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase text-slate-400 block">Maliyet Görseli (Opsiyonel)</label>
                  <div 
                    onDragEnter={handleCostDrag}
                    onDragOver={handleCostDrag}
                    onDragLeave={handleCostDrag}
                    onDrop={handleCostDrop}
                    className={`border-2 border-dashed rounded-xl p-3 text-center transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[75px] ${
                      newCostDragActive 
                        ? "border-indigo-500 bg-indigo-50/20" 
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100/70"
                    }`}
                  >
                    <input 
                      type="file" 
                      id="cost-image-upload" 
                      accept="image/*"
                      onChange={handleCostFileChange}
                      className="hidden"
                    />
                    {newCostFilePreview ? (
                      <div className="relative w-full flex items-center justify-between bg-white p-1.5 rounded-lg border border-slate-100">
                        <img 
                          src={newCostFilePreview} 
                          alt="Önizleme" 
                          className="w-10 h-10 object-cover rounded-md"
                        />
                        <span className="text-[10px] text-emerald-600 font-bold">Yüklendi!</span>
                        <button 
                          type="button"
                          onClick={() => {
                            setNewCostPhotoUrl("");
                            setNewCostFilePreview(null);
                          }}
                          className="text-[9px] text-rose-500 hover:underline px-1.5 py-0.5 rounded"
                        >
                          Kaldır
                        </button>
                      </div>
                    ) : (
                      <label htmlFor="cost-image-upload" className="cursor-pointer w-full h-full block">
                        <Upload className="h-4 w-4 mx-auto text-slate-400 mb-1" />
                        <span className="text-[10px] text-slate-500 font-medium block">Resim sürükleyin veya <strong className="text-indigo-600">seçin</strong></span>
                      </label>
                    )}
                  </div>
                  
                  {/* Or input direct URL */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[9px] text-slate-400">veya URL:</span>
                    <input 
                      type="url" 
                      placeholder="https://..." 
                      value={newCostPhotoUrl}
                      onChange={(e) => {
                        setNewCostPhotoUrl(e.target.value);
                        setNewCostFilePreview(e.target.value);
                      }}
                      className="flex-1 bg-slate-50 border border-slate-150 rounded-lg px-2 py-1 text-[10px]"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white font-bold text-xs py-2.5 rounded-xl mt-2 transition-colors"
                >
                  Ekstra Maliyet Kaydet
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF EXPORT CONFIGURATION MODAL */}
      <AnimatePresence>
        {showPdfModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs z-30 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-5 shadow-xl w-full max-w-[360px] space-y-4 text-slate-800"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Download className="h-4 w-4 text-indigo-600" />
                  <span>PDF Rapor Seçenekleri</span>
                </h3>
                <button onClick={() => setShowPdfModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Language Switcher Choices */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block">Rapor Dili / Language</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { code: "TR", label: "Türkçe (TR)" },
                      { code: "EN", label: "English (EN)" },
                      { code: "AR", label: "العربية (AR)" }
                    ] as const).map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setPdfLang(lang.code)}
                        className={`text-[11px] font-bold py-2 rounded-xl border transition-all cursor-pointer ${
                          pdfLang === lang.code
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photo toggle switch */}
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Görsel Modu</span>
                    <span className="text-[9px] text-slate-400 block">Birim ve model fotoğrafları eklensin</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWithPhotos(!withPhotos)}
                    className={`text-[10px] font-black px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      withPhotos
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {withPhotos ? "Aktif" : "Pasif"}
                  </button>
                </div>

                {/* Arabic Script Warning / Notice */}
                {pdfLang === "AR" && (
                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-2xl text-[9px] text-amber-800 leading-relaxed">
                    <strong>RTL Desteği Etkin:</strong> Arapça yazı tipi ve sağdan sola (RTL) hizalama sistemi jsPDF için Amiri font kütüphanesiyle optimize edilmiştir.
                  </div>
                )}

                {/* Download PDF Trigger */}
                <button
                  type="button"
                  disabled={isDownloadingFont}
                  onClick={handleGeneratePdf}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {isDownloadingFont ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-ping h-2 w-2 rounded-full bg-white"></span>
                      <span>Amiri Fontu Yükleniyor...</span>
                    </span>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>{pdfLang === "AR" ? "تصدير ملف PDF" : pdfLang === "TR" ? "PDF Raporu İndir" : "Download PDF Report"}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN ZOOMABLE IMAGE LIGHTBOX MODAL */}
      <AnimatePresence>
        {isLightboxOpen && currentDisplayedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex flex-col select-none"
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-white/10 text-white shrink-0 z-10">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-indigo-600 text-white px-2.5 py-1 rounded-xl font-black uppercase">
                  {model.smart_id}
                </span>
                <div>
                  <h4 className="text-sm font-black text-white leading-tight">{model.name}</h4>
                  <span className="text-[10px] text-slate-300 font-medium">
                    {currentDisplayedColorName}
                  </span>
                </div>
              </div>

              {/* Zoom & Action Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white/10 rounded-2xl p-1 border border-white/10">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={lightboxZoom <= 1}
                    className="p-1.5 hover:bg-white/20 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                    title="Küçült (-)"
                  >
                    <ZoomOut className="h-4 w-4 text-white" />
                  </button>
                  
                  <span className="text-xs font-mono font-black text-white px-2.5 min-w-[3.5rem] text-center">
                    {Math.round(lightboxZoom * 100)}%
                  </span>

                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={lightboxZoom >= 4}
                    className="p-1.5 hover:bg-white/20 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                    title="Büyüt (+)"
                  >
                    <ZoomIn className="h-4 w-4 text-white" />
                  </button>

                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="p-1.5 hover:bg-white/20 rounded-xl transition-all ml-1 text-slate-300 hover:text-white cursor-pointer"
                    title="Sıfırla (100%)"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  className="p-2 bg-white/10 hover:bg-rose-600/80 rounded-2xl transition-colors text-white cursor-pointer"
                  title="Kapat (Esc)"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Interactive Image Viewing Stage */}
            <div 
              className="flex-1 overflow-hidden relative flex items-center justify-center p-4 cursor-grab active:cursor-grabbing"
              onWheel={(e) => {
                if (e.deltaY < 0) {
                  setLightboxZoom(prev => Math.min(Number((prev + 0.25).toFixed(1)), 4));
                } else {
                  setLightboxZoom(prev => {
                    const next = Math.max(Number((prev - 0.25).toFixed(1)), 1);
                    if (next === 1) setLightboxPan({ x: 0, y: 0 });
                    return next;
                  });
                }
              }}
              onMouseDown={(e) => {
                if (lightboxZoom > 1) {
                  setIsDragging(true);
                  setDragStart({ x: e.clientX - lightboxPan.x, y: e.clientY - lightboxPan.y });
                }
              }}
              onMouseMove={(e) => {
                if (isDragging && lightboxZoom > 1) {
                  setLightboxPan({
                    x: e.clientX - dragStart.x,
                    y: e.clientY - dragStart.y
                  });
                }
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onDoubleClick={() => {
                if (lightboxZoom > 1) {
                  handleResetZoom();
                } else {
                  setLightboxZoom(2.5);
                }
              }}
            >
              <motion.img
                key={currentDisplayedPhoto}
                src={currentDisplayedPhoto}
                alt={model.name}
                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl transition-transform"
                style={{
                  transform: `translate(${lightboxPan.x}px, ${lightboxPan.y}px) scale(${lightboxZoom})`,
                  cursor: lightboxZoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
                }}
                referrerPolicy="no-referrer"
                draggable={false}
              />

              {lightboxZoom === 1 && (
                <div className="absolute bottom-20 bg-black/60 backdrop-blur-md text-slate-300 text-[11px] font-medium px-4 py-1.5 rounded-full border border-white/10 pointer-events-none animate-pulse">
                  {language === "TR" ? "Büyütmek için tıklayın veya tekerleği kaydırın • Çift tık: 2.5x" : "Scroll or click to zoom • Double click: 2.5x"}
                </div>
              )}
            </div>

            {/* Bottom Color Swatches Bar in Lightbox */}
            {allGalleryItems.length > 1 && (
              <div className="p-3 bg-slate-900/90 border-t border-white/10 flex items-center justify-center gap-2 overflow-x-auto shrink-0 z-10">
                {allGalleryItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveColorId(item.id);
                      handleResetZoom();
                    }}
                    className={`flex items-center gap-2 p-1.5 pr-3 rounded-xl border transition-all cursor-pointer ${
                      activeColorId === item.id
                        ? "bg-indigo-600 text-white border-indigo-400 shadow-lg scale-105"
                        : "bg-white/10 text-slate-300 border-white/10 hover:bg-white/20"
                    }`}
                  >
                    <div className="w-6 h-6 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                      <img src={item.photo_url} alt={item.color} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <span className="text-[10px] font-bold">{item.color}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD COLOR VARIANT & PHOTO MODAL */}
      <AnimatePresence>
        {showAddColorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-800">
                    {language === "TR" ? "Yeni Model Rengi & Fotoğrafı Ekle" : "Add Model Color Variant & Photo"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddColorModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAddColorPhoto} className="space-y-3.5">
                {/* Color Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">
                    {language === "TR" ? "Renk Adı" : "Color Name"} *
                  </label>
                  <input
                    type="text"
                    required
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    placeholder="Örn: Haki Yeşili, Antrasit, Bordo..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                {/* Quick Color Presets */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">
                    {language === "TR" ? "Hızlı Renk Seçimi (Mavi, Bej, Yeşil, Açık Yeşil...)" : "Quick Color Pick"}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COLORS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          setNewColorName(p.name);
                          setNewColorCode(p.code);
                        }}
                        className={`text-[9px] font-bold px-2 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                          newColorName === p.name
                            ? "bg-indigo-50 text-indigo-700 border-indigo-300 font-extrabold"
                            : "bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100"
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: p.code }} />
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Angle / Photo Tags */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">
                    {language === "TR" ? "Hızlı Açı / Görünüm Etiketi" : "Quick View Angle Tag"}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_PHOTO_TAGS.map((t) => (
                      <button
                        key={t.label}
                        type="button"
                        onClick={() => {
                          setNewColorName((prev) => prev ? `${prev} - ${t.label}` : t.label);
                        }}
                        className="text-[9px] font-bold px-2 py-1 rounded-lg border bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Code (Hex Swatch) */}
                <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <input
                    type="color"
                    value={newColorCode}
                    onChange={(e) => setNewColorCode(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-700 block">{language === "TR" ? "Renk Tonu / Kodu" : "Color Swatch Code"}</span>
                    <span className="font-mono text-slate-400 text-[10px]">{newColorCode}</span>
                  </div>
                </div>

                {/* Photo Upload & Preview */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 uppercase block">
                    {language === "TR" ? "Bu Renge Ait Model Fotoğrafı" : "Model Photo for this Color"} *
                  </label>
                  
                  {/* Image Preview Box */}
                  {(newColorPreview || newColorPhotoUrl) ? (
                    <div className="relative h-40 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 group">
                      <img 
                        src={newColorPreview || newColorPhotoUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setNewColorPreview(null);
                          setNewColorPhotoUrl("");
                        }}
                        className="absolute top-2 right-2 bg-black/70 hover:bg-rose-600 text-white p-1.5 rounded-xl transition-all cursor-pointer"
                        title="Fotoğrafı Değiştir"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-4 text-center transition-all bg-slate-50/50">
                      <input
                        type="file"
                        accept="image/*"
                        id="color-photo-file-input"
                        onChange={handleColorPhotoFileChange}
                        className="hidden"
                      />
                      <label 
                        htmlFor="color-photo-file-input" 
                        className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                      >
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                          <Upload className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-700">
                          {isUploadingColorPhoto ? "Yükleniyor..." : (language === "TR" ? "Cihazdan Fotoğraf Seç veya Sürükle" : "Select or Drop Photo")}
                        </span>
                        <span className="text-[9px] text-slate-400">JPG, PNG, WebP desteklenir</span>
                      </label>
                    </div>
                  )}

                  {/* Or enter Image URL */}
                  <div className="pt-1">
                    <input
                      type="url"
                      value={newColorPhotoUrl}
                      onChange={(e) => setNewColorPhotoUrl(e.target.value)}
                      placeholder={language === "TR" ? "veya Görsel Web Bağlantısı (URL)..." : "or Image URL..."}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700"
                    />
                  </div>
                </div>

                {/* Color Variant Added Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    <span>{language === "TR" ? "Renk Tanım / Eklenme Tarihi" : "Color Added Date"}</span>
                  </label>
                  <input
                    type="date"
                    value={newColorDate}
                    onChange={(e) => setNewColorDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{language === "TR" ? "Renk & Fotoğraf Varyantını Kaydet" : "Save Color & Photo Variant"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
        {/* Delete Model Confirmation Modal */}
        {showDeleteModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-inner">
                <Trash2 className="w-7 h-7 stroke-[2.2px]" />
              </div>

              {/* Info */}
              <div className="space-y-1.5 w-full">
                <h3 className="text-sm font-black text-slate-900">
                  {language === "TR" ? "Modeli Silmek İstediğinize Emin Misiniz?" : language === "AR" ? "هل أنت متأكد من حذف هذا الموديل؟" : "Are you sure you want to delete this model?"}
                </h3>
                <div className="flex items-center justify-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100 my-1">
                  <span className="font-mono font-black text-xs text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                    {model.smart_id}
                  </span>
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[180px]">
                    {model.name}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed px-1">
                  {language === "TR" 
                    ? "Bu model ve modele bağlı tüm reçete (BOM), fason giderler ve stok varyantları kalıcı olarak silinecektir." 
                    : language === "AR"
                    ? "سيتم حذف هذا الموديل وجميع جداول التكاليف والمستلزمات المرتبطة به بشكل دائم."
                    : "This model and all associated BOM components, custom overheads, and warehouse stock variants will be permanently deleted."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 w-full pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
                >
                  {language === "TR" ? "Vazgeç" : language === "AR" ? "إلغاء" : "Cancel"}
                </button>
                <button
                  id="confirm-sheet-delete-btn"
                  type="button"
                  onClick={() => {
                    if (onDeleteModel) {
                      const idToDelete = model.id;
                      const nameDeleted = model.name;
                      setShowDeleteModal(false);
                      onClose();
                      onDeleteModel(idToDelete);
                      triggerToast(
                        language === "TR" ? `"${nameDeleted}" modeli başarıyla silindi.` : `Model "${nameDeleted}" deleted.`,
                        "info"
                      );
                    }
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black text-xs transition-all shadow-md shadow-rose-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{language === "TR" ? "Evet, Sil" : language === "AR" ? "نعم، حذف" : "Yes, Delete"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
