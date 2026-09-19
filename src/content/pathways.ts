// Career pathways guide. Details change every recruitment cycle, so every
// pathway links to official sources and the page shows LAST_REVIEWED.
//
// Facts checked against official pages on 2026-09-19:
// - ACA (ICAEW): 15 exams over Certificate, Professional and Advanced levels;
//   at least 450 days of practical work experience, normally 3-5 years;
//   ICAEW describes this as the "existing" ACA - a redesign may be coming.
// - ACCA: 13 exams (Applied Knowledge, Applied Skills, Strategic Professional),
//   36 months' relevant experience plus 9 performance objectives, Ethics and
//   Professional Skills module; ACCA has published a "future qualification" redesign.
// - CIMA (CGMA): Operational, Management, Strategic levels; 9 objective tests
//   and 3 case study exams; at least 3 years' verified practical experience.
// - GES Assistant Economist: first or 2:1 in economics (joint degrees at least
//   50% economics, covering micro and macro) or a postgraduate economics degree;
//   GES also runs a degree apprenticeship.
// Keep specific claims to what's verified; otherwise describe and link.

export const LAST_REVIEWED = "2026-09-19";

export type PathwayCategory = "Accountancy" | "Banking & investment" | "Economics & policy";

export interface Source {
  label: string;
  url: string;
}

export interface Pathway {
  id: string;
  name: string;
  category: PathwayCategory;
  /** One line for the comparison table. */
  summary: string;
  typicalEntry: string;
  qualification: string;
  goodFitIf: string;
  whatItInvolves: string[];
  entryRoutes: string[];
  qualifications: string[];
  atYourStage: string[];
  /** Things that are known to be changing - shown as a warning. */
  changing?: string;
  sources: Source[];
}

const PROSPECTS = "https://www.prospects.ac.uk/job-profiles";

export const PATHWAYS: Pathway[] = [
  {
    id: "aca",
    name: "Chartered Accountant (ACA)",
    category: "Accountancy",
    summary: "ICAEW's chartered qualification, usually earned on a training contract - often in audit or tax at an accountancy firm.",
    typicalEntry: "Graduate or school-leaver training contract",
    qualification: "ACA (ICAEW)",
    goodFitIf: "You want a structured, highly regarded qualification and exposure to many businesses.",
    whatItInvolves: [
      "Most trainees start in audit (checking that companies' financial statements give a true and fair view), tax or advisory at an accountancy firm; some train in industry or the public sector.",
      "Work alternates with study blocks and exams, typically supported by your employer.",
      "Qualified ACAs move into roles across finance: financial reporting, transaction services, corporate finance, industry finance teams, and beyond.",
    ],
    entryRoutes: [
      "Graduate training contracts with an ICAEW authorised training employer (from the Big Four to mid-tier and smaller firms). Any degree subject is usually accepted.",
      "School-leaver programmes and apprenticeships leading to the ACA.",
      "Spring weeks, insight days and summer internships at accountancy firms, which can lead to training-contract offers.",
    ],
    qualifications: [
      "15 exams across three levels: Certificate, Professional and Advanced (the Case Study exam comes last).",
      "At least 450 days of practical work experience, plus professional development and ethics requirements.",
      "Normally takes three to five years.",
    ],
    atYourStage: [
      "Look for spring weeks and insight events at accountancy firms - many open in the autumn and some recruit on a rolling basis.",
      "Check each firm's academic requirements (some ask for specific A-level or degree grades; others have removed them).",
      "Practise the three-statement and double-entry flashcards - audit and tax interviews often test basic accounting understanding and why it matters to clients.",
      "Build commercial awareness about the firms' clients: listed companies, audit reform, tax policy changes.",
    ],
    changing: "ICAEW refers to the 'existing' ACA structure - check for changes to exams before you start.",
    sources: [
      { label: "ICAEW: the ACA qualification", url: "https://www.icaew.com/learning-and-development/aca" },
      { label: "Prospects: chartered accountant", url: `${PROSPECTS}/chartered-accountant` },
    ],
  },
  {
    id: "acca",
    name: "Chartered Certified Accountant (ACCA)",
    category: "Accountancy",
    summary: "A globally recognised accountancy qualification you can take while working in practice, industry or the public sector.",
    typicalEntry: "Any finance role; also school-leaver routes",
    qualification: "ACCA",
    goodFitIf: "You want flexibility over where you work and study, or a qualification recognised internationally.",
    whatItInvolves: [
      "ACCA members work in audit and practice, but many are in industry: financial reporting, management accounting, finance business partnering, internal audit.",
      "You don't need a training contract with an authorised firm - experience can be gained in many kinds of organisation, signed off by a supervisor.",
    ],
    entryRoutes: [
      "Graduate or school-leaver roles in finance teams, accountancy firms or public sector bodies that support ACCA study.",
      "Apprenticeships that include the ACCA qualification.",
      "Relevant degrees can give exemptions from some exams - check ACCA's exemptions tool.",
    ],
    qualifications: [
      "13 exams across three levels: Applied Knowledge, Applied Skills and Strategic Professional.",
      "An Ethics and Professional Skills module.",
      "36 months' relevant work experience and nine performance objectives.",
    ],
    atYourStage: [
      "If you already know you want accountancy, compare ACCA and ACA routes at firms you like - some offer both.",
      "Check which exams your degree might exempt you from.",
      "Get any finance-team work experience you can; it all helps with the practical experience requirement later.",
    ],
    changing: "ACCA has published plans for a 'future ACCA Qualification' - check the current structure.",
    sources: [
      { label: "ACCA: qualification overview", url: "https://www.accaglobal.com/gb/en/qualifications/glance/acca/overview.html" },
      { label: "Prospects: chartered certified accountant", url: `${PROSPECTS}/chartered-certified-accountant` },
    ],
  },
  {
    id: "cima",
    name: "Management Accountant (CIMA / CGMA)",
    category: "Accountancy",
    summary: "Management accounting for business decisions - budgeting, forecasting, performance and strategy inside companies.",
    typicalEntry: "Finance graduate schemes in industry",
    qualification: "CIMA Professional Qualification (CGMA)",
    goodFitIf: "You'd rather help run a business than audit one.",
    whatItInvolves: [
      "Working inside organisations: budgeting and forecasting, costing, analysing performance, and advising managers on decisions.",
      "Common employers are large companies' finance graduate schemes (retail, consumer goods, energy, technology, manufacturing) and the public sector.",
    ],
    entryRoutes: [
      "Finance graduate schemes in industry that sponsor CIMA study.",
      "Apprenticeships in finance teams.",
      "An entry-level certificate is available for those without a relevant degree or qualification.",
    ],
    qualifications: [
      "Three levels - Operational, Management and Strategic - with nine objective tests and three case study exams in total.",
      "At least three years of verified, relevant practical experience.",
      "Leads to membership and the Chartered Global Management Accountant (CGMA) designation.",
    ],
    atYourStage: [
      "Look at industry finance schemes, not just accountancy firms - they often recruit with different timelines.",
      "Practise explaining how a business makes money and what drives its costs; case-study interviews are common.",
    ],
    sources: [
      { label: "AICPA & CIMA: the CGMA Professional Qualification", url: "https://www.aicpa-cima.com/resources/landing/cimas-cgma-professional-qualification" },
      { label: "AICPA & CIMA: CGMA designation", url: "https://www.aicpa-cima.com/resources/landing/cgma-designation" },
    ],
  },
  {
    id: "investment-banking",
    name: "Investment banking",
    category: "Banking & investment",
    summary: "Advising companies on mergers and acquisitions and helping them raise money through shares and debt.",
    typicalEntry: "Spring week → summer internship → analyst",
    qualification: "None required; on-the-job training",
    goodFitIf: "You enjoy financial modelling, deals and fast-paced teamwork - and can handle long hours.",
    whatItInvolves: [
      "Corporate finance / M&A: advising on buying, selling and merging companies.",
      "Capital markets (ECM / DCM): helping companies raise equity or debt, for example IPOs and bond issues.",
      "Junior analysts build financial models (DCFs, comparable companies), prepare pitch books and support due diligence.",
    ],
    entryRoutes: [
      "Spring weeks, usually for first-year undergraduates (or second years on some longer courses).",
      "Summer internships in your penultimate year - the main route to graduate analyst offers.",
      "Off-cycle internships, and school-leaver or degree apprenticeship programmes at some banks.",
    ],
    qualifications: [
      "No formal qualification needed to start; banks train new analysts.",
      "Firms may require regulatory training or exams once you join.",
      "Some bankers later take the CFA Program or a master's, but it isn't required for entry.",
    ],
    atYourStage: [
      "Target spring weeks early - applications often open in the autumn, and many banks recruit on a rolling basis.",
      "Know the corporate finance flashcards cold: DCF, WACC, EV vs equity value, multiples.",
      "Follow two or three recent deals in the news and be ready to explain why they happened.",
      "Get comfortable with Excel.",
    ],
    sources: [
      { label: "Prospects: corporate investment banker", url: `${PROSPECTS}/corporate-investment-banker` },
      { label: "CISI: financial services qualifications", url: "https://www.cisi.org/cisiweb2/cisi-website/why-choose-a-CISI-qualification" },
    ],
  },
  {
    id: "sales-trading",
    name: "Sales & trading",
    category: "Banking & investment",
    summary: "Buying and selling financial instruments for clients and managing the bank's risk, on the markets floor.",
    typicalEntry: "Markets internships → graduate analyst",
    qualification: "None required; regulatory training on the job",
    goodFitIf: "You follow markets daily, think quickly with numbers, and like pressure.",
    whatItInvolves: [
      "Sales: building relationships with institutional clients (asset managers, pension funds, hedge funds) and bringing them ideas and prices.",
      "Trading: making markets and managing risk in products such as rates, FX, credit, equities and commodities.",
      "Structuring and quant roles design and price more complex products.",
    ],
    entryRoutes: [
      "Spring weeks and summer internships in a bank's markets (global markets) division.",
      "Some roles recruit strongly from maths, physics, engineering and economics.",
    ],
    qualifications: [
      "No formal qualification to start; firms provide regulatory training.",
      "Strong mental arithmetic and probability help; some firms use numerical tests.",
    ],
    atYourStage: [
      "Use the Markets page daily and write a 'My take' note when something moves - it's exactly the kind of evidence interviewers ask for.",
      "Be ready to pitch a trade idea: what you'd buy or sell, why, and what would prove you wrong.",
      "Understand the yield curve, how central bank decisions move currencies, and what drives oil and gold (see the Macro page).",
    ],
    sources: [
      { label: "Prospects: financial trader", url: `${PROSPECTS}/financial-trader` },
      { label: "CISI: financial services qualifications", url: "https://www.cisi.org/cisiweb2/cisi-website/why-choose-a-CISI-qualification" },
    ],
  },
  {
    id: "asset-management",
    name: "Asset management",
    category: "Banking & investment",
    summary: "Investing money for pension funds, insurers, charities and individuals - picking what to own and why.",
    typicalEntry: "Graduate schemes and internships",
    qualification: "CFA Program / IMC valued",
    goodFitIf: "You like researching companies and economies and forming long-term views.",
    whatItInvolves: [
      "Investment analysts research companies, sectors or bonds and recommend investments.",
      "Portfolio managers decide what to hold within a fund's objectives and risk limits.",
      "Other roles: client relationships, distribution, risk, and investment operations.",
    ],
    entryRoutes: [
      "Graduate programmes and summer internships at asset managers, insurers and pension schemes.",
      "Some firms offer apprenticeships or insight programmes for school leavers and first-years.",
    ],
    qualifications: [
      "The CFA Program is widely valued; check the CFA Institute's current rules on when students can register.",
      "The Investment Management Certificate (IMC) from CFA Society of the UK is a common UK entry-level qualification.",
    ],
    atYourStage: [
      "Build a watchlist on the Markets page and write short investment cases for two or three companies: what they do, how they make money, the main risks.",
      "Learn valuation basics (P/E, EV/EBITDA, DCF) from the corporate finance deck.",
      "Follow how interest rates affect bonds and equities (Macro page).",
    ],
    sources: [
      { label: "CFA Institute: CFA Program", url: "https://www.cfainstitute.org/programs/cfa-program" },
      { label: "Prospects: investment analyst", url: `${PROSPECTS}/investment-analyst` },
    ],
  },
  {
    id: "economic-consulting",
    name: "Economic consulting",
    category: "Economics & policy",
    summary: "Applying economics to competition cases, regulation, disputes and public policy for firms, regulators and governments.",
    typicalEntry: "Analyst roles; many hires have an economics master's",
    qualification: "Economics degree; MSc often preferred",
    goodFitIf: "You enjoy applied micro, data analysis and clear writing.",
    whatItInvolves: [
      "Competition work: assessing mergers and alleged anti-competitive behaviour, often for cases before the Competition and Markets Authority (CMA).",
      "Regulation: pricing and investment in regulated sectors such as water, energy and telecoms.",
      "Disputes: estimating damages; public policy: evaluating the impact of policies.",
      "Day to day: data analysis (Excel, Stata, R or Python), econometrics and report writing.",
    ],
    entryRoutes: [
      "Analyst or associate roles after an economics degree; many consultancies prefer or require a master's in economics.",
      "Summer internships at specialist economic consultancies.",
    ],
    qualifications: [
      "A strong economics degree, with quantitative and econometrics content.",
      "No professional exam; skills are built on the job.",
    ],
    atYourStage: [
      "Master elasticity, market structures and competition policy - the economics deck is a start.",
      "Learn some data analysis (Excel first, then R, Python or Stata).",
      "Read summaries of CMA merger decisions and practise explaining them in plain English.",
    ],
    sources: [
      { label: "Prospects: economist", url: `${PROSPECTS}/economist` },
      { label: "Competition and Markets Authority", url: "https://www.gov.uk/government/organisations/competition-and-markets-authority" },
    ],
  },
  {
    id: "ges",
    name: "Government Economic Service (GES)",
    category: "Economics & policy",
    summary: "Economists across UK government departments, analysing policy and advising ministers.",
    typicalEntry: "Assistant Economist scheme or GES degree apprenticeship",
    qualification: "Economics degree (see criteria)",
    goodFitIf: "You want your economics to shape public policy.",
    whatItInvolves: [
      "Analysing and advising on policy across government - for example HM Treasury, the Department for Education or the Department for Business and Trade.",
      "Cost-benefit analysis, forecasting, evaluating policies and briefing ministers and senior officials.",
    ],
    entryRoutes: [
      "The Assistant Economist graduate scheme.",
      "The GES Degree Apprenticeship: work in government while studying for a fee-free economics degree.",
      "Other recruitment schemes listed on the GES recruitment pages.",
    ],
    qualifications: [
      "Assistant Economist: a first or 2:1 in economics, or a postgraduate degree in economics. Joint degrees need at least half economics, covering both micro and macro.",
      "Check the current criteria each year before applying.",
    ],
    atYourStage: [
      "If you're choosing university options, check that your course covers both micro and macroeconomics.",
      "Look at the GES degree apprenticeship if you'd prefer to earn while you learn.",
      "Follow UK data releases on the Macro page (CPI, GDP, unemployment) and practise explaining what they mean for policy.",
    ],
    sources: [
      { label: "GOV.UK: Government Economic Service", url: "https://www.gov.uk/government/organisations/civil-service-government-economic-service" },
      { label: "GOV.UK: Assistant Economist recruitment", url: "https://www.gov.uk/guidance/assistant-economist-recruitment" },
    ],
  },
  {
    id: "central-banking",
    name: "Central banking (Bank of England)",
    category: "Economics & policy",
    summary: "Keeping inflation low and the financial system stable - through monetary policy, supervision and market operations.",
    typicalEntry: "Graduate programme, internships, apprenticeships",
    qualification: "No single qualification; economics and data skills help",
    goodFitIf: "You're interested in the big picture: rates, inflation and financial stability.",
    whatItInvolves: [
      "Monetary analysis: forecasting and analysis supporting the Monetary Policy Committee.",
      "Financial stability: spotting risks across the financial system.",
      "Prudential regulation (the PRA, part of the Bank): supervising banks and insurers.",
      "Markets, banking operations, statistics, technology and more.",
    ],
    entryRoutes: [
      "The Bank of England's graduate programme and internships.",
      "Apprenticeships and work experience schemes - see the Bank's careers pages for what's currently open.",
    ],
    qualifications: [
      "No single required qualification; economics, finance, maths and data backgrounds are all common.",
    ],
    atYourStage: [
      "Know the monetary policy transmission mechanism well (economics deck) and follow each MPC decision and its minutes.",
      "Track Bank Rate, CPI and gilt yields on the Macro page and explain the latest decision in your own words.",
      "Read the Bank's Monetary Policy Report summaries.",
    ],
    sources: [
      { label: "Bank of England: careers", url: "https://www.bankofengland.co.uk/careers" },
      { label: "Prospects: economist", url: `${PROSPECTS}/economist` },
    ],
  },
];

export const ACCOUNTANCY_COMPARISON = [
  {
    body: "ACA (ICAEW)",
    focus: "Audit, tax, advisory; strong in practice firms",
    exams: "15 exams, 3 levels",
    experience: "At least 450 days; normally 3-5 years",
    typical: "Accountancy firms (authorised training employers), some industry",
  },
  {
    body: "ACCA",
    focus: "Broad financial accounting; flexible and global",
    exams: "13 exams, 3 levels, plus ethics module",
    experience: "36 months + 9 performance objectives",
    typical: "Industry, practice and public sector",
  },
  {
    body: "CIMA (CGMA)",
    focus: "Management accounting and business decisions",
    exams: "9 objective tests + 3 case study exams",
    experience: "At least 3 years",
    typical: "Industry finance teams and graduate schemes",
  },
] as const;

export const GENERAL_SOURCES: Source[] = [
  { label: "GOV.UK: find an apprenticeship", url: "https://www.gov.uk/apply-apprenticeship" },
  { label: "Forage: free virtual work experience", url: "https://www.theforage.com/" },
];
