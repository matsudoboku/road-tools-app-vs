(function () {
  const App = window.App || (window.App = {});
  const St = App.State || (App.State = {});

  function renderAll() {
    App.UI.renderWorksChk();
    App.Settings && App.Settings.renderEarthSetting && App.Settings.renderEarthSetting();
    App.Settings && App.Settings.renderDemoSetting && App.Settings.renderDemoSetting();
    App.Tables.renderTablePave();
    App.Tables.renderTableEarth();
    App.Parts.renderEarthResult();
    App.Tables.renderTableDemo();
    App.Parts.renderDemoResult();
    App.Tables.renderTableZatsu();
    App.Parts.renderCurbInputs();
    App.Parts.renderAnzenInputs();
    App.Parts.renderKariInputs();
    App.Prices.renderPriceInputs();
    App.Prices.renderPriceTotal();
    App.Exports.showSummary();
  }

  function renderAllAndSave() {
    const focus = St.nextFocus;
    renderAll();
    App.Storage.saveData();
    if (focus) {
      const selector = `[data-type="${focus.type}"][data-idx="${focus.idx}"][data-key="${focus.key}"]`;
      const el = document.querySelector(selector);
      if (el) {
        el.focus();
        if (el.setSelectionRange) {
          const len = el.value.length;
          el.setSelectionRange(len, len);
        }
      }
    }
  }

  function afterDataLoaded() {
    App.UI.updateSiteList();
    App.UI.renderTabs();
    renderAllAndSave();
  }

  function saveAndUpdate(update = true) {
    App.Storage.saveAndUpdate(update);
  }

  // expose to window (HTML の inline ハンドラ互換)
  window.addRow = App.Tables.addRow;
  window.editRow = App.Tables.editRow;
  window.showTab = App.UI.showTab;
  window.renderTabs = App.UI.renderTabs;
  window.backupData = App.Storage.backupData;
  window.importData = App.Storage.importData;
  window.addSite = App.Storage.addSite;
  window.renameSite = App.Storage.renameSite;
  window.switchSite = App.Storage.switchSite;
  window.saveAndUpdate = saveAndUpdate;
  window.handleKey = App.Events.handleKey;
  window.handlePointerDown = App.Events.handlePointerDown;
  window.openCalc = App.Events.openCalc;
  window.closeCalc = App.Events.closeCalc;
  window.calcInsert = App.Events.calcInsert;
  window.calcClear = App.Events.calcClear;
  window.calcCalculate = App.Events.calcCalculate;
  window.calcKey = App.Events.calcKey;
  window.exportDXF = App.Exports.exportDXF;
  window.exportSummaryExcel = App.Exports.exportSummaryExcel;
  window.exportQuantityExcel = App.Exports.exportQuantityExcel;
  window.exportAllZip = App.Exports.exportAllZip;
  window.editAnzen = App.Parts.editAnzen;
  window.editKari = App.Parts.editKari;
  window.editPrice = App.Prices.editPrice;
  window.toggleCurbInputs = App.Parts.toggleCurbInputs;
  window.editCurb = App.Parts.editCurb;

  App.Main = { renderAll, renderAllAndSave, afterDataLoaded, saveAndUpdate };

  window.addEventListener('DOMContentLoaded', () => {
    App.Storage.loadData();
    App.Prices.loadPrices();

    // 先にサイトリスト→タブ描画（ui.js 内でデフォルト適用＆保存まで走る）
    App.UI.updateSiteList();
    App.UI.renderTabs();

    App.Tables.updateZatsuNameList();

    // 単価の端末共通初期値保存（入力中に保存）
    document.querySelectorAll('input[data-price-work]').forEach((el) => {
      el.addEventListener('input', App.Prices.savePrices);
    });

    // 現場ヘッダの折りたたみ
    if (App.UI && typeof App.UI.initControlsCollapse === 'function') {
      App.UI.initControlsCollapse();
    }
  });

  // 取り壊し種別変更 → 4/10/14 cm を常に反映
  window.updateDemoThickDefault = function () {
    const typeEl = document.getElementById('demoType');
    const thickEl = document.getElementById('demoThick');
    if (!typeEl || !thickEl) {
      App.Storage.saveAndUpdate(true);
      return;
    }
    const t = typeEl.value || 'As';
    const d = t === 'As' ? 4 : (t === 'Con' ? 10 : 14);
    thickEl.value = d;

    const site = App.State.allSites[App.State.currentSite] || (App.State.allSites[App.State.currentSite] = {});
    site.demoSetting = site.demoSetting || {};
    site.demoSetting.type = t;
    site.demoSetting.thick = d;

    App.Storage.saveAndUpdate(true);
    if (App.UI && typeof App.UI.renderTabs === 'function') App.UI.renderTabs();
  };
})();
