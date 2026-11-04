/**
 * 사이트 공개 설정 — 기간에 맞춰 open 값만 바꾸면 됩니다.
 *
 *   open: true   학생들이 첫 화면에서 고를 수 있고, 주소로 들어가도 열립니다.
 *   open: false  첫 화면에서 숨겨지고, 주소로 들어오면 closedMessage 가 보입니다.
 *
 * 팀원 확인용: 주소 끝에 ?preview=1 을 붙이면 닫힌 페이지도 열립니다.
 *   (미리보기에서는 응답·판별 기록이 시트에 저장되지 않습니다)
 *   예) .../checker/?preview=1   .../survey/?phase=post&preview=1
 *
 * 일정 (계획서 기준)
 *   사전 설문  11/4(수) ~ 11/9(월)
 *   판별기     11/13(금) QR 부착부터
 *   사후 설문  11/25(수) ~ 11/27(금)
 */
window.SITE_CONFIG = {
  preSurvey: {
    open: true,
    closedMessage: '사전 설문은 마감되었어요. 참여해 줘서 고마워요!',
  },
  checker: {
    open: false,
    closedMessage: '분리배출 판별기는 11월 13일(금)부터 열려요. 조금만 기다려 주세요!',
  },
  postSurvey: {
    open: false,
    closedMessage: '사후 설문은 11월 25일(수)부터 열려요.',
  },
};
