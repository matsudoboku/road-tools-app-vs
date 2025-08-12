// js/events.js
(function(){
  const App = window.App || (window.App = {});
  const St = App.State || {};

  // 入力フォーカス移動
  function handleKey(e){
    if(e.key === 'Enter' || e.key === 'Tab'){
      e.preventDefault();
      const focusable = Array.from(document.querySelectorAll('input[data-idx], select[data-idx]'));
      const idx = focusable.indexOf(e.target);
      if(idx !== -1 && idx < focusable.length - 1){
        const n = focusable[idx+1];
        St.nextFocus = { type:n.dataset.type, idx:n.dataset.idx, key:n.dataset.key };
      } else {
        St.nextFocus = null;
      }
      e.target.blur();
    }
  }
  function handlePointerDown(e){
    const t = e.target.closest('input[data-idx], select[data-idx]');
    if(t){ St.nextFocus = { type:t.dataset.type, idx:t.dataset.idx, key:t.dataset.key }; }
    else { St.nextFocus = null; }
  }

  // 電卓（スマホでキーボード非表示 + モーダル中央）
  function isMobile(){ return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent); }

  function openCalc(){
    const overlay = document.getElementById('calcOverlay');
    if(!overlay) return;
    overlay.classList.remove('hidden');

    // スマホはフォーカスしない（キーボード回避）
    if(!isMobile()){
      const input = document.getElementById('calcInput');
      if(input) input.focus();
    }
    // 背景スクロールを止める
    document.body.style.overflow = 'hidden';
    const r = document.getElementById('calcResult');
    if(r) r.textContent = '';
  }
  function closeCalc(){
    const overlay = document.getElementById('calcOverlay');
    if(!overlay) return;
    overlay.classList.add('hidden');
    // 背景スクロールを戻す
    document.body.style.overflow = '';
  }
  function calcInsert(char){
    const input = document.getElementById('calcInput');
    if(!input) return;
    input.value += char;
  }
  function calcClear(){
    const input = document.getElementById('calcInput');
    const r = document.getElementById('calcResult');
    if(input) input.value = '';
    if(r) r.textContent = '';
  }
  function calcCalculate(){
    const out = document.getElementById('calcResult');
    try{
      const v = (document.getElementById('calcInput')?.value || '');
      const r = eval(v);
      if(out) out.textContent = r;
    }catch(err){
      if(out) out.textContent = 'Error';
    }
  }
  function calcKey(e){
    if(e.key === 'Enter') calcCalculate();
    if(e.key === 'Escape') closeCalc();
  }

  document.addEventListener('pointerdown', handlePointerDown, true);
  document.addEventListener('keydown', calcKey);

  App.Events = Object.assign(App.Events || {}, {
    handleKey, handlePointerDown,
    openCalc, closeCalc, calcInsert, calcClear, calcCalculate, calcKey
  });

  // inline 呼び出し対応
  Object.assign(window, { openCalc, closeCalc, calcInsert, calcClear, calcCalculate, calcKey });
})();
