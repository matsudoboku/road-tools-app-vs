(function () {
  const App = window.App || (window.App = {});
  const St = App.State;
  const $ = (App.Utils && App.Utils.$) || ((id) => document.getElementById(id));
  const worksList = (App.Constants && App.Constants.worksList) || [];

  // 現サイトオブジェクトを必ず返す
  function ensureSite() {
    const name = St.currentSite;
    if (!name) return null;
    St.allSites[name] = St.allSites[name] || {};
    return St.allSites[name];
  }

  function renderWorksChk() {
    const site = ensureSite();
    if (!site) return;
    const w = site.works || { earth: false, demo: false, anzen: false, kari: false, zatsu: false };
    $('chkWorksEarth') && ($('chkWorksEarth').checked = !!w.earth);
    $('chkWorksDemo') && ($('chkWorksDemo').checked = !!w.demo);
    $('chkWorksAnzen') && ($('chkWorksAnzen').checked = !!w.anzen);
    $('chkWorksKari') && ($('chkWorksKari').checked = !!w.kari);
    $('chkWorksZatsu') && ($('chkWorksZatsu').checked = !!w.zatsu);
  }

  function saveWorksChk() {
    const site = ensureSite();
    if (!site) return;
    site.works = {
      earth: !!$('chkWorksEarth')?.checked,
      demo: !!$('chkWorksDemo')?.checked,
      anzen: !!$('chkWorksAnzen')?.checked,
      kari: !!$('chkWorksKari')?.checked,
      zatsu: !!$('chkWorksZatsu')?.checked,
    };
  }

  function updateSiteList() {
    const list = Object.keys(St.allSites);
    const el = $('siteList');
    if (!el) return;
    el.innerHTML = list.map((s) => `<option>${s}</option>`).join('');
    if (list.length) {
      if (!St.currentSite) St.currentSite = list[0];
      el.value = St.currentSite;
    }
  }

  // 入力が空（未設定/0/空文字）なら既定値を入れる
  function setIfEmpty(inputEl, val) {
    if (!inputEl) return;
    const cur = parseFloat(inputEl.value || '0');
    if (!cur) inputEl.value = val;
  }

  function renderTabs() {
    // まずチェック状態を state に反映
    if (St.currentSite && St.allSites[St.currentSite]) saveWorksChk();
    const site = ensureSite();
    if (!site) return;

    site.earthSetting = site.earthSetting || {};
    site.demoSetting = site.demoSetting || {};

    // --- 既定値の適用（要求仕様） ---
    // 土工ON: 舗装面積と同じ=ON、掘削厚=10、種別既定=標準掘削
    if ($('chkWorksEarth')?.checked) {
      site.earthSetting.same = true;
      const es = $('earthSamePave'); if (es) es.checked = true;

      site.earthSetting.thick = 10;
      setIfEmpty($('earthThick'), 10);

      if (!site.earthSetting.type) site.earthSetting.type = '標準掘削';
      const etype = $('earthType'); if (etype && !etype.value) etype.value = site.earthSetting.type;
    }

    // 取壊工ON: 舗装面積と同じ=ON、種別As/Con/As+Conに応じて4/10/14cm
    if ($('chkWorksDemo')?.checked) {
      site.demoSetting.same = true;
      const ds = $('demoSamePave'); if (ds) ds.checked = true;

      const uiType = $('demoType')?.value;
      const type = uiType || site.demoSetting.type || 'As';
      site.demoSetting.type = type;
      if ($('demoType') && $('demoType').value !== type) $('demoType').value = type;

      const thick = type === 'As' ? 4 : type === 'Con' ? 10 : 14;
      site.demoSetting.thick = thick;
      setIfEmpty($('demoThick'), thick);
    }

    const earthSame = $('earthSamePave')?.checked;
    const demoSame = $('demoSamePave')?.checked;

    // --- タブの描画 & パネル表示制御 ---
    let tabHtml = '';
    worksList.forEach((w) => {
      const chkEl = $(w.chk);
      let show = w.always || (chkEl && chkEl.checked);
      if (w.id === 'Earth' && earthSame) show = false;
      if (w.id === 'Demo' && demoSame) show = false;

      if (show && w.panel) {
        tabHtml += `<div class="tab" id="tab${w.id}" onclick="showTab('${w.id}')">${w.label}</div>`;
      }

      // 設定ボックスの表示/非表示
      if (w.setting) {
        const settingDiv = $(w.setting);
        if (settingDiv) {
          ($(w.chk)?.checked ? settingDiv.classList.remove('hidden') : settingDiv.classList.add('hidden'));
        }
      }
      // パネルの表示/非表示
      if (w.panel && w.chk) {
        const panelEl = $(w.panel);
        if (panelEl) panelEl.classList[show ? 'remove' : 'add']('hidden');
      }
    });

    const tabsArea = $('tabsArea');
    if (tabsArea) tabsArea.innerHTML = tabHtml;

    const firstActive = worksList.find((w) => {
      const el = $(w.chk);
      const same = (w.id === 'Earth' && earthSame) || (w.id === 'Demo' && demoSame);
      return (w.always || (el && el.checked && !same)) && w.panel;
    });
    if (firstActive) showTab(firstActive.id);

    // ★重要：ここで再描画を呼ばない（無限ループ防止）
    // 必要なら保存だけ行う
    if (App.Storage && typeof App.Storage.saveData === 'function') {
      App.Storage.saveData();
    }
  }

  function showTab(tabId) {
    worksList.forEach((w) => {
      const tabEl = $('tab' + w.id);
      tabEl && tabEl.classList.remove('active');
      if (w.panel) {
        const panelEl = $(w.panel);
        panelEl && panelEl.classList.add('hidden');
      }
    });
    const activeTabEl = $('tab' + tabId);
    activeTabEl && activeTabEl.classList.add('active');
    worksList.forEach((w) => {
      if (w.id === tabId && w.panel) {
        const panelEl = $(w.panel);
        panelEl && panelEl.classList.remove('hidden');
      }
    });
  }

  // 公開
  App.UI = Object.assign(App.UI || {}, {
    renderTabs,
    showTab,
    renderWorksChk,
    saveWorksChk,
    updateSiteList,
  });
})();

// ---- Collapsible Controls (現場ヘッダー) ----
(function () {
  const App = window.App || (window.App = {});
  const UI = (App.UI = App.UI || {});
  const LS_KEY = 'ui_controls_collapsed_v1';

  function applyCollapsedState(collapsed) {
    const block = document.getElementById('controlsBlock');
    const btn = document.getElementById('controlsToggle');
    if (!block || !btn) return;
    block.classList.toggle('collapsed', !!collapsed);
    btn.setAttribute('aria-expanded', (!collapsed).toString());
    try { localStorage.setItem(LS_KEY, JSON.stringify(!!collapsed)); } catch (_) {}
  }

  function initControlsCollapse() {
    const block = document.getElementById('controlsBlock');
    const btn = document.getElementById('controlsToggle');
    if (!block || !btn) return;

    let collapsed = false;
    try { collapsed = JSON.parse(localStorage.getItem(LS_KEY) || 'false'); } catch (_) {}
    applyCollapsedState(collapsed);

    btn.addEventListener('click', () => {
      const now = !block.classList.contains('collapsed');
      applyCollapsedState(now);
    });
  }

  UI.initControlsCollapse = initControlsCollapse;
})();
