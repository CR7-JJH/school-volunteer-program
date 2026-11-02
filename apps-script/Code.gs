/**
 * 분리배출 디버깅 프로젝트 — 설문 응답 수집용 Google Apps Script
 *
 * 설정 방법은 저장소 README 의 "응답을 Google 스프레드시트로 받기" 를 참고하세요.
 * 사전 설문은 '사전' 시트, 사후 설문은 '사후' 시트,
 * 판별 웹페이지 접속·판별 기록은 '판별기록' 시트에 한 줄씩 쌓입니다.
 * 새로운 문항이 추가되면 열이 자동으로 늘어납니다.
 */

var SPREADSHEET_NAME = '분리배출 디버깅 응답';
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
    if (payload.type === 'checker') {
      appendRow_(getSheet_('판별기록'), {
        '시각': payload.at || new Date().toISOString(),
        '이벤트': payload.event === 'visit' ? '접속' : '판별',
        '위치': payload.from || '',
        '품목': payload.item || '',
        '결과': payload.bin || '',
        '할일수': payload.fixes === undefined ? '' : payload.fixes,
      });
      return json_({ ok: true });
    }

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

    appendRow_(sheet, row);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// 브라우저에서 웹 앱 주소(/exec)를 열면 연결 상태를 보여준다
function doGet() {
  try {
    var ss = getSpreadsheet_();
    return json_({ ok: true, message: '설문 수집 서버가 동작 중입니다.', spreadsheet: ss.getName(), url: ss.getUrl() });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// 편집 화면에서 이 함수를 선택하고 ▶ 실행하면 권한 승인과 연결 확인을 할 수 있다
function checkSetup() {
  var ss = getSpreadsheet_();
  Logger.log('연결된 스프레드시트: ' + ss.getName());
  Logger.log('주소: ' + ss.getUrl());
}

// 스프레드시트에서 만든 Apps Script 면 그 시트를, 따로 만든 프로젝트면
// '분리배출 디버깅 응답' 스프레드시트를 내 드라이브에 새로 만들어 사용한다
function getSpreadsheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) return ss;
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SPREADSHEET_ID');
  if (id) {
    try {
      return SpreadsheetApp.openById(id);
    } catch (e) { /* 삭제된 경우 새로 만든다 */ }
  }
  ss = SpreadsheetApp.create(SPREADSHEET_NAME);
  props.setProperty('SPREADSHEET_ID', ss.getId());
  return ss;
}

function appendRow_(sheet, row) {
  var headers = ensureHeaders_(sheet, Object.keys(row));
  sheet.appendRow(headers.map(function (h) {
    return row[h] === undefined ? '' : row[h];
  }));
}

function getSheet_(name) {
  var ss = getSpreadsheet_();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

// 헤더 행에 없는 키가 있으면 오른쪽에 열을 추가하고, 최종 헤더 목록을 돌려준다
function ensureHeaders_(sheet, keys) {
  var lastCol = sheet.getLastColumn();
  var headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  var missing = keys.filter(function (k) { return headers.indexOf(k) === -1; });
  if (missing.length) {
    // 새 시트는 26열로 시작하므로, 모자라면 열을 늘린다 (사후 설문은 28열)
    var need = headers.length + missing.length - sheet.getMaxColumns();
    if (need > 0) sheet.insertColumnsAfter(sheet.getMaxColumns(), need);
    sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
    sheet.setFrozenRows(1);
    headers = headers.concat(missing);
  }
  return headers;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
