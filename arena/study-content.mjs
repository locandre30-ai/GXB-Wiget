export const ARCHIVES = [
  {
    id: 'wall-street-1929', title: '1929 Wall Street Crash', period: 'October 1929',
    summary: 'A long rise in U.S. share prices ended in a sharp October selloff.',
    context: 'Broker lending financed some stock purchases. Falling prices left leveraged investors exposed to margin calls.',
    behavior: 'The Dow fell nearly 13% on October 28 and nearly 12% the following day.',
    instruments: 'Dow Jones Industrial Average and U.S. equities', concepts: 'Leverage, margin calls, drawdown',
    study: 'Compare the crash with the later banking crises. Distinguish a stock-market event from the broader depression.',
    sources: [['Federal Reserve History · Stock Market Crash of 1929', 'https://www.federalreservehistory.org/essays/stock-market-crash-of-1929'],
      ['Federal Reserve History · The Great Depression', 'https://www.federalreservehistory.org/essays/great-depression/']],
    categories: ['Market fundamentals', 'Risk management'], replay: null
  },
  {
    id: 'dot-com-2000', title: '2000 Dot-com Bubble', period: '2000–2002',
    summary: 'Technology and internet shares lost much of their late-1990s gains as expectations for profitability changed.',
    context: 'Early 2000 brought rapid growth and policy tightening. Investors subsequently reassessed technology earnings and valuations.',
    behavior: 'The tech-heavy Nasdaq peaked in March 2000 and finished the year nearly 40% below its 1999 close.',
    instruments: 'Nasdaq Composite and broad U.S. equity indexes', concepts: 'Valuation, sector concentration, expectations',
    study: 'Compare a technology-heavy index with a broader benchmark through the same period.',
    sources: [['Federal Reserve · February 2001 Monetary Policy Report', 'https://www.federalreserve.gov/boarddocs/hh/2001/february/ReportSection2.htm'],
      ['Federal Reserve · What happened to the new economy?', 'https://www.federalreserve.gov/boarddocs/speeches/2001/20010606/']],
    categories: ['Stocks and ETFs', 'Market structure'], replay: null
  },
  {
    id: 'financial-crisis-2008', title: '2008 Global Financial Crisis', period: '2007–2009',
    summary: 'Housing and mortgage losses spread through financial markets as credit conditions worsened.',
    context: 'Falling home prices heightened mortgage-default risks and strained holders of mortgage-linked assets. The U.S. recession began in December 2007.',
    behavior: 'Financial stress intensified in 2008. The S&P 500 fell about 57% from its October 2007 peak to its March 2009 trough.',
    instruments: 'S&P 500, mortgage-backed securities and credit markets', concepts: 'Credit risk, funding liquidity, systemic risk',
    study: 'Follow the link between housing losses and funding stress. Compare equity prices with indicators of credit conditions.',
    sources: [['Federal Reserve History · The Great Recession', 'https://www.federalreservehistory.org/essays/great-recession-of-200709'],
      ['Federal Reserve History · The Great Recession and Its Aftermath', 'https://www.federalreservehistory.org/essays/great-recession-and-its-aftermath']],
    categories: ['Risk management', 'Market fundamentals'], replay: null
  },
  {
    id: 'pandemic-2020', title: '2020 Pandemic Market Shock', period: 'February–March 2020',
    summary: 'The rapid spread of COVID-19 disrupted economic activity and prompted a sharp repricing of risk.',
    context: 'Uncertainty about the outbreak and its economic impact put households, firms and markets under sudden stress.',
    behavior: 'Equities fell sharply, volatility rose and corporate spreads widened. U.S. Treasury markets also showed strain in March.',
    instruments: 'U.S. equities, VIX, Treasuries and corporate bonds', concepts: 'Volatility, credit spreads, liquidity',
    study: 'Compare price moves and market functioning. An instrument can have strong credit quality and still face liquidity stress.',
    sources: [['Federal Reserve · May 2020 Financial Stability Report', 'https://www.federalreserve.gov/publications/2020-may-financial-stability-report-asset-valuation.htm'],
      ['Federal Reserve · June 2020 Monetary Policy Report', 'https://www.federalreserve.gov/monetarypolicy/files/20200612_mprfullreport.pdf']],
    categories: ['Risk management', 'Trading psychology'], replay: null
  },
  {
    id: 'inflation-2022', title: '2022 Inflation and Interest Rate Cycle', period: '2022',
    summary: 'High inflation shifted expectations for U.S. policy rates and tightened financial conditions.',
    context: 'U.S. CPI rose 9.1% over the 12 months through June. The Fed’s target range reached 4.25–4.50% in December.',
    behavior: 'Treasury yields rose and broad equity indexes fell sharply in the first half of the year, then traded unevenly.',
    instruments: 'U.S. Treasury yields and broad equity indexes', concepts: 'Inflation, rate expectations, discount rates',
    study: 'Compare release dates, expectations and price responses. Separate an official policy change from what markets already priced in.',
    sources: [['BLS · June 2022 CPI', 'https://www.bls.gov/news.release/archives/cpi_07132022.htm'],
      ['Federal Reserve · Policy rate history', 'https://www.federalreserve.gov/fomc/fundsrate.htm'],
      ['Federal Reserve · March 2023 Monetary Policy Report', 'https://www.federalreserve.gov/monetarypolicy/2023-03-mpr-part1.htm']],
    categories: ['Market fundamentals', 'Gold'], replay: null
  }
];

export const KNOWLEDGE = [
  ['corrections', 'Market corrections', 'A correction is a meaningful decline from a recent high. A 10% drop is a common convention.', 'Identify the benchmark, recent peak and timeframe before comparing declines.', 'Market structure'],
  ['bull-bear', 'Bull and bear markets', 'These labels describe broadly rising or falling markets over time. A 20% decline is a common bear-market convention.', 'Decide which benchmark and period you mean. A rally can happen during a broader downtrend.', 'Market structure'],
  ['earnings', 'Earnings season', 'Public companies report results on their individual schedules, often in quarterly clusters.', 'Prices can respond to guidance and differences between results and expectations. Check the company release time.', 'Stocks and ETFs'],
  ['fed', 'Federal Reserve decisions', 'The FOMC sets the target range for the federal funds rate and communicates its policy outlook.', 'Compare the decision and statement with prior expectations before interpreting a move.', 'Market fundamentals', 'https://www.federalreserve.gov/monetarypolicy/fomc.htm'],
  ['inflation', 'Inflation reports', 'CPI tracks price changes for a basket of consumer goods and services. Headline and core figures cover different components.', 'Check the measurement period and compare the release with expectations. Monthly and annual changes answer different questions.', 'Market fundamentals', 'https://www.bls.gov/cpi/'],
  ['rates', 'Interest rates', 'Rates represent the cost of borrowing or the return on lending. Different maturities can move differently.', 'Watch the distinction between policy rates, market yields and expectations when studying asset valuations.', 'Market fundamentals'],
  ['gold-dollar', 'Gold and the US dollar', 'XAU/USD quotes gold in U.S. dollars. The dollar, real yields and demand can all influence gold.', 'Compare the timing of moves in gold and the dollar. The relationship can change over time.', 'Gold'],
  ['bubbles', 'Market bubbles', 'A bubble describes unusually elevated prices tied to strong expectations that later prove difficult to sustain.', 'Study valuation alongside leverage, concentration and positioning. Near-term timing remains uncertain.', 'Market fundamentals'],
  ['liquidity', 'Liquidity and volume', 'Volume counts trading activity. Liquidity concerns how readily an order can trade near the current price.', 'Look at spreads or execution conditions as well as volume. Busy markets can still move sharply.', 'Chart reading'],
  ['sessions', 'Trading sessions', 'Markets follow venue-specific schedules. Some have regular and extended sessions, while cryptocurrency often trades continuously.', 'Check the instrument’s venue, time zone and holiday calendar before comparing moves.', 'Market fundamentals'],
  ['levels', 'Support and resistance', 'These are price areas where buying or selling previously halted or slowed a move.', 'Treat levels as areas to watch. Decide what evidence would confirm a hold or break.', 'Support and resistance'],
  ['accumulation', 'Accumulation and distribution', 'These describe interpretations of sustained buying or selling, often studied through price and volume behavior.', 'Look for multiple observations. A chart alone cannot establish who is buying or why.', 'Market structure']
].map(([id, title, explanation, significance, category, reference]) => ({ id, title, explanation, significance, categories: [category], reference }));

export const REFLECTIONS = [
  'I do not chase the market. I prepare myself for opportunity.',
  'My capital is a resource. I allocate it with intention.',
  'I observe before I act.',
  'I do not need to participate in every market movement.',
  'My discipline is not determined by the outcome of a single trade.',
  'I accept uncertainty without abandoning my plan.',
  'Patience is an active part of my strategy.',
  'I value consistency over excitement.'
].map((text, index) => ({ id: 'gxb-' + (index + 1), text, source: 'GxB', audio: null }));
