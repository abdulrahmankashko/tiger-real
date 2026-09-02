import React, { useState } from "react";
import { ArrowLeft, Plus, Trash2, Image as ImageIcon, Sparkles, Sliders, ChevronRight, Upload, AlertCircle, RefreshCw, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LogisticsItem, FabricColorArchive } from "../types";
import { Language, TranslationDictionary } from "../translations";

interface FabricDetailSheetProps {
  fabric: LogisticsItem;
  colorArchives: FabricColorArchive[];
  userRole: string;
  onClose: () => void;
  onAddColorArchive: (color: string, url: string, incoming: number, cut: number, date?: string) => void;
  onRemoveColorArchive: (id: string) => void;
  onAdjustMeters: (id: string, field: "incoming" | "cut", delta: number) => void;
  onUpdateArchiveMeters?: (id: string, incoming: number, cut: number) => void;
  triggerToast: (msg: string, type?: "success" | "error" | "info") => void;
  t: TranslationDictionary;
  language: Language;
}

export default function FabricDetailSheet({
  fabric,
  colorArchives,
  userRole,
  onClose,
  onAddColorArchive,
  onRemoveColorArchive,
  onAdjustMeters,
  onUpdateArchiveMeters,
  triggerToast,
  t,
  language
}: FabricDetailSheetProps) {


  // Form states for registering a new fabric color variant
  const [showAddColorForm, setShowAddColorForm] = useState(false);
  const [newColorName, setNewColorName] = useState("");
  const [newColorImgUrl, setNewColorImgUrl] = useState("");
  const [newColorIncoming, setNewColorIncoming] = useState("100");
  const [newColorCut, setNewColorCut] = useState("0");
  const [newColorDate, setNewColorDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Drag & drop file states
  const [dragActive, setDragActive] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const modelColorArchives = colorArchives.filter(c => c.fabric_id === fabric.id);

  // Total meter logs calculated across variants
  const effectiveIncoming = modelColorArchives.length > 0 
    ? modelColorArchives.reduce((sum, item) => sum + item.incoming, 0)
    : fabric.incoming;
  const effectiveCut = modelColorArchives.length > 0 
    ? modelColorArchives.reduce((sum, item) => sum + item.cut, 0)
    : fabric.cut;
  const effectiveRemaining = effectiveIncoming - effectiveCut;

  const totalGelen = effectiveIncoming;
  const totalKesilen = effectiveCut;
  const totalRemaining = effectiveRemaining;
  const totalFabricCost = totalGelen * (fabric.unit_price || 0);

  // Handle Drag Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Helper to read and process image file
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      triggerToast("Lütfen geçerli bir resim dosyası seçin.", "error");
      return;
    }

    try {
      const { compressImage } = await import('../imageUtils');
      const compressedBase64 = await compressImage(file);
      setNewColorImgUrl(compressedBase64);
      setFilePreview(compressedBase64);
      triggerToast("Renk görseli başarıyla yüklendi!");
    } catch (err) {
      console.error(err);
      triggerToast("Görsel yüklenemedi.", "error");
    }
  };

  // Handle Drop Event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  // Handle Manual File Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleAddColorArchiveLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColorName.trim()) {
      triggerToast("Lütfen bir renk adı girin.", "error");
      return;
    }
    
    // Fallback image url if none entered or uploaded
    const finalImgUrl = newColorImgUrl.trim() || "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400";
    const incVal = isNaN(parseFloat(newColorIncoming)) ? 0 : parseFloat(newColorIncoming);
    const cutVal = isNaN(parseFloat(newColorCut)) ? 0 : parseFloat(newColorCut);

    onAddColorArchive(newColorName.trim(), finalImgUrl, incVal, cutVal, newColorDate);
    
    // Reset Form
    setNewColorName("");
    setNewColorImgUrl("");
    setNewColorIncoming("100");
    setNewColorCut("0");
    setNewColorDate(new Date().toISOString().split("T")[0]);
    setFilePreview(null);
    setShowAddColorForm(false);
  };

  return (
    <motion.div
      id="fabric-detail-sheet"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 24, stiffness: 220 }}
      className="absolute inset-0 bg-[#F8FAFC] z-20 flex flex-col h-full"
    >
      {/* Detail Sheet Header Bar */}
      <div className="bg-white border-b border-slate-100 px-4 py-3.5 flex items-center justify-between shadow-xs shrink-0">
        <button 
          id="back-to-logistics-btn"
          onClick={onClose}
          className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold text-xs cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t.tabLogistics}</span>
        </button>

        <h2 className="text-xs font-extrabold text-slate-800 tracking-wider uppercase">{language === "TR" ? "Metraj & Varyant Kontrol" : language === "AR" ? "التحكم في المتريات والمتغيرات" : "Meters & Variant Control"}</h2>
        <div className="w-8"></div>
      </div>

      {/* Sheet Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        
        {/* Fabric Title Plate */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 uppercase">
                  {fabric.item_smart_id}
                </span>
                {(fabric.date || fabric.created_at) && (
                  <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1 font-mono">
                    📅 {fabric.date || (fabric.created_at ? fabric.created_at.split('T')[0] : '')}
                  </span>
                )}
                {fabric.color && (
                  <span className="text-[9px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    🎨 {fabric.color}
                  </span>
                )}
                {fabric.currency && (
                  <span className={`text-[9px] font-black font-mono px-1.5 py-0.5 rounded ${fabric.currency === "TRY" || fabric.currency === "TL" ? "bg-sky-50 text-sky-700 border border-sky-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                    {fabric.currency === "TRY" || fabric.currency === "TL" ? "₺ TL" : "$ USD"}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-black text-slate-800 mt-1">{fabric.item_name}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">{language === "TR" ? "Fiziksel Renk Varyantları Arşivi" : language === "AR" ? "أرشيف متغيرات الألوان الفيزيائية" : "Physical Color Variants Archive"}</p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">{t.totalRemaining}</span>
              <span className={`text-base font-black ${totalRemaining <= 5 ? "text-rose-600" : "text-emerald-600"}`}>
                {totalRemaining.toFixed(1)} {fabric.unit}
              </span>
            </div>
          </div>

          {/* Unit Price & Total Cost info bar if present */}
          {(fabric.unit_price || 0) > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="bg-slate-50 p-2.5 rounded-2xl flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-500">Metre Başı Alış Fiyatı</span>
                <span className="text-xs font-black font-mono text-slate-800">
                  {fabric.currency === "TRY" || fabric.currency === "TL" ? `${fabric.unit_price?.toFixed(2)} ₺` : `$${fabric.unit_price?.toFixed(2)}`}
                  <span className="text-[9px] text-slate-400 font-normal ml-1">/{fabric.unit}</span>
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-2xl flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Toplam Gelen Kumaş Maliyeti ({totalGelen.toFixed(1)} {fabric.unit})
                </span>
                <span className="text-xs font-black font-mono text-slate-800">
                  {fabric.currency === "TRY" || fabric.currency === "TL" 
                    ? `${totalFabricCost.toFixed(2)} ₺` 
                    : `$${totalFabricCost.toFixed(2)}`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* METRAJAR ARCHIVE GRID TOTAL SUMMARY */}
        <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-md grid grid-cols-3 gap-2 text-center shrink-0">
          <div>
            <span className="text-[8px] text-slate-400 uppercase font-bold block">{t.totalIncoming}</span>
            <span className="text-sm font-black font-mono">{totalGelen.toFixed(1)} {fabric.unit}</span>
          </div>
          <div>
            <span className="text-[8px] text-slate-400 uppercase font-bold block">{t.totalCut}</span>
            <span className="text-sm font-black font-mono">{totalKesilen.toFixed(1)} {fabric.unit}</span>
          </div>
          <div>
            <span className="text-[8px] text-slate-400 uppercase font-bold block">{language === "TR" ? "Net Stok" : language === "AR" ? "صافي المخزون" : "Net Stock"}</span>
            <span className="text-sm font-black font-mono text-indigo-300">{totalRemaining.toFixed(1)} {fabric.unit}</span>
          </div>
        </div>

        {/* COMPONENT: MULTI-COLOR IMAGE ARCHIVE & UPLOAD UTILITY */}
        {userRole !== "client" && (
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Kumaş Renk Galeri Paneli</h4>
                <p className="text-[9px] text-slate-400">Yeni bir fiziksel renk varyantı ve görseli tanımlayın</p>
              </div>

              <button
                id="add-fabric-color-btn"
                onClick={() => setShowAddColorForm(!showAddColorForm)}
                className="flex items-center gap-1 text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-xl transition-all"
              >
                <Plus className="h-3 w-3" />
                <span>Renk Tanımla</span>
              </button>
            </div>

            {showAddColorForm && (
              <form onSubmit={handleAddColorArchiveLocal} className="space-y-3 mt-2 border-t border-slate-50 pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400">Renk Adı / Kodu</label>
                    <input 
                      type="text" 
                      placeholder="Örn: Zümrüt Yeşili, L-21"
                      value={newColorName}
                      onChange={(e) => setNewColorName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400">Gelen Başlangıç (Mt)</label>
                    <input 
                      type="number" 
                      value={newColorIncoming}
                      onChange={(e) => setNewColorIncoming(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400">Kesilen Başlangıç (Mt)</label>
                    <input 
                      type="number" 
                      value={newColorCut}
                      onChange={(e) => setNewColorCut(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span>Eklenme Tarihi</span>
                    </label>
                    <input 
                      type="date"
                      value={newColorDate}
                      onChange={(e) => setNewColorDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-700"
                    />
                  </div>
                </div>

                {/* VISUAL FILE UPLOAD COMPONENT FOR IMAGE PER COLOR */}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Kumaş Renk Fotoğrafı Yükle</label>
                  
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all relative ${
                      dragActive 
                        ? "border-indigo-600 bg-indigo-50/50" 
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    {filePreview ? (
                      <div className="flex flex-col items-center gap-2">
                        <img 
                          src={filePreview} 
                          alt="Önizleme" 
                          className="w-16 h-16 rounded-xl object-cover border border-slate-100 shadow-xs"
                        />
                        <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1">
                          ✓ Görsel Yüklendi (Resmi Değiştirmek için Tıklayın veya Sürükleyin)
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 py-2">
                        <Upload className="h-5 w-5 text-slate-400" />
                        <p className="text-[10px] font-bold text-slate-600">Sürükle & Bırak veya Tıkla</p>
                        <p className="text-[8px] text-slate-400">PNG, JPG, JPEG (Maks. 5MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* MANDATORY INDIVIDUAL IMAGE FILE URL FALLBACK */}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Kumaş Renk Doku Fotoğrafı (Alternatif URL)</label>
                  <input 
                    type="url" 
                    placeholder="https://images.unsplash.com/photo-..."
                    value={newColorImgUrl}
                    onChange={(e) => {
                      setNewColorImgUrl(e.target.value);
                      if (e.target.value.trim().startsWith("http")) {
                        setFilePreview(e.target.value.trim());
                      } else {
                        setFilePreview(null);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-xl transition-colors mt-1"
                >
                  Renk Varyantını Kaydet
                </button>
              </form>
            )}
          </div>
        )}

        {/* REFINED GALLERIA GRID SECTION */}
        <div className="space-y-3" id="fabric-color-gallery">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Kumaş Renk Galerisi (Gallery)</h4>
            <span className="text-[9px] text-slate-400 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded-lg">
              {modelColorArchives.length} Renk
            </span>
          </div>

          {modelColorArchives.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-3xl border border-slate-100 text-xs text-slate-400">
              Bu kumaşa tanımlanmış görsel/renk bulunmuyor. Lütfen üstteki panelden ekleyin.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5">
              {modelColorArchives.map((archive) => {
                const variantRemaining = archive.incoming - archive.cut;
                return (
                  <div 
                    key={archive.id} 
                    id={`gallery-item-${archive.id}`}
                    className="bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-48 relative group"
                  >
                    {/* Gallery Image Container */}
                    <div className="h-28 bg-slate-50 overflow-hidden relative shrink-0">
                      <img 
                        src={archive.image_url} 
                        alt={archive.color} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />

                      {/* Delete image overlay */}
                      {(userRole === "admin" || userRole === "master_admin") && (
                        <button
                          id={`delete-gallery-img-${archive.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`${archive.color} rengini ve görselini silmek istiyor musunuz?`)) {
                              onRemoveColorArchive(archive.id);
                            }
                          }}
                          className="absolute top-2 right-2 bg-slate-900/60 hover:bg-rose-600 text-white p-1.5 rounded-full backdrop-blur-xs transition-colors"
                          title="Görseli Sil"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}

                      {/* Stock overlay badge */}
                      <span className={`absolute bottom-2 left-2 text-[8px] font-black px-1.5 py-0.5 rounded uppercase shadow-xs ${
                        variantRemaining <= 5 ? "bg-rose-600 text-white animate-pulse" : "bg-slate-900/80 text-white"
                      }`}>
                        {variantRemaining.toFixed(0)} {fabric.unit} Kalan
                      </span>
                    </div>

                    {/* Gallery Card Footer Details */}
                    <div className="p-2.5 flex-1 flex flex-col justify-between bg-white">
                      <div>
                        <h5 className="text-[10px] font-black text-slate-800 line-clamp-1 leading-tight">
                          {archive.color}
                        </h5>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <p className="text-[8px] text-slate-400 font-mono">ID: {archive.id.slice(0, 8)}</p>
                          {(archive.date || archive.created_at) && (
                            <span className="text-[7px] text-slate-500 font-mono font-bold bg-slate-50 px-1 py-0.2 rounded border border-slate-150">
                              📅 {archive.date || (archive.created_at ? archive.created_at.split('T')[0] : '')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-1.5 border-t border-slate-50 mt-1">
                        <div>
                          <span className="text-[7px] text-slate-400 uppercase font-black block">Gelen</span>
                          <span className="text-[9px] font-black font-mono text-slate-700">{archive.incoming}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[7px] text-slate-400 uppercase font-black block">Kesilen</span>
                          <span className="text-[9px] font-black font-mono text-slate-700">{archive.cut}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* LIST OF REGISTERED COLOR ARCHIVES WITH METERS INCREMENTER */}
        <div className="space-y-3">
          <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Fiziksel Metraj Düzenleme Paneli</h4>
          
          {modelColorArchives.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-3xl border border-slate-100 text-xs text-slate-400">
              Bu kumaşa tanımlanmış renk varyantı bulunmuyor.
            </div>
          ) : (
            <div className="space-y-3">
              {modelColorArchives.map((archive) => {
                const variantRemaining = archive.incoming - archive.cut;
                return (
                  <div key={archive.id} className="bg-white p-3.5 rounded-3xl border border-slate-100 shadow-xs space-y-3">
                    
                    {/* Header: Color Image + Name & Remaining on top */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          <img 
                            src={archive.image_url} 
                            alt={archive.color} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800">{archive.color}</h5>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <p className="text-[9px] text-slate-400 font-mono">ID: {archive.id.slice(0, 8)}</p>
                            {(archive.date || archive.created_at) && (
                              <span className="text-[8px] text-slate-500 font-mono font-bold bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200">
                                📅 {archive.date || (archive.created_at ? archive.created_at.split('T')[0] : '')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-[8px] uppercase font-bold text-slate-400 block">Kalan Ölçü</span>
                          <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg inline-block ${
                            variantRemaining <= 5 
                              ? "bg-rose-50 text-rose-700 border border-rose-200" 
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            {variantRemaining.toFixed(1)} {fabric.unit}
                          </span>
                        </div>
                        
                        {(userRole === "admin" || userRole === "master_admin") && (
                          <button
                            onClick={() => onRemoveColorArchive(archive.id)}
                            className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* DIRECT CLEAN NUMERIC INPUTS (NO +/- STEPPERS) */}
                    <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-slate-100">
                      
                      {/* Gelen Metraj Input */}
                      <div className="bg-slate-50 p-2.5 rounded-2xl space-y-1">
                        <label className="text-[9px] text-slate-500 uppercase font-black tracking-wide block">
                          Gelen Metraj ({fabric.unit})
                        </label>
                        <input
                          id={`incoming-input-${archive.id}`}
                          type="number"
                          step="0.1"
                          min="0"
                          disabled={userRole === "client"}
                          value={archive.incoming}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            const safeVal = isNaN(val) ? 0 : Math.max(0, val);
                            if (onUpdateArchiveMeters) {
                              onUpdateArchiveMeters(archive.id, safeVal, archive.cut);
                            } else {
                              onAdjustMeters(archive.id, "incoming", safeVal - archive.incoming);
                            }
                          }}
                          className="w-full bg-white border border-slate-250 focus:border-indigo-500 rounded-xl px-2.5 py-1.5 text-xs font-black font-mono text-slate-800 disabled:opacity-60 transition-colors text-center"
                        />
                      </div>

                      {/* Kesilen Metraj Input */}
                      <div className="bg-slate-50 p-2.5 rounded-2xl space-y-1">
                        <label className="text-[9px] text-slate-500 uppercase font-black tracking-wide block">
                          Kesilen Metraj ({fabric.unit})
                        </label>
                        <input
                          id={`cut-input-${archive.id}`}
                          type="number"
                          step="0.1"
                          min="0"
                          disabled={userRole === "client"}
                          value={archive.cut}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            const safeVal = isNaN(val) ? 0 : Math.max(0, val);
                            if (onUpdateArchiveMeters) {
                              onUpdateArchiveMeters(archive.id, archive.incoming, safeVal);
                            } else {
                              onAdjustMeters(archive.id, "cut", safeVal - archive.cut);
                            }
                          }}
                          className="w-full bg-white border border-slate-250 focus:border-indigo-500 rounded-xl px-2.5 py-1.5 text-xs font-black font-mono text-slate-800 disabled:opacity-60 transition-colors text-center"
                        />
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}
