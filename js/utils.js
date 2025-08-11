(function(){
  const App = window.App || (window.App = {});
  App.Utils = {
    $: (id)=>document.getElementById(id),
    qAll: (sel)=>Array.from(document.querySelectorAll(sel)),
    number: (v)=>parseFloat(v)||0,
    cleanNumStr: (s)=>(s+'').replace(/[Ａ-Ｚａ-ｚ０-９＋]/g, c=>String.fromCharCode(c.charCodeAt(0)-0xFEE0)).replace(/[^\d.-]/g, '')
  };
})();
