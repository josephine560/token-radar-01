[![make.fun](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/josephine560/token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/josephine560/token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01)

# Token Radar — pre-token protocols ranked by implied value

A static dashboard that reads a sealed DefiLlama snapshot (758 protocols, as of
2026-11-14), ranks the 198 pre-token protocols worth farming by an implied token
value, and gives each one a costed farm plan. Built for the make.fun bounty
[Build the best token launch radar](https://make.fun/bounty/token-radar-01).

## The model (radar-8; two-segment value curve, blended)

Implied value is fitted from the snapshot itself, not from a hand-kept list:

```
implied = fitted_mcap(TVL) x odds(age)
log(mcap / TVL) = 1.714 - 0.154 x log(TVL) below $32.6M TVL
                = 7.434 - 0.502 x log(TVL) above $32.6M TVL
blended linearly over ±0.5 log TVL around the split, so the curve never jumps
```

The curve is fitted at run time by least squares on the 128 token-recorded
protocols that carry a positive market cap, and validated before it is trusted:

| Test | Median absolute log error |
| --- | --- |
| Fitted curve, leave-one-out | 1.22 (about x3.4) |
| Global-median baseline, leave-one-out | 1.62 |
| Category-median baseline, leave-one-out | 1.71 |
| Starter formula (TVL x 0.25), same 128 | 1.63 |
| Walk-forward (listed before Jun 2025 -> after, n=20) | 1.43 vs 1.64 baseline |

R-squared is 0.168: the curve beats every baseline, and it is still a wide
estimate, so every row carries a 10th-90th percentile band and a rank range from
200 bootstrap refits. A growth term and an age term were fitted and dropped:
each made leave-one-out error worse (1.33 and 1.34).

Radar-3 re-tested the value curve and kept it unchanged: a quadratic log(TVL)
term (1.22, no better, and worse on repeated 5-fold checks), category
shrinkage (1.25, worse), imputing the 272 token-recorded but market-cap-null
protocols at the curve (1.22, no change — imputed points lie on the curve),
at the curve minus 1.0 or at category medians (worse), adding the 15
market-cap-zero protocols as tiny values (far worse), and Huber, trimmed,
k-nearest-neighbour and ridge fits (all worse on leave-one-out). Market-cap-null
is not low market cap: the null set holds Binance CEX at $116B TVL with symbol
BNB and no market cap, and the chance a token-recorded protocol carries a
market cap does not rise with TVL (0.41 / 0.25 / 0.30 / 0.28 across quartiles).

Radar-6 re-tested five more principled variants at run time (same n=128,
leave-one-out): adding log age (1.231), median regression / LAD (1.302),
a trimmed fit with 5% of the tails dropped (1.261), TVL-quintile bin medians
(1.370), and an isotonic (monotone) fit (1.390). All lose to the kept curve's
1.223, so the curve stays — and all five are now computed at run time and
shown on the dashboard alongside the earlier rejections. Radar-6 also runs a
top-20 ablation at run time: the kept top 20 survives fitted-only 17/20, a
flat 0.25x TVL curve 18/20, a global-median ratio 18/20, one odds rate with no
age bucket 17/20, and the winsorized curve 20/20. A top 20 that survives
simpler models is a ranking the model does not invent. Six more variants
win on walk-forward alone but lose on leave-one-out — log age, ridge shrinkage
toward 0, growth-weighted fits, a trimmed fit, TVL-rank percentiles and
TVL-quintile bins — and are not adopted: the walk-forward test set (n=20,
newer listings) is systematically easier for flatter curves, so leave-one-out
is the binding bar, and a term is kept only if it wins on both.

Radar-7 re-tested 20 more principled variants (same n=128, leave-one-out
plus walk-forward): Huber and Tukey robust fits, kNN (k=5/10/20),
piecewise-linear quartile knots, a grid-searched hinge, dropping the top-5 and
top-10 TVL giants, log(mcap) direct, category dummies with ridge, TVL-weighted
fits, log age with a missing-age dummy, fixed slope -0.5, recency-weighted
OLS, dropping high-volatility rows, and log TVL + growth. Eight win on
walk-forward alone, nine lose on both, two are identical to the kept curve —
and one passes both medians: a two-segment split at median log TVL (LOO 1.208,
walk-forward 1.335). Unblended it jumps 26% at the $32.6M split, so radar-7
declined it; radar-8 adopts it blended linearly over ±0.5 log TVL
($19.8M-$53.7M), so the curve bends instead of jumping — the blend keeps the
gains (LOO 1.212, walk-forward 1.335, wins 54/128; repeated 5-fold median
1.249 vs 1.270 for the single curve) while the two protocols either side of
the line (Plasma One $31.9M, Aegis YUSD $34.5M) price 2.8% apart instead
of 29%. The mean error is still worse than the single curve's (1.622 vs 1.596),
and it wins on fewer than half the protocols — a median win, disclosed on the
dashboard, not a sweep. Shrinkage toward the single curve and wider blends
fail leave-one-out (1.224 and 1.225); moving the split to q=0.55 passes
(1.182 / 1.307) but picks the split by the validation numbers, so it is not
adopted. The odds model was also re-tested: a logistic regression on
age-bucket dummies plus log TVL ties the bucket odds (Brier 0.2128 vs 0.2135,
log loss 0.6170 vs 0.6173) — a tie in substance, not a win — so the buckets
stay.

Radar-3's one model change is the odds. Protocols whose listing date the
snapshot does not record used to get the overall token rate (0.549); 113 such
protocols record a token 79% of the time, so they now get their own smoothed
bucket (0.752). Checked by 4-times-5-fold cross-validation on token presence
over all 758 protocols, computed at run time: Brier 0.213 with the bucket
against 0.221 without, log loss 0.617 against 0.634. A logistic regression on
age, TVL, growth and chain count did worse than either (0.233). Odds are the
smoothed share of peer protocols at that age that record a token — a peer
benchmark, not a launch forecast. Only 128 of 416 token-recorded protocols
carry a positive market cap, so the fit sample is selected; the dashboard
says so. The change raises the implied value of the 11 age-not-recorded rows
by x1.37; 117 of the 200 rows change rank as a consequence, the biggest
movers Abstract #136 to #94, Kava Mint #124 to #85 and Sx Rollup Bridge #104
to #66, and 10 rows change verdict (net counts unchanged). Lightning Network
rises from #7 to #5 ($13.1M to $18.0M implied); the other top-10 rows keep
their ranks except Upshift, #5 to #6.

Coverage: 758 protocols accounted for — 198 ranked (40 watchlist + 158 early),
144 pre-token counted but not ranked, 416 token-recorded set aside (top 24 by
market cap shown). Radar-5 corrects the board rule: radar-4 ranked only the
40 watchlist protocols plus the 160 pre-token protocols below the $50M floor,
and so missed 20 rankable pre-token protocols at or above the floor — the
watchlist rule excludes bridged, staked, wrapped and exchange products, and
that exclusion, not the floor, is what decides rankability. Applying the
exclusion without the floor adds those 20 (new #1 is Sentora Curator,
$35.97M implied) and removes 2 that radar-4 ranked wrongly under the weaker
rule. A first attempt at the wider rule put WBTC, binance-staked-eth,
base-bridge, binance-bitcoin and coinbase-bridge at the top; the full
exclusion (category, versioned names, wrapped/staked/staking words, exchange
name prefixes) removes them.

## Farm verdicts (radar-8; nets re-priced by the blended curve)

The snapshot has no airdrop share and no fee, so no row promises dollars per
farmer. The verdict ranks effort: FARM is the top quarter by implied value with
peer odds at or above 0.35, THIN is the top half or odds at or above 0.55, the
rest is SKIP (FARM 44 / THIN 58 / SKIP 96 at the 198-row board size; the
quartile lines are rank 50 and rank 99). Each row carries implied value per $1
of capital locked and per hour spent — a priority index, not a return, because
the implied value is the whole protocol's token value, not a per-farmer share
— with an efficiency rank beside its absolute rank, the $50 / $100 / $250
deposit tiers, and a "what would flip this verdict" line computed from the
rank-50 and rank-99 implied-value lines. Break-even is time cost — hours at
$25 an hour, an assumption the reader can change on the dashboard — plus the
plan's network fees plus the 0.25% pool fee where a plan swaps. The deposit
tiers' break-even now moves with the deposit on swap legs, because the pool
fee scales with the amount swapped.

Radar-6 added a net figure to every row, under one stated scenario that the
dashboard prints next to it: the airdrop pool is 7% of the implied value, the
farmed capital is 1% of TVL, and a farmer's slice is proportional to their
deposit within the farmed capital; net is the slice minus all the plan's
costs (time at $25/hour, network fees, pool fee). The board sorts by net and
by net per hour, the lede names the top three FARM rows by net per hour, and
a row is marked ROBUST when its net stays positive even at the band's 10th
percentile. The deposit and drop-share controls re-price every net live. The
scenario is an assumption, not a forecast — the snapshot carries no airdrop
share, so no net is a promised payout; it is the dollars that would have to
arrive for the row to pay, under assumptions the reader can change.

## Chain fees (radar-7; researched, not assumed)

Gas is not in the snapshot, so every fee was researched from public trackers
on 2026-11-22, 2026-11-23 and 2026-11-27 (growthepie, L2Fees.info, GasNow, DataWallet,
DeFiStar, OpenChainBench, Ghostdrive, GemWallet trackers, Monad docs). One DEX
swap's network fee, USD, then the conservative per-transaction figure the farm
math uses (the range's high end):

| Chain | One swap (network) | Per tx used | How measured |
| --- | --- | --- | --- |
| Ethereum | $0.02–$0.25 | $0.25 | measured median |
| Arbitrum | $0.007–$0.024 | $0.024 | measured median |
| Binance (BNB) | $0.005–$0.01 | $0.01 | measured median |
| Base | $0.002–$0.018 | $0.018 | measured median |
| Solana | $0.001–$0.01 | $0.01 | measured median |
| Avalanche | ~$0.009 | $0.009 | measured median |
| Polygon | $0.003–$0.006 | $0.006 | measured median |
| Optimism | <$0.001–$0.031 | $0.031 | measured median (sources disagree ~30x) |
| Bitcoin | no swap; transfer $0.01–$0.09 | $0.09 | measured median |
| Tron | $1–$4 | $4 | estimate |
| Robinhood Chain | ~$0.01 | $0.01 | estimate |
| Linea | $0.028–$0.037 | $0.037 | measured median |
| Sonic | ~$0.0002 | $0.0002 | estimate |
| Sui | $0.0007–$0.0013 | $0.0013 | measured median |
| Mantle | ~$0.002–$0.005 | $0.005 | estimate |
| Scroll | $0.001–$0.052 | $0.052 | measured median (sources disagree ~50x) |
| Berachain | ~$0.0001 | $0.0001 | estimate |
| xDai (Gnosis) | <$0.001 | $0.001 | measured median |
| Celo | ~$0.002 | $0.002 | estimate |
| zkSync Era | $0.02–$0.048 | $0.048 | measured median |
| Cardano | no swap; transfer ~$0.023 | $0.023 | measured median |
| Unichain | ~$0.0003–$0.0005 | $0.0005 | measured median |
| TON | no swap; transfer $0.0004–$0.001 | $0.001 | measured median |
| Sei | <$0.001 | $0.001 | estimate |
| Stellar | <$0.0001 | $0.0001 | estimate |
| Algorand | <$0.001 | $0.001 | estimate |
| Aptos | $0.0001–$0.0005 | $0.0005 | estimate |
| Blast | ~$0.025 | $0.025 | measured median |
| Monad | $0.0005–$0.001 | $0.001 | measured median |
| Hyperliquid L1 (HyperEVM gas) | $0.033–$0.062 | $0.062 | measured median |
| Flare | $0.0001–$0.001 | $0.001 | estimate |
| Ink | $0.001–$0.005 | $0.005 | estimate |
| Provenance | no swap; $0.15/message | $0.15 | estimate |
| Plasma | $0.00001–$0.0001 | $0.001 | measured median |
| Arc | $0.003–$0.045 | $0.05 | estimate |
| Ripple | ~$0.000011 | $0.001 | measured median |
| Noble | no DEX; transfer $0.01–$0.10 | $0.10 | estimate |
| Manta | $0.0009–$0.0017 | $0.002 | measured median |
| World Chain | $0.001–$0.005 | $0.005 | estimate |
| Kava | <$0.0001 | $0.001 | measured median |
| Morph | $0.01–$0.03 | $0.03 | estimate |
| RSK | $0.17–$0.25 | $0.25 | measured median |
| Ronin | $0.0003–$0.0006 | $0.001 | measured median |
| Proton | no fee (resource model) | $0.001 | measured median |
| Tempo | $0.0001–$0.0018 | $0.002 | measured median |
| Reya Network | $0.00001–$0.002 | $0.002 | measured median |
| Starknet | $0.10–$0.35 | $0.35 | estimate |
| Strato | $0.01 flat | $0.01 | measured median |
| Stable | $0.0001–$0.0002 | $0.001 | measured median |
| Klaytn (Kaia) | $0.0002–$0.001 | $0.001 | measured median |
| Bifrost Network | ~$0.006 | $0.01 | estimate |
| Qubic | no swap; transfer-cost proxy | $0.005 | estimate |
| Stacks | $0.03–$0.79 | $0.80 | measured median |
| Fluent | $0.0003–$0.001 | $0.001 | measured median |
| Plume Mainnet | $0.002–$0.02 | $0.02 | measured median |
| RISE | no swap; avg tx ~$0.0016 | $0.005 | measured average |
| BSquared | $0.0001–$0.001 | $0.001 | measured average |
| Bittensor | no swap; avg tx $0.30–$0.70 | $0.70 | estimate |
| Pharos | $0.03–$0.10 | $0.10 | estimate |
| Mezo | $0.02–$0.10 | $0.10 | estimate |
| XION | no swap; avg tx <$0.0001 | $0.001 | estimate |
| Canton | no swap; ~$1 per tx | $1.00 | estimate |

A plan is 3 + ceil(holdDays/7) transactions (approve, setup, one a week,
claim), so the network fee is that count times the per-transaction figure.
No row lacks a reliable fee figure: radar-7 resolved the last seven chains
(RISE, BSquared, Bittensor, Pharos, Mezo, XION, Canton), so every break-even
now prices its network fees. Gotchas priced
into the steps: a first swap costs approve + swap; a first Solana token
account costs ~0.00204 SOL rent (~$0.16, refundable); Tron USDT transfers
cost $1–$4 when TRX is burned for energy; bridging (~$0.30–$4 per $500
stablecoin bridge) is usually the biggest fee in a plan; a round trip is
4–6 transactions. Three chains are expensive enough to change a verdict:
Canton $1.00, Stacks $0.80 and Bittensor $0.70 per transaction. World Chain
swaps may carry a 1%
World Money app fee on top (an app fee, not a network fee, and not in the farm
math). Noble, Provenance, Canton and Bittensor have no DEX swap — their
figures are transfer or average-transaction costs, and the plans say so. Gas
prices move daily, so every figure is a
November-2026 snapshot. Every row says "records no token", never "has no
token".

## Run it

Node 22.18+ (standard library only, no install):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input ../input/snapshot.json
```

That writes `out/board.json`, `out/data.js`, `out/dashboard/`,
`out/screenshots/` and `out/dossier.json`. Open `out/dashboard/index.html`
in a browser; it renders with no network. Screenshots: the board, a protocol
detail view, and a filtered view.
