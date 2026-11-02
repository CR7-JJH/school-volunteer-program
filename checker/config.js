/**
 * 판별 웹페이지 운영 설정
 */
window.CHECKER_CONFIG = {
  // 접속 수·판별 기록을 보낼 Google Apps Script 웹 앱 URL.
  // 설문과 같은 주소(survey/config.js 의 submitUrl)를 넣으면 '판별기록' 시트에 쌓입니다.
  // 비워두면 기록하지 않습니다.
  logUrl: '',

  // 사전 측정에서 가장 많이 틀린 품목 TOP 5 (items.js 의 id, 많이 틀린 순)
  // 11/9 데이터 분석 후 채워 넣으면 첫 화면 맨 위에 표시됩니다. 예: ['cup', 'pet', 'milk', 'snack', 'cupnoodle']
  top5: [],

  // QR 포스터에 넣을 판별 페이지 공개 주소 (GitHub Pages)
  publicUrl: 'https://cr7-jjh.github.io/school-volunteer-program/checker/',
};
