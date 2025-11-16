/**
 * Internationalization (i18n) utilities for multi-language support
 */

export type Language = 'th' | 'en';

/**
 * Complete translation strings for all languages
 */
export const translations = {
  th: {
    // Common
    'common.save': 'บันทึก',
    'common.cancel': 'ยกเลิก',
    'common.delete': 'ลบ',
    'common.edit': 'แก้ไข',
    'common.add': 'เพิ่ม',
    'common.search': 'ค้นหา',
    'common.filter': 'กรอง',
    'common.export': 'ส่งออก',
    'common.import': 'นำเข้า',
    'common.close': 'ปิด',
    'common.back': 'ย้อนกลับ',
    'common.loading': 'กำลังโหลด...',
    'common.error': 'เกิดข้อผิดพลาด',
    'common.success': 'สำเร็จ',
    'common.confirm': 'ยืนยัน',
    'common.name': 'ชื่อ',
    'common.description': 'คำอธิบาย',
    'common.date': 'วันที่',
    'common.time': 'เวลา',
    'common.actions': 'การดำเนิน',
    'common.status': 'สถานะ',
    'common.empty': 'ไม่มีข้อมูล',
    'common.total': 'รวม',
    'common.quantity': 'จำนวน',
    'common.price': 'ราคา',
    'common.discount': 'ส่วนลด',
    'common.subtotal': 'รวมย่อย',
    'common.currency': '฿',

    // Orders
    'orders.title': 'ออเดอร์',
    'orders.newOrder': 'สร้างออเดอร์ใหม่',
    'orders.editOrder': 'แก้ไขออเดอร์',
    'orders.deleteOrder': 'ลบออเดอร์',
    'orders.orders': 'ออเดอร์',
    'orders.orderItems': 'รายการออเดอร์',
    'orders.addItem': 'เพิ่มรายการ',
    'orders.itemName': 'ชื่อรายการ',
    'orders.productName': 'ชื่อสินค้า',
    'orders.itemPrice': 'ราคารายการ',
    'orders.itemQuantity': 'จำนวนรายการ',
    'orders.itemDiscount': 'ส่วนลดรายการ',
    'orders.itemNotes': 'หมายเหตุรายการ',
    'orders.orderTotal': 'รวมออเดอร์',
    'orders.orderDate': 'วันที่ออเดอร์',
    'orders.orderHistory': 'ประวัติออเดอร์',
    'orders.orderTemplates': 'เทมเพลตออเดอร์',
    'orders.createTemplate': 'สร้างเทมเพลต',
    'orders.loadTemplate': 'โหลดเทมเพลต',
    'orders.templates': 'เทมเพลต',
    'orders.saveTemplate': 'บันทึกเทมเพลต',
    'orders.templateName': 'ชื่อเทมเพลต',
    'orders.duplicateItem': 'ทำซ้ำรายการ',
    'orders.mergeItems': 'รวมรายการ',
    'orders.splitItem': 'แบ่งรายการ',
    'orders.quickActions': 'การดำเนินการด่วน',

    // Quick Actions
    'quickActions.double': 'คูณ2',
    'quickActions.half': '÷2',
    'quickActions.addOne': '+1',
    'quickActions.removeOne': '-1',
    'quickActions.roundToFive': 'ปัด 5',
    'quickActions.roundToTen': 'ปัด 10',
    'quickActions.discount10': '-10%',
    'quickActions.discount20': '-20%',
    'quickActions.discount50': '-50%',
    'quickActions.removeDiscount': 'ยกเลิกส่วนลด',
    'quickActions.duplicate': 'ทำซ้ำ',
    'quickActions.split': 'แบ่ง',

    // CSV Import
    'csvImport.title': 'นำเข้าจาก CSV',
    'csvImport.upload': 'อัปโหลดไฟล์ CSV',
    'csvImport.preview': 'ตัวอย่าง',
    'csvImport.downloadTemplate': 'ดาวน์โหลดเทมเพลต',
    'csvImport.selectFile': 'เลือกไฟล์',
    'csvImport.successCount': 'สำเร็จ',
    'csvImport.errorCount': 'ข้อผิดพลาด',
    'csvImport.totalQuantity': 'รวมจำนวน',
    'csvImport.totalPrice': 'มูลค่ารวม',
    'csvImport.errors': 'ข้อผิดพลาด',
    'csvImport.row': 'แถว',
    'csvImport.field': 'ฟิลด์',
    'csvImport.import': 'นำเข้า',

    // Analytics
    'analytics.title': 'วิเคราะห์',
    'analytics.dashboard': 'แดชบอร์ด',
    'analytics.totalRevenue': 'รวมรายได้',
    'analytics.totalOrders': 'รวมออเดอร์',
    'analytics.totalItems': 'รวมรายการ',
    'analytics.averageOrderValue': 'มูลค่าออเดอร์เฉลี่ย',
    'analytics.topProducts': 'สินค้าเด่น',
    'analytics.trends': 'แนวโน้ม',
    'analytics.growth': 'การเติบโต',
    'analytics.timeRange': 'ช่วงเวลา',
    'analytics.day': 'วัน',
    'analytics.week': 'สัปดาห์',
    'analytics.month': 'เดือน',
    'analytics.rising': 'เพิ่มขึ้น',
    'analytics.declining': 'ลดลง',
    'analytics.stable': 'คงที่',
    'analytics.comparison': 'เปรียบเทียบ',
    'analytics.export': 'ส่งออกวิเคราะห์',

    // Stock Management
    'stock.title': 'คลังสินค้า',
    'stock.inventory': 'สินค้าคงคลัง',
    'stock.currentStock': 'สต๊อกปัจจุบัน',
    'stock.minimumStock': 'สต๊อกขั้นต่ำ',
    'stock.maximumStock': 'สต๊อกสูงสุด',
    'stock.status': 'สถานะ',
    'stock.inStock': 'มีสต๊อก',
    'stock.lowStock': 'สต๊อกต่ำ',
    'stock.critical': 'วิกฤติ',
    'stock.outOfStock': 'หมดสต๊อก',
    'stock.movements': 'การเคลื่อนไหว',
    'stock.alerts': 'การแจ้งเตือน',
    'stock.forecast': 'การพยากรณ์',
    'stock.daysUntilStockout': 'วันจนกว่าหมดสต๊อก',
    'stock.history': 'ประวัติ',
    'stock.add': 'เพิ่มสต๊อก',
    'stock.remove': 'ลดสต๊อก',
    'stock.adjust': 'ปรับปรุง',
    'stock.reason': 'เหตุผล',
    'stock.healthScore': 'คะแนนสุขภาพ',
    'stock.lowStockProducts': 'สินค้าสต๊อกต่ำ',
    'stock.outOfStockProducts': 'สินค้าหมดสต๊อก',

    // Scheduling
    'schedule.title': 'ตารางอีเวนต์',
    'schedule.schedules': 'ตารางอีเวนต์',
    'schedule.createSchedule': 'สร้างตารางใหม่',
    'schedule.editSchedule': 'แก้ไขตารางอีเวนต์',
    'schedule.deleteSchedule': 'ลบตารางอีเวนต์',
    'schedule.frequency': 'ความถี่',
    'schedule.once': 'ครั้งเดียว',
    'schedule.daily': 'ทุกวัน',
    'schedule.weekly': 'สัปดาห์ละครั้ง',
    'schedule.biweekly': 'สองสัปดาห์ละครั้ง',
    'schedule.monthly': 'เดือนละครั้ง',
    'schedule.custom': 'กำหนดเอง',
    'schedule.startDate': 'วันที่เริ่มต้น',
    'schedule.endDate': 'วันที่สิ้นสุด',
    'schedule.time': 'เวลา',
    'schedule.daysOfWeek': 'วันของสัปดาห์',
    'schedule.dayOfMonth': 'วันของเดือน',
    'schedule.nextExecution': 'ครั้งถัดไป',
    'schedule.lastExecution': 'ครั้งสุดท้าย',
    'schedule.active': 'ทำงาน',
    'schedule.inactive': 'ปิดใช้งาน',
    'schedule.execution': 'การดำเนิน',
    'schedule.executionHistory': 'ประวัติการดำเนิน',

    // Tax
    'tax.title': 'ภาษี',
    'tax.settings': 'การตั้งค่าภาษี',
    'tax.rate': 'อัตราภาษี',
    'tax.amount': 'จำนวนภาษี',
    'tax.included': 'รวมภาษี',
    'tax.excluded': 'ยังไม่รวมภาษี',
    'tax.calculate': 'คำนวณภาษี',
    'tax.addTax': 'เพิ่มภาษี',
    'tax.removeTax': 'ลบภาษี',
    'tax.taxRate': 'อัตราภาษี',
    'tax.total': 'รวมทั้งภาษี',

    // Notifications
    'notifications.title': 'การแจ้งเตือน',
    'notifications.noNotifications': 'ไม่มีการแจ้งเตือน',
    'notifications.markAsRead': 'ทำเครื่องหมายว่าอ่านแล้ว',
    'notifications.clearAll': 'ลบทั้งหมด',
    'notifications.settings': 'การตั้งค่าการแจ้งเตือน',
    'notifications.enable': 'เปิดใช้งาน',
    'notifications.disable': 'ปิดใช้งาน',
    'notifications.sound': 'เสียง',

    // Comparison
    'comparison.title': 'เปรียบเทียบ',
    'comparison.compare': 'เปรียบเทียบออเดอร์',
    'comparison.select': 'เลือกออเดอร์ที่จะเปรียบเทียบ',
    'comparison.differences': 'ความแตกต่าง',
    'comparison.similarities': 'ความเหมือน',

    // Reports
    'reports.title': 'รายงาน',
    'reports.generateReport': 'สร้างรายงาน',
    'reports.dailyReport': 'รายงานรายวัน',
    'reports.weeklyReport': 'รายงานรายสัปดาห์',
    'reports.monthlyReport': 'รายงานรายเดือน',
    'reports.customReport': 'รายงานกำหนดเอง',
    'reports.salesReport': 'รายงานการขาย',
    'reports.inventoryReport': 'รายงานสินค้าคงคลัง',
    'reports.customerReport': 'รายงานลูกค้า',
    'reports.export': 'ส่งออกรายงาน',

    // Messages
    'messages.confirmDelete': 'ยืนยันการลบ?',
    'messages.deleteSuccess': 'ลบสำเร็จ',
    'messages.savingSuccess': 'บันทึกสำเร็จ',
    'messages.loadingError': 'เกิดข้อผิดพลาดในการโหลด',
    'messages.noResults': 'ไม่พบผลลัพธ์',
    'messages.areYouSure': 'คุณแน่ใจหรือไม่?',
    'messages.required': 'จำเป็นต้องกรอก',
    'messages.invalidFormat': 'รูปแบบไม่ถูกต้อง',

    // Settings
    'settings.title': 'การตั้งค่า',
    'settings.language': 'ภาษา',
    'settings.theme': 'ธีม',
    'settings.darkMode': 'โหมดมืด',
    'settings.lightMode': 'โหมดสว่าง',
    'settings.general': 'ทั่วไป',
    'settings.preferences': 'ความชอบ',
    'settings.notifications': 'การแจ้งเตือน',
    'settings.about': 'เกี่ยวกับ',
  },

  en: {
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.name': 'Name',
    'common.description': 'Description',
    'common.date': 'Date',
    'common.time': 'Time',
    'common.actions': 'Actions',
    'common.status': 'Status',
    'common.empty': 'No data',
    'common.total': 'Total',
    'common.quantity': 'Quantity',
    'common.price': 'Price',
    'common.discount': 'Discount',
    'common.subtotal': 'Subtotal',
    'common.currency': '$',

    // Orders
    'orders.title': 'Orders',
    'orders.newOrder': 'New Order',
    'orders.editOrder': 'Edit Order',
    'orders.deleteOrder': 'Delete Order',
    'orders.orders': 'Orders',
    'orders.orderItems': 'Order Items',
    'orders.addItem': 'Add Item',
    'orders.itemName': 'Item Name',
    'orders.productName': 'Product Name',
    'orders.itemPrice': 'Item Price',
    'orders.itemQuantity': 'Item Quantity',
    'orders.itemDiscount': 'Item Discount',
    'orders.itemNotes': 'Item Notes',
    'orders.orderTotal': 'Order Total',
    'orders.orderDate': 'Order Date',
    'orders.orderHistory': 'Order History',
    'orders.orderTemplates': 'Order Templates',
    'orders.createTemplate': 'Create Template',
    'orders.loadTemplate': 'Load Template',
    'orders.templates': 'Templates',
    'orders.saveTemplate': 'Save Template',
    'orders.templateName': 'Template Name',
    'orders.duplicateItem': 'Duplicate Item',
    'orders.mergeItems': 'Merge Items',
    'orders.splitItem': 'Split Item',
    'orders.quickActions': 'Quick Actions',

    // Quick Actions
    'quickActions.double': '×2',
    'quickActions.half': '÷2',
    'quickActions.addOne': '+1',
    'quickActions.removeOne': '-1',
    'quickActions.roundToFive': 'Round 5',
    'quickActions.roundToTen': 'Round 10',
    'quickActions.discount10': '-10%',
    'quickActions.discount20': '-20%',
    'quickActions.discount50': '-50%',
    'quickActions.removeDiscount': 'Clear Discount',
    'quickActions.duplicate': 'Duplicate',
    'quickActions.split': 'Split',

    // CSV Import
    'csvImport.title': 'Import from CSV',
    'csvImport.upload': 'Upload CSV File',
    'csvImport.preview': 'Preview',
    'csvImport.downloadTemplate': 'Download Template',
    'csvImport.selectFile': 'Select File',
    'csvImport.successCount': 'Success',
    'csvImport.errorCount': 'Errors',
    'csvImport.totalQuantity': 'Total Quantity',
    'csvImport.totalPrice': 'Total Value',
    'csvImport.errors': 'Errors',
    'csvImport.row': 'Row',
    'csvImport.field': 'Field',
    'csvImport.import': 'Import',

    // Analytics
    'analytics.title': 'Analytics',
    'analytics.dashboard': 'Dashboard',
    'analytics.totalRevenue': 'Total Revenue',
    'analytics.totalOrders': 'Total Orders',
    'analytics.totalItems': 'Total Items',
    'analytics.averageOrderValue': 'Average Order Value',
    'analytics.topProducts': 'Top Products',
    'analytics.trends': 'Trends',
    'analytics.growth': 'Growth',
    'analytics.timeRange': 'Time Range',
    'analytics.day': 'Day',
    'analytics.week': 'Week',
    'analytics.month': 'Month',
    'analytics.rising': 'Rising',
    'analytics.declining': 'Declining',
    'analytics.stable': 'Stable',
    'analytics.comparison': 'Comparison',
    'analytics.export': 'Export Analytics',

    // Stock Management
    'stock.title': 'Stock',
    'stock.inventory': 'Inventory',
    'stock.currentStock': 'Current Stock',
    'stock.minimumStock': 'Minimum Stock',
    'stock.maximumStock': 'Maximum Stock',
    'stock.status': 'Status',
    'stock.inStock': 'In Stock',
    'stock.lowStock': 'Low Stock',
    'stock.critical': 'Critical',
    'stock.outOfStock': 'Out of Stock',
    'stock.movements': 'Movements',
    'stock.alerts': 'Alerts',
    'stock.forecast': 'Forecast',
    'stock.daysUntilStockout': 'Days Until Stockout',
    'stock.history': 'History',
    'stock.add': 'Add Stock',
    'stock.remove': 'Remove Stock',
    'stock.adjust': 'Adjust',
    'stock.reason': 'Reason',
    'stock.healthScore': 'Health Score',
    'stock.lowStockProducts': 'Low Stock Products',
    'stock.outOfStockProducts': 'Out of Stock Products',

    // Scheduling
    'schedule.title': 'Schedules',
    'schedule.schedules': 'Schedules',
    'schedule.createSchedule': 'Create Schedule',
    'schedule.editSchedule': 'Edit Schedule',
    'schedule.deleteSchedule': 'Delete Schedule',
    'schedule.frequency': 'Frequency',
    'schedule.once': 'Once',
    'schedule.daily': 'Daily',
    'schedule.weekly': 'Weekly',
    'schedule.biweekly': 'Bi-weekly',
    'schedule.monthly': 'Monthly',
    'schedule.custom': 'Custom',
    'schedule.startDate': 'Start Date',
    'schedule.endDate': 'End Date',
    'schedule.time': 'Time',
    'schedule.daysOfWeek': 'Days of Week',
    'schedule.dayOfMonth': 'Day of Month',
    'schedule.nextExecution': 'Next Execution',
    'schedule.lastExecution': 'Last Execution',
    'schedule.active': 'Active',
    'schedule.inactive': 'Inactive',
    'schedule.execution': 'Execution',
    'schedule.executionHistory': 'Execution History',

    // Tax
    'tax.title': 'Tax',
    'tax.settings': 'Tax Settings',
    'tax.rate': 'Tax Rate',
    'tax.amount': 'Tax Amount',
    'tax.included': 'Tax Included',
    'tax.excluded': 'Tax Excluded',
    'tax.calculate': 'Calculate Tax',
    'tax.addTax': 'Add Tax',
    'tax.removeTax': 'Remove Tax',
    'tax.taxRate': 'Tax Rate',
    'tax.total': 'Total with Tax',

    // Notifications
    'notifications.title': 'Notifications',
    'notifications.noNotifications': 'No notifications',
    'notifications.markAsRead': 'Mark as read',
    'notifications.clearAll': 'Clear all',
    'notifications.settings': 'Notification Settings',
    'notifications.enable': 'Enable',
    'notifications.disable': 'Disable',
    'notifications.sound': 'Sound',

    // Comparison
    'comparison.title': 'Comparison',
    'comparison.compare': 'Compare Orders',
    'comparison.select': 'Select orders to compare',
    'comparison.differences': 'Differences',
    'comparison.similarities': 'Similarities',

    // Reports
    'reports.title': 'Reports',
    'reports.generateReport': 'Generate Report',
    'reports.dailyReport': 'Daily Report',
    'reports.weeklyReport': 'Weekly Report',
    'reports.monthlyReport': 'Monthly Report',
    'reports.customReport': 'Custom Report',
    'reports.salesReport': 'Sales Report',
    'reports.inventoryReport': 'Inventory Report',
    'reports.customerReport': 'Customer Report',
    'reports.export': 'Export Report',

    // Messages
    'messages.confirmDelete': 'Confirm deletion?',
    'messages.deleteSuccess': 'Deleted successfully',
    'messages.savingSuccess': 'Saved successfully',
    'messages.loadingError': 'Error loading data',
    'messages.noResults': 'No results found',
    'messages.areYouSure': 'Are you sure?',
    'messages.required': 'This field is required',
    'messages.invalidFormat': 'Invalid format',

    // Settings
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.darkMode': 'Dark Mode',
    'settings.lightMode': 'Light Mode',
    'settings.general': 'General',
    'settings.preferences': 'Preferences',
    'settings.notifications': 'Notifications',
    'settings.about': 'About',
  },
};

/**
 * Get current language from localStorage or browser
 */
export function getCurrentLanguage(): Language {
  if (typeof window === 'undefined') return 'th';

  const stored = localStorage.getItem('language');
  if (stored === 'th' || stored === 'en') {
    return stored;
  }

  // Detect browser language
  const browserLang = navigator.language.startsWith('th') ? 'th' : 'en';
  return browserLang;
}

/**
 * Set language preference
 */
export function setLanguage(lang: Language): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('language', lang);
  document.documentElement.lang = lang;
}

/**
 * Get translation string
 */
export function t(key: string, language?: Language): string {
  const lang = language || getCurrentLanguage();
  const keys = key.split('.');
  let value: any = translations[lang];

  for (const k of keys) {
    value = value?.[k];
  }

  // Fallback to English if translation not found
  if (!value && lang !== 'en') {
    let enValue: any = translations.en;
    for (const k of keys) {
      enValue = enValue?.[k];
    }
    return enValue || key;
  }

  return value || key;
}

/**
 * Translate with pluralization
 */
export function tp(key: string, count: number, language?: Language): string {
  const lang = language || getCurrentLanguage();

  if (lang === 'th') {
    // Thai doesn't use singular/plural
    return t(key, lang);
  }

  // English pluralization
  const singular = t(key, lang);
  const plural = t(`${key}_plural`, lang);

  return count === 1 ? singular : plural || singular;
}

/**
 * Format date according to language locale
 */
export function formatDate(date: Date, format: 'short' | 'long' = 'short', language?: Language): string {
  const lang = language || getCurrentLanguage();
  const locale = lang === 'th' ? 'th-TH' : 'en-US';

  const options: Intl.DateTimeFormatOptions =
    format === 'short'
      ? { year: 'numeric', month: 'short', day: 'numeric' }
      : { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };

  return new Date(date).toLocaleDateString(locale, options);
}

/**
 * Format date and time
 */
export function formatDateTime(date: Date, language?: Language): string {
  const lang = language || getCurrentLanguage();
  const locale = lang === 'th' ? 'th-TH' : 'en-US';

  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format time only
 */
export function formatTime(date: Date, language?: Language): string {
  const lang = language || getCurrentLanguage();
  const locale = lang === 'th' ? 'th-TH' : 'en-US';

  return new Date(date).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format number according to language locale
 */
export function formatNumber(num: number, language?: Language): string {
  const lang = language || getCurrentLanguage();
  const locale = lang === 'th' ? 'th-TH' : 'en-US';

  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, language?: Language): string {
  const lang = language || getCurrentLanguage();
  const currency = lang === 'th' ? 'THB' : 'USD';
  const locale = lang === 'th' ? 'th-TH' : 'en-US';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(language?: Language): string {
  const lang = language || getCurrentLanguage();
  return lang === 'th' ? '฿' : '$';
}

/**
 * Get all available languages
 */
export function getAvailableLanguages(): { code: Language; name: string }[] {
  return [
    { code: 'th', name: 'ไทย' },
    { code: 'en', name: 'English' },
  ];
}

/**
 * Check if language is RTL (right-to-left)
 */
export function isRTL(language?: Language): boolean {
  const lang = language || getCurrentLanguage();
  return false; // Thai and English are both LTR
}
