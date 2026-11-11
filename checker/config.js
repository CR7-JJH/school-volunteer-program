/**
 * 판별 웹페이지 운영 설정
 */
window.CHECKER_CONFIG = {
  // 접속 수·판별 기록을 보낼 Google Apps Script 웹 앱 URL.
  // 설문과 같은 주소(survey/config.js 의 submitUrl)를 넣으면 '판별기록' 시트에 쌓입니다.
  // 비워두면 기록하지 않습니다.
  logUrl: 'https://script.google.com/macros/s/AKfycbx2vGDYX3VAFVmepuNs-a3iS2tRLjZzwHcjdaFDPZvtlBUz_HNJXt7W2MBGiNvfABf0cQ/exec',

  // 가장 많이 틀린 품목 TOP 5 (11/11 팀 결정: 사전 혼입률 측정 + 사전 설문)
  //   id      items.js 의 품목 id
  //   wrong   자주 틀리는 방법 (판별기 첫 화면·안내판에 표시)
  //   right   올바른 방법 한 줄 (안내판) — 판별기 결과와 같아야 해요
  //   en      안내판 영어 한 줄
  //   source  근거 데이터 (안내판)
  // 판별기 첫 화면 맨 위와 poster.html 의 'TOP 5 안내판'에 이 순서대로 나와요.
  top5: [
    {
      id: 'can',
      wrong: '음료가 남은 채로 버려요',
      right: '음료를 비우고 한 번 헹궈서 → 캔 수거함',
      en: 'Drink cans: empty and rinse → Cans',
      source: '사전 측정 3회: 캔 수거함에 잘못 버린 것 112개 중 100개(89%)가 내용물 미세척',
    },
    {
      id: 'cup',
      wrong: '음료·얼음이 남은 채로 버려요',
      right: '비우고 헹군 뒤 슬리브(종이)·빨대(일반) 빼고 → 플라스틱',
      en: 'Takeout cups: empty, rinse, remove sleeve & straw → Plastic',
      source: '사전 측정 3회: 플라스틱 수거함에 잘못 버린 것 148개 중 108개(73%)가 내용물 미세척',
    },
    {
      id: 'snack',
      wrong: '일반쓰레기로 버려요',
      right: '부스러기 털고 → 비닐류 (안쪽이 은색이어도 비닐!)',
      en: 'Snack bags: shake out crumbs → Vinyl',
      source: '사전 설문 28명: 오답률 71.4% (가장 많이 고른 오답: 일반쓰레기)',
    },
    {
      id: 'pen',
      wrong: '플라스틱으로 버려요',
      right: '분리배출 표시가 없으면 → 일반쓰레기',
      en: 'Pens: no recycling mark → General waste',
      source: '사전 설문 28명: 오답률 53.6% (가장 많이 고른 오답: 플라스틱)',
    },
    {
      id: 'milk',
      wrong: '헹구지 않고 버려요',
      right: '비우고 헹궈 펼쳐서 → 종이 수거함 (우리 학교 기준)',
      en: 'Milk cartons: empty, rinse, flatten → Paper',
      source: '사전 설문 28명: 오답률 46.4% (가장 많이 고른 오답: 헹구지 않고 종이 수거함)',
    },
  ],

  // QR 포스터에 넣을 판별 페이지 공개 주소 (GitHub Pages)
  publicUrl: 'https://cr7-jjh.github.io/school-volunteer-program/checker/',
};
