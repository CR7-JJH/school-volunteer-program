/**
 * 설문 운영 설정
 *
 * submitUrl:
 *   Google Apps Script 웹 앱 URL (apps-script/Code.gs 배포 후 발급).
 *   비워두면 "테스트 모드"로 동작하며 응답은 이 브라우저에만 저장됩니다.
 */
window.SURVEY_CONFIG = {
  submitUrl: '',
  // 설문 제목 위에 표시되는 작은 문구
  brand: '대영 동아리 매칭 시스템',
  // 응답 마감 안내 (비워두면 표시하지 않음). 예: '11월 14일(금) 18:00까지'
  deadline: '',
};
