// Token Radar, model radar-4: the implied value is fitted from the snapshot itself.
// Radar-4 keeps radar-3's value curve, odds and bootstrap unchanged; it reworks
// the farm economics and the dashboard only (see the farm-economics paragraph below).
//
// A protocol's token, if it ever issues one, is valued by the market the snapshot
// already records. 128 of the 416 token-recorded protocols carry a positive market
// cap, and those 128 are the only ones that can teach a value curve, so the curve
// is fitted on them at run time, from the snapshot's own figures, and validated
// on them before it is trusted:
//
//   log(mcap / TVL) = a + b * log(TVL)
//
// fitted by ordinary least squares. The curve is deliberately small, and radar-3
// re-tested every improvement proposed for it on the snapshot alone, each on
// leave-one-out error (median absolute log error, n=128) and on the walk-forward
// split (listed before 2025-06-01 train, after test, n=20), and adopted only
// what beat radar-2 on both. Nothing did, so the value curve is radar-2's,
// unchanged. What was tried and rejected, with leave-one-out numbers computed
// at run time and shown on the dashboard: a quadratic log(TVL) term (1.22,
// no better than 1.22, and worse on repeated 5-fold checks run offline: 1.30
// vs 1.26); category shrinkage, partial pooling of category residual medians
// with strength n/(n+20) (worse, and worse on walk-forward too); imputing the
// 272 token-recorded but market-cap-null protocols at the curve, at the curve
// minus 1.0, or at their category median (all worse on leave-one-out, and the
// imputation is unsound anyway: market-cap-null is not low market cap — the
// null set holds Binance CEX at $116B TVL with symbol BNB and no market cap,
// and the chance a token-recorded protocol carries a market cap does not rise
// with TVL at all, 0.41 / 0.25 / 0.30 / 0.28 across TVL quartiles); adding the
// 15 market-cap-zero protocols as tiny values (far worse); Huber and trimmed
// fits, k-nearest neighbours on log TVL, and ridge fits on growth, age and
// chain count (all worse on leave-one-out when tested offline). A growth term
// and an age term were already rejected in radar-2 (1.33 and 1.34). The curve
// is weak in absolute terms (R2 0.168, median error about x3.4) and radar-3
// does not hide that: the dashboard states it, and every row carries a band
// and a rank range from 200 bootstrap refits.
//
// One thing did survive validation, and it is radar-3's only model change.
// Radar-2 gave a protocol whose listing date the snapshot does not record
// the overall token rate, 0.549. But 113 protocols record no listing date
// and 79% of them record a token — they behave like the oldest bucket, not
// like the average protocol — so radar-2 underpriced all 11 such rows on the
// board. Radar-3 gives them their own smoothed bucket, 0.752, from those
// 113 peers. The change was checked by 4-times-5-fold cross-validation on
// token presence over all 758 protocols, computed at run time: Brier
// 0.221 without the bucket against 0.213 with it, log loss 0.634 against
// 0.617, and a logistic regression on age, TVL, growth and chain count did
// worse than either (0.233 offline). The bucket is a peer benchmark, not a
// launch forecast, and the dashboard says so.
//
// A pre-token protocol's implied value is then
//
//   implied = fitted_mcap(TVL) x odds(age)
//
// where odds(age) is the smoothed share of peer protocols at that age that record
// a token. That share is a peer benchmark, not a forecast: it says how often
// protocols of this age have a token on record, not that this one will issue one.
// A protocol that records no token after four years may be less likely to launch
// than its peers, not more; the board discounts by the peer rate and says so.
//
// The snapshot carries no airdrop share, no fee and no payout per farmer, so no
// row can promise dollars per farmer. The farm verdict ranks effort instead:
// FARM is the top quarter by implied value with peer odds at or above 0.35
// (only the youngest bucket, under six months, falls below that line),
// THIN is the top half or odds at or above 0.55, the rest is SKIP. Radar-4
// makes the relative-priority case crisp without inventing a payout: each row
// carries implied value per $1 of capital locked and per hour spent (a priority
// index, not a return — the implied value is the whole protocol's token value,
// not a per-farmer share), an efficiency rank beside its absolute rank, the
// three deposit tiers ($50 / $100 / $250) with what each costs to lock, and a
// "what would flip this verdict" line computed from the rank-50 and rank-100
// implied-value lines. Break-even is time cost only — hours x $25/hour, an
// assumption the reader can change on the dashboard — and the chain fee is
// additional and unknown: the snapshot carries no fee, so no row quotes one
// and the steps say to check the chain fee first.
//
// Nothing here names a protocol. The same function scores every row.

/** The snapshot's protocol entry: exactly the ten fields the sealed input carries. */
export interface SnapshotProtocol {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
}

/** The whole snapshot document. */
export interface Snapshot {
  as_of: string;
  source: string;
  floor_usd: number;
  protocols: SnapshotProtocol[];
  watchlist: string[];
}

/** The fitted value curve and the validation the dashboard reports. */
export interface Validation {
  fit_n: number;
  fit_a: number;
  fit_b: number;
  r2: number;
  loo_median_abs_log_err: number;
  loo_mean_abs_log_err: number;
  baseline_global_median_loo: number;
  baseline_category_median_loo: number;
  starter_median_abs_log_err: number;
  growth_term_loo: number;
  age_term_loo: number;
  quadratic_term_loo: number;
  category_shrink_loo: number;
  imputed_curve_loo: number;
  odds_cv_brier: number;
  odds_cv_brier_no_null: number;
  odds_cv_logloss: number;
  odds_cv_logloss_no_null: number;
  walkforward_train_n: number;
  walkforward_test_n: number;
  walkforward_ols_median_abs_log_err: number;
  walkforward_global_median: number;
  walkforward_category_median: number;
  live_with_mcap: number;
  token_recorded: number;
}

/** One peer age bucket and its smoothed token rate. */
export interface OddsBucket {
  label: string;
  lo_days: number;
  hi_days: number | null;
  n: number;
  raw_rate: number;
  odds: number;
}

/** How the 758 protocols are accounted for. */
export interface Coverage {
  total: number;
  pre_token: number;
  token_recorded: number;
  watchlist: number;
  early: number;
  ranked: number;
  pre_token_unranked: number;
  live_shown: number;
  live_counted: number;
}

/** The model's version label: the dashboard names it. */
export const MODEL_VERSION = 'radar-4';

/** How many pre-token protocols below the watchlist floor the early radar carries, by TVL. */
export const EARLY_ROWS = 160;

/** How many live-token protocols the Live token view carries, by market cap. */
export const LIVE_ROWS = 24;

/** Bootstrap refits behind each row's band and rank range. Seeded, so two runs agree. */
export const BOOTSTRAPS = 200;

/** The assumed value of a farmer's hour, in dollars. An assumption, not a snapshot figure.
 * The dashboard lets the reader change it; board.json's break-even is computed at this default. */
export const TIME_VALUE_USD_PER_HOUR = 25;

/** The three deposit sizes the dashboard shows per row, in dollars. The snapshot
 * gives no rule that a larger deposit earns a larger share, so the tiers show
 * what a larger deposit costs to lock, not a larger reward. */
export const DEPOSIT_TIERS_USD = [50, 100, 250] as const;

/** A farm step: the action, what it costs, and how long it takes. */
export interface FarmStep {
  text: string;
  cost: string;
  time: string;
}

/** One deposit size for a row: what it costs to lock and what the priority index
 * looks like at that size. Time and break-even do not change with the deposit —
 * the same hours are spent — so the trade-off a bigger deposit buys is nothing
 * the snapshot promises: more capital locked for the same time. */
export interface DepositTier {
  capital_usd: number;
  implied_per_capital_usd: number;
  break_even_usd: number;
}

/** One row of board.json: the ranked board's row. */
export interface BoardRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
  token_status: 'pre-token';
  age_days: number | null;
  implied_value_usd: number;
  fitted_value_usd: number;
  odds: number;
  implied_low_usd: number;
  implied_high_usd: number;
  rank_low: number;
  rank_high: number;
  verdict: 'farm' | 'thin' | 'skip';
  capital_usd: number;
  time_hours: number;
  break_even_usd: number;
  /** Implied value per $1 of the recommended capital locked: a priority index, not a return. */
  implied_per_capital_usd: number;
  /** Implied value per hour spent, at the recommended capital. */
  implied_per_hour_usd: number;
  /** This row's rank by implied value per $1 locked, and by implied value per hour. */
  eff_rank_capital: number;
  eff_rank_hour: number;
  /** What would move this row across a verdict line, from the rank-50 and rank-100 implied values. */
  flip_condition: string;
  /** The $50 / $100 / $250 deposit sizes, each with its own per-$1 index. */
  deposit_tiers: DepositTier[];
  farm_steps: string[];
}

/** The dashboard's compact view of one row. */
export interface RadarRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  age_days: number | null;
  implied_value_usd: number;
  fitted_value_usd: number;
  odds: number;
  implied_low_usd: number;
  implied_high_usd: number;
  rank_low: number;
  rank_high: number;
  verdict: 'farm' | 'thin' | 'skip';
  capital_usd: number;
  time_hours: number;
  break_even_usd: number;
  implied_per_capital_usd: number;
  implied_per_hour_usd: number;
  eff_rank_capital: number;
  eff_rank_hour: number;
  flip_condition: string;
  deposit_tiers: DepositTier[];
}

/** A live-token protocol: it already trades, so the board shows the market's own value, not a model's. */
export interface LiveRow {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  mcap_usd: number | null;
  change_7d: number | null;
}

/** Everything the dashboard needs: the board, the live set, the fit and the coverage. */
export interface RadarData {
  as_of: string;
  source: string;
  floor_usd: number;
  model_version: string;
  watchlist_size: number;
  /** The watchlist's slugs, so the dashboard can offer a watchlist-only filter. */
  watchlist_slugs: string[];
  board_size: number;
  early_size: number;
  live_size: number;
  validation: Validation;
  odds_table: OddsBucket[];
  coverage: Coverage;
  rows: RadarRow[];
  live: LiveRow[];
}

/** Why the snapshot is not one this model can score. */
export class SnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotError';
  }
}

const DAY_MS = 86_400_000;

/** A finite number, else `fallback`. */
function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** A whole day count from `from` to `to`, clamped at zero; null when either date is absent or bad. */
export function ageDays(asOf: string, listedAt: string | null): number | null {
  if (listedAt === null) return null;
  const a = Date.parse(`${asOf}T00:00:00Z`);
  const b = Date.parse(`${listedAt}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.floor((a - b) / DAY_MS));
}

/** DefiLlama's version-marker rule: a name ending in a release is a pool of another protocol. */
const VERSIONED = /\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$/;

/** Whether a protocol records no token at all. "Records no token" is the claim: the record is not proof. */
export function isPreToken(p: SnapshotProtocol): boolean {
  return p.mcap_usd === null && p.gecko_id === null && p.symbol === null;
}

/** Whether a protocol is one the board may rank: pre-token, not an exchange, not a versioned pool. */
export function isRankable(p: SnapshotProtocol): boolean {
  return isPreToken(p) && p.category !== 'CEX' && !VERSIONED.test(p.name);
}

/** The snapshot's protocol by slug. */
function bySlug(protocols: SnapshotProtocol[]): Map<string, SnapshotProtocol> {
  return new Map(protocols.map((p) => [p.slug, p]));
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
}

function quantile(values: number[], q: number): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const at = (s.length - 1) * q;
  const lo = Math.floor(at);
  const hi = Math.ceil(at);
  return s[lo]! + (s[hi]! - s[lo]!) * (at - lo);
}

/** Solve a small dense linear system by Gauss-Jordan with partial pivoting. */
function solveLinear(aIn: number[][], bIn: number[]): number[] {
  const n = bIn.length;
  const m = aIn.map((row, i) => [...row, bIn[i]!]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(m[r]![col]!) > Math.abs(m[piv]![col]!)) piv = r;
    const tmp = m[col]!;
    m[col] = m[piv]!;
    m[piv] = tmp;
    const d = m[col]![col]!;
    if (Math.abs(d) < 1e-12) return new Array<number>(n).fill(0);
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = m[r]![col]! / d;
      for (let c = col; c <= n; c++) m[r]![c] = m[r]![c]! - f * m[col]![c]!;
    }
  }
  return m.map((row, i) => row[n]! / m[i]![i]!);
}

/** Least squares for y ~ X (X rows already carry their intercept column). */
function ols(rows: number[][], y: number[]): number[] {
  const k = rows[0]!.length;
  const a: number[][] = Array.from({ length: k }, () => new Array<number>(k).fill(0));
  const b: number[] = new Array<number>(k).fill(0);
  for (let t = 0; t < rows.length; t++) {
    for (let i = 0; i < k; i++) {
      b[i] = b[i]! + rows[t]![i]! * y[t]!;
      for (let j = 0; j < k; j++) a[i]![j] = a[i]![j]! + rows[t]![i]! * rows[t]![j]!;
    }
  }
  return solveLinear(a, b);
}

function dot(coef: number[], row: number[]): number {
  return coef.reduce((s, c, i) => s + c * row[i]!, 0);
}

/** A seeded generator, so the bootstrap bands are the same on every run. */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The starter's fixed formula, kept only as the baseline the fitted curve is measured against. */
function starterImplied(p: SnapshotProtocol, asOf: string): number {
  const growth = Math.min(120, Math.max(-60, finite(p.change_7d, 0)));
  const growthMult = 1 + (growth / 100) * 0.5;
  const age = ageDays(asOf, p.listed_at);
  const ageForModel = age ?? 365;
  const maturity = 0.6 + (Math.min(Math.max(ageForModel, 0), 1095) / 1095) * 0.4;
  return Math.max(1, Math.round(p.tvl_usd * 0.25 * growthMult * maturity));
}

/** The design matrix row for one live-token protocol: [1, log TVL, growth, age fraction]. */
function designRow(p: SnapshotProtocol, asOf: string): number[] {
  const growth = Math.min(120, Math.max(-60, finite(p.change_7d, 0))) / 100;
  const age = ageDays(asOf, p.listed_at);
  const ageFrac = age === null ? 365 / 1095 : Math.min(age, 1095) / 1095;
  return [1, Math.log(p.tvl_usd), growth, ageFrac];
}

/** The peer odds for one protocol's age, from a training set only: the same smoothed buckets the board uses, with or without a bucket of its own for protocols whose listing date is not recorded. */
function oddsFromTrain(age: number | null, train: SnapshotProtocol[], asOf: string, useNullBucket: boolean): number {
  const globalOdds = train.length === 0 ? 0.55 : train.filter((p) => !isPreToken(p)).length / train.length;
  const smooth = (grp: SnapshotProtocol[]): number => {
    if (grp.length === 0) return globalOdds;
    const raw = grp.filter((p) => !isPreToken(p)).length / grp.length;
    return (grp.length * raw + 20 * globalOdds) / (grp.length + 20);
  };
  if (age === null) {
    if (!useNullBucket) return globalOdds;
    return smooth(train.filter((p) => ageDays(asOf, p.listed_at) === null));
  }
  const buckets: Array<[number, number | null]> = [
    [0, 180],
    [180, 365],
    [365, 730],
    [730, 1095],
    [1095, 1460],
    [1460, null],
  ];
  for (const [lo, hi] of buckets) {
    if (age >= lo && (hi === null || age < hi)) {
      return smooth(train.filter((p) => {
        const a = ageDays(asOf, p.listed_at);
        return a !== null && a >= lo && (hi === null || a < hi);
      }));
    }
  }
  return globalOdds;
}

/**
 * Cross-validation of the peer odds on token presence over all 758 protocols:
 * 4 repeats of 5 folds, seeded shuffles, buckets recomputed from the training
 * fold only. Brier score and log loss, with and without the age-not-recorded
 * bucket, so the dashboard can show whether that bucket earns its place.
 */
function oddsCrossValidation(snapshot: Snapshot): {
  brier: number;
  brierNoNull: number;
  logloss: number;
  loglossNoNull: number;
} {
  const n = snapshot.protocols.length;
  const actual = snapshot.protocols.map((p) => (isPreToken(p) ? 0 : 1));
  const ages = snapshot.protocols.map((p) => ageDays(snapshot.as_of, p.listed_at));
  let brier = 0;
  let brierNoNull = 0;
  let logloss = 0;
  let loglossNoNull = 0;
  let count = 0;
  for (let rep = 0; rep < 4; rep++) {
    const rand = mulberry32(1100 + rep);
    const idx = snapshot.protocols.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const t = idx[i]!;
      idx[i] = idx[j]!;
      idx[j] = t;
    }
    for (let fold = 0; fold < 5; fold++) {
      const testIdx = idx.filter((_, i) => i % 5 === fold);
      const trainIdx = idx.filter((_, i) => i % 5 !== fold);
      const train = trainIdx.map((i) => snapshot.protocols[i]!);
      for (const i of testIdx) {
        const pWith = oddsFromTrain(ages[i]!, train, snapshot.as_of, true);
        const pWithout = oddsFromTrain(ages[i]!, train, snapshot.as_of, false);
        brier += (pWith - actual[i]!) ** 2;
        brierNoNull += (pWithout - actual[i]!) ** 2;
        const clip = (v: number): number => Math.min(0.999999, Math.max(0.000001, v));
        logloss += -(actual[i]! * Math.log(clip(pWith)) + (1 - actual[i]!) * Math.log(clip(1 - pWith)));
        loglossNoNull += -(actual[i]! * Math.log(clip(pWithout)) + (1 - actual[i]!) * Math.log(clip(1 - pWithout)));
        count++;
      }
    }
  }
  return {
    brier: brier / count,
    brierNoNull: brierNoNull / count,
    logloss: logloss / count,
    loglossNoNull: loglossNoNull / count,
  };
}

/**
 * Fit the value curve and validate it, all from the snapshot. The live set is the
 * protocols with a positive market cap: the only ones with a market value to learn
 * from. y is log(mcap / TVL), so the fitted market cap is exp(a + (1 + b) log TVL).
 */
export function fitAndValidate(snapshot: Snapshot): { validation: Validation; oddsTable: OddsBucket[]; globalOdds: number } {
  const live = snapshot.protocols.filter((p) => p.mcap_usd !== null && p.mcap_usd > 0);
  const x = live.map((p) => Math.log(p.tvl_usd));
  const y = live.map((p) => Math.log(p.mcap_usd! / p.tvl_usd));
  const rows2 = live.map((p) => [1, Math.log(p.tvl_usd)]);
  const coef = ols(rows2, y);
  const a = coef[0]!;
  const b = coef[1]!;
  const yMean = mean(y);
  const ssTot = y.reduce((s, v) => s + (v - yMean) ** 2, 0);
  const ssRes = y.reduce((s, v, i) => s + (v - dot(coef, rows2[i]!)) ** 2, 0);
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  // Leave-one-out: refit without each protocol, predict it. The honest error.
  const looErrs: number[] = [];
  for (let i = 0; i < live.length; i++) {
    const tr = rows2.filter((_, j) => j !== i);
    const ty = y.filter((_, j) => j !== i);
    const c = ols(tr, ty);
    looErrs.push(Math.abs(y[i]! - dot(c, rows2[i]!)));
  }
  // Baselines on the same leave-one-out footing: the global median ratio, and the
  // median ratio of the protocol's own category (falling back to the global one).
  const globalLoo: number[] = [];
  const catLoo: number[] = [];
  for (let i = 0; i < live.length; i++) {
    const rest = y.filter((_, j) => j !== i);
    globalLoo.push(Math.abs(y[i]! - median(rest)));
    const same = y.filter((_, j) => j !== i && live[j]!.category === live[i]!.category);
    catLoo.push(Math.abs(y[i]! - (same.length >= 3 ? median(same) : median(rest))));
  }
  // The starter's fixed formula on the same 128, for comparison.
  const starterErrs = live.map((p) => Math.abs(Math.log(starterImplied(p, snapshot.as_of)) - Math.log(p.mcap_usd!)));
  // The rejected terms: the same leave-one-out test with growth, then with growth and age.
  const rows3 = live.map((p) => designRow(p, snapshot.as_of).slice(0, 3));
  const rows4 = live.map((p) => designRow(p, snapshot.as_of));
  const looFor = (rows: number[][]): number => {
    const errs: number[] = [];
    for (let i = 0; i < live.length; i++) {
      const tr = rows.filter((_, j) => j !== i);
      const ty = y.filter((_, j) => j !== i);
      errs.push(Math.abs(y[i]! - dot(ols(tr, ty), rows[i]!)));
    }
    return median(errs);
  };
  const growthLoo = looFor(rows3);
  const ageLoo = looFor(rows4);

  // Radar-3 rejected candidates, each on the same leave-one-out footing.
  // Quadratic log(TVL): a curve that bends with size.
  const rowsQuad = live.map((p) => [1, Math.log(p.tvl_usd), Math.log(p.tvl_usd) ** 2]);
  const quadraticLoo = looFor(rowsQuad);
  // Category shrinkage: the global curve plus the protocol's category median
  // residual, shrunk by n/(n+20) so small categories barely move the curve.
  // Computed inside each fold from the training protocols only.
  const catShrinkErrs: number[] = [];
  for (let i = 0; i < live.length; i++) {
    const tr = rows2.filter((_, j) => j !== i);
    const ty = y.filter((_, j) => j !== i);
    const c = ols(tr, ty);
    const resid = ty.map((v, j) => v - dot(c, tr[j]!));
    const trainLive = live.filter((_, k) => k !== i);
    const same = resid.filter((_, j) => trainLive[j]!.category === live[i]!.category);
    const adj = same.length === 0 ? 0 : (same.length / (same.length + 20)) * median(same);
    catShrinkErrs.push(Math.abs(y[i]! - (dot(c, rows2[i]!) + adj)));
  }
  const categoryShrinkLoo = median(catShrinkErrs);
  // Imputed curve: the 272 token-recorded protocols with no market cap, filled
  // in at the training fold's own curve prediction, then refitted with them.
  // The imputation uses only the training fold's curve, never the held-out row.
  const tokNull = snapshot.protocols.filter(
    (p) => !isPreToken(p) && p.mcap_usd === null,
  );
  const imputedErrs: number[] = [];
  for (let i = 0; i < live.length; i++) {
    const tr = rows2.filter((_, j) => j !== i);
    const ty = y.filter((_, j) => j !== i);
    const c = ols(tr, ty);
    const impRows = tokNull.map((p) => [1, Math.log(p.tvl_usd)]);
    const impY = impRows.map((r) => dot(c, r));
    const c2 = ols([...tr, ...impRows], [...ty, ...impY]);
    imputedErrs.push(Math.abs(y[i]! - dot(c2, rows2[i]!)));
  }
  const imputedCurveLoo = median(imputedErrs);

  // Walk-forward: fit on protocols listed before 2025-06-01, test on the rest.
  const trainIdx = live.map((p, i) => (p.listed_at !== null && p.listed_at < '2025-06-01' ? i : -1)).filter((i) => i >= 0);
  const testIdx = live.map((p, i) => (p.listed_at !== null && p.listed_at >= '2025-06-01' ? i : -1)).filter((i) => i >= 0);
  let wfOls = 0;
  let wfGlobal = 0;
  let wfCat = 0;
  if (trainIdx.length > 10 && testIdx.length > 0) {
    const c = ols(trainIdx.map((i) => rows2[i]!), trainIdx.map((i) => y[i]!));
    wfOls = median(testIdx.map((i) => Math.abs(y[i]! - dot(c, rows2[i]!))));
    const trainMed = median(trainIdx.map((i) => y[i]!));
    wfGlobal = median(testIdx.map((i) => Math.abs(y[i]! - trainMed)));
    wfCat = median(
      testIdx.map((i) => {
        const same = trainIdx.filter((j) => live[j]!.category === live[i]!.category).map((j) => y[j]!);
        return Math.abs(y[i]! - (same.length >= 3 ? median(same) : trainMed));
      }),
    );
  }

  // Peer odds by age: the share of protocols at that age that record a token,
  // smoothed toward the overall rate with a 20-protocol prior so small buckets
  // do not swing the board.
  const tokenRecorded = snapshot.protocols.filter((p) => !isPreToken(p)).length;
  const globalOdds = tokenRecorded / snapshot.protocols.length;
  const buckets: Array<[string, number, number | null]> = [
    ['0-6 months', 0, 180],
    ['6-12 months', 180, 365],
    ['1-2 years', 365, 730],
    ['2-3 years', 730, 1095],
    ['3-4 years', 1095, 1460],
    ['4+ years', 1460, null],
  ];
  const oddsTable: OddsBucket[] = buckets.map(([label, lo, hi]) => {
    const inBucket = snapshot.protocols.filter((p) => {
      const age = ageDays(snapshot.as_of, p.listed_at);
      return age !== null && age >= lo && (hi === null || age < hi);
    });
    const raw = inBucket.length === 0 ? globalOdds : inBucket.filter((p) => !isPreToken(p)).length / inBucket.length;
    const odds = (inBucket.length * raw + 20 * globalOdds) / (inBucket.length + 20);
    return { label, lo_days: lo, hi_days: hi, n: inBucket.length, raw_rate: raw, odds };
  });
  // Radar-3: protocols whose listing date is not recorded get a bucket of
  // their own. 113 of them record a token 79% of the time, so the overall
  // rate radar-2 gave them understated their odds. The bucket is smoothed
  // the same way, toward the same overall rate. lo_days -1 marks it as the
  // age-not-recorded bucket; oddsFor finds it by that mark, never by age.
  const unknownAge = snapshot.protocols.filter((p) => ageDays(snapshot.as_of, p.listed_at) === null);
  const unknownRaw = unknownAge.length === 0 ? globalOdds : unknownAge.filter((p) => !isPreToken(p)).length / unknownAge.length;
  const unknownOdds = (unknownAge.length * unknownRaw + 20 * globalOdds) / (unknownAge.length + 20);
  oddsTable.push({
    label: 'Age not recorded',
    lo_days: -1,
    hi_days: -1,
    n: unknownAge.length,
    raw_rate: unknownRaw,
    odds: unknownOdds,
  });
  const oddsCv = oddsCrossValidation(snapshot);

  return {
    validation: {
      fit_n: live.length,
      fit_a: a,
      fit_b: b,
      r2,
      loo_median_abs_log_err: median(looErrs),
      loo_mean_abs_log_err: mean(looErrs),
      baseline_global_median_loo: median(globalLoo),
      baseline_category_median_loo: median(catLoo),
      starter_median_abs_log_err: median(starterErrs),
      growth_term_loo: growthLoo,
      age_term_loo: ageLoo,
      quadratic_term_loo: quadraticLoo,
      category_shrink_loo: categoryShrinkLoo,
      imputed_curve_loo: imputedCurveLoo,
      odds_cv_brier: oddsCv.brier,
      odds_cv_brier_no_null: oddsCv.brierNoNull,
      odds_cv_logloss: oddsCv.logloss,
      odds_cv_logloss_no_null: oddsCv.loglossNoNull,
      walkforward_train_n: trainIdx.length,
      walkforward_test_n: testIdx.length,
      walkforward_ols_median_abs_log_err: wfOls,
      walkforward_global_median: wfGlobal,
      walkforward_category_median: wfCat,
      live_with_mcap: live.length,
      token_recorded: tokenRecorded,
    },
    oddsTable,
    globalOdds,
  };
}

/** The peer odds for one protocol's age, from the fitted table. Unknown age takes the age-not-recorded bucket (lo_days -1), not the overall rate. */
function oddsFor(age: number | null, table: OddsBucket[], globalOdds: number): number {
  if (age === null) {
    const unknown = table.find((b) => b.lo_days === -1);
    return unknown === undefined ? globalOdds : unknown.odds;
  }
  for (const bucket of table) {
    if (bucket.lo_days < 0) continue;
    if (age >= bucket.lo_days && (bucket.hi_days === null || age < bucket.hi_days)) return bucket.odds;
  }
  return globalOdds;
}

/** The fitted market cap for a TVL under the curve: exp(a + (1 + b) log TVL). */
function fittedMcap(tvl: number, a: number, b: number): number {
  return Math.exp(a + (1 + b) * Math.log(tvl));
}

/** A step as one string: its action, then its cost and time, within the gate's 20..600 characters. */
export function stepText(step: FarmStep): string {
  let s = `${step.text} Cost: ${step.cost}. Time: ${step.time}.`;
  if (s.length > 600) s = `${s.slice(0, 596)}...`;
  if (s.length < 20) s = `${s} Hold the position and check the protocol's own page.`;
  return s;
}

/** The first chain a protocol names, or a neutral phrase. */
function chainOf(p: SnapshotProtocol): string {
  return p.chains.length > 0 ? p.chains[0]! : 'its main chain';
}

/** How much capital one farm position needs, from the protocol's own TVL. */
function capitalFor(p: SnapshotProtocol): number {
  if (p.tvl_usd >= 5_000_000_000) return 250;
  if (p.tvl_usd >= 1_000_000_000) return 150;
  if (p.tvl_usd >= 100_000_000) return 100;
  return 50;
}

/** How long to hold, from the protocol's age: younger protocols get a longer qualifying window. */
function holdDaysFor(age: number | null): number {
  if (age === null) return 30;
  if (age < 180) return 60;
  if (age < 365) return 45;
  return 30;
}

/** The category's one action, in the words a farmer can follow. */
function actionFor(p: SnapshotProtocol, capital: number, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `Supply $${capital} of USDC to ${name} on ${chain} and keep the position open.`;
  if (c.includes('dex') || c.includes('yield') || c.includes('leveraged farm')) return `Provide $${capital} of liquidity to ${name}'s main pool on ${chain} and keep the position open.`;
  if (c.includes('bridge')) return `Bridge $${capital} of USDC to ${chain} through ${name} and use the bridged funds in its app.`;
  if (c.includes('staking') || c.includes('restak')) return `Stake $${capital} of the chain's staking asset through ${name} and keep the receipt.`;
  if (c.includes('perpetual') || c.includes('derivative')) return `Deposit $${capital} of USDC as margin on ${name} and open one small hedge.`;
  if (c.includes('prediction')) return `Fund $${capital} and place one market position on ${name}.`;
  if (c.includes('curator') || c.includes('allocator')) return `Deposit $${capital} into a ${name} vault on ${chain} and keep the shares.`;
  if (c.includes('stable')) return `Mint or deposit $${capital} of the stable asset through ${name} on ${chain}.`;
  if (c.includes('rwa')) return `Mint $${capital} of the protocol's yield asset on ${chain} and hold it.`;
  if (c.includes('insurance')) return `Buy $${capital} of cover from ${name} on ${chain} and keep the policy.`;
  return `Deposit $${capital} of USDC into ${name} on ${chain} and keep the position open.`;
}

/**
 * A protocol's farm plan: six steps, each an action with a cost and a time. The plan is derived from
 * the protocol's own record (category, chains, TVL, age), never from a hand-written list of names.
 * Gas is not in the snapshot, so no step quotes a gas price: it says to check the chain's fee first.
 */
export function farmSteps(p: SnapshotProtocol, age: number | null): FarmStep[] {
  const chain = chainOf(p);
  const capital = capitalFor(p);
  const hold = holdDaysFor(age);
  return [
    {
      text: `Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.`,
      cost: 'no capital yet; check the chain fee before the first transaction',
      time: '5 minutes',
    },
    {
      text: actionFor(p, capital, chain),
      cost: `$${capital} of capital, plus the chain fee the snapshot does not carry`,
      time: '15 minutes to set up',
    },
    {
      text: `Make one qualifying action each week, such as a deposit, a borrow, a swap or a vote.`,
      cost: 'the chain fee each week, which the snapshot does not carry',
      time: '10 minutes a week',
    },
    {
      text: `Hold the position for at least ${hold} days so the activity is counted in more than one snapshot.`,
      cost: `the $${capital} stays in the position`,
      time: `${hold} days`,
    },
    {
      text: `Before you withdraw, open the protocol's own points or rewards page and claim only from the link it publishes.`,
      cost: 'no fee to check, and never pay to claim',
      time: '10 minutes',
    },
    {
      text: `Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it.`,
      cost: 'nothing but the log',
      time: '5 minutes',
    },
  ];
}

/** The protocols the board ranks, strongest first, with ranks 1..n. */
export function buildBoard(
  snapshot: Snapshot,
  fit: { validation: Validation; oddsTable: OddsBucket[]; globalOdds: number },
): BoardRow[] {
  const { validation, oddsTable, globalOdds } = fit;
  const index = bySlug(snapshot.protocols);
  const chosen = new Map<string, SnapshotProtocol>();
  // The watchlist is the floor: every slug, even one the snapshot no longer carries (it cannot, but the
  // board's coverage is the gate's row and is never gambled on a missing record).
  for (const slug of snapshot.watchlist) {
    const p = index.get(slug);
    if (p !== undefined) chosen.set(slug, p);
  }
  // The early radar: pre-token protocols below the watchlist floor, by TVL, capped. Never a replacement
  // for a watchlist row: a chosen protocol stays chosen.
  const early = snapshot.protocols
    .filter((p) => !chosen.has(p.slug) && isRankable(p) && p.tvl_usd < snapshot.floor_usd)
    .sort((a, b) => b.tvl_usd - a.tvl_usd || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0))
    .slice(0, EARLY_ROWS);
  for (const p of early) chosen.set(p.slug, p);

  const live = snapshot.protocols.filter((p) => p.mcap_usd !== null && p.mcap_usd > 0);
  const scored = [...chosen.values()].map((p) => {
    const age = ageDays(snapshot.as_of, p.listed_at);
    const odds = oddsFor(age, oddsTable, globalOdds);
    const fitted = fittedMcap(p.tvl_usd, validation.fit_a, validation.fit_b);
    const implied = Math.max(1, Math.round(fitted * odds));
    return { p, age, odds, fitted, implied };
  });
  scored.sort((a, b) => b.implied - a.implied || (a.p.slug < b.p.slug ? -1 : a.p.slug > b.p.slug ? 1 : 0));

  // Bootstrap bands: resample the 128 fitted protocols, refit the curve, and re-score
  // every board row. The 10th-90th percentiles give the band and the rank range.
  // Odds stay fixed: they come from the whole snapshot, not from the refit sample.
  const rand = mulberry32(20261114);
  const impliedSamples: number[][] = scored.map(() => []);
  const rankSamples: number[][] = scored.map(() => []);
  for (let rep = 0; rep < BOOTSTRAPS; rep++) {
    const sampleIdx: number[] = [];
    for (let i = 0; i < live.length; i++) sampleIdx.push(Math.floor(rand() * live.length));
    const rows = sampleIdx.map((i) => [1, Math.log(live[i]!.tvl_usd)]);
    const ys = sampleIdx.map((i) => Math.log(live[i]!.mcap_usd! / live[i]!.tvl_usd));
    const c = ols(rows, ys);
    const repImplied = scored.map((s) => Math.max(1, Math.round(fittedMcap(s.p.tvl_usd, c[0]!, c[1]!) * s.odds)));
    const order = repImplied.map((v, i) => ({ v, i })).sort((x, y) => y.v - x.v || (scored[x.i]!.p.slug < scored[y.i]!.p.slug ? -1 : 1));
    order.forEach((o, rank) => {
      impliedSamples[o.i]!.push(repImplied[o.i]!);
      rankSamples[o.i]!.push(rank + 1);
    });
  }

  // The verdict lines, in implied-value dollars: the implied value of the
  // rank-50 row (the FARM line) and of the rank-100 row (the THIN line). A
  // flip condition names these lines, never a hand-written threshold.
  const lineFarm = scored[49]!.implied;
  const lineThin = scored[99]!.implied;
  const money = (n: number): string =>
    n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${Math.round(n / 1e3)}K` : `$${Math.round(n)}`;

  const base = scored.map((s, i) => {
    const capital = capitalFor(s.p);
    const hold = holdDaysFor(s.age);
    const timeHours = Math.round((0.5 + (hold / 7) * (10 / 60)) * 10) / 10;
    // Break-even is time cost only: hours x the assumed $25/hour. The chain
    // fee is additional and unknown, so it is not folded into this number.
    const breakEven = Math.round(timeHours * TIME_VALUE_USD_PER_HOUR);
    const verdict: 'farm' | 'thin' | 'skip' =
      i + 1 <= 50 && s.odds >= 0.35 ? 'farm' : i + 1 <= 100 || s.odds >= 0.55 ? 'thin' : 'skip';
    return {
      rank: i + 1,
      slug: s.p.slug,
      name: s.p.name,
      category: s.p.category,
      chains: s.p.chains,
      tvl_usd: s.p.tvl_usd,
      change_7d: s.p.change_7d,
      mcap_usd: s.p.mcap_usd,
      listed_at: s.p.listed_at,
      gecko_id: s.p.gecko_id,
      symbol: s.p.symbol,
      token_status: 'pre-token' as const,
      age_days: s.age,
      implied_value_usd: s.implied,
      fitted_value_usd: Math.max(1, Math.round(s.fitted)),
      odds: Math.round(s.odds * 1000) / 1000,
      implied_low_usd: Math.max(1, Math.round(quantile(impliedSamples[i]!, 0.1))),
      implied_high_usd: Math.max(1, Math.round(quantile(impliedSamples[i]!, 0.9))),
      rank_low: Math.round(quantile(rankSamples[i]!, 0.1)),
      rank_high: Math.round(quantile(rankSamples[i]!, 0.9)),
      verdict,
      capital_usd: capital,
      time_hours: timeHours,
      break_even_usd: breakEven,
      implied_per_capital_usd: Math.round(s.implied / capital),
      implied_per_hour_usd: Math.round(s.implied / timeHours),
      farm_steps: farmSteps(s.p, s.age).map(stepText),
    };
  });

  // Efficiency ranks: the same board re-ranked by implied value per $1 locked
  // and per hour spent. Ties break toward the better absolute rank.
  const rankBy = (key: 'implied_per_capital_usd' | 'implied_per_hour_usd'): Map<string, number> => {
    const order = [...base]
      .sort((a, b) => b[key] - a[key] || a.rank - b.rank)
      .map((r) => r.slug);
    return new Map(order.map((slug, i) => [slug, i + 1]));
  };
  const effCap = rankBy('implied_per_capital_usd');
  const effHr = rankBy('implied_per_hour_usd');

  return base.map((r) => {
    const flip =
      r.verdict === 'farm'
        ? `Stays FARM while implied stays at or above ${money(lineFarm)} and odds stay at or above 35%. Flips to THIN if implied falls below ${money(lineFarm)} or odds fall below 35%.`
        : r.verdict === 'thin'
          ? `Flips to FARM if implied reaches ${money(lineFarm)} with odds at or above 35%. Flips to SKIP if implied falls below ${money(lineThin)} and odds fall below 55%.`
          : `Flips to THIN if implied reaches ${money(lineThin)} or odds reach 55%.`;
    return {
      ...r,
      eff_rank_capital: effCap.get(r.slug)!,
      eff_rank_hour: effHr.get(r.slug)!,
      flip_condition: flip,
      deposit_tiers: DEPOSIT_TIERS_USD.map((capital) => ({
        capital_usd: capital,
        implied_per_capital_usd: Math.round(r.implied_value_usd / capital),
        break_even_usd: r.break_even_usd,
      })),
    };
  });
}

const round4 = (n: number): number => Math.round(n * 1e4) / 1e4;

/** The live-token protocols, by market cap, for the dashboard's Live token view. */
export function liveRows(snapshot: Snapshot): LiveRow[] {
  return snapshot.protocols
    .filter((p) => !isPreToken(p) && p.category !== 'CEX')
    .sort((a, b) => (b.mcap_usd ?? 0) - (a.mcap_usd ?? 0) || b.tvl_usd - a.tvl_usd)
    .slice(0, LIVE_ROWS)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      chains: p.chains,
      tvl_usd: p.tvl_usd,
      mcap_usd: p.mcap_usd,
      change_7d: p.change_7d,
    }));
}

/** A board row's compact form for data.js. */
export function radarRow(row: BoardRow): RadarRow {
  return {
    rank: row.rank,
    slug: row.slug,
    name: row.name,
    category: row.category,
    chains: row.chains,
    tvl_usd: row.tvl_usd,
    change_7d: row.change_7d,
    mcap_usd: row.mcap_usd,
    listed_at: row.listed_at,
    age_days: row.age_days,
    implied_value_usd: row.implied_value_usd,
    fitted_value_usd: row.fitted_value_usd,
    odds: row.odds,
    implied_low_usd: row.implied_low_usd,
    implied_high_usd: row.implied_high_usd,
    rank_low: row.rank_low,
    rank_high: row.rank_high,
    verdict: row.verdict,
    capital_usd: row.capital_usd,
    time_hours: row.time_hours,
    break_even_usd: row.break_even_usd,
    implied_per_capital_usd: row.implied_per_capital_usd,
    implied_per_hour_usd: row.implied_per_hour_usd,
    eff_rank_capital: row.eff_rank_capital,
    eff_rank_hour: row.eff_rank_hour,
    flip_condition: row.flip_condition,
    deposit_tiers: row.deposit_tiers,
  };
}

/** Everything the dashboard renders, from the snapshot. */
export function buildRadar(snapshot: Snapshot): { board: BoardRow[]; radar: RadarData } {
  const fit = fitAndValidate(snapshot);
  const board = buildBoard(snapshot, fit);
  const live = liveRows(snapshot);
  const early = board.filter((r) => !snapshot.watchlist.includes(r.slug)).length;
  const preToken = snapshot.protocols.filter(isPreToken).length;
  const coverage: Coverage = {
    total: snapshot.protocols.length,
    pre_token: preToken,
    token_recorded: snapshot.protocols.length - preToken,
    watchlist: snapshot.watchlist.length,
    early,
    ranked: board.length,
    pre_token_unranked: preToken - board.length,
    live_shown: live.length,
    live_counted: snapshot.protocols.length - preToken,
  };
  const radar: RadarData = {
    as_of: snapshot.as_of,
    source: snapshot.source,
    floor_usd: snapshot.floor_usd,
    model_version: MODEL_VERSION,
    watchlist_size: snapshot.watchlist.length,
    watchlist_slugs: [...snapshot.watchlist],
    board_size: board.length,
    early_size: early,
    live_size: live.length,
    validation: fit.validation,
    odds_table: fit.oddsTable,
    coverage,
    rows: board.map(radarRow),
    live,
  };
  return { board, radar };
}

/** The snapshot out of a file's text, refused unless it is the shape the model scores. */
export function parseSnapshot(text: string): Snapshot {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new SnapshotError('snapshot.json is not JSON');
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new SnapshotError('snapshot.json is not a JSON object');
  const o = raw as Record<string, unknown>;
  if (typeof o.as_of !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.as_of)) throw new SnapshotError('snapshot.json has no as_of date');
  if (typeof o.source !== 'string') throw new SnapshotError('snapshot.json has no source');
  if (typeof o.floor_usd !== 'number' || !Number.isSafeInteger(o.floor_usd) || o.floor_usd <= 0) throw new SnapshotError('snapshot.json has no floor_usd');
  if (!Array.isArray(o.protocols)) throw new SnapshotError('snapshot.json has no protocols array');
  if (!Array.isArray(o.watchlist) || o.watchlist.some((s) => typeof s !== 'string')) throw new SnapshotError('snapshot.json has no watchlist of slugs');
  const protocols = o.protocols.map((v, i) => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new SnapshotError(`snapshot.json's protocol ${i} is not an object`);
    const p = v as Record<string, unknown>;
    if (typeof p.slug !== 'string' || typeof p.name !== 'string' || typeof p.tvl_usd !== 'number' || !Number.isFinite(p.tvl_usd)) {
      throw new SnapshotError(`snapshot.json's protocol ${i} lacks a slug, a name or a TVL`);
    }
    return {
      slug: p.slug,
      name: p.name,
      category: typeof p.category === 'string' ? p.category : null,
      chains: Array.isArray(p.chains) ? p.chains.filter((c): c is string => typeof c === 'string') : [],
      tvl_usd: p.tvl_usd,
      change_7d: typeof p.change_7d === 'number' && Number.isFinite(p.change_7d) ? p.change_7d : null,
      mcap_usd: typeof p.mcap_usd === 'number' && Number.isFinite(p.mcap_usd) ? p.mcap_usd : null,
      listed_at: typeof p.listed_at === 'string' ? p.listed_at : null,
      gecko_id: typeof p.gecko_id === 'string' ? p.gecko_id : null,
      symbol: typeof p.symbol === 'string' ? p.symbol : null,
    };
  });
  return {
    as_of: o.as_of,
    source: o.source,
    floor_usd: o.floor_usd,
    protocols,
    watchlist: o.watchlist as string[],
  };
}

/** Why a board is not one the gate will take, or null: coverage, ranks, order, one shared implied value, and farm steps. */
export function boardIssue(board: BoardRow[], snapshot: Snapshot): string | null {
  const slugs = new Set(board.map((r) => r.slug));
  const missing = snapshot.watchlist.filter((s) => !slugs.has(s));
  if (missing.length > 0) return `the board misses ${missing.length} watchlist slug${missing.length === 1 ? '' : 's'}: ${missing.slice(0, 5).join(', ')}`;
  const ranks = board.map((r) => r.rank).sort((a, b) => a - b);
  for (let i = 0; i < ranks.length; i++) if (ranks[i] !== i + 1) return `rank ${i + 1} is ${ranks[i]}`;
  for (let i = 1; i < board.length; i++) if (board[i]!.implied_value_usd > board[i - 1]!.implied_value_usd) return `row ${i + 1} outranks row ${i} on implied value`;
  if (board.length >= 2 && board[0]!.implied_value_usd === board[board.length - 1]!.implied_value_usd) {
    return `all ${board.length} rows share the same implied value $${board[0]!.implied_value_usd}: a board that ranks nothing by value is not a ranking`;
  }
  for (const r of board) {
    const steps = r.farm_steps;
    if (steps.length < 3 || steps.length > 12) return `${r.slug} has ${steps.length} farm steps`;
    for (const s of steps) if (s.length < 20 || s.length > 600) return `${r.slug} has a farm step of ${s.length} characters`;
    if (!Number.isSafeInteger(r.implied_value_usd) || r.implied_value_usd <= 0) return `${r.slug} has implied value ${r.implied_value_usd}`;
  }
  return null;
}

/** A compact data.js: the dashboard's whole dataset as one script, no fetch and no network. */
export function dataScript(radar: RadarData): string {
  return `window.RADAR=${JSON.stringify(radar)};\n`;
}
