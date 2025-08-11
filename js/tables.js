(function(){
  const App = window.App || (window.App = {});
  const {$, qAll, number} = App.Utils;
  const St = App.State;
  const {paveTypes} = App.Constants;

  function addRow(type) {
    if(!St.currentSite) return;
    const site = St.allSites[St.currentSite];
    if(type === 'pave') {
      site.pave.push({ 種別:"アスファルト", 測点:'', 単距:'', 追距:'', 幅員:'', 平均幅員:'', 面積:'' });
    } else if(type==='earth' || type==='demo') {
      site[type].push({ 測点:'', 単距:'', 追距:'', 幅員:'', 面積:'' });
    } else if(type==='zatsu') {
      site.zatsu.push({ name:'', spec:'', unit:'', qty:'' });
    }
    App.Main.renderAllAndSave();
  }

  function editRow(type, idx, key, val, update=false) {
    const site = St.allSites[St.currentSite];
    if(type==='pave' && key==='種別') {
      for(let i=idx;i<site[type].length;i++) site[type][i][key]=val;
    } else {
      site[type][idx][key]=val;
    }
    if(update) App.Main.renderAllAndSave();
  }

  function updateZatsuNameList() {
    const listEl = $('zatsuNameList');
    if(!listEl) return;
    const set = new Set();
    Object.values(St.allSites).forEach(s => {
      if(Array.isArray(s.zatsu)) s.zatsu.forEach(z => { if(z && z.name) set.add(z.name); });
    });
    listEl.innerHTML = Array.from(set).map(n=>`<option value="${n}"></option>`).join('');
  }

  function renderTablePave() {
    if(!St.currentSite) return;
    const list = St.allSites[St.currentSite].pave;
    let widthSum=0,cnt=0;
    list.forEach(r=>{
      const w = number(r.幅員);
      if(!isNaN(w)){ widthSum+=w; cnt++; }
    });
    const avgW = cnt ? widthSum/cnt : 0;
    let label = (avgW<1.4) ? "1.4未満" : (avgW<3.0 ? "1.4以上" : "3.0以上");
    for(let i=0;i<list.length;i++){
      const r=list[i];
      r.追距 = (i===0) ? number(r.単距) : (number(list[i-1].追距) + number(r.単距));
      r.平均幅員 = label;
      r._平均幅員値 = avgW;
      if(i===0){
        r.面積 = (r.単距 && r.幅員) ? (number(r.単距)*number(r.幅員)).toFixed(2) : '';
      }else{
        const 上幅員 = number(list[i-1].幅員);
        const 幅員   = number(r.幅員);
        const 単距   = number(r.単距);
        r.面積 = (幅員>0 && 上幅員>0 && 単距>0) ? (((幅員+上幅員)/2)*単距).toFixed(2) : '';
      }
    }
    let tbody='';
    list.forEach((r,idx)=>{
      tbody += `<tr>
        <td>
          <select class="pave-type" data-type="pave" data-idx="${idx}" data-key="種別"
            onchange="editRow('pave',${idx},'種別',this.value,true)" onkeydown="handleKey(event)">
            ${paveTypes.map(tp=>`<option value="${tp}"${r.種別===tp?' selected':''}>${tp}</option>`).join('')}
          </select>
        </td>
        <td><input data-type="pave" data-idx="${idx}" data-key="測点" value="${r.測点||''}" type="text"
            inputmode="decimal" pattern="[0-9+\-.]*"
            oninput="editRow('pave',${idx},'測点',this.value)"
            onblur="editRow('pave',${idx},'測点',this.value,true)" onkeydown="handleKey(event)"></td>
        <td><input data-type="pave" data-idx="${idx}" data-key="単距" value="${r.単距||''}" type="text"
            inputmode="decimal" pattern="[0-9.+-]*"
            oninput="editRow('pave',${idx},'単距',this.value)"
            onblur="editRow('pave',${idx},'単距',this.value,true)" onkeydown="handleKey(event)"></td>
        <td><input value="${r.追距||''}" class="readonly" readonly></td>
        <td><input data-type="pave" data-idx="${idx}" data-key="幅員" value="${r.幅員||''}" type="text"
            inputmode="decimal" pattern="[0-9.+-]*"
            oninput="editRow('pave',${idx},'幅員',this.value)"
            onblur="editRow('pave',${idx},'幅員',this.value,true)" onkeydown="handleKey(event)"></td>
        <td><input value="${r.平均幅員||''}" class="readonly" readonly></td>
        <td><input value="${r.面積||''}" class="readonly" readonly></td>
      </tr>`;
    });
    $('tbodyPave') && ($('tbodyPave').innerHTML = tbody);
    let sum = {アスファルト:0, コンクリート:0, オーバーレイ:0};
    list.forEach(r=>{ if(!isNaN(parseFloat(r.面積))) sum[r.種別] += number(r.面積); });
    $('sumPave') && ($('sumPave').innerHTML =
      `<table class="ss-table">
        <tr><th>現場名</th><th>アスファルト合計</th><th>コンクリート合計</th><th>オーバーレイ合計</th></tr>
        <tr>
          <td>${St.currentSite}</td>
          <td>${sum.アスファルト.toFixed(2)}</td>
          <td>${sum.コンクリート.toFixed(2)}</td>
          <td>${sum.オーバーレイ.toFixed(2)}</td>
        </tr>
      </table>`);
  }

  function renderTableCommon(type, tbodyId, resultId=null) {
    if(!St.currentSite) return;
    const list = St.allSites[St.currentSite][type];
    for(let i=0;i<list.length;i++){
      const r=list[i];
      r.追距 = (i===0) ? number(r.単距) : (number(list[i-1].追距)+number(r.単距));
      if(i===0){
        r.面積 = (r.単距 && r.幅員) ? (number(r.単距)*number(r.幅員)).toFixed(2) : '';
      }else{
        const 上幅員 = number(list[i-1].幅員);
        const 幅員   = number(r.幅員);
        const 単距   = number(r.単距);
        r.面積 = (幅員>0 && 上幅員>0 && 単距>0) ? (((幅員+上幅員)/2)*単距).toFixed(2) : '';
      }
    }
    let tbody='';
    list.forEach((r,idx)=>{
      tbody += `<tr>
        <td><input data-type="${type}" data-idx="${idx}" data-key="測点" value="${r.測点||''}" type="text"
            inputmode="decimal" pattern="[0-9+\-.]*"
            oninput="editRow('${type}',${idx},'測点',this.value)"
            onblur="editRow('${type}',${idx},'測点',this.value,true)" onkeydown="handleKey(event)"></td>
        <td><input data-type="${type}" data-idx="${idx}" data-key="単距" value="${r.単距||''}" type="text"
            inputmode="decimal" pattern="[0-9.+-]*"
            oninput="editRow('${type}',${idx},'単距',this.value)"
            onblur="editRow('${type}',${idx},'単距',this.value,true)" onkeydown="handleKey(event)"></td>
        <td><input value="${r.追距||''}" class="readonly" readonly></td>
        <td><input data-type="${type}" data-idx="${idx}" data-key="幅員" value="${r.幅員||''}" type="text"
            inputmode="decimal" pattern="[0-9.+-]*"
            oninput="editRow('${type}',${idx},'幅員',this.value)"
            onblur="editRow('${type}',${idx},'幅員',this.value,true)" onkeydown="handleKey(event)"></td>
        <td><input value="${r.面積||''}" class="readonly" readonly></td>
      </tr>`;
    });
    $(tbodyId) && ($(tbodyId).innerHTML = tbody);
  }

  function renderTableEarth() { renderTableCommon('earth','tbodyEarth'); }
  function renderTableDemo()  { renderTableCommon('demo','tbodyDemo'); }

  function renderTableZatsu() {
    if(!St.currentSite) return;
    const list = St.allSites[St.currentSite].zatsu || [];
    let tbody='';
    list.forEach((r,idx)=>{
      tbody += `<tr>
        <td><input list="zatsuNameList" data-type="zatsu" data-idx="${idx}" data-key="name" value="${r.name||''}" type="text"
            oninput="editRow('zatsu',${idx},'name',this.value)"
            onblur="editRow('zatsu',${idx},'name',this.value,true)" onkeydown="handleKey(event)"></td>
        <td><input data-type="zatsu" data-idx="${idx}" data-key="spec" value="${r.spec||''}" type="text"
            oninput="editRow('zatsu',${idx},'spec',this.value)"
            onblur="editRow('zatsu',${idx},'spec',this.value,true)" onkeydown="handleKey(event)"></td>
        <td><input data-type="zatsu" data-idx="${idx}" data-key="unit" value="${r.unit||''}" type="text"
            oninput="editRow('zatsu',${idx},'unit',this.value)"
            onblur="editRow('zatsu',${idx},'unit',this.value,true)" onkeydown="handleKey(event)"></td>
        <td><input data-type="zatsu" data-idx="${idx}" data-key="qty" value="${r.qty||''}" type="text"
            inputmode="decimal" pattern="[0-9.+-]*"
            oninput="editRow('zatsu',${idx},'qty',this.value)"
            onblur="editRow('zatsu',${idx},'qty',this.value,true)" onkeydown="handleKey(event)"></td>
      </tr>`;
    });
    $('tbodyZatsu') && ($('tbodyZatsu').innerHTML = tbody);
    const totals = {};
    list.forEach(r=>{
      const n = r.name || '';
      totals[n] = (totals[n]||0) + (number(r.qty)||0);
    });
    const html = Object.entries(totals).filter(([n,t])=>t && n).map(([n,t])=>`${n}: ${t.toFixed(2)}`).join('　');
    $('zatsuResult') && ($('zatsuResult').innerHTML = html ? `<div>${html}</div>` : '');
    updateZatsuNameList();
  }

  App.Tables = { addRow, editRow, renderTablePave, renderTableEarth, renderTableDemo, renderTableZatsu, updateZatsuNameList };
})();
