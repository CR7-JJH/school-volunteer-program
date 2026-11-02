/**
 * 사전 설문 문항 정의
 *
 * 문항을 추가·수정하려면 이 파일만 고치면 됩니다.
 *
 * 문항 타입(type)
 *   text      한 줄 입력          (maxLength, placeholder)
 *   textarea  여러 줄 입력        (maxLength, placeholder)
 *   number    숫자 입력           (min, max)
 *   single    하나만 선택         (options)
 *   multi     여러 개 선택        (options, min, max)
 *   scale     1~5 척도            (minLabel, maxLabel)
 *   consent   동의 체크박스       (text)
 *
 * 공통 속성
 *   id        응답 데이터의 키 (매칭 알고리즘에서 사용하므로 한 번 정하면 바꾸지 마세요)
 *   label     질문 문구
 *   help      보조 설명 (선택)
 *   required  필수 여부
 *   showIf    { question: '문항 id', equals: '값' } 조건이 맞을 때만 표시
 *
 * 선택지(options)는 { value, label } 형태입니다. value 는 저장되는 값, label 은 화면 표시용입니다.
 * { value: 'other', label: '기타', other: true } 처럼 other 를 주면 직접 입력칸이 함께 나옵니다.
 */
window.SURVEY = {
  title: '동아리 매칭 사전 설문',
  intro:
    '여러분의 관심사와 활동 성향을 바탕으로 잘 맞는 동아리를 찾아드리기 위한 설문입니다. ' +
    '정답은 없으니 평소 나의 모습대로 편하게 답해주세요. 약 5분 정도 걸립니다.',

  sections: [
    {
      id: 'basic',
      title: '기본 정보',
      description: '매칭 결과를 안내하기 위한 정보입니다.',
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
            { value: '3', label: '3학년' },
          ],
        },
        { id: 'classNo', type: 'number', label: '반', required: true, min: 1, max: 20, placeholder: '예: 3' },
        { id: 'studentNo', type: 'number', label: '번호', required: true, min: 1, max: 50, placeholder: '예: 15' },
        { id: 'name', type: 'text', label: '이름', required: true, maxLength: 20, placeholder: '홍길동' },
      ],
    },

    {
      id: 'interest',
      title: '관심 분야와 진로',
      description: '어떤 분야에 마음이 가는지 알려주세요.',
      questions: [
        {
          id: 'interests',
          type: 'multi',
          label: '관심 있는 활동 분야를 골라주세요.',
          help: '1개 이상, 최대 3개까지 선택할 수 있어요.',
          required: true,
          min: 1,
          max: 3,
          options: [
            { value: 'science', label: '과학·탐구·실험' },
            { value: 'it', label: 'IT·코딩·AI' },
            { value: 'math', label: '수학·논리' },
            { value: 'humanities', label: '인문·독서·토론' },
            { value: 'language', label: '외국어·국제교류' },
            { value: 'social', label: '사회·경제·시사' },
            { value: 'art', label: '미술·디자인' },
            { value: 'music', label: '음악·밴드·합창' },
            { value: 'performance', label: '연극·댄스·공연' },
            { value: 'media', label: '영상·사진·방송' },
            { value: 'sports', label: '체육·스포츠' },
            { value: 'volunteer', label: '봉사·환경·캠페인' },
            { value: 'health', label: '보건·의학·생명' },
            { value: 'cooking', label: '요리·공예·생활' },
            { value: 'other', label: '기타', other: true },
          ],
        },
        {
          id: 'career',
          type: 'single',
          label: '희망하는 진로 계열은 어디에 가까운가요?',
          required: true,
          options: [
            { value: 'humanities', label: '인문·어문' },
            { value: 'social', label: '사회·경영·법' },
            { value: 'natural', label: '자연과학' },
            { value: 'engineering', label: '공학·IT' },
            { value: 'medical', label: '의약·보건' },
            { value: 'education', label: '교육' },
            { value: 'arts', label: '예술·체육' },
            { value: 'undecided', label: '아직 정하지 못했어요' },
          ],
        },
        {
          id: 'careerDetail',
          type: 'text',
          label: '구체적으로 생각하는 꿈이나 직업이 있나요?',
          help: '선택 사항이에요.',
          maxLength: 50,
          placeholder: '예: 소프트웨어 개발자, 간호사, 영상 PD',
        },
      ],
    },

    {
      id: 'style',
      title: '활동 성향',
      description: '각 문장이 나와 얼마나 비슷한지 골라주세요.',
      questions: [
        { id: 'likeTeamwork', type: 'scale', label: '여러 사람과 함께 협업하는 활동이 즐겁다.', required: true },
        { id: 'likeActive', type: 'scale', label: '몸을 움직이는 활동을 좋아한다.', required: true },
        { id: 'likeCreative', type: 'scale', label: '무언가를 직접 만들거나 표현하는 것을 좋아한다.', required: true },
        { id: 'likeAnalytic', type: 'scale', label: '궁금한 것을 깊이 탐구하고 분석하는 것을 좋아한다.', required: true },
        { id: 'likeHelping', type: 'scale', label: '다른 사람을 돕는 활동에서 보람을 느낀다.', required: true },
        { id: 'likeLeading', type: 'scale', label: '앞에 나서서 이끄는 역할을 맡고 싶다.', required: true },
        {
          id: 'workStyle',
          type: 'single',
          label: '어떤 방식으로 활동하는 것을 선호하나요?',
          required: true,
          options: [
            { value: 'team', label: '팀으로 함께 프로젝트하기' },
            { value: 'solo', label: '각자 맡은 작업에 집중하기' },
            { value: 'both', label: '둘 다 좋아요' },
          ],
        },
        {
          id: 'commitment',
          type: 'single',
          label: '동아리 활동에 얼마나 시간을 쓸 수 있나요?',
          required: true,
          options: [
            { value: 'regular', label: '정규 동아리 시간에만 참여하고 싶어요' },
            { value: 'some', label: '가끔은 추가 활동도 괜찮아요' },
            { value: 'high', label: '방과후·주말 활동도 적극 참여할 수 있어요' },
          ],
        },
      ],
    },

    {
      id: 'expect',
      title: '기대와 경험',
      description: '동아리에서 무엇을 얻고 싶은지 알려주세요.',
      questions: [
        {
          id: 'goals',
          type: 'multi',
          label: '동아리 활동으로 가장 얻고 싶은 것은 무엇인가요?',
          help: '최대 2개까지 선택할 수 있어요.',
          required: true,
          min: 1,
          max: 2,
          options: [
            { value: 'career', label: '진로 탐색·학생부 기록' },
            { value: 'skill', label: '전문 실력 향상' },
            { value: 'contest', label: '대회 참가·수상' },
            { value: 'friends', label: '새로운 친구·선후배' },
            { value: 'hobby', label: '취미와 즐거움' },
            { value: 'contribution', label: '봉사·사회 기여' },
          ],
        },
        {
          id: 'prevClub',
          type: 'single',
          label: '이전에 동아리 활동을 해본 적이 있나요?',
          required: true,
          layout: 'row',
          options: [
            { value: 'yes', label: '있어요' },
            { value: 'no', label: '없어요' },
          ],
        },
        {
          id: 'prevClubDetail',
          type: 'text',
          label: '어떤 동아리였고, 계속하고 싶은지 알려주세요.',
          maxLength: 100,
          placeholder: '예: 과학탐구반 - 계속하고 싶어요',
          showIf: { question: 'prevClub', equals: 'yes' },
        },
        {
          id: 'newClubIdea',
          type: 'textarea',
          label: '새로 생겼으면 하는 동아리나 해보고 싶은 활동이 있나요?',
          help: '선택 사항이에요. 매칭과 동아리 개설 참고 자료로 사용됩니다.',
          maxLength: 300,
          placeholder: '자유롭게 적어주세요.',
        },
        {
          id: 'comment',
          type: 'textarea',
          label: '그 밖에 전하고 싶은 말이 있다면 적어주세요.',
          help: '선택 사항이에요.',
          maxLength: 300,
          placeholder: '예: 친구 OOO와 같은 동아리를 원해요, 운동은 조금 어려워요 등',
        },
      ],
    },

    {
      id: 'agree',
      title: '제출 전 확인',
      description: '마지막 단계입니다.',
      questions: [
        {
          id: 'privacyAgree',
          type: 'consent',
          label: '개인정보 수집·이용 동의',
          required: true,
          text:
            '• 수집 항목: 학년, 반, 번호, 이름, 설문 응답\n' +
            '• 이용 목적: 동아리 매칭 및 배정 결과 안내\n' +
            '• 보유 기간: 해당 학년도 동아리 편성 완료 후 즉시 파기\n' +
            '동의하지 않을 수 있으나, 이 경우 매칭에 참여할 수 없습니다.',
          checkLabel: '위 내용을 확인했으며 개인정보 수집·이용에 동의합니다.',
        },
      ],
    },
  ],
};
