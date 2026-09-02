import React, { useState } from "react";
import { DollarSign, ChevronRight, TrendingUp, Plus, Trash2, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FinancialsItem, FinancialTransaction, InventoryItem, FashionModel, CustomCostLine, BomItem } from "../types";
import { Language, TranslationDictionary } from "../translations";

interface FinancialsTabProps {
  userRole: string;
  financials: FinancialsItem[];
  transactions: FinancialTransaction[];
  inventory: InventoryItem[];
  models: FashionModel[];
  customCostLines: CustomCostLine[];
  bomItems: BomItem[];
  onSelectCompany: (name: string) => void;
  onAddCompany?: (name: string, type: "Müşteri" | "Tedarikçi", balance: number, currency: string) => void;
  onDeleteCompany?: (id: string, name: string) => void;
  t: TranslationDictionary;
  language: Language;
}

export default function FinancialsTab({
  userRole,
  financials,
  transactions,
  inventory,
  models,
  customCostLines,
  bomItems,
  onSelectCompany,
  onAddCompany,
  onDeleteCompany,
  t,
  language
}: FinancialsTabProps) {
  const [companyToDelete, setCompanyToDelete] = useState<FinancialsItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompanyType, setNewCompanyType] = useState<"Müşteri" | "Tedarikçi">("Müşteri");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyBalance, setNewCompanyBalance] = useState("");
  const [newCompanyCurrency, setNewCompanyCurrency] = useState("USD");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    
    if (onAddCompany) {
      onAddCompany(
        newCompanyName.trim(), 
        newCompanyType, 
        parseFloat(newCompanyBalance) || 0,
        newCompanyCurrency
      );
    }
    
    setNewCompanyName("");
    setNewCompanyBalance("");
    setShowAddForm(false);
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportFinancialsPdf = async () => {
    setIsExporting(true);
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
      
      const title = language === "TR" ? "TOPLU CARI VE FINANS RAPORU" : language === "AR" ? "التقرير المالي وحسابات العملاء المجمع" : "BULK FINANCIAL & CARI REPORT";
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

      const tableData = financials.map(f => {
        // Calculate totals for each company
        const companyTxs = transactions.filter(t => t.customer_name === f.customer_name);
        const companyModels = models.filter(m => m.customer_name === f.customer_name);
        
        let totalValuation = 0;
        companyModels.forEach((model) => {
          const modelBoms = bomItems.filter(b => b.model_id === model.id);
          const materialCost = modelBoms.reduce((sum, b) => sum + (b.consumption * b.unit_cost), 0);
          const laborCost = model.labor_cost || 0;
          const overheadCost = customCostLines.filter(c => c.model_id === model.id).reduce((sum, c) => sum + c.cost, 0);
          const totalUnitCost = materialCost + laborCost + overheadCost;
          
          const modelStock = inventory.filter(i => i.model_id === model.id).reduce((sum, i) => sum + i.stock_count, 0);
          totalValuation += modelStock * totalUnitCost;
        });

        const totalPaymentsReceived = companyTxs
          .filter(t => t.doc_type === "Payment Incoming Log")
          .reduce((sum, t) => sum + t.amount, 0);
          
        const initialOwedToUs = companyTxs
          .filter(t => t.doc_type === "Invoice Issued")
          .reduce((sum, t) => sum + t.amount, 0);
          
        const totalPaymentsMade = companyTxs
          .filter(t => t.doc_type === "Payment Outgoing Log" || t.doc_type === "Payment Outgoing")
          .reduce((sum, t) => sum + t.amount, 0);
          
        const initialOwedByUs = companyTxs
          .filter(t => t.doc_type === "Purchase Invoice")
          .reduce((sum, t) => sum + t.amount, 0);

        const netOutstanding = f.company_type === "Tedarikçi" 
          ? (initialOwedByUs - totalPaymentsMade)
          : (totalValuation + initialOwedToUs - totalPaymentsReceived);
          
        let totalReceivables = f.company_type === "Tedarikçi" ? initialOwedByUs : (totalValuation + initialOwedToUs);
        let totalCollected = f.company_type === "Tedarikçi" ? totalPaymentsMade : totalPaymentsReceived;
        let balance = netOutstanding;

        return [
          f.customer_name,
          f.company_type || "-",
          `${totalReceivables.toFixed(2)} ${f.currency || "USD"}`,
          `${totalCollected.toFixed(2)} ${f.currency || "USD"}`,
          `${balance.toFixed(2)} ${f.currency || "USD"}`
        ];
      });

      autoTable(doc, {
        startY: 30,
        head: [[
          language === "TR" ? "Firma / Şahıs" : language === "AR" ? "الشركة / الشخص" : "Company / Person",
          language === "TR" ? "Tip" : language === "AR" ? "النوع" : "Type",
          language === "TR" ? "Top. Alacak" : language === "AR" ? "إجمالي المستحقات" : "Total Recv.",
          language === "TR" ? "Tahsil Edilen" : language === "AR" ? "المحصل" : "Collected",
          language === "TR" ? "Kalan Bakiye" : language === "AR" ? "الرصيد المتبقي" : "Balance"
        ]],
        body: tableData,
        styles: { font: hasAmiri ? "Amiri" : "helvetica", fontSize: 9 },
        headStyles: { fillColor: [79, 70, 229] },
        theme: 'grid'
      });

      doc.save(`Finans_Raporu_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (e: any) {
      console.error("PDF generation failed:", e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div id="financials-tab" className="space-y-4">
      
      {/* Header Plate */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-slate-800 leading-tight">{t.financialsTitle}</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">{t.financialsDesc}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {userRole !== "client" && (
            <button
              onClick={handleExportFinancialsPdf}
              disabled={isExporting}
              className="flex items-center gap-1.5 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-[10px] font-black px-3 py-2 rounded-xl transition-all disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {isExporting 
                  ? (language === "TR" ? "Hazırlanıyor..." : language === "AR" ? "جاري التحضير..." : "Exporting...") 
                  : (language === "TR" ? "PDF İndir" : language === "AR" ? "تصدير PDF" : "Export PDF")}
              </span>
            </button>
          )}
          {(userRole === "admin" || userRole === "master_admin") && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1 text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{language === "TR" ? "Yeni Cari Hesap Ekle" : language === "AR" ? "إضافة حساب جاري جديد" : "Add Current Account"}</span>
            </button>
          )}
        </div>
      </div>

      {/* YENİ CARİ HESAP EKLE FORMU */}
      {showAddForm && (userRole === "admin" || userRole === "master_admin") && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2">
          <h3 className="text-xs font-bold text-slate-800">Yeni Cari Hesap Ekle</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold text-slate-400">Cari Tipi</label>
              <select 
                value={newCompanyType}
                onChange={(e) => setNewCompanyType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-xs font-bold focus:outline-none focus:border-indigo-500"
              >
                <option value="Müşteri">Müşteri (Alıcı)</option>
                <option value="Tedarikçi">Tedarikçi (Satıcı)</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold text-slate-400">Firma / Şahıs Adı</label>
              <input 
                type="text" 
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Örn: Acme Corp."
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>
          
          <div className="space-y-1.5 pt-1">
            <label className="text-[9px] uppercase font-bold text-slate-400">
              {newCompanyType === "Müşteri" 
                ? "MÜŞTERİNİN BİZE BORCU / ALACAĞIMIZ (USD / TRY)" 
                : "TEDARİKÇİYE OLAN BORCUMUZ (USD / TRY)"}
            </label>
            <div className="flex gap-2">
              <input 
                type="number" 
                step="0.01"
                value={newCompanyBalance}
                onChange={(e) => setNewCompanyBalance(e.target.value)}
                placeholder="0.00"
                className={`w-full bg-slate-50 border rounded-xl px-2.5 py-2 text-xs font-black font-mono focus:outline-none ${
                  newCompanyType === "Müşteri" 
                    ? "border-emerald-100 text-emerald-600 focus:border-emerald-500" 
                    : "border-rose-100 text-rose-600 focus:border-rose-500"
                }`}
              />
              <select 
                value={newCompanyCurrency}
                onChange={(e) => setNewCompanyCurrency(e.target.value)}
                className="w-24 bg-slate-50 border border-slate-100 rounded-xl px-2 py-2 text-xs font-bold focus:outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="TRY">TRY (₺)</option>
              </select>
            </div>
            {newCompanyBalance && parseFloat(newCompanyBalance) > 0 && (
              <p className={`text-[10px] font-bold ${newCompanyType === "Müşteri" ? "text-emerald-600" : "text-rose-600"}`}>
                {newCompanyType === "Müşteri" ? "Biz Alacaklıyız:" : "Tedarikçiye Borçluyuz:"} {newCompanyBalance} {newCompanyCurrency}
              </p>
            )}
          </div>
          
          <div className="pt-2 flex justify-end">
            <button 
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-4 rounded-xl transition-colors shadow-sm"
            >
              Cari Hesabı Kaydet
            </button>
          </div>
        </form>
      )}

      {/* COMPANIES LIST */}
      <div className="space-y-2.5" id="financials-list">
        {financials.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-3xl text-xs text-slate-400 font-medium">
            {language === "TR" ? "Kayıtlı cari hesap firması bulunmuyor." : language === "AR" ? "لا توجد شركات حسابات جارية مسجلة." : "No current account companies registered."}
          </div>
        ) : (
          financials.map((company) => {
            // Live math recalculation per company
            const companyTxs = transactions.filter(t => t.customer_name === company.customer_name);
            const companyModels = models.filter(m => m.customer_name === company.customer_name);
            
            let totalValuation = 0;
            companyModels.forEach((model) => {
              const modelBoms = bomItems.filter(b => b.model_id === model.id);
              const materialCost = modelBoms.reduce((sum, b) => sum + (b.consumption * b.unit_cost), 0);
              const laborCost = model.labor_cost || 0;
              const overheadCost = customCostLines.filter(c => c.model_id === model.id).reduce((sum, c) => sum + c.cost, 0);
              const totalUnitCost = materialCost + laborCost + overheadCost;
              
              const modelStock = inventory.filter(i => i.model_id === model.id).reduce((sum, i) => sum + i.stock_count, 0);
              totalValuation += modelStock * totalUnitCost;
            });

            // "Purchase Invoice" usually means supplier sent us goods (we owe them)
            // "Invoice Issued" means we sent goods/service (they owe us)
            // "Payment Incoming Log" means customer paid us
            // "Payment Outgoing" means we paid supplier
            
            const totalPaymentsReceived = companyTxs
              .filter(t => t.doc_type === "Payment Incoming Log")
              .reduce((sum, t) => sum + t.amount, 0);
              
            const initialOwedToUs = companyTxs
              .filter(t => t.doc_type === "Invoice Issued")
              .reduce((sum, t) => sum + t.amount, 0);
              
            const totalPaymentsMade = companyTxs
              .filter(t => t.doc_type === "Payment Outgoing Log" || t.doc_type === "Payment Outgoing")
              .reduce((sum, t) => sum + t.amount, 0);
              
            const initialOwedByUs = companyTxs
              .filter(t => t.doc_type === "Purchase Invoice")
              .reduce((sum, t) => sum + t.amount, 0);

            const netOutstanding = company.company_type === "Tedarikçi" 
              ? (initialOwedByUs - totalPaymentsMade)
              : (totalValuation + initialOwedToUs - totalPaymentsReceived);

            return (
              <div
                key={company.id}
                id={`company-row-${company.id}`}
                onClick={() => onSelectCompany(company.customer_name)}
                className="bg-white p-4 rounded-3xl border border-slate-100 hover:border-indigo-100 shadow-xs hover:shadow-md transition-all active:scale-99 cursor-pointer flex items-center justify-between gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-155"
              >
                {/* Brand Logo & Details */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${company.company_type === "Tedarikçi" ? "bg-rose-50 text-rose-600 group-hover:bg-rose-100" : "bg-indigo-50 text-indigo-700 group-hover:bg-indigo-100"}`}>
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight">
                      {company.customer_name}
                    </h4>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      <span className={`px-1.5 py-0.5 rounded mr-1 ${company.company_type === "Tedarikçi" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                        {company.company_type || "Müşteri"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Account balance summary, Delete Action & Chevron */}
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[8px] text-slate-400 uppercase font-black block">
                      {company.company_type === "Tedarikçi" ? "Kalan Borç" : "Kalan Alacak"}
                    </span>
                    <span className={`text-[11px] font-black font-mono ${company.company_type === "Tedarikçi" ? "text-rose-600" : (netOutstanding > 0 ? "text-indigo-600" : "text-emerald-600")}`}>
                      ${netOutstanding.toFixed(0)}
                    </span>
                  </div>

                  {/* Delete Company Button (Admin only) */}
                  {(userRole === "admin" || userRole === "master_admin") && onDeleteCompany && (
                    <button
                      id={`delete-company-${company.id}`}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCompanyToDelete(company);
                      }}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-90 transition-all cursor-pointer z-10 shrink-0 group/del"
                      title={language === "TR" ? "Cari Hesabı Sil" : language === "AR" ? "حذف الحساب الجاري" : "Delete Account"}
                    >
                      <Trash2 className="h-4 w-4 group-hover/del:scale-110 transition-transform" />
                    </button>
                  )}

                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 transition-colors shrink-0" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Interactive Delete Company Confirmation Modal */}
      {companyToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          onClick={() => setCompanyToDelete(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-inner">
              <Trash2 className="w-7 h-7 stroke-[2.2px]" />
            </div>

            {/* Title & Info */}
            <div className="space-y-1.5 w-full">
              <h3 className="text-sm font-black text-slate-900">
                {language === "TR" ? "Cari Hesabı Silmek İstediğinize Emin Misiniz?" : language === "AR" ? "هل أنت متأكد من حذف هذا الحساب الجاري؟" : "Are you sure you want to delete this account?"}
              </h3>
              <div className="flex items-center justify-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100 my-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${companyToDelete.company_type === "Tedarikçi" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                  {companyToDelete.company_type || "Müşteri"}
                </span>
                <span className="text-xs font-bold text-slate-800 truncate max-w-[180px]">
                  {companyToDelete.customer_name}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed px-1">
                {language === "TR" 
                  ? "Bu cari hesaba ait tüm yevmiye hareketleri ve ekstre kayıtları kalıcı olarak sistemden silinecektir." 
                  : language === "AR"
                  ? "سيتم حذف جميع قيود اليومية وحركات كشف الحساب المرتبطة بهذا الحساب بشكل دائم."
                  : "All journal entries and statement transactions associated with this current account will be permanently deleted."}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 w-full pt-1">
              <button
                type="button"
                onClick={() => setCompanyToDelete(null)}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
              >
                {language === "TR" ? "Vazgeç" : language === "AR" ? "إلغاء" : "Cancel"}
              </button>
              <button
                id="confirm-delete-company-btn"
                type="button"
                onClick={() => {
                  if (onDeleteCompany) {
                    const comp = companyToDelete;
                    setCompanyToDelete(null);
                    onDeleteCompany(comp.id, comp.customer_name);
                  }
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
