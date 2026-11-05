/**
 * 분리배출 디버깅 프로젝트 — 사전·사후 설문 문항
 *
 * 사전·사후 설문은 같은 문항을 사용해 전후 변화를 비교합니다.
 * phase: 'post' 가 붙은 섹션·문항은 사후 설문에만 나옵니다. ('pre' 는 사전 설문에만)
 *
 * 문항 타입(type)
 *   quiz      판별 퀴즈 (options, answer, errorType, explanation)
 *             '잘 모르겠어요' 선택지가 자동으로 추가되며 오답으로 처리됩니다.
 *   single    하나만 선택         (options)
 *   multi     여러 개 선택        (options, min, max)
 *   scale     1~5 척도
 *   text / textarea  직접 입력    (maxLength, placeholder)
 *
 * errorType (계획서 '오류 유형 분석' 기준)
 *   rinse     내용물 미세척 (비웠나? 헹궜나?)
 *   label     라벨·부착물 미제거 (뗐나?)
 *   material  재질 혼동
 *
 * id 는 응답 데이터의 열 이름이 됩니다. 사전 설문을 배포한 뒤에는 바꾸지 마세요.
 * 선택지는 { value, label } 형태입니다. value 는 저장되는 값, label 은 화면 표시용입니다.
 * { value: 'other', label: '기타', other: true } 처럼 other 를 주면 직접 입력칸이 함께 나옵니다.
 */
window.SURVEY = {
  phases: {
    pre: {
      label: '사전 설문',
      title: '분리배출, 나는 얼마나 알고 있을까?',
      intro:
        '우리 학교 분리수거함 속 ‘오류’를 찾는 분리배출 디버깅 프로젝트의 사전 설문입니다. ' +
        '퀴즈 8문항과 간단한 질문으로 구성되어 있고 약 3분 걸립니다. ' +
        '모르는 문제는 ‘잘 모르겠어요’를 골라도 괜찮아요. 찍지 말고 솔직하게 답해주세요!',
      // 완료 화면의 간식 안내 (비우면 표시하지 않음)
      reward: '이 화면을 대.환.책 팀원에게 보여주면 선착순으로 소정의 간식을 드려요!',
      doneMessage:
        '정답은 11월 13일(금)부터 분리수거함에 붙은 QR코드에서 확인할 수 있어요. ' +
        '버리기 전 3초 if문, 잊지 마세요!',
    },
    post: {
      label: '사후 설문',
      title: '분리배출, 얼마나 달라졌을까?',
      intro:
        '분리배출 디버깅 프로젝트에 함께해줘서 고마워요! 캠페인 전과 비교하기 위해 사전 설문과 같은 퀴즈를 한 번 더 풀어요. ' +
        '약 3분 걸리고, 제출하면 정답과 해설을 바로 확인할 수 있어요.',
      doneMessage: '버리기 전 3초 if문: 비웠나? 헹궜나? 뗐나? → 재활용 TRUE',
    },
  },

  privacyNotice:
    '이 설문은 익명이며 학번·이름을 수집하지 않습니다. 응답은 캠페인 효과 분석에만 사용됩니다.',

  sections: [
    {
      id: 'basic',
      title: '시작하기',
      description: '응답 비교를 위해 학년만 알려주세요.',
      questions: [
        {
          id: 'grade',
          type: 'single',
          label: '학년',
          required: true,
          layout: 'row',
          options: [
            { value: '1', label: '1학년' },
            { value: '2', label: '2학년' },
          ],
        },
      ],
    },

    {
      id: 'quiz1',
      title: '분리배출 판별 퀴즈 ①',
      description: '어떻게 버리는 것이 올바른지 골라주세요. (1~4번)',
      questions: [
        {
          id: 'q1Pet',
          type: 'quiz',
          errorType: 'label',
          label: '1. 음료가 조금 남아 있고 라벨이 붙은 페트병은?',
          options: [
            { value: 'as_is', label: '그대로 플라스틱 수거함에 넣는다' },
            { value: 'cap_only', label: '뚜껑만 따로 빼서 플라스틱 수거함에 넣는다' },
            { value: 'clean_label', label: '내용물을 비우고 헹군 뒤, 라벨을 떼어 플라스틱으로 버린다' },
            { value: 'general', label: '음료가 남아 있으니 일반쓰레기로 버린다' },
          ],
          answer: 'clean_label',
          explanation: '비우고 → 헹구고 → 라벨(비닐)을 떼서 페트병은 플라스틱으로, 라벨은 비닐류로 버려요. 찌그러뜨린 뒤 뚜껑을 닫으면 더 좋아요.',
        },
        {
          id: 'q2CupNoodle',
          type: 'quiz',
          errorType: 'rinse',
          label: '2. 국물 자국이 배어서 씻어도 지워지지 않는 컵라면 용기(스티로폼)는?',
          options: [
            { value: 'styrofoam', label: '스티로폼 수거함에 따로 버린다' },
            { value: 'plastic', label: '플라스틱 수거함에 넣는다' },
            { value: 'paper', label: '종이류로 버린다' },
            { value: 'general', label: '일반쓰레기로 버린다' },
          ],
          answer: 'general',
          explanation: '우리 학교는 스티로폼을 일반쓰레기로 버려요. 버리기 전에 남은 국물은 꼭 비워 주세요.',
        },
        {
          id: 'q3Takeout',
          type: 'quiz',
          errorType: 'material',
          label: '3. 종이 슬리브가 끼워져 있고 빨대가 꽂힌 테이크아웃 플라스틱 컵은?',
          options: [
            { value: 'all_plastic', label: '통째로 플라스틱 수거함에 넣는다' },
            { value: 'split', label: '컵은 헹궈 플라스틱, 슬리브는 종이, 빨대는 일반쓰레기로 나눠 버린다' },
            { value: 'straw_only', label: '컵과 슬리브는 플라스틱, 빨대만 일반쓰레기로 버린다' },
            { value: 'all_general', label: '재질이 섞여 있으니 전부 일반쓰레기로 버린다' },
          ],
          answer: 'split',
          explanation: '재질마다 따로 버려요. 빨대처럼 작은 플라스틱은 선별 과정에서 걸러지기 어려워 일반쓰레기로 버려요.',
        },
        {
          id: 'q4Milk',
          type: 'quiz',
          errorType: 'rinse',
          label: '4. 급식으로 마신 우유팩은?',
          options: [
            { value: 'as_is', label: '우유가 조금 남아 있어도 그대로 종이 수거함에 넣는다' },
            { value: 'clean_paper', label: '비우고 헹군 뒤 펼쳐서 종이 수거함에 넣는다' },
            { value: 'plastic', label: '안쪽이 코팅되어 있으니 플라스틱으로 버린다' },
            { value: 'general', label: '일반쓰레기로 버린다' },
          ],
          answer: 'clean_paper',
          explanation: '우리 학교는 우유팩을 종이 수거함에 버려요. 우유가 남아 있으면 다른 종이까지 젖고 냄새가 나니 꼭 비우고 헹궈 주세요.',
        },
      ],
    },

    {
      id: 'quiz2',
      title: '분리배출 판별 퀴즈 ②',
      description: '어떻게 버리는 것이 올바른지 골라주세요. (5~8번)',
      questions: [
        {
          id: 'q5Receipt',
          type: 'quiz',
          errorType: 'material',
          label: '5. 매점·편의점에서 받은 영수증(반들반들한 감열지)은?',
          options: [
            { value: 'paper', label: '종이류로 버린다' },
            { value: 'general', label: '일반쓰레기로 버린다' },
            { value: 'vinyl', label: '비닐류로 버린다' },
            { value: 'plastic', label: '플라스틱으로 버린다' },
          ],
          answer: 'general',
          explanation: '감열지는 열에 반응하는 화학물질로 코팅되어 있어 종이로 재활용할 수 없어요. 일반쓰레기로 버려요.',
        },
        {
          id: 'q6Snack',
          type: 'quiz',
          errorType: 'material',
          label: '6. 다 먹은 과자 봉지(안쪽이 은색)는?',
          options: [
            { value: 'general', label: '은박이 있으니 일반쓰레기로 버린다' },
            { value: 'can', label: '금속처럼 보이니 캔류로 버린다' },
            { value: 'vinyl', label: '부스러기를 털어 내고 비닐류로 버린다' },
            { value: 'paper', label: '종이류로 버린다' },
          ],
          answer: 'vinyl',
          explanation: '과자 봉지는 여러 겹의 필름으로 된 비닐(OTHER)이라 비닐류로 버려요. 부스러기는 털어 주세요.',
        },
        {
          id: 'q7Pen',
          type: 'quiz',
          errorType: 'material',
          label: '7. 다 쓴 볼펜·샤프처럼 분리배출 표시가 없는 작은 플라스틱 제품은?',
          options: [
            { value: 'plastic', label: '플라스틱이니 플라스틱 수거함에 넣는다' },
            { value: 'can', label: '금속 부품이 있으니 캔류로 버린다' },
            { value: 'vinyl', label: '비닐류로 버린다' },
            { value: 'general', label: '일반쓰레기로 버린다' },
          ],
          answer: 'general',
          explanation: '여러 재질이 섞여 있고 분리배출 표시가 없는 작은 제품은 선별이 어려워 일반쓰레기로 버려요.',
        },
        {
          id: 'q8Note',
          type: 'quiz',
          errorType: 'label',
          label: '8. 다 쓴 스프링 노트는?',
          options: [
            { value: 'split', label: '스프링과 비닐 표지를 떼어 내고, 종이만 종이류로 버린다' },
            { value: 'as_is', label: '통째로 종이류로 버린다' },
            { value: 'general', label: '스프링이 있으니 일반쓰레기로 버린다' },
            { value: 'can', label: '스프링이 금속이니 통째로 캔류로 버린다' },
          ],
          answer: 'split',
          explanation: '스프링·비닐 코팅 표지처럼 종이가 아닌 부분을 떼어야 종이로 재활용돼요.',
        },
      ],
    },

    {
      id: 'intention',
      title: '실천 의지',
      description: '각 문장이 지금의 나와 얼마나 가까운지 골라주세요.',
      questions: [
        { id: 'willEmpty', type: 'scale', label: '분리배출할 때 내용물을 비우고 헹궈서 버리겠다.', required: true },
        { id: 'willLabel', type: 'scale', label: '라벨이나 부착물처럼 재질이 다른 부분은 떼어서 버리겠다.', required: true },
        { id: 'willCheck', type: 'scale', label: '헷갈리는 물건은 버리기 전에 올바른 방법을 확인하겠다.', required: true },
        { id: 'willTell', type: 'scale', label: '친구가 잘못 버리면 올바른 방법을 알려줄 수 있다.', required: true },
      ],
    },

    {
      id: 'habit',
      title: '평소 분리배출 습관',
      description: '안내판과 판별 웹페이지를 만드는 데 참고할게요.',
      questions: [
        {
          id: 'confusingItems',
          type: 'multi',
          label: '버릴 때 가장 헷갈리는 물건을 골라주세요.',
          help: '최대 3개까지 선택할 수 있어요.',
          required: true,
          min: 1,
          max: 3,
          options: [
            { value: 'pet', label: '페트병' },
            { value: 'cup', label: '플라스틱 컵' },
            { value: 'paper_cup', label: '종이컵' },
            { value: 'milk', label: '우유팩' },
            { value: 'snack', label: '과자·젤리 봉지' },
            { value: 'cup_noodle', label: '컵라면 용기' },
            { value: 'can', label: '캔' },
            { value: 'delivery', label: '배달·도시락 용기' },
            { value: 'stationery', label: '문구류' },
            { value: 'other', label: '기타', other: true },
          ],
        },
        {
          id: 'mainReason',
          type: 'single',
          label: '분리배출을 제대로 하기 어려운 가장 큰 이유는?',
          required: true,
          options: [
            { value: 'unknown_rule', label: '올바른 방법을 잘 몰라서' },
            { value: 'bother', label: '헹구고 떼는 것이 귀찮아서' },
            { value: 'no_sink', label: '근처에 헹굴 곳이 없어서' },
            { value: 'bin_sign', label: '분리수거함 표시가 헷갈려서' },
            { value: 'others_dont', label: '다른 사람들도 잘 안 지켜서' },
            { value: 'other', label: '기타', other: true },
          ],
        },
      ],
    },

    {
      id: 'campaign',
      phase: 'post',
      title: '캠페인 참여',
      description: '마지막 단계입니다.',
      questions: [
        {
          id: 'promiseBoard',
          type: 'single',
          label: '‘작은 약속’ 보드에 실천 약속을 적어 붙였나요?',
          required: true,
          layout: 'row',
          options: [
            { value: 'yes', label: '참여했어요' },
            { value: 'no', label: '참여하지 않았어요' },
          ],
        },
        {
          id: 'campaignFeedback',
          type: 'textarea',
          label: '캠페인에 참여하며 느낀 점이나 학교에 바라는 점을 적어주세요.',
          help: '선택 사항이에요.',
          maxLength: 300,
          placeholder: '예: QR 판별 페이지 덕분에 헷갈릴 때 바로 확인할 수 있었어요.',
        },
      ],
    },
  ],
};
