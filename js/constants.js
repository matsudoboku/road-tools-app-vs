(function(){
  const App = window.App || (window.App = {});
  App.Constants = {
    LS_KEY: 'paveAppAllSites_v5',
    PRICE_KEY: 'paveAppPrices_v1',
    paveTypes: ["アスファルト", "コンクリート", "オーバーレイ"],
    worksList: [
      { id: "Works", label: "工種設定", always: true, panel: "panelWorks" },
      { id: "Earth", label: "土工", chk: "chkWorksEarth", setting: "worksEarthSetting", panel: "panelEarth" },
      { id: "Pave", label: "舗装工", always: true, panel: "panelPave" },
      { id: "Demo", label: "取り壊し工", chk: "chkWorksDemo", setting: "worksDemoSetting", panel: "panelDemo" },
      { id: "Anzen", label: "安全施設工", chk: "chkWorksAnzen", setting: "worksAnzenSetting", panel: null },
      { id: "Kari", label: "仮設工", chk: "chkWorksKari", setting: "worksKariSetting", panel: null },
      { id: "Zatsu", label: "雑工", chk: "chkWorksZatsu", panel: "panelZatsu" },
      { id: "Price", label: "単価設定", always: true, panel: "panelPrice" },
      { id: "Data", label: "データ管理・出力", always: true, panel: "panelData" },
      { id: "Disclaimer", label: "免責事項", always: true, panel: "panelDisclaimer"}
    ]
  };
})();
