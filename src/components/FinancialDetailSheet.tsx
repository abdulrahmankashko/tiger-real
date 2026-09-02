import React, { useState } from "react";
import { ArrowLeft, Plus, Trash2, Download, DollarSign, Calendar, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
// @ts-ignore
import reshaper from "arabic-persian-reshaper";
import { FinancialTransaction, InventoryItem, FashionModel, CustomCostLine, BomItem } from "../types";
import { Language, TranslationDictionary } from "../translations";

const pdfTranslations = {
  TR: {
    title: "CARI HESAP EKSTRESI / ACCOUNT STATEMENT LEDGER",
    date: "Tarih",
    page: "Sayfa",
    companyTitle: "Firma Unvani",
    summaryTitle: "CARI BAKIYE OZETI (SUMMARY METRICS)",
    manufacturedGoods: "Mamul Cari Degeri",
    receivedCash: "Alinan Toplam Odeme",
    outstandingBalance: "Kalan Net Alacak",
    journalTitle: "CARI HAREKET DOKUMU (TRANSACTION JOURNAL REGISTER)",
    colDate: "Islem Tarihi",
    colDocType: "Evrak / Islem Tipi",
    colDocNo: "Evrak No",
    colAmount: "Tutar (USD)",
    colTxType: "Hareket Tipi",
    colStatus: "Mutabakat Durumu",
    invoiceDoc: "Satis Faturasi (Invoice)",
    paymentDoc: "Tahsilat Makbuzu (Incoming Log)",
    debitType: "BORC",
    creditType: "ALACAK",
    settledStatus: "Mutabik (Settled)",
    pendingStatus: "Beklemede (Pending)",
    accountingApproval: "Muhasebe Onayi / Finans Departmani",
    customerSignature: "Musteri Temsilcisi Imza",
    monthlySummaryTitle: "AYLIK HAREKET OZETI (MONTHLY TRANSACTION SUMMARY)",
    colMonth: "Donem / Ay",
    colTotalDebits: "Toplam Borc (Debit)",
    colTotalCredits: "Toplam Alacak (Credit)",
    colNetChange: "Net Degisim"
  },
  EN: {
    title: "CURRENT ACCOUNT STATEMENT LEDGER",
    date: "Date",
    page: "Page",
    companyTitle: "Company Title",
    summaryTitle: "CURRENT ACCOUNT SUMMARY METRICS",
    manufacturedGoods: "Manufactured Goods Value",
    receivedCash: "Total Received Payments",
    outstandingBalance: "Outstanding Net Balance",
    journalTitle: "TRANSACTION JOURNAL REGISTER",
    colDate: "Tx Date",
    colDocType: "Document / Transaction Type",
    colDocNo: "Doc No",
    colAmount: "Amount (USD)",
    colTxType: "Entry Type",
    colStatus: "Reconciliation Status",
    invoiceDoc: "Sales Invoice (Invoice Issued)",
    paymentDoc: "Collection Receipt (Incoming Payment)",
    debitType: "DEBIT",
    creditType: "CREDIT",
    settledStatus: "Reconciled (Settled)",
    pendingStatus: "Awaiting (Pending)",
    accountingApproval: "Accounting Approval / Finance Department",
    customerSignature: "Customer Representative Signature",
    monthlySummaryTitle: "MONTHLY TRANSACTION SUMMARY",
    colMonth: "Period / Month",
    colTotalDebits: "Total Debits",
    colTotalCredits: "Total Credits",
    colNetChange: "Net Change"
  },
  AR: {
    title: "كشف حساب جاري تفصيلي / ذمم الماركات والعملاء",
    date: "تاريخ السند",
    page: "الصفحة",
    companyTitle: "العميل (الشركة)",
    summaryTitle: "كشف الرصيد المالي الإجمالي للحساب",
    manufacturedGoods: "قيمة فواتير بضاعة موديلاتنا المصنعة",
    receivedCash: "المبالغ والمسددات المقبوضة",
    outstandingBalance: "المتبقي الصافي بذمة العميل",
    journalTitle: "تفصيل حركات الحساب الجاري الدائن والمدين",
    colDate: "التاريخ",
    colDocType: "بيان السند",
    colDocNo: "رقم السند",
    colAmount: "قيمة السند ($)",
    colTxType: "طبيعة السند",
    colStatus: "حالة السند",
    invoiceDoc: "فاتورة مبيعات مصنعة",
    paymentDoc: "سند قبض نقدي",
    debitType: "له (مدين)",
    creditType: "عليه (دائن)",
    settledStatus: "مقفل / مسدد",
    pendingStatus: "معلق / غير مسوى",
    accountingApproval: "توقيع رئيس الحسابات والمدير المالي",
    customerSignature: "توقيع المستلم المفوض",
    monthlySummaryTitle: "الملخص المالي الشهري لحركات الحساب",
    colMonth: "الفترة / الشهر",
    colTotalDebits: "مجموع حركات له (مدين)",
    colTotalCredits: "مجموع حركات عليه (دائن)",
    colNetChange: "الصافي الشهري"
  }
};

interface FinancialDetailSheetProps {
  companyName: string;
  companyId?: string;
  companyType?: "Müşteri" | "Tedarikçi";
  userRole: string;
  transactions: FinancialTransaction[];
  inventory: InventoryItem[];
  models: FashionModel[];
  customCostLines: CustomCostLine[];
  bomItems: BomItem[];
  onClose: () => void;
  onAddTransaction: (date: string, docType: string, amount: number, status: "Settled" | "Pending", modelId?: string) => void;
  onRemoveTransaction: (id: string) => void;
  onDeleteCompany?: (id: string, name: string) => void;
  triggerToast: (msg: string, type?: "success" | "error" | "info") => void;
  t: TranslationDictionary;
  language: Language;
  isInline?: boolean;
}

export default function FinancialDetailSheet({
  companyName,
  companyId,
  companyType = "Müşteri",
  userRole,
  transactions,
  inventory,
  models,
  customCostLines,
  bomItems,
  onClose,
  onAddTransaction,
  onRemoveTransaction,
  onDeleteCompany,
  triggerToast,
  t,
  language,
  isInline = false
}: FinancialDetailSheetProps) {

  const [showDeleteModal, setShowDeleteModal] = useState(false);


  // Form states
  const [isDownloadingFont, setIsDownloadingFont] = useState(false);
  const [showAddTxForm, setShowAddTxForm] = useState(false);
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [txDocType, setTxDocType] = useState<string>(companyType === "Müşteri" ? "Invoice Issued" : "Purchase Invoice");
  const [txAmount, setTxAmount] = useState("");
  const [txStatus, setTxStatus] = useState<"Settled" | "Pending">("Settled");
  const [txModelId, setTxModelId] = useState("");

  // Date range filter states
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Filter transactions for this specific company
  const companyTxs = transactions.filter(t => t.customer_name === companyName);

  // Filter based on the selected date range
  const filteredTxs = companyTxs.filter(t => {
    if (startDate && t.date < startDate) return false;
    if (endDate && t.date > endDate) return false;
    return true;
  });

  // Preset range setter helper
  const setPresetRange = (preset: "this-month" | "last-30-days" | "this-year" | "all") => {
    const today = new Date();
    
    const formatDateLocal = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    let start = "";
    let end = formatDateLocal(today);

    if (preset === "this-month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      start = formatDateLocal(firstDay);
    } else if (preset === "last-30-days") {
      const priorDate = new Date();
      priorDate.setDate(today.getDate() - 30);
      start = formatDateLocal(priorDate);
    } else if (preset === "this-year") {
      const firstDay = new Date(today.getFullYear(), 0, 1);
      start = formatDateLocal(firstDay);
    } else {
      start = "";
      end = "";
    }

    setStartDate(start);
    setEndDate(end);
    
    const rangeText = preset === "this-month" ? (language === "TR" ? "Bu Ay" : language === "AR" ? "هذا الشهر" : "This Month")
                    : preset === "last-30-days" ? (language === "TR" ? "Son 30 Gün" : language === "AR" ? "آخر 30 يومًا" : "Last 30 Days")
                    : preset === "this-year" ? (language === "TR" ? "Bu Yıl" : language === "AR" ? "هذه السنة" : "This Year")
                    : (language === "TR" ? "Tüm Zamanlar" : language === "AR" ? "كل الأوقات" : "All Time");
                    
    triggerToast(
      language === "TR" 
        ? `${rangeText} filtresi uygulandı.` 
        : language === "AR" 
          ? `تم تطبيق تصفية ${rangeText}.` 
          : `${rangeText} filter applied.`, 
      "info"
    );
  };

  // Math calculation: Valuation of Manufactured Goods
  // Valuation = Sum of (Model Inventory Stock Count * Model Unit Cost)
  const companyModels = models.filter(m => m.customer_name === companyName);
  
  let totalValuation = 0;
  
  if (companyType === "Müşteri") {
    companyModels.forEach((model) => {
      // 1. Calculate Unit Cost
      const modelBoms = bomItems.filter(b => b.model_id === model.id);
      const materialCost = modelBoms.reduce((sum, b) => sum + (b.consumption * b.unit_cost), 0);
      const laborCost = model.labor_cost || 0;
      const overheadCost = customCostLines.filter(c => c.model_id === model.id).reduce((sum, c) => sum + c.cost, 0);
      const totalUnitCost = materialCost + laborCost + overheadCost;

      // 2. Calculate Total Stocks
      const modelStock = inventory.filter(i => i.model_id === model.id).reduce((sum, i) => sum + i.stock_count, 0);

      totalValuation += modelStock * totalUnitCost;
    });
  }

  const initialOwedToUs = filteredTxs
    .filter(t => t.doc_type === "Invoice Issued")
    .reduce((sum, t) => sum + t.amount, 0);

  const initialOwedByUs = filteredTxs
    .filter(t => t.doc_type === "Purchase Invoice")
    .reduce((sum, t) => sum + t.amount, 0);
    
  // Payments received: Sum of Payments where status is Settled (or all Payment Incoming logs)
  const totalPaymentsReceived = filteredTxs
    .filter(t => t.doc_type === "Payment Incoming Log")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPaymentsMade = filteredTxs
    .filter(t => t.doc_type === "Payment Outgoing Log" || t.doc_type === "Payment Outgoing")
    .reduce((sum, t) => sum + t.amount, 0);

  // Outstanding Account Balance = Total Valuation - Total Payments Received
  const netOutstanding = companyType === "Tedarikçi"
    ? (initialOwedByUs - totalPaymentsMade)
    : (totalValuation + initialOwedToUs - totalPaymentsReceived);

  const handleAddTxLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(parseFloat(txAmount)) || parseFloat(txAmount) <= 0) {
      triggerToast("Lütfen geçerli bir tutar girin.", "error");
      return;
    }
    const modelIdParam = txDocType === "Invoice Issued" && txModelId ? txModelId : undefined;
    onAddTransaction(txDate, txDocType, parseFloat(txAmount), txStatus, modelIdParam);
    
    // Reset form
    setTxAmount("1000.00");
    setTxStatus("Settled");
    setTxModelId("");
    setShowAddTxForm(false);
  };

  const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("data:image")) return imageUrl;

    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.width || 200;
            canvas.height = img.height || 200;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL("image/png"));
            } else {
              resolve("");
            }
          } catch {
            resolve("");
          }
        };
        img.onerror = () => {
          resolve("");
        };
        img.src = imageUrl;
      } catch {
        resolve("");
      }
    });
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

  const handleGenerateLedgerPdf = async () => {
    setIsDownloadingFont(true);
    
    // Prefetch referenced model images
    const imageCache: { [modelId: string]: string } = {};
    for (const t of filteredTxs) {
      if (t.model_id) {
        const model = models.find(m => m.id === t.model_id);
        if (model?.photo_url && !imageCache[t.model_id]) {
          try {
            const base64 = await getBase64ImageFromUrl(model.photo_url);
            imageCache[t.model_id] = base64;
          } catch (err) {
            console.warn("Failed to prefetch image for PDF:", model.photo_url, err);
          }
        }
      }
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    let fontLoaded = false;
    if (language === "AR") {
      fontLoaded = await loadArabicFont(doc);
    }
    setIsDownloadingFont(false);

    const dict = pdfTranslations[language] || pdfTranslations.EN;

    const now = new Date();
    const formattedDate = now.toLocaleDateString(language === "AR" ? "ar-EG" : language === "TR" ? "tr-TR" : "en-US");
    const formattedTime = now.toLocaleTimeString(language === "AR" ? "ar-EG" : language === "TR" ? "tr-TR" : "en-US");

    // 1. Main Outline
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);
    doc.rect(7, 7, 196, 283);

    // Header Plate
    doc.setFillColor(15, 23, 42);
    doc.rect(7, 7, 196, 12, "F");

    doc.setTextColor(255, 255, 255);
    if (language === "AR" && fontLoaded) {
      doc.setFont("Amiri", "normal");
      doc.setFontSize(9);
      doc.text(fixArabicText(dict.title), 195, 15, { align: "right" });
    } else {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text(cleanText(dict.title), 12, 15);
    }

    if (language === "AR" && fontLoaded) {
      doc.setFont("Amiri", "normal");
      doc.setFontSize(7.5);
      doc.text(fixArabicText(`${dict.date}: ${formattedDate} | ${dict.page}: 1/1`), 12, 15);
    } else {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`${dict.date}: ${formattedDate} | ${dict.page}: 1/1`, 150, 15);
    }

    // Customer/Firm section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);

    let periodText = "";
    if (startDate && endDate) {
      periodText = `${startDate} / ${endDate}`;
    } else if (startDate) {
      periodText = `> ${startDate}`;
    } else if (endDate) {
      periodText = `< ${endDate}`;
    } else {
      periodText = language === "TR" ? "Tüm Zamanlar" : language === "AR" ? "كل الأوقات" : "All Time";
    }

    const reportPeriodLabel = language === "TR" ? "Rapor Dönemi" : language === "AR" ? "فترة التقرير" : "Report Period";

    if (language === "AR" && fontLoaded) {
      doc.setFont("Amiri", "normal");
      doc.text(fixArabicText(`${dict.companyTitle}: ${companyName}`), 195, 26, { align: "right" });
      doc.setFontSize(8.5);
      doc.text(fixArabicText(`${reportPeriodLabel}: ${periodText}`), 12, 26);
    } else {
      doc.setFont("Helvetica", "bold");
      doc.text(cleanText(`${dict.companyTitle}: ${companyName}`), 12, 26);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(cleanText(`${reportPeriodLabel}: ${periodText}`), 195, 26, { align: "right" });
    }
    
    doc.setDrawColor(226, 232, 240);
    doc.line(12, 29, 195, 29);

    // Valuation & Metrics Summary Table
    doc.setFontSize(8);
    if (language === "AR" && fontLoaded) {
      doc.setFont("Amiri", "normal");
      doc.text(fixArabicText(dict.summaryTitle), 195, 34, { align: "right" });
    } else {
      doc.setFont("Helvetica", "bold");
      doc.text(cleanText(dict.summaryTitle), 12, 34);
    }

    const rawHeaders = [
      dict.manufacturedGoods, 
      dict.receivedCash, 
      dict.outstandingBalance
    ];
    const metricsHeaders = [
      language === "AR" 
        ? [...rawHeaders].reverse().map(h => fixArabicText(h)) 
        : rawHeaders.map(h => cleanText(h))
    ];

    const rawMetricsRow = [
      `$ ${totalValuation.toFixed(2)}`,
      `$ ${totalPaymentsReceived.toFixed(2)}`,
      `$ ${netOutstanding.toFixed(2)}`
    ];
    const metricsRows = [
      language === "AR" 
        ? [...rawMetricsRow].reverse().map(cell => fixArabicText(cell)) 
        : rawMetricsRow
    ];

    autoTable(doc, {
      head: metricsHeaders,
      body: metricsRows,
      startY: 37,
      margin: { left: 12, right: 12 },
      styles: { 
        fontSize: 8, 
        font: language === "AR" && fontLoaded ? "Amiri" : "Helvetica", 
        halign: "center" 
      },
      headStyles: { 
        fillColor: [47, 55, 71], 
        textColor: [255, 255, 255], 
        font: language === "AR" && fontLoaded ? "Amiri" : "Helvetica",
        fontStyle: language === "AR" ? "normal" : "bold" 
      },
    });

    let currentY = (doc as any).lastAutoTable.finalY + 8;

    // Monthly Summary Calculation
    const monthlySummaryMap: { [key: string]: { debits: number; credits: number } } = {};
    filteredTxs.forEach((tx) => {
      if (!tx.date) return;
      const monthStr = tx.date.substring(0, 7); // "YYYY-MM"
      if (!monthlySummaryMap[monthStr]) {
        monthlySummaryMap[monthStr] = { debits: 0, credits: 0 };
      }
      if (tx.doc_type === "Invoice Issued") {
        monthlySummaryMap[monthStr].debits += tx.amount;
      } else if (tx.doc_type === "Payment Incoming Log") {
        monthlySummaryMap[monthStr].credits += tx.amount;
      }
    });

    const sortedMonths = Object.keys(monthlySummaryMap).sort();

    const formatMonthName = (monthStr: string) => {
      const [year, month] = monthStr.split("-");
      const monthIndex = parseInt(month, 10) - 1;
      
      const trMonths = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
      const enMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const arMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
      
      if (monthIndex >= 0 && monthIndex < 12) {
        if (language === "TR") return `${trMonths[monthIndex]} ${year}`;
        if (language === "AR") return `${arMonths[monthIndex]} ${year}`;
        return `${enMonths[monthIndex]} ${year}`;
      }
      return monthStr;
    };

    const rawMonthlyHeaders = [
      dict.colMonth,
      dict.colTotalDebits,
      dict.colTotalCredits,
      dict.colNetChange
    ];
    
    const monthlyHeaders = [
      language === "AR"
        ? [...rawMonthlyHeaders].reverse().map(h => fixArabicText(h))
        : rawMonthlyHeaders.map(h => cleanText(h))
    ];

    const monthlyRows = sortedMonths.map((month) => {
      const data = monthlySummaryMap[month];
      const monthLabel = formatMonthName(month);
      const netChange = data.debits - data.credits;
      
      const rawRow = [
        monthLabel,
        `$ ${data.debits.toFixed(2)}`,
        `$ ${data.credits.toFixed(2)}`,
        `${netChange >= 0 ? "+" : ""}$ ${netChange.toFixed(2)}`
      ];

      const cleanedRow = language === "AR"
        ? rawRow.map(cell => fixArabicText(cell))
        : rawRow.map(cell => cleanText(cell));

      return language === "AR" ? cleanedRow.reverse() : cleanedRow;
    });

    // Monthly Summary Section
    if (language === "AR" && fontLoaded) {
      doc.setFont("Amiri", "normal");
      doc.setFontSize(9);
      doc.text(fixArabicText(dict.monthlySummaryTitle), 195, currentY, { align: "right" });
    } else {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.text(cleanText(dict.monthlySummaryTitle), 12, currentY);
    }
    currentY += 3;

    autoTable(doc, {
      head: monthlyHeaders,
      body: monthlyRows,
      startY: currentY,
      margin: { left: 12, right: 12 },
      styles: { 
        fontSize: 7.5, 
        font: language === "AR" && fontLoaded ? "Amiri" : "Helvetica",
        halign: language === "AR" ? "right" : "left"
      },
      headStyles: { 
        fillColor: [71, 85, 105], 
        textColor: [255, 255, 255], 
        font: language === "AR" && fontLoaded ? "Amiri" : "Helvetica",
        fontStyle: language === "AR" ? "normal" : "bold" 
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // Transaction History Table
    if (language === "AR" && fontLoaded) {
      doc.setFont("Amiri", "normal");
      doc.setFontSize(9);
      doc.text(fixArabicText(dict.journalTitle), 195, currentY, { align: "right" });
    } else {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.text(cleanText(dict.journalTitle), 12, currentY);
    }
    currentY += 3;

    const rawTxHeaders = [
      dict.colDate, 
      dict.colDocType, 
      dict.colDocNo, 
      dict.colAmount, 
      dict.colTxType, 
      dict.colStatus
    ];
    const txHeaders = [
      language === "AR" 
        ? [...rawTxHeaders].reverse().map(h => fixArabicText(h)) 
        : rawTxHeaders.map(h => cleanText(h))
    ];

    const txRows = filteredTxs.map((t, idx) => {
      const linkedModel = t.model_id ? models.find((m) => m.id === t.model_id) : undefined;
      
      let docTypeStr = t.doc_type === "Invoice Issued" ? dict.invoiceDoc : dict.paymentDoc;
      if (linkedModel) {
        docTypeStr = `${docTypeStr} - ${linkedModel.name} (${linkedModel.smart_id})`;
      }

      const txTypeStr = t.doc_type === "Invoice Issued" ? dict.debitType : dict.creditType;
      const statusStr = t.status === "Settled" ? dict.settledStatus : dict.pendingStatus;
      
      const rawRow = [
        t.date,
        docTypeStr,
        `TX-${202600 + idx}`,
        `$ ${t.amount.toFixed(2)}`,
        txTypeStr,
        statusStr
      ];

      const cleanedRow = language === "AR"
        ? rawRow.map(cell => fixArabicText(cell))
        : rawRow.map(cell => cleanText(cell));

      return language === "AR" ? cleanedRow.reverse() : cleanedRow;
    });

    autoTable(doc, {
      head: txHeaders,
      body: txRows,
      startY: currentY,
      margin: { left: 12, right: 12 },
      styles: { 
        fontSize: 7, 
        font: language === "AR" && fontLoaded ? "Amiri" : "Helvetica",
        halign: language === "AR" ? "right" : "left",
        valign: "middle"
      },
      headStyles: { 
        fillColor: [15, 23, 42], 
        textColor: [255, 255, 255], 
        font: language === "AR" && fontLoaded ? "Amiri" : "Helvetica",
        fontStyle: language === "AR" ? "normal" : "bold" 
      },
      willDrawCell: (data) => {
        const isDocTypeCol = language === "AR" ? data.column.index === 4 : data.column.index === 1;
        if (isDocTypeCol && data.row.section === "body") {
          const t = filteredTxs[data.row.index];
          if (t && t.model_id && imageCache[t.model_id]) {
            data.cell.styles.minCellHeight = 12;
            if (language === "AR") {
              data.cell.styles.cellPadding = { right: 14, left: 2, top: 2, bottom: 2 };
            } else {
              data.cell.styles.cellPadding = { left: 14, right: 2, top: 2, bottom: 2 };
            }
          }
        }
      },
      didDrawCell: (data) => {
        const isDocTypeCol = language === "AR" ? data.column.index === 4 : data.column.index === 1;
        if (isDocTypeCol && data.row.section === "body") {
          const t = filteredTxs[data.row.index];
          if (t && t.model_id) {
            const base64 = imageCache[t.model_id];
            if (base64) {
              const cell = data.cell;
              const imgSize = 8;
              const yPos = cell.y + (cell.height - imgSize) / 2;
              let xPos = cell.x + 2;
              if (language === "AR") {
                xPos = cell.x + cell.width - imgSize - 2;
              }
              try {
                doc.addImage(base64, "JPEG", xPos, yPos, imgSize, imgSize);
              } catch (imgErr) {
                console.error("Error drawing image in pdf cell:", imgErr);
              }
            }
          }
        }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;

    // Signature Block
    if (language === "AR" && fontLoaded) {
      doc.setFont("Amiri", "normal");
      doc.setFontSize(8.5);
      doc.text(fixArabicText(dict.accountingApproval), 195, currentY, { align: "right" });
      doc.text(fixArabicText(dict.customerSignature), 70, currentY, { align: "right" });
      
      doc.setDrawColor(200, 200, 200);
      doc.line(147, currentY + 15, 195, currentY + 15);
      doc.line(22, currentY + 15, 70, currentY + 15);
    } else {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(cleanText(dict.accountingApproval), 12, currentY);
      doc.text(cleanText(dict.customerSignature), 130, currentY);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(12, currentY + 15, 60, currentY + 15);
      doc.line(130, currentY + 15, 180, currentY + 15);
    }

    const filename = language === "AR" 
      ? `FINANCIAL_LEDGER_${companyName.replace(/\s+/g, "_")}.pdf`
      : `FINANCIAL_LEDGER_${cleanText(companyName).replace(/\s+/g, "_")}.pdf`;

    doc.save(filename);
    triggerToast(language === "TR" 
      ? "Cari ekstre PDF raporu başarıyla indirildi." 
      : language === "AR" 
        ? "تم تحميل كشف الحساب بنجاح." 
        : "Current account statement PDF report downloaded successfully."
    );
  };

  return (
    <motion.div
      id="financial-detail-sheet"
      initial={isInline ? undefined : { x: "100%" }}
      animate={isInline ? { x: 0 } : { x: 0 }}
      exit={isInline ? undefined : { x: "100%" }}
      transition={isInline ? { duration: 0 } : { type: "spring", damping: 24, stiffness: 220 }}
      className={isInline ? "bg-[#F8FAFC] flex flex-col h-full rounded-3xl overflow-hidden" : "absolute inset-0 bg-[#F8FAFC] z-20 flex flex-col h-full"}
    >
      {/* Detail Sheet Header Bar */}
      <div className="bg-white border-b border-slate-100 px-4 py-3.5 flex items-center justify-between shadow-xs shrink-0">
        {!isInline && (
          <button 
            id="back-to-financials-btn"
            onClick={onClose}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold text-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t.tabFinancials}</span>
          </button>
        )}

        <h2 className="text-xs font-extrabold text-slate-800 tracking-wider uppercase">{language === "TR" ? "Cari Hesap Ekstresi" : language === "AR" ? "كشف الحساب الجاري" : "Current Account Statement"}</h2>
        
        {/* Header Action buttons */}
        <div className="flex items-center gap-2">
          {(userRole === "admin" || userRole === "master_admin") && onDeleteCompany && !isInline && (
            <button
              id="sheet-delete-company-btn"
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-extrabold px-2.5 py-1.5 rounded-xl border border-rose-200 transition-colors cursor-pointer"
              title={language === "TR" ? "Cari Hesabı Sil" : language === "AR" ? "حذف الحساب الجاري" : "Delete Account"}
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-600" />
              <span className="hidden sm:inline">{language === "TR" ? "Cariyi Sil" : "Delete"}</span>
            </button>
          )}

          {userRole !== "staff" && (
            <button
              id="download-ledger-pdf-btn"
              disabled={isDownloadingFont}
              onClick={handleGenerateLedgerPdf}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold px-2.5 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>
                {isDownloadingFont
                  ? (language === "TR" ? "Yukleniyor..." : language === "AR" ? "جاري التحميل..." : "Loading...")
                  : (language === "TR" ? "Ekstre" : language === "AR" ? "كشف" : "Statement")}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Sheet Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        
        {/* Company Title Plate */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded tracking-wide uppercase">
            {language === "TR" 
              ? (companyType === "Tedarikçi" ? "Tedarikçi Cari Hesabı" : "Müşteri Cari Hesabı") 
              : language === "AR" 
                ? (companyType === "Tedarikçi" ? "حساب المورد الجاري" : "الحساب الجاري للعميل") 
                : (companyType === "Tedarikçi" ? "Supplier Current Account" : "Customer Current Account")}
          </span>
          <h3 className="text-sm font-black text-slate-800 mt-1">{companyName}</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">LOGO TIGER 3 Entegre Mali Defter Sistemi</p>
        </div>

        {/* SUMMARY METRICS HEADER BOX */}
        <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-md space-y-4 shrink-0">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">{language === "TR" ? "Genel Finansal Durum" : language === "AR" ? "الوضع المالي العام" : "Overall Financial Status"}</span>
            <span className="text-[9px] font-mono font-bold bg-slate-800 text-indigo-300 px-2 py-0.5 rounded">USD LEDGER</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {companyType === "Müşteri" ? (
              <>
                <div className="space-y-1">
                  <span className="text-[8px] text-slate-400 uppercase font-black block">{language === "TR" ? "Üretilen Mamul" : language === "AR" ? "السلع المصنعة" : "Manufactured"}</span>
                  <span className="text-xs font-black font-mono block">${totalValuation.toFixed(1)}</span>
                </div>
                <div className="space-y-1 border-x border-slate-800">
                  <span className="text-[8px] text-slate-400 uppercase font-black block">{language === "TR" ? "Alınan Ödeme" : language === "AR" ? "المدفوعات المستلمة" : "Cash Received"}</span>
                  <span className="text-xs font-black font-mono text-emerald-400 block">${totalPaymentsReceived.toFixed(1)}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] text-slate-400 uppercase font-black block">{language === "TR" ? "Kalan Alacak" : language === "AR" ? "المستحقات المتبقية" : "Outstanding"}</span>
                  <span className={`text-xs font-black font-mono block ${netOutstanding > 0 ? "text-indigo-300" : "text-emerald-300"}`}>
                    ${netOutstanding.toFixed(1)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <span className="text-[8px] text-slate-400 uppercase font-black block">{language === "TR" ? "Alınan Mal/Hizmet" : language === "AR" ? "السلع المستلمة" : "Goods Received"}</span>
                  <span className="text-xs font-black font-mono block">${initialOwedByUs.toFixed(1)}</span>
                </div>
                <div className="space-y-1 border-x border-slate-800">
                  <span className="text-[8px] text-slate-400 uppercase font-black block">{language === "TR" ? "Yapılan Ödeme" : language === "AR" ? "المدفوعات" : "Cash Paid"}</span>
                  <span className="text-xs font-black font-mono text-emerald-400 block">${totalPaymentsMade.toFixed(1)}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] text-slate-400 uppercase font-black block">{language === "TR" ? "Kalan Borç" : language === "AR" ? "الديون المتبقية" : "Outstanding"}</span>
                  <span className={`text-xs font-black font-mono block ${netOutstanding > 0 ? "text-rose-400" : "text-emerald-300"}`}>
                    ${netOutstanding.toFixed(1)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* DATE RANGE FILTER PICKER */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-700">
            <Calendar className="h-4 w-4 text-indigo-600" />
            <h4 className="text-xs font-bold">
              {language === "TR" ? "Tarih Aralığı Filtresi" : language === "AR" ? "تصفية فترة التاريخ" : "Date Range Filter"}
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-400">
                {language === "TR" ? "Başlangıç Tarihi" : language === "AR" ? "تاريخ البدء" : "Start Date"}
              </label>
              <input 
                id="filter-start-date"
                type="date" 
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  triggerToast(language === "TR" ? "Başlangıç tarihi güncellendi." : "Start date updated.", "info");
                }}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-400">
                {language === "TR" ? "Bitiş Tarihi" : language === "AR" ? "تاريخ الانتهاء" : "End Date"}
              </label>
              <input 
                id="filter-end-date"
                type="date" 
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  triggerToast(language === "TR" ? "Bitiş tarihi güncellendi." : "End date updated.", "info");
                }}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setPresetRange("this-month")}
              className={`text-[9px] font-extrabold px-2 py-1 rounded-lg transition-all cursor-pointer ${
                startDate && !endDate && new Date(startDate).getDate() === 1 ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {language === "TR" ? "Bu Ay" : language === "AR" ? "هذا الشهر" : "This Month"}
            </button>
            <button
              type="button"
              onClick={() => setPresetRange("last-30-days")}
              className="text-[9px] font-extrabold px-2 py-1 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              {language === "TR" ? "Son 30 Gün" : language === "AR" ? "آخر 30 يومًا" : "Last 30 Days"}
            </button>
            <button
              type="button"
              onClick={() => setPresetRange("this-year")}
              className="text-[9px] font-extrabold px-2 py-1 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              {language === "TR" ? "Bu Yıl" : language === "AR" ? "هذه السنة" : "This Year"}
            </button>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => setPresetRange("all")}
                className="text-[9px] font-extrabold px-2 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all cursor-pointer"
              >
                {language === "TR" ? "Filtreyi Temizle" : language === "AR" ? "مسح التصفية" : "Clear Filter"}
              </button>
            )}
          </div>
        </div>

        {/* THE INFLOW/OUTFLOW FINANCIAL REGISTER */}
        {(userRole === "admin" || userRole === "master_admin") && (
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Yeni İşlem Kaydı Girişi</h4>
                <p className="text-[9px] text-slate-400">Cari hesaba borç/alacak evrak girişi yapın</p>
              </div>

              <button
                id="toggle-add-tx-btn"
                onClick={() => setShowAddTxForm(!showAddTxForm)}
                className="flex items-center gap-1 text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-xl transition-all"
              >
                <Plus className="h-3 w-3" />
                <span>İşlem Ekle</span>
              </button>
            </div>

            {showAddTxForm && (
              <form onSubmit={handleAddTxLocal} className="space-y-3 mt-2 border-t border-slate-50 pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400">İşlem Tarihi</label>
                    <input 
                      type="date" 
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-xs font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400">Evrak / İşlem Tipi</label>
                    <select 
                      value={txDocType}
                      onChange={(e) => setTxDocType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2 py-2 text-xs font-bold"
                    >
                      {companyType === "Müşteri" ? (
                        <>
                          <option value="Invoice Issued">Satiş Faturası (Invoice Issued)</option>
                          <option value="Payment Incoming Log">Ödeme Tahsilat (Payment Incoming Log)</option>
                        </>
                      ) : (
                        <>
                          <option value="Purchase Invoice">Mal Alındı Faturası (Purchase Invoice)</option>
                          <option value="Payment Outgoing">Ödeme Çıkışı (Payment Outgoing)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Quick Action Buttons for Document Type */}
                <div className="flex gap-2">
                  {companyType === "Müşteri" ? (
                    <>
                      <button type="button" onClick={() => setTxDocType("Invoice Issued")} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${txDocType === "Invoice Issued" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                        + Satış Yapıldı / Borç Ekle
                      </button>
                      <button type="button" onClick={() => setTxDocType("Payment Incoming Log")} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${txDocType === "Payment Incoming Log" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                        - Ödeme Alındı / Tahsilat
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => setTxDocType("Purchase Invoice")} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${txDocType === "Purchase Invoice" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                        + Mal Alındı / Borçlandık
                      </button>
                      <button type="button" onClick={() => setTxDocType("Payment Outgoing")} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${txDocType === "Payment Outgoing" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                        - Ödeme Yapıldı
                      </button>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400">Tutar ($ USD)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-xs font-black font-mono text-indigo-600"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400">Mutabakat Durumu</label>
                    <select 
                      value={txStatus}
                      onChange={(e) => setTxStatus(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2 py-2 text-xs font-bold"
                    >
                      <option value="Settled">Mutabık (Settled)</option>
                      <option value="Pending">Beklemede (Pending)</option>
                    </select>
                  </div>
                </div>

                {txDocType === "Invoice Issued" && companyModels.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400">İlişkili Model (Opsiyonel)</label>
                    <select
                      value={txModelId}
                      onChange={(e) => setTxModelId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-xs font-bold"
                    >
                      <option value="">Model Seçilmedi (None)</option>
                      {companyModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.smart_id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-xl transition-colors mt-2"
                >
                  Cari Hareketi Kaydet
                </button>
              </form>
            )}
          </div>
        )}

        {/* TRANSACTION LIST JOURNAL */}
        <div className="space-y-3">
          <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Cari İşlem Defteri (Journal)</h4>
          
          {companyTxs.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-3xl border border-slate-100 text-xs text-slate-400">
              {language === "TR" ? "Bu cari hesaba ait henüz bir işlem kaydı girilmemiştir." : language === "AR" ? "لم يتم إدخال أي سجل معاملات لهذا الحساب الجاري بعد." : "No transaction records have been entered for this current account yet."}
            </div>
          ) : filteredTxs.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-3xl border border-slate-100 text-xs text-slate-400">
              {language === "TR" ? "Seçilen tarih aralığında işlem bulunmamaktadır." : language === "AR" ? "لا توجد معاملات في فترة التاريخ المحددة." : "No transactions found within the selected date range."}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTxs.map((tx) => {
                const isInvoice = tx.doc_type === "Invoice Issued";
                const linkedModel = tx.model_id ? models.find((m) => m.id === tx.model_id) : undefined;
                return (
                  <div key={tx.id} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {linkedModel && linkedModel.photo_url ? (
                        <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center shrink-0 bg-slate-50">
                          <img 
                            src={linkedModel.photo_url} 
                            alt={linkedModel.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      ) : (
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isInvoice ? "bg-indigo-50 text-indigo-700" : "bg-emerald-50 text-emerald-700"
                        }`}>
                          <FileText className="h-4 w-4" />
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase ${
                            isInvoice ? "bg-indigo-50/70 text-indigo-700" : "bg-emerald-50/70 text-emerald-700"
                          }`}>
                            {isInvoice ? (language === "TR" ? "Satiş Faturası" : "Invoice Issued") : (language === "TR" ? "Ödeme Alındı" : "Payment Received")}
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold">{tx.date}</span>
                        </div>
                        <h5 className="font-bold text-slate-800 mt-0.5">
                          {isInvoice 
                            ? (linkedModel 
                                ? `${linkedModel.name} (${linkedModel.smart_id})` 
                                : (language === "TR" ? "Mamul Teslimatı Faturası" : "Manufactured Goods Delivery Invoice"))
                            : (language === "TR" ? "Banka Havalesi / Nakit Tahsilat" : "Bank Transfer / Cash Collection")}
                        </h5>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className={`font-black font-mono block ${isInvoice ? "text-indigo-600" : "text-emerald-600"}`}>
                          {isInvoice ? "+" : "-"}${tx.amount.toFixed(2)}
                        </span>
                        <span className={`text-[8px] font-bold uppercase block ${tx.status === "Settled" ? "text-emerald-500" : "text-amber-500"}`}>
                          {tx.status === "Settled" ? (language === "TR" ? "MUTABIK" : "SETTLED") : (language === "TR" ? "BEKLEMEDE" : "PENDING")}
                        </span>
                      </div>

                      {(userRole === "admin" || userRole === "master_admin") && (
                        <button
                          onClick={() => onRemoveTransaction(tx.id)}
                          className="text-slate-300 hover:text-rose-600 p-1 rounded transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Delete Company Confirmation Modal */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          onClick={() => setShowDeleteModal(false)}
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
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${companyType === "Tedarikçi" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                  {companyType || "Müşteri"}
                </span>
                <span className="text-xs font-bold text-slate-800 truncate max-w-[180px]">
                  {companyName}
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
                onClick={() => setShowDeleteModal(false)}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
              >
                {language === "TR" ? "Vazgeç" : language === "AR" ? "إلغاء" : "Cancel"}
              </button>
              <button
                id="confirm-sheet-delete-company-btn"
                type="button"
                onClick={() => {
                  if (onDeleteCompany) {
                    setShowDeleteModal(false);
                    onClose();
                    onDeleteCompany(companyId || "", companyName);
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
    </motion.div>
  );
}
