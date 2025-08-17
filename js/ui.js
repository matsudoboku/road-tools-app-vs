// js/ui.js
(function () {
  const App = window.App || (window.App = {});
  const St = App.State || (App.State = { allSites: {}, currentSite: '' });
  const $ = (App.Utils && App.Utils.$) || ((id) => document.getElementById(id));

  // ---- worksList（定義が無い場合のフォールバック） ----
  function fallbackWorksList() {
    return [
      { id: 'Works', label: '工種設定',   panel: 'panelWorks',      always: true },
      { id: 'Earth', label: '土工',       panel: 'panelEarth',      chk: 'chkWorksEarth', setting: 'worksEarthSetting' },
      { id: 'Pave',  label: '舗装工',     panel: 'panelPave',       always: true },
      { id: 'Demo',  label: '取り壊し工', panel: 'panelDemo',       chk: 'chkWorksDemo',  setting: 'worksDemoSetting' },
      { id: 'Zatsu', label: '雑工',       panel: 'panelZatsu',      chk: 'chkWorksZatsu' },
      { id: 'Price', label: '単価設定',   panel: 'panelPrice',      always: true },
      { id: 'Data',  label: 'データ管理・出力', panel: 'panelData', always: true },
      { id: 'Disclaimer', label: '免責事項', panel: 'panelDisclaimer', always: true },
    ];
  }
  const worksList = (App.Constants && App.Constants.worksList) || fallbackWorksList();

  // ---- 現サイト取得/作成 ----
  function ensureSite() {
    const name = St.currentSite;
    if (!name) return null;
    St.allSites[name] = St.allSites[name] || {};
    return St.allSites[name];
  }

  // ---- 工種チェックの描画/保存 ----
  function renderWorksChk() {
    const site = ensureSite();
    if (!site) return;
    const w = site.works || { earth: false, demo: false, anzen: false, kari: false, zatsu: false };
    $('chkWorksEarth') && ($('chkWorksEarth').checked = !!w.earth);
    $('chkWorksDemo')  && ($('chkWorksDemo').checked  = !!w.demo);
    $('chkWorksAnzen') && ($('chkWorksAnzen').checked = !!w.anzen);
    $('chkWorksKari')  && ($('chkWorksKari').checked  = !!w.kari);
    $('chkWorksZatsu') && ($('chkWorksZatsu').checked = !!w.zatsu);
  }

  function saveWorksChk() {
    const site = ensureSite();
    if (!site) return;
    const prev = site.works || {};
    const next = {
      earth: !!$('chkWorksEarth')?.checked,
      demo:  !!$('chkWorksDemo')?.checked,
      anzen: !!$('chkWorksAnzen')?.checked,
      kari:  !!$('chkWorksKari')?.checked,
      zatsu: !!$('chkWorksZatsu')?.checked,
    };
    // ONに切り替えた瞬間を検出
    site._justEnabled = {
      earth: !prev.earth && next.earth,
      demo:  !prev.demo  && next.demo,
    };
    site.works = next;
  }

  // ---- 既定値適用（ONにした瞬間 or 未設定の時のみ）----
  function setIfEmptyNumberInput(inputEl, val) {
    if (!inputEl) return;
    const cur = parseFloat(inputEl.value || '0');
    if (!cur) inputEl.value = val;
  }

  function applyDefaultsIfNeeded(site) {
    site.earthSetting = site.earthSetting || {};
    site.demoSetting  = site.demoSetting  || {};

    // 土工
    if (site.works?.earth) {
      if (site._justEnabled?.earth) {
        site.earthSetting.same  = true;
        site.earthSetting.thick = 10;
        if (!site.earthSetting.type) site.earthSetting.type = '標準掘削';
      } else {
        if (site.earthSetting.same === undefined) site.earthSetting.same = true;
        if (
          site.earthSetting.thick == null ||
          Number.isNaN(parseFloat(site.earthSetting.thick))
        ) site.earthSetting.thick = 10;
        if (!site.earthSetting.type) site.earthSetting.type = '標準掘削';
      }
    }

    // 取壊工
    if (site.works?.demo) {
      if (site._justEnabled?.demo) {
        site.demoSetting.same = true;
        if (!site.demoSetting.type) site.demoSetting.type = 'As';
        site.demoSetting.thick =
          site.demoSetting.type === 'As' ? 4 :
          site.demoSetting.type === 'Con' ? 10 : 14; // As+Con=14
      } else {
        if (site.demoSetting.same === undefined) site.demoSetting.same = true;
        if (!site.demoSetting.type) site.demoSetting.type = 'As';
        if (
          site.demoSetting.thick == null ||
          Number.isNaN(parseFloat(site.demoSetting.thick))
        ) {
          site.demoSetting.thick =
            site.demoSetting.type === 'As' ? 4 :
            site.demoSetting.type === 'Con' ? 10 : 14;
        }
      }
    }

    // UI反映（ユーザー操作を毎回上書きしない）
    if ($('earthSamePave')) $('earthSamePave').checked = !!site.earthSetting.same;
    setIfEmptyNumberInput($('earthThick'), site.earthSetting.thick ?? 10);
    if ($('earthType') && site.earthSetting.type) $('earthType').value = site.earthSetting.type;

    if ($('demoSamePave')) $('demoSamePave').checked = !!site.demoSetting.same;
    if ($('demoType') && site.demoSetting.type) $('demoType').value = site.demoSetting.type;
    setIfEmptyNumberInput($('demoThick'), site.demoSetting.thick ?? 4);

    // 使い捨てフラグ削除
    if (site._justEnabled) delete site._justEnabled;
  }

  // ---- タブ描画 ----
  let renderTabsLock = false;

  function renderTabs() {
    if (St.currentSite && St.allSites[St.currentSite]) saveWorksChk();

    const site = ensureSite();
    if (!site) return;

    applyDefaultsIfNeeded(site);

    const earthSame = !!site.earthSetting?.same;
    const demoSame  = !!site.demoSetting?.same;

    let tabHtml = '';
    worksList.forEach((w) => {
      const isOn = w.always || (!!w.chk && !!$(w.chk)?.checked);
      // 「舗装面積と同じ」のときは入力パネルを隠す
      let show = isOn;
      if (w.id === 'Earth' && isOn && earthSame) show = false;
      if (w.id === 'Demo'  && isOn && demoSame)  show = false;

      if (show && w.panel) {
        tabHtml += `<div class="tab" id="tab${w.id}" onclick="showTab('${w.id}')">${w.label}</div>`;
      }

      // 設定ブロックの表示/非表示
      if (w.setting) {
        const settingDiv = $(w.setting);
        if (settingDiv) {
          (isOn ? settingDiv.classList.remove('hidden') : settingDiv.classList.add('hidden'));
        }
      }
      // パネルの表示/非表示
      if (w.panel) {
        const panelEl = $(w.panel);
        if (panelEl) panelEl.classList[show ? 'remove' : 'add']('hidden');
      }
    });

    const tabsArea = $('tabsArea');
    if (tabsArea) tabsArea.innerHTML = tabHtml;

    const firstActive = worksList.find((w) => {
      const isOn = w.always || (!!w.chk && !!$(w.chk)?.checked);
      const same = (w.id === 'Earth' && earthSame) || (w.id === 'Demo' && demoSame);
      return (isOn && !same) && w.panel;
    });
    if (firstActive) showTab(firstActive.id);

    // 保存だけ（他の描画は必要時のみ非同期で呼ぶ）
    if (App.Storage && typeof App.Storage.saveData === 'function') {
      try { App.Storage.saveData(); } catch (_) {}
    }

    if (!renderTabsLock && App.Main && typeof App.Main.renderAllAndSave === 'function') {
      renderTabsLock = true;
      setTimeout(() => {
        try { App.Main.renderAllAndSave(); } catch (_) {}
        renderTabsLock = false;
      }, 0);
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

  // ---- 現場リスト ----
  function updateSiteList() {
    const list = Object.keys(St.allSites || {});
    const el = $('siteList');
    if (!el) return;
    el.innerHTML = list.map((s) => `<option>${s}</option>`).join('');
    if (list.length) {
      if (!St.currentSite) St.currentSite = list[0];
      el.value = St.currentSite;
    }
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
    const btn   = document.getElementById('controlsToggle');
    if (!block || !btn) return;
    block.classList.toggle('collapsed', !!collapsed);
    btn.setAttribute('aria-expanded', (!collapsed).toString());
    try { localStorage.setItem(LS_KEY, JSON.stringify(!!collapsed)); } catch (_) {}
  }

  function initControlsCollapse() {
    const block = document.getElementById('controlsBlock');
    const btn   = document.getElementById('controlsToggle');
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
