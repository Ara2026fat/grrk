/***********************************************************************
 * GRRK — خلفية نماذج الطلبات (Google Apps Script)
 * ---------------------------------------------------------------------
 * يعمل فوق Google Sheet فيه ورقتين:
 *   1) Requests      — سجل كل الطلبات (يُنشأ تلقائياً أول مرة لو مو موجود)
 *   2) RoutingRules  — جدول التوجيه: أي نوع نموذج يروح لأي مختص
 *      الأعمدة: form_type | form_label_ar | assignee_name | assignee_email
 *      عدّل هذا الجدول وقت ما تبي — بدون أي تعديل على الكود.
 *
 * طريقة الربط من تطبيق GRRK:
 *   POST <WebAppURL>   body: { token, form_type, submitter_name,
 *                               submitter_phone, submitter_type, company,
 *                               payload: {...} }
 *   GET  <WebAppURL>?action=list&token=...&assignee_email=...   (صندوق المختص)
 *   POST <WebAppURL>   body: { token, action:"update_status", id,
 *                               new_status, note }               (اعتماد/رفض)
 ***********************************************************************/

// غيّر هذا السر قبل النشر (نفس القيمة تُكتب داخل تطبيق GRRK لاحقاً)
const SHARED_TOKEN = 'CHANGE_ME_SHARED';
// مفتاح الأدمن: يُكتب مرة واحدة داخل جوالك فقط، ولا يوجد في صفحة المناديب
const ADMIN_TOKEN = 'CHANGE_ME_ADMIN';

const SHEET_REQUESTS = 'Requests';
const SHEET_ROUTING = 'RoutingRules';
const SHEET_REPS = 'Representatives';

const REQUEST_HEADERS = [
  'id', 'timestamp', 'form_type', 'status',
  'submitter_name', 'submitter_phone', 'submitter_email', 'submitter_type', 'company',
  'payload_json', 'assignee_name', 'assignee_email',
  'last_updated', 'notes'
];

const REP_HEADERS = ['rep_id', 'name', 'company', 'phone', 'email', 'registered_at'];

function nextRepId_(sh){
  const rows = sh.getDataRange().getValues();
  let max = 0;
  for (let i = 1; i < rows.length; i++) {
    const m = String(rows[i][0]).match(/(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return 'MND-' + String(max + 1).padStart(4, '0');
}

function registerRep_(body){
  const sh = getSheet_(SHEET_REPS, REP_HEADERS);
  const repId = nextRepId_(sh);
  sh.appendRow([repId, body.name || '', body.company || '', body.phone || '', body.email || '', new Date()]);
  try{
    if(body.email){
      MailApp.sendEmail({
        to: body.email,
        subject: 'رقم تسجيلك في GRRK: ' + repId,
        body: 'أهلاً ' + (body.name || '') + '،\n\nرقم تسجيلك الخاص هو: ' + repId + '\n\nاحفظه، تحتاجه في كل مرة تقدّم فيها طلب جديد.'
      });
    }
  }catch(e){}
  return jsonOut_({ ok:true, rep_id: repId });
}

function findRep_(repId){
  const sh = getSheet_(SHEET_REPS, REP_HEADERS);
  const rows = sh.getDataRange().getValues();
  for(let i=1;i<rows.length;i++){
    if(String(rows[i][0]).trim().toUpperCase() === String(repId).trim().toUpperCase()){
      return { rep_id: rows[i][0], name: rows[i][1], company: rows[i][2], phone: rows[i][3], email: rows[i][4] };
    }
  }
  return null;
}

function getSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    if (headers) sh.appendRow(headers);
  }
  return sh;
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function findRouting_(formType) {
  const sh = getSheet_(SHEET_ROUTING, ['form_type', 'form_label_ar', 'assignee_name', 'assignee_email']);
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === formType) {
      return { label: rows[i][1], name: rows[i][2], email: rows[i][3] };
    }
  }
  return null;
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    if (body.token !== SHARED_TOKEN) {
      return jsonOut_({ ok: false, error: 'unauthorized' });
    }

    if (body.action === 'update_status') {
      if (body.admin_token !== ADMIN_TOKEN) return jsonOut_({ ok: false, error: 'admin_only' });
      return updateStatus_(body);
    }
    if (body.action === 'register_rep') {
      return withLock_(function(){ return registerRep_(body); });
    }

    return withLock_(function(){ return createRequest_(body); });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

function createRequest_(body) {
  const sh = getSheet_(SHEET_REQUESTS, REQUEST_HEADERS);
  const routing = findRouting_(body.form_type);
  const rep = body.rep_id ? findRep_(body.rep_id) : null;
  const id = body.form_type + '-' + Utilities.formatDate(new Date(), 'Asia/Riyadh', 'yyMMdd-HHmmss') + '-' + Math.floor(Math.random()*90+10);
  const now = new Date();

  const submitterName = (rep && rep.name) || body.submitter_name || '';
  const submitterPhone = (rep && rep.phone) || body.submitter_phone || '';
  const submitterEmail = (rep && rep.email) || body.submitter_email || '';
  const company = (rep && rep.company) || body.company || '';

  sh.appendRow([
    id,
    now,
    body.form_type || '',
    'قيد المراجعة',
    submitterName,
    submitterPhone,
    submitterEmail,
    body.submitter_type || '',
    company,
    JSON.stringify(body.payload || {}),
    routing ? routing.name : '',
    routing ? routing.email : '',
    now,
    ''
  ]);

  if (routing && routing.email) {
    try {
      MailApp.sendEmail({
        to: routing.email,
        subject: 'طلب جديد يحتاج مراجعتك — ' + (routing.label || body.form_type) + ' (' + id + ')',
        body:
          'وصلك طلب جديد عبر GRRK:\n\n' +
          'النوع: ' + (routing.label || body.form_type) + '\n' +
          'مقدّم الطلب: ' + submitterName + '\n' +
          'الجهة/الشركة: ' + (company || '-') + '\n' +
          'الجوال: ' + (submitterPhone || '-') + '\n' +
          'رقم الطلب: ' + id + '\n\n' +
          'افتح صندوق الطلبات داخل GRRK لمراجعته واعتماده.'
      });
    } catch (mailErr) {
      // تجاهل فشل الإيميل — الطلب مسجّل بالشيت في جميع الأحوال
    }
  }

  if (submitterEmail) {
    try {
      MailApp.sendEmail({
        to: submitterEmail,
        subject: 'تم استلام طلبك — رقم ' + id,
        body: 'تم استلام طلبك (' + (routing ? routing.label : body.form_type) + ') وهو الآن قيد المراجعة.\n\nرقم الطلب: ' + id + '\n\nراح يوصلك إيميل آخر فور اعتماده أو رفضه.'
      });
    } catch (e2) {}
  }

  return jsonOut_({ ok: true, id: id });
}

function updateStatus_(body) {
  const sh = getSheet_(SHEET_REQUESTS, REQUEST_HEADERS);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === body.id) {
      sh.getRange(i + 1, 4).setValue(body.new_status || data[i][3]);      // status (col 4 = index 3)
      sh.getRange(i + 1, 13).setValue(new Date());                        // last_updated (col 13 = index 12)
      if (body.note) sh.getRange(i + 1, 14).setValue(body.note);          // notes (col 14 = index 13)

      const submitterEmail = data[i][6];
      if (submitterEmail && body.new_status) {
        try {
          MailApp.sendEmail({
            to: submitterEmail,
            subject: 'تحديث حالة طلبك ' + body.id + ': ' + body.new_status,
            body: 'تم تحديث حالة طلبك رقم ' + body.id + ' إلى: ' + body.new_status +
                  (body.note ? ('\n\nملاحظة: ' + body.note) : '')
          });
        } catch (e3) {}
      }
      return jsonOut_({ ok: true });
    }
  }
  return jsonOut_({ ok: false, error: 'not_found' });
}

function doGet(e) {
  const params = e.parameter || {};
  if (params.token !== SHARED_TOKEN) {
    return jsonOut_({ ok: false, error: 'unauthorized' });
  }

  if (params.action === 'get_rep') {
    const rep = findRep_(params.rep_id || '');
    return rep ? jsonOut_({ ok: true, rep: { rep_id: rep.rep_id, name: rep.name, company: rep.company } }) : jsonOut_({ ok: false, error: 'not_found' });
  }

  if (params.action === 'list_reps') {
    if (params.admin_token !== ADMIN_TOKEN) return jsonOut_({ ok: false, error: 'admin_only' });
    const rs = getSheet_(SHEET_REPS, REP_HEADERS).getDataRange().getValues();
    const reps = rs.slice(1).map(r => ({ rep_id: r[0], name: r[1], company: r[2], phone: r[3], email: r[4], registered_at: r[5] }));
    return jsonOut_({ ok: true, reps: reps });
  }

  if (params.action === 'list') {
    if (params.admin_token !== ADMIN_TOKEN) return jsonOut_({ ok: false, error: 'admin_only' });
    const sh = getSheet_(SHEET_REQUESTS, REQUEST_HEADERS);
    const data = sh.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1)
      .filter(r => !params.assignee_email || String(r[11]).toLowerCase() === String(params.assignee_email).toLowerCase())
      .filter(r => !params.status || String(r[3]) === params.status)
      .map(r => {
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = r[idx]; });
        try { obj.payload = JSON.parse(obj.payload_json || '{}'); } catch (e2) { obj.payload = {}; }
        return obj;
      });
    return jsonOut_({ ok: true, requests: rows });
  }

  return jsonOut_({ ok: false, error: 'unknown_action' });
}
