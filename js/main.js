(function(){
  const App = window.App || (window.App = {});
  const St = App.State;

  function renderAll() {
    App.UI.renderWorksChk();
    App.Settings.renderEarthSetting();
    App.Settings.renderDemoSetting();
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
    if(focus){
      const selector = `[data-type="${focus.type}"][data-idx="${focus.idx}"][data-key="${focus.key}"]`;
      const el = document.querySelector(selector);
      if(el){ el.focus(); if(el.setSelectionRange){ const len = el.value.length; el.setSelectionRange(len, len); } }
    }
  }

  function afterDataLoaded() {
    App.UI.updateSiteList();
    App.UI.renderTabs();
    renderAllAndSave();
  }

  function saveAndUpdate(update=true){ App.Storage.saveAndUpdate(update); }

  // Expose to window for inline handlers compatibility
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
    App.UI.updateSiteList();
    renderAll();
    App.UI.renderTabs();
    App.Tables.updateZatsuNameList();
    document.querySelectorAll('input[data-price-work]').forEach(el => {
      el.addEventListener('input', App.Prices.savePrices);
    });
  });
  // Optional: set default demo thickness when type changes (only if current value is empty or 0)
  window.updateDemoThickDefault = function(){
    const typeEl = document.getElementById('demoType');
    const thickEl = document.getElementById('demoThick');
    if(!typeEl || !thickEl) { App.Storage.saveAndUpdate(true); return; }
    const current = parseFloat(thickEl.value || '0');
    if(!current){ // set sensible defaults if not entered yet
      const t = typeEl.value;
      let d = 0;
      if(t === 'As') d = 5;
      else if(t === 'Con') d = 10;
      else if(t === 'As+Con') d = 10;
      thickEl.value = d;
    }
    App.Storage.saveAndUpdate(true);
    App.UI.renderTabs();
  };

})();
