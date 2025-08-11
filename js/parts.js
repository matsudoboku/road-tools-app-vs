(function(){
  const App = window.App || (window.App = {});
  const {$, number} = App.Utils;
  const St = App.State;
  const Settings = App.Settings;

  function renderAnzenInputs() {
    if(!St.currentSite) return;
    const dat = St.allSites[St.currentSite].anzen || {};
    $('anzenLineOuter') && ($('anzenLineOuter').value = dat.line_outer || 0);
    $('anzenLineStop')  && ($('anzenLineStop').value  = dat.line_stop || 0);
    $('anzenLineSymbol')&& ($('anzenLineSymbol').value= dat.line_symbol || 0);
  }

  function editAnzen(key, val, update=false) {
    if(!St.currentSite) return;
    if(!St.allSites[St.currentSite].anzen) St.allSites[St.currentSite].anzen = { line_outer:0, line_stop:0, line_symbol:0 };
    St.allSites[St.currentSite].anzen[key] = number(val);
    if(update) App.Main.renderAllAndSave();
  }

  function renderKariInputs() {
    if(!St.currentSite) return;
    const dat = St.allSites[St.currentSite].kari || {};
    $('kariTrafficB')     && ($('kariTrafficB').value     = dat.traffic_b || 0);
    $('kariTempSignal')   && ($('kariTempSignal').value   = dat.temp_signal || 0);
    $('kariMachineTrans') && ($('kariMachineTrans').value = dat.machine_transport || 0);
  }

  function editKari(key, val, update=false) {
    if(!St.currentSite) return;
    if(!St.allSites[St.currentSite].kari) St.allSites[St.currentSite].kari = { traffic_b:0, temp_signal:0, machine_transport:0 };
    St.allSites[St.currentSite].kari[key] = number(val);
    if(update) App.Main.renderAllAndSave();
  }

  function renderCurbInputs() {
    if(!St.currentSite) return;
    const dat = St.allSites[St.currentSite].curb || { use:false, std:0, small:0, hand:0 };
    const chk = $('chkCurbUse');
    const area = $('curbInputs');
    if(chk) chk.checked = !!dat.use;
    if(area) { chk && chk.checked ? area.classList.remove('hidden') : area.classList.add('hidden'); }
    $('curbStd')   && ($('curbStd').value   = dat.std   || 0);
    $('curbSmall') && ($('curbSmall').value = dat.small || 0);
    $('curbHand')  && ($('curbHand').value  = dat.hand  || 0);
  }

  function toggleCurbInputs() {
    if(!St.currentSite) return;
    const use = !!$('chkCurbUse')?.checked;
    const area = $('curbInputs');
    if(area) use ? area.classList.remove('hidden') : area.classList.add('hidden');
    if(!St.allSites[St.currentSite].curb) St.allSites[St.currentSite].curb = { use:false, std:0, small:0, hand:0 };
    St.allSites[St.currentSite].curb.use = use;
    App.Main.renderAllAndSave();
  }

  function editCurb(key, val, update=false) {
    if(!St.currentSite) return;
    if(!St.allSites[St.currentSite].curb) St.allSites[St.currentSite].curb = { use:false, std:0, small:0, hand:0 };
    St.allSites[St.currentSite].curb[key] = number(val);
    if(update) App.Main.renderAllAndSave();
  }

  function renderEarthResult() {
    if(!St.currentSite) return;
    const set = Settings.getEarthSetting();
    const paveSum = (St.allSites[St.currentSite].pave||[]).reduce((a,r)=>a+(parseFloat(r.面積)||0),0);
    let html='';
    if(set.same) {
      const vol = (paveSum * set.thick / 100).toFixed(2);
      html = `<div>合計体積：${vol} m³　（面積：${paveSum.toFixed(2)}㎡ × 厚さ：${set.thick}cm）</div>`;
    } else {
      const list = St.allSites[St.currentSite].earth || [];
      const area = list.reduce((a,r)=>a+(parseFloat(r.面積)||0),0);
      const vol = (area * set.thick / 100).toFixed(2);
      html = `<div>合計体積：${vol} m³　（面積：${area.toFixed(2)}㎡ × 厚さ：${set.thick}cm）</div>`;
    }
    $('earthResult') && ($('earthResult').innerHTML = html);
  }

  function renderDemoResult() {
    if(!St.currentSite) return;
    const set = Settings.getDemoSetting();
    const paveSum = (St.allSites[St.currentSite].pave||[]).reduce((a,r)=>a+(parseFloat(r.面積)||0),0);
    let html='';
    if(set.same) {
      const vol = (paveSum * set.thick / 100).toFixed(2);
      html = `<div>合計体積：${vol} m³　（面積：${paveSum.toFixed(2)}㎡ × 厚さ：${set.thick}cm）</div>`;
    } else {
      const list = St.allSites[St.currentSite].demo || [];
      const area = list.reduce((a,r)=>a+(parseFloat(r.面積)||0),0);
      const vol = (area * set.thick / 100).toFixed(2);
      html = `<div>合計体積：${vol} m³　（面積：${area.toFixed(2)}㎡ × 厚さ：${set.thick}cm）</div>`;
    }
    $('demoResult') && ($('demoResult').innerHTML = html);
  }

  App.Parts = { renderAnzenInputs, editAnzen, renderKariInputs, editKari, renderCurbInputs, toggleCurbInputs, editCurb, renderEarthResult, renderDemoResult };
})();
