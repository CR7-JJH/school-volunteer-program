/**
 * 설문 운영 설정
 */
window.SURVEY_CONFIG = {
  // Google Apps Script 웹 앱 URL (apps-script/Code.gs 배포 후 발급).
  // 비워두면 "테스트 모드"로 동작하며 응답은 이 브라우저에만 저장됩니다.
  submitUrl: '',

  // 기본 설문 종류: 'pre'(사전) 또는 'post'(사후)
  // 주소 뒤에 ?phase=post 를 붙이면 설정과 관계없이 사후 설문이 열립니다.
  defaultPhase: 'pre',

  // 응답 마감 안내 (비워두면 표시하지 않음)
  deadline: {
    pre: '11월 9일(월)',
    post: '11월 27일(금)',
  },
};
