// js/prices.js
(function () {
  const App = window.App || (window.App = {});
  const St = App.State || {};
  const C = App.Constants || {};
  const PRICE_KEY = C.PRICE_KEY || 'paveAppPrices_v1';
  const FEE_MULTIPLIER = Number.isFinite(C.FEE_MULTIPLIER) ? C.FEE_MULTIPLIER : 2.17; // 総額に掛ける経費倍率

  /** State/グローバル両対応：全サイト取得 */
  function getAllSites() {
    return (St && St.allSites) || window.allSites || {};
  }
  /** State/グローバル両対応：現サイト名取得 */
  function getCurrentSiteName() {
    return (St && St.currentSite) || window.currentSite || '';
  }
  /** State/グローバル両対応：現サイトオブジェクト取得 */
  function getCurrentSite() {
    const sites = getAllSites();
    const name = getCurrentSiteName();
    return sites[name] || {};
  }

  /** 環境に応じて保存＆再描画（ベストエフォート） */
  function renderAllAndSaveSafe() {
    if (typeof window.renderAllAndSave === 'function') {
      window.renderAllAndSave();
    } else if (App.UI && typeof App.UI.renderAllAndSave === 'function') {
      App.UI.renderAllAndSave();
    } else {
      if (App.Storage && typeof App.Storage.saveData === 'function') App.Storage.saveData();
      if (App.UI && typeof App.UI.renderAll === 'function') App.UI.renderAll();
    }
  }

  // ==============================
  //  単価：端末共通の初期値（オプション）
  // ==============================

  /** 画面の単価入力を端末共通の初期値として保存 */
  function savePrices() {
    const data = {};
    document.querySelectorAll('input[data-price-work]').forEach((el) => {
      data[el.dataset.priceWork] = parseFloat(el.value) || 0;
    });
    try { localStorage.setItem(PRICE_KEY, JSON.stringify(data)); } catch (_) {}
  }

  /** 端末共通の初期値を読み込んで入力欄へ反映（サイト別単価は後で上書き） */
  function loadPrices() {
    try {
      const dat = JSON.parse(localStorage.getItem(PRICE_KEY));
      if (dat && typeof dat === 'object') {
        document.querySelectorAll('input[data-price-work]').forEach((el) => {
          const key = el.dataset.priceWork;
          if (dat[key] != null) el.value = dat[key];
        });
      }
    } catch (_) {}
  }

  // ==============================
  //  単価：サイト別編集・描画
  // ==============================

  /**
   * サイト別の単価を更新（oninput/onblur から呼ばれる）
   * @param {string} key data-price-work のキー
   * @param {string|number} val 入力値
   * @param {boolean} [update=false] trueで保存＆再描画
   */
  function editPrice(key, val, update = false) {
    const sites = getAllSites();
    const siteName = getCurrentSiteName();
    if (!siteName || !sites[siteName]) return;

    const site = sites[siteName];
    if (!site.price) site.price = {};
    site.price[key] = parseFloat(val) || 0;

    if (update) {
      renderAllAndSaveSafe();
      renderPriceTotal();
    }
  }

  /** サイト別単価を #panelPrice の入力欄へ反映 */
  function renderPriceInputs() {
    const site = getCurrentSite();
    const dat = site.price || {};
    document.querySelectorAll('#panelPrice input[data-price-work]').forEach((el) => {
      const key = el.dataset.priceWork;
      el.value = dat[key] != null ? dat[key] : (el.value || 0);
    });
  }

  // ==============================
  //  金額計算（純粋関数）
  // ==============================

  /**
   * サイト1件の合計金額を算出（DOM非依存）
   * @param {object} site
   * @returns {number} 円
   */
  function calcSiteTotal(site) {
    if (!site) return 0;
    const prices = site.price || {};
    const works = site.works || {};
    const paveList = site.pave || [];
    const paveSum = paveList.reduce((a, r) => a + (parseFloat(r.面積) || 0), 0);

    let total = 0;

    // 土工
    if (works.earth) {
      const set = site.earthSetting || {};
      const area = set.same
        ? paveSum
        : (site.earth || []).reduce((a, r) => a + (parseFloat(r.面積) || 0), 0);
      const thick = parseFloat(set.thick) || 0;
      const vol = area * thick / 100; // m³
      total += vol * (parseFloat(prices.earth_machine) || 0);
      total += vol * (parseFloat(prices.earth_soil) || 0);
    }

    // 取壊工
    if (works.demo) {
      const set = site.demoSetting || {};
      const thick = parseFloat(set.thick) || 0;
      const cutting = parseFloat(set.cutting) || 0;
      total += cutting * (parseFloat(prices.demo_cut) || 0);

      const areaDemo = set.same
        ? paveSum
        : (site.demo || []).reduce((a, r) => a + (parseFloat(r.面積) || 0), 0);

      let break_as = 0, break_con = 0;
      if (set.type === 'As') break_as = areaDemo;
      else if (set.type === 'Con') break_con = areaDemo;
      else if (set.type === 'As+Con') { break_as = areaDemo; break_con = areaDemo; }

      const haul_as = break_as * thick / 100;
      const dispose_as = haul_as * 2.35;
      const haul_con = break_con * thick / 100;
      const dispose_con = haul_con * 2.35;

      total += break_as   * (parseFloat(prices.demo_break_as)   || 0);
      total += haul_as    * (parseFloat(prices.demo_haul_as)    || 0);
      total += dispose_as * (parseFloat(prices.demo_dispose_as) || 0);

      total += break_con   * (parseFloat(prices.demo_break_con)   || 0);
      total += haul_con    * (parseFloat(prices.demo_haul_con)    || 0);
      total += dispose_con * (parseFloat(prices.demo_dispose_con) || 0);
    }

    // 舗装（カテゴリ別）
    let as_lt1_4 = 0, as_ge1_4 = 0, as_ge3_0 = 0,
        ovl_lt1_4 = 0, ovl_ge1_4 = 0, ovl_ge3_0 = 0, con_total = 0;

    paveList.forEach((r) => {
      const area = parseFloat(r.面積) || 0;
      if (r.種別 === 'アスファルト') {
        if (r.平均幅員 === '1.4未満') as_lt1_4 += area;
        else if (r.平均幅員 === '1.4以上') as_ge1_4 += area;
        else if (r.平均幅員 === '3.0以上') as_ge3_0 += area;
      } else if (r.種別 === 'オーバーレイ') {
        if (r.平均幅員 === '1.4未満') ovl_lt1_4 += area;
        else if (r.平均幅員 === '1.4以上') ovl_ge1_4 += area;
        else if (r.平均幅員 === '3.0以上') ovl_ge3_0 += area;
      } else if (r.種別 === 'コンクリート') {
        con_total += area;
      }
    });

    const base_area = as_lt1_4 + as_ge1_4 + as_ge3_0;
    total += as_lt1_4 * (parseFloat(prices.pave_as_lt14) || 0);
    total += as_ge1_4 * (parseFloat(prices.pave_as_ge14) || 0);
    total += as_ge3_0 * (parseFloat(prices.pave_as_ge3)  || 0);
    total += base_area * (parseFloat(prices.pave_base)    || 0);

    total += ovl_lt1_4 * (parseFloat(prices.pave_overlay_lt14) || 0);
    total += ovl_ge1_4 * (parseFloat(prices.pave_overlay_ge14) || 0);
    total += ovl_ge3_0 * (parseFloat(prices.pave_overlay_ge3)  || 0);

    total += con_total * (parseFloat(prices.pave_concrete) || 0);

    // 縁石
    const curb = site.curb || {};
    if (curb.use) {
      total += (parseFloat(curb.std)   || 0) * (parseFloat(prices.curb_std)  || 0);
      total += (parseFloat(curb.small) || 0) * (parseFloat(prices.curb_small)|| 0);
      total += (parseFloat(curb.hand)  || 0) * (parseFloat(prices.curb_hand) || 0);
    }

    // 安全施設
    const anzen = site.anzen || {};
    total += (parseFloat(anzen.line_outer)  || 0) * (parseFloat(prices.safety_line_outer)  || 0);
    total += (parseFloat(anzen.line_stop)   || 0) * (parseFloat(prices.safety_line_stop)   || 0);
    total += (parseFloat(anzen.line_symbol) || 0) * (parseFloat(prices.safety_line_symbol) || 0);

    // 仮設工
    const kari = site.kari || {};
    total += (parseFloat(kari.traffic_b)        || 0) * (parseFloat(prices.safety_traffic_b)       || 0);
    total += (parseFloat(kari.temp_signal)      || 0) * (parseFloat(prices.safety_temp_signal)     || 0);
    total += (parseFloat(kari.machine_transport)|| 0) * (parseFloat(prices.other_machine_transport)|| 0);

    return total;
  }

  // ==============================
  //  表示：工事費 & 総額
  // ==============================

  /**
   * #priceTotal に「工事費（全箇所合計）」と
   * 「総額（経費込み ×FEE_MULTIPLIER）」を表示
   */
  function renderPriceTotal() {
    const sites = getAllSites();
    const el = document.getElementById('priceTotal');
    if (!el || !Object.keys(sites).length) return;

    const grandTotal = Object.values(sites).reduce((sum, s) => sum + calcSiteTotal(s), 0);

    const totalStr = Math.round(grandTotal).toLocaleString();
    const totalWithFeeStr = Math.round(grandTotal * FEE_MULTIPLIER).toLocaleString();

    el.innerHTML =
      `直接工事費：${totalStr}円` +
      `<br>総額：${totalWithFeeStr}円`;
  }

  // 公開API
  const api = {
    savePrices,
    loadPrices,
    editPrice,
    renderPriceInputs,
    renderPriceTotal,
    calcSiteTotal,
  };
  App.Prices = api;
  // inline handler対応（HTMLの oninput="editPrice(...)" 等）
  Object.assign(window, api);
})();
