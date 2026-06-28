/**
 * ส่งข้อมูลจากเว็บไซต์ → Google Sheets (Apps Script Web App)
 */
var SHEETS_CONFIG = {
  ENABLED: true,
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbyxq9dSzLRjZIddQt8_Dxgoey48FNdx5_LXFsIchfBlUN_fGfHLXf8_YCsCiz5RVvCXHA/exec',
  SPREADSHEET_ID: '15IlAOVYRi3MixwzvhwO10ZkDonm_oam_wzSM-3-BpIw',
  QUEUE_KEY: 'sh-sheets-queue',
  IS_WORKSPACE: false
};

var SHEET_NAMES = {
  visit: 'บันทึกการรักษา',
  nutrition: 'ภาวะโภชนาการ',
  vaccine: 'วัคซีน',
  chronic: 'โรคเรื้อรัง',
  diseaseStudent: 'รายงานโรคติดต่อ_นักเรียน',
  diseaseStaff: 'รายงานโรคติดต่อ_เจ้าหน้าที่',
  emergency: 'เหตุฉุกเฉิน',
  environment: 'อนามัยสิ่งแวดล้อม'
};

function getSyncRoleLabel() {
  if (typeof getCurrentRole !== 'function') return '';
  var map = {
    nurse: 'เจ้าหน้าที่อนามัย',
    teacher: 'ครู',
    admin: 'ผู้บริหาร',
    student: 'นักเรียน'
  };
  return map[getCurrentRole()] || getCurrentRole() || '';
}

function ensureSheetSyncDom_() {
  if (document.getElementById('sheet-sync-form')) return;
  var form = document.createElement('form');
  form.id = 'sheet-sync-form';
  form.method = 'POST';
  form.action = SHEETS_CONFIG.WEB_APP_URL;
  form.target = 'sheet-sync-frame';
  form.style.display = 'none';
  form.setAttribute('accept-charset', 'UTF-8');
  var input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'payload';
  form.appendChild(input);
  document.body.appendChild(form);
  var iframe = document.createElement('iframe');
  iframe.id = 'sheet-sync-frame';
  iframe.name = 'sheet-sync-frame';
  iframe.title = 'sheet-sync';
  iframe.style.cssText = 'display:none;width:0;height:0;border:0';
  document.body.appendChild(iframe);
}

function showSheetToast_(msg, isError) {
  var el = document.getElementById('sheet-sync-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sheet-sync-toast';
    el.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:99999;max-width:320px;padding:10px 14px;border-radius:10px;font-size:13px;line-height:1.4;box-shadow:0 4px 16px rgba(0,0,0,.15);display:none';
    document.body.appendChild(el);
  }
  el.style.background = isError ? '#fef2f2' : '#ecfdf5';
  el.style.color = isError ? '#991b1b' : '#065f46';
  el.style.border = isError ? '1px solid #fecaca' : '1px solid #a7f3d0';
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(function() { el.style.display = 'none'; }, isError ? 8000 : 4000);
}

function loadSheetQueue_() {
  try { return JSON.parse(localStorage.getItem(SHEETS_CONFIG.QUEUE_KEY) || '[]'); } catch (e) { return []; }
}

function saveSheetQueue_(items) {
  try { localStorage.setItem(SHEETS_CONFIG.QUEUE_KEY, JSON.stringify(items)); } catch (e) {}
}

function enqueueSheetSync_(sheetName, row) {
  var q = loadSheetQueue_();
  q.push({ sheet: sheetName, row: row, at: Date.now() });
  saveSheetQueue_(q);
}

function buildPayload_(sheetName, row) {
  return { sheet: sheetName, row: row };
}

function syncViaHiddenForm_(payload) {
  ensureSheetSyncDom_();
  var form = document.getElementById('sheet-sync-form');
  form.action = SHEETS_CONFIG.WEB_APP_URL;
  form.querySelector('input[name="payload"]').value = JSON.stringify(payload);
  form.submit();
}

function syncViaPopup_(payload) {
  var url = SHEETS_CONFIG.WEB_APP_URL + '?payload=' + encodeURIComponent(JSON.stringify(payload));
  var w = window.open(url, 'sh_sheet_sync', 'width=480,height=200,left=100,top=100');
  setTimeout(function() {
    try { if (w && !w.closed) w.close(); } catch (e) {}
  }, 4000);
}

function syncViaFetch_(payload) {
  return fetch(SHEETS_CONFIG.WEB_APP_URL, {
    method: 'POST',
    mode: 'cors',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  }).then(function(res) {
    return res.text().then(function(text) {
      if (text.indexOf('Sign in') !== -1 || text.indexOf('AccountChooser') !== -1) {
        throw new Error('AUTH_REQUIRED');
      }
      try { return JSON.parse(text); } catch (e) {
        if (text.indexOf('"ok":true') !== -1) return { ok: true };
        throw new Error('BAD_RESPONSE');
      }
    });
  });
}

function syncToSheet(sheetName, row) {
  if (!SHEETS_CONFIG.ENABLED || !SHEETS_CONFIG.WEB_APP_URL) {
    return Promise.resolve({ ok: false, skipped: true });
  }
  var payload = buildPayload_(sheetName, row);

  if (SHEETS_CONFIG.IS_WORKSPACE || SHEETS_CONFIG.WEB_APP_URL.indexOf('/a/macros/') !== -1) {
    syncViaHiddenForm_(payload);
    syncViaPopup_(payload);
    showSheetToast_('กำลังส่งไป Google Sheet... ถ้าขึ้นหน้า Google ให้ล็อกอิน @banphai.ac.th');
    return Promise.resolve({ ok: true, method: 'workspace' });
  }

  return syncViaFetch_(payload)
    .then(function(res) {
      if (res && res.ok) showSheetToast_('ส่ง Google Sheet สำเร็จ');
      return res;
    })
    .catch(function() {
      syncViaHiddenForm_(payload);
      showSheetToast_('กำลังส่งไป Google Sheet...');
      return { ok: true, method: 'form' };
    });
}

function syncToSheetQuiet(sheetName, row) {
  syncToSheet(sheetName, row).then(function(res) {
    if (res && res.ok) return;
    if (res && res.skipped) return;
    enqueueSheetSync_(sheetName, row);
    if (!window._sheetAuthWarned) {
      window._sheetAuthWarned = true;
      showSheetToast_('ส่ง Sheet ไม่สำเร็จ — ล็อกอิน Google @banphai.ac.th แล้วลองใหม่', true);
    }
  });
}

function flushSheetQueue_() {
  var q = loadSheetQueue_();
  if (!q.length || !SHEETS_CONFIG.WEB_APP_URL) return;
  var item = q[0];
  syncToSheet(item.sheet, item.row).then(function(res) {
    if (res && res.ok) {
      q.shift();
      saveSheetQueue_(q);
      if (q.length) flushSheetQueue_();
    }
  });
}

function formatSheetDate(iso) {
  if (!iso) return '';
  if (typeof formatVacDate === 'function' && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return formatVacDate(iso);
  }
  return iso;
}

function buildVaccineSheetRow(record) {
  return {
    'เลขประจำตัว': record.id || '',
    'ชื่อนามสกุล': record.name || '',
    'วัคซีนที่ฉีด': record.vaccine || '',
    'วันที่ฉีด': formatSheetDate(record.date),
    'วันที่บันทึก': record.recordedAt || '',
    'บทบาทผู้บันทึก': getSyncRoleLabel(),
    id: record.id || '',
    name: record.name || '',
    vaccine: record.vaccine || '',
    date: formatSheetDate(record.date),
    recordedAt: record.recordedAt || ''
  };
}

function buildNutritionSheetRow(record) {
  var w = record.weight != null && record.weight !== '' ? String(record.weight) : '';
  var h = record.height != null && record.height !== '' ? String(record.height) : '';
  var bmi = record.bmi != null && record.bmi !== '' ? String(record.bmi) : '';
  var date = record.date || record.recordedAt || new Date().toLocaleString('th-TH');
  return {
    'วันที่บันทึก': date,
    'รหัสนักเรียน': record.id || '',
    'ชื่อ-นามสกุล': record.name || '',
    'ชั้น': record.class || '',
    'เพศ': record.sex || '',
    'อายุ': record.age != null && record.age !== '' ? String(record.age) : '',
    'น้ำหนัก(kg)': w,
    'น้ำหนัก': w,
    'น้ำหนัก(กก.)': w,
    'น้ำหนัก (kg)': w,
    'น้ำหนัก (กก.)': w,
    'ส่วนสูง(cm)': h,
    'ส่วนสูง': h,
    'ส่วนสูง(ซม.)': h,
    'ส่วนสูง (cm)': h,
    'ส่วนสูง (ซม.)': h,
    'BMI': bmi,
    'สถานะโภชนาการ': record.category || '',
    'บทบาทผู้บันทึก': getSyncRoleLabel(),
    id: record.id || '',
    name: record.name || '',
    class: record.class || '',
    sex: record.sex || '',
    age: record.age != null && record.age !== '' ? String(record.age) : '',
    weight: w,
    height: h,
    bmi: bmi,
    category: record.category || '',
    recordedAt: date
  };
}

function buildChronicSheetRow(record) {
  return {
    'วันที่บันทึก': record.recordedAt || new Date().toLocaleString('th-TH'),
    'รหัสนักเรียน': record.id || '',
    'ชื่อ-นามสกุล': record.name || '',
    'ชั้น': record.class || '',
    'โรคประจำตัว': record.disease || '',
    'ยาที่ใช้': record.medicine || '',
    'เบอร์ติดต่อฉุกเฉิน': record.phone || '',
    'หมายเหตุ': record.note || '',
    'บทบาทผู้บันทึก': getSyncRoleLabel(),
    id: record.id || '',
    name: record.name || '',
    class: record.class || '',
    disease: record.disease || '',
    medicine: record.medicine || '',
    phone: record.phone || '',
    note: record.note || '',
    recordedAt: record.recordedAt || ''
  };
}

function buildEmergencySheetRow(record) {
  return {
    'วันที่เวลา': record.eventAt || record.recordedAt || '',
    'ชื่อผู้บาดเจ็บ/เจ็บป่วย': record.name || '',
    'ประเภทเหตุการณ์': record.type || '',
    'สถานที่เกิดเหตุ': record.location || '',
    'การปฐมพยาบาล': record.firstaid || '',
    'ผลลัพธ์': record.result || '',
    'บทบาทผู้บันทึก': getSyncRoleLabel(),
    name: record.name || '',
    type: record.type || '',
    location: record.location || '',
    firstaid: record.firstaid || '',
    result: record.result || '',
    eventAt: record.eventAt || record.recordedAt || '',
    recordedAt: record.recordedAt || ''
  };
}

function buildDiseaseStudentSheetRow(record) {
  return {
    'วันที่รายงาน': record.recordedAt || '',
    'รหัสนักเรียน': record.id || '',
    'ชื่อ-นามสกุล': record.name || '',
    'โรคที่พบ/สงสัย': record.disease || '',
    'วันที่เริ่มมีอาการ': formatSheetDate(record.symptomDate),
    'อาการ/รายละเอียด': record.note || '',
    'สถานะ': record.status || '',
    id: record.id || '',
    name: record.name || '',
    disease: record.disease || '',
    symptomDate: formatSheetDate(record.symptomDate),
    note: record.note || '',
    status: record.status || '',
    recordedAt: record.recordedAt || ''
  };
}

function buildDiseaseStaffSheetRow(record) {
  return {
    'วันที่รายงาน': record.recordedAt || '',
    'โรคที่พบ': record.disease || '',
    'จำนวนผู้ป่วย': record.patients || '',
    'ห้องเรียน/กลุ่ม': record.room || '',
    'วันที่เริ่มพบ': formatSheetDate(record.startDate),
    'มาตรการที่ดำเนินการ': (record.measures || []).join(', '),
    'บทบาทผู้บันทึก': getSyncRoleLabel(),
    disease: record.disease || '',
    patients: record.patients || '',
    room: record.room || '',
    startDate: formatSheetDate(record.startDate),
    measures: (record.measures || []).join(', '),
    recordedAt: record.recordedAt || ''
  };
}

function buildEnvironmentSheetRow(record) {
  var items = record.items || [];
  var passed = items.filter(function(it) { return it.checked; });
  var failed = items.filter(function(it) { return !it.checked; });
  return {
    'วันที่ตรวจ': record.recordedAt || '',
    'ผลการตรวจ': (record.passCount != null ? record.passCount : passed.length) + '/' + (record.total || items.length) + ' ข้อ',
    'รายการที่ผ่าน': passed.map(function(it) { return it.text; }).join(' | '),
    'รายการที่ยังไม่ผ่าน': failed.map(function(it) { return it.text; }).join(' | '),
    'ผู้บันทึก': record.recordedBy || getSyncRoleLabel(),
    passCount: record.passCount,
    passed: passed.map(function(it) { return it.text; }).join(' | '),
    failed: failed.map(function(it) { return it.text; }).join(' | '),
    recordedAt: record.recordedAt || ''
  };
}

function buildVisitSheetRow(record) {
  var row = {};
  row['วันที่เวลา'] = record.recordedAt || '';
  row['รหัส'] = record.id || '';
  row['ชื่อ-นามสกุล'] = record.name || '';
  row['ชั้น/ตำแหน่ง'] = record.class || '';
  row['ประเภทผู้รับบริการ'] = record.type || '';
  row['อาการ/ปัญหาสุขภาพ'] = record.symptom || '';
  row['อุณหภูมิ(°C)'] = record.temp || '';
  row['ความดัน' + '\u0E42\u0E25\u0E2B\u0E34\u0E15'] = record.bp || '';
  row['ชีพจร'] = record.pulse || '';
  row['การวินิจฉัยเบื้องต้น'] = record.diagnosis || '';
  row['การรักษาและยา'] = record.treatment || '';
  row['ผลการรักษา'] = record.result || '';
  row['ผู้ให้บริการ'] = record.provider || '';
  row['บทบาทผู้บันทึก'] = getSyncRoleLabel();
  row.id = record.id || '';
  row.name = record.name || '';
  row.class = record.class || '';
  row.type = record.type || '';
  row.symptom = record.symptom || '';
  row.temp = record.temp || '';
  row.bp = record.bp || '';
  row.pulse = record.pulse || '';
  row.diagnosis = record.diagnosis || '';
  row.treatment = record.treatment || '';
  row.result = record.result || '';
  row.provider = record.provider || '';
  row.recordedAt = record.recordedAt || '';
  return row;
}

document.addEventListener('DOMContentLoaded', function() {
  ensureSheetSyncDom_();
  flushSheetQueue_();
});
