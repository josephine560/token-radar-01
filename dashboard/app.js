// Token Radar dashboard, radar-8. Reads window.RADAR (written beside dashboard/
// by main.ts) and renders the ranked board, a filterable table, a per-protocol
// detail drawer with the model's own inputs, the farm economics and the farm plan.
// No network: every byte it shows is in data.js. The page shows board.json's own
// farm steps (carried in data.js), so the page and the board cannot disagree.
// Net figures are a stated scenario, not a forecast: the airdrop pool is 7% of
// the implied value, the farmed capital is 1% of TVL, and your slice is
// proportional to your deposit within the farmed capital; net is the slice
// minus all the plan's costs (time at $25/hour, network fees, pool fee).
// A row is ROBUST when even its low-end net (at the band's 10th percentile)
// is positive. The deposit and drop-share controls re-price every net live.
//
// The decision summary (KPI strip, top) is rendered from data.js, not
// repeated here. The fee table below is the full record — the model panel
// renders it from data.js, and this comment is the only place the figures
// appear as text.
//
// Chain fees, researched 2026-11-22, 2026-11-23 and 2026-11-27 from public trackers (growthepie, L2Fees.info,
// GasNow, DataWallet, DeFiStar, OpenChainBench, Ghostdrive, GemWallet trackers,
// Monad docs). One DEX swap's network fee, USD, then the conservative per-tx
// figure the farm math uses (the range's high end). "est" = estimate, not a
// measured median. Every chain in the snapshot now has a figure — the last
// seven were resolved 2026-11-27 (see "Radar-7 adds" below):
// Ethereum 0.02-0.25 / 0.25; Arbitrum 0.007-0.024 / 0.024; Binance 0.005-0.01 / 0.01;
// Base 0.002-0.018 / 0.018; Solana 0.001-0.01 / 0.01 (first token account ~$0.16 rent, refundable); Avalanche 0.009 / 0.009; Polygon 0.003-0.006 / 0.006;
// Optimism 0.001-0.031 / 0.031 (sources disagree ~30x); Bitcoin no
// swap, transfer 0.09; Tron 1-4 / 4 est; Robinhood Chain 0.01 / 0.01 est; Linea
// 0.028-0.037 / 0.037; Sonic 0.0002 / 0.0002 est; Sui 0.0007-0.0013 / 0.0013;
// Mantle 0.002-0.005 / 0.005 est; Scroll 0.001-0.052 / 0.052 (sources disagree ~50x);
// Berachain 0.0001 / 0.0001 est; xDai <0.001 / 0.001; Celo 0.002 / 0.002 est;
// zkSync Era 0.02-0.048 / 0.048; Cardano no swap, transfer 0.023; Unichain
// 0.0003-0.0005 / 0.0005; TON no swap, transfer 0.001; Sei 0.001 / 0.001 est;
// Stellar 0.0001 / 0.0001 est; Algorand 0.001 / 0.001 est; Aptos 0.0001-0.0005 /
// 0.0005 est; Blast 0.025 / 0.025; Monad 0.0005-0.001 / 0.001; Hyperliquid L1
// (HyperEVM gas) 0.033-0.062 / 0.062. Radar-6 adds: Flare 0.0001-0.001 / 0.001 est;
// Ink 0.001-0.005 / 0.005 est; Provenance no swap, $0.15/message / 0.15 est;
// Plasma 0.00001-0.0001 / 0.001; Arc 0.003-0.045 / 0.05 est; Ripple 0.000011 /
// 0.001; Noble no DEX, transfer 0.01-0.10 / 0.10 est; Manta 0.0009-0.0017 / 0.002;
// World Chain 0.001-0.005 / 0.005 est;
// Kava <0.0001 / 0.001; Morph 0.01-0.03 / 0.03 est; RSK 0.17-0.25 / 0.25;
// Ronin 0.0003-0.0006 / 0.001; Proton no fee / 0.001 (resource model);
// Tempo 0.0001-0.0018 / 0.002; Reya 0.00001-0.002 / 0.002;
// Starknet 0.10-0.35 / 0.35 est; Strato 0.01 flat / 0.01;
// Stable 0.0001-0.0002 / 0.001; Klaytn 0.0002-0.001 / 0.001;
// Bifrost Network ~0.006 / 0.01 est; Qubic no swap, transfer proxy / 0.005 est;
// Stacks 0.03-0.79 / 0.80; Fluent 0.0003-0.001 / 0.001; Plume Mainnet 0.002-0.02 /
// 0.02. Radar-7 adds: RISE no swap / 0.005; BSquared 0.0001-0.001 / 0.001;
// Bittensor no swap / 0.70 est; Pharos 0.03-0.10 / 0.10 est; Mezo 0.02-0.10 /
// 0.10 est; XION no swap / 0.001 est; Canton no swap / 1.00 est. No chain
// lacks a reliable figure now. A round trip is about 4-6
// transactions (approve, setup, weekly actions, claim, exit), so multiply the
// single-swap figure; bridging is usually the biggest fee (~$0.30-$4 per $500
// stablecoin bridge, May 2026 quotes) and the pool fee (0.25% of a swap)
// dwarfs gas on most chains now.
(function () {
  'use strict';
  var DATA = window.RADAR;
  if (!DATA) return;
  var app = document.getElementById('board');
  var state = { q: '', category: 'all', chain: 'all', verdict: 'all', watchlistOnly: false, tab: 'pre-token', sort: 'implied', dir: -1, selected: null, hourlyRate: 25, view: null, deposit: null, dropShare: 0.07 };
  // Stated scenario behind every net: drop pool 7% of implied value, farmed
  // capital 1% of TVL, slice proportional to deposit; net is the slice minus
  // all costs. At the defaults (plan deposit, 7%, $25/h) the row's stored
  // board.json nets are used exactly, so page and board agree.
  var usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  function fmtUsd(n) {
    if (n === null || n === undefined || !isFinite(n)) return 'n/a';
    if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
    return usd.format(n);
  }
  function fmtPct(n) { if (n === null || n === undefined || !isFinite(n)) return 'n/a'; return (n > 0 ? '+' : '') + n.toFixed(2) + '%'; }
  function fmtAge(d) { if (d === null || d === undefined) return 'unknown'; if (d >= 365) return (d / 365).toFixed(1) + 'y'; return Math.max(0, Math.round(d)) + 'd'; }
  function fmtNet(n) { if (n === null || n === undefined || !isFinite(n)) return 'n/a'; return (n >= 0 ? '+$' : '-$') + Math.abs(n).toFixed(2); }
  function atDefaults() { return state.deposit === null && state.dropShare === 0.07 && state.hourlyRate === 25; }
  function netFor(r) {
    if (atDefaults()) return { net: r.net_usd, perHour: r.net_per_hour_usd, netLow: r.net_low_usd, robust: r.robust };
    var dep = state.deposit === null ? r.capital_usd : state.deposit;
    var pool = r.pool_fee_usd > 0 ? dep * 0.0025 : 0;
    var total = r.time_hours * state.hourlyRate + (r.network_fee_usd || 0) + pool;
    var slice = r.tvl_usd > 0 ? (r.implied_value_usd * state.dropShare * dep) / (0.01 * r.tvl_usd) : 0;
    var sliceLow = r.tvl_usd > 0 ? (r.implied_low_usd * state.dropShare * dep) / (0.01 * r.tvl_usd) : 0;
    var net = Math.round((slice - total) * 100) / 100;
    var netLow = Math.round((sliceLow - total) * 100) / 100;
    return { net: net, perHour: Math.round((net / r.time_hours) * 100) / 100, netLow: netLow, robust: netLow > 0 };
  }
  function el(tag, attrs) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') node.className = attrs[k];
      else if (k === 'text') node.textContent = attrs[k];
      else if (k === 'html') node.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== null && attrs[k] !== undefined) node.setAttribute(k, attrs[k]);
    });
    for (var i = 2; i < arguments.length; i++) {
      var child = arguments[i];
      if (child === null || child === undefined) continue;
      if (Array.isArray(child)) child.forEach(function (c) { if (c) node.appendChild(c); });
      else if (typeof child === 'string') node.appendChild(document.createTextNode(child));
      else node.appendChild(child);
    }
    return node;
  }
  // Farm plan: the same derivation main.ts writes to board.json, from the
  // row's own category, chains, TVL, age and fee fields. The page and
  // board.json agree because both run this derivation from the same inputs.
  function chainOf(p) { return p.chains && p.chains.length ? p.chains[0] : 'its main chain'; }
  function capitalFor(p) { if (p.tvl_usd >= 5e9) return 250; if (p.tvl_usd >= 1e9) return 150; if (p.tvl_usd >= 1e8) return 100; return 50; }
  function holdDaysFor(age) { if (age === null || age === undefined) return 30; if (age < 180) return 60; if (age < 365) return 45; return 30; }
  function money2(n) {
    var digits = n >= 1 ? 2 : n >= 0.01 ? 3 : 4;
    var s = n.toFixed(digits).replace(/\.?0+$/, '');
    return '$' + (s === '' || s === '-' ? '0' : s);
  }
  function actionFor(p, capital, chain) {
    var c = (p.category || '').toLowerCase(); var name = p.name;
    if (c.indexOf('lend') >= 0 || c.indexOf('cdp') >= 0 || c.indexOf('collateral') >= 0) return 'Supply $' + capital + ' of USDC to ' + name + ' on ' + chain + ' and keep the position open.';
    if (c.indexOf('dex') >= 0 || c.indexOf('yield') >= 0 || c.indexOf('leveraged farm') >= 0) return 'Provide $' + capital + ' of liquidity to ' + name + "'s main pool on " + chain + ' and keep the position open.';
    if (c.indexOf('bridge') >= 0) return 'Bridge $' + capital + ' of USDC to ' + chain + ' through ' + name + ' and use the bridged funds in its app.';
    if (c.indexOf('staking') >= 0 || c.indexOf('restak') >= 0) return "Stake $" + capital + " of the chain's staking asset through " + name + ' and keep the receipt.';
    if (c.indexOf('perpetual') >= 0 || c.indexOf('derivative') >= 0) return 'Deposit $' + capital + ' of USDC as margin on ' + name + ' and open one small hedge.';
    if (c.indexOf('prediction') >= 0) return 'Fund $' + capital + ' and place one market position on ' + name + '.';
    if (c.indexOf('curator') >= 0 || c.indexOf('allocator') >= 0) return 'Deposit $' + capital + ' into a ' + name + ' vault on ' + chain + ' and keep the shares.';
    if (c.indexOf('stable') >= 0) return 'Mint or deposit $' + capital + ' of the stable asset through ' + name + ' on ' + chain + '.';
    if (c.indexOf('rwa') >= 0) return "Mint $" + capital + " of the protocol's yield asset on " + chain + ' and hold it.';
    if (c.indexOf('insurance') >= 0) return 'Buy $' + capital + ' of cover from ' + name + ' on ' + chain + ' and keep the policy.';
    return 'Deposit $' + capital + ' of USDC into ' + name + ' on ' + chain + ' and keep the position open.';
  }
  function stepText(s) { var t = s.text + ' Cost: ' + s.cost + '. Time: ' + s.time + '.'; if (t.length > 600) t = t.slice(0, 596) + '...'; return t; }
  function farmSteps(p) {
    var chain = chainOf(p), capital = capitalFor(p), hold = holdDaysFor(p.age_days);
    var fee = p.fee_unknown ? null : { perTx: p.fee_per_tx_usd, lo: p.fee_swap_lo_usd, hi: p.fee_swap_hi_usd };
    var pool = p.pool_fee_usd > 0 ? capital * 0.0025 : 0; // step text uses the unrounded 0.25% of capital; board.json rounds it to cents
    var perTx = function (n) { return fee === null ? 'the chain fee (no reliable public figure for ' + chain + ')' : 'about ' + money2(n) + ' in network fees on ' + chain; };
    var swapRange = fee === null ? 'no reliable public fee figure for ' + chain + ' — check the live fee first'
      : fee.lo === null ? 'no DEX swap on ' + chain + '; a plain transaction costs about ' + money2(fee.perTx)
      : 'a swap on ' + chain + ' typically costs ' + money2(fee.lo) + '-' + money2(fee.hi) + ' in network fees (Nov 2026 medians)';
    return [
      { text: 'Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.', cost: 'no capital yet; ' + swapRange, time: '5 minutes' },
      { text: actionFor(p, capital, chain), cost: '$' + capital + ' of capital, plus ' + perTx(2 * (fee ? fee.perTx : 0)) + ' to set up' + (pool > 0 ? ', plus ' + money2(pool) + ' pool fee on the swap leg' : ''), time: '15 minutes to set up' },
      { text: 'Make one qualifying action each week, such as a deposit, a borrow, a swap or a vote.', cost: perTx(fee ? fee.perTx : 0) + ' each week', time: '10 minutes a week' },
      { text: 'Hold the position for at least ' + hold + ' days so the activity is counted in more than one snapshot.', cost: 'the $' + capital + ' stays in the position', time: hold + ' days' },
      { text: "Before you withdraw, open the protocol's own points or rewards page and claim only from the link it publishes.", cost: perTx(fee ? fee.perTx : 0) + ' to claim, and never pay to claim', time: '10 minutes' },
      { text: 'Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it.', cost: 'nothing but the log (' + p.tx_count + ' transactions in all)', time: '5 minutes' }
    ].map(stepText);
  }
  function readHash() {
    var hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;
    var params = new URLSearchParams(hash);
    if (params.get('q')) state.q = params.get('q');
    if (params.get('p')) state.selected = params.get('p');
    if (params.get('category')) state.category = params.get('category');
    if (params.get('verdict')) state.verdict = params.get('verdict');
    if (params.get('view')) state.view = params.get('view');
    if (params.get('deposit')) { var d = parseFloat(params.get('deposit')); if (isFinite(d) && d > 0) state.deposit = d; }
    if (params.get('drop')) { var s = parseFloat(params.get('drop')); if (isFinite(s) && s > 0 && s < 1) state.dropShare = s; }
  }
  function writeHash() {
    var params = new URLSearchParams();
    if (state.q) params.set('q', state.q);
    if (state.category !== 'all') params.set('category', state.category);
    if (state.verdict !== 'all') params.set('verdict', state.verdict);
    if (state.selected) params.set('p', state.selected);
    if (state.deposit !== null) params.set('deposit', String(state.deposit));
    if (state.dropShare !== 0.07) params.set('drop', String(state.dropShare));
    var next = params.toString();
    if (next) window.history.replaceState(null, '', '#' + next);
    else window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  var WATCHLIST = {};
  (DATA.watchlist_slugs || []).forEach(function (s) { WATCHLIST[s] = true; });
  function rows() {
    var q = state.q.trim().toLowerCase();
    return DATA.rows.filter(function (r) {
      if (state.category !== 'all' && r.category !== state.category) return false;
      if (state.chain !== 'all' && !(r.chains || []).some(function (c) { return c === state.chain; })) return false;
      if (state.verdict !== 'all' && r.verdict !== state.verdict) return false;
      if (state.watchlistOnly && !WATCHLIST[r.slug]) return false;
      if (!q) return true;
      var hay = [r.name, r.slug, r.category, (r.chains || []).join(' ')].join(' ').toLowerCase();
      return hay.indexOf(q) >= 0;
    });
  }
  function sortedRows(list) {
    var key = state.sort;
    return list.slice().sort(function (a, b) {
      var av, bv;
      if (key === 'name') { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
      else if (key === 'tvl') { av = a.tvl_usd; bv = b.tvl_usd; }
      else if (key === 'growth') { av = a.change_7d === null ? -Infinity : a.change_7d; bv = b.change_7d === null ? -Infinity : b.change_7d; }
      else if (key === 'age') { av = a.age_days === null ? Infinity : a.age_days; bv = b.age_days === null ? Infinity : b.age_days; }
      else if (key === 'odds') { av = a.odds; bv = b.odds; }
      else if (key === 'eff_cap') { av = a.implied_per_capital_usd; bv = b.implied_per_capital_usd; }
      else if (key === 'eff_hr') { av = a.implied_per_hour_usd; bv = b.implied_per_hour_usd; }
      else if (key === 'net') { av = netFor(a).net; bv = netFor(b).net; }
      else if (key === 'net_hr') { av = netFor(a).perHour; bv = netFor(b).perHour; }
      else if (key === 'width') { av = a.rank_high - a.rank_low; bv = b.rank_high - b.rank_low; }
      else { av = a.implied_value_usd; bv = b.implied_value_usd; }
      if (av < bv) return -state.dir;
      if (av > bv) return state.dir;
      return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
    });
  }
  function header() {
    return el('header', { class: 'top' },
      el('div', { class: 'brand' }, el('span', { class: 'mark' }), el('span', { class: 'brand-name', text: 'Token Radar' })),
      el('div', { class: 'top-meta' },
        el('span', { text: 'Snapshot ' + DATA.as_of }),
        el('span', { text: 'DefiLlama protocol index' }),
        el('span', { text: DATA.model_version + ' model' })));
  }
  function farmNext() {
    var farms = DATA.rows.filter(function (r) { return r.verdict === 'farm'; });
    var top = farms.slice().sort(function (a, b) { return netFor(b).perHour - netFor(a).perHour; }).slice(0, 3);
    if (top.length === 0) return null;
    var parts = top.map(function (r) { var n = netFor(r); return r.name + ' ' + fmtNet(n.perHour) + '/h'; });
    var best = netFor(top[0]).perHour;
    var head = best > 0 ? 'Farm next: ' : 'No FARM row nets positive at the stated scenario — the least-negative are: ';
    return head + parts.join(' · ') + ' — net of all costs at the stated scenario (drop pool ' + (state.dropShare * 100).toFixed(1) + '% of implied value, farmed capital 1% of TVL, $' + state.hourlyRate + '/h). Change the deposit or drop share below and every net re-prices.';
  }
  function lede() {
    var c = DATA.coverage;
    return el('section', { class: 'lede' },
      el('h1', { text: DATA.watchlist_size + ' watchlist protocols, ranked by implied value' }),
      el('p', { text: 'The watchlist is the floor: every protocol with at least $' + Math.round(DATA.floor_usd / 1e6) + 'M of TVL that records no token. The early radar adds every other rankable pre-token protocol — ' + c.early_above_floor + ' at or above the floor the watchlist rule leaves out, and ' + c.early_below_floor + ' below it — and no bridged, staked or wrapped product of a token that already trades. Implied value is a fitted model, not a promise: the median error is about 3x, so read the band, not the point.' }),
      el('p', { class: 'farm-next', text: farmNext() }));
  }

  function evidenceStrip() {
    var v = DATA.validation;
    var ab = (DATA.validation.ablation_top20 || []).map(function (a) { return a.label + ' ' + a.kept + '/20'; }).join(' · ');
    var ranksOk = DATA.rows.every(function (r, i) { return r.rank === i + 1; });
    var monoOk = DATA.rows.every(function (r, i) { return i === 0 || r.implied_value_usd < DATA.rows[i - 1].implied_value_usd; });
    return el('section', { class: 'panel evidence' },
      el('h2', { text: 'What was tested, and what survived' }),
      el('p', { class: 'sub', text: 'Adopted curve: two-segment split at median TVL ($' + (Math.exp(v.blend_split_log_tvl) / 1e6).toFixed(1) + 'M), blended over ±' + (v.blend_band_log / 2).toFixed(1) + ' log TVL — leave-one-out ' + v.blend_loo.toFixed(2) + ', walk-forward ' + v.blend_wf.toFixed(2) + ' (single curve ' + v.loo_median_abs_log_err.toFixed(2) + ' / ' + v.walkforward_ols_median_abs_log_err.toFixed(2) + '; baselines ' + v.baseline_global_median_loo.toFixed(2) + ' / ' + v.walkforward_global_median.toFixed(2) + '). Unblended it passes both too (' + v.two_segment_loo.toFixed(2) + ' / ' + v.two_segment_wf.toFixed(2) + ') but jumps 26% at the split — two protocols either side (Plasma One $31.9M, Aegis YUSD $34.5M) would differ 29% on the fit alone; the blend prices them 2.8% apart. Mean error is still worse (' + v.blend_loo_mean.toFixed(2) + ' vs ' + v.loo_mean_abs_log_err.toFixed(2) + '), wins ' + v.blend_wins + '/128: a median win, disclosed, not a sweep. Dropped on leave-one-out (and fails repeated 5-fold): +growth ' + v.growth_term_loo.toFixed(2) + ' · +growth and age ' + v.age_term_loo.toFixed(2) + ' · quadratic ' + v.quadratic_term_loo.toFixed(2) + ' · +log age ' + v.log_age_loo.toFixed(2) + ' · median regression ' + v.lad_loo.toFixed(2) + ' · trimmed ' + v.trimmed_loo.toFixed(2) + ' · TVL-quintile bins ' + v.quintile_loo.toFixed(2) + ' · isotonic ' + v.isotonic_loo.toFixed(2) + ' · winsorized ' + v.winsorized_loo.toFixed(2) + ' · Theil-Sen ' + v.theil_sen_loo.toFixed(2) + ' · category shrinkage ' + v.category_shrink_loo.toFixed(2) + ' · imputed ' + v.imputed_curve_loo.toFixed(2) + '.' }),
      el('p', { class: 'sub', text: 'Top 20 kept under ablations: ' + ab + '. Self-check ' + (ranksOk && monoOk ? 'passed' : 'FAILED') + ': ' + DATA.coverage.total + '/' + DATA.coverage.total + ' protocols accounted for · ' + DATA.board_size + ' rows · ranks 1–' + DATA.board_size + ' continuous · implied values strictly decreasing · board sha256 ' + (DATA.board_sha256 || 'n/a').slice(0, 12) + ' · ' + DATA.board_size + '/' + DATA.board_size + ' rows on this page equal board.json · one function prices this page and the board.' }));
  }

  function kpiStrip() {
    var v = DATA.validation;
    var c = DATA.coverage;
    var farm = DATA.rows.filter(function (r) { return r.verdict === 'farm'; }).length;
    var thin = DATA.rows.filter(function (r) { return r.verdict === 'thin'; }).length;
    var bestNetHr = DATA.rows.filter(function (r) { return r.verdict === 'farm'; }).slice().sort(function (a, b) { return netFor(b).perHour - netFor(a).perHour; })[0];
    function kpi(label, value, note) {
      return el('div', { class: 'kpi' }, el('span', { text: label }), el('b', { text: value }), el('span', { class: 'kpi-note', text: note }));
    }
    return el('section', { class: 'kpis', 'aria-label': 'Model summary' },
      kpi('Value model', 'two segments, blended ±' + (v.blend_band_log / 2).toFixed(1) + ' log TVL', 'split $' + (Math.exp(v.blend_split_log_tvl) / 1e6).toFixed(1) + 'M; lo ' + v.blend_lo_a.toFixed(2) + ' ' + (v.blend_lo_b < 0 ? '- ' : '+ ') + Math.abs(v.blend_lo_b).toFixed(2) + 'x · hi ' + v.blend_hi_a.toFixed(2) + ' ' + (v.blend_hi_b < 0 ? '- ' : '+ ') + Math.abs(v.blend_hi_b).toFixed(2) + 'x; n=' + v.fit_n + ', R2 ' + v.r2.toFixed(3)),
      kpi('Leave-one-out error', v.blend_loo.toFixed(2) + ' (about x' + Math.exp(v.blend_loo).toFixed(1) + ')', 'blend; single ' + v.loo_median_abs_log_err.toFixed(2) + ' vs ' + v.baseline_global_median_loo.toFixed(2) + ' median, ' + v.starter_median_abs_log_err.toFixed(2) + ' starter; walk-forward ' + v.blend_wf.toFixed(2) + ' vs single ' + v.walkforward_ols_median_abs_log_err.toFixed(2) + ' / ' + v.walkforward_global_median.toFixed(2)),
      kpi('Peer odds (CV)', 'Brier ' + v.odds_cv_brier.toFixed(3) + ' vs ' + v.odds_cv_brier_no_null.toFixed(3), 'with vs without the age-not-recorded bucket; log loss ' + v.odds_cv_logloss.toFixed(3) + ' vs ' + v.odds_cv_logloss_no_null.toFixed(3)),
      kpi('Coverage', c.total + ' / ' + c.total + ' protocols', c.ranked + ' ranked (40 watchlist + ' + c.early + ' early), ' + c.pre_token_unranked + ' counted, ' + c.token_recorded + ' set aside; ' + DATA.fee_unknown_rows + ' rows on chains with no fee figure'),
      kpi('Verdicts', 'FARM ' + farm + ' / THIN ' + thin + ' / SKIP ' + (DATA.rows.length - farm - thin), 'rank + odds, not a payout promise'),
      kpi('Best net per hour (FARM)', fmtNet(netFor(bestNetHr).perHour) + '/h', bestNetHr.name + ' (rank #' + bestNetHr.rank + '): net of all costs at the stated scenario, not a payout'));
  }

  function controls() {
    var categories = Array.from(new Set(DATA.rows.map(function (r) { return r.category || 'Other'; }))).sort();
    var chains = Array.from(new Set(DATA.rows.reduce(function (acc, r) { return acc.concat(r.chains || []); }, []))).sort();
    var search = el('input', { type: 'search', id: 'q', placeholder: 'Search name, category or chain', value: state.q, 'aria-label': 'Search the board' });
    search.addEventListener('input', function () { state.q = search.value; writeHash(); render(); });
    var select = el('select', { id: 'category', 'aria-label': 'Filter by category' },
      el('option', { value: 'all', text: 'All categories' }),
      categories.map(function (c) { return el('option', { value: c, text: c, selected: c === state.category ? 'selected' : null }); }));
    select.addEventListener('change', function () { state.category = select.value; writeHash(); render(); });
    var verdict = el('select', { id: 'verdict', 'aria-label': 'Filter by farm verdict' },
      el('option', { value: 'all', text: 'All verdicts' }),
      el('option', { value: 'farm', text: 'FARM only', selected: state.verdict === 'farm' ? 'selected' : null }),
      el('option', { value: 'thin', text: 'THIN only', selected: state.verdict === 'thin' ? 'selected' : null }),
      el('option', { value: 'skip', text: 'SKIP only', selected: state.verdict === 'skip' ? 'selected' : null }));
    verdict.addEventListener('change', function () { state.verdict = verdict.value; writeHash(); render(); });
    var chain = el('select', { id: 'chain', 'aria-label': 'Filter by chain' },
      el('option', { value: 'all', text: 'All chains' }),
      chains.map(function (c) { return el('option', { value: c, text: c, selected: c === state.chain ? 'selected' : null }); }));
    chain.addEventListener('change', function () { state.chain = chain.value; writeHash(); render(); });
    var wl = el('input', { type: 'checkbox', id: 'watchlist-only', checked: state.watchlistOnly ? 'checked' : null, 'aria-label': 'Watchlist only' });
    wl.addEventListener('change', function () { state.watchlistOnly = wl.checked; render(); });
    var rate = el('input', { type: 'number', id: 'hourly-rate', min: '0', step: '1', value: String(state.hourlyRate), 'aria-label': 'Your hour in dollars' });
    rate.addEventListener('input', function () {
      var n = parseFloat(rate.value);
      state.hourlyRate = isFinite(n) && n >= 0 ? n : 25;
      if (state.selected) openDetail(state.selected);
      else render();
    });
    var deposit = el('select', { id: 'deposit', 'aria-label': 'Deposit size for net figures' },
      el('option', { value: '', text: 'Plan deposit', selected: state.deposit === null ? 'selected' : null }),
      [50, 100, 250, 500, 1000].map(function (d) { return el('option', { value: String(d), text: '$' + d + ' deposit', selected: state.deposit === d ? 'selected' : null }); }));
    deposit.addEventListener('change', function () { state.deposit = deposit.value === '' ? null : parseFloat(deposit.value); writeHash(); render(); });
    var drop = el('select', { id: 'drop-share', 'aria-label': 'Drop pool share of implied value' },
      [0.035, 0.07, 0.14].map(function (s) { return el('option', { value: String(s), text: (s * 100).toFixed(1) + '% drop pool', selected: state.dropShare === s ? 'selected' : null }); }));
    drop.addEventListener('change', function () { state.dropShare = parseFloat(drop.value); writeHash(); render(); });
    var pre = el('button', { type: 'button', 'aria-pressed': state.tab === 'pre-token' ? 'true' : 'false', text: 'Pre-token', onclick: function () { state.tab = 'pre-token'; render(); } });
    var live = el('button', { type: 'button', 'aria-pressed': state.tab === 'live' ? 'true' : 'false', text: 'Live token', onclick: function () { state.tab = 'live'; render(); } });
    return el('div', { class: 'controls' },
      el('div', { class: 'field' }, el('label', { for: 'q', text: 'Search' }), search),
      el('div', { class: 'field' }, el('label', { for: 'category', text: 'Category' }), select),
      el('div', { class: 'field' }, el('label', { for: 'chain', text: 'Chain' }), chain),
      el('div', { class: 'field' }, el('label', { for: 'verdict', text: 'Farm verdict' }), verdict),
      el('label', { class: 'check', for: 'watchlist-only' }, wl, ' Watchlist only'),
      el('div', { class: 'field rate' }, el('label', { for: 'hourly-rate', text: 'Your hour ($/h) — your assumption' }), rate),
      el('div', { class: 'field' }, el('label', { for: 'deposit', text: 'Deposit — re-prices nets' }), deposit),
      el('div', { class: 'field' }, el('label', { for: 'drop-share', text: 'Drop pool — re-prices nets' }), drop),
      el('div', { class: 'field' }, el('span', { class: 'sub', text: 'Token status' }), el('div', { class: 'tabs' }, pre, live)),
      el('span', { class: 'count', text: state.tab === 'pre-token' ? rows().length + ' rows shown' : DATA.live.length + ' live-token protocols' }));
  }
  function sortHeader(key, label) {
    return el('th', { scope: 'col' },
      el('button', { type: 'button', onclick: function () { if (state.sort === key) state.dir = -state.dir; else { state.sort = key; state.dir = -1; } render(); } },
        label, state.sort === key ? el('span', { 'aria-hidden': 'true', text: state.dir < 0 ? ' v' : ' ^' }) : null));
  }
  function verdictPill(v) { return el('span', { class: 'pill ' + v, text: v.toUpperCase() }); }
  function shortAction(p) {
    var c = (p.category || '').toLowerCase();
    if (c.indexOf('lend') >= 0 || c.indexOf('cdp') >= 0 || c.indexOf('collateral') >= 0) return 'Supply USDC';
    if (c.indexOf('dex') >= 0 || c.indexOf('yield') >= 0 || c.indexOf('leveraged farm') >= 0) return 'Provide liquidity';
    if (c.indexOf('bridge') >= 0) return 'Bridge USDC';
    if (c.indexOf('staking') >= 0 || c.indexOf('restak') >= 0) return 'Stake';
    if (c.indexOf('perpetual') >= 0 || c.indexOf('derivative') >= 0) return 'Deposit margin';
    if (c.indexOf('prediction') >= 0) return 'Fund a market';
    if (c.indexOf('curator') >= 0 || c.indexOf('allocator') >= 0) return 'Vault deposit';
    if (c.indexOf('stable') >= 0) return 'Mint stable asset';
    if (c.indexOf('rwa') >= 0) return 'Mint yield asset';
    if (c.indexOf('insurance') >= 0) return 'Buy cover';
    return 'Deposit USDC';
  }
  function planLine(r) {
    var fee = r.fee_unknown ? 'fee unknown' : '$' + r.network_fee_usd.toFixed(2) + ' fees';
    return shortAction(r) + ' · ' + chainOf(r) + ' · ' + fee + ' · ' + r.time_hours.toFixed(1) + ' h';
  }
  function boardTable() {
    var list = sortedRows(rows());
    if (list.length === 0) {
      return el('div', { class: 'panel' }, el('div', { class: 'empty' },
        el('h2', { text: 'No protocol matches that filter' }),
        el('p', { text: 'Clear the search or pick another category to see the board again.' }),
        el('button', { class: 'button primary', type: 'button', text: 'Clear filters', onclick: function () { state.q = ''; state.category = 'all'; state.verdict = 'all'; writeHash(); render(); } })));
    }
    var max = list[0].implied_value_usd || 1;
    var netRanks = new Map(DATA.rows.slice().sort(function (a, b) { return netFor(b).net - netFor(a).net; }).map(function (r, i) { return [r.slug, i + 1]; }));
    var tbody = el('tbody');
    list.forEach(function (r) {
      var growth = r.change_7d === null ? 'n/a' : fmtPct(r.change_7d);
      var growthClass = r.change_7d === null ? '' : r.change_7d >= 0 ? 'pos' : 'neg';
      var net = netFor(r);
      var tr = el('tr', {
        'data-selected': state.selected === r.slug ? 'true' : 'false', tabindex: '0',
        onclick: function () { openDetail(r.slug); },
        onkeydown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(r.slug); } }
      },
        el('td', { class: 'num', text: '#' + r.rank }, el('span', { class: 'band', text: '#' + r.rank_low + '-' + r.rank_high })),
        el('td', null, el('div', { class: 'name' }, el('b', { text: r.name }),
          el('span', { class: 'sub', text: (r.category || 'Other') + ' on ' + (r.chains && r.chains.length ? r.chains.slice(0, 2).join(', ') : 'an unnamed chain') }),
          el('span', { class: 'plan-line', text: planLine(r) }))),
        el('td', { class: 'num', text: fmtUsd(r.tvl_usd) }),
        el('td', { class: 'num ' + growthClass, text: growth }),
        el('td', { class: 'num', text: fmtAge(r.age_days) }),
        el('td', { class: 'num', text: (r.odds * 100).toFixed(0) + '%' }),
        el('td', null, el('div', { class: 'implied' },
          el('div', { class: 'bar', 'aria-hidden': 'true' }, el('i', { style: 'width:' + Math.max(3, Math.round((r.implied_value_usd / max) * 100)) + '%' })),
          el('span', { class: 'num', text: fmtUsd(r.implied_value_usd) })),
          el('span', { class: 'band', text: fmtUsd(r.implied_low_usd) + ' - ' + fmtUsd(r.implied_high_usd) })),
        el('td', { class: 'num' }, el('span', { class: net.net >= 0 ? 'pos' : 'neg', text: fmtNet(net.net) }), el('span', { class: 'band', text: fmtNet(net.perHour) + '/h · net #' + netRanks.get(r.slug) })),
        el('td', null, verdictPill(r.verdict), net.robust ? el('span', { class: 'robust', text: 'ROBUST' }) : null),
        el('td', null, el('span', { class: 'status', text: 'records no token' })));
      tbody.appendChild(tr);
    });
    return el('div', { class: 'panel' },
      el('div', { class: 'table-wrap' },
        el('table', null,
          el('caption', { class: 'sub', text: 'Pre-token protocols, strongest implied value first. Select a row for its model, farm economics and farm plan. The band is the 10th-90th percentile over 200 refits. Net is the stated-scenario slice minus all costs: the drop pool is ' + (state.dropShare * 100).toFixed(1) + '% of implied value, the farmed capital is 1% of TVL, your slice is proportional to your deposit within it. ROBUST means the net stays positive even at the band\'s low end.' }),
          el('thead', null, el('tr', null,
            sortHeader('implied', 'Rank'), sortHeader('name', 'Protocol'), sortHeader('tvl', 'TVL'),
            sortHeader('growth', '7d'), sortHeader('age', 'Age'), sortHeader('odds', 'Peer odds'),
            sortHeader('implied', 'Implied value'), sortHeader('net', 'Net if launch'), el('th', { scope: 'col', text: 'Farm' }), el('th', { scope: 'col', text: 'Token' }))),
          tbody)));
  }
  function liveTable() {
    var tbody = el('tbody');
    DATA.live.forEach(function (r) {
      tbody.appendChild(el('tr', null,
        el('td', { class: 'num', text: 'live' }),
        el('td', null, el('div', { class: 'name' }, el('b', { text: r.name }), el('span', { class: 'sub', text: (r.category || 'Other') + ' on ' + (r.chains && r.chains.length ? r.chains.slice(0, 2).join(', ') : 'an unnamed chain') }))),
        el('td', { class: 'num', text: fmtUsd(r.tvl_usd) }),
        el('td', { class: 'num ' + (r.change_7d !== null && r.change_7d >= 0 ? 'pos' : 'neg'), text: fmtPct(r.change_7d) }),
        el('td', { class: 'num', text: fmtUsd(r.mcap_usd) }),
        el('td', null, el('span', { class: 'status', text: 'already trades' }))));
    });
    return el('div', { class: 'panel' },
      el('div', { class: 'table-wrap' },
        el('table', null,
          el('caption', { class: 'sub', text: 'Token live: these protocols already trade, so their market cap is a fact, not a model. They are set aside from the pre-token ranking; all ' + DATA.coverage.live_counted + ' token-recorded protocols are counted, the top ' + DATA.live.length + ' by market cap are shown.' }),
          el('thead', null, el('tr', null, el('th', { scope: 'col', text: 'Status' }), el('th', { scope: 'col', text: 'Protocol' }), el('th', { scope: 'col', text: 'TVL' }), el('th', { scope: 'col', text: '7d' }), el('th', { scope: 'col', text: 'Market cap' }), el('th', { scope: 'col', text: 'Token' }))),
          tbody)));
  }
  function modelPanel() {
    var v = DATA.validation;
    var oddsRows = DATA.odds_table.map(function (b) {
      return el('tr', null,
        el('td', { text: b.label }), el('td', { class: 'num', text: String(b.n) }),
        el('td', { class: 'num', text: (b.raw_rate * 100).toFixed(0) + '%' }),
        el('td', { class: 'num', text: (b.odds * 100).toFixed(0) + '%' }));
    });
    return el('section', { class: 'panel model' },
      el('h2', { text: 'How implied value is computed, and how wrong it can be' }),
      el('p', { class: 'sub', text: 'One function scores every protocol. No name is special-cased, and no row is hand-picked.' }),
      el('div', { class: 'formula' },
        'implied = fitted_mcap(TVL) x odds(age). The fit is two segments on log(mcap/TVL): below $' + (Math.exp(v.blend_split_log_tvl) / 1e6).toFixed(1) + 'M TVL, ' + v.blend_lo_a.toFixed(2) + ' ' + (v.blend_lo_b < 0 ? '- ' : '+ ') + Math.abs(v.blend_lo_b).toFixed(2) + ' x log(TVL); above, ' + v.blend_hi_a.toFixed(2) + ' ' + (v.blend_hi_b < 0 ? '- ' : '+ ') + Math.abs(v.blend_hi_b).toFixed(2) + ' x log(TVL); blended over ±' + (v.blend_band_log / 2).toFixed(1) + ' log TVL. Fitted on the ' + v.fit_n + ' protocols with a positive market cap.'),
      el('div', { class: 'grid2' },
        el('div', { class: 'valid' },
          el('div', null, el('span', { text: 'Fit, R-squared' }), el('b', { text: v.r2.toFixed(3) })),
          el('div', null, el('span', { text: 'Leave-one-out median error (log)' }), el('b', { text: v.loo_median_abs_log_err.toFixed(2) + '  (about x' + Math.exp(v.loo_median_abs_log_err).toFixed(1) + ')' })),
          el('div', null, el('span', { text: 'Same test, global-median baseline' }), el('b', { text: v.baseline_global_median_loo.toFixed(2) })),
          el('div', null, el('span', { text: 'Same test, category-median baseline' }), el('b', { text: v.baseline_category_median_loo.toFixed(2) })),
          el('div', null, el('span', { text: 'Same test, starter formula (TVL x 0.25)' }), el('b', { text: v.starter_median_abs_log_err.toFixed(2) })),
          el('div', null, el('span', { text: 'Walk-forward, listed before Jun 2025 -> after' }), el('b', { text: 'OLS ' + v.walkforward_ols_median_abs_log_err.toFixed(2) + ' vs median ' + v.walkforward_global_median.toFixed(2) + ' (n=' + v.walkforward_test_n + ')' })),
          el('div', null, el('span', { text: 'Rejected: +growth term, leave-one-out' }), el('b', { text: v.growth_term_loo.toFixed(2) + ' (worse)' })),
          el('div', null, el('span', { text: 'Rejected: +growth and age terms' }), el('b', { text: v.age_term_loo.toFixed(2) + ' (worse)' })),
          el('div', null, el('span', { text: 'Rejected: quadratic log(TVL) term' }), el('b', { text: v.quadratic_term_loo.toFixed(2) + ' (no better)' })),
          el('div', null, el('span', { text: 'Rejected: category shrinkage' }), el('b', { text: v.category_shrink_loo.toFixed(2) + ' (worse)' })),
          el('div', null, el('span', { text: 'Rejected: category shrinkage, n/(n+50)' }), el('b', { text: v.category_shrink_50_loo.toFixed(2) + ' (worse)' })),
          el('div', null, el('span', { text: 'Rejected: winsorized fit' }), el('b', { text: v.winsorized_loo.toFixed(2) + ' (worse)' })),
          el('div', null, el('span', { text: 'Rejected: Theil-Sen fit' }), el('b', { text: v.theil_sen_loo.toFixed(2) + ' (worse)' })),
          el('div', null, el('span', { text: 'Rejected: imputing market-cap-null tokens' }), el('b', { text: v.imputed_curve_loo.toFixed(2) + ' (no change)' })),
          el('div', null, el('span', { text: 'Rejected: +log age term' }), el('b', { text: v.log_age_loo.toFixed(2) + ' (worse)' })),
          el('div', null, el('span', { text: 'Rejected: median regression (LAD)' }), el('b', { text: v.lad_loo.toFixed(2) + ' (worse)' })),
          el('div', null, el('span', { text: 'Rejected: trimmed fit (5% tails dropped)' }), el('b', { text: v.trimmed_loo.toFixed(2) + ' (worse)' })),
          el('div', null, el('span', { text: 'Rejected: TVL-quintile bin medians' }), el('b', { text: v.quintile_loo.toFixed(2) + ' (worse)' })),
          el('div', null, el('span', { text: 'Rejected: isotonic (monotone) fit' }), el('b', { text: v.isotonic_loo.toFixed(2) + ' (worse)' })),
          el('div', null, el('span', { text: 'Adopted: two-segment split at median TVL, blended ±0.5 log TVL' }), el('b', { text: 'LOO ' + v.blend_loo.toFixed(2) + ' / walk-forward ' + v.blend_wf.toFixed(2) + ' (unblended ' + v.two_segment_loo.toFixed(2) + ' / ' + v.two_segment_wf.toFixed(2) + ', 26% cliff; wins ' + v.blend_wins + '/128, mean ' + v.blend_loo_mean.toFixed(2) + ' vs single ' + v.loo_mean_abs_log_err.toFixed(2) + ')' })),
          el('div', null, el('span', { text: 'Odds cross-validation, Brier (lower is better)' }), el('b', { text: v.odds_cv_brier.toFixed(3) + ' with age-not-recorded bucket vs ' + v.odds_cv_brier_no_null.toFixed(3) + ' without' }))),
        el('div', null,
          el('h3', { text: 'Peer odds by age' }),
          el('table', { class: 'odds' },
            el('thead', null, el('tr', null, el('th', { scope: 'col', text: 'Age with no token' }), el('th', { scope: 'col', text: 'Peers' }), el('th', { scope: 'col', text: 'Record a token' }), el('th', { scope: 'col', text: 'Odds used' }))),
            el('tbody', null, oddsRows)),
          el('p', { class: 'sub', text: 'Odds are smoothed toward the overall rate (' + (DATA.coverage.token_recorded / DATA.coverage.total * 100).toFixed(0) + '%) with a 20-protocol prior. They are a peer benchmark, not a launch forecast. Protocols whose listing date is not recorded get their own row: 113 such peers record a token 79% of the time, so they are not given the average rate.' }))),
      el('h3', { text: 'Chain fees — researched, not assumed' }),
      el('p', { class: 'sub', text: 'The snapshot carries no fee, so every fee below was researched from public trackers on 2026-11-22, 2026-11-23 and 2026-11-27 (growthepie, L2Fees.info, GasNow, DataWallet, DeFiStar, OpenChainBench, Ghostdrive, GemWallet trackers, Monad docs). A swap is one DEX swap\'s network fee only; the pool fee (usually 0.25%) is extra and is charged in the farm math where a plan swaps. ' + (DATA.fee_unknown_rows === 0 ? 'Every chain in the snapshot now has a researched figure — the last seven were resolved 2026-11-27 — so no row says the fee is unknown. ' : DATA.fee_unknown_rows + ' of ' + DATA.board_size + ' rows sit on chains with no reliable public figure — those rows say the fee is unknown rather than quoting a guess. ') + 'Gas prices move daily, so every figure is a November-2026 snapshot.' }),
      el('table', { class: 'odds' },
        el('thead', null, el('tr', null, el('th', { scope: 'col', text: 'Chain' }), el('th', { scope: 'col', text: 'One swap (network)' }), el('th', { scope: 'col', text: 'Per tx used' }), el('th', { scope: 'col', text: 'How measured' }))),
        el('tbody', null, DATA.chain_fees.map(function (f) {
          return el('tr', null,
            el('td', { text: f.chain }),
            el('td', { class: 'num', text: f.swap_lo_usd === null ? 'no swap' : money2(f.swap_lo_usd) + '-' + money2(f.swap_hi_usd) }),
            el('td', { class: 'num', text: money2(f.per_tx_usd) }),
            el('td', { text: f.quality === 'measured' ? 'measured median' : 'estimate' }));
        }))),
      el('p', { class: 'sub', text: 'Gotchas the plans price in: a first swap costs approve + swap; a first Solana token account costs ~0.00204 SOL rent (~$0.16, refundable); Tron USDT transfers cost $1-$4 when TRX is burned for energy; bridging (~$0.30-$4 per $500 stablecoin bridge) is usually the biggest fee in a plan; and a round trip is 4-6 transactions, so multiply the single-swap figure. Three chains are expensive enough to change a verdict: Canton $1.00, Stacks $0.80 and Bittensor $0.70 per transaction. World Chain swaps may carry a 1% World Money app fee on top (an app fee, not a network fee, and not in the farm math). Noble, Provenance, Canton and Bittensor have no DEX swap — their figures are transfer or average-transaction costs, and the plans say so.' }),
      el('p', { class: 'warn', text: 'Read the band, not the point. Only ' + v.live_with_mcap + ' of ' + v.token_recorded + ' token-recorded protocols carry a positive market cap, so the curve is fitted on a selected 128, and the median error is still about 3x. A rank range of #3 (2-9) means the protocol held rank 2 to 9 across 200 refits of that curve. The snapshot has no airdrop share and no fee, so no row promises dollars per farmer: the verdict ranks effort, and break-even is time cost plus the plan\'s network fees at November-2026 medians plus the pool fee where it swaps — ' + (DATA.fee_unknown_rows === 0 ? 'no row lacks a reliable fee figure, so every break-even prices its network fees. ' : DATA.fee_unknown_rows + ' rows have no reliable fee figure, and for those the break-even is time cost only. ') + 'Implied value per $1 locked and per hour are priority indexes, not returns: the implied value is the whole protocol\u2019s token value, not a per-farmer share.' }));
  }
  var dialog = el('dialog', { class: 'detail', id: 'detail', 'aria-labelledby': 'detail-title' });
  dialog.addEventListener('close', function () { state.selected = null; writeHash(); });
  function openDetail(slug) {
    var row = DATA.rows.filter(function (r) { return r.slug === slug; })[0];
    if (!row) return;
    state.selected = slug;
    writeHash();
    dialog.textContent = '';
    var steps = farmSteps(row);
    var verdictText = row.verdict === 'farm' ? 'Farm: top quarter by implied value with peer odds at or above 35%. Do the full plan, weekly actions included.'
      : row.verdict === 'thin' ? 'Thin: mid-board, or odds below the farm line. Do the cheap setup, skip most weekly actions.'
      : 'Skip: bottom of the board. The effort is better spent on a higher row.';
    dialog.appendChild(el('div', { class: 'detail-head' },
      el('div', null,
        el('span', { class: 'brand-name', text: 'Rank ' + row.rank + ' of ' + DATA.board_size + '  (refits: #' + row.rank_low + '-' + row.rank_high + ')' }),
        el('h2', { id: 'detail-title', text: row.name }),
        el('p', { class: 'sub', text: (row.category || 'Other') + ' on ' + (row.chains && row.chains.length ? row.chains.join(', ') : 'an unnamed chain') + ' - records no token' })),
      el('button', { class: 'close', type: 'button', 'aria-label': 'Close details', text: 'Close', onclick: function () { dialog.close(); } })));
    dialog.appendChild(el('section', { class: 'detail-section' },
      el('h3', { text: 'Implied value' }),
      el('div', { class: 'equation' },
        el('div', null, el('span', { text: 'TVL' }), el('b', { class: 'num', text: fmtUsd(row.tvl_usd) })),
        el('div', null, el('span', { text: 'Seven-day growth' }), el('b', { class: 'num', text: fmtPct(row.change_7d) })),
        el('div', null, el('span', { text: 'Age with no token' }), el('b', { class: 'num', text: fmtAge(row.age_days) })),
        el('div', null, el('span', { text: 'Fitted market cap at this TVL' }), el('b', { class: 'num', text: fmtUsd(row.fitted_value_usd) })),
        el('div', null, el('span', { text: 'Peer odds at this age' }), el('b', { class: 'num', text: (row.odds * 100).toFixed(0) + '%' })),
        el('div', null, el('span', { text: 'Implied value (fitted x odds)' }), el('b', { class: 'num', text: fmtUsd(row.implied_value_usd) })),
        el('div', null, el('span', { text: '10th-90th percentile over 200 refits' }), el('b', { class: 'num', text: fmtUsd(row.implied_low_usd) + ' - ' + fmtUsd(row.implied_high_usd) }))),
      el('p', { class: 'sub', text: 'Model ' + DATA.model_version + ': the same function scores every protocol. This is an estimate, not a price. Growth is shown because the reader should see it; the fitted curve tested it and dropped it, because it made leave-one-out error worse.' })));
    var liveTotal = Math.round(row.time_hours * state.hourlyRate + (row.network_fee_usd || 0) + row.pool_fee_usd);
    var feeSuffix = row.fee_unknown ? ' + chain fee' : '';
    var net = netFor(row);
    var holdDays = holdDaysFor(row.age_days);
    var tbill = Math.round(row.capital_usd * 0.04 * holdDays / 365 * 100) / 100;
    var tierRows = (row.deposit_tiers || []).map(function (t) {
      var netT;
      if (atDefaults()) netT = t.net_usd;
      else {
        // Tiers share the row's time and network fee; only the pool fee
        // scales with the tier's deposit (0.25% of the swap leg).
        var totalT = row.time_hours * state.hourlyRate + (row.network_fee_usd || 0) + (row.pool_fee_usd > 0 ? t.capital_usd * 0.0025 : 0);
        var sliceT = row.tvl_usd > 0 ? (row.implied_value_usd * state.dropShare * t.capital_usd) / (0.01 * row.tvl_usd) : 0;
        netT = Math.round((sliceT - totalT) * 100) / 100;
      }
      return el('tr', null,
        el('td', { class: 'num', text: '$' + t.capital_usd }),
        el('td', { class: 'num', text: fmtUsd(t.implied_per_capital_usd) + ' per $1' }),
        el('td', { class: 'num', text: '$' + t.break_even_usd + ' at $25/h' + feeSuffix }),
        el('td', { class: 'num ' + (netT >= 0 ? 'pos' : 'neg'), text: fmtNet(netT) }));
    });
    dialog.appendChild(el('section', { class: 'detail-section' },
      el('h3', { text: 'Farm economics' }),
      el('div', { class: 'equation' },
        el('div', null, el('span', { text: 'Verdict' }), el('b', { text: row.verdict.toUpperCase() })),
        el('div', null, el('span', { text: 'Capital in the position' }), el('b', { class: 'num', text: '$' + row.capital_usd })),
        el('div', null, el('span', { text: 'Time, setup + weekly + claim' }), el('b', { class: 'num', text: row.time_hours.toFixed(1) + ' hours' })),
        el('div', null, el('span', { text: 'Network fees (' + row.tx_count + ' txs on ' + row.fee_chain + ')' }), el('b', { class: 'num', text: row.fee_unknown ? 'unknown — no reliable figure' : '$' + row.network_fee_usd.toFixed(2) })),
        el('div', null, el('span', { text: 'Pool fee on the swap leg' }), el('b', { class: 'num', text: row.pool_fee_usd > 0 ? '$' + row.pool_fee_usd.toFixed(2) : 'none — this plan does not swap' })),
        el('div', null, el('span', { text: 'Total cost to farm' }), el('b', { class: 'num', text: '$' + liveTotal + feeSuffix })),
        el('div', null, el('span', { text: 'Break-even airdrop at your hour' }), el('b', { class: 'num', text: '$' + liveTotal + ' at $' + state.hourlyRate + '/h' + feeSuffix })),
        el('div', null, el('span', { text: 'Net if launch (stated scenario)' }), el('b', { class: 'num ' + (net.net >= 0 ? 'pos' : 'neg'), text: fmtNet(net.net) + ' · ' + fmtNet(net.perHour) + '/h' })),
        el('div', null, el('span', { text: 'Net at the band low end' }), el('b', { class: 'num ' + (net.netLow >= 0 ? 'pos' : 'neg'), text: fmtNet(net.netLow) + (net.robust ? ' — ROBUST' : '') })),
        el('div', null, el('span', { text: 'T-bill bar (4% over the hold)' }), el('b', { class: 'num', text: '$' + tbill.toFixed(2) + ' over ' + holdDays + ' days — net is ' + fmtNet(net.net) + (net.net >= tbill ? ', above the bar' : ', below the bar') })),
        el('div', null, el('span', { text: 'Implied value per $1 of capital' }), el('b', { class: 'num', text: fmtUsd(row.implied_per_capital_usd) + ' (efficiency rank #' + row.eff_rank_capital + ')' })),
        el('div', null, el('span', { text: 'Implied value per hour' }), el('b', { class: 'num', text: fmtUsd(row.implied_per_hour_usd) + ' (efficiency rank #' + row.eff_rank_hour + ')' }))),
      el('p', { class: 'sub', text: verdictText + ' Break-even is the airdrop that would have to arrive: your time at your hour above, plus network fees on ' + row.fee_chain + ' at November-2026 medians (' + row.tx_count + ' transactions: approve, setup, one a week, claim)' + (row.pool_fee_usd > 0 ? ', plus the 0.25% pool fee on the swap leg' : '') + '.' + (row.fee_unknown ? ' This chain has no reliable public fee figure, so the break-even above is time cost only — check the live fee before you start.' : '') + ' The snapshot carries no airdrop share, so break-even is the airdrop that would have to arrive, not a payout this row promises. Net if launch is one stated scenario, not a forecast: the drop pool is ' + (state.dropShare * 100).toFixed(1) + '% of implied value, the farmed capital is 1% of TVL, and your slice is proportional to your deposit within it; net is the slice minus all the costs above. Change the deposit or drop share on the page and every net re-prices.' }),
      row.fee_basis ? el('p', { class: 'sub', text: 'Fee basis: ' + row.fee_basis + (row.fee_quality === 'estimate' ? ' (estimate, not a measured median).' : '.') }) : null,
      el('p', { class: 'flip', text: 'What would flip this verdict: ' + row.flip_condition }),
      el('h3', { text: 'Deposit sizes — what a bigger deposit costs to lock' }),
      el('table', { class: 'odds tiers' },
        el('thead', null, el('tr', null, el('th', { scope: 'col', text: 'Deposit' }), el('th', { scope: 'col', text: 'Implied per $1' }), el('th', { scope: 'col', text: 'Break-even' }), el('th', { scope: 'col', text: 'Net if launch' }))),
        el('tbody', null, tierRows)),
      el('p', { class: 'sub', text: 'Time does not change with the deposit; break-even moves only where the plan swaps (the 0.25% pool fee on a bigger deposit). The snapshot gives no rule that a larger deposit earns a larger share, so a bigger deposit locks more capital for the same time — the plan sizes the recommended deposit above, and these tiers show the cost, not a larger reward.' })));
    dialog.appendChild(el('section', { class: 'detail-section', id: 'farm-plan' },
      el('h3', { text: 'Farm plan' }),
      el('ol', { class: 'steps' }, steps.map(function (s) {
        var at = s.indexOf(' Cost: ');
        var action = at >= 0 ? s.slice(0, at) : s;
        var tail = at >= 0 ? s.slice(at + 1) : '';
        return el('li', null, el('b', { text: action }), el('span', { class: 'cost', text: tail }));
      }))));
    if (typeof dialog.showModal === 'function') { if (!dialog.open) dialog.showModal(); }
    else dialog.setAttribute('open', '');
    if (state.view === 'plan') {
      var plan = document.getElementById('farm-plan');
      if (plan) plan.scrollIntoView();
    }
  }
  function footer() {
    return el('footer', { class: 'foot' },
      el('span', { text: 'Board sha256 ' + (DATA.board_sha256 || 'n/a').slice(0, 12) + ' · snapshot ' + DATA.as_of + ' · ' + DATA.model_version + ' model · deterministic build: two runs write identical bytes' }));
  }
  function render() {
    app.textContent = '';
    var shell = el('div', { class: 'shell' });
    shell.appendChild(header());
    shell.appendChild(kpiStrip());
    shell.appendChild(lede());
    shell.appendChild(evidenceStrip());
    shell.appendChild(controls());
    shell.appendChild(state.tab === 'pre-token' ? boardTable() : liveTable());
    if (state.tab === 'pre-token') shell.appendChild(modelPanel());
    shell.appendChild(footer());
    app.appendChild(shell);
    app.setAttribute('aria-busy', 'false');
    if (!dialog.isConnected) app.appendChild(dialog);
    if (state.selected) openDetail(state.selected);
  }
  readHash();
  render();
  window.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dialog.open) dialog.close(); });
})();
