(function(){
  const App = window.App || (window.App = {});
  const {$, number} = App.Utils;
  const St = App.State;

  App.Settings = {
    getEarthSetting() {
      return {
        same: !!$('earthSamePave')?.checked,
        type: $('earthType')?.value || '標準掘削',
        thick: number($('earthThick')?.value)
      };
    },
    getDemoSetting() {
      return {
        same: !!$('demoSamePave')?.checked,
        type: $('demoType')?.value || 'As',
        thick: number($('demoThick')?.value),
        cutting: number($('demoCutting')?.value)
      };
    },
    renderEarthSetting() {
      if(!St.currentSite) return;
      const set = St.allSites[St.currentSite].earthSetting || { same:true, type:'標準掘削', thick:0 };
      if($('earthSamePave')) $('earthSamePave').checked = !!set.same;
      if($('earthType')) $('earthType').value = set.type || '標準掘削';
      if($('earthThick')) $('earthThick').value = set.thick || 0;
    },
    renderDemoSetting() {
      if(!St.currentSite) return;
      const set = St.allSites[St.currentSite].demoSetting || { same:true, type:'As', thick:0, cutting:0 };
      if($('demoSamePave')) $('demoSamePave').checked = !!set.same;
      if($('demoType')) $('demoType').value = set.type || 'As';
      if($('demoThick')) $('demoThick').value = set.thick || 0;
      if($('demoCutting')) $('demoCutting').value = set.cutting || 0;
    }
  };
})();
(function () {
  const App = window.App || (window.App = {});
  const St = App.State || {};

  const DEFAULT_DEMO_THICK = { 'As': 4, 'Con': 10, 'As+Con': 14 };
  function getDemoDefaultThick(t) { return DEFAULT_DEMO_THICK[t] ?? 4; }

  /** 土工・取壊工がONになった時の既定値を現場データに入れる */
  function ensureWorkDefaults() {
    const siteName = St.currentSite;
    if (!siteName || !St.allSites[siteName]) return;
    const site = St.allSites[siteName];
    site.earthSetting = site.earthSetting || {};
    site.demoSetting  = site.demoSetting  || {};

    // 土工
    if (site.works && site.works.earth) {
      if (site.earthSetting.same === undefined) site.earthSetting.same = true;
      if (!site.earthSetting.thick) site.earthSetting.thick = 10; // 10cm 既定
    }
    // 取壊
    if (site.works && site.works.demo) {
      if (site.demoSetting.same === undefined) site.demoSetting.same = true;
      if (!site.demoSetting.type) site.demoSetting.type = 'As';
      if (!site.demoSetting.thick) site.demoSetting.thick = getDemoDefaultThick(site.demoSetting.type);
    }
  }

  /** パネルへの反映（既存があればそのままでOK。ない場合の簡易版） */
  function renderEarthSetting() {
    const site = St.allSites[St.currentSite] || {};
    const es = site.earthSetting || {};
    const chk = document.getElementById('earthSamePave');
    const thick = document.getElementById('earthThick');
    if (chk)   chk.checked = !!es.same;
    if (thick) thick.value = es.thick ?? '';
  }
  function renderDemoSetting() {
    const site = St.allSites[St.currentSite] || {};
    const ds = site.demoSetting || {};
    const chk   = document.getElementById('demoSamePave');
    const type  = document.getElementById('demoType');
    const thick = document.getElementById('demoThick');
    if (chk)   chk.checked = !!ds.same;
    if (type)  type.value  = ds.type || 'As';
    if (thick) thick.value = ds.thick ?? getDemoDefaultThick(type ? type.value : 'As');
  }

  App.Settings = Object.assign(App.Settings || {}, {
    ensureWorkDefaults,
    renderEarthSetting,
    renderDemoSetting,
    getDemoDefaultThick
  });
})();
