[![make.fun](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/josephine560/token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/josephine560/token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01)

# Token Radar — pre-token protocols ranked by implied value

A static dashboard that reads a sealed DefiLlama snapshot (758 protocols, as of
2026-11-14), ranks the 198 pre-token protocols worth farming by an implied token
value, and gives each one a costed farm plan. Built for the make.fun bounty
[Build the best token launch radar](https://make.fun/bounty/token-radar-01).

## The model (radar-5; value curve unchanged from radar-3)

Implied value is fitted from the snapshot itself, not from a hand-kept list:

```
implied = fitted_mcap(TVL) x odds(age)
log(mcap / TVL) = 6.965 - 0.478 x log(TVL)
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

Radar-5 re-tested the remaining principled variants offline (22 variants,
same n=128, leave-one-out plus walk-forward plus repeated 5-fold): a two-stage
classify-then-fit (1.228), category shrinkage n/(n+50) (1.233), winsorized
(1.257), Theil-Sen (1.255), piecewise TVL terciles (1.264), a hinge at median
log TVL (1.267), a joint log TVL + growth + log age fit (1.287), a log TVL x
growth interaction (1.366) and a chain-count term (1.344). None beats the kept
curve's 1.223, so the curve stays — and the three closest rejections are now
computed at run time and shown on the dashboard, so the reader sees the
comparison instead of taking it on trust. The joint fit's walk-forward (1.214)
looks better, but its test set is entirely young protocols with no age overlap
with the training set, so it is an extrapolation test, not an override of
leave-one-out; its growth coefficient also flips between the full sample
(-3.77) and the walk-forward training set (-0.55).

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

## Farm verdicts (radar-5)

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

## Chain fees (radar-5; researched, not assumed)

Gas is not in the snapshot, so every fee was researched from public trackers
on 2026-11-22 (growthepie, L2Fees.info, GasNow, DataWallet, DeFiStar,
OpenChainBench, Ghostdrive, GemWallet trackers, Monad docs). One DEX swap's
network fee, USD, then the conservative per-transaction figure the farm math
uses (the range's high end):

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

A plan is 3 + ceil(holdDays/7) transactions (approve, setup, one a week,
claim), so the network fee is that count times the per-transaction figure.
45 of the 198 rows sit on chains with no reliable public figure (Flare,
Katana, Arc, Hemi, Pharos, Plume Mainnet, Ink, Stable, TAC, Mezo, Citrea,
Noble, Bittensor, Fantom, Plasma, Ripple, Provenance, RISE and the long tail)
— those rows say the fee is unknown rather than quoting a guess, and their
break-even is time cost only. Gotchas priced into the steps: a first swap
costs approve + swap; a first Solana token account costs ~0.00204 SOL rent
(~$0.16, refundable); Tron USDT transfers cost $1–$4 when TRX is burned for
energy; bridging (~$0.30–$4 per $500 stablecoin bridge) is usually the biggest
fee in a plan; a round trip is 4–6 transactions. Gas prices move daily, so
every figure is a November-2026 snapshot. Every row says "records no token",
never "has no token".

## Run it

Node 22.18+ (standard library only, no install):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input ../input/snapshot.json
```

That writes `out/board.json`, `out/data.js`, `out/dashboard/`,
`out/screenshots/` and `out/dossier.json`. Open `out/dashboard/index.html`
in a browser; it renders with no network. Screenshots: the board, a protocol
detail view, and a filtered view.
