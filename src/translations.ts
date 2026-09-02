import { syrianArabicTranslation } from "./ar_sy_translation";

export type Language = "TR" | "EN" | "AR";

export interface TranslationDictionary {
  appTitle: string;
  appSub: string;
  tabDashboard: string;
  tabLogistics: string;
  tabProduction: string;
  tabFinancials: string;
  syncData: string;
  modelCollectionTitle: string;
  modelCollectionDesc: string;
  addModel: string;
  modelManualTitle: string;
  modelManualDesc: string;
  modelCode: string;
  modelName: string;
  customerBrand: string;
  unitSalePrice: string;
  laborCost: string;
  modelImgUrl: string;
  modelImgUpload: string;
  dragDropText: string;
  imageLoaded: string;
  saveModelCard: string;
  aiDesignTitle: string;
  aiDesignDesc: string;
  aiConcept: string;
  aiTargetPrice: string;
  aiDesignBtn: string;
  aiDesigning: string;
  noModels: string;
  profitLabel: string;
  totalCostLabel: string;
  bomItemCount: string;
  deleteModelConfirm: string;
  modelDetailTitle: string;
  billOfMaterials: string;
  addMaterial: string;
  materialName: string;
  consumption: string;
  unitCost: string;
  actions: string;
  noMaterials: string;
  variantRegistry: string;
  registerVariantBtn: string;
  variantColor: string;
  variantSize: string;
  variantWarehouse: string;
  registeredVariants: string;
  noVariants: string;
  customOverhead: string;
  overheadName: string;
  overheadCost: string;
  addCost: string;
  close: string;
  logisticTitle: string;
  logisticDesc: string;
  addFabricCard: string;
  fabricNameLabel: string;
  fabricUnitLabel: string;
  addFabricBtn: string;
  searchFabricPlaceholder: string;
  noFabrics: string;
  categoryAll: string;
  categoryAstar: string;
  categorySaten: string;
  categorySifon: string;
  categoryTul: string;
  categoryTeknik: string;
  categoryKrep: string;
  categoryPamuk: string;
  categoryLikra: string;
  categoryDiger: string;
  totalIncoming: string;
  totalCut: string;
  totalRemaining: string;
  galleryTitle: string;
  galleryDesc: string;
  uploadFabricColor: string;
  fabricColorUrl: string;
  fabricColorName: string;
  fabricColorIncoming: string;
  fabricColorCut: string;
  addColorBtn: string;
  noColorVariants: string;
  physicalMeterEdit: string;
  productionTitle: string;
  productionDesc: string;
  newOrderTitle: string;
  newOrderDesc: string;
  selectModel: string;
  targetQty: string;
  selectStage: string;
  stageCutting: string;
  stageSewing: string;
  stageIroning: string;
  stagePackaging: string;
  startOrderBtn: string;
  activeOrders: string;
  noOrders: string;
  completed: string;
  progressLabel: string;
  financialsTitle: string;
  financialsDesc: string;
  companyAccounts: string;
  companyDesc: string;
  balanceLabel: string;
  receivables: string;
  payables: string;
  journalTitle: string;
  addTransaction: string;
  docType: string;
  amount: string;
  statusLabel: string;
  settled: string;
  pending: string;
  invoiceIssued: string;
  paymentIncoming: string;
  noTransactions: string;
  rolePermissions: string;
  toastSuccess: string;
  toastError: string;
  toastInfo: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  TR: {
    appTitle: "TIGER ERP // TEXTILE",
    appSub: "KURUMSAL SİSTEM ARABİRİMİ",
    tabDashboard: "Koleksiyon",
    tabLogistics: "Lojistik",
    tabProduction: "Üretim",
    tabFinancials: "Finansal",
    syncData: "Veriler Eşitleniyor...",
    modelCollectionTitle: "Mamul Koleksiyonu",
    modelCollectionDesc: "Atölye Tasarım & Akıllı Model Kartları Kataloğu",
    addModel: "Model Ekle",
    modelManualTitle: "1. Yeni Model El ile Giriş",
    modelManualDesc: "Veritabanına manuel yeni giyim mamulü kaydı yapın",
    modelCode: "Model Kod (Smart ID)",
    modelName: "Model Adı",
    customerBrand: "Müşteri / Marka",
    unitSalePrice: "Birim Satış ($)",
    laborCost: "Atölye İşçilik Maliyeti ($)",
    modelImgUrl: "Model Görsel Linki (Alternatif URL)",
    modelImgUpload: "Model Fotoğrafı Yükle",
    dragDropText: "Sürükle & Bırak veya Tıkla",
    imageLoaded: "✓ Görsel Yüklendi (Değiştirmek için tıklayın)",
    saveModelCard: "Model Kartı Kaydet",
    aiDesignTitle: "2. Gemini AI ile Akıllı Reçete Tasarla",
    aiDesignDesc: "İstediğiniz konsepti yazın, Gemini hammadde reçetelerini anında tasarlasın",
    aiConcept: "Tasarım Konsepti",
    aiTargetPrice: "Hedef Satış ($)",
    aiDesignBtn: "Yapay Zeka Tasarla",
    aiDesigning: "Tasarlıyor...",
    noModels: "Katalogda kayıtlı model bulunmuyor.",
    profitLabel: "Kâr Marjı",
    totalCostLabel: "Toplam Maliyet",
    bomItemCount: "Reçete Kalemi",
    deleteModelConfirm: "Bu modeli ve ilişkili tüm reçete/varyantları silmek istediğinizden emin misiniz?",
    modelDetailTitle: "Model Detay & Üretim Reçetesi (BOM)",
    billOfMaterials: "Ürün Hammadde Reçetesi (BOM)",
    addMaterial: "Yeni Hammadde Ekle",
    materialName: "Malzeme / Aksesuar Adı",
    consumption: "Birim Tüketim (Metre/Adet)",
    unitCost: "Birim Maliyet ($)",
    actions: "İşlemler",
    noMaterials: "Bu modele ait reçete kalemi tanımlanmamış.",
    variantRegistry: "Beden & Renk Varyant Tanımlama",
    registerVariantBtn: "Varyant Kaydet",
    variantColor: "Renk Varyantı",
    variantSize: "Beden (36-44 / S-XL)",
    variantWarehouse: "Depo Lokasyonu",
    registeredVariants: "Kayıtlı Fiziksel Ürün Varyantları",
    noVariants: "Bu modele tanımlanmış fiziksel varyant bulunmuyor.",
    customOverhead: "Ekstra Atölye Maliyet Kalemleri",
    overheadName: "Maliyet Kalemi Açıklaması",
    overheadCost: "Maliyet ($)",
    addCost: "Maliyet Ekle",
    close: "Kapat",
    logisticTitle: "Kumaş & Malzeme Lojistiği",
    logisticDesc: "Fiziksel Stok Takibi ve Renk Doku Arşivi",
    addFabricCard: "Yeni Kumaş Giriş Kartı",
    fabricNameLabel: "Kumaş Adı / Cinsi",
    fabricUnitLabel: "Ölçü Birimi (Mt / Kg / Adet)",
    addFabricBtn: "Kumaş Kartı Oluştur",
    searchFabricPlaceholder: "Kumaş adı veya kodu ara...",
    noFabrics: "Depoda kayıtlı kumaş bulunmuyor.",
    categoryAll: "Tümü",
    categoryAstar: "Astar",
    categorySaten: "Saten",
    categorySifon: "Şifon",
    categoryTul: "Tül",
    categoryTeknik: "Teknik",
    categoryKrep: "Krep",
    categoryPamuk: "Pamuk",
    categoryLikra: "Likra",
    categoryDiger: "Diğer",
    totalIncoming: "Gelen",
    totalCut: "Kesilen",
    totalRemaining: "Kalan",
    galleryTitle: "Kumaş Renk Galerisi",
    galleryDesc: "Kumaşa tanımlanmış görsel ve renk varyantları",
    uploadFabricColor: "Kumaş Renk Fotoğrafı Yükle",
    fabricColorUrl: "Kumaş Renk Doku Fotoğrafı (Alternatif URL)",
    fabricColorName: "Varyant Renk Adı",
    fabricColorIncoming: "Başlangıç Metraj Girişi",
    fabricColorCut: "Kesilen Metraj",
    addColorBtn: "Renk Varyantı Ekle",
    noColorVariants: "Bu kumaşa tanımlanmış görsel/renk bulunmuyor. Üstteki panelden ekleyin.",
    physicalMeterEdit: "Fiziksel Metraj Düzenleme Paneli",
    productionTitle: "Atölye Üretim Bandı",
    productionDesc: "Aktif İş Emirleri ve Safha İlerleme İzleme",
    newOrderTitle: "Yeni Üretim İş Emri Başlat",
    newOrderDesc: "Katalogdaki bir model için bant üretim emri verin",
    selectModel: "Üretilecek Model",
    targetQty: "Hedef Adet",
    selectStage: "Başlangıç Safhası",
    stageCutting: "Kesim Safhası",
    stageSewing: "Dikim Safhası",
    stageIroning: "Ütü/Paket Safhası",
    stagePackaging: "Sevkiyat Safhası",
    startOrderBtn: "İş Emrini Başlat",
    activeOrders: "Aktif İş Emirleri Listesi",
    noOrders: "Aktif üretim iş emri bulunmuyor.",
    completed: "Tamamlanan",
    progressLabel: "İlerleme",
    financialsTitle: "Cari Hesaplar & Finansal Analiz",
    financialsDesc: "Müşteri Bazında Cari Kartlar ve Karlılık Raporları",
    companyAccounts: "Müşteri Cari Hesap Listesi",
    companyDesc: "Markaların borç/alacak ve sipariş detayları",
    balanceLabel: "Net Cari Bakiye",
    receivables: "Toplam Alacak",
    payables: "Toplam Borç",
    journalTitle: "Finansal İşlemler (Yevmiye Defteri)",
    addTransaction: "Yeni İşlem Ekle",
    docType: "Belge Tipi",
    amount: "İşlem Tutarı ($)",
    statusLabel: "Durum",
    settled: "Ödendi / Kapatıldı",
    pending: "Beklemede",
    invoiceIssued: "Fatura Kesildi",
    paymentIncoming: "Ödeme Alındı",
    noTransactions: "Bu şirkete ait finansal işlem kaydı bulunmuyor.",
    rolePermissions: "YETKİLERİ",
    toastSuccess: "Başarıyla tamamlandı!",
    toastError: "Bir hata oluştu.",
    toastInfo: "Bilgilendirme:"
  },
  EN: {
    appTitle: "TIGER ERP // TEXTILE",
    appSub: "ENTERPRISE SYSTEM INTERFACE",
    tabDashboard: "Collection",
    tabLogistics: "Logistics",
    tabProduction: "Production",
    tabFinancials: "Financials",
    syncData: "Syncing Data...",
    modelCollectionTitle: "Product Collection",
    modelCollectionDesc: "Workshop Design & Smart Model Cards Catalog",
    addModel: "Add Model",
    modelManualTitle: "1. Manual New Model Entry",
    modelManualDesc: "Manually register new apparel product into the database",
    modelCode: "Model Code (Smart ID)",
    modelName: "Model Name",
    customerBrand: "Customer / Brand",
    unitSalePrice: "Unit Sale Price ($)",
    laborCost: "Workshop Labor Cost ($)",
    modelImgUrl: "Model Image URL (Alternative URL)",
    modelImgUpload: "Upload Model Photo",
    dragDropText: "Drag & Drop or Click",
    imageLoaded: "✓ Image Loaded (Click to change)",
    saveModelCard: "Save Model Card",
    aiDesignTitle: "2. Design Smart BOM with Gemini AI",
    aiDesignDesc: "Type your desired concept, Gemini will instantly design raw material BOMs",
    aiConcept: "Design Concept",
    aiTargetPrice: "Target Sale Price ($)",
    aiDesignBtn: "AI Design",
    aiDesigning: "Designing...",
    noModels: "No models registered in the catalog.",
    profitLabel: "Profit Margin",
    totalCostLabel: "Total Cost",
    bomItemCount: "BOM Items",
    deleteModelConfirm: "Are you sure you want to delete this model and all its associated BOMs/variants?",
    modelDetailTitle: "Model Detail & Bill of Materials (BOM)",
    billOfMaterials: "Bill of Materials (BOM)",
    addMaterial: "Add New Material",
    materialName: "Material / Accessory Name",
    consumption: "Unit Consumption (Meter/Pcs)",
    unitCost: "Unit Cost ($)",
    actions: "Actions",
    noMaterials: "No BOM items defined for this model.",
    variantRegistry: "Size & Color Variant Registry",
    registerVariantBtn: "Register Variant",
    variantColor: "Variant Color",
    variantSize: "Size (36-44 / S-XL)",
    variantWarehouse: "Warehouse Location",
    registeredVariants: "Registered Physical Variants",
    noVariants: "No physical variants registered for this model.",
    customOverhead: "Extra Workshop Overhead Costs",
    overheadName: "Overhead Cost Description",
    overheadCost: "Cost ($)",
    addCost: "Add Cost",
    close: "Close",
    logisticTitle: "Fabric & Material Logistics",
    logisticDesc: "Physical Stock Tracking and Color/Texture Archive",
    addFabricCard: "New Fabric Entry Card",
    fabricNameLabel: "Fabric Name / Type",
    fabricUnitLabel: "Measurement Unit (Mt / Kg / Pcs)",
    addFabricBtn: "Create Fabric Card",
    searchFabricPlaceholder: "Search fabric name or code...",
    noFabrics: "No fabrics registered in warehouse.",
    categoryAll: "All",
    categoryAstar: "Lining",
    categorySaten: "Satin",
    categorySifon: "Chiffon",
    categoryTul: "Tulle",
    categoryTeknik: "Technical",
    categoryKrep: "Crepe",
    categoryPamuk: "Cotton",
    categoryLikra: "Lycra",
    categoryDiger: "Other",
    totalIncoming: "Incoming",
    totalCut: "Cut",
    totalRemaining: "Remaining",
    galleryTitle: "Fabric Color Gallery",
    galleryDesc: "Visual and color variants defined for the fabric",
    uploadFabricColor: "Upload Fabric Color Photo",
    fabricColorUrl: "Fabric Color Texture Photo (Alternative URL)",
    fabricColorName: "Variant Color Name",
    fabricColorIncoming: "Initial Meters Entry",
    fabricColorCut: "Cut Meters",
    addColorBtn: "Add Color Variant",
    noColorVariants: "No visuals/colors defined for this fabric. Add from the panel above.",
    physicalMeterEdit: "Physical Meter Editing Panel",
    productionTitle: "Workshop Production Line",
    productionDesc: "Active Job Orders and Stage Progress Monitoring",
    newOrderTitle: "Start New Production Job Order",
    newOrderDesc: "Issue a production line order for a catalog model",
    selectModel: "Model to Produce",
    targetQty: "Target Quantity",
    selectStage: "Initial Stage",
    stageCutting: "Cutting Stage",
    stageSewing: "Sewing Stage",
    stageIroning: "Ironing/Packaging Stage",
    stagePackaging: "Shipping Stage",
    startOrderBtn: "Start Job Order",
    activeOrders: "Active Job Orders List",
    noOrders: "No active production job orders.",
    completed: "Completed",
    progressLabel: "Progress",
    financialsTitle: "Current Accounts & Financial Analysis",
    financialsDesc: "Customer-Based Current Accounts and Profitability Reports",
    companyAccounts: "Customer Account List",
    companyDesc: "Brands debit/credit and order details",
    balanceLabel: "Net Balance",
    receivables: "Total Receivables",
    payables: "Total Payables",
    journalTitle: "Financial Transactions (General Journal)",
    addTransaction: "Add New Transaction",
    docType: "Document Type",
    amount: "Transaction Amount ($)",
    statusLabel: "Status",
    settled: "Paid / Settled",
    pending: "Pending",
    invoiceIssued: "Invoice Issued",
    paymentIncoming: "Payment Received",
    noTransactions: "No transaction records for this company.",
    rolePermissions: "PERMISSIONS",
    toastSuccess: "Successfully completed!",
    toastError: "An error occurred.",
    toastInfo: "Information:"
  },
  AR: syrianArabicTranslation
};
