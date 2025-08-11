(function(){
  const App = window.App || (window.App = {});
  const St = App.State;

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

  // ===== 電卓 =====
  function openCalc(){
    const overlay = document.getElementById('calcOverlay');
    const input = document.getElementById('calcInput');
    const result = document.getElementById('calcResult');
    if (!overlay || !input) return;

    overlay.classList.remove('hidden');
    if (result) result.textContent = '';

    const IS_MOBILE = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

    if (IS_MOBILE) {
      // モバイル：ソフトキーボードを出さない
      input.setAttribute('readonly', 'readonly');
      input.setAttribute('inputmode', 'none');
      input.blur();
    } else {
      // デスクトップ：通常どおりフォーカス可
      input.removeAttribute('readonly');
      input.focus();
    }
  }

  function closeCalc(){
    const overlay = document.getElementById('calcOverlay');
    if (overlay) overlay.classList.add('hidden');
  }

  function calcInsert(char){
    const input = document.getElementById('calcInput');
    if(input){
      input.value += char;
      // readonly でも値は反映される。モバイルは blur のままでOK
    }
  }

  function calcClear(){
    const input = document.getElementById('calcInput');
    const r = document.getElementById('calcResult');
    if(input) input.value='';
    if(r) r.textContent='';
  }

  function calcCalculate(){
    try{
      const v = document.getElementById('calcInput')?.value || '';
      // eslint-disable-next-line no-eval
      const r = eval(v);
      const out = document.getElementById('calcResult');
      if(out) out.textContent = (r ?? '') + '';
    }catch(err){
      const out = document.getElementById('calcResult');
      if(out) out.textContent = 'Error';
    }
  }

  function calcKey(e){
    if(e.key==='Enter') calcCalculate();
  }

  document.addEventListener('pointerdown', handlePointerDown, true);

  // 公開
  App.Events = {
    handleKey, handlePointerDown,
    openCalc, closeCalc,
    calcInsert, calcClear, calcCalculate, calcKey
  };

  // HTML の inline ハンドラ（onclick="openCalc()"など）からも使えるように
  Object.assign(window, App.Events);
})();

// Escキーで電卓を閉じる（安全参照）
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const overlay = document.getElementById('calcOverlay');
    if (overlay && !overlay.classList.contains('hidden')) {
      if (window.closeCalc) window.closeCalc();
      else if (window.App && window.App.Events && window.App.Events.closeCalc) window.App.Events.closeCalc();
    }
  }
});
