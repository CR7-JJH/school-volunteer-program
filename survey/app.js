(function () {
  'use strict';

  var SURVEY = window.SURVEY;
  var CONFIG = window.SURVEY_CONFIG || {};
  var DRAFT_KEY = 'daeyoung-survey-draft-v1';
  var LOCAL_SUBMISSIONS_KEY = 'daeyoung-survey-submissions-v1';
  var SCALE_LABELS = ['전혀 아니다', '아니다', '보통이다', '그렇다', '매우 그렇다'];

  var app = document.getElementById('app');
  var progressBar = document.getElementById('progress-bar');
  var progressText = document.getElementById('progress-text');

  // step: -1 = 시작 화면, 0..n-1 = 설문 섹션, n = 완료 화면
  var state = { step: -1, answers: {} };

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
    } catch (e) {
      /* 무시 */
    }
  }

  function storageRemove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      /* 무시 */
    }
  }

  function saveDraft() {
    storageSet(DRAFT_KEY, { step: state.step, answers: state.answers });
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

  function otherOption(q) {
    return (q.options || []).filter(function (o) { return o.other; })[0];
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
      if (q.type === 'multi' || q.type === 'single' || q.type === 'scale') return '항목을 선택해주세요.';
      return '내용을 입력해주세요.';
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

  function buildPayload() {
    var answers = {};
    SURVEY.sections.forEach(function (section) {
      section.questions.forEach(function (q) {
        if (!isVisible(q)) return;
        var v = state.answers[q.id];
        if (isEmpty(v) && q.type !== 'multi') return;
        if (q.type === 'number') v = Number(v);
        else if (typeof v === 'string') v = v.trim();
        answers[q.id] = v === undefined ? [] : v;
        if (isOtherSelected(q)) answers[otherKey(q)] = String(state.answers[otherKey(q)] || '').trim();
      });
    });
    return {
      submittedAt: new Date().toISOString(),
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
    return el('label', { className: 'choice' }, [input, el('span', { className: 'choice-label', text: option.label })]);
  }

  function renderControl(q) {
    var value = state.answers[q.id];

    switch (q.type) {
      case 'text':
      case 'number':
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

      case 'textarea':
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

      case 'single':
      case 'multi':
        var group = el('div', {
          className: 'choices' + (q.layout === 'row' ? ' row' : '') + (q.type === 'multi' ? ' compact' : ''),
          role: q.type === 'single' ? 'radiogroup' : 'group',
        }, q.options.map(function (o) {
          return renderOptionInput(q, o, q.type === 'single' ? 'radio' : 'checkbox');
        }));
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
        if (q.type === 'multi' && q.max) {
          var count = Array.isArray(value) ? value.length : 0;
          wrap.appendChild(el('div', { className: 'counter', text: count + ' / ' + q.max + '개 선택' }));
          // 최대 개수에 도달하면 나머지 선택지를 비활성화
          Array.prototype.forEach.call(group.querySelectorAll('input'), function (input) {
            input.disabled = count >= q.max && !input.checked;
            input.parentNode.classList.toggle('disabled', input.disabled);
          });
        }
        return wrap;

      case 'scale':
        return el('div', { className: 'scale', role: 'radiogroup' }, [1, 2, 3, 4, 5].map(function (n) {
          var input = el('input', {
            type: 'radio',
            name: q.id,
            value: String(n),
            checked: value === n,
            onchange: function () {
              state.answers[q.id] = n;
              onAnswerChange(q);
            },
          });
          return el('label', { className: 'scale-item' }, [
            input,
            el('span', { className: 'scale-dot', text: String(n) }),
            el('span', { className: 'scale-label', text: SCALE_LABELS[n - 1] }),
          ]);
        }));

      case 'consent':
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
    return null;
  }

  function renderQuestion(q) {
    if (!isVisible(q)) return null;
    var labelFor = q.type === 'text' || q.type === 'number' || q.type === 'textarea' ? 'q-' + q.id : null;
    var titleTag = labelFor ? 'label' : 'div';
    return el('fieldset', { className: 'question', 'data-qid': q.id }, [
      el(titleTag, { className: 'question-title', for: labelFor }, [
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
    var total = SURVEY.sections.length;
    var done = state.step < 0 ? 0 : Math.min(state.step, total);
    progressBar.style.width = (done / total) * 100 + '%';
    progressText.textContent = state.step < 0
      ? ''
      : state.step >= total ? '완료' : (state.step + 1) + ' / ' + total;
  }

  function render() {
    setProgress();
    app.textContent = '';
    if (state.step < 0) renderIntro();
    else if (state.step >= SURVEY.sections.length) renderDone();
    else renderSection();
  }

  function renderIntro() {
    var draft = storageGet(DRAFT_KEY);
    var hasDraft = draft && draft.answers && Object.keys(draft.answers).length > 0;

    var actions = el('div', { className: 'actions' }, [
      el('button', {
        className: 'btn primary',
        type: 'button',
        text: hasDraft ? '이어서 작성하기' : '설문 시작하기',
        onclick: function () {
          if (hasDraft) {
            state.answers = draft.answers;
            state.step = Math.max(0, Math.min(draft.step, SURVEY.sections.length - 1));
          } else {
            state.step = 0;
          }
          go();
        },
      }),
      hasDraft ? el('button', {
        className: 'btn ghost',
        type: 'button',
        text: '처음부터 다시',
        onclick: function () {
          storageRemove(DRAFT_KEY);
          state.answers = {};
          state.step = 0;
          go();
        },
      }) : null,
    ]);

    var sectionList = el('ol', { className: 'section-list' }, SURVEY.sections.map(function (s) {
      return el('li', { text: s.title });
    }));

    app.appendChild(el('section', { className: 'card intro' }, [
      el('p', { className: 'eyebrow', text: CONFIG.brand || '' }),
      el('h1', { text: SURVEY.title }),
      el('p', { className: 'lead', text: SURVEY.intro }),
      CONFIG.deadline ? el('p', { className: 'deadline', text: '응답 마감: ' + CONFIG.deadline }) : null,
      sectionList,
      !CONFIG.submitUrl ? el('p', { className: 'notice', text: '테스트 모드: 제출한 응답은 이 기기에만 저장됩니다.' }) : null,
      actions,
    ]));
  }

  function renderSection() {
    var section = SURVEY.sections[state.step];
    var isLast = state.step === SURVEY.sections.length - 1;

    var form = el('form', {
      className: 'card',
      novalidate: true,
      onsubmit: function (e) {
        e.preventDefault();
        if (!validateSection(form, section)) return;
        if (isLast) submit(form);
        else {
          state.step += 1;
          go();
        }
      },
    }, [
      el('p', { className: 'eyebrow', text: 'STEP ' + (state.step + 1) }),
      el('h2', { text: section.title }),
      section.description ? el('p', { className: 'lead', text: section.description }) : null,
      el('div', { className: 'questions' }, section.questions.map(renderQuestion)),
      el('p', { className: 'submit-error', role: 'alert' }),
      el('div', { className: 'actions split' }, [
        el('button', {
          className: 'btn ghost',
          type: 'button',
          text: '이전',
          onclick: function () {
            state.step -= 1;
            go();
          },
        }),
        el('button', { className: 'btn primary', type: 'submit', text: isLast ? '제출하기' : '다음' }),
      ]),
    ]);
    app.appendChild(form);
  }

  function renderDone() {
    var testMode = !CONFIG.submitUrl;
    var name = state.answers.name ? state.answers.name + ' 학생, ' : '';
    app.appendChild(el('section', { className: 'card done' }, [
      el('div', { className: 'done-icon', 'aria-hidden': 'true', text: '✓' }),
      el('h2', { text: '제출이 완료되었어요!' }),
      el('p', { className: 'lead', text: name + '소중한 응답 고마워요. 매칭 결과는 담임선생님을 통해 안내될 예정입니다.' }),
      testMode ? el('p', { className: 'notice', text: '테스트 모드로 제출되어 이 기기에만 저장되었습니다.' }) : null,
      testMode ? el('div', { className: 'actions' }, [
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

    var section = SURVEY.sections[state.step];
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
    var focusTarget = questionsWrap.querySelector('[data-qid="' + q.id + '"] input[value="' + cssEscape(String(state.answers[q.id])) + '"]')
      || questionsWrap.querySelector('[data-qid="' + q.id + '"] input');
    if (focusTarget) focusTarget.focus({ preventScroll: true });
    var otherInput = questionsWrap.querySelector('[data-qid="' + q.id + '"] .other-input');
    if (otherInput && isOtherSelected(q) && isEmpty(state.answers[otherKey(q)])) otherInput.focus();
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
    if (CONFIG.submitUrl) {
      // Apps Script 웹 앱은 CORS 응답을 주지 않으므로 no-cors + text/plain 으로 전송
      request = fetch(CONFIG.submitUrl, {
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
      state.step = SURVEY.sections.length;
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

  document.title = SURVEY.title;
  render();
})();
