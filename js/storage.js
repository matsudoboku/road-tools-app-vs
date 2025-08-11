(function(){
  const App = window.App || (window.App = {});
  const {$} = App.Utils;
  const St = App.State;
  const {LS_KEY} = App.Constants;

  function ensureSiteDefaults(s) {
    if(!s.kari) s.kari = { traffic_b:0, temp_signal:0, machine_transport:0 };
    if(!s.curb) s.curb = { use:false, std:0, small:0, hand:0 };
    if(!s.works) s.works = { earth:false, demo:false, anzen:false, kari:false, zatsu:false };
    if(!s.zatsu) s.zatsu = [];
    if(!s.price) s.price = {};
    if(Array.isArray(s.zatsu)) s.zatsu.forEach(z=>{ if(z.spec===undefined) z.spec=''; });
    if(!s.demoSetting) s.demoSetting = { same:true, type:'As', thick:0, cutting:0 };
    else if(s.demoSetting.cutting===undefined) s.demoSetting.cutting = 0;
    if(!s.earthSetting) s.earthSetting = { same:true, type:'標準掘削', thick:0 };
    if(!s.pave) s.pave = [];
    if(!s.earth) s.earth = [];
    if(!s.demo) s.demo = [];
    if(!s.anzen) s.anzen = { line_outer:0, line_stop:0, line_symbol:0 };
  }

  function saveData() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(St.allSites)); } catch(e) {}
  }

  function loadData() {
    try {
      const dat = JSON.parse(localStorage.getItem(LS_KEY));
      if(dat && typeof dat === 'object') {
        Object.values(dat).forEach(ensureSiteDefaults);
        St.allSites = dat;
        const list = Object.keys(St.allSites);
        if(list.length){
          St.currentSite = list[0];
        }
      }
    } catch(e) {}
  }

  function backupData() {
    const blob = new Blob([JSON.stringify(St.allSites)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pave_backup.json';
    a.click();
  }

  function importData(e) {
    const file = e?.target?.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const dat = JSON.parse(ev.target.result);
        if(dat && typeof dat === 'object') {
          Object.values(dat).forEach(s=>{
            if(Array.isArray(s.zatsu)) s.zatsu.forEach(z=>{ if(z.spec===undefined) z.spec=''; });
            if(!s.price) s.price = {};
            ensureSiteDefaults(s);
          });
          St.allSites = dat;
          const siteList = Object.keys(St.allSites);
          if(siteList.length) {
            St.currentSite = siteList[0];
          }
          App.Main.afterDataLoaded();
        } else { alert('読み込み失敗'); }
      } catch(err) { alert('読み込み失敗'); }
      if(e?.target) e.target.value='';
    };
    reader.readAsText(file);
  }

  function addSite() {
    const name = $('siteName')?.value?.trim();
    if(!name || St.allSites[name]) return;
    App.Main.saveAndUpdate();
    St.allSites[name] = {
      pave:[], earth:[], demo:[],
      anzen:{ line_outer:0, line_stop:0, line_symbol:0 },
      kari:{ traffic_b:0, temp_signal:0, machine_transport:0 },
      zatsu:[], price:{},
      curb:{ use:false, std:0, small:0, hand:0 },
      works:{ earth:false, demo:false, anzen:false, kari:false, zatsu:false },
      earthSetting:{ same:true, type:'標準掘削', thick:0 },
      demoSetting:{ same:true, type:'As', thick:0, cutting:0 }
    };
    const el = $('siteList');
    if(el) el.innerHTML += `<option>${name}</option>`;
    if(el) el.value = name;
    St.currentSite = name;
    App.Settings.renderEarthSetting();
    App.Settings.renderDemoSetting();
    App.UI.renderWorksChk();
    App.UI.renderTabs();
    App.Main.renderAllAndSave();
  }

  function renameSite() {
    const newName = $('siteName')?.value?.trim();
    if(!St.currentSite || !newName || newName===St.currentSite || St.allSites[newName]) return;
    App.Main.saveAndUpdate(false);
    St.allSites[newName] = St.allSites[St.currentSite];
    delete St.allSites[St.currentSite];
    St.currentSite = newName;
    App.UI.updateSiteList();
    App.Settings.renderEarthSetting();
    App.Settings.renderDemoSetting();
    App.UI.renderWorksChk();
    App.UI.renderTabs();
    App.Main.renderAllAndSave();
  }

  function switchSite() {
    App.Main.saveAndUpdate();
    const sel = $('siteList');
    if(sel) St.currentSite = sel.value;
    App.Settings.renderEarthSetting();
    App.Settings.renderDemoSetting();
    App.UI.renderWorksChk();
    App.UI.renderTabs();
    App.Main.renderAllAndSave();
  }

  function saveAndUpdate(update=true) {
    if(St.currentSite && St.allSites[St.currentSite]) {
      St.allSites[St.currentSite].earthSetting = App.Settings.getEarthSetting();
      St.allSites[St.currentSite].demoSetting  = App.Settings.getDemoSetting();
    }
    if(update) App.Main.renderAllAndSave();
  }

  App.Storage = { saveData, loadData, backupData, importData, addSite, renameSite, switchSite, saveAndUpdate };
})();
