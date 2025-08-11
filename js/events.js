// js/events.js
(function(){
  const App = window.App || (window.App = {});
  const St = App.State || {};

  // ---- フォーカス移動 ----
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

  // ---- 電卓 ----
  function openCalc(){
    const ov = document.getElementById('calcOverlay');
    if(ov) ov.classList.remove('hidden');
    const ip = document.getElementById('calcInput');
    if(ip){ ip.focus(); ip.select?.(); }
    const r = document.getElementById('calcResult');
    if(r) r.textContent='';
  }
  function closeCalc(){
    const ov = document.getElementById('calcOverlay');
    if(ov) ov.classList.add('hidden');
  }
  function calcInsert(char){
    const input = document.getElementById('calcInput');
    if(input){
      input.value += char;
      input.focus();
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
      // 注意：eval は任意入力なので社内運用想定。必要ならサニタイズ関数を別途追加
      const r = eval(v);
      const out = document.getElementById('calcResult');
      if(out) out.textContent = r;
    }catch(err){
      const out = document.getElementById('calcResult');
      if(out) out.textContent = 'Error';
    }
  }
  function calcKey(e){ if(e.key==='Enter') calcCalculate(); }

  // イベント
  document.addEventListener('pointerdown', handlePointerDown, true);

  // エクスポート
  App.Events = { handleKey, handlePointerDown, openCalc, closeCalc, calcInsert, calcClear, calcCalculate, calcKey };
  // HTML の inline handler 対応
  Object.assign(window, App.Events);
})();

// Escキーで電卓を閉じる
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const overlay = document.getElementById('calcOverlay');
    if (overlay && !overlay.classList.contains('hidden')) {
      // グローバル公開済みの closeCalc を呼ぶ
      if (window.closeCalc) window.closeCalc();
    }
  }
});

// --- ヘッダー開閉の初期化（折りたたみ記憶＆現場名ラベル更新） ---
(function(){
  const KEY = 'headerControlsCollapsed_v1';

  function getCurrentSite() {
    return (window.App && App.State && App.State.currentSite) || '';
  }

  function updateCurrentSiteLabel() {
    const label = document.getElementById('currentSiteLabel');
    const cur = getCurrentSite();
    if (label) label.textContent = cur ? `：${cur}` : '';
  }

  function initHeaderCollapsible() {
    const d = document.getElementById('headerControls');
    if (!d) return;

    // 保存状態を復元
    const collapsed = localStorage.getItem(KEY) === '1';
    if (collapsed) d.removeAttribute('open'); else d.setAttribute('open', '');

    // 開閉時に保存
    d.addEventListener('toggle', () => {
      localStorage.setItem(KEY, d.open ? '0' : '1');
    });

    // 現在の現場名ラベル 初期描画
    updateCurrentSiteLabel();

    // 既存関数をラップして、実行後にラベル更新
    ['switchSite', 'addSite', 'renameSite'].forEach(fn => {
      const orig = window[fn];
      if (typeof orig === 'function') {
        window[fn] = function(...args) {
          const res = orig.apply(this, args);
          try { updateCurrentSiteLabel(); } catch(_) {}
          return res;
        };
      }
    });

    // 任意で外部からも呼べるように
    window.updateCurrentSiteLabel = updateCurrentSiteLabel;
  }

  document.addEventListener('DOMContentLoaded', initHeaderCollapsible);
})();
