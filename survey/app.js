(function () {
  'use strict';

  var SURVEY = window.SURVEY;
  var CONFIG = window.SURVEY_CONFIG || {};
  var SCALE_LABELS = ['전혀 아니다', '아니다', '보통이다', '그렇다', '매우 그렇다'];
  var UNKNOWN = { value: 'unknown', label: '잘 모르겠어요' };
  var ERROR_TYPES = { rinse: '세척', label: '라벨·부착물', material: '재질' };

  /* ---------- 설문 종류(사전/사후) 결정 ---------- */

  var PHASE = (function () {
    var param = new URLSearchParams(window.location.search).get('phase');
    if (param && SURVEY.phases[param]) return param;
    return SURVEY.phases[CONFIG.defaultPhase] ? CONFIG.defaultPhase : 'pre';
  })();
  var PHASE_INFO = SURVEY.phases[PHASE];

  // 공개 여부 (../site-config.js). ?preview=1 이면 닫혀 있어도 열고, 응답은 저장하지 않는다
  var PREVIEW = new URLSearchParams(window.location.search).get('preview') === '1';
  var SITE = (window.SITE_CONFIG || {})[PHASE === 'post' ? 'postSurvey' : 'preSurvey'] || {};
  var CLOSED = SITE.open === false && !PREVIEW;
  var SUBMIT_URL = PREVIEW ? '' : CONFIG.submitUrl;

  function inPhase(item) {
    return !item.phase || item.phase === PHASE;
  }

  var SECTIONS = SURVEY.sections.filter(inPhase).map(function (s) {
    return Object.assign({}, s, { questions: s.questions.filter(inPhase) });
  });
  var QUIZ = [];
  SECTIONS.forEach(function (s) {
    s.questions.forEach(function (q) {
      if (q.type === 'quiz') {
        q.required = true;
        QUIZ.push(q);
      }
    });
  });

  var DRAFT_KEY = 'recycle-survey-draft-' + PHASE;
  var SUBMITTED_KEY = 'recycle-survey-submitted-' + PHASE;
  var LOCAL_SUBMISSIONS_KEY = 'recycle-survey-submissions';

  var app = document.getElementById('app');
  var progressBar = document.getElementById('progress-bar');
  var progressText = document.getElementById('progress-text');

  // step: -1 = 시작 화면, 0..n-1 = 설문 섹션, n = 완료 화면
  var state = { step: -1, answers: {}, result: null };

  /* ---------- 저장소 (브라우저 저장소가 막혀 있어도 동작하도록) ---------- */

  function storageGet(key) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* 무시 */ }
  }

  function storageRemove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (e) { /* 무시 */ }
  }

  function saveDraft() {
    if (state.step >= 0 && state.step < SECTIONS.length) {
      storageSet(DRAFT_KEY, { step: state.step, answers: state.answers });
    }
  }

  /* ---------- DOM 헬퍼 ---------- */

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var val = attrs[key];
        if (val === undefined || val === null || val === false) return;
        if (key === 'className') node.className = val;
        else if (key === 'text') node.textContent = val;
        else if (key.indexOf('on') === 0) node.addEventListener(key.slice(2), val);
        else node.setAttribute(key, val === true ? '' : val);
      });
    }
    (children || []).forEach(function (child) {
      if (child === null || child === undefined || child === false) return;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return node;
  }

  /* ---------- 응답 로직 ---------- */

  function isVisible(q) {
    if (!q.showIf) return true;
    return state.answers[q.showIf.question] === q.showIf.equals;
  }

  function isEmpty(value) {
    if (value === undefined || value === null) return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'string') return value.trim() === '';
    return false;
  }

  function optionsOf(q) {
    return q.type === 'quiz' ? q.options.concat([UNKNOWN]) : q.options || [];
  }

  function otherOption(q) {
    return optionsOf(q).filter(function (o) { return o.other; })[0];
  }

  function otherKey(q) {
    return q.id + 'Other';
  }

  function isOtherSelected(q) {
    var other = otherOption(q);
    if (!other) return false;
    var v = state.answers[q.id];
    return Array.isArray(v) ? v.indexOf(other.value) !== -1 : v === other.value;
  }

  function validateQuestion(q) {
    var v = state.answers[q.id];

    if (q.required && isEmpty(v)) {
      if (q.type === 'consent') return '동의가 필요합니다.';
      if (q.type === 'text' || q.type === 'textarea' || q.type === 'number') return '내용을 입력해주세요.';
      return '항목을 선택해주세요.';
    }
    if (isEmpty(v)) return null;

    if (q.type === 'number') {
      var n = Number(v);
      if (!/^\d+$/.test(String(v).trim()) || (q.min !== undefined && n < q.min) || (q.max !== undefined && n > q.max)) {
        return q.min + '~' + q.max + ' 사이의 숫자를 입력해주세요.';
      }
    }
    if (q.type === 'multi') {
      if (q.min && v.length < q.min) return '최소 ' + q.min + '개를 선택해주세요.';
      if (q.max && v.length > q.max) return '최대 ' + q.max + '개까지 선택할 수 있어요.';
    }
    if (isOtherSelected(q) && isEmpty(state.answers[otherKey(q)])) {
      return '‘기타’ 내용을 입력해주세요.';
    }
    return null;
  }

  // 0..upTo 단계 중 필수 응답이 빠진 첫 단계 (없으면 -1).
  // 문항이 추가되기 전에 임시저장한 기기가 '이어서 작성하기'로 앞 단계를 건너뛰지 않도록 쓴다
  function firstIncompleteStep(upTo) {
    for (var i = 0; i < SECTIONS.length && i <= upTo; i++) {
      var missing = SECTIONS[i].questions.some(function (q) { return isVisible(q) && validateQuestion(q); });
      if (missing) return i;
    }
    return -1;
  }

  // 빠진 단계로 보내고, 다 채우면 원래 있던 단계(returnTo)로 돌아온다
  function goFix(step, returnTo) {
    state.fixStep = step;
    state.returnStep = returnTo;
    state.step = step;
    go();
  }

  // 퀴즈 채점: 총점과 오류 유형별 점수
  function scoreQuiz() {
    var scores = { quizScore: 0, quizTotal: QUIZ.length };
    Object.keys(ERROR_TYPES).forEach(function (t) {
      scores['quiz_' + t] = 0;
      scores['quiz_' + t + 'Total'] = 0;
    });
    QUIZ.forEach(function (q) {
      var correct = state.answers[q.id] === q.answer;
      if (correct) scores.quizScore += 1;
      if (q.errorType) {
        scores['quiz_' + q.errorType + 'Total'] += 1;
        if (correct) scores['quiz_' + q.errorType] += 1;
      }
    });
    return scores;
  }

  function buildPayload() {
    var answers = {};
    SECTIONS.forEach(function (section) {
      section.questions.forEach(function (q) {
        if (!isVisible(q)) return;
        var v = state.answers[q.id];
        if (isEmpty(v)) {
          if (q.type === 'multi') answers[q.id] = [];
          return;
        }
        if (q.type === 'number') v = Number(v);
        else if (typeof v === 'string') v = v.trim();
        answers[q.id] = v;
        if (isOtherSelected(q)) answers[otherKey(q)] = String(state.answers[otherKey(q)] || '').trim();
      });
    });
    // 학번 = 학년 + 반 + 번호 두 자리 (예: 1학년 2반 5번 → 1205). 시트의 '학번' 열에 들어간다
    if (answers.grade && answers.classNo && answers.studentNo) {
      answers['학번'] = String(answers.grade) + answers.classNo + (answers.studentNo < 10 ? '0' : '') + answers.studentNo;
    }
    return {
      phase: PHASE,
      submittedAt: new Date().toISOString(),
      scores: scoreQuiz(),
      answers: answers,
    };
  }

  /* ---------- 문항 렌더링 ---------- */

  function renderOptionInput(q, option, type) {
    var current = state.answers[q.id];
    var checked = type === 'checkbox'
      ? Array.isArray(current) && current.indexOf(option.value) !== -1
      : current === option.value;

    var input = el('input', {
      type: type,
      name: q.id,
      value: option.value,
      checked: checked,
      onchange: function () {
        if (type === 'checkbox') {
          var list = Array.isArray(state.answers[q.id]) ? state.answers[q.id].slice() : [];
          var idx = list.indexOf(option.value);
          if (input.checked && idx === -1) list.push(option.value);
          if (!input.checked && idx !== -1) list.splice(idx, 1);
          state.answers[q.id] = list;
        } else {
          state.answers[q.id] = option.value;
        }
        onAnswerChange(q);
      },
    });
    var cls = 'choice' + (option === UNKNOWN ? ' unknown' : '');
    return el('label', { className: cls }, [input, el('span', { className: 'choice-label', text: option.label })]);
  }

  function renderTextInput(q, value) {
    return el('input', {
      className: 'text-input' + (q.type === 'number' ? ' narrow' : ''),
      type: 'text',
      inputmode: q.type === 'number' ? 'numeric' : null,
      id: 'q-' + q.id,
      name: q.id,
      maxlength: q.maxLength,
      placeholder: q.placeholder,
      autocomplete: 'off',
      value: value || '',
      oninput: function (e) {
        state.answers[q.id] = e.target.value;
        onAnswerChange(q, true);
      },
    });
  }

  function renderTextarea(q, value) {
    var counter = el('div', { className: 'counter', text: (value || '').length + ' / ' + q.maxLength });
    var area = el('textarea', {
      className: 'text-input',
      id: 'q-' + q.id,
      name: q.id,
      rows: '4',
      maxlength: q.maxLength,
      placeholder: q.placeholder,
      oninput: function (e) {
        state.answers[q.id] = e.target.value;
        counter.textContent = e.target.value.length + ' / ' + q.maxLength;
        onAnswerChange(q, true);
      },
    });
    area.value = value || '';
    return el('div', null, [area, counter]);
  }

  function renderChoices(q, value) {
    var isMulti = q.type === 'multi';
    var cls = 'choices' +
      (q.layout === 'row' ? ' row' : '') +
      (isMulti ? ' compact' : '') +
      (q.type === 'quiz' ? ' stack' : '');
    var group = el('div', { className: cls, role: isMulti ? 'group' : 'radiogroup' },
      optionsOf(q).map(function (o) { return renderOptionInput(q, o, isMulti ? 'checkbox' : 'radio'); }));
    var wrap = el('div', null, [group]);

    var other = otherOption(q);
    if (other && isOtherSelected(q)) {
      wrap.appendChild(el('input', {
        className: 'text-input other-input',
        type: 'text',
        maxlength: '30',
        placeholder: '‘' + other.label + '’ 내용을 적어주세요',
        'aria-label': other.label + ' 내용',
        value: state.answers[otherKey(q)] || '',
        oninput: function (e) {
          state.answers[otherKey(q)] = e.target.value;
          onAnswerChange(q, true);
        },
      }));
    }

    if (isMulti && q.max) {
      var count = Array.isArray(value) ? value.length : 0;
      wrap.appendChild(el('div', { className: 'counter', text: count + ' / ' + q.max + '개 선택' }));
      // 최대 개수에 도달하면 나머지 선택지를 비활성화
      Array.prototype.forEach.call(group.querySelectorAll('input'), function (input) {
        input.disabled = count >= q.max && !input.checked;
        input.parentNode.classList.toggle('disabled', input.disabled);
      });
    }
    return wrap;
  }

  function renderScale(q, value) {
    return el('div', { className: 'scale', role: 'radiogroup' }, [1, 2, 3, 4, 5].map(function (n) {
      return el('label', { className: 'scale-item' }, [
        el('input', {
          type: 'radio',
          name: q.id,
          value: String(n),
          checked: value === n,
          onchange: function () {
            state.answers[q.id] = n;
            onAnswerChange(q);
          },
        }),
        el('span', { className: 'scale-dot', text: String(n) }),
        el('span', { className: 'scale-label', text: SCALE_LABELS[n - 1] }),
      ]);
    }));
  }

  function renderConsent(q, value) {
    return el('div', null, [
      el('div', { className: 'consent-box', text: q.text }),
      el('label', { className: 'choice consent-check' }, [
        el('input', {
          type: 'checkbox',
          name: q.id,
          checked: value === true,
          onchange: function (e) {
            state.answers[q.id] = e.target.checked ? true : undefined;
            onAnswerChange(q);
          },
        }),
        el('span', { className: 'choice-label', text: q.checkLabel }),
      ]),
    ]);
  }

  function renderControl(q) {
    var value = state.answers[q.id];
    switch (q.type) {
      case 'text':
      case 'number': return renderTextInput(q, value);
      case 'textarea': return renderTextarea(q, value);
      case 'single':
      case 'multi':
      case 'quiz': return renderChoices(q, value);
      case 'scale': return renderScale(q, value);
      case 'consent': return renderConsent(q, value);
    }
    return null;
  }

  function renderQuestion(q) {
    if (!isVisible(q)) return null;
    var labelFor = q.type === 'text' || q.type === 'number' || q.type === 'textarea' ? 'q-' + q.id : null;
    return el('div', { className: 'question', role: labelFor ? null : 'group', 'data-qid': q.id, 'aria-labelledby': 't-' + q.id }, [
      el(labelFor ? 'label' : 'div', { className: 'question-title', id: 't-' + q.id, for: labelFor }, [
        q.label,
        q.required ? el('span', { className: 'required', 'aria-label': '필수', text: '*' }) : null,
      ]),
      q.help ? el('p', { className: 'question-help', text: q.help }) : null,
      renderControl(q),
      el('p', { className: 'error', role: 'alert' }),
    ]);
  }

  /* ---------- 화면 ---------- */

  function setProgress() {
    var total = SECTIONS.length;
    var done = state.step < 0 ? 0 : Math.min(state.step, total);
    progressBar.style.width = (done / total) * 100 + '%';
    progressText.textContent = state.step < 0
      ? ''
      : state.step >= total ? '완료' : (state.step + 1) + ' / ' + total;
  }

  function renderClosed() {
    progressBar.style.width = '0%';
    progressText.textContent = '';
    app.textContent = '';
    app.appendChild(el('section', { className: 'card done' }, [
      el('div', { className: 'done-icon', 'aria-hidden': 'true', text: '🔒' }),
      el('h2', { text: PHASE_INFO.label + '은 지금 열려 있지 않아요' }),
      el('p', { className: 'lead', text: SITE.closedMessage || '' }),
      el('div', { className: 'actions center' }, [
        el('a', { className: 'btn ghost', href: '../', text: '첫 화면으로' }),
      ]),
    ]));
  }

  function render() {
    if (CLOSED) return renderClosed();
    setProgress();
    app.textContent = '';
    if (state.step < 0) renderIntro();
    else if (state.step >= SECTIONS.length) renderDone();
    else renderSection();
  }

  function renderIntro() {
    var draft = storageGet(DRAFT_KEY);
    var hasDraft = draft && draft.answers && Object.keys(draft.answers).length > 0;
    var submittedAt = storageGet(SUBMITTED_KEY);
    var alreadySubmitted = !!submittedAt;
    // 학번을 받기 전에 제출한 기기: 그 응답은 삭제되었으니 다시 참여하도록 안내
    var needsRedo = alreadySubmitted && PHASE_INFO.redoBefore && String(submittedAt) < PHASE_INFO.redoBefore;
    var deadline = CONFIG.deadline && CONFIG.deadline[PHASE];

    function start(fromDraft) {
      state.fixStep = undefined;
      state.returnStep = undefined;
      if (fromDraft) {
        state.answers = draft.answers;
        state.step = Math.max(0, Math.min(draft.step, SECTIONS.length - 1));
        var gap = firstIncompleteStep(state.step - 1);
        if (gap !== -1) return goFix(gap, state.step);
      } else {
        storageRemove(DRAFT_KEY);
        state.answers = {};
        state.step = 0;
      }
      go();
    }

    var actions;
    if (needsRedo && !hasDraft) {
      actions = el('div', null, [
        el('p', { className: 'notice', text: PHASE_INFO.redoMessage }),
        el('div', { className: 'actions' }, [
          el('button', {
            className: 'btn primary', type: 'button', text: '학번 적고 다시 참여하기',
            onclick: function () { start(false); },
          }),
        ]),
      ]);
    } else if (alreadySubmitted && !hasDraft) {
      actions = el('div', null, [
        el('p', { className: 'notice', text: '이 기기에서 이미 ' + PHASE_INFO.label + '을 제출했어요. 참여해줘서 고마워요!' }),
        el('div', { className: 'actions' }, [
          el('button', {
            className: 'btn ghost', type: 'button', text: '다른 사람이 이 기기로 응답하기',
            onclick: function () { start(false); },
          }),
        ]),
      ]);
    } else {
      actions = el('div', { className: 'actions' }, [
        el('button', {
          className: 'btn primary', type: 'button',
          text: hasDraft ? '이어서 작성하기' : '설문 시작하기',
          onclick: function () { start(hasDraft); },
        }),
        hasDraft ? el('button', {
          className: 'btn ghost', type: 'button', text: '처음부터 다시',
          onclick: function () { start(false); },
        }) : null,
      ]);
    }

    app.appendChild(el('section', { className: 'card intro' }, [
      el('p', { className: 'eyebrow', text: '분리배출 디버깅 프로젝트 · ' + PHASE_INFO.label }),
      el('h1', { text: PHASE_INFO.title }),
      el('p', { className: 'lead', text: PHASE_INFO.intro }),
      PHASE_INFO.notice ? el('p', { className: 'phase-notice', text: PHASE_INFO.notice }) : null,
      el('div', { className: 'slogan' }, [
        el('span', { className: 'slogan-label', text: '버리기 전 3초 if문' }),
        el('code', { text: 'if (비웠나 && 헹궜나 && 뗐나) → 재활용 TRUE' }),
      ]),
      el('ul', { className: 'meta-list' }, [
        el('li', { text: PHASE === 'post' ? '사전 설문 때와 같은 학년·반·번호를 적어요 · 이름은 묻지 않아요' : '학년·반·번호를 적어요 · 이름은 묻지 않아요' }),
        el('li', { text: '퀴즈 ' + QUIZ.length + '문항 + 간단한 질문 · 약 3분' }),
        deadline ? el('li', { text: '응답 마감: ' + deadline }) : null,
      ]),
      PREVIEW ? el('p', { className: 'notice', text: '미리보기: 응답이 시트에 저장되지 않아요. (팀원 확인용)' })
        : !SUBMIT_URL ? el('p', { className: 'notice', text: '테스트 모드: 제출한 응답은 이 기기에만 저장됩니다.' }) : null,
      actions,
    ]));
  }

  // description 이 { pre, post } 형태면 지금 설문 종류에 맞는 문구를 고른다
  function sectionDescription(section) {
    var d = section.description;
    return d && typeof d === 'object' ? d[PHASE] || '' : d || '';
  }

  function renderSection() {
    var section = SECTIONS[state.step];
    var isLast = state.step === SECTIONS.length - 1;

    var form = el('form', {
      className: 'card',
      novalidate: true,
      onsubmit: function (e) {
        e.preventDefault();
        if (!validateSection(form, section)) return;
        // 제출·복귀 전에 앞 단계를 다시 확인 (빠진 필수 응답이 있으면 그 단계로)
        if (isLast || state.returnStep !== undefined) {
          var gap = firstIncompleteStep(state.step - 1);
          if (gap !== -1) return goFix(gap, isLast ? state.step : state.returnStep);
        }
        state.fixStep = undefined;
        if (state.returnStep !== undefined && state.returnStep > state.step) {
          var gapAfter = firstIncompleteStep(state.returnStep - 1);
          if (gapAfter !== -1) return goFix(gapAfter, state.returnStep);
          state.step = state.returnStep;
          state.returnStep = undefined;
          go();
        } else if (isLast) {
          state.returnStep = undefined;
          submit(form);
        } else {
          state.step += 1;
          go();
        }
      },
    }, [
      el('p', { className: 'eyebrow', text: 'STEP ' + (state.step + 1) }),
      el('h2', { text: section.title }),
      sectionDescription(section) ? el('p', { className: 'lead', text: sectionDescription(section) }) : null,
      state.fixStep === state.step ? el('p', {
        className: 'notice',
        text: '이 단계에 아직 채우지 않은 필수 항목이 있어요. 채운 뒤 ‘' + (isLast ? '제출하기' : '다음') + '’를 누르면 하던 곳으로 돌아가요. 앞서 고른 답은 그대로 남아 있어요.',
      }) : null,
      el('div', { className: 'questions' }, section.questions.map(renderQuestion)),
      isLast ? el('p', { className: 'privacy', text: SURVEY.privacyNotice }) : null,
      el('p', { className: 'submit-error', role: 'alert' }),
      el('div', { className: 'actions split' }, [
        state.step > 0 ? el('button', {
          className: 'btn ghost', type: 'button', text: '이전',
          onclick: function () {
            state.step -= 1;
            go();
          },
        }) : el('button', {
          className: 'btn ghost', type: 'button', text: '처음으로',
          onclick: function () {
            state.step = -1;
            go();
          },
        }),
        el('button', { className: 'btn primary', type: 'submit', text: isLast ? '제출하기' : '다음' }),
      ]),
    ]);
    app.appendChild(form);
  }

  function labelOf(q, value) {
    var found = optionsOf(q).filter(function (o) { return o.value === value; })[0];
    return found ? found.label : '-';
  }

  function renderResults(answers) {
    var scores = scoreQuiz();
    var typeSummary = Object.keys(ERROR_TYPES).map(function (t) {
      var total = scores['quiz_' + t + 'Total'];
      if (!total) return null;
      return el('li', null, [
        el('span', { text: ERROR_TYPES[t] }),
        el('strong', { text: scores['quiz_' + t] + ' / ' + total }),
      ]);
    });

    return el('div', { className: 'results' }, [
      el('div', { className: 'score' }, [
        el('span', { className: 'score-num', text: String(scores.quizScore) }),
        el('span', { className: 'score-total', text: ' / ' + scores.quizTotal + ' 정답' }),
      ]),
      el('ul', { className: 'type-summary' }, typeSummary),
      el('h3', { text: '정답과 해설' }),
      el('ol', { className: 'review' }, QUIZ.map(function (q) {
        var mine = answers[q.id];
        var ok = mine === q.answer;
        return el('li', { className: ok ? 'ok' : 'wrong' }, [
          el('p', { className: 'review-q' }, [
            el('span', { className: 'badge', text: ok ? '정답' : '오답' }),
            q.label.replace(/^\d+\.\s*/, ''),
          ]),
          !ok ? el('p', { className: 'review-mine', text: '내 답: ' + labelOf(q, mine) }) : null,
          el('p', { className: 'review-answer', text: '정답: ' + labelOf(q, q.answer) }),
          el('p', { className: 'review-exp', text: q.explanation }),
        ]);
      })),
    ]);
  }

  // 간식 받을 때 보여줄 확인 상자: 제출 시각을 크게 보여줘 오래된 캡처와 구분
  function renderReward() {
    var t = state.submittedAt ? new Date(state.submittedAt) : new Date();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var when = (t.getMonth() + 1) + '월 ' + t.getDate() + '일 ' + pad(t.getHours()) + ':' + pad(t.getMinutes());
    return el('div', { className: 'reward' }, [
      el('p', { className: 'reward-title', text: '🍪 간식 받기' }),
      el('p', { className: 'reward-text', text: PHASE_INFO.reward }),
      el('p', { className: 'reward-time', text: PHASE_INFO.label + ' 제출 · ' + when }),
    ]);
  }

  function renderDone() {
    var testMode = !SUBMIT_URL;
    app.appendChild(el('section', { className: 'card done' }, [
      el('div', { className: 'done-icon', 'aria-hidden': 'true', text: '✓' }),
      el('h2', { text: '제출이 완료되었어요!' }),
      el('p', { className: 'lead', text: '소중한 응답 고마워요. ' + PHASE_INFO.doneMessage }),
      PHASE_INFO.reward ? renderReward() : null,
      PHASE === 'post' ? renderResults(state.answers) : null,
      testMode ? el('p', { className: 'notice', text: '테스트 모드로 제출되어 이 기기에만 저장되었습니다.' }) : null,
      testMode ? el('div', { className: 'actions center' }, [
        el('button', { className: 'btn ghost', type: 'button', text: '저장된 응답 내려받기 (JSON)', onclick: downloadLocalSubmissions }),
      ]) : null,
    ]));
  }

  /* ---------- 동작 ---------- */

  function go() {
    saveDraft();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    var heading = app.querySelector('h1, h2');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  }

  // 선택형 문항은 화면을 다시 그려 조건부 문항·기타 입력칸·선택 개수를 갱신
  function onAnswerChange(q, isTyping) {
    saveDraft();
    var node = app.querySelector('[data-qid="' + q.id + '"]');
    if (node && node.classList.contains('has-error')) showError(node, validateQuestion(q));
    if (isTyping) return;

    var section = SECTIONS[state.step];
    var questionsWrap = app.querySelector('.questions');
    if (!questionsWrap || !section) return;
    var errors = {};
    Array.prototype.forEach.call(questionsWrap.querySelectorAll('.question.has-error'), function (n) {
      errors[n.getAttribute('data-qid')] = true;
    });
    questionsWrap.textContent = '';
    section.questions.forEach(function (sq) {
      var rendered = renderQuestion(sq);
      if (!rendered) return;
      questionsWrap.appendChild(rendered);
      if (errors[sq.id]) showError(rendered, validateQuestion(sq));
    });

    var scope = '[data-qid="' + q.id + '"] ';
    var current = state.answers[q.id];
    var focusTarget = (typeof current === 'string' && questionsWrap.querySelector(scope + 'input[value="' + cssEscape(current) + '"]')) ||
      questionsWrap.querySelector(scope + 'input');
    if (focusTarget) focusTarget.focus({ preventScroll: true });
    var otherInput = questionsWrap.querySelector(scope + '.other-input');
    if (otherInput && isEmpty(state.answers[otherKey(q)])) otherInput.focus({ preventScroll: true });
  }

  function cssEscape(s) {
    return window.CSS && CSS.escape ? CSS.escape(s) : s.replace(/["\\]/g, '\\$&');
  }

  function showError(node, message) {
    node.classList.toggle('has-error', !!message);
    node.querySelector('.error').textContent = message || '';
  }

  function validateSection(form, section) {
    var firstInvalid = null;
    section.questions.forEach(function (q) {
      if (!isVisible(q)) return;
      var node = form.querySelector('[data-qid="' + q.id + '"]');
      var message = validateQuestion(q);
      showError(node, message);
      if (message && !firstInvalid) firstInvalid = node;
    });
    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var input = firstInvalid.querySelector('input, textarea');
      if (input) input.focus({ preventScroll: true });
      return false;
    }
    return true;
  }

  function submit(form) {
    var button = form.querySelector('button[type="submit"]');
    var errorBox = form.querySelector('.submit-error');
    var payload = buildPayload();
    errorBox.textContent = '';
    button.disabled = true;
    button.textContent = '제출 중…';

    var request;
    if (SUBMIT_URL) {
      // Apps Script 웹 앱은 CORS 응답을 주지 않으므로 no-cors + text/plain 으로 전송
      request = fetch(SUBMIT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
    } else {
      var list = storageGet(LOCAL_SUBMISSIONS_KEY) || [];
      list.push(payload);
      storageSet(LOCAL_SUBMISSIONS_KEY, list);
      request = Promise.resolve();
    }

    request.then(function () {
      storageRemove(DRAFT_KEY);
      storageSet(SUBMITTED_KEY, payload.submittedAt);
      state.submittedAt = payload.submittedAt;
      state.step = SECTIONS.length;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }).catch(function () {
      button.disabled = false;
      button.textContent = '다시 제출하기';
      errorBox.textContent = '제출에 실패했어요. 인터넷 연결을 확인한 뒤 다시 시도해주세요. (작성한 내용은 저장되어 있어요)';
    });
  }

  function downloadLocalSubmissions() {
    var list = storageGet(LOCAL_SUBMISSIONS_KEY) || [];
    var blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = el('a', { href: url, download: 'survey-responses.json' });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  document.title = '분리배출 디버깅 · ' + PHASE_INFO.label;
  document.getElementById('topbar-title').textContent = '분리배출 디버깅 · ' + PHASE_INFO.label;
  render();
})();
