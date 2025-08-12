(function () {
  const App = window.App || (window.App = {});
  const St = App.State || {};

  // ---- 表計算入力のフォーカス移動 ----
  function handleKey(e) {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const focusable = Array.from(document.querySelectorAll('input[data-idx], select[data-idx]'));
      const idx = focusable.indexOf(e.target);
      if (idx !== -1 && idx < focusable.length - 1) {
        const n = focusable[idx + 1];
        St.nextFocus = { type: n.dataset.type, idx: n.dataset.idx, key: n.dataset.key };
      } else {
        St.nextFocus = null;
      }
      e.target.blur();
    }
  }
  function handlePointerDown(e) {
    const t = e.target.closest('input[data-idx], select[data-idx]');
    if (t) St.nextFocus = { type: t.dataset.type, idx: t.dataset.idx, key: t.dataset.key };
    else St.nextFocus = null;
  }
  document.addEventListener('pointerdown', handlePointerDown, true);

  // ---- 電卓（スマホKB抑止 & 結果インライン表示）----
  function guardFocus(e) {
    const input = e.target;
    if (input.readOnly) {
      e.preventDefault?.();
      input.blur();
    }
  }
  function guardTouch(e) {
    const input = e.target;
    if (input.readOnly) {
      e.preventDefault?.();
      input.blur();
    }
  }

  function openCalc() {
    const ov = document.getElementById('calcOverlay');
    if (ov) ov.classList.remove('hidden');

    const input = document.getElementById('calcInput');
    const res = document.getElementById('calcResult');
    const edit = document.getElementById('calcEditToggle');

    if (res) res.textContent = '';

    if (input) {
      input.setAttribute('readonly', '');
      input.setAttribute('inputmode', 'none');
      input.blur();
      input.removeEventListener('focus', guardFocus);
      input.removeEventListener('touchstart', guardTouch);
      input.addEventListener('focus', guardFocus, { passive: false });
      input.addEventListener('touchstart', guardTouch, { passive: false });
    }
    if (edit) edit.setAttribute('aria-pressed', 'false');
  }

  function closeCalc() {
    const ov = document.getElementById('calcOverlay');
    if (ov) ov.classList.add('hidden');
  }

  function calcToggleEdit() {
    const input = document.getElementById('calcInput');
    const btn = document.getElementById('calcEditToggle');
    if (!input) return;
    const enable = input.readOnly;
    if (enable) {
      input.removeAttribute('readonly');
      input.setAttribute('inputmode', 'decimal');
      btn?.setAttribute('aria-pressed', 'true');
      input.focus();
    } else {
      input.setAttribute('readonly', '');
      input.setAttribute('inputmode', 'none');
      btn?.setAttribute('aria-pressed', 'false');
      input.blur();
    }
  }

  function calcInsert(char) {
    const input = document.getElementById('calcInput');
    if (!input) return;
    const pos = input.selectionStart ?? input.value.length;
    input.value = input.value.slice(0, pos) + char + input.value.slice(pos);
  }

  function calcClear() {
    const input = document.getElementById('calcInput');
    const r = document.getElementById('calcResult');
    if (input) input.value = '';
    if (r) r.textContent = '';
  }

  function calcCalculate() {
    const out = document.getElementById('calcResult');
    try {
      const v = document.getElementById('calcInput')?.value || '';
      /* eslint-disable no-eval */
      const r = eval(v);
      /* eslint-enable no-eval */
      if (out) out.textContent = (isFinite(r) ? `= ${r}` : 'Error');
    } catch {
      if (out) out.textContent = 'Error';
    }
  }

  function calcKey(e) {
    if (e.key === 'Enter') calcCalculate();
    if (e.key === 'Escape') closeCalc();
  }

  // Escでモーダルを閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCalc();
  });

  // 公開（既存HTMLの inline イベント互換）
  App.Events = Object.assign(App.Events || {}, {
    handleKey,
    handlePointerDown,
    openCalc,
    closeCalc,
    calcInsert,
    calcClear,
    calcCalculate,
    calcKey,
    calcToggleEdit,
  });
  Object.assign(window, {
    handleKey,
    handlePointerDown,
    openCalc,
    closeCalc,
    calcInsert,
    calcClear,
    calcCalculate,
    calcKey,
    calcToggleEdit,
  });
})();
