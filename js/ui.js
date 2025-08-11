(function(){
  const App = window.App || (window.App = {});
  const {worksList} = App.Constants;
  const {$} = App.Utils;
  const St = App.State;

  function renderWorksChk() {
    if(!St.currentSite) return;
    const w = St.allSites[St.currentSite].works || { earth:false, demo:false, anzen:false, kari:false, zatsu:false };
    $('chkWorksEarth') && ($('chkWorksEarth').checked = !!w.earth);
    $('chkWorksDemo')  && ($('chkWorksDemo').checked  = !!w.demo);
    $('chkWorksAnzen') && ($('chkWorksAnzen').checked = !!w.anzen);
    $('chkWorksKari')  && ($('chkWorksKari').checked  = !!w.kari);
    $('chkWorksZatsu') && ($('chkWorksZatsu').checked = !!w.zatsu);
  }

  function saveWorksChk() {
    if(!St.currentSite) return;
    St.allSites[St.currentSite].works = {
      earth: !!$('chkWorksEarth')?.checked,
      demo:  !!$('chkWorksDemo')?.checked,
      anzen: !!$('chkWorksAnzen')?.checked,
      kari:  !!$('chkWorksKari')?.checked,
      zatsu: !!$('chkWorksZatsu')?.checked
    };
  }

  function updateSiteList() {
    const list = Object.keys(St.allSites);
    const el = $('siteList');
    if(!el) return;
    el.innerHTML = list.map(s=>`<option>${s}</option>`).join('');
    if(list.length) {
      if(!St.currentSite) St.currentSite = list[0];
      el.value = St.currentSite;
    }
  }

  function renderTabs() {
    if(St.currentSite && St.allSites[St.currentSite]) saveWorksChk();
    const earthSame = $('earthSamePave')?.checked;
    const demoSame = $('demoSamePave')?.checked;
    let tabHtml = '';
    worksList.forEach(w => {
      const chkEl = $(w.chk);
      let show = w.always || (chkEl && chkEl.checked);
      if(w.id === 'Earth' && earthSame) show = false;
      if(w.id === 'Demo'  && demoSame)  show = false;
      if(show && w.panel) tabHtml += `<div class="tab" id="tab${w.id}" onclick="showTab('${w.id}')">${w.label}</div>`;
      if(w.setting) {
        const settingDiv = $(w.setting);
        if(settingDiv) ( $(w.chk)?.checked ? settingDiv.classList.remove('hidden') : settingDiv.classList.add('hidden') );
      }
      if(w.panel && w.chk) {
        const panelEl = $(w.panel);
        if(panelEl) panelEl.classList[show ? 'remove' : 'add']('hidden');
      }
    });
    $('tabsArea').innerHTML = tabHtml;
    const firstActive = worksList.find(w => {
      const el = $(w.chk);
      const same = (w.id === 'Earth' && earthSame) || (w.id === 'Demo' && demoSame);
      return (w.always || (el && el.checked && !same)) && w.panel;
    });
    if(firstActive) showTab(firstActive.id);
    App.Main.saveAndUpdate();
  }

  function showTab(tabId) {
    worksList.forEach(w => {
      const tabEl = $('tab'+w.id);
      tabEl && tabEl.classList.remove('active');
      if(w.panel) {
        const panelEl = $(w.panel);
        panelEl && panelEl.classList.add('hidden');
      }
    });
    const activeTabEl = $('tab'+tabId);
    activeTabEl && activeTabEl.classList.add('active');
    worksList.forEach(w => {
      if(w.id===tabId && w.panel) {
        const panelEl = $(w.panel);
        panelEl && panelEl.classList.remove('hidden');
      }
    });
  }

  App.UI = { renderTabs, showTab, renderWorksChk, saveWorksChk, updateSiteList };
})();
