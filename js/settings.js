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
