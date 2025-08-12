(function () {
  const App = window.App || (window.App = {});
  const { worksList } = App.Constants;
  const { $ } = App.Utils;
  const St = App.State;

  function renderWorksChk() {
    if (!St.currentSite) return;
    const w = St.allSites[St.currentSite].works || { earth: false, demo: false, anzen: false, kari: false, zatsu: false };
    $('chkWorksEarth') && ($('chkWorksEarth').checked = !!w.earth);
    $('chkWorksDemo') && ($('chkWorksDemo').checked = !!w.demo);
    $('chkWorksAnzen') && ($('chkWorksAnzen').checked = !!w.anzen);
    $('chkWorksKari') && ($('chkWorksKari').checked = !!w.kari);
    $('chkWorksZatsu') && ($('chkWorksZatsu').checked = !!w.zatsu);
  }

  function saveWorksChk() {
    if (!St.currentSite) return;
    St.allSites[St.currentSite].works = {
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

  function renderTabs() {
    if (St.currentSite && St.allSites[St.currentSite]) saveWorksChk();

    // ★ ここで「土工/取壊工」チェック時にデフォルトを必ず適用
    const site = St.allSites[St.currentSite] || (St.allSites[St.currentSite] = {});
    site.works = site.works || {};
    site.earthSetting = site.earthSetting || {};
    site.demoSetting = site.demoSetting || {};

    // 土工ONなら「舗装面積と同じ」=ON、掘削厚=10cm を常に反映（UIにも出す）
    if ($('chkWorksEarth')?.checked) {
      if (site.earthSetting.same !== true) site.earthSetting.same = true;
      const es = $('earthSamePave');
      if (es) es.checked = true;

      site.earthSetting.thick = 10;
      const et = $('earthThick');
      if (et) et.value = 10;

      if (!site.earthSetting.type) site.earthSetting.type = '標準掘削';
      const etype = $('earthType');
      if (etype && !etype.value) etype.value = site.earthSetting.type;
    }

    // 取壊工ONなら「舗装面積と同じ」=ON、厚さは種別に応じ 4/10/14 cm（UIにも出す）
    if ($('chkWorksDemo')?.checked) {
      if (site.demoSetting.same !== true) site.demoSetting.same = true;
      const ds = $('demoSamePave');
      if (ds) ds.checked = true;

      // 種別はUIの値優先、無ければ既存 or 'As'
      const typeInUI = $('demoType')?.value;
      const type = typeInUI || site.demoSetting.type || 'As';
      site.demoSetting.type = type;
      if ($('demoType') && $('demoType').value !== type) $('demoType').value = type;

      const thick = type === 'As' ? 4 : type === 'Con' ? 10 : 14; // As+Con=14
      site.demoSetting.thick = thick;
      const dt = $('demoThick');
      if (dt) dt.value = thick;
    }

    const earthSame = $('earthSamePave')?.checked;
    const demoSame = $('demoSamePave')?.checked;

    // タブの表示制御
    let tabHtml = '';
    worksList.forEach((w) => {
      const chkEl = $(w.chk);
      let show = w.always || (chkEl && chkEl.checked);
      if (w.id === 'Earth' && earthSame) show = false;
      if (w.id === 'Demo' && demoSame) show = false;

      if (show && w.panel) tabHtml += `<div class="tab" id="tab${w.id}" onclick="showTab('${w.id}')">${w.label}</div>`;

      if (w.setting) {
        const settingDiv = $(w.setting);
        if (settingDiv) ($(w.chk)?.checked ? settingDiv.classList.remove('hidden') : settingDiv.classList.add('hidden'));
      }
      if (w.panel && w.chk) {
        const panelEl = $(w.panel);
        if (panelEl) panelEl.classList[show ? 'remove' : 'add']('hidden');
      }
    });
    $('tabsArea').innerHTML = tabHtml;

    const firstActive = worksList.find((w) => {
      const el = $(w.chk);
      const same = (w.id === 'Earth' && earthSame) || (w.id === 'Demo' && demoSame);
      return (w.always || (el && el.checked && !same)) && w.panel;
    });
    if (firstActive) showTab(firstActive.id);

    App.Main.renderAllAndSave();
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

  App.UI = { renderTabs, showTab, renderWorksChk, saveWorksChk, updateSiteList };
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
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(!!collapsed));
    } catch (_) {}
  }

  function initControlsCollapse() {
    const block = document.getElementById('controlsBlock');
    const btn = document.getElementById('controlsToggle');
    if (!block || !btn) return;

    let collapsed = false;
    try {
      collapsed = JSON.parse(localStorage.getItem(LS_KEY) || 'false');
    } catch (_) {}
    applyCollapsedState(collapsed);

    btn.addEventListener('click', () => {
      const now = !block.classList.contains('collapsed');
      applyCollapsedState(now);
    });
  }

  UI.initControlsCollapse = initControlsCollapse;
})();
