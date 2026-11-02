/**
 * 분리배출 판별 알고리즘 데이터
 *
 * 1학기 '우선순위 판별 알고리즘'처럼, 물건마다 조건(if)을 순서대로 확인합니다.
 *   비웠나? → 헹궜나? → 뗐나? → 재질은? → 결과
 *
 * 품목(ITEMS) 속성
 *   id, name, emoji, keywords(검색어), bin(모든 조건을 통과했을 때 버리는 곳), note(추가 팁)
 *   checks: 순서대로 묻는 조건 목록. 비어 있으면 바로 결과를 보여줍니다.
 *     stage   empty(비웠나) | rinse(헹궜나) | detach(뗐나) | material(재질)
 *     ask     질문 (예/아니오)
 *     yes/no  그 답을 골랐을 때의 결과. 생략하면 통과.
 *             { fix: '할 일' }            할 일을 추가하고 다음 조건으로
 *             { bin: 'general', why: '' } 여기서 판별 끝 (버리는 곳 확정)
 *   choose: 예/아니오 대신 보기 중에서 고르는 조건 (보기마다 bin 지정, end: true 면 바로 끝)
 *   why: checks 없이 바로 결과를 보여줄 때의 이유
 *
 * 사전·사후 설문 퀴즈의 정답과 같은 기준을 사용합니다. 퀴즈를 고치면 여기도 함께 확인하세요.
 */
window.BINS = {
  plastic: { label: '플라스틱', color: '#2f6fde' },
  can: { label: '캔·고철', color: '#6b7280' },
  paper: { label: '종이류', color: '#a0662b' },
  carton: { label: '종이팩', color: '#0f8f86' },
  vinyl: { label: '비닐류', color: '#8b4fd1' },
  glass: { label: '유리병', color: '#2e8b3e' },
  styrofoam: { label: '스티로폼', color: '#5b8db8' },
  general: { label: '일반쓰레기', color: '#3a3f4b' },
};

window.STAGES = {
  empty: '비웠나?',
  rinse: '헹궜나?',
  detach: '뗐나?',
  material: '재질은?',
};

window.ITEMS = [
  {
    id: 'pet',
    name: '페트병',
    emoji: '🧴',
    keywords: '생수 음료 콜라 사이다 이온음료 물병 PET',
    bin: 'plastic',
    checks: [
      { stage: 'empty', ask: '음료가 남아 있나요?', yes: { fix: '남은 음료를 개수대에 비워요.' } },
      { stage: 'rinse', ask: '안쪽이 끈적하거나 냄새가 나나요?', yes: { fix: '물로 한 번 헹궈요.' } },
      { stage: 'detach', ask: '비닐 라벨이 붙어 있나요?', yes: { fix: '라벨을 떼어 비닐류에 따로 버려요.' } },
    ],
    note: '찌그러뜨린 뒤 뚜껑을 닫아 버리면 부피가 줄어요. 투명 페트병 전용 수거함이 있다면 그곳에 넣어요.',
  },
  {
    id: 'cup',
    name: '테이크아웃 컵',
    emoji: '🥤',
    keywords: '플라스틱컵 카페 커피 아이스 음료 컵 뚜껑',
    bin: 'plastic',
    checks: [
      { stage: 'empty', ask: '음료나 얼음이 남아 있나요?', yes: { fix: '음료와 얼음을 개수대에 비워요.' } },
      { stage: 'rinse', ask: '안쪽에 음료 자국이 남아 있나요?', yes: { fix: '물로 한 번 헹궈요.' } },
      { stage: 'detach', ask: '종이 슬리브(컵홀더)가 끼워져 있나요?', yes: { fix: '슬리브는 빼서 종이류로 버려요.' } },
      { stage: 'detach', ask: '빨대가 꽂혀 있나요?', yes: { fix: '빨대는 빼서 일반쓰레기로 버려요.' } },
    ],
    note: '플라스틱 뚜껑은 컵과 함께 플라스틱으로 버려도 돼요.',
  },
  {
    id: 'lunchbox',
    name: '도시락·배달 용기',
    emoji: '🍱',
    keywords: '플라스틱 용기 반찬통 떡볶이 배달 포장 일회용',
    bin: 'plastic',
    checks: [
      { stage: 'empty', ask: '음식물이 남아 있나요?', yes: { fix: '남은 음식물을 음식물 쓰레기로 버려요.' } },
      {
        stage: 'rinse',
        ask: '물로 헹궈도 기름·양념 자국이 지워지지 않나요?',
        yes: { bin: 'general', why: '음식물이 밴 플라스틱은 다른 플라스틱의 재활용 품질까지 떨어뜨려요.' },
      },
      { stage: 'detach', ask: '종이·비닐 포장이나 스티커가 붙어 있나요?', yes: { fix: '포장과 스티커를 떼어 재질에 맞게 따로 버려요.' } },
    ],
  },
  {
    id: 'milk',
    name: '우유팩',
    emoji: '🥛',
    keywords: '급식 우유 두유 주스팩 종이팩 멸균팩',
    bin: 'carton',
    checks: [
      { stage: 'empty', ask: '우유가 남아 있나요?', yes: { fix: '남은 우유를 개수대에 비워요.' } },
      { stage: 'rinse', ask: '안쪽에 우유가 묻어 있나요?', yes: { fix: '물로 헹궈요. 그대로 두면 냄새와 벌레의 원인이 돼요.' } },
      { stage: 'detach', ask: '빨대나 비닐이 붙어 있나요?', yes: { fix: '빨대와 비닐은 떼어 따로 버려요.' } },
    ],
    note: '펼쳐서 말린 뒤 종이팩으로 따로 모아요. 우유팩은 질 좋은 펄프라 일반 종이와 섞이면 아까워요.',
  },
  {
    id: 'papercup',
    name: '종이컵',
    emoji: '☕',
    keywords: '종이 컵 자판기 정수기 커피',
    bin: 'carton',
    checks: [
      { stage: 'empty', ask: '음료가 남아 있나요?', yes: { fix: '남은 음료를 비워요.' } },
      { stage: 'rinse', ask: '안쪽에 음료 자국이 남아 있나요?', yes: { fix: '물로 가볍게 헹궈요.' } },
      { stage: 'detach', ask: '플라스틱 뚜껑이 있나요?', yes: { fix: '뚜껑은 플라스틱으로 따로 버려요.' } },
    ],
    note: '종이컵은 안쪽이 코팅되어 있어서 일반 종이가 아니라 종이팩과 함께 모아요. 따로 모으는 곳이 없다면 종이류와 섞이지 않게 묶어서 내요.',
  },
  {
    id: 'can',
    name: '음료캔',
    emoji: '🥫',
    keywords: '캔 콜라 사이다 커피캔 알루미늄 철',
    bin: 'can',
    checks: [
      { stage: 'empty', ask: '음료가 남아 있나요?', yes: { fix: '남은 음료를 개수대에 비워요.' } },
      { stage: 'rinse', ask: '안쪽이 끈적하거나 냄새가 나나요?', yes: { fix: '물로 한 번 헹궈요.' } },
      { stage: 'detach', ask: '캔 안에 빨대·휴지 같은 다른 쓰레기를 넣었나요?', yes: { fix: '안에 넣은 쓰레기를 꺼내 따로 버려요.' } },
    ],
    note: '가능하면 납작하게 눌러서 버려요.',
  },
  {
    id: 'snack',
    name: '과자·젤리 봉지',
    emoji: '🍿',
    keywords: '과자 봉지 젤리 사탕 라면봉지 은박 포장지',
    bin: 'vinyl',
    checks: [
      { stage: 'empty', ask: '과자 부스러기가 남아 있나요?', yes: { fix: '부스러기를 털어 내요.' } },
      {
        stage: 'rinse',
        ask: '소스나 기름이 많이 묻어서 지워지지 않나요?',
        yes: { bin: 'general', why: '음식물이 많이 묻은 비닐은 재활용되지 않아요.' },
      },
    ],
    note: '안쪽이 은색이어도 여러 겹 필름으로 된 비닐이에요. 캔류가 아니에요!',
  },
  {
    id: 'vinylbag',
    name: '비닐봉지·포장 비닐',
    emoji: '🛍️',
    keywords: '비닐 봉투 랩 뽁뽁이 에어캡 포장',
    bin: 'vinyl',
    checks: [
      {
        stage: 'rinse',
        ask: '음식물이 묻어서 지워지지 않나요?',
        yes: { bin: 'general', why: '음식물이 묻은 비닐은 재활용되지 않아요.' },
      },
      { stage: 'detach', ask: '스티커나 테이프가 붙어 있나요?', yes: { fix: '스티커와 테이프를 떼어요.' } },
    ],
    note: '여러 장은 한 봉지에 모아서 버리면 날리지 않아요.',
  },
  {
    id: 'cupnoodle',
    name: '컵라면 용기 (스티로폼)',
    emoji: '🍜',
    keywords: '컵라면 라면 용기 스티로폼 컵 국물',
    bin: 'styrofoam',
    checks: [
      { stage: 'empty', ask: '국물이나 건더기가 남아 있나요?', yes: { fix: '국물은 개수대에, 건더기는 음식물 쓰레기로 버려요.' } },
      {
        stage: 'rinse',
        ask: '헹궈도 빨간 국물 자국이 지워지지 않나요?',
        yes: { bin: 'general', why: '음식물이 밴 스티로폼은 재활용되지 않아요. 깨끗한 용기만 스티로폼으로 버려요.' },
      },
      { stage: 'detach', ask: '뚜껑이 붙어 있나요?', yes: { fix: '뚜껑은 떼어 일반쓰레기로 버려요.' } },
    ],
  },
  {
    id: 'styrofoam',
    name: '스티로폼 완충재',
    emoji: '📦',
    keywords: '스티로폼 상자 포장재 완충재 택배',
    bin: 'styrofoam',
    checks: [
      { stage: 'detach', ask: '테이프나 스티커, 운송장이 붙어 있나요?', yes: { fix: '테이프·스티커·운송장을 모두 떼어요.' } },
      {
        stage: 'material',
        ask: '색깔이 있거나 겉이 코팅된 스티로폼인가요?',
        yes: { bin: 'general', why: '색깔이 있거나 코팅된 스티로폼은 재활용이 어려워요.' },
      },
    ],
  },
  {
    id: 'paper',
    name: '프린트물·종이',
    emoji: '📄',
    keywords: '종이 프린트 학습지 가정통신문 a4 신문 상자 박스',
    bin: 'paper',
    checks: [
      { stage: 'detach', ask: '스테이플러 심이나 테이프가 붙어 있나요?', yes: { fix: '스테이플러 심과 테이프를 떼어요.' } },
      {
        stage: 'material',
        ask: '비닐 코팅이 된 종이인가요?',
        yes: { bin: 'general', why: '코팅된 종이는 물에 풀리지 않아 재활용이 안 돼요.' },
      },
      {
        stage: 'material',
        ask: '물에 젖었거나 음식물이 묻었나요?',
        yes: { bin: 'general', why: '젖거나 오염된 종이는 재활용 품질을 떨어뜨려요.' },
      },
    ],
    note: '상자는 펼쳐서 납작하게 묶어 내요.',
  },
  {
    id: 'note',
    name: '스프링 노트·책',
    emoji: '📒',
    keywords: '노트 공책 스프링 책 문제집 교과서',
    bin: 'paper',
    checks: [
      { stage: 'detach', ask: '스프링이 달려 있나요?', yes: { fix: '스프링은 빼서 캔·고철류로 버려요.' } },
      { stage: 'detach', ask: '비닐 코팅된 표지가 있나요?', yes: { fix: '표지는 떼어 일반쓰레기로 버려요.' } },
    ],
    note: '종이가 아닌 부분을 떼어야 종이로 재활용돼요.',
  },
  {
    id: 'receipt',
    name: '영수증',
    emoji: '🧾',
    keywords: '영수증 매점 편의점 카드전표 감열지',
    bin: 'paper',
    checks: [
      {
        stage: 'material',
        ask: '반들반들하고, 손톱으로 긁으면 검게 변하나요? (감열지)',
        yes: { bin: 'general', why: '감열지는 열에 반응하는 화학물질로 코팅되어 있어 종이로 재활용할 수 없어요.' },
      },
    ],
    note: '매점·편의점 영수증은 대부분 감열지예요.',
  },
  {
    id: 'pen',
    name: '볼펜·샤프·문구류',
    emoji: '🖊️',
    keywords: '볼펜 샤프 펜 형광펜 지우개 자 필통 문구',
    bin: 'plastic',
    checks: [
      {
        stage: 'material',
        ask: '분리배출 표시(삼각형 마크)가 있나요?',
        no: { bin: 'general', why: '여러 재질이 섞인 작은 제품은 선별 과정에서 걸러지지 않아 일반쓰레기로 버려요.' },
      },
    ],
    note: '다 쓴 건전지는 일반쓰레기가 아니라 폐건전지 수거함에 넣어요.',
  },
  {
    id: 'straw',
    name: '빨대·일회용 숟가락',
    emoji: '🥄',
    keywords: '빨대 숟가락 포크 나무젓가락 이쑤시개 아이스크림 막대',
    bin: 'general',
    checks: [],
    why: '너무 작아서 선별 과정에서 걸러지지 않아요. 플라스틱이어도 일반쓰레기로 버려요.',
  },
  {
    id: 'tissue',
    name: '휴지·물티슈',
    emoji: '🧻',
    keywords: '휴지 물티슈 티슈 냅킨 키친타월',
    bin: 'general',
    checks: [],
    why: '휴지는 섬유가 짧아 재활용이 안 되고, 물티슈는 플라스틱 섬유로 만들어져 종이가 아니에요.',
  },
  {
    id: 'glass',
    name: '유리병',
    emoji: '🍾',
    keywords: '유리 병 음료병 드링크',
    bin: 'glass',
    checks: [
      {
        stage: 'material',
        ask: '깨졌나요?',
        yes: { bin: 'general', why: '깨진 유리는 신문지에 싸서 일반쓰레기로 버려요. 맨손으로 만지지 마세요!' },
      },
      { stage: 'empty', ask: '내용물이 남아 있나요?', yes: { fix: '내용물을 비워요.' } },
      { stage: 'detach', ask: '금속·플라스틱 뚜껑이 있나요?', yes: { fix: '뚜껑은 재질에 맞게 따로 버려요.' } },
    ],
  },
];

// 목록에 없는 물건: 분리배출 표시로 재질을 고른 뒤 공통 조건을 확인
window.UNKNOWN_ITEM = {
  id: 'unknown',
  name: '목록에 없는 물건',
  emoji: '🔍',
  bin: 'general',
  choose: {
    stage: 'material',
    ask: '분리배출 표시(삼각형 마크) 안에 뭐라고 적혀 있나요?',
    options: [
      { label: '페트', bin: 'plastic' },
      { label: '플라스틱 (PP·PE·PS 등)', bin: 'plastic' },
      { label: '비닐류 (OTHER 등)', bin: 'vinyl' },
      { label: '종이', bin: 'paper' },
      { label: '종이팩', bin: 'carton' },
      { label: '캔류 (철·알미늄)', bin: 'can' },
      { label: '유리', bin: 'glass' },
      {
        label: '표시가 없어요',
        bin: 'general',
        end: true,
        why: '분리배출 표시가 없는 물건은 대부분 일반쓰레기예요. 헷갈리면 디버깅 부스에 물어봐 주세요!',
      },
    ],
  },
  checks: [
    { stage: 'empty', ask: '내용물이 남아 있나요?', yes: { fix: '내용물을 비워요.' } },
    {
      stage: 'rinse',
      ask: '음식물이 묻어서 씻어도 지워지지 않나요?',
      yes: { bin: 'general', why: '음식물로 오염된 물건은 재활용되지 않아요.' },
    },
    { stage: 'detach', ask: '라벨·스티커·뚜껑처럼 다른 재질이 붙어 있나요?', yes: { fix: '다른 재질은 떼어서 각각 맞는 곳에 버려요.' } },
  ],
};
