// js/exports.js
(function(){
  const App = window.App || (window.App = {});
  const {$, qAll, number, cleanNumStr} = App.Utils || {};
  const St = App.State;

  // ==============================
  // DXF
  // ==============================
  function generateDXF(siteName) {
    const list = (St.allSites[siteName] && St.allSites[siteName].pave) || [];
    if(list.length < 2) return null;

    const scale = 100;
    const LAYER_FRAME='FRAME', LAYER_BASE='---', LAYER_WIDTH='W', LAYER_LEN='L', LAYER_STATION='No';
    const points = [];
    let x = 0;

    const width0 = parseFloat(cleanNumStr ? cleanNumStr(list[0].幅員) : (list[0].幅員||'')) || 0;
    points.push({ x:0, up:width0/2, down:-width0/2, width:width0, st:list[0].測点 });

    for(let i=1;i<list.length;i++){
      const len = parseFloat(cleanNumStr ? cleanNumStr(list[i].単距) : (list[i].単距||'')) || 0;
      const width = parseFloat(cleanNumStr ? cleanNumStr(list[i].幅員) : (list[i].幅員||'')) || 0;
      x += len;
      points.push({ x, up:width/2, down:-width/2, width, st:list[i].測点 });
    }

    const lines=[];
    // FRAME
    for(let i=0;i<points.length-1;i++){
      const p0=points[i], p1=points[i+1];
      lines.push(`0\nLINE\n8\n${LAYER_FRAME}\n10\n${p0.x*scale}\n20\n${p0.up*scale}\n11\n${p1.x*scale}\n21\n${p1.up*scale}\n`);
      lines.push(`0\nLINE\n8\n${LAYER_FRAME}\n10\n${p1.x*scale}\n20\n${p1.up*scale}\n11\n${p1.x*scale}\n21\n${p1.down*scale}\n`);
      lines.push(`0\nLINE\n8\n${LAYER_FRAME}\n10\n${p1.x*scale}\n20\n${p1.down*scale}\n11\n${p0.x*scale}\n21\n${p0.down*scale}\n`);
      lines.push(`0\nLINE\n8\n${LAYER_FRAME}\n10\n${p0.x*scale}\n20\n${p0.down*scale}\n11\n${p0.x*scale}\n21\n${p0.up*scale}\n`);
    }
    // BASE + LEN text
    for(let i=0;i<points.length-1;i++){
      const p0=points[i], p1=points[i+1];
      lines.push(`0\nLINE\n8\n${LAYER_BASE}\n10\n${p0.x*scale}\n20\n0\n11\n${p1.x*scale}\n21\n0\n`);
      const len = (p1.x - p0.x).toFixed(2);
      lines.push(`0\nTEXT\n8\n${LAYER_LEN}\n10\n${((p0.x+p1.x)/2)*scale}\n20\n-35\n40\n7\n1\n${len}m\n50\n0\n`);
    }
    // WIDTH + STATION
    for(let i=0;i<points.length;i++){
      const p = points[i];
      lines.push(`0\nLINE\n8\n${LAYER_WIDTH}\n10\n${p.x*scale}\n20\n${p.down*scale}\n11\n${p.x*scale}\n21\n${p.up*scale}\n`);
      lines.push(`0\nTEXT\n8\n${LAYER_WIDTH}\n10\n${p.x*scale}\n20\n${((p.up+p.down)/2)*scale}\n40\n7\n1\n${p.width.toFixed(2)}m\n50\n-90\n`);
      if(p.st && String(p.st).trim()) {
        lines.push(`0\nTEXT\n8\n${LAYER_STATION}\n10\n${p.x*scale}\n20\n${(p.up*scale + 30)}\n40\n7\n1\n${p.st}\n50\n-90\n`);
      }
    }

    return '0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nSECTION\n2\nTABLES\n0\nENDSEC\n0\nSECTION\n2\nBLOCKS\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n'
      + lines.join('') + '0\nENDSEC\n0\nEOF\n';
  }

  function exportDXF() {
    const dxf = generateDXF(St.currentSite);
    if(!dxf){ alert('最低2行以上必要です'); return; }
    const safe = St.currentSite.replace(/[\\/:*?"<>|]/g,'_');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([dxf], {type:'text/plain'}));
    a.download = safe + '.dxf';
    a.click();
  }

  // ==============================
  // 合計表（Summary）
  // ==============================
  function getSummaryHtml(forExcel=false) {
    const border = forExcel ? "1px" : "2px";
    const tableStyle = `min-width:1200px;border-collapse:collapse;border:${border} solid #555;background:#fff;width:auto;`;
    const thStyle1 = `border:${border} solid #555;background:#e6eef5;color:#007acc;font-weight:bold;text-align:center;padding:8px 5px;white-space:nowrap;`;
    const thStyle2 = `border:${border} solid #555;background:#f7fbff;color:#007acc;font-weight:bold;text-align:center;padding:5px 5px;white-space:nowrap;`;
    const tdStyle = `border:${border} solid #555;text-align:center;padding:6px 5px;white-space:nowrap;`;
    const tdStyleFirst = tdStyle + "border-bottom:none;";
    const tdStyleSecond = tdStyle + "border-top:none;";

    const zatsuEnabled = Object.values(St.allSites).some(s => s.works && s.works.zatsu);
    let zatsuNames = [];
    if(zatsuEnabled){
      const set = new Set();
      Object.values(St.allSites).forEach(s => {
        if(s.works && s.works.zatsu && Array.isArray(s.zatsu)) {
          s.zatsu.forEach(z=>{ if(z && z.name) set.add(z.name); });
        }
      });
      zatsuNames = Array.from(set);
    }

    const dataCols = [
      "site",
      "machine_excavation","residual_soil",
      "cutting","break_as","haizan_unpan_as","haizan_shori_as",
      "break_con","haizan_unpan_con","haizan_shori_con",
      "as_lt1_4","as_ge1_4","as_ge3_0",
      "base_course",
      "ovl_lt1_4","ovl_ge1_4","ovl_ge3_0",
      "con_total",
      "curb_std","curb_small","curb_hand",
      "line_outer","line_stop","line_symbol",
      "traffic_b","temp_signal","machine_transport"
    ];
    dataCols.push(...zatsuNames);

    let html = `<div style="overflow-x:auto;"><table class="ss-table" style="${tableStyle}">`;
    html += `
<tr>
  <th rowspan="3" style="${thStyle1}">箇所名</th>
  <th colspan="2" style="${thStyle1}">土工</th>
  <th colspan="6" style="${thStyle1}">取壊工</th>
  <th colspan="12" style="${thStyle1}">舗装工</th>
  <th colspan="3" style="${thStyle1}">安全施設工</th>
  <th colspan="3" style="${thStyle1}">仮設工</th>
  ${zatsuEnabled ? `<th colspan="${zatsuNames.length}" style="${thStyle1}">雑工</th>` : ''}
</tr>
<tr>
  <th rowspan="2" style="${thStyle2}">機械掘削</th>
  <th rowspan="2" style="${thStyle2}">残土処理</th>
  <th rowspan="2" style="${thStyle2}">舗装版切断</th>
  <th rowspan="2" style="${thStyle2}">舗装版破砕As</th>
  <th rowspan="2" style="${thStyle2}">廃材運搬As</th>
  <th rowspan="2" style="${thStyle2}">廃材処理As</th>
  <th rowspan="2" style="${thStyle2}">舗装版破砕Con</th>
  <th rowspan="2" style="${thStyle2}">廃材運搬Con</th>
  <th rowspan="2" style="${thStyle2}">廃材処理Con</th>
  <th colspan="3" style="${thStyle2}">アスファルト</th>
  <th rowspan="2" style="${thStyle2}">上層路盤工</th>
  <th colspan="3" style="${thStyle2}">オーバーレイ</th>
  <th rowspan="2" style="${thStyle2}">コンクリート</th>
  <th colspan="3" style="${thStyle2}">アスカーブ</th>
  <th colspan="3" style="${thStyle2}">区画線設置</th>
  <th rowspan="2" style="${thStyle2}">交通誘導員B</th>
  <th rowspan="2" style="${thStyle2}">仮設信号機</th>
  <th rowspan="2" style="${thStyle2}">重機運搬費</th>
  ${zatsuNames.map(n=>`<th rowspan="2" style="${thStyle2}">${n}</th>`).join('')}
</tr>
<tr>
  <th style="${thStyle2}">t=4cm<br>1.4未満</th>
  <th style="${thStyle2}">t=4cm<br>1.4以上</th>
  <th style="${thStyle2}">t=4cm<br>3.0以上</th>
  <th style="${thStyle2}">t=4cm<br>1.4未満</th>
  <th style="${thStyle2}">t=4cm<br>1.4以上</th>
  <th style="${thStyle2}">t=4cm<br>3.0以上</th>
  <th style="${thStyle2}">標準</th>
  <th style="${thStyle2}">小型</th>
  <th style="${thStyle2}">手盛</th>
  <th style="${thStyle2}">外側線</th>
  <th style="${thStyle2}">停止線</th>
  <th style="${thStyle2}">文字記号</th>
</tr>`;

    const totalRow={}; dataCols.forEach(k=>totalRow[k]=0); totalRow.site="総合計";

    Object.keys(St.allSites).forEach(site=>{
      const dat = St.allSites[site]||{};
      const row={}; row.site=site;

      let paveSum = 0; (dat.pave||[]).forEach(r=>paveSum+=parseFloat(r.面積)||0);

      // 土工
      let machine_excavation=0, residual_soil=0;
      const earthSetting = dat.earthSetting || {};
      if(dat.works && dat.works.earth){
        const thick = parseFloat(earthSetting.thick)||0;
        machine_excavation = residual_soil = paveSum * thick / 100;
      }
      row.machine_excavation = machine_excavation>0 ? machine_excavation.toFixed(2) : "";
      row.residual_soil     = residual_soil>0     ? residual_soil.toFixed(2)     : "";

      // 取壊工
      let cutting=0, break_as=0, break_con=0;
      let haizan_unpan_as=0, haizan_shori_as=0, haizan_unpan_con=0, haizan_shori_con=0;
      const demoSetting = dat.demoSetting || {};
      const demoType = demoSetting.type;
      const demoThick = parseFloat(demoSetting.thick)||0;
      if(dat.works && dat.works.demo){
        cutting = parseFloat(demoSetting.cutting)||0;
        const areaDemo = demoSetting.same ? paveSum : (dat.demo||[]).reduce((a,r)=>a+(parseFloat(r.面積)||0),0);
        if(demoType==='As') break_as=areaDemo;
        else if(demoType==='Con') break_con=areaDemo;
        else if(demoType==='As+Con'){ break_as=areaDemo; break_con=areaDemo; }
        haizan_unpan_as = break_as * demoThick / 100;
        haizan_shori_as = haizan_unpan_as * 2.35;
        haizan_unpan_con = break_con * demoThick / 100;
        haizan_shori_con = haizan_unpan_con * 2.35;
      }
      row.cutting = cutting>0 ? cutting.toFixed(1) : "";
      row.break_as = break_as>0 ? break_as.toFixed(1) : "";
      row.haizan_unpan_as = haizan_unpan_as>0 ? haizan_unpan_as.toFixed(2) : "";
      row.haizan_shori_as = haizan_shori_as>0 ? haizan_shori_as.toFixed(2) : "";
      row.break_con = break_con>0 ? break_con.toFixed(1) : "";
      row.haizan_unpan_con = haizan_unpan_con>0 ? haizan_unpan_con.toFixed(2) : "";
      row.haizan_shori_con = haizan_shori_con>0 ? haizan_shori_con.toFixed(2) : "";

      // 舗装カテゴリ集計
      let as_lt1_4=0, as_ge1_4=0, as_ge3_0=0, ovl_lt1_4=0, ovl_ge1_4=0, ovl_ge3_0=0, con_total=0;
      (dat.pave||[]).forEach(r=>{
        const area = parseFloat(r.面積)||0;
        if(r.種別==='アスファルト'){
          if(r.平均幅員==='1.4未満') as_lt1_4+=area;
          else if(r.平均幅員==='1.4以上') as_ge1_4+=area;
          else if(r.平均幅員==='3.0以上') as_ge3_0+=area;
        }else if(r.種別==='オーバーレイ'){
          if(r.平均幅員==='1.4未満') ovl_lt1_4+=area;
          else if(r.平均幅員==='1.4以上') ovl_ge1_4+=area;
          else if(r.平均幅員==='3.0以上') ovl_ge3_0+=area;
        }else if(r.種別==='コンクリート'){
          con_total+=area;
        }
      });
      row.as_lt1_4 = as_lt1_4>0 ? as_lt1_4.toFixed(1) : "";
      row.as_ge1_4 = as_ge1_4>0 ? as_ge1_4.toFixed(1) : "";
      row.as_ge3_0 = as_ge3_0>0 ? as_ge3_0.toFixed(1) : "";
      row.base_course = "";
      row.ovl_lt1_4 = ovl_lt1_4>0 ? ovl_lt1_4.toFixed(1) : "";
      row.ovl_ge1_4 = ovl_ge1_4>0 ? ovl_ge1_4.toFixed(1) : "";
      row.ovl_ge3_0 = ovl_ge3_0>0 ? ovl_ge3_0.toFixed(1) : "";
      row.con_total = con_total>0 ? con_total.toFixed(1) : "";

      // 縁石
      const curb = dat.curb || {};
      row.curb_std  = (curb.use && curb.std>0)   ? curb.std   : "";
      row.curb_small= (curb.use && curb.small>0) ? curb.small : "";
      row.curb_hand = (curb.use && curb.hand>0)  ? curb.hand  : "";

      // 安全施設
      const anzen = dat.anzen || {};
      row.line_outer = anzen.line_outer || "";
      row.line_stop  = anzen.line_stop  || "";
      row.line_symbol= anzen.line_symbol|| "";

      // 仮設工
      const kari = dat.kari || {};
      row.traffic_b = kari.traffic_b || "";
      row.temp_signal = kari.temp_signal || "";
      row.machine_transport = kari.machine_transport || "";

      // 雑工
      if(zatsuEnabled){
        const sums = {}; zatsuNames.forEach(n=>sums[n]=0);
        if(dat.works && dat.works.zatsu && Array.isArray(dat.zatsu)){
          dat.zatsu.forEach(z => { const n=z.name; if(sums[n]!==undefined) sums[n]+=parseFloat(z.qty)||0; });
        }
        zatsuNames.forEach(n => { row[n] = sums[n]>0 ? sums[n].toFixed(2) : ""; });
      }

      dataCols.forEach(k=>{ if(k!=='site') totalRow[k] += parseFloat(row[k])||0; });

      if(forExcel){
        html += `<tr>${dataCols.map(k=>`<td style="${tdStyleFirst}"></td>`).join("")}</tr>`;
        html += `<tr>${dataCols.map(k=>`<td style="${tdStyleSecond}">${row[k]||""}</td>`).join("")}</tr>`;
      } else {
        html += `<tr>${dataCols.map(k=>`<td style="${tdStyle}">${row[k]||""}</td>`).join("")}</tr>`;
      }
    });

    html += `<tr style="background:#f3f9ff;font-weight:bold;">${
      dataCols.map(k => `<td style="${tdStyle}">${k==="site" ? "総合計" : (totalRow[k] ? totalRow[k].toFixed(2) : "")}</td>`).join("")
    }</tr>`;
    html += '</table></div>';
    return html;
  }

  function showSummary() {
    const html = getSummaryHtml(false);
    document.querySelectorAll('.summary-table').forEach(el => el.innerHTML = html);
  }

  function exportSummaryExcel() {
    showSummary();
    const html = '<html><head><meta charset="UTF-8"></head><body>' + getSummaryHtml(true) + '</body></html>';
    const blob = new Blob([html], {type:'application/vnd.ms-excel'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'summary.xls';
    a.click();
  }

  // ==============================
  // 数量計算書（Quantity）
  //  A4横 / 折返し無し / 列幅固定
  // ==============================
  function getQuantityHtml() {
    const border='1px';
    // table-layout:fixed で colgroup の幅を優先。折返し無しを徹底。
    const tableStyle = `table-layout:fixed;min-width:1000px;border-collapse:collapse;border:${border} solid #555;background:#fff;width:auto;`;
    const thStyle = `border:${border} solid #555;background:#e6eef5;color:#007acc;font-weight:bold;text-align:center;padding:8px 5px;white-space:nowrap;`;
    const tdStyle = `border:${border} solid #555;text-align:center;padding:6px 5px;white-space:nowrap;`;
    const tdStyleFirst = tdStyle + 'border-bottom:none;';
    const tdStyleSecond= tdStyle + 'border-top:none;';
    const catStyle = `border:${border} solid #555;background:#f3f3f3;font-weight:bold;text-align:left;padding:6px 5px;white-space:nowrap;`;

    // 列幅を Excel でも効きやすい mm 指定に変更
    //  [箇所名:40mm][工種:24mm][規格:28mm][計算式:120mm][単位:12mm][数量:24mm]
    const colgroup = `
      <colgroup>
        <col style="width:40mm">
        <col style="width:24mm">
        <col style="width:28mm">
        <col style="width:120mm">
        <col style="width:12mm">
        <col style="width:24mm">
      </colgroup>`;

    const getAreaFormula = (list, idx)=>{
      const r = list[idx] || {};
      const d = parseFloat(r.単距) || 0;
      const w = parseFloat(r.幅員) || 0;
      if(idx===0) return d ? `${d}×${w}` : '';
      const prevW = parseFloat(list[idx-1].幅員) || 0;
      return `${d}×(${prevW}+${w})/2`;
    };

    let html = `<table class="ss-table" style="${tableStyle}">`;
    html += colgroup;
    html += `<tr>
      <th style="${thStyle}">箇所名</th>
      <th style="${thStyle}">工種</th>
      <th style="${thStyle}">規格</th>
      <th style="${thStyle}">計算式</th>
      <th style="${thStyle}">単位</th>
      <th style="${thStyle}">数量</th>
    </tr>`;

    // 行追加（2段組：見出し＋明細）
    const addRow = (site,work,spec,formula,unit,qty)=>{
      html += `<tr>
        <td style="${tdStyleFirst}">${site}</td>
        <td style="${tdStyleFirst}"></td>
        <td style="${tdStyleFirst}"></td>
        <td style="${tdStyleFirst}"></td>
        <td style="${tdStyleFirst}"></td>
        <td style="${tdStyleFirst}"></td>
      </tr>
      <tr>
        <td style="${tdStyleSecond}"></td>
        <td style="${tdStyleSecond}">${work}</td>
        <td style="${tdStyleSecond}">${spec}</td>
        <td style="${tdStyleSecond}">${formula}</td>
        <td style="${tdStyleSecond}">${unit}</td>
        <td style="${tdStyleSecond}">${qty}</td>
      </tr>`;
    };
    const addCatRow = (site,label)=>{
      html += `<tr><td style="${tdStyle}">${site}</td><td style="${catStyle}" colspan="5">${label}</td></tr>`;
    };

    Object.keys(St.allSites).forEach(site=>{
      const dat = St.allSites[site] || {};
      let first = true;
      const getSite = ()=>{ const s=first?site:''; first=false; return s; };
      const row = (w,spec,f,u,q)=>addRow(getSite(), w, spec, f, u, q);
      const cat = label => addCatRow(getSite(), label);

      // 舗装合計面積
      let paveSum=0; (dat.pave||[]).forEach(r=>{paveSum+=parseFloat(r.面積)||0;});

      // 土工
      if(dat.works && dat.works.earth){
        const set = dat.earthSetting || {};
        const thick = parseFloat(set.thick)||0;
        const vol = paveSum * thick / 100;
        if(vol>0){
          const formula = `${paveSum.toFixed(1)}×(${thick}/100)`;
          cat('土工');
          row('機械掘削', set.type||'', formula, 'm³', vol.toFixed(2));
          row('残土処理', set.type||'', formula, 'm³', vol.toFixed(2));
        }
      }

      // 取壊工
      if(dat.works && dat.works.demo){
        const set = dat.demoSetting || {};
        const demoType = set.type;
        const thick = parseFloat(set.thick)||0;
        const demoList = set.same ? (dat.pave||[]) : (dat.demo||[]);
        const areaDemoFormula = demoList.map((_,i)=>getAreaFormula(demoList,i)).filter(f=>f).join(' + ');
        const areaDemo = demoList.reduce((a,r)=>a+(parseFloat(r.面積)||0),0);
        const cutting = parseFloat(set.cutting)||0;

        let break_as=0, break_con=0;
        if(demoType==='As') break_as=areaDemo;
        else if(demoType==='Con') break_con=areaDemo;
        else if(demoType==='As+Con'){ break_as=areaDemo; break_con=areaDemo; }

        if(cutting>0 || break_as>0 || break_con>0){
          cat('取り壊し工');
          if(cutting>0) row('舗装版切断','',`${cutting}`,'m',cutting.toFixed(1));
          if(break_as>0){
            row('舗装版破砕','As',areaDemoFormula,'m²',break_as.toFixed(1));
            const unpan = break_as * thick / 100;
            row('廃材運搬','As',`(${areaDemoFormula})×(${thick}/100)`,'m³',unpan.toFixed(2));
            row('廃材処理','As',`(${areaDemoFormula})×(${thick}/100)×2.35`,'t',(unpan*2.35).toFixed(2));
          }
          if(break_con>0){
            row('舗装版破砕','Con',areaDemoFormula,'m²',break_con.toFixed(1));
            const unpan = break_con * thick / 100;
            row('廃材運搬','Con',`(${areaDemoFormula})×(${thick}/100)`,'m³',unpan.toFixed(2));
            row('廃材処理','Con',`(${areaDemoFormula})×(${thick}/100)×2.35`,'t',(unpan*2.35).toFixed(2));
          }
        }
      }

      // 舗装工
      let as_lt1_4=0, as_ge1_4=0, as_ge3_0=0, ovl_lt1_4=0, ovl_ge1_4=0, ovl_ge3_0=0, con_total=0;
      const paveFormulaMap = { as_lt1_4:[], as_ge1_4:[], as_ge3_0:[], ovl_lt1_4:[], ovl_ge1_4:[], ovl_ge3_0:[], con_total:[] };

      (dat.pave||[]).forEach((r,idx)=>{
        const area = parseFloat(r.面積)||0;
        const f = getAreaFormula(dat.pave, idx);
        if(r.種別==='アスファルト'){
          if(r.平均幅員==='1.4未満'){ as_lt1_4+=area; if(f) paveFormulaMap.as_lt1_4.push(f); }
          else if(r.平均幅員==='1.4以上'){ as_ge1_4+=area; if(f) paveFormulaMap.as_ge1_4.push(f); }
          else if(r.平均幅員==='3.0以上'){ as_ge3_0+=area; if(f) paveFormulaMap.as_ge3_0.push(f); }
        } else if(r.種別==='オーバーレイ'){
          if(r.平均幅員==='1.4未満'){ ovl_lt1_4+=area; if(f) paveFormulaMap.ovl_lt1_4.push(f); }
          else if(r.平均幅員==='1.4以上'){ ovl_ge1_4+=area; if(f) paveFormulaMap.ovl_ge1_4.push(f); }
          else if(r.平均幅員==='3.0以上'){ ovl_ge3_0+=area; if(f) paveFormulaMap.ovl_ge3_0.push(f); }
        } else if(r.種別==='コンクリート'){
          con_total+=area; if(f) paveFormulaMap.con_total.push(f);
        }
      });

      const paveRows=[];
      if(as_lt1_4>0) paveRows.push(['アスファルト','t=4cm 1.4未満',paveFormulaMap.as_lt1_4.join(' + '),'m²',as_lt1_4.toFixed(1)]);
      if(as_ge1_4>0) paveRows.push(['アスファルト','t=4cm 1.4以上',paveFormulaMap.as_ge1_4.join(' + '),'m²',as_ge1_4.toFixed(1)]);
      if(as_ge3_0>0) paveRows.push(['アスファルト','t=4cm 3.0以上',paveFormulaMap.as_ge3_0.join(' + '),'m²',as_ge3_0.toFixed(1)]);
      if(ovl_lt1_4>0) paveRows.push(['オーバーレイ','t=4cm 1.4未満',paveFormulaMap.ovl_lt1_4.join(' + '),'m²',ovl_lt1_4.toFixed(1)]);
      if(ovl_ge1_4>0) paveRows.push(['オーバーレイ','t=4cm 1.4以上',paveFormulaMap.ovl_ge1_4.join(' + '),'m²',ovl_ge1_4.toFixed(1)]);
      if(ovl_ge3_0>0) paveRows.push(['オーバーレイ','t=4cm 3.0以上',paveFormulaMap.ovl_ge3_0.join(' + '),'m²',ovl_ge3_0.toFixed(1)]);
      if(con_total>0)  paveRows.push(['コンクリート','',paveFormulaMap.con_total.join(' + '),'m²',con_total.toFixed(1)]);

      if(paveRows.length>0){
        cat('舗装工');
        paveRows.forEach(r => row(...r));
      }

      // 安全施設
      const anzen = dat.anzen || {};
      const anzenRows=[];
      if(anzen.line_outer>0) anzenRows.push(['区画線設置','外側線','', 'm', anzen.line_outer]);
      if(anzen.line_stop>0)  anzenRows.push(['区画線設置','停止線','', 'm', anzen.line_stop]);
      if(anzen.line_symbol>0)anzenRows.push(['区画線設置','文字記号','', 'm²', anzen.line_symbol]);
      if(anzenRows.length>0){
        cat('安全施設工');
        anzenRows.forEach(r => row(...r));
      }

      // 仮設工
      const kari = dat.kari || {};
      const kariRows=[];
      if(kari.traffic_b>0)        kariRows.push(['仮設工','交通誘導員B','', '人日', kari.traffic_b]);
      if(kari.temp_signal>0)      kariRows.push(['仮設工','仮設信号機','', '基',   kari.temp_signal]);
      if(kari.machine_transport>0)kariRows.push(['仮設工','重機運搬費','', '式',   kari.machine_transport]);
      if(kariRows.length>0){
        cat('仮設工');
        kariRows.forEach(r => row(...r));
      }

      // 雑工
      const zatsuRows=[];
      if(dat.works && dat.works.zatsu){
        (dat.zatsu||[]).forEach(z=>{
          const q = parseFloat(z.qty)||0;
          if(q>0) zatsuRows.push([z.name||'', z.spec||'', '', z.unit||'', q]);
        });
      }
      if(zatsuRows.length>0){
        cat('雑工');
        zatsuRows.forEach(r => row(...r));
      }
    });

    html += '</table>';
    return html;
  }

  function exportQuantityExcel() {
    // Excel 向けのヘッダ + A4 横・余白 + 折返し無し
    const header = `
<html>
<head>
<meta charset="UTF-8">
<meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
<style>
  @page { size: A4 landscape; margin: 10mm; }
  table { table-layout: fixed; }
  th, td { white-space: nowrap; }
</style>
</head>
<body>`;
    const footer = `</body></html>`;

    const html = header + getQuantityHtml() + footer;
    const blob = new Blob([html], {type:'application/vnd.ms-excel'});
    const a = document.createElement('a');
    const now = new Date();
    const ymd = now.getFullYear() + ('0'+(now.getMonth()+1)).slice(-2) + ('0'+now.getDate()).slice(-2);
    a.href = URL.createObjectURL(blob);
    a.download = `数量計算書_${ymd}.xls`;
    a.click();
  }

  // ==============================
  // ZIP（無圧縮）
  // ==============================
  const CRC_TABLE = (()=>{
    const t = new Uint32Array(256);
    for(let i=0;i<256;i++){
      let c=i; for(let j=0;j<8;j++) c = (c & 1) ? (0xedb88320 ^ (c>>>1)) : (c>>>1);
      t[i] = c>>>0;
    }
    return t;
  })();
  function crc32(arr){
    let c=0xffffffff;
    for(let i=0;i<arr.length;i++) c = CRC_TABLE[(c ^ arr[i]) & 0xff] ^ (c>>>8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function makeZip(files){
    const enc = new TextEncoder();
    const localParts=[], centralParts=[]; let offset=0;
    for(const f of files){
      const nameBytes = enc.encode(f.name);
      const data = f.data;
      const crc = crc32(data);

      const local = new Uint8Array(30 + nameBytes.length);
      const dv = new DataView(local.buffer);
      dv.setUint32(0, 0x04034b50, true);
      dv.setUint16(4, 20, true);
      dv.setUint16(6, 0x0800, true);
      dv.setUint16(8, 0, true);
      dv.setUint16(10, 0, true);
      dv.setUint16(12, 0, true);
      dv.setUint32(14, crc, true);
      dv.setUint32(18, data.length, true);
      dv.setUint32(22, data.length, true);
      dv.setUint16(26, nameBytes.length, true);
      dv.setUint16(28, 0, true);
      local.set(nameBytes, 30);
      localParts.push(local, data);

      const central = new Uint8Array(46 + nameBytes.length);
      const cdv = new DataView(central.buffer);
      cdv.setUint32(0, 0x02014b50, true);
      cdv.setUint16(4, 20, true);
      cdv.setUint16(6, 20, true);
      cdv.setUint16(8, 0x0800, true);
      cdv.setUint16(10, 0, true);
      cdv.setUint16(12, 0, true);
      cdv.setUint16(14, 0, true);
      cdv.setUint32(16, crc, true);
      cdv.setUint32(20, data.length, true);
      cdv.setUint32(24, data.length, true);
      cdv.setUint16(28, nameBytes.length, true);
      cdv.setUint16(30, 0, true);
      cdv.setUint16(32, 0, true);
      cdv.setUint16(34, 0, true);
      cdv.setUint16(36, 0, true);
      cdv.setUint32(38, 0, true);
      cdv.setUint32(42, offset, true);
      central.set(nameBytes, 46);
      centralParts.push(central);

      offset += local.length + data.length;
    }
    const centralSize = centralParts.reduce((a,b)=>a+b.length,0);
    const end = new Uint8Array(22);
    const ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);
    ev.setUint16(20, 0, true);

    const total = offset + centralSize + end.length;
    const out = new Uint8Array(total); let pos=0;
    for(const p of localParts){ out.set(p, pos); pos+=p.length; }
    for(const p of centralParts){ out.set(p, pos); pos+=p.length; }
    out.set(end, pos);
    return out;
  }

  function exportAllZip() {
    // 合計表を最新化
    showSummary();

    const enc = new TextEncoder();

    // Summary
    const summaryHtml = '<html><head><meta charset="UTF-8"></head><body>' + getSummaryHtml(true) + '</body></html>';

    // Quantity（A4 横／折返し無し）
    const quantityHtml =
      '<html><head><meta charset="UTF-8"><meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">' +
      '<style>@page{size:A4 landscape;margin:10mm;} table{table-layout:fixed;} th,td{white-space:nowrap;}</style></head><body>' +
      getQuantityHtml() + '</body></html>';

    const files = [
      {name:'合計表.xls', data: enc.encode(summaryHtml)},
      {name:'数量計算書.xls', data: enc.encode(quantityHtml)},
    ];

    // 各サイト DXF
    Object.keys(St.allSites).forEach(site=>{
      const dxf = generateDXF(site);
      if(dxf){
        const safe = site.replace(/[\\/:*?"<>|]/g,'_');
        files.push({name: safe + '.dxf', data: enc.encode(dxf)});
      }
    });

    const zipData = makeZip(files);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([zipData], {type:'application/zip'}));
    a.download = 'all_data.zip';
    a.click();
  }

  // 公開
  App.Exports = {
    generateDXF, exportDXF,
    getSummaryHtml, showSummary, exportSummaryExcel,
    getQuantityHtml, exportQuantityExcel,
    exportAllZip
  };
  // HTML inline 呼び出し対応
  Object.assign(window, App.Exports);

})();
