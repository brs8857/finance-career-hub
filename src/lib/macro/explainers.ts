import type { Country, IndicatorId } from "./types";

// Plain-English explainers: what each indicator is, why markets care, and how
// it links to A-level / first-year economics and finance. Keep these accurate:
// they're meant to be quoted in interviews. Where details change (targets,
// meeting counts), the page links to the official source to verify.

export interface Explainer {
  title: string;
  what: Record<Country, string>;
  whyMarketsCare: string[];
  syllabus: string[];
}

export type ExplainerId = IndicatorId | "yield-curve";

export const EXPLAINERS: Record<ExplainerId, Explainer> = {
  "policy-rate": {
    title: "Policy interest rate",
    what: {
      UK: "Bank Rate is the interest rate the Bank of England pays on reserves that commercial banks hold with it. The nine-member Monetary Policy Committee (MPC) sets it, normally at eight scheduled meetings a year, to meet the government's 2% CPI inflation target.",
      US: "The Federal Open Market Committee (FOMC) sets a target range for the federal funds rate: the rate banks charge each other for overnight loans of reserves. It holds eight scheduled meetings a year. Its dual mandate is maximum employment and stable prices, with a 2% goal defined on the PCE price index.",
    },
    whyMarketsCare: [
      "It anchors borrowing costs across the economy: mortgages, business loans and savings rates all take their cue from it.",
      "Higher rates raise the discount rate used to value future cash flows, which tends to weigh on share prices, especially 'growth' companies whose profits are far in the future.",
      "Relative rates move currencies: if UK rates are expected to stay above US rates, sterling tends to strengthen against the dollar.",
      "Markets price the expected path of rates in advance, so prices react to surprises versus expectations rather than to the decision itself.",
    ],
    syllabus: [
      "Monetary policy transmission: rates → borrowing, saving, asset prices and the exchange rate → aggregate demand → inflation",
      "Inflation targeting and central bank independence (the Bank of England has set rates independently since 1997)",
      "Time value of money: discounting in DCF valuation",
    ],
  },
  cpi: {
    title: "CPI inflation",
    what: {
      UK: "The Consumer Prices Index tracks the prices of a representative basket of goods and services. The figure shown is the 12-month rate. The Bank of England's target is 2%; if inflation is more than 1 percentage point away from target, the Governor must write an open letter to the Chancellor explaining why.",
      US: "CPI for all urban consumers (CPI-U) from the Bureau of Labor Statistics, shown as the change on a year earlier (calculated by FRED from the seasonally adjusted index). The Fed's 2% goal is defined on a different measure, the PCE price index, which usually runs a little below CPI.",
    },
    whyMarketsCare: [
      "It drives interest-rate expectations: a higher-than-expected print usually pushes bond yields up and can strengthen the currency.",
      "Inflation erodes the real value of fixed payments, which matters for bondholders (fixed coupons) and for wage bargaining.",
      "Index-linked gilts and many contracts are tied to inflation measures, historically RPI in the UK.",
    ],
    syllabus: [
      "Measuring inflation: a weighted basket and index numbers; CPI vs CPIH vs RPI",
      "Demand-pull vs cost-push inflation",
      "Real vs nominal values, and real interest rates",
    ],
  },
  gdp: {
    title: "GDP growth",
    what: {
      UK: "Real gross domestic product (chained volume measure, seasonally adjusted). The headline is growth on the previous quarter, not annualised; underneath is growth on the same quarter a year earlier. The ONS publishes a first estimate about six weeks after the quarter ends, then revises it.",
      US: "Real GDP from the Bureau of Economic Analysis. The US reports quarterly growth at an annualised rate, roughly four times the UK-style quarterly figure, so compare the two with care. Underneath is growth on the same quarter a year earlier, which is comparable across countries.",
    },
    whyMarketsCare: [
      "Growth drives company revenues and profits, and tax receipts (and so how much the government needs to borrow).",
      "Weak growth raises the chance of rate cuts; strong growth alongside high inflation raises the chance of rate rises.",
      "A common rule of thumb calls two consecutive quarters of falling real GDP a 'technical recession'.",
    ],
    syllabus: [
      "Aggregate demand: AD = C + I + G + (X − M), and the circular flow of income",
      "Real vs nominal GDP, index numbers and seasonal adjustment",
      "The economic cycle and the output gap",
    ],
  },
  unemployment: {
    title: "Unemployment rate",
    what: {
      UK: "The ILO unemployment rate: the share of economically active people aged 16+ who have no job, have looked for work in the past four weeks and can start within two weeks. It comes from the Labour Force Survey as a rolling three-month average. The ONS has flagged quality concerns about falling LFS response rates in recent years, so treat small moves with caution.",
      US: "The headline (U-3) unemployment rate from the Bureau of Labor Statistics' household survey, published monthly in the Employment Situation report alongside non-farm payrolls.",
    },
    whyMarketsCare: [
      "A tight labour market pushes up wages, which feeds into services inflation, a key input to rate decisions.",
      "Rising unemployment is an early sign of weakening demand and usually increases expectations of rate cuts.",
      "The US jobs report is one of the most market-moving releases in the economic calendar.",
    ],
    syllabus: [
      "Types of unemployment: frictional, structural, cyclical and seasonal",
      "The ILO measure vs the claimant count",
      "The Phillips curve and the natural rate of unemployment (NAIRU)",
    ],
  },
  "yield-curve": {
    title: "Yield curve",
    what: {
      UK: "Government bond yields at different maturities on one day. UK points are SONIA (the overnight interest rate, used here to anchor the short end - it isn't a gilt yield) and the Bank of England's 5-, 10- and 20-year nominal par gilt yields.",
      US: "The US Treasury's daily par yield curve, from 1-month bills to 30-year bonds.",
    },
    whyMarketsCare: [
      "Normally the curve slopes upwards, because lenders want a higher return for tying money up for longer (the term premium).",
      "The short end tracks expected policy rates; the long end reflects expected growth and inflation, plus the term premium.",
      "An inverted curve (short yields above long yields) has come before many US recessions, but it is not a reliable timer.",
      "Gilt yields set the government's borrowing costs and feed into fixed-rate mortgage pricing through swap rates. After the September 2022 'mini-budget', gilt yields jumped and the Bank of England stepped in to buy long-dated gilts to restore market stability.",
    ],
    syllabus: [
      "Bond prices move inversely to yields",
      "Fiscal policy, government borrowing and the national debt",
      "Monetary policy transmission through market interest rates",
    ],
  },
};
