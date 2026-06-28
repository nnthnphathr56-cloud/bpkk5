/**
 * ระบบอนามัยโรงเรียนบ้านไผ่ — Google Sheets Backend
 * Sheet: https://docs.google.com/spreadsheets/d/15IlAOVYRi3MixwzvhwO10ZkDonm_oam_wzSM-3-BpIw
 *
 * Deploy Web App:
 *   Execute as: Me
 *   Who has access: Anyone (ถ้า Workspace ไม่มี Anyone ให้ใช้ Anyone in organization
 *   แล้วผู้ใช้ต้องล็อกอิน @banphai.ac.th ใน Chrome ขณะใช้เว็บ)
 */

var SPREADSHEET_ID = '15IlAOVYRi3MixwzvhwO10ZkDonm_oam_wzSM-3-BpIw';

var SHEET_SCHEMAS = {
  'บันทึกการรักษา': [
    'วันที่เวลา', 'รหัส', 'ชื่อ-นามสกุล', 'ชั้น/ตำแหน่ง', 'ประเภทผู้รับบริการ',
    'อาการ/ปัญหาสุขภาพ', 'อุณหภูมิ(°C)', 'ความดันโลหิต', 'ชีพจร', 'การวินิจฉัยเบื้องต้น',
    'การรักษาและยา', 'ผลการรักษา', 'ผู้ให้บริการ', 'บทบาทผู้บันทึก'
  ],
  'ภาวะโภชนาการ': [
    'วันที่บันทึก', 'รหัสนักเรียน', 'ชื่อ-นามสกุล', 'ชั้น', 'เพศ', 'อายุ',
    'น้ำหนัก(kg)', 'ส่วนสูง(cm)', 'BMI', 'สถานะโภชนาการ', 'บทบาทผู้บันทึก'
  ],
  'วัคซีน': [
    'เลขประจำตัว', 'ชื่อนามสกุล', 'วัคซีนที่ฉีด', 'วันที่ฉีด', 'วันที่บันทึก', 'บทบาทผู้บันทึก'
  ],
  'โรคเรื้อรัง': [
    'วันที่บันทึก', 'รหัสนักเรียน', 'ชื่อ-นามสกุล', 'ชั้น', 'โรคประจำตัว',
    'ยาที่ใช้', 'เบอร์ติดต่อฉุกเฉิน', 'หมายเหตุ', 'บทบาทผู้บันทึก'
  ],
  'รายงานโรคติดต่อ_นักเรียน': [
    'วันที่รายงาน', 'รหัสนักเรียน', 'ชื่อ-นามสกุล', 'โรคที่พบ/สงสัย',
    'วันที่เริ่มมีอาการ', 'อาการ/รายละเอียด', 'สถานะ'
  ],
  'รายงานโรคติดต่อ_เจ้าหน้าที่': [
    'วันที่รายงาน', 'โรคที่พบ', 'จำนวนผู้ป่วย', 'ห้องเรียน/กลุ่ม', 'วันที่เริ่มพบ',
    'มาตรการที่ดำเนินการ', 'บทบาทผู้บันทึก'
  ],
  'เหตุฉุกเฉิน': [
    'วันที่เวลา', 'ชื่อผู้บาดเจ็บ/เจ็บป่วย', 'ประเภทเหตุการณ์', 'สถานที่เกิดเหตุ',
    'การปฐมพยาบาล', 'ผลลัพธ์', 'บทบาทผู้บันทึก'
  ],
  'อนามัยสิ่งแวดล้อม': [
    'วันที่ตรวจ', 'ผลการตรวจ', 'รายการที่ผ่าน', 'รายการที่ยังไม่ผ่าน', 'ผู้บันทึก'
  ]
};

/** คีย์จากเว็บ → คีย์ในชีต (รองรับหัวคอลัมน์หลายแบบ) */
var FIELD_ALIASES = {
  'เลขประจำตัว': ['รหัสนักเรียน', 'รหัส', 'id'],
  'ชื่อนามสกุล': ['ชื่อ-นามสกุล', 'ชื่อ', 'name'],
  'วัคซีนที่ฉีด': ['วัคซีน', 'vaccine'],
  'วันที่ฉีด': ['date'],
  'วันที่บันทึก': ['recordedAt'],
  'วันที่เวลา': ['recordedAt', 'eventAt'],
  'รหัสนักเรียน': ['รหัส', 'id', 'เลขประจำตัว'],
  'ชื่อ-นามสกุล': ['ชื่อนามสกุล', 'name'],
  'โรคที่พบ/สงสัย': ['disease'],
  'อาการ/รายละเอียด': ['note'],
  'ชั้น/ตำแหน่ง': ['class'],
  'อาการ/ปัญหาสุขภาพ': ['symptom'],
  'อุณหภูมิ(°C)': ['temp'],
  'ความดันโลหิต': ['bp'],
  'ชีพจร': ['pulse'],
  'การวินิจฉัยเบื้องต้น': ['diagnosis'],
  'การรักษาและยา': ['treatment'],
  'ผลการรักษา': ['result'],
  'ผู้ให้บริการ': ['provider'],
  'ชื่อผู้บาดเจ็บ/เจ็บป่วย': ['name'],
  'ประเภทเหตุการณ์': ['type'],
  'สถานที่เกิดเหตุ': ['location'],
  'การปฐมพยาบาล': ['firstaid'],
  'ผลลัพธ์': ['result'],
  'โรคประจำตัว': ['disease'],
  'ยาที่ใช้': ['medicine'],
  'เบอร์ติดต่อฉุกเฉิน': ['phone'],
  'หมายเหตุ': ['note'],
  'น้ำหนัก(kg)': ['weight', 'น้ำหนัก', 'น้ำหนัก(กก.)', 'น้ำหนัก (kg)', 'น้ำหนัก (กก.)'],
  'น้ำหนัก': ['weight', 'น้ำหนัก(kg)', 'น้ำหนัก(กก.)', 'น้ำหนัก (kg)', 'น้ำหนัก (กก.)'],
  'ส่วนสูง(cm)': ['height', 'ส่วนสูง', 'ส่วนสูง(ซม.)', 'ส่วนสูง (cm)', 'ส่วนสูง (ซม.)'],
  'ส่วนสูง': ['height', 'ส่วนสูง(cm)', 'ส่วนสูง(ซม.)', 'ส่วนสูง (cm)', 'ส่วนสูง (ซม.)'],
  'BMI': ['bmi'],
  'ชั้น': ['class'],
  'เพศ': ['sex'],
  'อายุ': ['age'],
  'สถานะโภชนาการ': ['category'],
  'โรคที่พบ': ['disease'],
  'จำนวนผู้ป่วย': ['patients'],
  'ห้องเรียน/กลุ่ม': ['room'],
  'วันที่เริ่มพบ': ['startDate', 'symptomDate'],
  'มาตรการที่ดำเนินการ': ['measures'],
  'ผลการตรวจ': ['passCount'],
  'รายการที่ผ่าน': ['passed'],
  'รายการที่ยังไม่ผ่าน': ['failed']
};

function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.payload) {
      return handlePayload_(decodeURIComponent(e.parameter.payload));
    }
    return jsonResponse_({ ok: true, message: 'School Health Sheets API is running' });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  try {
    var raw = '';
    if (e && e.postData && e.postData.contents) {
      raw = e.postData.contents;
    } else if (e && e.parameter && e.parameter.payload) {
      raw = e.parameter.payload;
    }
    if (!raw) throw new Error('Empty request body');
    return handlePayload_(raw);
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err.message || err) });
  }
}

function handlePayload_(raw) {
  var body = JSON.parse(raw);
  var sheetName = body.sheet;
  var row = body.row || body.values || {};
  if (!sheetName || !SHEET_SCHEMAS[sheetName]) {
    throw new Error('Unknown sheet: ' + sheetName);
  }
  var rowNum = appendRow_(sheetName, row);
  return jsonResponse_({ ok: true, sheet: sheetName, row: rowNum });
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSpreadsheet_() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (e) {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
    throw e;
  }
}

function normalizeHeaderKey_(s) {
  return String(s || '').trim().replace(/\s+/g, '').toLowerCase();
}

function getValueForHeader_(header, rowObject) {
  if (rowObject[header] !== undefined && rowObject[header] !== null && rowObject[header] !== '') {
    return rowObject[header];
  }
  var aliases = FIELD_ALIASES[header] || [];
  for (var i = 0; i < aliases.length; i++) {
    var k = aliases[i];
    if (rowObject[k] !== undefined && rowObject[k] !== null && rowObject[k] !== '') {
      return rowObject[k];
    }
  }
  var nh = normalizeHeaderKey_(header);
  var keys = Object.keys(rowObject);
  for (var j = 0; j < keys.length; j++) {
    if (normalizeHeaderKey_(keys[j]) === nh) {
      var v = rowObject[keys[j]];
      if (v !== undefined && v !== null && v !== '') return v;
    }
  }
  if (nh.indexOf('น้ำหนัก') !== -1 || nh === 'weight') {
    for (var w = 0; w < keys.length; w++) {
      var lkw = normalizeHeaderKey_(keys[w]);
      if (lkw.indexOf('น้ำหนัก') !== -1 || lkw === 'weight') {
        var vw = rowObject[keys[w]];
        if (vw !== undefined && vw !== null && vw !== '') return vw;
      }
    }
  }
  if (nh.indexOf('ส่วนสูง') !== -1 || nh === 'height') {
    for (var h = 0; h < keys.length; h++) {
      var lkh = normalizeHeaderKey_(keys[h]);
      if (lkh.indexOf('ส่วนสูง') !== -1 || lkh === 'height') {
        var vh = rowObject[keys[h]];
        if (vh !== undefined && vh !== null && vh !== '') return vh;
      }
    }
  }
  if (nh === 'bmi') {
    for (var b = 0; b < keys.length; b++) {
      if (normalizeHeaderKey_(keys[b]) === 'bmi') {
        var vb = rowObject[keys[b]];
        if (vb !== undefined && vb !== null && vb !== '') return vb;
      }
    }
  }
  return '';
}

function getSheetHeaders_(sheet, sheetName) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var row1 = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var headers = [];
  for (var i = 0; i < row1.length; i++) {
    if (row1[i] !== '' && row1[i] != null) headers.push(String(row1[i]));
  }
  if (headers.length) return headers;
  return SHEET_SCHEMAS[sheetName].slice();
}

function ensureSheet_(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  var headers = getSheetHeaders_(sheet, sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    styleHeaderRow_(sheet, headers.length);
  }
  return sheet;
}

function styleHeaderRow_(sheet, colCount) {
  var headerRange = sheet.getRange(1, 1, 1, colCount);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#dcfce7');
  headerRange.setFontColor('#0a3d28');
  sheet.setFrozenRows(1);
}

function appendRow_(sheetName, rowObject) {
  var ss = getSpreadsheet_();
  var sheet = ensureSheet_(ss, sheetName);
  var headers = getSheetHeaders_(sheet, sheetName);
  if (Array.isArray(rowObject)) {
    sheet.appendRow(rowObject.map(function(v) { return v == null ? '' : String(v); }));
  } else {
    var values = headers.map(function(h) {
      var v = getValueForHeader_(h, rowObject);
      if (Array.isArray(v)) return v.join(', ');
      return v === undefined || v === null ? '' : String(v);
    });
    sheet.appendRow(values);
  }
  SpreadsheetApp.flush();
  return sheet.getLastRow();
}

function appendRow(sheetName, rowObject) {
  return appendRow_(sheetName, rowObject);
}

function setupAllSheets() {
  var ss = getSpreadsheet_();
  Object.keys(SHEET_SCHEMAS).forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(SHEET_SCHEMAS[name]);
      styleHeaderRow_(sheet, SHEET_SCHEMAS[name].length);
    }
  });
  SpreadsheetApp.flush();
}

function testAppend() {
  appendRow_('วัคซีน', {
    'เลขประจำตัว': 'TEST001',
    'ชื่อนามสกุล': 'ทดสอบ ระบบ',
    'วัคซีนที่ฉีด': 'BCG',
    'วันที่ฉีด': '1/1/2569',
    'วันที่บันทึก': new Date().toLocaleString('th-TH'),
    'บทบาทผู้บันทึก': 'ทดสอบ Apps Script'
  });
}
