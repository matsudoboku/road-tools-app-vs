(function () {
  const App = window.App || (window.App = {});
  const St = App.State;

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

  // expose
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

    // 初期ロード時：土工/取壊工のデフォルトが表示されるよう、最初にタブ再描画で適用
    App.UI.updateSiteList();
    App.UI.renderTabs(); // ← renderTabs 内でデフォルト適用 & renderAllAndSave()

    App.Tables.updateZatsuNameList();

    // 単価の端末共通初期値保存（入力中に保存）
    document.querySelectorAll('input[data-price-work]').forEach((el) => {
      el.addEventListener('input', App.Prices.savePrices);
    });

    // 現場ヘッダの折りたたみ
    if (window.App && App.UI && typeof App.UI.initControlsCollapse === 'function') {
      App.UI.initControlsCollapse();
    }
  });

  // 種別変更時は常に 4/10/14 を反映（初期も4cmにしたい要件に対応）
  window.updateDemoThickDefault = function () {
    const typeEl = document.getElementById('demoType');
    const thickEl = document.getElementById('demoThick');
    if (!typeEl || !thickEl) {
      App.Storage.saveAndUpdate(true);
      return;
    }
    const t = typeEl.value || 'As';
    const d = t === 'As' ? 4 : t === 'Con' ? 10 : 14;
    thickEl.value = d;

    // stateへ反映
    const site = App.State.allSites[App.State.currentSite] || {};
    site.demoSetting = site.demoSetting || {};
    site.demoSetting.type = t;
    site.demoSetting.thick = d;

    App.Storage.saveAndUpdate(true);
    App.UI.renderTabs();
  };
})();
