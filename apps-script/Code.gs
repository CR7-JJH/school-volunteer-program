/**
 * 사전 설문 응답 수집용 Google Apps Script
 *
 * 설정 방법은 저장소 README 의 "응답을 Google 스프레드시트로 받기" 를 참고하세요.
 * 응답은 스프레드시트의 '응답' 시트에 한 줄씩 쌓입니다.
 * 새로운 문항이 추가되면 열이 자동으로 늘어납니다.
 */

var SHEET_NAME = '응답';

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var payload = JSON.parse(e.postData.contents);
    var answers = payload.answers || {};
    var sheet = getSheet_();

    var row = { '제출시각': payload.submittedAt || new Date().toISOString() };
    Object.keys(answers).forEach(function (key) {
      var value = answers[key];
      row[key] = Array.isArray(value) ? value.join(', ') : value;
    });

    var headers = ensureHeaders_(sheet, Object.keys(row));
    var values = headers.map(function (h) {
      return row[h] === undefined ? '' : row[h];
    });
    sheet.appendRow(values);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ ok: true, message: '설문 수집 서버가 동작 중입니다.' });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

// 헤더 행에 없는 키가 있으면 오른쪽에 열을 추가하고, 최종 헤더 목록을 돌려준다
function ensureHeaders_(sheet, keys) {
  var lastCol = sheet.getLastColumn();
  var headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  var missing = keys.filter(function (k) { return headers.indexOf(k) === -1; });
  if (missing.length) {
    sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
    sheet.setFrozenRows(1);
    headers = headers.concat(missing);
  }
  return headers;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
