(function () {
  'use strict';

  var CONFIG = window.CHECKER_CONFIG || {};
  var BINS = window.BINS;
  var STAGES = window.STAGES;
  var ITEMS = window.ITEMS;
  var UNKNOWN = window.UNKNOWN_ITEM;
  var app = document.getElementById('app');
  var params = new URLSearchParams(window.location.search);
  var from = params.get('from') || '';

  // 공개 여부 (../site-config.js). ?preview=1 이면 닫혀 있어도 열고, 기록은 남기지 않는다
  var PREVIEW = params.get('preview') === '1';
  var SITE = (window.SITE_CONFIG || {}).checker || {};
  var CLOSED = SITE.open === false && !PREVIEW;

  /* ---------- 판별 엔진 ---------- */

  // 판별 상태: 지금까지의 답(history)만 저장하고, 나머지는 매번 다시 계산
  var run = null; // { item, history: [ { kind:'choose'|'check', index, answer } ] }

  function findItem(id) {
    if (id === UNKNOWN.id) return UNKNOWN;
    return ITEMS.filter(function (it) { return it.id === id; })[0] || null;
  }

  // history 를 처음부터 다시 실행해서 현재 상태를 계산
  function evaluate(item, history) {
    var st = { bin: item.bin, fixes: [], trace: [], done: false, why: item.why || '', next: null };
    var pos = 0;

    if (item.choose) {
      var h0 = history[pos];
      if (!h0) {
        st.next = { kind: 'choose', node: item.choose };
        return st;
      }
      var opt = item.choose.options[h0.answer];
      st.bin = opt.bin;
      st.trace.push({ stage: item.choose.stage, ask: item.choose.ask, answer: opt.label, result: opt.end ? 'end' : 'pass' });
      pos += 1;
      if (opt.end) {
        st.done = true;
        st.why = opt.why || '';
        return st;
      }
    }

    var checks = item.checks || [];
    for (var i = 0; i < checks.length; i++) {
      var h = history[pos + i];
      var check = checks[i];
      if (!h) {
        st.next = { kind: 'check', node: check, index: i, total: checks.length };
        return st;
      }
      var outcome = h.answer === 'yes' ? check.yes : check.no;
      var entry = { stage: check.stage, ask: check.ask, answer: h.answer === 'yes' ? '예' : '아니오', result: 'pass' };
      if (outcome && outcome.fix) {
        st.fixes.push(outcome.fix);
        entry.result = 'fix';
        entry.fix = outcome.fix;
      }
      st.trace.push(entry);
      if (outcome && outcome.bin) {
        entry.result = 'end';
        st.bin = outcome.bin;
        st.why = outcome.why || '';
        st.done = true;
        return st;
      }
    }
    st.done = true;
    return st;
  }

  /* ---------- 기록 (선택) ---------- */

  function log(event, data) {
    if (!CONFIG.logUrl || PREVIEW || CLOSED) return;
    var payload = Object.assign({ type: 'checker', event: event, from: from, at: new Date().toISOString() }, data || {});
    try {
      fetch(CONFIG.logUrl, {
        method: 'POST',
        mode: 'no-cors',
        keepalive: true,
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      }).catch(function () { /* 기록 실패는 무시 */ });
    } catch (e) { /* 무시 */ }
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
        else if (key === 'style') node.setAttribute('style', val);
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

  function focusHeading() {
    var h = app.querySelector('h1, h2');
    if (h) {
      h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
    }
    window.scrollTo(0, 0);
  }

  /* ---------- 첫 화면 ---------- */

  function normalize(s) {
    return String(s).toLowerCase().replace(/\s+/g, '');
  }

  function itemButton(item, rank) {
    return el('button', {
      className: 'item' + (item === UNKNOWN ? ' item-unknown' : ''),
      type: 'button',
      onclick: function () { openItem(item.id); },
    }, [
      rank ? el('span', { className: 'rank', text: String(rank) }) : null,
      el('span', { className: 'item-emoji', 'aria-hidden': 'true', text: item.emoji }),
      el('span', { className: 'item-name', text: item.name }),
    ]);
  }

  function renderHome() {
    run = null;
    app.textContent = '';

    var grid = el('div', { className: 'item-grid' });
    var empty = el('p', { className: 'empty', text: '찾는 물건이 없어요. 아래 ‘목록에 없는 물건’으로 판별해 보세요.' });
    empty.hidden = true;

    function fill(query) {
      grid.textContent = '';
      var q = normalize(query || '');
      var list = ITEMS.filter(function (it) {
        return !q || normalize(it.name + it.keywords).indexOf(q) !== -1;
      });
      list.forEach(function (it) { grid.appendChild(itemButton(it)); });
      empty.hidden = list.length > 0;
      grid.appendChild(itemButton(UNKNOWN));
    }

    var search = el('input', {
      className: 'search',
      type: 'search',
      placeholder: '물건 이름으로 찾기 (예: 우유, 컵, 영수증)',
      'aria-label': '물건 이름으로 찾기',
      oninput: function (e) {
        fill(e.target.value);
        top5Block.hidden = !!e.target.value;
      },
    });

    var top5 = (CONFIG.top5 || []).map(findItem).filter(Boolean).slice(0, 5);
    var top5Block = top5.length ? el('section', { className: 'top5' }, [
      el('h2', { className: 'section-title', text: '우리 층에서 가장 많이 틀린 TOP ' + top5.length }),
      el('div', { className: 'item-grid' }, top5.map(function (it, i) { return itemButton(it, i + 1); })),
    ]) : el('div');

    fill('');
    app.appendChild(el('section', { className: 'hero' }, [
      el('p', { className: 'eyebrow', text: '분리배출 디버깅 프로젝트' }),
      el('h1', { text: '이거 어디에 버리지?' }),
      el('p', { className: 'lead', text: '버릴 물건을 고르면 3초 안에 올바른 방법을 알려줄게요.' }),
      el('div', { className: 'slogan', 'aria-label': '버리기 전 3초 if문: 비웠나? 헹궜나? 뗐나? 그러면 재활용 TRUE' }, [
        el('code', null, [
          el('span', { className: 'kw', text: 'if' }),
          ' (비웠나 && 헹궜나 && 뗐나) ',
          el('span', { className: 'arrow', text: '→' }),
          ' 재활용 ',
          el('span', { className: 'true', text: 'TRUE' }),
        ]),
      ]),
    ]));
    app.appendChild(search);
    app.appendChild(top5Block);
    app.appendChild(el('section', null, [
      el('h2', { className: 'section-title', text: '버릴 물건을 골라주세요' }),
      grid,
      empty,
    ]));
  }

  /* ---------- 판별 화면 ---------- */

  function openItem(id) {
    var item = findItem(id);
    if (!item) return renderHome();
    if (window.location.hash !== '#' + id) history.pushState(null, '', '#' + id);
    run = { item: item, history: [] };
    renderRun();
  }

  function answer(value) {
    run.history.push({ answer: value });
    renderRun();
  }

  function undo() {
    if (!run.history.length) {
      history.back();
      return;
    }
    run.history.pop();
    renderRun();
  }

  function renderRun() {
    var st = evaluate(run.item, run.history);
    app.textContent = '';
    if (st.done) {
      renderResult(st);
      log('result', { item: run.item.id, bin: st.bin, fixes: st.fixes.length });
    } else {
      renderQuestion(st);
    }
    focusHeading();
  }

  function stepCount(item) {
    return (item.choose ? 1 : 0) + (item.checks || []).length;
  }

  function renderQuestion(st) {
    var item = run.item;
    var node = st.next.node;
    var total = stepCount(item);
    var current = run.history.length;

    var dots = el('div', { className: 'dots', 'aria-label': (current + 1) + ' / ' + total + '단계' });
    for (var i = 0; i < total; i++) {
      dots.appendChild(el('span', { className: 'dot' + (i < current ? ' done' : i === current ? ' now' : '') }));
    }

    var buttons;
    if (st.next.kind === 'choose') {
      buttons = el('div', { className: 'choose' }, node.options.map(function (opt, idx) {
        return el('button', {
          className: 'btn option',
          type: 'button',
          text: opt.label,
          onclick: function () { answer(idx); },
        });
      }));
    } else {
      buttons = el('div', { className: 'yesno' }, [
        el('button', { className: 'btn yes', type: 'button', text: '예', onclick: function () { answer('yes'); } }),
        el('button', { className: 'btn no', type: 'button', text: '아니오', onclick: function () { answer('no'); } }),
      ]);
    }

    app.appendChild(el('section', { className: 'card question-card' }, [
      el('div', { className: 'card-top' }, [
        el('button', { className: 'link', type: 'button', text: '← 이전', onclick: undo }),
        dots,
      ]),
      el('p', { className: 'item-label' }, [
        el('span', { 'aria-hidden': 'true', text: item.emoji + ' ' }),
        item.name,
      ]),
      el('p', { className: 'stage' }, [
        el('span', { className: 'kw', text: 'if' }),
        ' (' + STAGES[node.stage] + ')',
      ]),
      el('h1', { className: 'ask', text: node.ask }),
      buttons,
    ]));
  }

  function traceLine(t) {
    var mark = t.result === 'end' ? '■' : t.result === 'fix' ? '!' : '✓';
    return el('li', { className: 'trace-' + t.result }, [
      el('span', { className: 'trace-mark', 'aria-hidden': 'true', text: mark }),
      el('span', { className: 'trace-body' }, [
        el('span', { className: 'trace-stage', text: 'if (' + STAGES[t.stage] + ') ' }),
        t.ask + ' → ' + t.answer,
      ]),
    ]);
  }

  function renderResult(st) {
    var item = run.item;
    var bin = BINS[st.bin];
    var recyclable = st.bin !== 'general';

    var fixList = st.fixes.length ? el('section', { className: 'result-block' }, [
      el('h2', { className: 'block-title', text: '버리기 전에 이것만 해 주세요' }),
      el('ol', { className: 'fixes' }, st.fixes.map(function (f) { return el('li', { text: f }); })),
    ]) : null;

    var trace = st.trace.length ? el('details', { className: 'result-block trace' }, [
      el('summary', { text: 'if문 실행 기록 보기' }),
      el('ol', null, st.trace.map(traceLine).concat([
        el('li', { className: 'trace-return' }, [
          el('span', { className: 'trace-mark', 'aria-hidden': 'true', text: '→' }),
          el('span', { className: 'trace-body', text: 'return ' + bin.label + (recyclable ? ' (재활용 TRUE)' : ' (재활용 FALSE)') }),
        ]),
      ])),
    ]) : null;

    app.appendChild(el('section', { className: 'card result-card' }, [
      el('div', { className: 'card-top' }, [
        el('button', { className: 'link', type: 'button', text: '← 이전', onclick: undo }),
      ]),
      el('p', { className: 'item-label' }, [
        el('span', { 'aria-hidden': 'true', text: item.emoji + ' ' }),
        item.name,
      ]),
      el('div', { className: 'bin', style: '--bin:' + bin.color }, [
        el('span', { className: 'bin-caption', text: '여기에 버려요' }),
        el('h1', { className: 'bin-name', text: bin.label }),
        el('span', { className: 'bin-flag', text: recyclable ? '재활용 TRUE' : '재활용 FALSE' }),
      ]),
      st.why ? el('p', { className: 'why', text: st.why }) : null,
      fixList,
      item.note && st.bin === item.bin ? el('p', { className: 'tip', text: '💡 ' + item.note }) : null,
      trace,
      el('div', { className: 'actions' }, [
        el('button', {
          className: 'btn primary', type: 'button', text: '다른 물건 판별하기',
          onclick: function () { history.pushState(null, '', window.location.pathname + window.location.search); renderHome(); focusHeading(); },
        }),
        run.history.length ? el('button', {
          className: 'btn ghost', type: 'button', text: '처음부터 다시',
          onclick: function () { run.history = []; renderRun(); },
        }) : null,
      ]),
    ]));
  }

  /* ---------- 라우팅 ---------- */

  function route() {
    var id = window.location.hash.replace(/^#/, '');
    if (id && findItem(id)) {
      run = { item: findItem(id), history: [] };
      renderRun();
    } else {
      renderHome();
      focusHeading();
    }
  }

  function renderClosed() {
    app.textContent = '';
    app.appendChild(el('section', { className: 'card result-card' }, [
      el('div', { className: 'bin', style: '--bin:#3a3f4b' }, [
        el('span', { className: 'bin-caption', text: '분리배출 판별기' }),
        el('h1', { className: 'bin-name', text: '🔒 준비 중' }),
      ]),
      el('p', { className: 'why', text: SITE.closedMessage || '' }),
      el('div', { className: 'actions' }, [
        el('a', { className: 'btn ghost', href: '../', text: '첫 화면으로', style: 'display:grid;place-items:center;text-decoration:none' }),
      ]),
    ]));
  }

  if (CLOSED) {
    renderClosed();
    return;
  }
  if (PREVIEW) {
    document.body.insertAdjacentHTML('afterbegin', '<p style="margin:0;padding:8px 16px;background:#fff3dc;color:#7a5300;font-size:14px;text-align:center">미리보기: 판별 기록이 시트에 저장되지 않아요. (팀원 확인용)</p>');
  }
  window.addEventListener('popstate', route);
  log('visit');
  route();
})();
