/**
 * 분리배출 디버깅 프로젝트 — 설문 응답 수집용 Google Apps Script
 *
 * 설정 방법은 저장소 README 의 "응답을 Google 스프레드시트로 받기" 를 참고하세요.
 * 사전 설문은 '사전' 시트, 사후 설문은 '사후' 시트에 한 줄씩 쌓입니다.
 * 새로운 문항이 추가되면 열이 자동으로 늘어납니다.
 */

var SHEET_NAMES = { pre: '사전', post: '사후' };

// 점수 열 이름 (응답 데이터의 키 → 시트 열 제목)
var SCORE_HEADERS = {
  quizScore: '퀴즈점수',
  quizTotal: '퀴즈문항수',
  quiz_rinse: '세척_정답',
  quiz_rinseTotal: '세척_문항수',
  quiz_label: '라벨_정답',
  quiz_labelTotal: '라벨_문항수',
  quiz_material: '재질_정답',
  quiz_materialTotal: '재질_문항수',
};

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var payload = JSON.parse(e.postData.contents);
    var sheet = getSheet_(SHEET_NAMES[payload.phase] || '기타');

    var row = { '제출시각': payload.submittedAt || new Date().toISOString() };
    var scores = payload.scores || {};
    Object.keys(scores).forEach(function (key) {
      row[SCORE_HEADERS[key] || key] = scores[key];
    });
    var answers = payload.answers || {};
    Object.keys(answers).forEach(function (key) {
      var value = answers[key];
      row[key] = Array.isArray(value) ? value.join(', ') : value;
    });

    var headers = ensureHeaders_(sheet, Object.keys(row));
    sheet.appendRow(headers.map(function (h) {
      return row[h] === undefined ? '' : row[h];
    }));

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

function getSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
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
