import React, { useState } from "react";
import { 
  Boxes, 
  Plus, 
  Trash2, 
  ChevronRight, 
  AlertTriangle, 
  Upload, 
  Image as ImageIcon, 
  X, 
  Scissors, 
  Ruler, 
  DollarSign, 
  Percent, 
  Palette, 
  Sparkles,
  Check,
  Calendar,
  Download
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { LogisticsItem, FabricColorArchive, FashionModel, FinancialsItem } from "../types";
import { Language, TranslationDictionary } from "../translations";

interface LogisticsTabProps {
  logistics: LogisticsItem[];
  colorArchives: FabricColorArchive[];
  models?: FashionModel[];
  financials?: FinancialsItem[];
  userRole: string;
  onSelectFabric: (fabric: LogisticsItem) => void;
  onAddFabric: (
    name: string, 
    smartId: string, 
    unit: string,
    incomingMeters?: number,
    cutMeters?: number,
    imageUrl?: string,
    usedMeters?: number,
    color?: string,
    unitPrice?: number,
    currency?: 'USD' | 'TRY',
    marginPercent?: number,
    date?: string,
    brandOwner?: string
  ) => void;
  onDeleteFabric: (id: string) => void;
  triggerToast: (msg: string, type?: "success" | "error" | "info") => void;
  t: TranslationDictionary;
  language: Language;
}

// Popular fabric color presets for quick selection
const COLOR_PRESETS = [
  { name: "Siyah", hex: "#1e293b", text: "#ffffff" },
  { name: "Beyaz", hex: "#ffffff", text: "#1e293b", border: true },
  { name: "Ekru / Krem", hex: "#fef3c7", text: "#92400e" },
  { name: "Lacivert", hex: "#1e3a8a", text: "#ffffff" },
  { name: "Bej / Vizon", hex: "#e2d9cc", text: "#574d43" },
  { name: "Haki / Askeri", hex: "#3f4e3c", text: "#ffffff" },
  { name: "Füme / Gri", hex: "#64748b", text: "#ffffff" },
  { name: "Bordo", hex: "#831843", text: "#ffffff" },
  { name: "Zümrüt Yeşili", hex: "#065f46", text: "#ffffff" },
  { name: "Pudra", hex: "#fce7f3", text: "#9d174d" }
];

export default function LogisticsTab({
  logistics,
  colorArchives,
  models = [],
  financials = [],
  userRole,
  onSelectFabric,
  onAddFabric,
  onDeleteFabric,
  triggerToast,
  t,
  language
}: LogisticsTabProps) {

  const [showAddForm, setShowAddForm] = useState(false);
  
  // Model / Fabric code (optional)
  const [fabricSmartId, setFabricSmartId] = useState("");
  // Optional fabric name
  const [fabricName, setFabricName] = useState("");
  // Brand / Customer
  const [fabricBrand, setFabricBrand] = useState("");
  // Date added
  const [fabricDate, setFabricDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  // Color name
  const [fabricColor, setFabricColor] = useState("Siyah");
  // Unit
  const [fabricUnit, setFabricUnit] = useState("Mt");

  // Meter details requested by user:
  const [usedIncomingMeters, setUsedIncomingMeters] = useState("200");
  const [cutMeters, setCutMeters] = useState("0");

  // Price, Currency details:
  const [fabricCurrency, setFabricCurrency] = useState<'USD' | 'TRY'>('USD');
  const [unitPrice, setUnitPrice] = useState("");

  // Visual addition: Image upload / drag & drop / preview
  const [fabricImgUrl, setFabricImgUrl] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("Tümü");

  // Calculations
  const incNum = isNaN(parseFloat(usedIncomingMeters)) ? 0 : Math.max(0, parseFloat(usedIncomingMeters));
  const cutNum = isNaN(parseFloat(cutMeters)) ? 0 : Math.max(0, parseFloat(cutMeters));
  const remainingNum = Math.max(0, incNum - cutNum);

  const priceNum = isNaN(parseFloat(unitPrice)) ? 0 : Math.max(0, parseFloat(unitPrice));
  const totalBaseCost = incNum * priceNum;

  // Helper to categorize fabric names
  const getCategory = (itemName: string): string => {
    const name = itemName.toLowerCase();
    if (name.includes("astar")) return "Astar";
    if (name.includes("saten")) return "Saten";
    if (name.includes("şifon") || name.includes("chiffon")) return "Şifon";
    if (name.includes("tül")) return "Tül";
    if (name.includes("mikrofiber") || name.includes("teknik") || name.includes("tech")) return "Teknik";
    if (name.includes("krep")) return "Krep";
    if (name.includes("pamuk") || name.includes("koton") || name.includes("cotton")) return "Pamuk";
    if (name.includes("likra") || name.includes("lycra")) return "Likra";
    return "Diğer";
  };

  // Translate category titles
  const translateCategory = (cat: string) => {
    switch (cat) {
      case "Tümü": return t.categoryAll;
      case "Astar": return t.categoryAstar;
      case "Saten": return t.categorySaten;
      case "Şifon": return t.categorySifon;
      case "Tül": return t.categoryTul;
      case "Teknik": return t.categoryTeknik;
      case "Krep": return t.categoryKrep;
      case "Pamuk": return t.categoryPamuk;
      case "Likra": return t.categoryLikra;
      case "Diğer": return t.categoryDiger;
      default: return cat;
    }
  };

  // Image handling
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      triggerToast("Lütfen geçerli bir resim dosyası seçin.", "error");
      return;
    }

    try {
      const { compressImage } = await import('../imageUtils');
      const compressedBase64 = await compressImage(file);
      setFabricImgUrl(compressedBase64);
      setFilePreview(compressedBase64);
      triggerToast("Kumaş görseli başarıyla yüklendi!");
    } catch (err) {
      console.error(err);
      triggerToast("Görsel yüklenemedi.", "error");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  // Available categories in list
  const availableCategories = ["Tümü", ...Array.from(new Set(logistics.map(item => getCategory(item.item_name))))];

  // Filter logistics items based on selectedCategory
  const filteredLogistics = logistics.filter((item) => {
    if (selectedCategory === "Tümü") return true;
    return getCategory(item.item_name) === selectedCategory;
  });

  const handleAddFabricLocal = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-generate code if not entered so the system does not require mandatory entry
    const finalSmartId = fabricSmartId.trim() 
      ? fabricSmartId.trim().toUpperCase() 
      : (fabricName.trim() 
          ? `KMS-${fabricName.trim().substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`
          : `KMS-${Math.floor(1000 + Math.random() * 9000)}`);

    // Fabric name is optional (fallback if empty)
    const finalFabricName = fabricName.trim() || `${finalSmartId} Kumaşı`;
    const finalImage = fabricImgUrl.trim() || "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400";
    const finalColor = fabricColor.trim() || "Standart";
    const finalDate = fabricDate || new Date().toISOString().split("T")[0];

    if (!fabricBrand) {
      triggerToast(language === "TR" ? "Lütfen bir Marka / Müşteri seçiniz." : language === "AR" ? "يرجى اختيار ماركة / عميل." : "Please select a Brand / Customer.", "error");
      return;
    }

    onAddFabric(
      finalFabricName,
      finalSmartId,
      fabricUnit,
      incNum,
      cutNum,
      finalImage,
      incNum,
      finalColor,
      priceNum,
      fabricCurrency,
      0,
      finalDate,
      fabricBrand
    );

    // Reset Form
    setFabricSmartId("");
    setFabricName("");
    setFabricBrand("");
    setFabricColor("Siyah");
    setFabricUnit("Mt");
    setUsedIncomingMeters("200");
    setCutMeters("0");
    setUnitPrice("");
    setFabricImgUrl("");
    setFilePreview(null);
    setFabricDate(new Date().toISOString().split("T")[0]);
    setShowAddForm(false);
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportLogisticsPdf = async () => {
    setIsExporting(true);
    triggerToast(language === "TR" ? "Lojistik & Stok Raporu PDF hazırlanıyor..." : "Exporting Logistics & Stock Report PDF...", "info");

    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      
      let hasAmiri = false;
      try {
        const fontRes = await fetch("https://fonts.gstatic.com/ea/amiri/v2/Amiri-Regular.ttf");
        if (fontRes.ok) {
          const fontBlob = await fontRes.blob();
          const reader = new FileReader();
          const b64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => {
              const res = reader.result as string;
              resolve(res.split(",")[1]);
            };
            reader.readAsDataURL(fontBlob);
          });
          doc.addFileToVFS("Amiri-Regular.ttf", b64);
          doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
          doc.setFont("Amiri");
          hasAmiri = true;
        }
      } catch (e) {
        console.warn("Failed to load Arabic font", e);
      }
      
      const title = language === "TR" ? "TOPLU LOJISTIK & STOK RAPORU" : language === "AR" ? "تقرير اللوجستيات والمخزون المجمع" : "BULK LOGISTICS & STOCK REPORT";
      doc.setFontSize(16);
      if (hasAmiri && language === "AR") {
        doc.text(title, 280, 15, { align: "right" });
      } else {
        doc.text(title, 14, 15);
      }
      
      doc.setFontSize(9);
      const dateText = `${language === "TR" ? "Tarih:" : language === "AR" ? "التاريخ:" : "Date:"} ${new Date().toLocaleDateString()}`;
      if (hasAmiri && language === "AR") {
        doc.text(dateText, 280, 22, { align: "right" });
      } else {
        doc.text(dateText, 14, 22);
      }

      const fabricsByBrand: Record<string, LogisticsItem[]> = {};
      filteredLogistics.forEach(f => {
        const brand = f.customer_name || (language === "TR" ? "Markasız" : language === "AR" ? "بدون ماركة" : "Unbranded");
        if (!fabricsByBrand[brand]) fabricsByBrand[brand] = [];
        fabricsByBrand[brand].push(f);
      });

      let startY = 30;
      for (const brand of Object.keys(fabricsByBrand)) {
        if (startY > 180) {
          doc.addPage();
          startY = 20;
        }
        doc.setFontSize(11);
        const brandTitle = `${language === "TR" ? "Marka / Müşteri:" : language === "AR" ? "الماركة / العميل:" : "Brand / Customer:"} ${brand}`;
        if (hasAmiri && language === "AR") {
          doc.text(brandTitle, 280, startY, { align: "right" });
        } else {
          doc.text(brandTitle, 14, startY);
        }
        startY += 5;

        const tableData = fabricsByBrand[brand].map(f => [
          f.item_smart_id,
          f.item_name,
          f.color || "-",
          `${f.incoming} ${f.unit}`,
          `${f.cut} ${f.unit}`,
          `${f.remaining} ${f.unit}`,
          `${f.effective_price?.toFixed(2) || 0} ${f.currency || "USD"}`
        ]);

        autoTable(doc, {
          startY,
          head: [[
            language === "TR" ? "Kodu" : language === "AR" ? "الرمز" : "Code",
            language === "TR" ? "Kumaş Adı" : language === "AR" ? "اسم القماش" : "Fabric Name",
            language === "TR" ? "Renk" : language === "AR" ? "اللون" : "Color",
            language === "TR" ? "Giriş" : language === "AR" ? "المدخل" : "Incoming",
            language === "TR" ? "Kesilen" : language === "AR" ? "المقصوص" : "Cut",
            language === "TR" ? "Kalan" : language === "AR" ? "المتبقي" : "Remaining",
            language === "TR" ? "Birim Mlyt." : language === "AR" ? "تكلفة الوحدة" : "Unit Cost"
          ]],
          body: tableData,
          styles: { font: hasAmiri ? "Amiri" : "helvetica", fontSize: 8 },
          headStyles: { fillColor: [79, 70, 229] },
          margin: { top: 10, left: 14, right: 14 },
          theme: 'grid'
        });

        startY = (doc as any).lastAutoTable.finalY + 15;
      }

      doc.save(`Stok_Raporu_${new Date().toISOString().split("T")[0]}.pdf`);
      triggerToast(language === "TR" ? "Lojistik & Stok Raporu PDF başarıyla indirildi!" : "PDF Export Complete!", "success");
    } catch (e: any) {
      console.error("PDF generation failed:", e);
      triggerToast(language === "TR" ? "PDF oluşturulurken hata oluştu." : "Failed to generate PDF.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div id="logistics-tab" className="space-y-4">
      
      {/* Header Plate */}
      <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-xs shrink-0">
        <div>
          <h2 className="text-base font-black text-slate-800 leading-tight">{t.logisticTitle}</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">{t.logisticDesc}</p>
        </div>

        <div className="flex items-center gap-2">
          {userRole !== "client" && (
            <button
              onClick={handleExportLogisticsPdf}
              disabled={isExporting}
              className="flex items-center gap-1.5 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-black px-3.5 py-2 rounded-2xl shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isExporting 
                  ? (language === "TR" ? "Hazırlanıyor..." : language === "AR" ? "جاري التحضير..." : "Exporting...") 
                  : (language === "TR" ? "PDF İndir" : language === "AR" ? "تصدير PDF" : "Export PDF")}
              </span>
            </button>
          )}
          {(userRole === "admin" || userRole === "master_admin") && (
            <button
              id="open-fabric-form-btn"
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-3.5 py-2 rounded-2xl shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              <span>{showAddForm ? (language === "TR" ? "Kapat" : "Close") : (language === "TR" ? "Kumaş Ekle" : language === "AR" ? "إضافة قماش" : "Add Fabric")}</span>
            </button>
          )}
        </div>
      </div>

      {/* FORM: FULL FABRIC / RAW MATERIAL REGISTRATION */}
      {(userRole === "admin" || userRole === "master_admin") && showAddForm && (
        <form onSubmit={handleAddFabricLocal} className="bg-white p-5 rounded-3xl border-2 border-indigo-150 shadow-md space-y-4.5 animate-in fade-in slide-in-from-top-2 duration-180">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Boxes className="h-5 w-5 text-indigo-600" />
                <span>Kumaş & Hammadde Girişi</span>
              </h3>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                Kumaş adı, tarih, renk, metraj ve birim fiyat tanımlayabilirsiniz.
              </p>
            </div>
            <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
              Lojistik Stok
            </span>
          </div>
          
          {/* Row 1: Model/Fabric Code, Fabric Name & Entry Date */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-600 flex items-center justify-between">
                <span>Marka / Müşteri <span className="text-rose-500">*</span></span>
              </label>
              <div className="relative">
                <select
                  value={fabricBrand}
                  onChange={(e) => setFabricBrand(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-800 transition-colors cursor-pointer appearance-none"
                  required
                >
                  <option value="" disabled>{language === "TR" ? "Seçiniz..." : language === "AR" ? "اختر..." : "Select..."}</option>
                  {financials.map(f => (
                    <option key={f.id} value={f.customer_name}>{f.customer_name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-600 flex items-center justify-between">
                <span>Model / Kumaş Kodu</span>
                <span className="text-slate-400 font-normal text-[9px] lowercase">(isteğe bağlı)</span>
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  list="models-datalist"
                  placeholder="Örn: MDL-201 veya KMS-510"
                  value={fabricSmartId}
                  onChange={(e) => setFabricSmartId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-800 transition-colors uppercase"
                  autoFocus
                />
                <datalist id="models-datalist">
                  {models.map(m => (
                    <option key={m.id} value={m.smart_id}>{m.smart_id} - {m.name}</option>
                  ))}
                </datalist>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-600 flex items-center justify-between">
                <span>Kumaş Adı / Cinsi</span>
                <span className="text-slate-400 font-normal text-[9px] lowercase">(isteğe bağlı)</span>
              </label>
              <input 
                type="text" 
                placeholder="Örn: Viskon Krep, İpek Saten..."
                value={fabricName}
                onChange={(e) => setFabricName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 py-2 text-xs font-medium text-slate-800 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-600 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-indigo-600" />
                  <span>Kumaş Giriş Tarihi</span>
                </span>
                <span className="text-indigo-600 font-bold text-[9px]">Tarih</span>
              </label>
              <input 
                type="date" 
                value={fabricDate}
                onChange={(e) => setFabricDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-800 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Row 2: Fabric Color Selection with Quick Presets */}
          <div className="space-y-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-black text-slate-700 flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-indigo-600" />
                <span>Kumaş Rengi / Renk Adı</span>
              </label>
              <span className="text-[10px] font-bold text-slate-400">Seçili: <strong className="text-slate-700">{fabricColor || "Belirtilmedi"}</strong></span>
            </div>

            <input 
              type="text" 
              placeholder="Renk adı yazın (Örn: Zümrüt Yeşili, Siyah, Ekru...)"
              value={fabricColor}
              onChange={(e) => setFabricColor(e.target.value)}
              className="w-full bg-white border border-slate-250 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 transition-colors"
            />

            {/* Quick color preset chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {COLOR_PRESETS.map((p) => {
                const isSelected = fabricColor.toLowerCase() === p.name.toLowerCase();
                return (
                  <button
                    type="button"
                    key={p.name}
                    onClick={() => setFabricColor(p.name)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                      isSelected 
                        ? "ring-2 ring-indigo-600 ring-offset-1 border-indigo-600 bg-white shadow-2xs font-extrabold" 
                        : "bg-white/80 border-slate-200 hover:bg-white text-slate-600"
                    }`}
                  >
                    <span 
                      className={`w-2.5 h-2.5 rounded-full inline-block ${p.border ? "border border-slate-300" : ""}`} 
                      style={{ backgroundColor: p.hex }}
                    />
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Unit Selector */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 block">Ölçü Birimi</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Mt (Metre)", value: "Mt" },
                { label: "Adet", value: "Adet" },
                { label: "Kg (Kilogram)", value: "Kg" }
              ].map(u => (
                <button
                  type="button"
                  key={u.value}
                  onClick={() => setFabricUnit(u.value)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    fabricUnit === u.value 
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs" 
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION: PRICE PER METER & CURRENCY ($ USD / ₺ TL) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-150">
              <span className="text-[11px] font-black uppercase text-slate-800 flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <span>Metre Başı Alış Fiyatı & Para Birimi</span>
              </span>
              
              {/* Currency Toggle ($ USD vs ₺ TL) */}
              <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-250">
                <button
                  type="button"
                  onClick={() => setFabricCurrency("USD")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer font-mono ${
                    fabricCurrency === "USD" 
                      ? "bg-emerald-600 text-white shadow-2xs" 
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  $ USD
                </button>
                <button
                  type="button"
                  onClick={() => setFabricCurrency("TRY")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer font-mono ${
                    fabricCurrency === "TRY" 
                      ? "bg-sky-600 text-white shadow-2xs" 
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  ₺ TL
                </button>
              </div>
            </div>

            {/* Unit Base Price */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-600 block">
                Metre Başı Alış Fiyatı ({fabricCurrency === "USD" ? "$ USD" : "₺ TL"})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black font-mono text-slate-400">
                  {fabricCurrency === "USD" ? "$" : "₺"}
                </span>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  placeholder="0.00"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="w-full bg-white border border-slate-250 focus:border-indigo-500 rounded-xl pl-7 pr-3 py-2 text-xs font-black font-mono text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* SECTION: METERS / QUANTITY BREAKDOWN (Gelen/Kullanılan, Kesilen, Kalan) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-slate-800 flex items-center gap-1.5">
                <Ruler className="h-4 w-4 text-indigo-600" />
                <span>Kumaş Metraj / Sarfiyat Takibi</span>
              </span>
              <span className="text-[10px] font-bold text-slate-500 font-mono">Birim: {fabricUnit}</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-600 block">
                  Kullanılan / Gelen Metre
                </label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="0"
                  placeholder="0.0"
                  value={usedIncomingMeters}
                  onChange={(e) => setUsedIncomingMeters(e.target.value)}
                  className="w-full bg-white border border-slate-250 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-black font-mono text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-600 block flex items-center gap-1">
                  <Scissors className="h-3 w-3 text-rose-500" />
                  <span>Kesilen Metre</span>
                </label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="0"
                  placeholder="0.0"
                  value={cutMeters}
                  onChange={(e) => setCutMeters(e.target.value)}
                  className="w-full bg-white border border-slate-250 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-black font-mono text-slate-800"
                />
              </div>
            </div>

            {/* Live Remaining Meter Indicator Card */}
            <div className="bg-gradient-to-r from-indigo-50/90 to-sky-50/90 border border-indigo-150 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">
                  Hesaplanan Kalan Kumaş Metrajı:
                </span>
                <span className="text-xs text-slate-600 font-medium">
                  {incNum.toFixed(1)} {fabricUnit} - {cutNum.toFixed(1)} {fabricUnit} =
                </span>
              </div>
              <div className="text-right">
                <span className="text-base font-black font-mono text-indigo-700 block">
                  {remainingNum.toFixed(1)} <span className="text-xs font-bold">{fabricUnit}</span>
                </span>
                <span className="text-[8px] font-bold uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  {remainingNum > 0 ? "Kullanıma Hazır" : "Tükendi"}
                </span>
              </div>
            </div>
          </div>

          {/* VISUAL ADDITION: FABRIC PHOTO / IMAGE UPLOAD & PREVIEW */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-indigo-600" />
                <span>Kumaş Dokusu / Görseli Ekle</span>
              </span>
              <span className="text-slate-400 font-normal text-[9px] lowercase">(sürükle-bırak veya link)</span>
            </label>

            {/* Drag & drop box */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-3.5 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[90px] ${
                dragActive 
                  ? "border-indigo-600 bg-indigo-50/50" 
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100/70"
              }`}
            >
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="hidden" 
                id="fabric-modal-file-upload" 
              />
              
              {filePreview || fabricImgUrl ? (
                <div className="relative flex items-center gap-3 w-full">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 shadow-2xs">
                    <img 
                      src={filePreview || fabricImgUrl} 
                      alt="Kumaş Önizleme" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-xs font-bold text-slate-800 block">Kumaş Görseli Seçildi</span>
                    <span className="text-[9px] text-slate-400">Görseli değiştirmek için tıklayın veya yeni dosya sürükleyin.</span>
                  </div>
                  <label 
                    htmlFor="fabric-modal-file-upload"
                    className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg hover:bg-indigo-100 cursor-pointer"
                  >
                    Değiştir
                  </label>
                </div>
              ) : (
                <label htmlFor="fabric-modal-file-upload" className="cursor-pointer flex flex-col items-center gap-1.5 w-full">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Resim Dosyası Yükleyin</span>
                    <span className="text-[9px] text-slate-400 font-medium">PNG, JPG, WebP veya sürükleyip bırakın</span>
                  </div>
                </label>
              )}
            </div>

            {/* Quick URL Fallback Input */}
            <input 
              type="url" 
              placeholder="Veya web görsel linki yapıştırın (https://...)" 
              value={fabricImgUrl.startsWith("data:") ? "" : fabricImgUrl}
              onChange={(e) => {
                setFabricImgUrl(e.target.value);
                setFilePreview(e.target.value || null);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] text-slate-700 focus:bg-white"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-3.5 rounded-2xl shadow-sm transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Kumaşı Kaydet ve Lojistiğe Ekle</span>
          </button>
        </form>
      )}

      {/* FILTER CHIPS */}
      {logistics.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none shrink-0" id="category-filter-chips">
          {availableCategories.map((category) => {
            const isSelected = selectedCategory === category;
            const count = category === "Tümü" 
              ? logistics.length 
              : logistics.filter(item => getCategory(item.item_name) === category).length;

            return (
              <button
                key={category}
                id={`chip-${category.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border whitespace-nowrap transition-all active:scale-95 cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-xs shadow-indigo-100"
                    : "bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                <span>{translateCategory(category)}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                  isSelected ? "bg-indigo-700 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* HORIZONTAL MOBILE LIST ROWS */}
      <div className="space-y-2.5" id="logistics-list">
        {logistics.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-3xl text-xs text-slate-400 font-medium">
            {t.noFabrics}
          </div>
        ) : filteredLogistics.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-3xl text-xs text-slate-400 font-medium">
            {language === "TR" ? "Seçilen filtreyle eşleşen hammadde bulunamadı." : language === "AR" ? "لم يتم العثور على مواد خام تطابق الفلتر المحدد." : "No raw materials found matching the selected filter."}
          </div>
        ) : (
          filteredLogistics.map((item) => {
            // Aggregate from colorArchives if present
            const fabricArchives = colorArchives.filter(c => c.fabric_id === item.id);
            const sumIncoming = fabricArchives.length > 0 
              ? fabricArchives.reduce((sum, c) => sum + c.incoming, 0)
              : item.incoming;

            const sumCut = fabricArchives.length > 0
              ? fabricArchives.reduce((sum, c) => sum + c.cut, 0)
              : item.cut;

            const netRemaining = sumIncoming - sumCut;
            const isLowStock = netRemaining <= 5;

            const isTry = item.currency === "TRY" || item.currency === "TL";
            const effectiveP = item.effective_price || (item.unit_price ? item.unit_price * (1 + (item.margin_percent || 0) / 100) : 0);

            // Representative color avatar fallback
            const avatarImg = item.image_url || (fabricArchives.length > 0 
              ? fabricArchives[0].image_url 
              : "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=200");

            return (
              <div
                key={item.id}
                id={`fabric-row-${item.id}`}
                onClick={() => onSelectFabric(item)}
                className="bg-white p-3.5 rounded-3xl border border-slate-150 hover:border-indigo-200 shadow-xs hover:shadow-md transition-all active:scale-99 cursor-pointer flex items-center justify-between gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-155"
              >
                {/* Left block: Pattern Avatar + Code + Name + Color */}
                <div className="flex items-center gap-3">
                  <div className="w-13 h-13 rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-150 shrink-0 relative shadow-2xs">
                    <img 
                      src={avatarImg} 
                      alt={item.item_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md uppercase border border-indigo-100">
                        {item.item_smart_id}
                      </span>
                      {(item.date || item.created_at) && (
                        <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1 font-mono">
                          📅 {item.date || (item.created_at ? item.created_at.split('T')[0] : '')}
                        </span>
                      )}
                      {item.color && (
                        <span className="text-[9px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                          🎨 {item.color}
                        </span>
                      )}
                      {(item.unit_price || 0) > 0 && (
                        <span className={`text-[9px] font-black font-mono px-1.5 py-0.5 rounded ${isTry ? "bg-sky-50 text-sky-700 border border-sky-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                          {isTry ? `${item.unit_price?.toFixed(2)} ₺` : `$${item.unit_price?.toFixed(2)}`}
                        </span>
                      )}
                      {isLowStock && (
                        <span className="text-[8px] font-black bg-rose-50 text-rose-700 px-1.5 py-0.2 rounded animate-pulse flex items-center gap-0.5">
                          ⚠️ {language === "TR" ? "Düşük Stok" : language === "AR" ? "مخزون منخفض" : "Low Stock"}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-black text-slate-800 mt-1 group-hover:text-indigo-600 transition-colors">
                      {item.item_name}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      Kalan: <strong className="font-bold text-indigo-700 font-mono">{netRemaining.toFixed(1)} {item.unit}</strong>
                    </p>
                  </div>
                </div>

                {/* Right block: Meters distribution + Chevron */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[8px] text-slate-400 uppercase font-black block">Gelen / Kesilen</span>
                    <span className="text-xs font-black font-mono text-slate-700">
                      {sumIncoming.toFixed(0)} / {sumCut.toFixed(0)} <span className="text-[9px] font-bold text-slate-400">{item.unit}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                    
                    {(userRole === "admin" || userRole === "master_admin") && (
                      <button
                        id={`delete-fabric-${item.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(language === "TR" ? `${item.item_name} kumaşını silmek istiyor musunuz?` : language === "AR" ? `هل تريد حذف قماش ${item.item_name}؟` : `Are you sure you want to delete ${item.item_name}?`)) {
                            onDeleteFabric(item.id);
                          }
                        }}
                        className="text-slate-300 hover:text-rose-500 p-1.5 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
