import React, { useState } from "react";
import { FolderGit2, Plus, Sparkles, Trash2, Layers, DollarSign, ExternalLink, HelpCircle, Upload, Image as ImageIcon, Users, Building2, UserPlus, ChevronDown, ChevronUp, Clock, CheckCircle2, Scissors, Shirt, ChevronRight, ArrowRight, Snowflake, Sun, Wind, Filter, Check, BarChart3, PackageCheck, AlertCircle, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FashionModel, BomItem, CustomCostLine, ModelSizeQty, LogisticsItem, ProductionItem, ModelSeason } from "../types";
import { Language, TranslationDictionary } from "../translations";
import HandwritingSizeInput from "./HandwritingSizeInput";

interface DashboardTabProps {
  models: FashionModel[];
  bomItems: BomItem[];
  customCostLines: CustomCostLine[];
  logistics?: LogisticsItem[];
  production?: ProductionItem[];
  userRole: string;
  onSelectModel: (model: FashionModel) => void;
  onAddModel: (name: string, code: string, customer: string, price: number, labor: number, img: string, requestedQty?: number, cutQty?: number, sentQty?: number, sizesQty?: ModelSizeQty[], date?: string, season?: string) => void;
  onDeleteModel: (id: string) => void;
  onDeleteAllModels?: () => void;
  triggerToast: (msg: string, type?: "success" | "error" | "info") => void;
  t: TranslationDictionary;
  language: Language;
  handleSyncToCloud: () => Promise<void>;
  isSyncingToCloud: boolean;
  customBrands?: Record<string, string>;
  onAddCustomBrand?: (code: string, name: string, email: string, password?: string) => Promise<boolean>;
  registeredProfiles?: Array<{ email: string; user_role: string; brand_code: string }>;
}

export default function DashboardTab({
  models,
  bomItems,
  customCostLines,
  logistics = [],
  production = [],
  userRole,
  onSelectModel,
  onAddModel,
  onDeleteModel,
  onDeleteAllModels,
  triggerToast,
  t,
  language,
  handleSyncToCloud,
  isSyncingToCloud,
  customBrands = {},
  onAddCustomBrand,
  registeredProfiles = []
}: DashboardTabProps) {

  // Brand Management form states
  const [modelToDelete, setModelToDelete] = useState<FashionModel | null>(null);
  const [showBrandMgmt, setShowBrandMgmt] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandCode, setNewBrandCode] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPassword, setNewClientPassword] = useState("");
  const [isSubmittingBrand, setIsSubmittingBrand] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [modelName, setModelName] = useState("");
  const [modelCode, setModelCode] = useState("");
  const [modelCustomer, setModelCustomer] = useState("");
  const [modelPrice, setModelPrice] = useState("0.00");
  const [modelLabor, setModelLabor] = useState("0.00");
  const [modelImgUrl, setModelImgUrl] = useState("");
  const [modelDate, setModelDate] = useState(new Date().toISOString().split("T")[0]);
  const [modelSeason, setModelSeason] = useState<string>("WINTER");
  const [activeSeasonFilter, setActiveSeasonFilter] = useState<string>("ALL");
  const [requestedQty, setRequestedQty] = useState("0");
  const [cutQty, setCutQty] = useState("0");
  const [sentQty, setSentQty] = useState("0");

  // KPI Calculations
  const totalModelsCount = models.length;

  // Active in production count: models in production stages
  const activeProductionCount = production.length > 0
    ? production.filter(p => (p.stage !== "SEVKIYAT" && p.stage !== "TAMAMLANDI") || (p.progress || 0) < 100).length
    : models.filter(m => (m.sent_qty || 0) < (m.requested_qty || 1) || (m.cut_qty || 0) > 0).length || totalModelsCount;

  // Completed models count
  const completedCount = production.length > 0
    ? production.filter(p => p.stage === "SEVKIYAT" || (p.progress || 0) >= 100).length
    : models.filter(m => (m.requested_qty || 0) > 0 && (m.sent_qty || 0) >= (m.requested_qty || 0)).length;

  // Total Fabric stock calculation in meters
  const totalFabricMeters = logistics.length > 0
    ? logistics.reduce((sum, item) => sum + (Number(item.remaining ?? item.incoming) || 0), 0)
    : 0;

  // Formatted date string for hero banner
  const todayFormatted = new Intl.DateTimeFormat(language === "TR" ? "tr-TR" : language === "AR" ? "ar-SA" : "en-US", {
    weekday: "long",
    month: "short",
    day: "numeric"
  }).format(new Date());

  // Size-specific dynamic list during model creation
  const [modelSizesList, setModelSizesList] = useState<ModelSizeQty[]>([]);
  const [selectedSizeInput, setSelectedSizeInput] = useState("0-3 Ay");
  const [sizeColor, setSizeColor] = useState("");
  const [sizeReqQty, setSizeReqQty] = useState("0");
  const [sizeCutQty, setSizeCutQty] = useState("0");
  const [sizeSentQty, setSizeSentQty] = useState("0");

  const handleAddSizeItem = (e: React.MouseEvent) => {
    e.preventDefault();
    const req = parseInt(sizeReqQty) || 0;
    const cut = parseInt(sizeCutQty) || 0;
    const sent = parseInt(sizeSentQty) || 0;
    const colorVal = sizeColor.trim();
    
    if (modelSizesList.some(item => item.size === selectedSizeInput && (item.color || "") === colorVal)) {
      triggerToast(language === "TR" ? "Bu beden ve renk kombinasyonu zaten eklenmiş." : "This size and color combination is already added.", "error");
      return;
    }

    setModelSizesList(prev => [
      ...prev,
      {
        size: selectedSizeInput,
        color: colorVal || undefined,
        requested_qty: req,
        cut_qty: cut,
        sent_qty: sent
      }
    ]);

    // Automatically recalculate grand totals
    const newTotalReq = modelSizesList.reduce((acc, item) => acc + item.requested_qty, 0) + req;
    const newTotalCut = modelSizesList.reduce((acc, item) => acc + item.cut_qty, 0) + cut;
    const newTotalSent = modelSizesList.reduce((acc, item) => acc + item.sent_qty, 0) + sent;
    
    setRequestedQty(newTotalReq.toString());
    setCutQty(newTotalCut.toString());
    setSentQty(newTotalSent.toString());

    // Reset size specific fields
    setSizeReqQty("0");
    setSizeCutQty("0");
    setSizeSentQty("0");
    setSizeColor("");
  };

  const handleRemoveSizeItem = (index: number) => {
    const updated = [...modelSizesList];
    updated.splice(index, 1);
    setModelSizesList(updated);

    const newTotalReq = updated.reduce((acc, item) => acc + item.requested_qty, 0);
    const newTotalCut = updated.reduce((acc, item) => acc + item.cut_qty, 0);
    const newTotalSent = updated.reduce((acc, item) => acc + item.sent_qty, 0);

    setRequestedQty(newTotalReq.toString());
    setCutQty(newTotalCut.toString());
    setSentQty(newTotalSent.toString());
  };

  const handleClearForm = () => {
    setModelName("");
    setModelCode("");
    setModelPrice("350.00");
    setModelLabor("45.00");
    setModelImgUrl("");
    setModelDate(new Date().toISOString().split("T")[0]);
    setModelSeason("WINTER");
    setRequestedQty("0");
    setCutQty("0");
    setSentQty("0");
    setModelSizesList([]);
    setFilePreview(null);
    setSizeColor("");
    setSizeReqQty("0");
    setSizeCutQty("0");
    setSizeSentQty("0");
    triggerToast(language === "TR" ? "Form temizlendi." : language === "AR" ? "تم مسح النموذج." : "Form cleared.", "info");
  };

  // Image Upload state & preview
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Drag & Drop handlers
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
      triggerToast(language === "TR" ? "Lütfen geçerli bir resim dosyası seçin." : language === "AR" ? "يرجى تحديد ملف صورة صالح." : "Please select a valid image file.", "error");
      return;
    }

    try {
      const { compressImage } = await import('../imageUtils');
      const compressedBase64 = await compressImage(file);
      setModelImgUrl(compressedBase64);
      setFilePreview(compressedBase64);
      triggerToast(language === "TR" ? "Model görseli başarıyla yüklendi!" : language === "AR" ? "تم تحميل صورة الموديل بنجاح!" : "Model image uploaded successfully!");
    } catch (err) {
      console.error(err);
      triggerToast(language === "TR" ? "Görsel yüklenemedi." : "Failed to load image.", "error");
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

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName.trim() || !modelCode.trim() || !modelCustomer.trim()) {
      triggerToast(language === "TR" ? "Lütfen tüm zorunlu alanları (Marka seçimi dahil) doğru girin." : language === "AR" ? "يرجى إدخال جميع الحقول المطلوبة بشكل صحيح." : "Please enter all required fields correctly.", "error");
      return;
    }

    const defaultImg = modelImgUrl.trim() || "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800";
    
    onAddModel(
      modelName.trim(),
      modelCode.trim().toUpperCase(),
      modelCustomer.trim(),
      parseFloat(modelPrice) || 0,
      parseFloat(modelLabor) || 0,
      defaultImg,
      parseInt(requestedQty) || 0,
      parseInt(cutQty) || 0,
      parseInt(sentQty) || 0,
      modelSizesList,
      modelDate || undefined,
      modelSeason
    );

    // Reset Form
    setModelName("");
    setModelCode("");
    setModelPrice("0.00");
    setModelLabor("0.00");
    setModelImgUrl("");
    setModelDate(new Date().toISOString().split("T")[0]);
    setModelSeason("WINTER");
    setRequestedQty("0");
    setCutQty("0");
    setSentQty("0");
    setModelSizesList([]);
    setFilePreview(null);
    setShowAddForm(false);
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportModelPdf = async () => {
    setIsExporting(true);
    triggerToast(language === "TR" ? "Toplu Model Kataloğu PDF hazırlanıyor..." : "Exporting Bulk Model Catalog PDF...", "info");

    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      
      let hasAmiri = false;
      try {
        const fontRes = await fetch("https://fonts.gstatic.com/ea/amiri/v2/Amiri-Regular.ttf");
        if (fontRes.ok) {
          const fontBlob = await fontRes.blob();
          const reader = new FileReader();
          const b64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
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
      
      const title = language === "TR" ? "TOPLU MODEL KATALOĞU" : language === "AR" ? "كتالوج الموديلات المجمع" : "BULK MODEL CATALOG";
      
      let firstPage = true;

      for (let i = 0; i < models.length; i++) {
        if (!firstPage) {
          doc.addPage();
        }
        firstPage = false;
        
        const m = models[i];
        
        // --- Page Header ---
        doc.setFontSize(16);
        if (hasAmiri && language === "AR") {
          doc.text(title, 195, 15, { align: "right" });
        } else {
          doc.text(title, 14, 15);
        }
        
        doc.setFontSize(9);
        const dateText = `${language === "TR" ? "Tarih:" : language === "AR" ? "التاريخ:" : "Date:"} ${new Date().toLocaleDateString()}`;
        if (hasAmiri && language === "AR") {
          doc.text(dateText, 195, 22, { align: "right" });
        } else {
          doc.text(dateText, 14, 22);
        }

        // --- Model Basic Info ---
        doc.setFontSize(14);
        const modelTitle = `${m.name} (${m.smart_id})`;
        if (hasAmiri && language === "AR") {
          doc.text(modelTitle, 195, 35, { align: "right" });
        } else {
          doc.text(modelTitle, 14, 35);
        }
        
        doc.setFontSize(10);
        let startY = 45;
        const brand = m.customer_name || m.brand_code || "-";
        const season = m.season === "WINTER" ? (language === "TR" ? "Kış" : language === "AR" ? "شتاء" : "Winter") : m.season === "SUMMER" ? (language === "TR" ? "Yaz" : language === "AR" ? "صيف" : "Summer") : (language === "TR" ? "Bahar / Dört Mevsim" : language === "AR" ? "ربيع / كل الفصول" : "Spring / All Seasons");
        
        doc.text(`${language === "TR" ? "Marka / Müşteri:" : language === "AR" ? "الماركة / العميل:" : "Brand / Customer:"} ${brand}`, 14, startY);
        doc.text(`${language === "TR" ? "Sezon:" : language === "AR" ? "الموسم:" : "Season:"} ${season}`, 100, startY);
        startY += 7;
        
        doc.text(`${language === "TR" ? "Toplam Kesilen / Üretilen:" : language === "AR" ? "إجمالي المقصوص / المنتج:" : "Total Cut / Produced:"} ${m.cut_qty || 0}`, 14, startY);
        doc.text(`${language === "TR" ? "Sevk Edilen / Müşteriye Giden:" : language === "AR" ? "المرسل / للعميل:" : "Shipped / Delivered:"} ${m.sent_qty || 0}`, 100, startY);
        startY += 7;
        const stock = Math.max(0, (m.cut_qty || 0) - (m.sent_qty || 0));
        doc.text(`${language === "TR" ? "Mevcut Depo Stoğu:" : language === "AR" ? "مخزون المستودع الحالي:" : "Current Warehouse Stock:"} ${stock}`, 14, startY);
        
        // Wait, image?
        if (m.photo_url) {
          try {
            const imgData = m.photo_url;
            doc.addImage(imgData, 'JPEG', 140, 45, 55, 75);
          } catch(e) {
            console.log("Could not add image");
          }
        }
        
        startY += 20;

        // --- BOM Fabrics ---
        const myBom = bomItems.filter(b => b.model_id === m.id);
        const myFabrics = myBom.filter(b => b.item_type === "Kumaş");
        
        if (myFabrics.length > 0) {
          doc.setFontSize(11);
          doc.text(language === "TR" ? "Kumaş Reçetesi" : language === "AR" ? "وصفة القماش" : "Fabric BOM", 14, startY);
          startY += 5;
          const fabricData = myFabrics.map(f => [
            f.item_name || f.item_smart_id,
            `${f.consumption} ${f.unit || "Mt"}`,
            `${f.unit_cost} ${f.currency || "USD"}`
          ]);
          autoTable(doc, {
            startY,
            head: [[
              language === "TR" ? "Kumaş" : language === "AR" ? "القماش" : "Fabric", 
              language === "TR" ? "Birim Miktar" : language === "AR" ? "كمية الوحدة" : "Unit Qty", 
              language === "TR" ? "Fiyat" : language === "AR" ? "السعر" : "Price"
            ]],
            body: fabricData,
            styles: { font: hasAmiri ? "Amiri" : "helvetica", fontSize: 9 },
            theme: 'grid',
            tableWidth: 110,
            margin: { left: 14 }
          });
          startY = (doc as any).lastAutoTable.finalY + 10;
        }
        
        // --- Custom Costs ---
        const myCosts = customCostLines.filter(c => c.model_id === m.id);
        if (myCosts.length > 0) {
          doc.setFontSize(11);
          doc.text(language === "TR" ? "Ek Maliyetler" : language === "AR" ? "تكاليف إضافية" : "Extra Costs", 14, startY);
          startY += 5;
          const costData = myCosts.map(c => [
            c.name,
            `${c.cost.toFixed(2)} ${c.currency}`
          ]);
          autoTable(doc, {
            startY,
            head: [[
              language === "TR" ? "Maliyet Adı" : language === "AR" ? "اسم التكلفة" : "Cost Name",
              language === "TR" ? "Tutar" : language === "AR" ? "المبلغ" : "Amount"
            ]],
            body: costData,
            styles: { font: hasAmiri ? "Amiri" : "helvetica", fontSize: 9 },
            theme: 'grid',
            tableWidth: 110,
            margin: { left: 14 }
          });
        }
      }

      if (models.length === 0) {
        doc.setFontSize(12);
        doc.text(language === "TR" ? "Filtrelenmiş model bulunamadı." : "No filtered models found.", 14, 40);
      }

      doc.save(`Toplu_Model_Katalogu_${new Date().toISOString().split("T")[0]}.pdf`);
      triggerToast(language === "TR" ? "Katalog PDF başarıyla indirildi!" : "Catalog PDF Export Complete!", "success");
    } catch (e: any) {
      console.error("PDF generation failed:", e);
      triggerToast(language === "TR" ? "PDF oluşturulurken hata oluştu." : "Failed to generate PDF.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div id="dashboard-tab" className="space-y-4">
      
      {/* BRAND & CUSTOMER MANAGEMENT MODÜLÜ FOR ADMIN ONLY */}
      {(userRole === "admin" || userRole === "master_admin") && (
        <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 shadow-md text-white flex flex-col gap-3 relative overflow-hidden">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowBrandMgmt(!showBrandMgmt)}>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-400 shrink-0" />
              <div>
                <h3 className="font-extrabold text-white text-[13px] tracking-tight">Marka & Müşteri Yönetimi</h3>
                <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider text-left">HARİCİ MÜŞTERİ HESABI VE YETKİLENDİRME</p>
              </div>
            </div>
            <button type="button" className="text-slate-400 hover:text-white p-1">
              {showBrandMgmt ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {showBrandMgmt && (
            <div className="border-t border-slate-800 pt-3 space-y-4 animate-in fade-in duration-200">
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newBrandCode.trim() || !newBrandName.trim() || !newClientEmail.trim() || !newClientPassword.trim()) {
                    triggerToast("Lütfen tüm alanları doldurun!", "error");
                    return;
                  }
                  setIsSubmittingBrand(true);
                  try {
                    if (onAddCustomBrand) {
                      const ok = await onAddCustomBrand(newBrandCode.trim(), newBrandName.trim(), newClientEmail.trim(), newClientPassword.trim());
                      if (ok) {
                        setNewBrandName("");
                        setNewBrandCode("");
                        setNewClientEmail("");
                        setNewClientPassword("");
                      }
                    }
                  } finally {
                    setIsSubmittingBrand(false);
                  }
                }}
                className="space-y-2.5 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80"
              >
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400">Marka / Müşteri Adı</label>
                    <input 
                      type="text" 
                      placeholder="Örn: Gucci International"
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400">Marka Kodu (ID)</label>
                    <input 
                      type="text" 
                      placeholder="Örn: GUCCI"
                      value={newBrandCode}
                      onChange={(e) => setNewBrandCode(e.target.value.toUpperCase())}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 font-mono uppercase focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Yetkili Müşteri E-Postası (Giriş Yapacak Hesap)</label>
                  <input 
                    type="email" 
                    placeholder="musteri@gucci.com"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400">Şifre</label>
                    <input 
                      type="password" 
                      placeholder="Gizli Şifre (Örn: 123456)"
                      value={newClientPassword}
                      onChange={(e) => setNewClientPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <p className="text-[8px] text-slate-400">Bu e-posta ile giriş yapan kullanıcı sadece bu markaya ait model, kumaş ve üretim verilerini görebilecektir.</p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingBrand}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-xs font-bold py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingBrand ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Marka & Müşteriyi Kaydet</span>
                    </>
                  )}
                </button>
              </form>

              {/* Müşteri Listesi */}
              <div className="space-y-2 text-left">
                <h4 className="text-[11px] font-black uppercase text-indigo-400 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> Kayıtlı Müşteriler ({registeredProfiles.length})
                </h4>

                {registeredProfiles.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic">Henüz özel kayıtlı marka/müşteri bulunmuyor.</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 text-[11px]">
                    {registeredProfiles.map((profile, idx) => (
                      <div key={idx} className="bg-slate-950/30 border border-slate-800 p-2 rounded-xl flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-200">{profile.email}</p>
                          <div className="flex gap-2 items-center">
                            <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-md font-mono uppercase">
                              Rol: {profile.user_role || "CUSTOMER"}
                            </span>
                            <span className="text-[9px] bg-indigo-950 border border-indigo-900 text-indigo-300 px-1.5 py-0.5 rounded-md font-mono">
                              Kod: {profile.brand_code || "N/A"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-[10px] text-slate-400 font-medium">
                          {(() => {
                            const cleanCode = (profile.brand_code || "").toUpperCase();
                            if (customBrands[cleanCode]) return <span className="text-indigo-200 font-extrabold">{customBrands[cleanCode]}</span>;
                            return <span className="text-indigo-200 font-extrabold">{cleanCode}</span>;
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TOP HERO BANNER (EXACTLY MATCHING TARGET VISUAL) */}
      <div id="dashboard-hero-banner" className="bg-gradient-to-br from-[#10131c] via-[#151926] to-[#1c2234] text-white p-5 rounded-3xl border border-slate-800 shadow-md relative overflow-hidden space-y-3">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top meta row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-slate-900/90 border border-amber-500/40 text-amber-400 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase inline-block">
              TIGER TEXTILE ERP
            </span>
            <span className="text-[10px] text-slate-400 font-medium capitalize">
              {todayFormatted}
            </span>
          </div>

          {(userRole === "admin" || userRole === "master_admin") && models.length > 0 && (
            <button
              id="delete-all-models-btn"
              type="button"
              onClick={() => {
                if (window.confirm(language === "TR" ? "DİKKAT: Sistemdeki TÜM modelleri ve ilişkili reçete/stok kayıtlarını silmek istediğinize emin misiniz?" : language === "AR" ? "هل أنت متأكد من حذف جميع الموديلات من النظام؟" : "Are you sure you want to delete ALL models and related records?")) {
                  onDeleteAllModels?.();
                }
              }}
              className="text-rose-400 hover:text-rose-300 p-1 transition-colors cursor-pointer"
              title={language === "TR" ? "Tüm Modelleri Kaldır" : "Remove All"}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Title and Subtitle */}
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-black text-white leading-snug tracking-tight">
            {(userRole === "admin" || userRole === "master_admin") 
              ? "(Master Admin) مدير الورشة والنظام" 
              : userRole === "staff" 
              ? "(Staff) موظف الورشة" 
              : "(Customer) العميل"}
          </h2>
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
            {language === "TR"
              ? "Model, üretim aşamaları, kumaş ve maliyetlerin tek merkezden takibi"
              : language === "AR"
              ? "متابعة الموديلات ومراحل الإنتاج والأقمشة والتكاليف من مركز موحد"
              : "Centralized tracking of models, production stages, fabrics, and costs"}
          </p>
        </div>

        {/* Action Button: + Yeni Model Ekle and Export */}
        <div className="pt-1 flex items-center gap-2">
          {userRole !== "client" && (
            <button
              onClick={handleExportModelPdf}
              disabled={isExporting}
              className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white font-black text-xs px-3 py-2.5 rounded-2xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer font-sans disabled:opacity-50"
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
              id="open-model-form-btn"
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-black text-xs px-4 py-2.5 rounded-2xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer font-sans"
            >
              <Plus className="h-4 w-4 stroke-[3px]" />
              <span>{language === "TR" ? "+ Yeni Model Ekle" : language === "AR" ? "+ إضافة موديل جديد" : "+ Add New Model"}</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 KPI METRIC STAT CARDS (2x2 GRID AS IN TARGET VISUAL) */}
      <div className="grid grid-cols-2 gap-3" id="dashboard-kpi-grid">
        {/* 1. Toplam Model (Yellow T-Shirt) */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100/90 shadow-xs flex flex-col justify-between h-28 hover:border-amber-200 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-extrabold text-slate-700 leading-tight">
              {language === "TR" ? "Toplam Model" : language === "AR" ? "إجمالي الموديلات" : "Total Models"}
            </span>
            <div className="w-8 h-8 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-500 shrink-0">
              <Shirt className="h-4 w-4 stroke-[2.2px]" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 font-sans tracking-tight">
              {totalModelsCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {language === "AR" ? "موديل" : language === "TR" ? "موديل" : "models"}
            </span>
          </div>
        </div>

        {/* 2. Üretimdeki Modeller (Blue Clock) */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100/90 shadow-xs flex flex-col justify-between h-28 hover:border-sky-200 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-extrabold text-slate-700 leading-tight">
              {language === "TR" ? "Üretimdeki Modeller" : language === "AR" ? "الموديلات قيد الإنتاج" : "In Production"}
            </span>
            <div className="w-8 h-8 rounded-2xl bg-sky-50 border border-sky-200/60 flex items-center justify-center text-sky-500 shrink-0">
              <Clock className="h-4 w-4 stroke-[2.2px]" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-sky-600 font-sans tracking-tight">
              {activeProductionCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {language === "AR" ? "قيد العمل" : language === "TR" ? "قيد العمل" : "in progress"}
            </span>
          </div>
        </div>

        {/* 3. Tamamlanan Modeller (Teal Check Circle) */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100/90 shadow-xs flex flex-col justify-between h-28 hover:border-teal-200 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-extrabold text-slate-700 leading-tight">
              {language === "TR" ? "Tamamlanan Modeller" : language === "AR" ? "الموديلات المكتملة" : "Completed Models"}
            </span>
            <div className="w-8 h-8 rounded-2xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-500 shrink-0">
              <CheckCircle2 className="h-4 w-4 stroke-[2.2px]" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-teal-600 font-sans tracking-tight">
              {completedCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {language === "AR" ? "جاهز للتسليم" : language === "TR" ? "جاهز للتسليم" : "ready"}
            </span>
          </div>
        </div>

        {/* 4. Kumaş Stok Durumu (Purple Scissors) */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100/90 shadow-xs flex flex-col justify-between h-28 hover:border-purple-200 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-extrabold text-slate-700 leading-tight">
              {language === "TR" ? "Kumaş Stok Durumu" : language === "AR" ? "مخزون الأقمشة" : "Fabric Stock"}
            </span>
            <div className="w-8 h-8 rounded-2xl bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-500 shrink-0">
              <Scissors className="h-4 w-4 stroke-[2.2px]" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-purple-600 font-sans tracking-tight">
                {totalFabricMeters.toLocaleString("tr-TR")}
              </span>
              <span className="text-xs font-bold text-slate-600">Metre</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium block leading-none mt-0.5">
              {language === "AR" ? "بالمخزن" : language === "TR" ? "بالمخزن" : "in warehouse"}
            </span>
          </div>
        </div>
      </div>

      {/* FORM: EXPLICIT MANUAL MODEL REGISTRATION */}
      {(userRole === "admin" || userRole === "master_admin") && showAddForm && (
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-4 animate-in fade-in duration-200">
          
          {/* Manual Form Header */}
          <div className="border-b border-slate-50 pb-2">
            <h3 className="text-xs font-bold text-slate-800">{t.modelManualTitle}</h3>
            <p className="text-[9px] text-slate-400">{t.modelManualDesc}</p>
          </div>

          <form onSubmit={handleManualAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400">{t.modelCode}</label>
                <input 
                  type="text" 
                  placeholder="Örn: MDL-505"
                  value={modelCode}
                  onChange={(e) => setModelCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400">{t.modelName}</label>
                <input 
                  type="text" 
                  placeholder="Örn: Drapeli Mini Saten"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-xs"
                  required
                />
              </div>
            </div>

            {/* Model Entry Date Picker */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-500 flex items-center justify-between">
                <span>{language === "TR" ? "📅 Model Giriş / Kayıt Tarihi" : language === "AR" ? "📅 تاريخ إدخال الموديل" : "📅 Model Entry Date"}</span>
                <span className="text-[8px] text-indigo-500 font-semibold">{modelDate}</span>
              </label>
              <input 
                type="date"
                value={modelDate}
                onChange={(e) => setModelDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-400">{t.customerBrand}</label>
              <select
                value={modelCustomer}
                onChange={(e) => setModelCustomer(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-indigo-500"
                required
              >
                <option value="">-- {language === "TR" ? "Marka / Müşteri Seçin" : language === "AR" ? "اختر الماركة / العميل" : "Select Brand / Customer"} --</option>
                {Object.entries(customBrands).map(([code, name]) => (
                  <option key={code} value={name}>{name} ({code})</option>
                ))}
              </select>
            </div>



            {/* SEZON SEÇİMİ (SEASON SELECTION: WINTER / SUMMER / TRANSITION) */}
            <div className="space-y-2 bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span className="text-xs">🗓️</span>
                  <span>{language === "TR" ? "Model Sezonu (3 Sezon Seçeneği)" : language === "AR" ? "موسم الموديل (3 خيارات)" : "Model Season (3 Seasons)"}</span>
                </label>
                <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                  modelSeason === "WINTER" ? "bg-sky-100 text-sky-800 border border-sky-300" :
                  modelSeason === "SUMMER" ? "bg-amber-100 text-amber-900 border border-amber-300" :
                  "bg-teal-100 text-teal-900 border border-teal-300"
                }`}>
                  {modelSeason === "WINTER" ? "❄️ " + (language === "TR" ? "Kış Sezonu" : language === "AR" ? "الموسم الشتوي" : "Winter") :
                   modelSeason === "SUMMER" ? "☀️ " + (language === "TR" ? "Yaz Sezonu" : language === "AR" ? "الموسم الصيفي" : "Summer") :
                   "🍂 " + (language === "TR" ? "Mevsim Geçişi" : language === "AR" ? "بين الفصول / انتقالي" : "Change of Seasons")}
                </span>
              </div>
              <p className="text-[9px] text-slate-500 font-medium">
                {language === "TR" 
                  ? "Modelinizi ait olduğu mevsime göre kaydedin. Sezon sonu net adetler ve bakiye sayımı otomatik hesaplanacaktır." 
                  : language === "AR"
                  ? "احفظ الموديل حسب موسمه ليتم إحصاء كميات نهاية الموسم بدقة."
                  : "Save your model into its respective season for accurate end-of-season quantity tracking."}
              </p>

              <div className="grid grid-cols-3 gap-2 pt-1">
                {/* 1. Winter / Kış */}
                <button
                  id="season-btn-winter"
                  type="button"
                  onClick={() => setModelSeason("WINTER")}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    modelSeason === "WINTER"
                      ? "bg-sky-500 text-white border-sky-600 shadow-md ring-2 ring-sky-300 scale-[1.02]"
                      : "bg-white border-slate-200/90 hover:bg-sky-50/50 text-slate-700 font-semibold"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center mb-1.5 transition-colors ${
                    modelSeason === "WINTER" ? "bg-white/20 text-white" : "bg-sky-100 text-sky-600"
                  }`}>
                    <Snowflake className="h-4 w-4 stroke-[2.5px]" />
                  </div>
                  <span className="text-[11px] leading-tight font-black">
                    {language === "TR" ? "Kış" : language === "AR" ? "شتوي" : "Winter"}
                  </span>
                  <span className={`text-[8px] font-medium mt-0.5 ${modelSeason === "WINTER" ? "text-sky-100" : "text-slate-400"}`}>
                    {language === "TR" ? "Kış Koleksiyonu" : "Winter Season"}
                  </span>
                </button>

                {/* 2. Summer / Yaz */}
                <button
                  id="season-btn-summer"
                  type="button"
                  onClick={() => setModelSeason("SUMMER")}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    modelSeason === "SUMMER"
                      ? "bg-amber-500 text-slate-950 border-amber-600 shadow-md ring-2 ring-amber-300 scale-[1.02]"
                      : "bg-white border-slate-200/90 hover:bg-amber-50/50 text-slate-700 font-semibold"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center mb-1.5 transition-colors ${
                    modelSeason === "SUMMER" ? "bg-slate-950/20 text-slate-950" : "bg-amber-100 text-amber-600"
                  }`}>
                    <Sun className="h-4 w-4 stroke-[2.5px]" />
                  </div>
                  <span className="text-[11px] leading-tight font-black">
                    {language === "TR" ? "Yaz" : language === "AR" ? "صيفي" : "Summer"}
                  </span>
                  <span className={`text-[8px] font-medium mt-0.5 ${modelSeason === "SUMMER" ? "text-amber-950 font-bold" : "text-slate-400"}`}>
                    {language === "TR" ? "Yaz Koleksiyonu" : "Summer Season"}
                  </span>
                </button>

                {/* 3. Transition / Mevsim Geçişi */}
                <button
                  id="season-btn-transition"
                  type="button"
                  onClick={() => setModelSeason("TRANSITION")}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    modelSeason === "TRANSITION"
                      ? "bg-teal-600 text-white border-teal-700 shadow-md ring-2 ring-teal-300 scale-[1.02]"
                      : "bg-white border-slate-200/90 hover:bg-teal-50/50 text-slate-700 font-semibold"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center mb-1.5 transition-colors ${
                    modelSeason === "TRANSITION" ? "bg-white/20 text-white" : "bg-teal-100 text-teal-700"
                  }`}>
                    <Wind className="h-4 w-4 stroke-[2.5px]" />
                  </div>
                  <span className="text-[10.5px] leading-tight font-black">
                    {language === "TR" ? "Mevsim Geçişi" : language === "AR" ? "بين الفصول" : "Change of Seasons"}
                  </span>
                  <span className={`text-[8px] font-medium mt-0.5 ${modelSeason === "TRANSITION" ? "text-teal-100" : "text-slate-400"}`}>
                    {language === "TR" ? "Bahar & Geçiş" : "Transitional"}
                  </span>
                </button>
              </div>
            </div>

            {/* ADIM 1: EL YAZISI DİJİTAL ASİSTAN (OPSİYONEL HIZLI GİRİŞ) */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-400">
                {language === "TR" ? "Beden Seçimi / El Yazısı Çizim Girişi" : "Size Input / Handwriting Draw"}
              </label>
              <HandwritingSizeInput 
                value={selectedSizeInput}
                onChange={(val) => setSelectedSizeInput(val)}
                language={language}
                triggerToast={triggerToast}
              />
            </div>

            {/* BEDEN & RENK BAZLI SİPARİŞ / KESİM / SEVK ADETLERİ (TABLO LİSTESİ) */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-indigo-600" />
                  <span>{language === "TR" ? "Beden & Renk Bazlı Adetler" : language === "AR" ? "الكميات حسب المقاس واللون" : "Quantities by Size & Color"}</span>
                </label>
                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  {modelSizesList.length} {language === "TR" ? "Varyant" : language === "AR" ? "خيار" : "Variants"}
                </span>
              </div>

              {/* Hızlı Ekleme Satırı */}
              <div className="grid grid-cols-12 gap-1.5 items-end bg-white p-2 rounded-xl border border-slate-200/60 shadow-2xs">
                <div className="col-span-3 space-y-0.5">
                  <span className="text-[8px] font-bold text-slate-400 block uppercase">Beden</span>
                  <select
                    value={selectedSizeInput}
                    onChange={(e) => setSelectedSizeInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-[10px] font-semibold text-slate-800"
                  >
                    <option value="0-3 Ay">0-3 Ay</option>
                    <option value="3-6 Ay">3-6 Ay</option>
                    <option value="6-9 Ay">6-9 Ay</option>
                    <option value="9-12 Ay">9-12 Ay</option>
                    <option value="12-18 Ay">12-18 Ay</option>
                    <option value="18-24 Ay">18-24 Ay</option>
                    <option value="2 Yaş">2 Yaş</option>
                    <option value="3 Yaş">3 Yaş</option>
                    <option value="4 Yaş">4 Yaş</option>
                    <option value="5 Yaş">5 Yaş</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                    <option value="STANDART">STANDART</option>
                  </select>
                </div>

                <div className="col-span-3 space-y-0.5">
                  <span className="text-[8px] font-bold text-slate-400 block uppercase">Renk</span>
                  <input
                    type="text"
                    placeholder="Siyah, Kırmızı..."
                    value={sizeColor}
                    onChange={(e) => setSizeColor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-[10px] text-slate-800"
                  />
                </div>

                <div className="col-span-2 space-y-0.5">
                  <span className="text-[8px] font-bold text-slate-400 block uppercase">Sipariş</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={sizeReqQty}
                    onChange={(e) => setSizeReqQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-[10px] font-bold text-slate-800"
                  />
                </div>

                <div className="col-span-2 space-y-0.5">
                  <span className="text-[8px] font-bold text-slate-400 block uppercase">Kesilen</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={sizeCutQty}
                    onChange={(e) => setSizeCutQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-[10px] font-bold text-slate-800"
                  />
                </div>

                <div className="col-span-2">
                  <button
                    type="button"
                    onClick={handleAddSizeItem}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] py-1.5 rounded-lg transition-colors flex items-center justify-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Ekle</span>
                  </button>
                </div>
              </div>

              {/* Eklenen Bedenler Listesi */}
              {modelSizesList.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-36 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="p-1.5">Beden</th>
                        <th className="p-1.5">Renk</th>
                        <th className="p-1.5 text-center">Sipariş</th>
                        <th className="p-1.5 text-center">Kesim</th>
                        <th className="p-1.5 text-right">Sil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {modelSizesList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-1.5 font-bold text-slate-800">{item.size}</td>
                          <td className="p-1.5 text-slate-600">{item.color || "-"}</td>
                          <td className="p-1.5 text-center font-mono font-bold text-slate-700">{item.requested_qty}</td>
                          <td className="p-1.5 text-center font-mono font-bold text-indigo-600">{item.cut_qty}</td>
                          <td className="p-1.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveSizeItem(idx)}
                              className="text-rose-500 hover:text-rose-700 p-0.5"
                            >
                              <Trash2 className="h-3 w-3 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* DRAG AND DROP / FILE UPLOAD CONTAINER */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-400">{t.modelImgUpload}</label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-3 text-center transition-all cursor-pointer relative ${
                  dragActive 
                    ? "border-indigo-500 bg-indigo-50/50" 
                    : filePreview 
                    ? "border-emerald-300 bg-emerald-50/30" 
                    : "border-slate-200 hover:border-slate-300 bg-slate-50"
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title={t.dragDropText}
                />
                
                {filePreview ? (
                  <div className="flex items-center justify-center gap-3">
                    <img 
                      src={filePreview} 
                      alt="Önizleme" 
                      className="w-12 h-12 object-cover rounded-xl border border-emerald-300 shadow-2xs" 
                    />
                    <div className="text-left">
                      <span className="text-[10px] font-bold text-emerald-700 block flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-emerald-600" /> {t.imageLoaded}
                      </span>
                      <span className="text-[8px] text-slate-400">Değiştirmek için yeni görsel sürükleyin veya tıklayın</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1 py-1">
                    <Upload className="h-5 w-5 text-slate-400" />
                    <span className="text-[10px] font-semibold text-slate-600">
                      {t.dragDropText}
                    </span>
                    <span className="text-[8px] text-slate-400">PNG, JPG, WEBP (Max 5MB)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Alternatif Manuel URL Girişi */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-400">{t.modelImgUrl}</label>
              <input 
                type="url" 
                placeholder="https://images.unsplash.com/..."
                value={modelImgUrl}
                onChange={(e) => {
                  setModelImgUrl(e.target.value);
                  if (e.target.value.trim().startsWith("http")) {
                    setFilePreview(e.target.value.trim());
                  } else {
                    setFilePreview(null);
                  }
                }}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                {t.saveModelCard}
              </button>
              <button
                type="button"
                onClick={handleClearForm}
                className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 font-bold text-xs py-2 rounded-xl transition-colors cursor-pointer border border-slate-200/60"
                title={language === "TR" ? "Formu Sıfırla / Hepsini Kaldır" : language === "AR" ? "مسح النموذج / حذف الكل" : "Reset Form / Clear All"}
              >
                {language === "TR" ? "Temizle" : language === "AR" ? "مسح" : "Clear"}
              </button>
            </div>
          </form>

        </div>
      )}

      {/* SEZON FİLTRELEME & SEZON SONU KESİN ADET TAKİP VE STOK SAYIM PANELİ */}
      {(() => {
        const modelsBySeason = activeSeasonFilter === "ALL" 
          ? models 
          : models.filter(m => {
              const s = (m.season || "WINTER").toUpperCase();
              if (activeSeasonFilter === "WINTER") return s === "WINTER" || s === "KIŞ";
              if (activeSeasonFilter === "SUMMER") return s === "SUMMER" || s === "YAZ";
              if (activeSeasonFilter === "TRANSITION") return s === "TRANSITION" || s === "MEVSİM GEÇİŞİ" || s === "GEÇİŞ";
              return true;
            });

        const seasonTotalModels = modelsBySeason.length;
        const seasonTotalRequested = modelsBySeason.reduce((sum, m) => sum + (m.requested_qty || 0), 0);
        const seasonTotalCut = modelsBySeason.reduce((sum, m) => sum + (m.cut_qty || 0), 0);
        const seasonTotalSent = modelsBySeason.reduce((sum, m) => sum + (m.sent_qty || 0), 0);
        const seasonEndRemainingStock = Math.max(0, seasonTotalCut - seasonTotalSent);
        const seasonFulfillmentRate = seasonTotalRequested > 0 ? Math.min(100, Math.round((seasonTotalCut / seasonTotalRequested) * 100)) : 0;

        const getSeasonBadge = (season?: string) => {
          const s = (season || "WINTER").toUpperCase();
          if (s === "SUMMER" || s === "YAZ") {
            return {
              label: language === "TR" ? "Yaz" : language === "AR" ? "صيفي" : "Summer",
              icon: "☀️",
              badgeClass: "bg-amber-500 text-slate-950 border border-amber-300 font-extrabold",
              tagClass: "bg-amber-50 text-amber-800 border border-amber-200"
            };
          }
          if (s === "TRANSITION" || s === "MEVSİM GEÇİŞİ" || s === "GEÇİŞ" || s === "SPRING_AUTUMN") {
            return {
              label: language === "TR" ? "Mevsim Geçişi" : language === "AR" ? "بين الفصول" : "Transition",
              icon: "🍂",
              badgeClass: "bg-teal-600 text-white border border-teal-400 font-extrabold",
              tagClass: "bg-teal-50 text-teal-800 border border-teal-200"
            };
          }
          return {
            label: language === "TR" ? "Kış" : language === "AR" ? "شتوي" : "Winter",
            icon: "❄️",
            badgeClass: "bg-sky-600 text-white border border-sky-400 font-extrabold",
            tagClass: "bg-sky-50 text-sky-800 border border-sky-200"
          };
        };

        return (
          <div className="space-y-4">
            {/* SEZON KONTROL VE KESİN ADET SAYIM PANELİ */}
            <div id="seasonal-tracking-dashboard" className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs space-y-3.5">
              
              {/* Season Filter Bar Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-black text-xs">
                    ❄️/☀️
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                      <span>{language === "TR" ? "Sezonluk Ürünler & Sezon Sonu Kesin Sayım" : language === "AR" ? "المنتجات الموسمية وإحصاء نهاية الموسم" : "Seasonal Collection & End of Season Quantities"}</span>
                    </h4>
                    <p className="text-[9px] text-slate-400 font-medium">
                      {language === "TR" ? "Kış, Yaz ve Mevsim Geçişi bazlı net sipariş, kesim ve sezon sonu stok adetleri" : "Track winter, summer and transition season end-of-season balances"}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-black bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-xl border border-indigo-100">
                  {modelsBySeason.length} {language === "TR" ? "Model" : "Models"}
                </span>
              </div>

              {/* 4 Sezon Seçim Butonu (Tümü, Kış, Yaz, Mevsim Geçişi) */}
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60">
                <button
                  id="filter-season-all"
                  type="button"
                  onClick={() => setActiveSeasonFilter("ALL")}
                  className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                    activeSeasonFilter === "ALL"
                      ? "bg-white text-slate-950 font-black shadow-xs border border-slate-200"
                      : "text-slate-600 hover:text-slate-900 font-semibold"
                  }`}
                >
                  <span className="text-[12px] leading-none mb-0.5">🌐</span>
                  <span className="text-[10px] leading-tight font-extrabold">{language === "TR" ? "Tümü" : language === "AR" ? "الكل" : "All"}</span>
                  <span className="text-[8px] text-slate-400 font-mono font-bold mt-0.5">({models.length})</span>
                </button>

                <button
                  id="filter-season-winter"
                  type="button"
                  onClick={() => setActiveSeasonFilter("WINTER")}
                  className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                    activeSeasonFilter === "WINTER"
                      ? "bg-sky-500 text-white font-black shadow-xs ring-2 ring-sky-300"
                      : "text-sky-800 hover:bg-sky-50 font-semibold"
                  }`}
                >
                  <span className="text-[12px] leading-none mb-0.5">❄️</span>
                  <span className="text-[10px] leading-tight font-extrabold">{language === "TR" ? "Kış" : language === "AR" ? "شتوي" : "Winter"}</span>
                  <span className="text-[8px] opacity-80 font-mono font-bold mt-0.5">
                    ({models.filter(m => (m.season || "WINTER").toUpperCase() === "WINTER" || (m.season || "").toUpperCase() === "KIŞ").length})
                  </span>
                </button>

                <button
                  id="filter-season-summer"
                  type="button"
                  onClick={() => setActiveSeasonFilter("SUMMER")}
                  className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                    activeSeasonFilter === "SUMMER"
                      ? "bg-amber-500 text-slate-950 font-black shadow-xs ring-2 ring-amber-300"
                      : "text-amber-800 hover:bg-amber-50 font-semibold"
                  }`}
                >
                  <span className="text-[12px] leading-none mb-0.5">☀️</span>
                  <span className="text-[10px] leading-tight font-extrabold">{language === "TR" ? "Yaz" : language === "AR" ? "صيفي" : "Summer"}</span>
                  <span className="text-[8px] opacity-80 font-mono font-bold mt-0.5">
                    ({models.filter(m => (m.season || "").toUpperCase() === "SUMMER" || (m.season || "").toUpperCase() === "YAZ").length})
                  </span>
                </button>

                <button
                  id="filter-season-transition"
                  type="button"
                  onClick={() => setActiveSeasonFilter("TRANSITION")}
                  className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                    activeSeasonFilter === "TRANSITION"
                      ? "bg-teal-600 text-white font-black shadow-xs ring-2 ring-teal-300"
                      : "text-teal-800 hover:bg-teal-50 font-semibold"
                  }`}
                >
                  <span className="text-[12px] leading-none mb-0.5">🍂</span>
                  <span className="text-[9.5px] leading-tight font-extrabold">{language === "TR" ? "Geçiş" : language === "AR" ? "بين الفصول" : "Transition"}</span>
                  <span className="text-[8px] opacity-80 font-mono font-bold mt-0.5">
                    ({models.filter(m => {
                      const s = (m.season || "").toUpperCase();
                      return s === "TRANSITION" || s === "MEVSİM GEÇİŞİ" || s === "GEÇİŞ";
                    }).length})
                  </span>
                </button>
              </div>

              {/* SEZON SONU KESİN ADET RAPORU / SAYIMI (END-OF-SEASON CERTAIN QUANTITIES METRIC CARD) */}
              <div className="bg-gradient-to-br from-[#0e121d] via-[#161c2c] to-[#1c2438] text-white p-4 rounded-2xl border border-slate-800 shadow-sm space-y-3">
                
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-amber-400" />
                    <span className="text-[11px] font-black text-white">
                      {activeSeasonFilter === "ALL" 
                        ? (language === "TR" ? "Tüm Sezonlar Sonu Net Adet Sayımı" : "All Seasons End-of-Season Quantities") 
                        : activeSeasonFilter === "WINTER" 
                        ? (language === "TR" ? "❄️ Kış Sezonu Sonu Kesin Adet Sayımı" : "❄️ Winter Season Certain Quantities") 
                        : activeSeasonFilter === "SUMMER"
                        ? (language === "TR" ? "☀️ Yaz Sezonu Sonu Kesin Adet Sayımı" : "☀️ Summer Season Certain Quantities")
                        : (language === "TR" ? "🍂 Mevsim Geçişi Sonu Kesin Adet Sayımı" : "🍂 Change of Seasons Certain Quantities")}
                    </span>
                  </div>
                  <span className="text-[8.5px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-black uppercase">
                    {language === "TR" ? "Net Sezon Sayımı" : "Exact Count"}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  {/* Toplam Sipariş */}
                  <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
                    <span className="text-[8px] uppercase font-bold text-slate-400 block mb-0.5">
                      {language === "TR" ? "Toplam Sipariş" : language === "AR" ? "إجمالي الطلب" : "Total Order"}
                    </span>
                    <span className="text-sm font-mono font-black text-slate-100 block">
                      {seasonTotalRequested.toLocaleString()}
                    </span>
                    <span className="text-[7.5px] text-slate-400 font-medium">{language === "TR" ? "Talep Edilen" : "Requested"}</span>
                  </div>

                  {/* Toplam Kesilen / Üretim */}
                  <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
                    <span className="text-[8px] uppercase font-bold text-indigo-300 block mb-0.5">
                      {language === "TR" ? "Toplam Kesilen" : language === "AR" ? "إجمالي القص" : "Total Cut"}
                    </span>
                    <span className="text-sm font-mono font-black text-indigo-400 block">
                      {seasonTotalCut.toLocaleString()}
                    </span>
                    <span className="text-[7.5px] text-indigo-200 font-medium">{language === "TR" ? "Kesim Yapılan" : "Processed"}</span>
                  </div>

                  {/* Teslim Edilen */}
                  <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
                    <span className="text-[8px] uppercase font-bold text-emerald-300 block mb-0.5">
                      {language === "TR" ? "Teslim Edilen" : language === "AR" ? "تم التسليم" : "Delivered"}
                    </span>
                    <span className="text-sm font-mono font-black text-emerald-400 block">
                      {seasonTotalSent.toLocaleString()}
                    </span>
                    <span className="text-[7.5px] text-emerald-200 font-medium">{language === "TR" ? "Sevk Edilen" : "Shipped"}</span>
                  </div>

                  {/* Sezon Sonu Net Kalan / Stok */}
                  <div className="bg-amber-950/40 border border-amber-500/40 p-2 rounded-xl">
                    <span className="text-[8px] uppercase font-black text-amber-400 block mb-0.5">
                      {language === "TR" ? "Elde Kalan" : language === "AR" ? "متبقي" : "Remaining"}
                    </span>
                    <span className="text-sm font-mono font-black text-amber-300 block">
                      {seasonEndRemainingStock.toLocaleString()}
                    </span>
                    <span className="text-[7.5px] text-amber-200/80 font-medium">
                      {language === "TR" ? "Net Hazır Stok" : "Ready Balance"}
                    </span>
                  </div>
                </div>

                {/* Sezonluk Kesim ve Karşılama İlerlemesi */}
                {seasonTotalRequested > 0 && (
                  <div className="space-y-1 pt-0.5">
                    <div className="flex justify-between items-center text-[8.5px] text-slate-300 font-semibold">
                      <span>{language === "TR" ? "Sezonluk Kesim Karşılama Oranı:" : "Seasonal Cut Fulfillment Rate:"}</span>
                      <span className="font-mono font-bold text-amber-400">%{seasonFulfillmentRate}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          seasonFulfillmentRate >= 100 ? "bg-emerald-400" : seasonFulfillmentRate >= 50 ? "bg-amber-400" : "bg-indigo-400"
                        }`} 
                        style={{ width: `${Math.min(100, seasonFulfillmentRate)}%` }} 
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION HEADER: "Son Eklenen Modeller" & "Tümünü Gör ->" (MATCHING TARGET VISUAL) */}
            <div className="flex justify-between items-center pt-2 px-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-500 shrink-0">
                  <Shirt className="h-3.5 w-3.5 stroke-[2.5px]" />
                </div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  {language === "TR" ? "Kayıtlı Modeller" : language === "AR" ? "الموديلات المسجلة" : "Registered Models"}
                  {activeSeasonFilter !== "ALL" && (
                    <span className="ml-1.5 text-xs text-indigo-600 font-bold">
                      ({activeSeasonFilter === "WINTER" ? "❄️ Kış" : activeSeasonFilter === "SUMMER" ? "☀️ Yaz" : "🍂 Mevsim Geçişi"})
                    </span>
                  )}
                </h3>
              </div>

              <span className="text-[10px] text-slate-400 font-mono font-bold">
                {modelsBySeason.length} / {models.length} Model
              </span>
            </div>

            {/* RECTANGULAR VERTICAL GRID CARDS (2-column mobile layout) */}
            <div className="grid grid-cols-2 gap-3.5" id="models-grid">
              {modelsBySeason.length === 0 ? (
                <div className="col-span-2 text-center py-10 bg-white rounded-3xl text-xs text-slate-400 font-medium border border-slate-100">
                  {language === "TR" 
                    ? `Bu sezonda (${activeSeasonFilter === "WINTER" ? "Kış" : activeSeasonFilter === "SUMMER" ? "Yaz" : "Mevsim Geçişi"}) henüz model bulunmuyor.`
                    : t.noModels}
                </div>
              ) : (
                modelsBySeason.map((model) => {
                  const requested = model.requested_qty || 0;
                  const cut = model.cut_qty || 0;
                  const sBadge = getSeasonBadge(model.season);

                  return (
                    <div
                      key={model.id}
                      id={`model-card-${model.id}`}
                      onClick={() => onSelectModel(model)}
                      className="bg-white rounded-3xl overflow-hidden border border-slate-150 hover:border-amber-300 shadow-xs hover:shadow-md transition-all active:scale-98 cursor-pointer flex flex-col justify-between min-h-[14.5rem] relative group animate-in fade-in zoom-in-95 duration-200"
                    >
                      {/* Model Image Thumbnail */}
                      <div className="h-36 bg-slate-100 overflow-hidden relative shrink-0">
                        {model.photo_url ? (
                          <img 
                            src={model.photo_url} 
                            alt={model.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-300 bg-slate-50 font-mono">Resim Yok</div>
                        )}

                        {/* Absolute Stage / Status Pill Overlay as in visual */}
                        <span className="absolute bottom-2.5 left-2.5 bg-indigo-600/95 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-300 inline-block" />
                          <span>{model.stage || "Kalıp & Pastal"}</span>
                        </span>

                        {/* Absolute Smart Code overlay */}
                        <span className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-xs text-white text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md shadow-xs font-mono">
                          {model.smart_id}
                        </span>

                        {/* Distinctive Season Badge Pill on Image Overlay */}
                        <span className={`absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full text-[8px] font-extrabold shadow-sm backdrop-blur-xs flex items-center gap-1 ${sBadge.badgeClass}`}>
                          <span>{sBadge.icon}</span>
                          <span>{sBadge.label}</span>
                        </span>

                        {/* Active Model Delete Button */}
                        <button
                          id={`delete-model-${model.id}`}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setModelToDelete(model);
                          }}
                          className="absolute top-2.5 right-2.5 bg-slate-900/80 hover:bg-rose-600 active:scale-90 text-white p-1.5 rounded-full backdrop-blur-md shadow-md transition-all cursor-pointer z-10 flex items-center justify-center group/del"
                          title={language === "TR" ? "Modeli Sil" : language === "AR" ? "حذف الموديل" : "Delete Model"}
                        >
                          <Trash2 className="h-3.5 w-3.5 group-hover/del:scale-110 transition-transform" />
                        </button>
                      </div>

                      {/* Model info text card footer */}
                      <div className="p-3 flex-1 flex flex-col justify-between bg-white">
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <h3 className="text-[11px] font-extrabold text-slate-800 line-clamp-1 leading-tight group-hover:text-amber-600 transition-colors">
                              {model.name}
                            </h3>
                          </div>
                          <p className="text-[9px] text-slate-400 mt-0.5 font-bold line-clamp-1">
                            {model.customer_name || "Fashion Luxe Inc."}
                          </p>
                        </div>

                        {/* Quantities indicator footer */}
                        <div className="pt-2 border-t border-slate-100 mt-1 flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[9px]">
                            <div className="flex items-center gap-1 text-slate-500 font-bold">
                              <span>Sipariş:</span>
                              <span className="font-mono text-slate-800 font-extrabold">{requested > 0 ? requested : "-"}</span>
                            </div>
                            {cut > 0 && (
                              <span className="bg-indigo-50 text-indigo-700 font-mono font-bold px-1.5 py-0.5 rounded-md">
                                {cut} Kesim
                              </span>
                            )}
                          </div>
                          {/* Model Entry Date Audit Badge & Season Tag */}
                          <div className="flex items-center justify-between text-[8px] text-slate-400 font-mono font-medium pt-0.5 border-t border-dashed border-slate-100">
                            <span className="text-slate-400">📅 {model.date || (model.created_at ? model.created_at.split('T')[0] : 'Kayıtlı')}</span>
                            <span className={`px-1.5 py-0.2 rounded-md text-[8px] font-bold ${sBadge.tagClass}`}>
                              {sBadge.icon} {sBadge.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {/* Interactive Delete Model Confirmation Modal */}
      {modelToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          onClick={() => setModelToDelete(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-inner">
              <Trash2 className="w-7 h-7 stroke-[2.2px]" />
            </div>

            {/* Title & Info */}
            <div className="space-y-1.5 w-full">
              <h3 className="text-sm font-black text-slate-900">
                {language === "TR" ? "Modeli Silmek İstediğinize Emin Misiniz?" : language === "AR" ? "هل أنت متأكد من حذف هذا الموديل؟" : "Are you sure you want to delete this model?"}
              </h3>
              <div className="flex items-center justify-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100 my-1">
                <span className="font-mono font-black text-xs text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                  {modelToDelete.smart_id}
                </span>
                <span className="text-xs font-bold text-slate-800 truncate max-w-[180px]">
                  {modelToDelete.name}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed px-1">
                {language === "TR" 
                  ? "Bu model ve modele bağlı tüm kumaş/aksesuar reçeteleri (BOM), fason işçilikler ve depo varyantları kalıcı olarak sistemden silinecektir." 
                  : language === "AR"
                  ? "سيتم حذف هذا الموديل وجميع جداول التكاليف والمستلزمات المرتبطة به بشكل دائم."
                  : "This model and all associated BOM components, custom overheads, and warehouse stock variants will be permanently deleted."}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 w-full pt-1">
              <button
                type="button"
                onClick={() => setModelToDelete(null)}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
              >
                {language === "TR" ? "Vazgeç" : language === "AR" ? "إلغاء" : "Cancel"}
              </button>
              <button
                id="confirm-delete-model-btn"
                type="button"
                onClick={() => {
                  const idToDelete = modelToDelete.id;
                  const nameDeleted = modelToDelete.name;
                  setModelToDelete(null);
                  onDeleteModel(idToDelete);
                  triggerToast(
                    language === "TR" ? `"${nameDeleted}" modeli başarıyla silindi.` : `Model "${nameDeleted}" deleted.`,
                    "info"
                  );
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black text-xs transition-all shadow-md shadow-rose-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === "TR" ? "Evet, Sil" : language === "AR" ? "نعم، حذف" : "Yes, Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
