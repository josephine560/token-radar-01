[![make.fun](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/josephine560/token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/josephine560/token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01)

# Token Radar — pre-token protocols ranked by implied value

A static dashboard that reads a sealed DefiLlama snapshot (758 protocols, as of
2026-11-14), ranks the 200 pre-token protocols worth farming by an implied token
value, and gives each one a costed farm plan. Built for the make.fun bounty
[Build the best token launch radar](https://make.fun/bounty/token-radar-01).

## The model (radar-4; value curve unchanged from radar-3)

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

Coverage: 758 protocols accounted for — 200 ranked (40 watchlist + 160 early
below the floor), 142 pre-token counted but not ranked, 416 token-recorded set
aside (top 24 by market cap shown).

## Farm verdicts (radar-4)

The snapshot has no airdrop share and no fee, so no row promises dollars per
farmer. The verdict ranks effort: FARM is the top quarter by implied value with
peer odds at or above 0.35, THIN is the top half or odds at or above 0.55, the
rest is SKIP. Radar-4 keeps the verdict rule and totals (FARM 45 / THIN 60 /
SKIP 95) and makes the relative-priority case crisp instead: each row carries
implied value per $1 of capital locked and per hour spent — a priority index,
not a return, because the implied value is the whole protocol's token value,
not a per-farmer share — with an efficiency rank beside its absolute rank, the
$50 / $100 / $250 deposit tiers (time and break-even do not change with the
deposit; the snapshot gives no rule that a larger deposit earns a larger share,
so a bigger deposit only locks more capital), and a "what would flip this
verdict" line computed from the rank-50 and rank-100 implied-value lines.
Break-even is time cost only — hours at $25 an hour, an assumption the reader
can change on the dashboard — with the chain fee additional and unknown. Gas
is not in the snapshot; the steps say to check the chain fee first. Every row
says "records no token", never "has no token".

## Run it

Node 22.18+ (standard library only, no install):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input ../input/snapshot.json
```

That writes `out/board.json`, `out/data.js`, `out/dashboard/`,
`out/screenshots/` and `out/dossier.json`. Open `out/dashboard/index.html`
in a browser; it renders with no network. Screenshots: the board, a protocol
detail view, and a filtered view.
