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
    'common.view': 'ดู',
    'common.previous': 'ก่อนหน้า',
    'common.next': 'ถัดไป',

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

    // Bulk Operations
    'bulk.title': 'การดำเนินการจำนวนมาก',
    'bulk.selectItems': 'เลือกรายการ',
    'bulk.selectAll': 'เลือกทั้งหมด',
    'bulk.deselectAll': 'ยกเลิกทั้งหมด',
    'bulk.operations': 'การดำเนินการ',
    'bulk.operationType': 'ประเภทการดำเนินการ',
    'bulk.updatePrice': 'อัปเดตราคา',
    'bulk.updateQuantity': 'อัปเดตจำนวน',
    'bulk.applyDiscount': 'ใช้ส่วนลด',
    'bulk.removeDiscount': 'ลบส่วนลด',
    'bulk.deleteItems': 'ลบรายการ',
    'bulk.newPrice': 'ราคาใหม่',
    'bulk.newQuantity': 'จำนวนใหม่',
    'bulk.discountPercent': 'ส่วนลด (%)',
    'bulk.execute': 'ดำเนินการ',
    'bulk.processing': 'กำลังดำเนินการ...',
    'bulk.progress': 'ความคืบหน้า',
    'bulk.cancel': 'ยกเลิก',
    'bulk.processed': 'ดำเนินการแล้ว',
    'bulk.total': 'ทั้งหมด',
    'bulk.failed': 'ล้มเหลว',
    'bulk.completed': 'เสร็จสิ้น',
    'bulk.cancelled': 'ยกเลิกแล้ว',
    'bulk.errors': 'ข้อผิดพลาด',
    'bulk.statistics': 'สถิติ',
    'bulk.successRate': 'อัตราสำเร็จ',
    'bulk.totalItems': 'รายการทั้งหมด',
    'bulk.averageTime': 'เวลาเฉลี่ย',
    'bulk.history': 'ประวัติ',
    'bulk.showHistory': 'แสดงประวัติ',
    'bulk.hideHistory': 'ซ่อนประวัติ',
    'bulk.clearHistory': 'ล้างประวัติ',
    'bulk.confirmOperation': 'ยืนยันการดำเนินการ',
    'bulk.undo': 'ย้อนกลับ',
    'bulk.redo': 'ทำซ้ำ',

    // Audit Trail
    'audit.title': 'บันทึกการตรวจสอบ',
    'audit.auditTrail': 'บันทึกการตรวจสอบ',
    'audit.timestamp': 'เวลา',
    'audit.action': 'การดำเนินการ',
    'audit.entityType': 'ประเภทข้อมูล',
    'audit.entityId': 'รหัสข้อมูล',
    'audit.user': 'ผู้ใช้',
    'audit.status': 'สถานะ',
    'audit.changes': 'การเปลี่ยนแปลง',
    'audit.details': 'รายละเอียด',
    'audit.success': 'สำเร็จ',
    'audit.failed': 'ล้มเหลว',
    'audit.export': 'ส่งออก',
    'audit.exportCSV': 'ส่งออก CSV',
    'audit.exportJSON': 'ส่งออก JSON',
    'audit.filters': 'ตัวกรอง',
    'audit.clearFilters': 'ล้างตัวกรอง',
    'audit.dateRange': 'ช่วงวันที่',
    'audit.from': 'จาก',
    'audit.to': 'ถึง',
    'audit.actionType': 'ประเภทการดำเนินการ',
    'audit.allActions': 'ทุกการดำเนินการ',
    'audit.allEntityTypes': 'ทุกประเภทข้อมูล',
    'audit.allStatuses': 'ทุกสถานะ',
    'audit.searchDetails': 'ค้นหารายละเอียด',
    'audit.statistics': 'สถิติ',
    'audit.totalLogs': 'รวมบันทึก',
    'audit.successCount': 'สำเร็จ',
    'audit.failureCount': 'ล้มเหลว',
    'audit.successRate': 'อัตราสำเร็จ',
    'audit.mostCommonActions': 'การดำเนินการที่พบบ่อย',
    'audit.mostAffectedEntities': 'ข้อมูลที่ถูกแก้ไขบ่อย',
    'audit.itemsPerPage': 'รายการต่อหน้า',
    'audit.page': 'หน้า',
    'audit.of': 'จาก',
    'audit.previous': 'ก่อนหน้า',
    'audit.next': 'ถัดไป',
    'audit.jumpToPage': 'ไปที่หน้า',
    'audit.noLogs': 'ไม่มีบันทึกการตรวจสอบ',
    'audit.viewDetails': 'ดูรายละเอียด',
    'audit.closeDetails': 'ปิดรายละเอียด',
    'audit.before': 'ก่อน',
    'audit.after': 'หลัง',
    'audit.fieldName': 'ชื่อฟิลด์',
    'audit.oldValue': 'ค่าเก่า',
    'audit.newValue': 'ค่าใหม่',
    'audit.dataType': 'ประเภทข้อมูล',
    'audit.noChanges': 'ไม่มีการเปลี่ยนแปลง',
    'audit.changesSummary': 'สรุปการเปลี่ยนแปลง',
    'audit.changesCount': 'ฟิลด์ที่เปลี่ยน',
    'audit.copyToClipboard': 'คัดลอกไปยังคลิปบอร์ด',
    'audit.copied': 'คัดลอกแล้ว',
    'audit.system': 'ระบบ',
    'audit.errorReason': 'สาหตุข้อผิดพลาด',
    'audit.showStatistics': 'แสดงสถิติ',
    'audit.hideStatistics': 'ซ่อนสถิติ',
    'audit.sortBy': 'เรียงตาม',
    'audit.sortNewest': 'ใหม่สุด',
    'audit.sortOldest': 'เก่าสุด',

    // Search
    'search.title': 'ค้นหา',
    'search.placeholder': 'ค้นหาคำสั่งซื้อ, สินค้า, เทมเพลต...',
    'search.searching': 'กำลังค้นหา...',
    'search.noResults.title': 'ไม่พบผลลัพธ์สำหรับ "{query}"',
    'search.noResults.suggestion': 'ลองใช้คำค้นหาอื่นหรือล้างตัวกรอง',
    'search.emptyState.title': 'เริ่มการค้นหา',
    'search.emptyState.description': 'ค้นหาข้ามคำสั่งซื้อ สินค้า และเทมเพลต',
    'search.resultCount': 'แสดง {start}-{end} จาก {count} ผลลัพธ์',
    'search.matchedFields': 'ฟิลด์ที่ตรงกัน',
    'search.copyId': 'คัดลอก ID',
    'search.modifiers': 'ตัวปรับแต่งการค้นหา',
    'search.modifiersHelp': 'ช่วยเหลือการค้นหา',
    'search.activeFilters': 'ตัวกรองที่ใช้งาน',
    'search.clearFilters': 'ล้างตัวกรอง',
    'search.clearAll': 'ล้างทั้งหมด',
    'search.sortBy': 'เรียงตาม',
    'search.sort.relevance': 'ความเกี่ยวข้อง',
    'search.sort.nameAsc': 'ชื่อ ก-ฮ',
    'search.sort.nameDesc': 'ชื่อ ฮ-ก',
    'search.sort.dateNew': 'ล่าสุด',
    'search.sort.dateOld': 'เก่าสุด',
    'search.sort.priceAsc': 'ราคาต่ำสุด',
    'search.sort.priceDesc': 'ราคาสูงสุด',
    'search.scope.all': 'ทั้งหมด',
    'search.scope.items': 'รายการ',
    'search.scope.products': 'สินค้า',
    'search.scope.orders': 'คำสั่งซื้อ',
    'search.scope.templates': 'เทมเพลต',
    'search.types.item': 'รายการ',
    'search.types.product': 'สินค้า',
    'search.types.order': 'คำสั่งซื้อ',
    'search.types.template': 'เทมเพลต',
    'search.saved': 'การค้นหาที่บันทึก',
    'search.saveSearch': 'บันทึกการค้นหา',
    'search.savedSearches': 'การค้นหาที่บันทึก',
    'search.history': 'ประวัติการค้นหา',
    'search.recent': 'ค้นหาล่าสุด',
    'search.popular': 'ยอดนิยม',
    'search.saveName': 'ชื่อการค้นหา',
    'search.deleteSearch': 'ลบการค้นหา',
    'search.loadSearch': 'โหลดการค้นหา',

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

    // Validation Errors
    'validation.errors.productNameRequired': 'ต้องระบุชื่อสินค้า',
    'validation.errors.productNameLength': 'ชื่อสินค้าต้องมีความยาว 1-255 ตัวอักษร',
    'validation.errors.quantityRequired': 'ต้องระบุจำนวน',
    'validation.errors.quantityInteger': 'จำนวนต้องเป็นจำนวนเต็ม',
    'validation.errors.quantityRange': 'จำนวนต้องอยู่ระหว่าง 1-999,999',
    'validation.errors.priceRequired': 'ต้องระบุราคา',
    'validation.errors.priceNumber': 'ราคาต้องเป็นตัวเลข',
    'validation.errors.priceRange': 'ราคาต้องอยู่ระหว่าง 0-9,999,999',
    'validation.errors.priceNegative': 'ราคาต้องไม่เป็นค่าติดลบ',
    'validation.errors.discountNumber': 'ส่วนลดต้องเป็นตัวเลข',
    'validation.errors.discountNegative': 'ส่วนลดต้องไม่เป็นค่าติดลบ',
    'validation.errors.discountPercentageRange': 'ส่วนลดแบบเปอร์เซ็นต์ต้องอยู่ระหว่าง 0-100',
    'validation.errors.discountExceedsPrice': 'ส่วนลดไม่สามารถเกินราคารวมได้',
    'validation.errors.taxRateNumber': 'อัตราภาษีต้องเป็นตัวเลข',
    'validation.errors.taxRateRange': 'อัตราภาษีต้องอยู่ระหว่าง 0-50',
    'validation.errors.itemsRequired': 'ต้องมีรายการสินค้า',
    'validation.errors.itemsArray': 'รายการสินค้าต้องเป็น array',
    'validation.errors.itemsEmpty': 'ต้องมีรายการสินค้าอย่างน้อย 1 รายการ',
    'validation.errors.customerNameString': 'ชื่อลูกค้าต้องเป็นข้อความ',
    'validation.errors.customerNameLength': 'ชื่อลูกค้าต้องมีอย่างน้อย 2 ตัวอักษร',
    'validation.errors.orderDateInvalid': 'วันที่ออเดอร์ไม่ถูกต้องหรืออยู่ในอนาคต',
    'validation.errors.statusInvalid': 'สถานะไม่ถูกต้อง',
    'validation.errors.productIdRequired': 'ต้องระบุรหัสสินค้า',
    'validation.errors.currentStockRequired': 'ต้องระบุสต๊อกปัจจุบัน',
    'validation.errors.currentStockNumber': 'สต๊อกปัจจุบันต้องเป็นตัวเลข',
    'validation.errors.currentStockNegative': 'สต๊อกปัจจุบันต้องไม่เป็นค่าติดลบ',
    'validation.errors.minimumStockRequired': 'ต้องระบุสต๊อกขั้นต่ำ',
    'validation.errors.minimumStockNumber': 'สต๊อกขั้นต่ำต้องเป็นตัวเลข',
    'validation.errors.minimumStockNegative': 'สต๊อกขั้นต่ำต้องไม่เป็นค่าติดลบ',
    'validation.errors.maximumStockRequired': 'ต้องระบุสต๊อกสูงสุด',
    'validation.errors.maximumStockNumber': 'สต๊อกสูงสุดต้องเป็นตัวเลข',
    'validation.errors.maximumStockNegative': 'สต๊อกสูงสุดต้องไม่เป็นค่าติดลบ',
    'validation.errors.maximumStockLessThanMinimum': 'สต๊อกสูงสุดต้องมากกว่าสต๊อกขั้นต่ำ',
    'validation.errors.reorderQuantityNumber': 'จำนวนสั่งซื้อใหม่ต้องเป็นตัวเลข',
    'validation.errors.reorderQuantityPositive': 'จำนวนสั่งซื้อใหม่ต้องเป็นค่าบวก',
    'validation.errors.taxNameRequired': 'ต้องระบุชื่อภาษี',
    'validation.errors.taxNameLength': 'ชื่อภาษีต้องมีความยาว 1-100 ตัวอักษร',
    'validation.errors.taxRateRequired': 'ต้องระบุอัตราภาษี',
    'validation.errors.taxTypeRequired': 'ต้องระบุประเภทภาษี',
    'validation.errors.taxTypeInvalid': 'ประเภทภาษีไม่ถูกต้อง',
    'validation.errors.taxCategoriesArray': 'หมวดหมู่ภาษีต้องเป็น array',
    'validation.errors.taxCategoryString': 'หมวดหมู่ภาษีต้องเป็นข้อความ',
    'validation.errors.newPriceRequired': 'ต้องระบุราคาใหม่',
    'validation.errors.newPriceNumber': 'ราคาใหม่ต้องเป็นตัวเลข',
    'validation.errors.newPriceNegative': 'ราคาใหม่ต้องไม่เป็นค่าติดลบ',
    'validation.errors.newPriceRange': 'ราคาใหม่ต้องอยู่ระหว่าง 0-9,999,999',
    'validation.errors.newQuantityRequired': 'ต้องระบุจำนวนใหม่',
    'validation.errors.newQuantityInteger': 'จำนวนใหม่ต้องเป็นจำนวนเต็ม',
    'validation.errors.newQuantityRange': 'จำนวนใหม่ต้องอยู่ระหว่าง 1-999,999',

    // Validation Warnings
    'validation.warnings.totalPriceMismatch': 'ราคารวมไม่ตรงกับที่คำนวณได้',
    'validation.warnings.stockBelowMinimum': 'สต๊อกต่ำกว่าระดับขั้นต่ำ',
    'validation.warnings.largePriceChange': 'การเปลี่ยนแปลงราคามีค่ามาก (>50%)',

    // Business Rules - Errors
    'business-rules.errors.priceNotPositive': 'ราคาต้องมากกว่า 0',
    'business-rules.errors.discountExceedsMaximum': 'ส่วนลดไม่สามารถเกิน 50% ได้',
    'business-rules.errors.insufficientStock': 'สต๊อกไม่เพียงพอ',
    'business-rules.errors.multipleVatTaxes': 'ไม่สามารถมีภาษี VAT มากกว่า 1 รายการได้',
    'business-rules.errors.invalidStatusTransition': 'การเปลี่ยนสถานะไม่ถูกต้อง',
    'business-rules.errors.cannotModifyFinalOrder': 'ไม่สามารถแก้ไขออเดอร์ที่เสร็จสมบูรณ์หรือยกเลิกแล้ว',
    'business-rules.errors.orderNoItems': 'ออเดอร์ต้องมีรายการสินค้าอย่างน้อย 1 รายการ',
    'business-rules.errors.templateNoItems': 'เทมเพลตต้องมีรายการสินค้าอย่างน้อย 1 รายการ',

    // Business Rules - Warnings
    'business-rules.warnings.bulkDiscountAvailable': 'มีส่วนลดสำหรับจำนวนมาก 5% (สำหรับ 100+ ชิ้น)',
    'business-rules.warnings.volumeDiscountAvailable': 'มีส่วนลดสำหรับปริมาณมาก 10% (สำหรับ 500+ ชิ้น)',
    'business-rules.warnings.stockBelowMinimum': 'สต๊อกต่ำกว่าระดับขั้นต่ำ',
    'business-rules.warnings.reorderPointReached': 'ถึงจุดสั่งซื้อใหม่แล้ว',
    'business-rules.warnings.slowMovingItem': 'สินค้าเคลื่อนไหวช้า (ไม่มีการขายใน 90 วัน)',
    'business-rules.warnings.taxRateInconsistent': 'อัตราภาษีไม่สอดคล้องกับภูมิภาค',
    'business-rules.warnings.templateDuplicateProducts': 'เทมเพลตมีสินค้าที่ซ้ำกับที่มีอยู่',

    // Business Rules - Conflicts
    'business-rules.conflicts.bulkVsVolume': 'ทั้งส่วนลดจำนวนมากและส่วนลดปริมาณมากสามารถใช้ได้',
    'business-rules.conflicts.useVolumeDiscount': 'ใช้ส่วนลดปริมาณมาก (10%) แทน',

    // Customer Management
    'customer.title': 'จัดการลูกค้า',
    'customer.customers': 'ลูกค้า',
    'customer.create': 'เพิ่มลูกค้า',
    'customer.createCustomer': 'สร้างลูกค้าใหม่',
    'customer.editCustomer': 'แก้ไขข้อมูลลูกค้า',
    'customer.deleteCustomer': 'ลบลูกค้า',
    'customer.deleteConfirm': 'คุณแน่ใจหรือไม่ว่าต้องการลบลูกค้านี้?',
    'customer.deleteError': 'เกิดข้อผิดพลาดในการลบลูกค้า',
    'customer.searchPlaceholder': 'ค้นหาลูกค้า...',
    'customer.filters': 'ตัวกรอง',
    'customer.name': 'ชื่อลูกค้า',
    'customer.email': 'อีเมล',
    'customer.phone': 'เบอร์โทรศัพท์',
    'customer.company': 'บริษัท',
    'customer.segment': 'กลุ่มลูกค้า',
    'customer.totalOrders': 'ยอดสั่งซื้อทั้งหมด',
    'customer.lifetimeValue': 'มูลค่าตลอดชีวิต',
    'customer.lastOrder': 'ออเดอร์ล่าสุด',
    'customer.active': 'ใช้งาน',
    'customer.inactive': 'ไม่ใช้งาน',
    'customer.selected': 'ที่เลือก',
    'customer.bulkActions': 'การดำเนินการจำนวนมาก',
    'customer.bulkAction': 'การดำเนินการ',
    'customer.selectAction': 'เลือกการดำเนินการ',
    'customer.addTag': 'เพิ่มแท็ก',
    'customer.removeTag': 'ลบแท็ก',
    'customer.updateSegment': 'อัปเดตกลุ่ม',
    'customer.updateStatus': 'อัปเดตสถานะ',
    'customer.tag': 'แท็ก',
    'customer.enterTag': 'ป้อนแท็ก',
    'customer.tags': 'แท็ก',
    'customer.selectSegment': 'เลือกกลุ่ม',
    'customer.selectStatus': 'เลือกสถานะ',
    'customer.apply': 'นำไปใช้',
    'customer.bulkSuccess': 'สำเร็จ',
    'customer.bulkFailed': 'ล้มเหลว',
    'customer.bulkError': 'เกิดข้อผิดพลาดในการดำเนินการจำนวนมาก',
    'customer.itemsPerPage': 'รายการต่อหน้า',
    'customer.page': 'หน้า',
    'customer.showing': 'แสดง',
    'customer.noCustomersFound': 'ไม่พบลูกค้า',
    'customer.sendEmail': 'ส่งอีเมล',
    'customer.customerSince': 'เป็นลูกค้าตั้งแต่',
    'customer.overview': 'ภาพรวม',
    'customer.purchaseHistory': 'ประวัติการซื้อ',
    'customer.notes': 'บันทึกย่อ',
    'customer.preferences': 'การตั้งค่า',
    'customer.communicationPreferences': 'การตั้งค่าการสื่อสาร',
    'customer.insights': 'ข้อมูลเชิงลึก',
    'customer.purchaseFrequency': 'ความถี่ในการซื้อ',
    'customer.churnRisk': 'ความเสี่ยงในการหมดไป',
    'customer.reorderLikelihood': 'โอกาสในการสั่งซื้อซ้ำ',
    'customer.topProducts': 'สินค้ายอดนิยม',
    'customer.units': 'หน่วย',
    'customer.order': 'ออเดอร์',
    'customer.noPurchaseHistory': 'ไม่มีประวัติการซื้อ',
    'customer.addNote': 'เพิ่มบันทึกย่อ',
    'customer.newsletter': 'จดหมายข่าว',
    'customer.sms': 'SMS',
    'customer.push': 'การแจ้งเตือน Push',
    'customer.newsletterDescription': 'รับจดหมายข่าวและข้อมูลอัปเดต',
    'customer.emailDescription': 'รับอีเมลเกี่ยวกับออเดอร์และโปรโมชัน',
    'customer.smsDescription': 'รับการแจ้งเตือน SMS',
    'customer.pushDescription': 'รับการแจ้งเตือนแบบพุช',
    'customer.quietHours': 'ช่วงเวลาเงียบ',
    'customer.startTime': 'เวลาเริ่มต้น',
    'customer.endTime': 'เวลาสิ้นสุด',
    'customer.basicInfo': 'ข้อมูลพื้นฐาน',
    'customer.activeCustomer': 'ลูกค้าที่ใช้งาน',
    'customer.addresses': 'ที่อยู่',
    'customer.addAddress': 'เพิ่มที่อยู่',
    'customer.shipping': 'จัดส่ง',
    'customer.billing': 'เรียกเก็บเงิน',
    'customer.defaultAddress': 'ที่อยู่เริ่มต้น',
    'customer.street': 'ถนน',
    'customer.city': 'เมือง',
    'customer.state': 'รัฐ/จังหวัด',
    'customer.postalCode': 'รหัสไปรษณีย์',
    'customer.country': 'ประเทศ',
    'customer.validation.nameRequired': 'กรุณากรอกชื่อลูกค้า',
    'customer.validation.emailRequired': 'กรุณากรอกอีเมล',
    'customer.validation.emailInvalid': 'รูปแบบอีเมลไม่ถูกต้อง',
    'customer.validation.phoneRequired': 'กรุณากรอกเบอร์โทรศัพท์',
    'customer.validation.saveError': 'เกิดข้อผิดพลาดในการบันทึก',
    'customer.minLifetimeValue': 'มูลค่าขั้นต่ำ',
    'customer.maxLifetimeValue': 'มูลค่าสูงสุด',
    'customer.avgOrderValue': 'มูลค่าเฉลี่ยต่อออเดอร์',
    'customer.noOrders': 'ไม่มีออเดอร์',
    'customer.today': 'วันนี้',
    'customer.yesterday': 'เมื่อวาน',
    'customer.daysAgo': '{days} วันที่แล้ว',
    'customer.weeksAgo': '{weeks} สัปดาห์ที่แล้ว',
    'customer.monthsAgo': '{months} เดือนที่แล้ว',
    'customer.yearsAgo': '{years} ปีที่แล้ว',
    'customer.never': 'ไม่เคย',
    'customer.days': 'วัน',
    'customer.noData': 'ไม่มีข้อมูล',
    'customer.stats.total': 'ลูกค้าทั้งหมด',
    'customer.stats.active': 'ใช้งาน',
    'customer.stats.inactive': 'ไม่ใช้งาน',
    'customer.stats.totalValue': 'มูลค่ารวม',
    'customer.stats.avgValue': 'มูลค่าเฉลี่ย',
    'customer.stats.totalOrders': 'ออเดอร์ทั้งหมด',
    'customer.stats.avgOrders': 'ออเดอร์เฉลี่ย',
    'customer.stats.bySegment': 'ตามกลุ่ม',

    // Customer Segments
    'customer.segment.title': 'กลุ่มลูกค้า',
    'customer.segment.description': 'จัดการและสร้างกลุ่มลูกค้า',
    'customer.segment.create': 'สร้างกลุ่มใหม่',
    'customer.segment.edit': 'แก้ไขกลุ่ม',
    'customer.segment.segments': 'กลุ่มลูกค้า',
    'customer.segment.name': 'ชื่อกลุ่ม',
    'customer.segment.namePlaceholder': 'เช่น ลูกค้า VIP',
    'customer.segment.descriptionPlaceholder': 'อธิบายกลุ่มนี้...',
    'customer.segment.rules': 'กฎ',
    'customer.segment.addRule': 'เพิ่มกฎ',
    'customer.segment.value': 'ค่า',
    'customer.segment.noRules': 'ไม่มีกฎ - คลิกเพิ่มกฎเพื่อเริ่มต้น',
    'customer.segment.previewCount': 'ลูกค้าที่ตรงกัน',
    'customer.segment.nameRequired': 'กรุณากรอกชื่อกลุ่ม',
    'customer.segment.saveError': 'เกิดข้อผิดพลาดในการบันทึกกลุ่ม',
    'customer.segment.deleteConfirm': 'คุณแน่ใจหรือไม่ว่าต้องการลบกลุ่มนี้?',
    'customer.segment.deleteError': 'เกิดข้อผิดพลาดในการลบกลุ่ม',
    'customer.segment.preview': 'ดูตัวอย่าง',
    'customer.segment.members': 'สมาชิก',
    'customer.segment.avgLtv': 'LTV เฉลี่ย',
    'customer.segment.avgOrders': 'ออเดอร์เฉลี่ย',
    'customer.segment.totalRevenue': 'รายได้รวม',
    'customer.segment.matchingCustomers': 'ลูกค้าที่ตรงกัน',
    'customer.segment.noSegments': 'ไม่มีกลุ่มลูกค้า',
    'customer.segment.createFirst': 'สร้างกลุ่มแรก',
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
    'common.view': 'View',
    'common.previous': 'Previous',
    'common.next': 'Next',

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

    // Bulk Operations
    'bulk.title': 'Bulk Operations',
    'bulk.selectItems': 'Select Items',
    'bulk.selectAll': 'Select All',
    'bulk.deselectAll': 'Deselect All',
    'bulk.operations': 'Operations',
    'bulk.operationType': 'Operation Type',
    'bulk.updatePrice': 'Update Price',
    'bulk.updateQuantity': 'Update Quantity',
    'bulk.applyDiscount': 'Apply Discount',
    'bulk.removeDiscount': 'Remove Discount',
    'bulk.deleteItems': 'Delete Items',
    'bulk.newPrice': 'New Price',
    'bulk.newQuantity': 'New Quantity',
    'bulk.discountPercent': 'Discount (%)',
    'bulk.execute': 'Execute',
    'bulk.processing': 'Processing...',
    'bulk.progress': 'Progress',
    'bulk.cancel': 'Cancel',
    'bulk.processed': 'Processed',
    'bulk.total': 'Total',
    'bulk.failed': 'Failed',
    'bulk.completed': 'Completed',
    'bulk.cancelled': 'Cancelled',
    'bulk.errors': 'Errors',
    'bulk.statistics': 'Statistics',
    'bulk.successRate': 'Success Rate',
    'bulk.totalItems': 'Total Items',
    'bulk.averageTime': 'Avg. Time',
    'bulk.history': 'History',
    'bulk.showHistory': 'Show History',
    'bulk.hideHistory': 'Hide History',
    'bulk.clearHistory': 'Clear History',
    'bulk.confirmOperation': 'Confirm Operation',
    'bulk.undo': 'Undo',
    'bulk.redo': 'Redo',

    // Audit Trail
    'audit.title': 'Audit Trail',
    'audit.auditTrail': 'Audit Trail',
    'audit.timestamp': 'Timestamp',
    'audit.action': 'Action',
    'audit.entityType': 'Entity Type',
    'audit.entityId': 'Entity ID',
    'audit.user': 'User',
    'audit.status': 'Status',
    'audit.changes': 'Changes',
    'audit.details': 'Details',
    'audit.success': 'Success',
    'audit.failed': 'Failed',
    'audit.export': 'Export',
    'audit.exportCSV': 'Export CSV',
    'audit.exportJSON': 'Export JSON',
    'audit.filters': 'Filters',
    'audit.clearFilters': 'Clear Filters',
    'audit.dateRange': 'Date Range',
    'audit.from': 'From',
    'audit.to': 'To',
    'audit.actionType': 'Action Type',
    'audit.allActions': 'All Actions',
    'audit.allEntityTypes': 'All Entity Types',
    'audit.allStatuses': 'All Statuses',
    'audit.searchDetails': 'Search Details',
    'audit.statistics': 'Statistics',
    'audit.totalLogs': 'Total Logs',
    'audit.successCount': 'Success',
    'audit.failureCount': 'Failed',
    'audit.successRate': 'Success Rate',
    'audit.mostCommonActions': 'Most Common Actions',
    'audit.mostAffectedEntities': 'Most Affected Entities',
    'audit.itemsPerPage': 'Items per page',
    'audit.page': 'Page',
    'audit.of': 'of',
    'audit.previous': 'Previous',
    'audit.next': 'Next',
    'audit.jumpToPage': 'Jump to page',
    'audit.noLogs': 'No audit logs found',
    'audit.viewDetails': 'View Details',
    'audit.closeDetails': 'Close Details',
    'audit.before': 'Before',
    'audit.after': 'After',
    'audit.fieldName': 'Field Name',
    'audit.oldValue': 'Old Value',
    'audit.newValue': 'New Value',
    'audit.dataType': 'Data Type',
    'audit.noChanges': 'No changes recorded',
    'audit.changesSummary': 'Changes Summary',
    'audit.changesCount': 'Changed Fields',
    'audit.copyToClipboard': 'Copy to Clipboard',
    'audit.copied': 'Copied!',
    'audit.system': 'System',
    'audit.errorReason': 'Error Reason',
    'audit.showStatistics': 'Show Statistics',
    'audit.hideStatistics': 'Hide Statistics',
    'audit.sortBy': 'Sort By',
    'audit.sortNewest': 'Newest First',
    'audit.sortOldest': 'Oldest First',

    // Search
    'search.title': 'Search',
    'search.placeholder': 'Search orders, products, templates...',
    'search.searching': 'Searching...',
    'search.noResults.title': 'No results found for "{query}"',
    'search.noResults.suggestion': 'Try different keywords or clear filters',
    'search.emptyState.title': 'Start Searching',
    'search.emptyState.description': 'Search across orders, products, and templates',
    'search.resultCount': 'Showing {start}-{end} of {count} results',
    'search.matchedFields': 'Matched fields',
    'search.copyId': 'Copy ID',
    'search.modifiers': 'Search Modifiers',
    'search.modifiersHelp': 'Search Help',
    'search.activeFilters': 'Active filters',
    'search.clearFilters': 'Clear filters',
    'search.clearAll': 'Clear all',
    'search.sortBy': 'Sort by',
    'search.sort.relevance': 'Relevance',
    'search.sort.nameAsc': 'Name A-Z',
    'search.sort.nameDesc': 'Name Z-A',
    'search.sort.dateNew': 'Newest First',
    'search.sort.dateOld': 'Oldest First',
    'search.sort.priceAsc': 'Price: Low to High',
    'search.sort.priceDesc': 'Price: High to Low',
    'search.scope.all': 'All',
    'search.scope.items': 'Items',
    'search.scope.products': 'Products',
    'search.scope.orders': 'Orders',
    'search.scope.templates': 'Templates',
    'search.types.item': 'Item',
    'search.types.product': 'Product',
    'search.types.order': 'Order',
    'search.types.template': 'Template',
    'search.saved': 'Saved Searches',
    'search.saveSearch': 'Save Search',
    'search.savedSearches': 'Saved Searches',
    'search.history': 'Search History',
    'search.recent': 'Recent Searches',
    'search.popular': 'Popular',
    'search.saveName': 'Search Name',
    'search.deleteSearch': 'Delete Search',
    'search.loadSearch': 'Load Search',

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

    // Validation Errors
    'validation.errors.productNameRequired': 'Product name is required',
    'validation.errors.productNameLength': 'Product name must be 1-255 characters',
    'validation.errors.quantityRequired': 'Quantity is required',
    'validation.errors.quantityInteger': 'Quantity must be an integer',
    'validation.errors.quantityRange': 'Quantity must be between 1-999,999',
    'validation.errors.priceRequired': 'Price is required',
    'validation.errors.priceNumber': 'Price must be a number',
    'validation.errors.priceRange': 'Price must be between 0-9,999,999',
    'validation.errors.priceNegative': 'Price cannot be negative',
    'validation.errors.discountNumber': 'Discount must be a number',
    'validation.errors.discountNegative': 'Discount cannot be negative',
    'validation.errors.discountPercentageRange': 'Discount percentage must be between 0-100',
    'validation.errors.discountExceedsPrice': 'Discount cannot exceed total price',
    'validation.errors.taxRateNumber': 'Tax rate must be a number',
    'validation.errors.taxRateRange': 'Tax rate must be between 0-50',
    'validation.errors.itemsRequired': 'Items are required',
    'validation.errors.itemsArray': 'Items must be an array',
    'validation.errors.itemsEmpty': 'Order must have at least 1 item',
    'validation.errors.customerNameString': 'Customer name must be a string',
    'validation.errors.customerNameLength': 'Customer name must be at least 2 characters',
    'validation.errors.orderDateInvalid': 'Order date is invalid or in the future',
    'validation.errors.statusInvalid': 'Status is invalid',
    'validation.errors.productIdRequired': 'Product ID is required',
    'validation.errors.currentStockRequired': 'Current stock is required',
    'validation.errors.currentStockNumber': 'Current stock must be a number',
    'validation.errors.currentStockNegative': 'Current stock cannot be negative',
    'validation.errors.minimumStockRequired': 'Minimum stock is required',
    'validation.errors.minimumStockNumber': 'Minimum stock must be a number',
    'validation.errors.minimumStockNegative': 'Minimum stock cannot be negative',
    'validation.errors.maximumStockRequired': 'Maximum stock is required',
    'validation.errors.maximumStockNumber': 'Maximum stock must be a number',
    'validation.errors.maximumStockNegative': 'Maximum stock cannot be negative',
    'validation.errors.maximumStockLessThanMinimum': 'Maximum stock must be greater than minimum stock',
    'validation.errors.reorderQuantityNumber': 'Reorder quantity must be a number',
    'validation.errors.reorderQuantityPositive': 'Reorder quantity must be positive',
    'validation.errors.taxNameRequired': 'Tax name is required',
    'validation.errors.taxNameLength': 'Tax name must be 1-100 characters',
    'validation.errors.taxRateRequired': 'Tax rate is required',
    'validation.errors.taxTypeRequired': 'Tax type is required',
    'validation.errors.taxTypeInvalid': 'Tax type is invalid',
    'validation.errors.taxCategoriesArray': 'Tax categories must be an array',
    'validation.errors.taxCategoryString': 'Tax category must be a string',
    'validation.errors.newPriceRequired': 'New price is required',
    'validation.errors.newPriceNumber': 'New price must be a number',
    'validation.errors.newPriceNegative': 'New price cannot be negative',
    'validation.errors.newPriceRange': 'New price must be between 0-9,999,999',
    'validation.errors.newQuantityRequired': 'New quantity is required',
    'validation.errors.newQuantityInteger': 'New quantity must be an integer',
    'validation.errors.newQuantityRange': 'New quantity must be between 1-999,999',

    // Validation Warnings
    'validation.warnings.totalPriceMismatch': 'Total price does not match calculated value',
    'validation.warnings.stockBelowMinimum': 'Stock is below minimum level',
    'validation.warnings.largePriceChange': 'Large price change (>50%)',

    // Business Rules - Errors
    'business-rules.errors.priceNotPositive': 'Price must be greater than 0',
    'business-rules.errors.discountExceedsMaximum': 'Discount cannot exceed 50%',
    'business-rules.errors.insufficientStock': 'Insufficient stock available',
    'business-rules.errors.multipleVatTaxes': 'Cannot have more than one VAT tax',
    'business-rules.errors.invalidStatusTransition': 'Invalid status transition',
    'business-rules.errors.cannotModifyFinalOrder': 'Cannot modify completed or cancelled orders',
    'business-rules.errors.orderNoItems': 'Order must have at least 1 item',
    'business-rules.errors.templateNoItems': 'Template must have at least 1 item',

    // Business Rules - Warnings
    'business-rules.warnings.bulkDiscountAvailable': 'Bulk discount 5% available (for 100+ units)',
    'business-rules.warnings.volumeDiscountAvailable': 'Volume discount 10% available (for 500+ units)',
    'business-rules.warnings.stockBelowMinimum': 'Stock is below minimum level',
    'business-rules.warnings.reorderPointReached': 'Reorder point reached',
    'business-rules.warnings.slowMovingItem': 'Slow-moving item (no sales in 90 days)',
    'business-rules.warnings.taxRateInconsistent': 'Tax rate inconsistent with region',
    'business-rules.warnings.templateDuplicateProducts': 'Template contains duplicate products',

    // Business Rules - Conflicts
    'business-rules.conflicts.bulkVsVolume': 'Both bulk and volume discounts are applicable',
    'business-rules.conflicts.useVolumeDiscount': 'Use volume discount (10%) instead',

    // Customer Management
    'customer.title': 'Customer Management',
    'customer.customers': 'Customers',
    'customer.create': 'Add Customer',
    'customer.createCustomer': 'Create New Customer',
    'customer.editCustomer': 'Edit Customer',
    'customer.deleteCustomer': 'Delete Customer',
    'customer.deleteConfirm': 'Are you sure you want to delete this customer?',
    'customer.deleteError': 'Error deleting customer',
    'customer.searchPlaceholder': 'Search customers...',
    'customer.filters': 'Filters',
    'customer.name': 'Customer Name',
    'customer.email': 'Email',
    'customer.phone': 'Phone',
    'customer.company': 'Company',
    'customer.segment': 'Segment',
    'customer.totalOrders': 'Total Orders',
    'customer.lifetimeValue': 'Lifetime Value',
    'customer.lastOrder': 'Last Order',
    'customer.active': 'Active',
    'customer.inactive': 'Inactive',
    'customer.selected': 'Selected',
    'customer.bulkActions': 'Bulk Actions',
    'customer.bulkAction': 'Action',
    'customer.selectAction': 'Select Action',
    'customer.addTag': 'Add Tag',
    'customer.removeTag': 'Remove Tag',
    'customer.updateSegment': 'Update Segment',
    'customer.updateStatus': 'Update Status',
    'customer.tag': 'Tag',
    'customer.enterTag': 'Enter tag',
    'customer.tags': 'Tags',
    'customer.selectSegment': 'Select Segment',
    'customer.selectStatus': 'Select Status',
    'customer.apply': 'Apply',
    'customer.bulkSuccess': 'Success',
    'customer.bulkFailed': 'Failed',
    'customer.bulkError': 'Bulk operation error',
    'customer.itemsPerPage': 'Items per page',
    'customer.page': 'Page',
    'customer.showing': 'Showing',
    'customer.noCustomersFound': 'No customers found',
    'customer.sendEmail': 'Send Email',
    'customer.customerSince': 'Customer since',
    'customer.overview': 'Overview',
    'customer.purchaseHistory': 'Purchase History',
    'customer.notes': 'Notes',
    'customer.preferences': 'Preferences',
    'customer.communicationPreferences': 'Communication Preferences',
    'customer.insights': 'Insights',
    'customer.purchaseFrequency': 'Purchase Frequency',
    'customer.churnRisk': 'Churn Risk',
    'customer.reorderLikelihood': 'Reorder Likelihood',
    'customer.topProducts': 'Top Products',
    'customer.units': 'units',
    'customer.order': 'Order',
    'customer.noPurchaseHistory': 'No purchase history',
    'customer.addNote': 'Add Note',
    'customer.newsletter': 'Newsletter',
    'customer.sms': 'SMS',
    'customer.push': 'Push Notifications',
    'customer.newsletterDescription': 'Receive newsletters and updates',
    'customer.emailDescription': 'Receive emails about orders and promotions',
    'customer.smsDescription': 'Receive SMS notifications',
    'customer.pushDescription': 'Receive push notifications',
    'customer.quietHours': 'Quiet Hours',
    'customer.startTime': 'Start Time',
    'customer.endTime': 'End Time',
    'customer.basicInfo': 'Basic Information',
    'customer.activeCustomer': 'Active Customer',
    'customer.addresses': 'Addresses',
    'customer.addAddress': 'Add Address',
    'customer.shipping': 'Shipping',
    'customer.billing': 'Billing',
    'customer.defaultAddress': 'Default Address',
    'customer.street': 'Street',
    'customer.city': 'City',
    'customer.state': 'State/Province',
    'customer.postalCode': 'Postal Code',
    'customer.country': 'Country',
    'customer.validation.nameRequired': 'Customer name is required',
    'customer.validation.emailRequired': 'Email is required',
    'customer.validation.emailInvalid': 'Invalid email format',
    'customer.validation.phoneRequired': 'Phone number is required',
    'customer.validation.saveError': 'Error saving customer',
    'customer.minLifetimeValue': 'Min Lifetime Value',
    'customer.maxLifetimeValue': 'Max Lifetime Value',
    'customer.avgOrderValue': 'Avg Order Value',
    'customer.noOrders': 'No orders',
    'customer.today': 'Today',
    'customer.yesterday': 'Yesterday',
    'customer.daysAgo': '{days} days ago',
    'customer.weeksAgo': '{weeks} weeks ago',
    'customer.monthsAgo': '{months} months ago',
    'customer.yearsAgo': '{years} years ago',
    'customer.never': 'Never',
    'customer.days': 'days',
    'customer.noData': 'No data',
    'customer.stats.total': 'Total Customers',
    'customer.stats.active': 'Active',
    'customer.stats.inactive': 'Inactive',
    'customer.stats.totalValue': 'Total Value',
    'customer.stats.avgValue': 'Avg Value',
    'customer.stats.totalOrders': 'Total Orders',
    'customer.stats.avgOrders': 'Avg Orders',
    'customer.stats.bySegment': 'By Segment',

    // Customer Segments
    'customer.segment.title': 'Customer Segments',
    'customer.segment.description': 'Manage and create customer segments',
    'customer.segment.create': 'Create Segment',
    'customer.segment.edit': 'Edit Segment',
    'customer.segment.segments': 'Segments',
    'customer.segment.name': 'Segment Name',
    'customer.segment.namePlaceholder': 'e.g., VIP Customers',
    'customer.segment.descriptionPlaceholder': 'Describe this segment...',
    'customer.segment.rules': 'Rules',
    'customer.segment.addRule': 'Add Rule',
    'customer.segment.value': 'Value',
    'customer.segment.noRules': 'No rules - Click Add Rule to start',
    'customer.segment.previewCount': 'Matching customers',
    'customer.segment.nameRequired': 'Segment name is required',
    'customer.segment.saveError': 'Error saving segment',
    'customer.segment.deleteConfirm': 'Are you sure you want to delete this segment?',
    'customer.segment.deleteError': 'Error deleting segment',
    'customer.segment.preview': 'Preview',
    'customer.segment.members': 'Members',
    'customer.segment.avgLtv': 'Avg LTV',
    'customer.segment.avgOrders': 'Avg Orders',
    'customer.segment.totalRevenue': 'Total Revenue',
    'customer.segment.matchingCustomers': 'Matching Customers',
    'customer.segment.noSegments': 'No customer segments',
    'customer.segment.createFirst': 'Create first segment',
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
export function t(key: string, params?: Record<string, any> | Language, language?: Language): string {
  // Handle overloaded signature
  let lang: Language;
  let variables: Record<string, any> | undefined;

  if (typeof params === 'string') {
    lang = params;
    variables = undefined;
  } else {
    lang = language || getCurrentLanguage();
    variables = params;
  }

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
    value = enValue || key;
  }

  const result = value || key;

  // Replace template variables if provided
  if (variables && typeof result === 'string') {
    return result.replace(/\{(\w+)\}/g, (match, varName) => {
      return variables[varName] !== undefined ? String(variables[varName]) : match;
    });
  }

  return result;
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
