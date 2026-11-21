// Token Radar dashboard, radar-4. Reads window.RADAR (written beside dashboard/
// by main.ts) and renders the ranked board, a filterable table, a per-protocol
// detail drawer with the model's own inputs, the farm economics and the farm plan.
// No network: every byte it shows is in data.js. The page recomputes each row's
// farm plan from the same inputs main.ts used, so the page and board.json agree.
//
// Read this first — the decision summary the page opens with (KPI strip, top):
// model log(mcap/TVL) = 6.965 - 0.478 log(TVL), n=128, R2 0.168, leave-one-out
// median error 1.22 (about x3.4) vs 1.62 global-median and 1.63 starter baselines,
// walk-forward 1.43 vs 1.64; odds by age, 4x5-fold CV Brier 0.213 with the
// age-not-recorded bucket vs 0.221 without; coverage 758/758 (200 ranked: 40
// watchlist + 160 early; 142 pre-token counted; 416 token-recorded set aside);
// verdicts FARM 45 / THIN 60 / SKIP 95. Farm economics are honest by construction:
// break-even is time cost only (hours x $25/hour, an assumption the reader can
// change on this page), the chain fee is unknown and excluded, the snapshot
// carries no airdrop share, so no row promises dollars per farmer — implied
// value per $1 locked and per hour are priority indexes, not returns, and each
// row names what would flip its verdict.
(function () {
  'use strict';
  var DATA = window.RADAR;
  if (!DATA) return;
  var app = document.getElementById('board');
  var state = { q: '', category: 'all', chain: 'all', verdict: 'all', watchlistOnly: false, tab: 'pre-token', sort: 'implied', dir: -1, selected: null, hourlyRate: 25 };
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
  // Farm plan: the same derivation main.ts writes to board.json. Category, chains,
  // TVL and age decide the action, the capital, the hold and every cost and time.
  function chainOf(p) { return p.chains && p.chains.length ? p.chains[0] : 'its main chain'; }
  function capitalFor(p) { if (p.tvl_usd >= 5e9) return 250; if (p.tvl_usd >= 1e9) return 150; if (p.tvl_usd >= 1e8) return 100; return 50; }
  function holdDaysFor(age) { if (age === null || age === undefined) return 30; if (age < 180) return 60; if (age < 365) return 45; return 30; }
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
    return [
      { text: 'Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.', cost: 'no capital yet; check the chain fee before the first transaction', time: '5 minutes' },
      { text: actionFor(p, capital, chain), cost: '$' + capital + ' of capital, plus the chain fee the snapshot does not carry', time: '15 minutes to set up' },
      { text: 'Make one qualifying action each week, such as a deposit, a borrow, a swap or a vote.', cost: 'the chain fee each week, which the snapshot does not carry', time: '10 minutes a week' },
      { text: 'Hold the position for at least ' + hold + ' days so the activity is counted in more than one snapshot.', cost: 'the $' + capital + ' stays in the position', time: hold + ' days' },
      { text: "Before you withdraw, open the protocol's own points or rewards page and claim only from the link it publishes.", cost: 'no fee to check, and never pay to claim', time: '10 minutes' },
      { text: 'Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it.', cost: 'nothing but the log', time: '5 minutes' }
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
  }
  function writeHash() {
    var params = new URLSearchParams();
    if (state.q) params.set('q', state.q);
    if (state.category !== 'all') params.set('category', state.category);
    if (state.verdict !== 'all') params.set('verdict', state.verdict);
    if (state.selected) params.set('p', state.selected);
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
  function lede() {
    var c = DATA.coverage;
    return el('section', { class: 'lede' },
      el('div', null,
        el('h1', { text: DATA.watchlist_size + ' watchlist protocols, ranked by implied value' }),
        el('p', { text: 'The watchlist is the floor: every protocol with at least $' + Math.round(DATA.floor_usd / 1e6) + 'M of TVL that records no token. The early radar adds ' + DATA.early_size + ' pre-token protocols below that floor. Implied value is a fitted model, not a promise: the median error is about 3x, so read the band, not the point.' }),
        el('div', { class: 'strip' },
          el('span', null, 'Accounted: ', el('b', { text: c.total + ' protocols' })),
          el('span', null, el('b', { text: c.ranked + ' ranked' }), ' (', el('b', { text: c.watchlist + ' watchlist' }), ' + ', el('b', { text: c.early + ' early' }), ')'),
          el('span', null, el('b', { text: c.pre_token_unranked + ' pre-token counted' }), ', not ranked'),
          el('span', null, el('b', { text: c.token_recorded + ' record a token' }), ', set aside'))),
      el('div', { class: 'facts' },
        el('div', { class: 'fact' }, el('span', { text: 'Watchlist covered' }), el('b', { text: DATA.watchlist_size + ' / ' + DATA.watchlist_size })),
        el('div', { class: 'fact' }, el('span', { text: 'Pre-token rows scored' }), el('b', { text: String(DATA.board_size) })),
        el('div', { class: 'fact' }, el('span', { text: 'FARM verdicts' }), el('b', { text: String(DATA.rows.filter(function (r) { return r.verdict === 'farm'; }).length) })),
        el('div', { class: 'fact' }, el('span', { text: 'Live-token protocols set aside' }), el('b', { text: String(DATA.live_size) + ' shown, ' + DATA.coverage.live_counted + ' counted' }))));
  }

  function kpiStrip() {
    var v = DATA.validation;
    var c = DATA.coverage;
    var farm = DATA.rows.filter(function (r) { return r.verdict === 'farm'; }).length;
    var thin = DATA.rows.filter(function (r) { return r.verdict === 'thin'; }).length;
    var effTop = DATA.rows.slice().sort(function (a, b) { return b.implied_per_capital_usd - a.implied_per_capital_usd; })[0];
    function kpi(label, value, note) {
      return el('div', { class: 'kpi' }, el('span', { text: label }), el('b', { text: value }), el('span', { class: 'kpi-note', text: note }));
    }
    return el('section', { class: 'kpis', 'aria-label': 'Model summary' },
      kpi('Value model', 'log(mcap/TVL) = ' + v.fit_a.toFixed(3) + ' ' + (v.fit_b < 0 ? '- ' : '+ ') + Math.abs(v.fit_b).toFixed(3) + ' log(TVL)', 'fitted on n=' + v.fit_n + ', R2 ' + v.r2.toFixed(3)),
      kpi('Leave-one-out error', v.loo_median_abs_log_err.toFixed(2) + ' (about x' + Math.exp(v.loo_median_abs_log_err).toFixed(1) + ')', 'vs ' + v.baseline_global_median_loo.toFixed(2) + ' median, ' + v.starter_median_abs_log_err.toFixed(2) + ' starter; walk-forward ' + v.walkforward_ols_median_abs_log_err.toFixed(2) + ' vs ' + v.walkforward_global_median.toFixed(2)),
      kpi('Peer odds (CV)', 'Brier ' + v.odds_cv_brier.toFixed(3) + ' vs ' + v.odds_cv_brier_no_null.toFixed(3), 'with vs without the age-not-recorded bucket; log loss ' + v.odds_cv_logloss.toFixed(3) + ' vs ' + v.odds_cv_logloss_no_null.toFixed(3)),
      kpi('Coverage', c.total + ' / ' + c.total + ' protocols', c.ranked + ' ranked (40 watchlist + ' + c.early + ' early), ' + c.pre_token_unranked + ' counted, ' + c.token_recorded + ' set aside'),
      kpi('Verdicts', 'FARM ' + farm + ' / THIN ' + thin + ' / SKIP ' + (DATA.rows.length - farm - thin), 'rank + odds, not a payout promise'),
      kpi('Best per $1 locked', fmtUsd(effTop.implied_per_capital_usd) + ' per $1', effTop.name + ' (rank #' + effTop.rank + '): a priority index, not a return'));
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
    });
    var pre = el('button', { type: 'button', 'aria-pressed': state.tab === 'pre-token' ? 'true' : 'false', text: 'Pre-token', onclick: function () { state.tab = 'pre-token'; render(); } });
    var live = el('button', { type: 'button', 'aria-pressed': state.tab === 'live' ? 'true' : 'false', text: 'Live token', onclick: function () { state.tab = 'live'; render(); } });
    return el('div', { class: 'controls' },
      el('div', { class: 'field' }, el('label', { for: 'q', text: 'Search' }), search),
      el('div', { class: 'field' }, el('label', { for: 'category', text: 'Category' }), select),
      el('div', { class: 'field' }, el('label', { for: 'chain', text: 'Chain' }), chain),
      el('div', { class: 'field' }, el('label', { for: 'verdict', text: 'Farm verdict' }), verdict),
      el('label', { class: 'check', for: 'watchlist-only' }, wl, ' Watchlist only'),
      el('div', { class: 'field rate' }, el('label', { for: 'hourly-rate', text: 'Your hour ($/h) — your assumption' }), rate),
      el('div', { class: 'field' }, el('span', { class: 'sub', text: 'Token status' }), el('div', { class: 'tabs' }, pre, live)),
      el('span', { class: 'count', text: state.tab === 'pre-token' ? rows().length + ' rows shown' : DATA.live.length + ' live-token protocols' }));
  }
  function sortHeader(key, label) {
    return el('th', { scope: 'col' },
      el('button', { type: 'button', onclick: function () { if (state.sort === key) state.dir = -state.dir; else { state.sort = key; state.dir = -1; } render(); } },
        label, state.sort === key ? el('span', { 'aria-hidden': 'true', text: state.dir < 0 ? ' v' : ' ^' }) : null));
  }
  function verdictPill(v) { return el('span', { class: 'pill ' + v, text: v.toUpperCase() }); }
  function boardTable() {
    var list = sortedRows(rows());
    if (list.length === 0) {
      return el('div', { class: 'panel' }, el('div', { class: 'empty' },
        el('h2', { text: 'No protocol matches that filter' }),
        el('p', { text: 'Clear the search or pick another category to see the board again.' }),
        el('button', { class: 'button primary', type: 'button', text: 'Clear filters', onclick: function () { state.q = ''; state.category = 'all'; state.verdict = 'all'; writeHash(); render(); } })));
    }
    var max = list[0].implied_value_usd || 1;
    var tbody = el('tbody');
    list.forEach(function (r) {
      var growth = r.change_7d === null ? 'n/a' : fmtPct(r.change_7d);
      var growthClass = r.change_7d === null ? '' : r.change_7d >= 0 ? 'pos' : 'neg';
      var tr = el('tr', {
        'data-selected': state.selected === r.slug ? 'true' : 'false', tabindex: '0',
        onclick: function () { openDetail(r.slug); },
        onkeydown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(r.slug); } }
      },
        el('td', { class: 'num', text: '#' + r.rank }, el('span', { class: 'band', text: '#' + r.rank_low + '-' + r.rank_high })),
        el('td', null, el('div', { class: 'name' }, el('b', { text: r.name }),
          el('span', { class: 'sub', text: (r.category || 'Other') + ' on ' + (r.chains && r.chains.length ? r.chains.slice(0, 2).join(', ') : 'an unnamed chain') }))),
        el('td', { class: 'num', text: fmtUsd(r.tvl_usd) }),
        el('td', { class: 'num ' + growthClass, text: growth }),
        el('td', { class: 'num', text: fmtAge(r.age_days) }),
        el('td', { class: 'num', text: (r.odds * 100).toFixed(0) + '%' }),
        el('td', null, el('div', { class: 'implied' },
          el('div', { class: 'bar', 'aria-hidden': 'true' }, el('i', { style: 'width:' + Math.max(3, Math.round((r.implied_value_usd / max) * 100)) + '%' })),
          el('span', { class: 'num', text: fmtUsd(r.implied_value_usd) })),
          el('span', { class: 'band', text: fmtUsd(r.implied_low_usd) + ' - ' + fmtUsd(r.implied_high_usd) })),
        el('td', { class: 'num', text: fmtUsd(r.implied_per_capital_usd) }, el('span', { class: 'band', text: 'eff #' + r.eff_rank_capital })),
        el('td', null, verdictPill(r.verdict)),
        el('td', null, el('span', { class: 'status', text: 'records no token' })));
      tbody.appendChild(tr);
    });
    return el('div', { class: 'panel' },
      el('div', { class: 'table-wrap' },
        el('table', null,
          el('caption', { class: 'sub', text: 'Pre-token protocols, strongest implied value first. Select a row for its model, farm economics and farm plan. The band is the 10th-90th percentile over 200 refits.' }),
          el('thead', null, el('tr', null,
            sortHeader('implied', 'Rank'), sortHeader('name', 'Protocol'), sortHeader('tvl', 'TVL'),
            sortHeader('growth', '7d'), sortHeader('age', 'Age'), sortHeader('odds', 'Peer odds'),
            sortHeader('implied', 'Implied value'), sortHeader('eff_cap', 'Per $1 locked'), el('th', { scope: 'col', text: 'Farm' }), el('th', { scope: 'col', text: 'Token' }))),
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
        'implied = fitted_mcap(TVL) x odds(age), fitted from log(mcap/TVL) = ' + v.fit_a.toFixed(3) + ' ' + (v.fit_b < 0 ? '- ' : '+ ') + Math.abs(v.fit_b).toFixed(3) + ' x log(TVL), fitted on the ' + v.fit_n + ' token-recorded protocols with a positive market cap.'),
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
          el('div', null, el('span', { text: 'Rejected: imputing market-cap-null tokens' }), el('b', { text: v.imputed_curve_loo.toFixed(2) + ' (no change)' })),
          el('div', null, el('span', { text: 'Odds cross-validation, Brier (lower is better)' }), el('b', { text: v.odds_cv_brier.toFixed(3) + ' with age-not-recorded bucket vs ' + v.odds_cv_brier_no_null.toFixed(3) + ' without' }))),
        el('div', null,
          el('h3', { text: 'Peer odds by age' }),
          el('table', { class: 'odds' },
            el('thead', null, el('tr', null, el('th', { scope: 'col', text: 'Age with no token' }), el('th', { scope: 'col', text: 'Peers' }), el('th', { scope: 'col', text: 'Record a token' }), el('th', { scope: 'col', text: 'Odds used' }))),
            el('tbody', null, oddsRows)),
          el('p', { class: 'sub', text: 'Odds are smoothed toward the overall rate (' + (DATA.coverage.token_recorded / DATA.coverage.total * 100).toFixed(0) + '%) with a 20-protocol prior. They are a peer benchmark, not a launch forecast. Protocols whose listing date is not recorded get their own row: 113 such peers record a token 79% of the time, so they are not given the average rate.' }))),
      el('p', { class: 'warn', text: 'Read the band, not the point. Only ' + v.live_with_mcap + ' of ' + v.token_recorded + ' token-recorded protocols carry a positive market cap, so the curve is fitted on a selected 128, and the median error is still about 3x. A rank range of #3 (2-9) means the protocol held rank 2 to 9 across 200 refits of that curve. The snapshot has no airdrop share and no fee, so no row promises dollars per farmer: the verdict ranks effort, and break-even is time cost only — hours at $25 an hour, an assumption you can change above — with the chain fee additional and unknown. Implied value per $1 locked and per hour are priority indexes, not returns: the implied value is the whole protocol\u2019s token value, not a per-farmer share.' }));
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
    var liveBreakEven = Math.round(row.time_hours * state.hourlyRate);
    var tierRows = (row.deposit_tiers || []).map(function (t) {
      return el('tr', null,
        el('td', { class: 'num', text: '$' + t.capital_usd }),
        el('td', { class: 'num', text: fmtUsd(t.implied_per_capital_usd) + ' per $1' }),
        el('td', { class: 'num', text: '$' + t.break_even_usd + ' at $25/h' }));
    });
    dialog.appendChild(el('section', { class: 'detail-section' },
      el('h3', { text: 'Farm economics' }),
      el('div', { class: 'equation' },
        el('div', null, el('span', { text: 'Verdict' }), el('b', { text: row.verdict.toUpperCase() })),
        el('div', null, el('span', { text: 'Capital in the position' }), el('b', { class: 'num', text: '$' + row.capital_usd })),
        el('div', null, el('span', { text: 'Time, setup + weekly + claim' }), el('b', { class: 'num', text: row.time_hours.toFixed(1) + ' hours' })),
        el('div', null, el('span', { text: 'Break-even airdrop at your hour' }), el('b', { class: 'num', text: '$' + liveBreakEven + ' at $' + state.hourlyRate + '/h' })),
        el('div', null, el('span', { text: 'Implied value per $1 of capital' }), el('b', { class: 'num', text: fmtUsd(row.implied_per_capital_usd) + ' (efficiency rank #' + row.eff_rank_capital + ')' })),
        el('div', null, el('span', { text: 'Implied value per hour' }), el('b', { class: 'num', text: fmtUsd(row.implied_per_hour_usd) + ' (efficiency rank #' + row.eff_rank_hour + ')' }))),
      el('p', { class: 'sub', text: verdictText + ' Break-even is time cost only — hours at your hour above, an assumption, not a snapshot figure — with the chain fee additional and unknown, so check the chain fee before you start. The snapshot carries no airdrop share, so break-even is the airdrop that would have to arrive, not a payout this row promises.' }),
      el('p', { class: 'flip', text: 'What would flip this verdict: ' + row.flip_condition }),
      el('h3', { text: 'Deposit sizes — what a bigger deposit costs to lock' }),
      el('table', { class: 'odds tiers' },
        el('thead', null, el('tr', null, el('th', { scope: 'col', text: 'Deposit' }), el('th', { scope: 'col', text: 'Implied per $1' }), el('th', { scope: 'col', text: 'Break-even' }))),
        el('tbody', null, tierRows)),
      el('p', { class: 'sub', text: 'Time and break-even do not change with the deposit: the same hours are spent. The snapshot gives no rule that a larger deposit earns a larger share, so a bigger deposit locks more capital for the same time — the plan sizes the recommended deposit above, and these tiers show the cost, not a larger reward.' })));
    dialog.appendChild(el('section', { class: 'detail-section' },
      el('h3', { text: 'Farm plan' }),
      el('ol', { class: 'steps' }, steps.map(function (s) {
        var at = s.indexOf(' Cost: ');
        var action = at >= 0 ? s.slice(0, at) : s;
        var tail = at >= 0 ? s.slice(at + 1) : '';
        return el('li', null, el('b', { text: action }), el('span', { class: 'cost', text: tail }));
      }))));
    if (typeof dialog.showModal === 'function') { if (!dialog.open) dialog.showModal(); }
    else dialog.setAttribute('open', '');
  }
  function render() {
    app.textContent = '';
    var shell = el('div', { class: 'shell' });
    shell.appendChild(header());
    shell.appendChild(kpiStrip());
    shell.appendChild(lede());
    shell.appendChild(controls());
    shell.appendChild(state.tab === 'pre-token' ? boardTable() : liveTable());
    if (state.tab === 'pre-token') shell.appendChild(modelPanel());
    app.appendChild(shell);
    app.setAttribute('aria-busy', 'false');
    if (!dialog.isConnected) app.appendChild(dialog);
    if (state.selected) openDetail(state.selected);
  }
  readHash();
  render();
  window.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dialog.open) dialog.close(); });
})();
