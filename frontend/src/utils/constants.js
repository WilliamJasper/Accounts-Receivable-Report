/**
 * Column definitions, key sets, and static constants used across CheckStatus tabs.
 */

export const CLAIM_COLUMNS = [
    { key: 'JOBNO', label: 'รหัสงาน' },
    { key: 'TAXNO', label: 'เลขที่ใบกำกับ' },
    { key: 'TAXDATE', label: 'วันที่' },
    { key: 'CUSNAM', label: 'ชื่อลูกค้า' },
    { key: 'MDLCOD', label: 'รุ่น' },
    { key: 'STRNO', label: 'เลขตัวถัง' },
    { key: 'SERVNET', label: 'ค่าแรง' },
    { key: 'SERVCOS', label: 'ต้นทุนค่าแรง' },
    { key: 'SERVPRF', label: 'กำไรค่าแรง' },
    { key: 'PARTNET', label: 'ค่าอะไหล่' },
    { key: 'PARTCOS', label: 'ต้นทุนอะไหล่' },
    { key: 'PARTPRF', label: 'กำไรอะไหล่' },
    { key: 'OILNET', label: 'ค่าน้ำมัน' },
    { key: 'OILCOS', label: 'ต้นทุนน้ำมัน' },
    { key: 'OILPRF', label: 'กำไรน้ำมัน' },
    { key: 'OUTNET', label: 'งานนอก' },
    { key: 'OUTCOS', label: 'ต้นทุนงานนอก' },
    { key: 'OUTPRF', label: 'กำไรงานนอก' },
    { key: 'COLRNET', label: 'งานสี' },
    { key: 'COLRCOS', label: 'ต้นทุนงานสี' },
    { key: 'COLRPRF', label: 'กำไรงานสี' },
    { key: 'TOTALNET', label: 'ยอดรวม' },
    { key: 'TOTALCOS', label: 'ต้นทุนรวม' },
    { key: 'TOTALPRF', label: 'กำไรรวม' },
    { key: 'TOTALNET_VAT', label: 'มูลค่าก่อนVAT' },
    { key: 'TaxAmount', label: 'ภาษี' },
    { key: 'GrossAmount', label: 'ยอดรวมภาษี' },
];

export const NUM_KEYS = new Set([
    'SERVNET', 'SERVCOS', 'SERVPRF', 'PARTNET', 'PARTCOS', 'PARTPRF',
    'OILNET', 'OILCOS', 'OILPRF', 'OUTNET', 'OUTCOS', 'OUTPRF',
    'COLRNET', 'COLRCOS', 'COLRPRF', 'TOTALNET', 'TOTALCOS', 'TOTALPRF', 'TOTALNET_VAT',
    'TaxAmount', 'GrossAmount',
]);

export const DATE_KEYS = new Set(['TAXDATE', 'JOBDATE']);

export const OFFICER_COLUMNS = [
    { key: 'NAME', label: 'ชื่อ', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', iconColor: 'text-orange-400' },
    { key: 'DEPCODE', label: 'แผนก', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', iconColor: 'text-blue-400' },
    { key: 'LOCAT', label: 'สาขา', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', iconColor: 'text-green-400' },
    { key: 'OFFTYPE', label: 'ตำแหน่ง', icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2', iconColor: 'text-purple-400' },
    { key: 'UNIT', label: 'หน่วย', editable: true, icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z', iconColor: 'text-yellow-400' },
    { key: 'WORKDAYS', label: 'วันทำงาน', editable: true, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', iconColor: 'text-cyan-400' },
    { key: 'REWARD', label: 'เงินรางวัล', editable: true, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', iconColor: 'text-blue-400' },
    { key: 'PROMO', label: 'ค่าส่งเสริม', editable: true, icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', iconColor: 'text-amber-400' },
    { key: 'PLUS', label: 'บวกเพิ่ม', editable: true, icon: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z', iconColor: 'text-green-400' },
    { key: 'MINUS', label: 'หัก', editable: true, icon: 'M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z', iconColor: 'text-red-400' },
    { key: 'SAVING', label: 'หักสะสม 10%', editable: true, icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', iconColor: 'text-pink-400' },
    { key: 'NET', label: 'รวมสุทธิ', editable: false, icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z', iconColor: 'text-emerald-400' },
    { key: 'SIGN', label: 'ลายเซ็นต์', editable: true, icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z', iconColor: 'text-slate-400' },
];

export const MANUAL_COLS = [
    { key: 'code', label: 'รหัส', w: 'w-24', icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2', iconColor: 'text-blue-500' },
    { key: 'name', label: 'ชื่อ-พนักงาน', w: 'w-56', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', iconColor: 'text-orange-500' },
    { key: 'pos', label: 'ตำแหน่ง', w: 'w-48', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', iconColor: 'text-purple-500' },
    { key: 'comm', label: 'ค่าคอม', w: 'w-32', isNum: true, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', iconColor: 'text-yellow-500' },
    { key: 'promo', label: 'ค่าส่งเสริม', w: 'w-32', isNum: true, icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', iconColor: 'text-amber-500' },
    { key: 'plus', label: 'บวกเพิ่ม', w: 'w-24', isNum: true, icon: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z', iconColor: 'text-green-500' },
    { key: 'csRefund', label: 'คืนเงิน CS', w: 'w-24', isNum: true, icon: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6', iconColor: 'text-teal-500' },
    { key: 'csDebt', label: 'หักหนี้/CS', w: 'w-32', isNum: true, icon: 'M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z', iconColor: 'text-red-500' },
    { key: 'saving', label: 'หักสะสม 10%', w: 'w-32', isNum: true, icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', iconColor: 'text-pink-500' },
    { key: 'net', label: 'ยอดสุทธิ', w: 'w-32', isNum: true, readOnly: true, icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z', iconColor: 'text-emerald-500' },
    { key: 'note', label: 'หมายเหตุ', w: 'w-48', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z', iconColor: 'text-slate-400' },
];

export const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const BREAKDOWN_UNITS = [1.50, 1.25, 1.00, 0.75, 0.63, 0.50, 0.35];
