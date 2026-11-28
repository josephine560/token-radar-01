// Token Radar, model radar-8: the implied value is fitted from the snapshot itself.
// Radar-8 adopts the two-segment value curve radar-7 declined — but blended,
// not as a cliff. The split is at median log TVL ($32.6M): below it the
// curve is nearly flat (y = 1.714 - 0.154·log TVL), above it steep
// (y = 7.434 - 0.502·log TVL). Unblended, the fit jumps 26% at the split:
// two protocols either side of the line (Plasma One $31.9M, Aegis YUSD
// $34.5M) would differ 29% on the fit alone. Radar-8 blends the two
// segments linearly over ±0.5 log TVL ($19.8M-$53.7M), so the curve bends
// through the range instead of jumping at a line — the same two protocols
// price 2.8% apart. The blend keeps the gains that made the split the
// first variant ever to pass both tests (LOO 1.212 vs kept 1.223,
// walk-forward 1.335 vs 1.433, wins 54/128; unblended 1.208 / 1.335,
// wins 51/128) and the repeated 5-fold median too (1.249 vs kept 1.270).
// The mean error is still worse than the single curve's (1.622 vs 1.596),
// and it wins on fewer than half the protocols — a median win, disclosed
// on the dashboard, not a sweep. Shrinkage toward the single curve and
// wider blends were tested and fail the leave-one-out test (shrink 0.75:
// 1.224; blend ±0.75 log: 1.225), and moving the split to q=0.55 passes
// (1.182 / 1.307) but is picking the split by the validation numbers, so
// it is not adopted. Radar-7's other wins stand: the dossier stays slim
// (513,416 bytes), all chains carry a researched fee figure, and the
// runtime self-check strip stays. The board rule (radar-5) still applies
// the snapshot's own watchlist exclusion (bridged, staked, wrapped and
// exchange products) without the TVL floor, so the board ranks 198
// pre-token protocols: the 40 watchlist plus 158 early ones, 20 of them
// above the floor radar-4 cut off.
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
// and an age term were already rejected in radar-2 (1.33 and 1.34). Radar-5
// re-tested the remaining principled variants offline (22 variants, same n=128,
// leave-one-out plus walk-forward plus repeated 5-fold): two-stage
// classify-then-fit 1.228, category shrinkage n/(n+50) 1.233, winsorized 1.257,
// Theil-Sen 1.255, piecewise TVL terciles 1.264, a hinge at median log TVL
// 1.267, a joint log TVL + growth + log age fit 1.287, and a log TVL x growth
// interaction 1.366 — none beats the kept curve's 1.223, so the curve stays.
// The three closest rejections are now computed at run time and shown on the
// dashboard (winsorized, Theil-Sen, category shrinkage n/(n+50)) so the
// reader can see the comparison, not take it on trust. The curve is weak in
// absolute terms (R2 0.168, median error about x3.4) and radar-5 does not
// hide that: the dashboard states it, and every row carries a band and a
// rank range from 200 bootstrap refits.
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
// THIN is the top half or odds at or above 0.55, the rest is SKIP. Radar-6
// adds a stated-scenario net beside the priority indexes, so the board can
// answer "what to farm first" in dollars without inventing a payout: the
// scenario says the airdrop pool is 7% of the implied value, the farmed
// capital is 1% of TVL, and your slice is proportional to your deposit
// within the farmed capital. Net is that slice minus all the plan's costs
// (time at $25/hour, network fees, pool fee); net at the band's low end
// uses the 10th-percentile implied value, and a row is ROBUST when even
// that low-end net is positive. Every assumption is printed on the page
// and the dashboard's what-if controls re-price every net live — change
// the deposit or the drop share and the column, the lede and the detail
// drawer all move. The scenario is a yardstick for comparing rows, not a
// forecast of what any farmer will receive: the snapshot gives no rule
// that a larger deposit earns a larger share, and no row promises dollars.
// Each row also carries implied value per $1 of capital locked and per hour
// spent (a priority index, not a return — the implied value is the whole
// protocol's token value, not a per-farmer share), an efficiency rank beside
// its absolute rank, the three deposit tiers ($50 / $100 / $250) with what
// each costs to lock and what each nets, and a "what would flip this
// verdict" line computed from the rank-50 and rank-99 implied-value lines
// (the quartile lines at the 198-row board size).
// Break-even is time cost — hours x $25/hour, an assumption the reader can
// change on the dashboard — plus the plan's network fees plus the 0.25% pool
// fee where a plan swaps. The snapshot carries no fee, so the fees come from
// research, not the snapshot: CHAIN_FEES (below) is a per-chain table of
// November-2026 DEX-swap network fees from public trackers (growthepie,
// L2Fees.info, GasNow, DataWallet, DeFiStar, OpenChainBench, Ghostdrive,
// GemWallet trackers, Monad docs), with the conservative high end used as the
// per-transaction figure and each chain marked measured or estimate. A plan is
// 3 + ceil(holdDays/7) transactions (approve, setup, one a week, claim), so
// the network fee is that count times the per-transaction figure; every row
// now has a researched fee figure, so no row is flagged fee_unknown.
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
  /** Category shrinkage with a 50-protocol prior: stronger shrinkage, still worse. */
  category_shrink_50_loo: number;
  /** Winsorized fit (y clipped to the training fold's 5th/95th percentiles). */
  winsorized_loo: number;
  /** Theil-Sen median-slope fit. */
  theil_sen_loo: number;
  imputed_curve_loo: number;
  /** Radar-6 rejections, each on the same leave-one-out footing. */
  log_age_loo: number;
  /** LAD / median regression (IRLS). */
  lad_loo: number;
  /** OLS after dropping the 5% tails of y in each fold. */
  trimmed_loo: number;
  /** TVL-quintile bin medians. */
  quintile_loo: number;
  /** Isotonic (monotone-decreasing, PAVA) fit of y on log TVL. */
  isotonic_loo: number;
  /** Radar-7 closest call: two-segment split at the training median log
   * TVL, separate OLS each side. Passes both medians, not adopted (see
   * the header comment). LOO and walk-forward medians, and the LOO mean. */
  two_segment_loo: number;
  two_segment_wf: number;
  two_segment_loo_mean: number;
  /** Radar-8 adopted curve: the same two-segment split, blended linearly
   * over BLEND_BAND_LOG log units around the split so there is no cliff.
   * Full-data fit coefficients, the split, the unblended jump (for the
   * disclosure), and the blend's own leave-one-out / walk-forward numbers,
   * all computed at run time. */
  blend_split_log_tvl: number;
  blend_band_log: number;
  blend_lo_a: number;
  blend_lo_b: number;
  blend_hi_a: number;
  blend_hi_b: number;
  blend_jump_log: number;
  blend_loo: number;
  blend_wf: number;
  blend_loo_mean: number;
  blend_wins: number;
  /** Top-20 overlap of the kept board under each ablated variant: how many
   * of the kept top 20 each simpler model keeps. Computed in buildRadar. */
  ablation_top20: Array<{ label: string; kept: number }>;
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
  /** Early rows at or above the floor the watchlist rule leaves out, and below it. */
  early_above_floor: number;
  early_below_floor: number;
  ranked: number;
  pre_token_unranked: number;
  live_shown: number;
  live_counted: number;
}

/** The model's version label: the dashboard names it. */
export const MODEL_VERSION = 'radar-8';

/** Radar-5 ranks every rankable pre-token protocol (198 of the 342 pre-token
 * ones: the 40 watchlist rows plus 20 at or above the floor the watchlist
 * rule leaves out and 138 below it). The old 160-row early cap is gone, and
 * so is radar-4's weaker rankability rule: the board no longer ranks bridged
 * or staked products as launch candidates, and no longer misses genuine
 * pre-token protocols at or above the floor. */

/** How many live-token protocols the Live token view carries, by market cap. */
export const LIVE_ROWS = 24;

/** Bootstrap refits behind each row's band and rank range. Seeded, so two runs agree. */
export const BOOTSTRAPS = 200;

/** Radar-8 blend band: the two segments are blended linearly over this many
 * log TVL units around the split (±half the band each side), so the fitted
 * curve is continuous — no cliff at the split. */
export const BLEND_BAND_LOG = 1.0;

/** A two-segment fit: separate OLS below and above the median log TVL of the
 * training rows. The split is recomputed from whatever rows are passed in,
 * so no held-out row leaks into its own split. */
export interface TwoSegmentFit {
  split: number;
  lo: number[];
  hi: number[];
}

export function twoSegmentFit(tr: number[][], ty: number[]): TwoSegmentFit {
  const xs = tr.map((r) => r[1]!).sort((a, b) => a - b);
  const split = median(xs);
  const loRows = tr.filter((r) => r[1]! <= split);
  const loY = ty.filter((_, j) => tr[j]![1]! <= split);
  const hiRows = tr.filter((r) => r[1]! > split);
  const hiY = ty.filter((_, j) => tr[j]![1]! > split);
  return { split, lo: ols(loRows, loY), hi: ols(hiRows, hiY) };
}

export function twoSegmentPred(f: TwoSegmentFit, x: number): number {
  const c = x <= f.split ? f.lo : f.hi;
  return c[0]! + c[1]! * x;
}

/** The blended prediction: the two segments, linearly ramped across the band
 * around the split. Below the band it is the lower segment, above it the
 * upper one, and through the band it is the weighted mean of the two. */
export function blendPred(f: TwoSegmentFit, x: number, band: number = BLEND_BAND_LOG): number {
  const lo = f.lo[0]! + f.lo[1]! * x;
  const hi = f.hi[0]! + f.hi[1]! * x;
  const w = Math.max(0, Math.min(1, (x - (f.split - band / 2)) / band));
  return (1 - w) * lo + w * hi;
}

/** The assumed value of a farmer's hour, in dollars. An assumption, not a snapshot figure.
 * The dashboard lets the reader change it; board.json's break-even is computed at this default. */
export const TIME_VALUE_USD_PER_HOUR = 25;

/** The three deposit sizes the dashboard shows per row, in dollars. The snapshot
 * gives no rule that a larger deposit earns a larger share, so the tiers show
 * what a larger deposit costs to lock, not a larger reward. */
export const DEPOSIT_TIERS_USD = [50, 100, 250] as const;

/**
 * What one transaction costs on a chain, in November 2026 US dollars.
 * Researched 2026-11-22 from public trackers (growthepie, L2Fees.info,
 * GasNow, DataWallet, DeFiStar, OpenChainBench, Ghostdrive's measured
 * snapshot, GemWallet trackers, Monad's own gas-pricing docs); see README
 * for the full table and sources. `swap_lo_usd`/`swap_hi_usd` are the typical
 * range for one DEX swap's network fee (pool fee excluded); `per_tx_usd` is
 * the conservative per-transaction cost the farm math uses — the high end of
 * the swap range, or the transfer figure where a chain has no swap (Bitcoin,
 * Cardano, TON). `quality` is measured where a tracker publishes a median,
 * estimate where the figure is an analogy or a single RPC snapshot. A chain
 * with no reliable public figure is absent from this table on purpose: its
 * rows say the fee is unknown rather than quoting a guess. Gas prices move
 * daily and ETH fell ~30% in November 2026 alone, so every figure is a
 * November-2026 snapshot, not a fixed price.
 */
export interface ChainFee {
  chain: string;
  swap_lo_usd: number | null;
  swap_hi_usd: number | null;
  per_tx_usd: number;
  quality: 'measured' | 'estimate';
  basis: string;
}

export const CHAIN_FEES: ChainFee[] = [
  { chain: 'Ethereum', swap_lo_usd: 0.02, swap_hi_usd: 0.25, per_tx_usd: 0.25, quality: 'measured', basis: 'GasNow/DataWallet/growthepie medians, Nov 2026 (ETH $1,600-2,245); spikes to $5.59 on busy days' },
  { chain: 'Arbitrum', swap_lo_usd: 0.007, swap_hi_usd: 0.024, per_tx_usd: 0.024, quality: 'measured', basis: 'growthepie 5-7 Nov + L2Fees 30-day median' },
  { chain: 'Binance', swap_lo_usd: 0.005, swap_hi_usd: 0.01, per_tx_usd: 0.01, quality: 'measured', basis: 'BSC 0.05 gwei floor, BNB ~$612; Chainflip/DeFiStar' },
  { chain: 'Base', swap_lo_usd: 0.002, swap_hi_usd: 0.018, per_tx_usd: 0.018, quality: 'measured', basis: 'growthepie + L2Fees 30-day median' },
  { chain: 'Solana', swap_lo_usd: 0.001, swap_hi_usd: 0.01, per_tx_usd: 0.01, quality: 'measured', basis: 'FillBench/Token Terminal/StakePoint; first token account ~0.00204 SOL rent (~$0.16), refundable' },
  { chain: 'Avalanche', swap_lo_usd: 0.009, swap_hi_usd: 0.009, per_tx_usd: 0.009, quality: 'measured', basis: '7.5 gwei, AVAX ~$7.99; DeFiStar' },
  { chain: 'Polygon', swap_lo_usd: 0.003, swap_hi_usd: 0.006, per_tx_usd: 0.006, quality: 'measured', basis: '~280 gwei, POL ~$0.083; DeFiStar' },
  { chain: 'Optimism', swap_lo_usd: 0.001, swap_hi_usd: 0.031, per_tx_usd: 0.031, quality: 'measured', basis: 'sources disagree ~30x (growthepie hourly vs L2Fees 30-day); high end used' },
  { chain: 'Bitcoin', swap_lo_usd: null, swap_hi_usd: null, per_tx_usd: 0.09, quality: 'measured', basis: 'no DEX swap on L1; per-tx uses the transfer figure (1 sat/vB, mempool.space)' },
  { chain: 'Tron', swap_lo_usd: 1, swap_hi_usd: 4, per_tx_usd: 4, quality: 'estimate', basis: 'USDT-transfer energy cost; swap indicative, same order (TronSave/Eco)' },
  { chain: 'Robinhood Chain', swap_lo_usd: 0.01, swap_hi_usd: 0.01, per_tx_usd: 0.01, quality: 'estimate', basis: 'by analogy with OP-stack L2s; no published swap figure' },
  { chain: 'Linea', swap_lo_usd: 0.028, swap_hi_usd: 0.037, per_tx_usd: 0.037, quality: 'measured', basis: 'growthepie + L2Fees' },
  { chain: 'Sonic', swap_lo_usd: 0.0002, swap_hi_usd: 0.0002, per_tx_usd: 0.0002, quality: 'estimate', basis: 'single RPC snapshot (Kripicard), indicative' },
  { chain: 'Sui', swap_lo_usd: 0.0007, swap_hi_usd: 0.0013, per_tx_usd: 0.0013, quality: 'measured', basis: 'GemWallet fee tracker' },
  { chain: 'Mantle', swap_lo_usd: 0.002, swap_hi_usd: 0.005, per_tx_usd: 0.005, quality: 'estimate', basis: 'EVM gas-ratio analogy; no published swap figure' },
  { chain: 'Scroll', swap_lo_usd: 0.001, swap_hi_usd: 0.052, per_tx_usd: 0.052, quality: 'measured', basis: 'sources disagree ~50x; high end used' },
  { chain: 'Berachain', swap_lo_usd: 0.0001, swap_hi_usd: 0.0001, per_tx_usd: 0.0001, quality: 'estimate', basis: 'single RPC snapshot + DefiLlama cross-check, indicative' },
  { chain: 'xDai', swap_lo_usd: 0.0001, swap_hi_usd: 0.001, per_tx_usd: 0.001, quality: 'measured', basis: 'Gnosis gas effectively zero; quoted as <$0.001' },
  { chain: 'Celo', swap_lo_usd: 0.002, swap_hi_usd: 0.002, per_tx_usd: 0.002, quality: 'estimate', basis: 'single RPC snapshot (Kripicard), indicative' },
  { chain: 'zkSync Era', swap_lo_usd: 0.02, swap_hi_usd: 0.048, per_tx_usd: 0.048, quality: 'measured', basis: 'growthepie + L2Fees' },
  { chain: 'Cardano', swap_lo_usd: null, swap_hi_usd: null, per_tx_usd: 0.023, quality: 'measured', basis: 'transfer figure (OpenChainBench); no swap figure found' },
  { chain: 'Unichain', swap_lo_usd: 0.0003, swap_hi_usd: 0.0005, per_tx_usd: 0.0005, quality: 'measured', basis: 'growthepie 6-7 Nov' },
  { chain: 'TON', swap_lo_usd: null, swap_hi_usd: null, per_tx_usd: 0.001, quality: 'measured', basis: 'transfer figure (Ghostdrive); no swap figure found' },
  { chain: 'Sei', swap_lo_usd: 0.001, swap_hi_usd: 0.001, per_tx_usd: 0.001, quality: 'estimate', basis: 'EVM gas-ratio analogy; no published swap figure' },
  { chain: 'Stellar', swap_lo_usd: 0.0001, swap_hi_usd: 0.0001, per_tx_usd: 0.0001, quality: 'estimate', basis: 'base-fee analogy; no measured swap figure' },
  { chain: 'Algorand', swap_lo_usd: 0.001, swap_hi_usd: 0.001, per_tx_usd: 0.001, quality: 'estimate', basis: 'minimum-fee analogy; no measured swap figure' },
  { chain: 'Aptos', swap_lo_usd: 0.0001, swap_hi_usd: 0.0005, per_tx_usd: 0.0005, quality: 'estimate', basis: 'Aptos docs order of magnitude; no measured swap figure' },
  { chain: 'Blast', swap_lo_usd: 0.025, swap_hi_usd: 0.025, per_tx_usd: 0.025, quality: 'measured', basis: 'L2Fees 30-day median' },
  { chain: 'Monad', swap_lo_usd: 0.0005, swap_hi_usd: 0.001, per_tx_usd: 0.001, quality: 'measured', basis: 'Monad docs gas-pricing page; GemWallet tracker' },
  { chain: 'Hyperliquid L1', swap_lo_usd: 0.033, swap_hi_usd: 0.062, per_tx_usd: 0.062, quality: 'measured', basis: 'HyperEVM gas (GemWallet tracker); HyperCore actions may differ' },
  // Radar-6 additions, researched 2026-11-23 (see README for sources).
  // Radar-7 resolved the seven chains that had no reliable figure then
  // (RISE, BSquared, Bittensor, Pharos, Mezo, XION, Canton) — see below.
  { chain: 'Flare', swap_lo_usd: 0.0001, swap_hi_usd: 0.001, per_tx_usd: 0.001, quality: 'estimate', basis: 'derived from gas price x gas (FIP.16 base fee 500 gwei, FLR ~$0.006); FAssets txs cost ~10x a plain transfer' },
  { chain: 'Ink', swap_lo_usd: 0.001, swap_hi_usd: 0.005, per_tx_usd: 0.005, quality: 'estimate', basis: 'growthepie median tx + OP-stack swap/transfer ratio (~10x); no Ink-specific swap median published' },
  { chain: 'Provenance', swap_lo_usd: null, swap_hi_usd: null, per_tx_usd: 0.15, quality: 'estimate', basis: 'no DEX swap on this Cosmos chain; per-tx uses the $0.15/message default (flat USD fee model, transfer $0.025)' },
  { chain: 'Plasma', swap_lo_usd: 0.00001, swap_hi_usd: 0.0001, per_tx_usd: 0.001, quality: 'measured', basis: 'transfer 60,924 gas ~$0.000006 at $0.101/XPL; USDT0 transfers free via relayer, swaps/approvals are not' },
  { chain: 'Arc', swap_lo_usd: 0.003, swap_hi_usd: 0.045, per_tx_usd: 0.05, quality: 'estimate', basis: 'RPC read: base fee at 20 Gwei floor, transfer 0.00042 USDC; gas paid in USDC, base fee can rise 1000x' },
  { chain: 'Ripple', swap_lo_usd: 0.000011, swap_hi_usd: 0.000011, per_tx_usd: 0.001, quality: 'measured', basis: 'XRPL DEX fee 12 drops = 0.000012 XRP ~$0.000011/tx; per-tx uses $0.001 as a conservative floor. The XRPL EVM sidechain is a separate chain' },
  { chain: 'Noble', swap_lo_usd: null, swap_hi_usd: null, per_tx_usd: 0.1, quality: 'estimate', basis: 'no DEX on Noble; per-tx uses the IBC/transfer cost (USDC-denominated gas, 0.01-0.1 USDC cross-chain)' },
  { chain: 'Manta', swap_lo_usd: 0.0009, swap_hi_usd: 0.0017, per_tx_usd: 0.002, quality: 'measured', basis: 'GemWallet tracker (swap $0.00087 normal / $0.0017 fast); gas paid in ETH, not MANTA' },
  { chain: 'World Chain', swap_lo_usd: 0.001, swap_hi_usd: 0.005, per_tx_usd: 0.005, quality: 'estimate', basis: 'growthepie median tx + OP-stack ratio; World Money app may charge a 1% platform fee on swaps in some jurisdictions (app fee, not network fee)' },
  { chain: 'Kava', swap_lo_usd: 0.0001, swap_hi_usd: 0.0001, per_tx_usd: 0.001, quality: 'measured', basis: 'tracker read Nov 18 2026: 1.01 Gwei, swap 175,000 gas <$0.0001, KAVA $0.0286' },
  { chain: 'Morph', swap_lo_usd: 0.01, swap_hi_usd: 0.03, per_tx_usd: 0.03, quality: 'estimate', basis: 'L2 analogy (Base $0.018, Arbitrum $0.024, OP $0.031 medians); L1 data fee is a second component' },
  { chain: 'RSK', swap_lo_usd: 0.17, swap_hi_usd: 0.25, per_tx_usd: 0.25, quality: 'measured', basis: 'swap 90k-130k gas at ~0.026 gwei, RBTC ~$74k; getting RBTC costs: PowPeg peg-in ~17h, Flyover ~20 min for a fee' },
  { chain: 'Ronin', swap_lo_usd: 0.0003, swap_hi_usd: 0.0006, per_tx_usd: 0.001, quality: 'measured', basis: 'explorer swaps Nov 2026: 0.006-0.011 RON at flat ~21 gwei, RON ~$0.05' },
  { chain: 'Proton', swap_lo_usd: 0, swap_hi_usd: 0.001, per_tx_usd: 0.001, quality: 'measured', basis: 'zero network fee (resource model: CPU/NET/RAM allocation); per-tx uses $0.001 as a floor' },
  { chain: 'Tempo', swap_lo_usd: 0.0001, swap_hi_usd: 0.0018, per_tx_usd: 0.002, quality: 'measured', basis: 'docs fee spec: swap ~150k gas, at most $0.0018; fee paid in any USD TIP-20 stablecoin; Fee AMM charges 0.3% when the stablecoin differs' },
  { chain: 'Reya Network', swap_lo_usd: 0.00001, swap_hi_usd: 0.002, per_tx_usd: 0.002, quality: 'measured', basis: 'explorer swap txs: 0.000000021-0.00000071 ETH at 0.0001 gwei; perps L2 marketed as gas-free, fee is near-zero not zero' },
  { chain: 'Starknet', swap_lo_usd: 0.1, swap_hi_usd: 0.35, per_tx_usd: 0.35, quality: 'estimate', basis: 'L2Fees.info via Oct 2026 summary: transfer $0.02-0.08, swap $0.10-0.35; account abstraction makes swaps much heavier than average txs' },
  { chain: 'Strato', swap_lo_usd: 0.01, swap_hi_usd: 0.01, per_tx_usd: 0.01, quality: 'measured', basis: 'flat 0.01 USDST per tx (or 1 voucher); fee charged even if the tx reverts' },
  { chain: 'Stable', swap_lo_usd: 0.0001, swap_hi_usd: 0.0002, per_tx_usd: 0.001, quality: 'measured', basis: 'RPC read: gas 1.125 Gwei USDT0; USDT0 transfers gas-free, contract calls pay small USDT0 fees' },
  { chain: 'Klaytn', swap_lo_usd: 0.0002, swap_hi_usd: 0.001, per_tx_usd: 0.001, quality: 'measured', basis: 'openchainbench live Nov 22 2026 + kaiascan swap txs; fixed 27.5 Gkei gas price, KAIA ~$0.03 (Kaia = Klaytn + Finschia)' },
  { chain: 'Bifrost Network', swap_lo_usd: 0.006, swap_hi_usd: 0.006, per_tx_usd: 0.01, quality: 'estimate', basis: 'project-published average $0.006 (gas tracker ~1000 Gwei, BFC ~$0.018), not an independent tracker median' },
  { chain: 'Qubic', swap_lo_usd: null, swap_hi_usd: null, per_tx_usd: 0.005, quality: 'estimate', basis: 'no conventional DEX swap; QUBIC transfers are feeless by design, so per-tx uses the $0.005 transfer-cost proxy' },
  { chain: 'Stacks', swap_lo_usd: 0.03, swap_hi_usd: 0.79, per_tx_usd: 0.8, quality: 'measured', basis: 'explorer swap-router txs Oct-Nov 2026: simple sBTC/STX swaps $0.03, multi-hop DLMM router swaps $0.56-0.79; fee is sender-chosen' },
  { chain: 'Fluent', swap_lo_usd: 0.0003, swap_hi_usd: 0.001, per_tx_usd: 0.001, quality: 'measured', basis: 'median fees ~$0.0005 (Aug 2026); DefiLlama Nov 22: $0.88 fees / 3,106 txs ~$0.00028/tx; gas paid in ETH' },
  { chain: 'Plume Mainnet', swap_lo_usd: 0.002, swap_hi_usd: 0.02, per_tx_usd: 0.02, quality: 'measured', basis: 'explorer swap txs Nov 15-16 2026: 0.36-0.40 PLUME, gas price flat 1,000 Gwei, PLUME ~$0.026; many txs Sponsored' },
  // Radar-7 additions, researched 2026-11-27 (see README for sources). No
  // chain now lacks a reliable figure: the 7 radar-6 unknowns are all
  // resolved, so 0 of the 198 rows sit on a fee-unknown chain. Four of the
  // seven have no true DEX swap (Canton, Bittensor, RISE, XION), so their
  // swap range is null and per-tx is the honest proxy, as for Noble and
  // Provenance. Canton $1.00 is the table's new maximum per-tx figure,
  // above Stacks $0.80; Bittensor $0.70 is second.
  { chain: 'RISE', swap_lo_usd: null, swap_hi_usd: null, per_tx_usd: 0.005, quality: 'measured', basis: 'explorer 24h avg fee 0.00000092 ETH, ETH ~$1,700, so ~$0.0016 avg tx; swap scaled 2-3x by gas. No spot DEX yet (perps only, gas-sponsored), so per-tx is a scaled average, not a swap median' },
  { chain: 'BSquared', swap_lo_usd: 0.0001, swap_hi_usd: 0.001, per_tx_usd: 0.001, quality: 'measured', basis: 'DefiLlama 24h chain fees $3.78 / 45,434 txs = $0.000083 avg tx; swap scaled up by gas. Settles radar-6\'s conflict in favour of the ~$0.0001 figure' },
  { chain: 'Bittensor', swap_lo_usd: null, swap_hi_usd: null, per_tx_usd: 0.7, quality: 'estimate', basis: 'SwapSpace avg tx fee $0.30-0.70 (Nov 25 2026); no conventional DEX swap — closest is subnet stake/unstake, whose 0.05% pool fee is excluded. Heavy ops can cost several dollars' },
  { chain: 'Pharos', swap_lo_usd: 0.03, swap_hi_usd: 0.1, per_tx_usd: 0.1, quality: 'estimate', basis: 'project-stated claim fee 0.05 PROS ~$0.034, swap scaled 2-3x; no explorer swap median published. Gas sponsorship planned Q4 2026 may make some apps $0' },
  { chain: 'Mezo', swap_lo_usd: 0.02, swap_hi_usd: 0.1, per_tx_usd: 0.1, quality: 'estimate', basis: '79 mainnet settlements ~$0.024 each (Nov 12 2026), swap scaled 2-4x by gas; gas paid in BTC; Mezo Swap is a real in-app DEX. Bridge-in (~$3 tBTC fee) is separate' },
  { chain: 'XION', swap_lo_usd: null, swap_hi_usd: null, per_tx_usd: 0.001, quality: 'estimate', basis: 'Foundation: avg tx <$0.0001 (2025); gas paid in USDC, often app-sponsored so the user-facing fee is often $0; only DEX is Blaze Swap (TVL $3,391)' },
  { chain: 'Canton', swap_lo_usd: null, swap_hi_usd: null, per_tx_usd: 1, quality: 'estimate', basis: 'traffic price $60/MB (all current sources agree), ~$1 per typical tx; no public DEX; fee is paid by validators/operators, the end user may not pay directly' },
];

/** The fee figure for a chain, or null when no reliable public figure exists. */
export function chainFee(chain: string): ChainFee | null {
  return CHAIN_FEES.find((f) => f.chain === chain) ?? null;
}

/** Whether the protocol's main action moves tokens through a swap (so a pool fee applies). */
export function swapsFor(p: SnapshotProtocol): boolean {
  const c = (p.category ?? '').toLowerCase();
  return c.includes('dex') || c.includes('yield') || c.includes('leveraged farm');
}

/** The pool fee on a swap leg: 0.25% of the capital, the usual v2 rate. */
export const POOL_FEE_RATE = 0.0025;

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
  /** The stated-scenario net at this deposit size (slice minus all costs). */
  net_usd: number;
}

/**
 * The stated scenario behind every net figure (radar-6). The snapshot
 * carries no airdrop share, so the net is a yardstick, not a forecast: the
 * airdrop pool is 7% of the implied value, the farmed capital is 1% of
 * TVL, and your slice is proportional to your deposit within the farmed
 * capital. Net is the slice minus all the plan's costs. The dashboard
 * prints these assumptions and lets the reader change the deposit and the
 * drop share, re-pricing every net live.
 */
export const DROP_SHARE = 0.07;
export const FARMED_SHARE_OF_TVL = 0.01;

/** A row's slice of the drop pool at a deposit, from its implied value and TVL. */
export function sliceFor(impliedValueUsd: number, capitalUsd: number, tvlUsd: number, dropShare: number = DROP_SHARE): number {
  if (tvlUsd <= 0) return 0;
  return (impliedValueUsd * dropShare * capitalUsd) / (FARMED_SHARE_OF_TVL * tvlUsd);
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
  /** Stated-scenario net (radar-6): the slice of a 7%-of-implied drop pool,
   * proportional to the deposit within farmed capital assumed at 1% of TVL,
   * minus all the plan's costs. A yardstick for comparing rows, not a payout. */
  slice_usd: number;
  net_usd: number;
  net_per_hour_usd: number;
  /** The same slice and net at the band's 10th-percentile implied value. */
  slice_low_usd: number;
  net_low_usd: number;
  /** True when even the low-end net is positive: the row pays under the
   * stated scenario at the bottom of its own band. */
  robust: boolean;
  /** This row's rank by net dollars and by net dollars per hour. */
  eff_rank_net: number;
  eff_rank_net_hour: number;
  /** What would move this row across a verdict line, from the rank-50 and rank-100 implied values. */
  flip_condition: string;
  /** The $50 / $100 / $250 deposit sizes, each with its own per-$1 index. */
  deposit_tiers: DepositTier[];
  farm_steps: string[];
  /** The farm's network cost, from the researched November-2026 fee table. */
  fee_chain: string;
  tx_count: number;
  /** Network fees for the whole plan (approve + setup + weekly + claim), or null when the chain has no reliable fee figure. */
  network_fee_usd: number | null;
  /** The 0.25% pool fee on the swap leg, or 0 when the plan does not swap. */
  pool_fee_usd: number;
  /** Time cost + network fees + pool fee: the airdrop that would have to arrive. Null network fee means this is time cost only. */
  total_cost_usd: number;
  fee_unknown: boolean;
  fee_per_tx_usd: number | null;
  fee_swap_lo_usd: number | null;
  fee_swap_hi_usd: number | null;
  fee_quality: 'measured' | 'estimate' | null;
  fee_basis: string | null;
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
  slice_usd: number;
  net_usd: number;
  net_per_hour_usd: number;
  slice_low_usd: number;
  net_low_usd: number;
  robust: boolean;
  eff_rank_net: number;
  eff_rank_net_hour: number;
  flip_condition: string;
  deposit_tiers: DepositTier[];
  fee_chain: string;
  tx_count: number;
  network_fee_usd: number | null;
  pool_fee_usd: number;
  total_cost_usd: number;
  fee_unknown: boolean;
  fee_per_tx_usd: number | null;
  fee_swap_lo_usd: number | null;
  fee_swap_hi_usd: number | null;
  fee_quality: 'measured' | 'estimate' | null;
  fee_basis: string | null;
  /** board.json's own farm steps, so the page shows exactly what the board carries. */
  farm_steps: string[];
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
  /** sha256 of the board.json bytes main.ts writes; '' until main.ts fills it in. */
  board_sha256: string;
  validation: Validation;
  odds_table: OddsBucket[];
  coverage: Coverage;
  /** The researched November-2026 fee table, so the dashboard shows it without duplicating it. */
  chain_fees: ChainFee[];
  /** Board rows whose chain has no reliable fee figure. */
  fee_unknown_rows: number;
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

/** Categories that are a wrapped, staked or bridged product of a token that already trades. */
const EXCLUDED_CATEGORIES = new Set(['Bridge', 'Canonical Bridge', 'Liquid Staking', 'Liquid Restaking', 'Restaked BTC', 'CEX']);

/** A name that begins with an exchange's name. */
const EXCHANGE_PREFIX = /^(Binance|Coinbase|Bybit|Kraken|Bitget|OKX|Bitfinex|Gemini)(\s|$)/i;

/** A name carrying a whole word wrapped, staked or staking. */
const WRAPPED_WORD = /\b(wrapped|staked|staking)\b/i;

/**
 * Whether a protocol is one the board may rank. This is the snapshot's own
 * watchlist rule, without the floor: pre-token, and not a wrapped, staked or
 * bridged product of a protocol whose token already trades. Radar-4's rule
 * was weaker (only CEX and versioned names), so it ranked bridged and staked
 * products below the floor as launch candidates and missed 20 genuine
 * pre-token protocols at or above the floor that the watchlist rule leaves
 * out. WBTC, Binance staked ETH and USDT0 are the rule's own examples: each
 * records no token in the snapshot, and each is a product of a token that
 * already trades, so none of them is a launch the radar should rank.
 */
export function isRankable(p: SnapshotProtocol): boolean {
  if (!isPreToken(p)) return false;
  if (p.category !== null && EXCLUDED_CATEGORIES.has(p.category)) return false;
  if (VERSIONED.test(p.name)) return false;
  if (WRAPPED_WORD.test(p.name)) return false;
  if (EXCHANGE_PREFIX.test(p.name)) return false;
  return true;
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
  // residual, shrunk by n/(n+strength) so small categories barely move the
  // curve. Computed inside each fold from the training protocols only.
  // Radar-5 re-tests it at strength 50 as well as 20: stronger shrinkage
  // approaches the current curve from above but never beats it.
  const categoryShrinkAt = (strength: number): number => {
    const errs: number[] = [];
    for (let i = 0; i < live.length; i++) {
      const tr = rows2.filter((_, j) => j !== i);
      const ty = y.filter((_, j) => j !== i);
      const c = ols(tr, ty);
      const resid = ty.map((v, j) => v - dot(c, tr[j]!));
      const trainLive = live.filter((_, k) => k !== i);
      const same = resid.filter((_, j) => trainLive[j]!.category === live[i]!.category);
      const adj = same.length === 0 ? 0 : (same.length / (same.length + strength)) * median(same);
      errs.push(Math.abs(y[i]! - (dot(c, rows2[i]!) + adj)));
    }
    return median(errs);
  };
  const categoryShrinkLoo = categoryShrinkAt(20);
  const categoryShrink50Loo = categoryShrinkAt(50);
  // Winsorized fit: clip the training fold's y to its 5th/95th percentiles,
  // fit, predict the held-out row's unclipped y. The heavy tails are the
  // signal, not noise: clipping them makes the median error worse.
  const winsorizedErrs: number[] = [];
  for (let i = 0; i < live.length; i++) {
    const tr = rows2.filter((_, j) => j !== i);
    const ty = y.filter((_, j) => j !== i);
    const lo = quantile(ty, 0.05);
    const hi = quantile(ty, 0.95);
    const clipped = ty.map((v) => Math.min(hi, Math.max(lo, v)));
    const c = ols(tr, clipped);
    winsorizedErrs.push(Math.abs(y[i]! - dot(c, rows2[i]!)));
  }
  const winsorizedLoo = median(winsorizedErrs);
  // Theil-Sen: the median pairwise slope, intercept the median residual.
  // Robust to outliers by construction, and still worse on the median error.
  const theilSenErrs: number[] = [];
  for (let i = 0; i < live.length; i++) {
    const tr = rows2.filter((_, j) => j !== i);
    const ty = y.filter((_, j) => j !== i);
    const slopes: number[] = [];
    for (let a = 0; a < tr.length; a++) {
      for (let b = a + 1; b < tr.length; b++) {
        const dx = tr[b]![1]! - tr[a]![1]!;
        if (Math.abs(dx) > 1e-12) slopes.push((ty[b]! - ty[a]!) / dx);
      }
    }
    const slope = median(slopes);
    const intercept = median(ty.map((v, j) => v - slope * tr[j]![1]!));
    theilSenErrs.push(Math.abs(y[i]! - (intercept + slope * rows2[i]![1]!)));
  }
  const theilSenLoo = median(theilSenErrs);
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

  // Radar-6 rejected candidates, each on the same leave-one-out footing.
  // Log-age term: log TVL plus log days with no token (unrecorded age counts
  // as 1000 days). The age coefficient is small and the median error gets
  // worse, confirming the earlier bucketed age rejection.
  const rowsLogAge = live.map((p) => {
    const age = ageDays(snapshot.as_of, p.listed_at);
    return [1, Math.log(p.tvl_usd), Math.log(Math.max(1, age ?? 1000))];
  });
  const logAgeLoo = looFor(rowsLogAge);
  // LAD / median regression by iteratively reweighted least squares: weights
  // 1/max(|residual|, 1e-6), refit until the coefficients settle. The median
  // fit is genuinely different from Theil-Sen and still worse.
  const ladLoo = (() => {
    const errs: number[] = [];
    for (let i = 0; i < live.length; i++) {
      const tr = rows2.filter((_, j) => j !== i);
      const ty = y.filter((_, j) => j !== i);
      let c = ols(tr, ty);
      for (let iter = 0; iter < 50; iter++) {
        const w = ty.map((v, j) => 1 / Math.max(1e-6, Math.abs(v - dot(c, tr[j]!))));
        const k = 2;
        const a: number[][] = Array.from({ length: k }, () => new Array<number>(k).fill(0));
        const b: number[] = new Array<number>(k).fill(0);
        for (let t = 0; t < tr.length; t++) {
          for (let ii = 0; ii < k; ii++) {
            b[ii] = b[ii]! + w[t]! * tr[t]![ii]! * ty[t]!;
            for (let jj = 0; jj < k; jj++) a[ii]![jj] = a[ii]![jj]! + w[t]! * tr[t]![ii]! * tr[t]![jj]!;
          }
        }
        const c2 = solveLinear(a, b);
        const shift = Math.max(Math.abs(c2[0]! - c[0]!), Math.abs(c2[1]! - c[1]!));
        c = c2;
        if (shift < 1e-8) break;
      }
      errs.push(Math.abs(y[i]! - dot(c, rows2[i]!)));
    }
    return median(errs);
  })();
  // Trimmed OLS: drop the 5% tails of y in each training fold, fit, predict
  // the held-out row's untrimmed y. Trimming the tails is worse than
  // winsorizing them — the heavy tails carry signal.
  const trimmedErrs: number[] = [];
  for (let i = 0; i < live.length; i++) {
    const tr = rows2.filter((_, j) => j !== i);
    const ty = y.filter((_, j) => j !== i);
    const lo = quantile(ty, 0.05);
    const hi = quantile(ty, 0.95);
    const keep = ty.map((v, j) => (v >= lo && v <= hi ? j : -1)).filter((j) => j >= 0);
    const c = ols(keep.map((j) => tr[j]!), keep.map((j) => ty[j]!));
    trimmedErrs.push(Math.abs(y[i]! - dot(c, rows2[i]!)));
  }
  const trimmedLoo = median(trimmedErrs);
  // TVL-quintile bin medians: no curve at all, just the median ratio in the
  // protocol's TVL fifth. Coarser than the curve and worse.
  const quintileErrs: number[] = [];
  for (let i = 0; i < live.length; i++) {
    const tr = rows2.filter((_, j) => j !== i);
    const ty = y.filter((_, j) => j !== i);
    const xs = tr.map((r) => r[1]!);
    const cuts = [0.2, 0.4, 0.6, 0.8].map((q) => quantile(xs, q));
    const binOf = (v: number): number => cuts.filter((c) => v > c).length;
    const bin = binOf(rows2[i]![1]!);
    const inBin = ty.filter((_, j) => binOf(tr[j]![1]!) === bin);
    quintileErrs.push(Math.abs(y[i]! - median(inBin.length > 0 ? inBin : ty)));
  }
  const quintileLoo = median(quintileErrs);
  // Isotonic fit: a monotone-decreasing step function of y on log TVL
  // (pool-adjacent-violators). Flexible where the curve is rigid, and worse.
  const isotonicErrs: number[] = [];
  for (let i = 0; i < live.length; i++) {
    const tr = rows2.filter((_, j) => j !== i);
    const ty = y.filter((_, j) => j !== i);
    const pts = tr.map((r, j) => ({ x: r[1]!, y: ty[j]! })).sort((a, b) => a.x - b.x);
    type Block = { lo: number; hi: number; sum: number; n: number };
    const blocks: Block[] = [];
    for (const p of pts) {
      blocks.push({ lo: p.x, hi: p.x, sum: p.y, n: 1 });
      while (blocks.length >= 2) {
        const last = blocks[blocks.length - 1]!;
        const prev = blocks[blocks.length - 2]!;
        if (prev.sum / prev.n >= last.sum / last.n) break;
        prev.hi = last.hi;
        prev.sum += last.sum;
        prev.n += last.n;
        blocks.pop();
      }
    }
    const xv = rows2[i]![1]!;
    let pred = blocks[0]!.sum / blocks[0]!.n;
    for (const b of blocks) if (xv >= b.lo) pred = b.sum / b.n;
    isotonicErrs.push(Math.abs(y[i]! - pred));
  }
  const isotonicLoo = median(isotonicErrs);

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

  // Radar-7 closest call, kept as the comparison: a two-segment fit,
  // separate OLS below and above the training median log TVL (the split is
  // recomputed inside every fold, so no held-out row leaks into its own
  // split). It passes both tests on the medians, and is still not adopted
  // unblended: the fitted curve jumps about 26% at the split, the mean
  // error is worse than the kept curve's, and it wins on only 51 of 128
  // protocols. Computed here so the dashboard shows the comparison, not a
  // claim about it. twoSegmentFit / twoSegmentPred live at module scope.
  const twoSegmentLooErrs: number[] = [];
  for (let i = 0; i < live.length; i++) {
    const tr = rows2.filter((_, j) => j !== i);
    const ty = y.filter((_, j) => j !== i);
    twoSegmentLooErrs.push(Math.abs(y[i]! - twoSegmentPred(twoSegmentFit(tr, ty), rows2[i]![1]!)));
  }
  const twoSegmentLoo = median(twoSegmentLooErrs);
  const twoSegmentLooMean = mean(twoSegmentLooErrs);
  let twoSegmentWf = 0;
  if (trainIdx.length > 10 && testIdx.length > 0) {
    const f = twoSegmentFit(
      trainIdx.map((i) => rows2[i]!),
      trainIdx.map((i) => y[i]!),
    );
    twoSegmentWf = median(testIdx.map((i) => Math.abs(y[i]! - twoSegmentPred(f, rows2[i]![1]!))));
  }

  // Radar-8 adopted curve: the same two-segment split, blended linearly
  // over ±BLEND_BAND_LOG/2 log TVL around the split, so the fitted curve
  // is continuous — the 26% cliff becomes a bend through $19.8M-$53.7M
  // TVL. The split is recomputed inside every fold, exactly as for the
  // unblended fit. The full-data fit below is what buildBoard scores with.
  const blendLooErrs: number[] = [];
  for (let i = 0; i < live.length; i++) {
    const tr = rows2.filter((_, j) => j !== i);
    const ty = y.filter((_, j) => j !== i);
    blendLooErrs.push(Math.abs(y[i]! - blendPred(twoSegmentFit(tr, ty), rows2[i]![1]!)));
  }
  const blendLoo = median(blendLooErrs);
  const blendLooMean = mean(blendLooErrs);
  const blendWins = blendLooErrs.filter((e, i) => e < looErrs[i]!).length;
  let blendWf = 0;
  if (trainIdx.length > 10 && testIdx.length > 0) {
    const f = twoSegmentFit(
      trainIdx.map((i) => rows2[i]!),
      trainIdx.map((i) => y[i]!),
    );
    blendWf = median(testIdx.map((i) => Math.abs(y[i]! - blendPred(f, rows2[i]![1]!))));
  }
  const blendFull = twoSegmentFit(rows2, y);
  const blendJump =
    blendFull.hi[0]! + blendFull.hi[1]! * blendFull.split - (blendFull.lo[0]! + blendFull.lo[1]! * blendFull.split);

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
      category_shrink_50_loo: categoryShrink50Loo,
      winsorized_loo: winsorizedLoo,
      theil_sen_loo: theilSenLoo,
      imputed_curve_loo: imputedCurveLoo,
      log_age_loo: logAgeLoo,
      lad_loo: ladLoo,
      trimmed_loo: trimmedLoo,
      quintile_loo: quintileLoo,
      isotonic_loo: isotonicLoo,
      two_segment_loo: twoSegmentLoo,
      two_segment_wf: twoSegmentWf,
      two_segment_loo_mean: twoSegmentLooMean,
      blend_split_log_tvl: blendFull.split,
      blend_band_log: BLEND_BAND_LOG,
      blend_lo_a: blendFull.lo[0]!,
      blend_lo_b: blendFull.lo[1]!,
      blend_hi_a: blendFull.hi[0]!,
      blend_hi_b: blendFull.hi[1]!,
      blend_jump_log: blendJump,
      blend_loo: blendLoo,
      blend_wf: blendWf,
      blend_loo_mean: blendLooMean,
      blend_wins: blendWins,
      ablation_top20: [],
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

/** The fitted market cap for a TVL under the radar-8 blended two-segment
 * curve: exp(blended log(mcap/TVL) + log TVL), with the blend's split,
 * segments and band taken from the runtime validation. */
function fittedMcapBlend(tvl: number, v: Validation): number {
  const x = Math.log(tvl);
  const f: TwoSegmentFit = { split: v.blend_split_log_tvl, lo: [v.blend_lo_a, v.blend_lo_b], hi: [v.blend_hi_a, v.blend_hi_b] };
  return Math.exp(blendPred(f, x, v.blend_band_log) + x);
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

/** How many transactions a farm plan makes: approve + main action, one a week, and the claim. */
export function txCountFor(holdDays: number): number {
  return 3 + Math.ceil(holdDays / 7);
}

/** A dollar figure, trailing zeros trimmed ($4, $0.25, $0.0005, $0.000011). */
export function money2(n: number): string {
  const digits = n >= 1 ? 2 : n >= 0.01 ? 3 : n >= 0.0001 ? 4 : 6;
  const s = n.toFixed(digits).replace(/\.?0+$/, '');
  return `$${s === '' || s === '-' ? '0' : s}`;
}

/**
 * A protocol's farm plan: six steps, each an action with a cost and a time. The plan is derived from
 * the protocol's own record (category, chains, TVL, age), never from a hand-written list of names.
 * Network fees come from the researched November-2026 table, not from the snapshot (which carries
 * no fee): each step quotes the chain's figure, and a chain with no reliable figure says so
 * instead of quoting a guess. Radar-6 researched 25 more chains (Flare, Ink,
 * Provenance, Plasma, Arc, Ripple, Noble, Manta, World Chain, Kava, Morph, RSK,
 * Ronin, Proton, Tempo, Reya, Starknet, Strato, Stable, Klaytn, Bifrost
 * Network, Qubic, Stacks, Fluent, Plume Mainnet). Radar-7 resolved the last
 * seven (RISE, BSquared, Bittensor, Pharos, Mezo, XION, Canton), so no row
 * is fee-unknown. The most expensive chains are now Canton $1.00, Stacks
 * $0.80 and Bittensor $0.70 per transaction. Four chains have no DEX at
 * all (Noble, Provenance's Cosmos-side settlement, Canton, Bittensor), so
 * their figures are transfer or average-tx costs, not swap medians, and the
 * farm steps say so.
 */
export function farmSteps(p: SnapshotProtocol, age: number | null): FarmStep[] {
  const chain = chainOf(p);
  const capital = capitalFor(p);
  const hold = holdDaysFor(age);
  const fee = chainFee(chain);
  const txs = txCountFor(hold);
  const pool = swapsFor(p) ? capital * POOL_FEE_RATE : 0;
  const perTx = (n: number): string =>
    fee === null ? `the chain fee (no reliable public figure for ${chain})` : `about ${money2(n)} in network fees on ${chain}`;
  const swapRange =
    fee === null
      ? `no reliable public fee figure for ${chain} — check the live fee first`
      : fee.swap_lo_usd === null
        ? `no DEX swap on ${chain}; a plain transaction costs about ${money2(fee.per_tx_usd)}`
        : `a swap on ${chain} typically costs ${money2(fee.swap_lo_usd)}-${money2(fee.swap_hi_usd)} in network fees (Nov 2026 medians)`;
  return [
    {
      text: `Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.`,
      cost: `no capital yet; ${swapRange}`,
      time: '5 minutes',
    },
    {
      text: actionFor(p, capital, chain),
      cost: `$${capital} of capital, plus ${perTx(2 * (fee?.per_tx_usd ?? 0))} to set up${pool > 0 ? `, plus ${money2(pool)} pool fee on the swap leg` : ''}`,
      time: '15 minutes to set up',
    },
    {
      text: `Make one qualifying action each week, such as a deposit, a borrow, a swap or a vote.`,
      cost: `${perTx(fee?.per_tx_usd ?? 0)} each week`,
      time: '10 minutes a week',
    },
    {
      text: `Hold the position for at least ${hold} days so the activity is counted in more than one snapshot.`,
      cost: `the $${capital} stays in the position`,
      time: `${hold} days`,
    },
    {
      text: `Before you withdraw, open the protocol's own points or rewards page and claim only from the link it publishes.`,
      cost: `${perTx(fee?.per_tx_usd ?? 0)} to claim, and never pay to claim`,
      time: '10 minutes',
    },
    {
      text: `Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it.`,
      cost: `nothing but the log (${txs} transactions in all)`,
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
  // The early radar: every other rankable pre-token protocol, at any TVL. The
  // watchlist rule leaves out 20 rankable pre-token protocols at or above the
  // floor and 138 below it; all of them are pre-token protocols the radar
  // exists to find, so all of them are ranked. A chosen protocol stays chosen.
  const early = snapshot.protocols
    .filter((p) => !chosen.has(p.slug) && isRankable(p))
    .sort((a, b) => b.tvl_usd - a.tvl_usd || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  for (const p of early) chosen.set(p.slug, p);

  const live = snapshot.protocols.filter((p) => p.mcap_usd !== null && p.mcap_usd > 0);
  const scored = [...chosen.values()].map((p) => {
    const age = ageDays(snapshot.as_of, p.listed_at);
    const odds = oddsFor(age, oddsTable, globalOdds);
    const fitted = fittedMcapBlend(p.tvl_usd, validation);
    const implied = Math.max(1, Math.round(fitted * odds));
    return { p, age, odds, fitted, implied };
  });
  scored.sort((a, b) => b.implied - a.implied || (a.p.slug < b.p.slug ? -1 : a.p.slug > b.p.slug ? 1 : 0));

  // Bootstrap bands: resample the 128 fitted protocols, refit the blended
  // two-segment curve, and re-score every board row. The 10th-90th
  // percentiles give the band and the rank range. Odds stay fixed: they
  // come from the whole snapshot, not from the refit sample.
  const rand = mulberry32(20261114);
  const impliedSamples: number[][] = scored.map(() => []);
  const rankSamples: number[][] = scored.map(() => []);
  for (let rep = 0; rep < BOOTSTRAPS; rep++) {
    const sampleIdx: number[] = [];
    for (let i = 0; i < live.length; i++) sampleIdx.push(Math.floor(rand() * live.length));
    const rows = sampleIdx.map((i) => [1, Math.log(live[i]!.tvl_usd)]);
    const ys = sampleIdx.map((i) => Math.log(live[i]!.mcap_usd! / live[i]!.tvl_usd));
    const bf = twoSegmentFit(rows, ys);
    const repImplied = scored.map((s) => Math.max(1, Math.round(Math.exp(blendPred(bf, Math.log(s.p.tvl_usd)) + Math.log(s.p.tvl_usd)) * s.odds)));
    const order = repImplied.map((v, i) => ({ v, i })).sort((x, y) => y.v - x.v || (scored[x.i]!.p.slug < scored[y.i]!.p.slug ? -1 : 1));
    order.forEach((o, rank) => {
      impliedSamples[o.i]!.push(repImplied[o.i]!);
      rankSamples[o.i]!.push(rank + 1);
    });
  }

  // The verdict lines, in implied-value dollars: the implied value of the
  // top-quarter row (the FARM line) and of the top-half row (the THIN line).
  // The lines move with the board's size, never a hand-written threshold:
  // at 289 rows the top quarter is rank 73 and the top half is rank 145.
  const farmRank = Math.ceil(scored.length / 4);
  const thinRank = Math.ceil(scored.length / 2);
  const lineFarm = scored[farmRank - 1]!.implied;
  const lineThin = scored[thinRank - 1]!.implied;
  const money = (n: number): string =>
    n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${Math.round(n / 1e3)}K` : `$${Math.round(n)}`;

  const base = scored.map((s, i) => {
    const capital = capitalFor(s.p);
    const hold = holdDaysFor(s.age);
    const timeHours = Math.round((0.5 + (hold / 7) * (10 / 60)) * 10) / 10;
    // Break-even is the airdrop that would have to arrive: time cost (hours x
    // the assumed $25/hour) plus the plan's network fees on its chain at
    // November-2026 medians, plus the 0.25% pool fee on the swap leg. A chain
    // with no reliable fee figure leaves the network fee out and says so: its
    // break-even is time cost only, and the row is flagged fee_unknown.
    const chain = chainOf(s.p);
    const fee = chainFee(chain);
    const txs = txCountFor(hold);
    const networkFee = fee === null ? null : Math.round(txs * fee.per_tx_usd * 100) / 100;
    const poolFee = swapsFor(s.p) ? Math.round(capital * POOL_FEE_RATE * 100) / 100 : 0;
    const timeCost = timeHours * TIME_VALUE_USD_PER_HOUR;
    const totalCost = Math.round((timeCost + (networkFee ?? 0) + poolFee) * 100) / 100;
    const breakEven = Math.round(totalCost);
    const verdict: 'farm' | 'thin' | 'skip' =
      i + 1 <= farmRank && s.odds >= 0.35 ? 'farm' : i + 1 <= thinRank || s.odds >= 0.55 ? 'thin' : 'skip';
    const impliedLow = Math.max(1, Math.round(quantile(impliedSamples[i]!, 0.1)));
    const impliedHigh = Math.max(1, Math.round(quantile(impliedSamples[i]!, 0.9)));
    // Stated-scenario net: the slice of a 7% drop pool, proportional to the
    // deposit within farmed capital assumed at 1% of TVL, minus all the
    // plan's costs. The low-end net uses the band's 10th percentile.
    const slice = sliceFor(s.implied, capital, s.p.tvl_usd);
    const net = Math.round((slice - totalCost) * 100) / 100;
    const netPerHour = Math.round((net / timeHours) * 100) / 100;
    const sliceLow = sliceFor(impliedLow, capital, s.p.tvl_usd);
    const netLow = Math.round((sliceLow - totalCost) * 100) / 100;
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
      implied_low_usd: impliedLow,
      implied_high_usd: impliedHigh,
      rank_low: Math.round(quantile(rankSamples[i]!, 0.1)),
      rank_high: Math.round(quantile(rankSamples[i]!, 0.9)),
      verdict,
      capital_usd: capital,
      time_hours: timeHours,
      break_even_usd: breakEven,
      implied_per_capital_usd: Math.round(s.implied / capital),
      implied_per_hour_usd: Math.round(s.implied / timeHours),
      slice_usd: Math.round(slice * 100) / 100,
      net_usd: net,
      net_per_hour_usd: netPerHour,
      slice_low_usd: Math.round(sliceLow * 100) / 100,
      net_low_usd: netLow,
      robust: netLow > 0,
      farm_steps: farmSteps(s.p, s.age).map(stepText),
      fee_chain: chain,
      tx_count: txs,
      network_fee_usd: networkFee,
      pool_fee_usd: poolFee,
      total_cost_usd: totalCost,
      fee_unknown: fee === null,
      fee_per_tx_usd: fee?.per_tx_usd ?? null,
      fee_swap_lo_usd: fee?.swap_lo_usd ?? null,
      fee_swap_hi_usd: fee?.swap_hi_usd ?? null,
      fee_quality: fee?.quality ?? null,
      fee_basis: fee?.basis ?? null,
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
  const effNet = rankBy('net_usd');
  const effNetHr = rankBy('net_per_hour_usd');

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
      eff_rank_net: effNet.get(r.slug)!,
      eff_rank_net_hour: effNetHr.get(r.slug)!,
      flip_condition: flip,
      // A bigger deposit locks more capital for the same time, and on a
      // swap leg it also pays a bigger pool fee (0.25% of the deposit), so
      // the tier's break-even moves with the deposit where the plan swaps.
      // The tier's net uses the same stated scenario at that deposit size.
      deposit_tiers: DEPOSIT_TIERS_USD.map((capital) => {
        const c = (r.category ?? '').toLowerCase();
        const swaps = c.includes('dex') || c.includes('yield') || c.includes('leveraged farm');
        const tierPool = swaps ? Math.round(capital * POOL_FEE_RATE * 100) / 100 : 0;
        const tierCost = r.time_hours * TIME_VALUE_USD_PER_HOUR + (r.network_fee_usd ?? 0) + tierPool;
        return {
          capital_usd: capital,
          implied_per_capital_usd: Math.round(r.implied_value_usd / capital),
          break_even_usd: Math.round(tierCost),
          net_usd: Math.round((sliceFor(r.implied_value_usd, capital, r.tvl_usd) - tierCost) * 100) / 100,
        };
      }),
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
    slice_usd: row.slice_usd,
    net_usd: row.net_usd,
    net_per_hour_usd: row.net_per_hour_usd,
    slice_low_usd: row.slice_low_usd,
    net_low_usd: row.net_low_usd,
    robust: row.robust,
    eff_rank_net: row.eff_rank_net,
    eff_rank_net_hour: row.eff_rank_net_hour,
    flip_condition: row.flip_condition,
    deposit_tiers: row.deposit_tiers,
    fee_chain: row.fee_chain,
    tx_count: row.tx_count,
    network_fee_usd: row.network_fee_usd,
    pool_fee_usd: row.pool_fee_usd,
    total_cost_usd: row.total_cost_usd,
    fee_unknown: row.fee_unknown,
    fee_per_tx_usd: row.fee_per_tx_usd,
    fee_swap_lo_usd: row.fee_swap_lo_usd,
    fee_swap_hi_usd: row.fee_swap_hi_usd,
    fee_quality: row.fee_quality,
    fee_basis: row.fee_basis,
    farm_steps: row.farm_steps,
  };
}

/** Top-20 overlap of the kept board under each ablated variant: how many of
 * the kept top 20 each simpler model keeps. The ablations re-score the same
 * ranked rows: fitted value only (no odds), a flat 0.25x TVL multiple, the
 * global-median ratio, one odds rate for every age, and the winsorized curve.
 * A top 20 that survives ablation is a ranking the model does not invent. */
export function ablationTop20(
  snapshot: Snapshot,
  fit: { validation: Validation; oddsTable: OddsBucket[]; globalOdds: number },
  board: BoardRow[],
): Array<{ label: string; kept: number }> {
  const { validation, globalOdds } = fit;
  const keptTop = new Set(board.slice(0, 20).map((r) => r.slug));
  const live = snapshot.protocols.filter((p) => p.mcap_usd !== null && p.mcap_usd > 0);
  const ys = live.map((p) => Math.log(p.mcap_usd! / p.tvl_usd));
  const globalMed = median(ys);
  const q05 = quantile(ys, 0.05);
  const q95 = quantile(ys, 0.95);
  const clipped = ys.map((v) => Math.min(q95, Math.max(q05, v)));
  const winsCoef = ols(
    live.map((p) => [1, Math.log(p.tvl_usd)]),
    clipped,
  );
  const bySlug = new Map(board.map((r) => [r.slug, r]));
  const variants: Array<{ label: string; value: (r: BoardRow) => number }> = [
    { label: 'fitted only, no odds', value: (r) => r.fitted_value_usd },
    { label: 'flat 0.25x TVL', value: (r) => r.tvl_usd * 0.25 * r.odds },
    { label: 'global-median ratio', value: (r) => r.tvl_usd * Math.exp(globalMed) * r.odds },
    { label: 'one odds rate, no age bucket', value: (r) => r.fitted_value_usd * globalOdds },
    {
      label: 'winsorized curve',
      value: (r) => Math.max(1, Math.round(fittedMcap(r.tvl_usd, winsCoef[0]!, winsCoef[1]!) * r.odds)),
    },
  ];
  return variants.map(({ label, value }) => {
    const top = [...board]
      .sort((a, b) => value(b) - value(a) || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0))
      .slice(0, 20)
      .filter((r) => keptTop.has(r.slug)).length;
    return { label, kept: top };
  });
}

/** Everything the dashboard renders, from the snapshot. */
export function buildRadar(snapshot: Snapshot): { board: BoardRow[]; radar: RadarData } {
  const fit = fitAndValidate(snapshot);
  const board = buildBoard(snapshot, fit);
  fit.validation.ablation_top20 = ablationTop20(snapshot, fit, board);
  const live = liveRows(snapshot);
  const earlyRows = board.filter((r) => !snapshot.watchlist.includes(r.slug));
  const early = earlyRows.length;
  const earlyAbove = earlyRows.filter((r) => r.tvl_usd >= snapshot.floor_usd).length;
  const earlyBelow = early - earlyAbove;
  const preToken = snapshot.protocols.filter(isPreToken).length;
  const coverage: Coverage = {
    total: snapshot.protocols.length,
    pre_token: preToken,
    token_recorded: snapshot.protocols.length - preToken,
    watchlist: snapshot.watchlist.length,
    early,
    early_above_floor: earlyAbove,
    early_below_floor: earlyBelow,
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
    board_sha256: '',
    validation: fit.validation,
    odds_table: fit.oddsTable,
    coverage,
    chain_fees: CHAIN_FEES,
    fee_unknown_rows: board.filter((r) => r.fee_unknown).length,
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
