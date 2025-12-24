import React, { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  UserPlus,
  Brain,
  Heart,
  CheckCircle,
  ChevronLeft,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import Tooltip from "../components/Tooltip";

/** =========================
 * Types
 * ========================= */

type TestType = "stress" | "literacy";

type LikertQuestion = {
  text: string;
  reverse?: boolean;
};

type McqQuestion = {
  text: string;
  options: string[];
  answer: string; // 'a', 'b', 'c'...
  tooltip?: string;
};

type LikertSection = {
  id: string;
  title: string;
  kind: "likert";
  questions: LikertQuestion[];
};

type McqSection = {
  id: string;
  title: string;
  kind: "mcq";
  questions: McqQuestion[];
};

type Section = LikertSection | McqSection;

type Part = {
  name: string;
  sections: Section[];
};

type Assessment = {
  parts: Part[];
};

type AssessmentData = Record<TestType, Assessment>;

type ScoreBreakdownStress = {
  overallScore: number;
  sourcesScore: number;
  impactsScore: number;
  subScores: Record<string, number>;
  recommendations: { name: string; link: string }[];
};

type ScoreBreakdownLiteracy = {
  overallScore: number;
  habitsScore: number;
  knowledgeScore: number;
  subScores: Record<string, number>; // sectionId -> correct count
  recommendations: { name: string; link: string }[];
};

type AnyScoreBreakdown = ScoreBreakdownStress | ScoreBreakdownLiteracy;

type AssessmentResult = {
  type: TestType;
  created_at: string;
  user_answers: Record<string, string>;
  score_breakdown: AnyScoreBreakdown;
};

type AppUser = {
  id: string;
} | null;

type StoredScore = {
  type: TestType;
  created_at: string;
  score_breakdown: AnyScoreBreakdown;
  user_answers?: Record<string, string>;
};

/** =========================
 * Data (Normalized)
 * ========================= */

const stressSourceSections: LikertSection[] = [
  {
    id: "s1a",
    title: "Spending & Budgeting",
    kind: "likert",
    questions: [
      { text: "I often lose control when spending money.", reverse: false },
      { text: "I wish I could spend less / stick to my budget better.", reverse: false },
      { text: "I find it easy to track and organize my bills and other expenses.", reverse: true },
      { text: "I often worry about making the wrong financial decisions.", reverse: false },
    ],
  },
  {
    id: "s1b",
    title: "Current Confidence",
    kind: "likert",
    questions: [
      { text: "I don't know how to start improving my financial situation.", reverse: false },
      { text: "I get overwhelmed learning personal finance topics (investing, budgeting, etc.).", reverse: false },
      { text: "I feel that any actions I take to better manage my money won’t make a difference.", reverse: false },
      { text: "I feel confident that I’m currently managing my money effectively.", reverse: true },
    ],
  },
  {
    id: "s1c",
    title: "Social Influences",
    kind: "likert",
    questions: [
      { text: "I feel pressure to keep up financially with my friends, peers, or colleagues.", reverse: false },
      { text: "I feel comfortable/open having conversations about my financial situation.", reverse: true },
      { text: "I feel that those around me don’t/won’t support me financially.", reverse: false },
      { text: "I feel judged by others due to my financial situation.", reverse: false },
    ],
  },
  {
    id: "s1d",
    title: "Future Security",
    kind: "likert",
    questions: [
      { text: "I worry about not being able to handle a big emergency expense.", reverse: false },
      { text: "I worry about how inflation will affect my ability to afford things.", reverse: false },
      { text: "I feel that even if I lost my job/income, I would be able to manage my finances well.", reverse: true },
      { text: "I worry about how interest-rate changes will impact my savings and debt.", reverse: false },
    ],
  },
  {
    id: "s1e",
    title: "Other Stressors",
    kind: "likert",
    questions: [
      { text: "I feel like I don’t have enough time to focus on financial planning.", reverse: false },
      { text: "I often worry when thinking about how to pay off current/future debt effectively.", reverse: false },
      { text: "I often worry about my current/future investments (stocks, crypto, options, etc.).", reverse: false },
      { text: "I feel confident in my ability to save for retirement.", reverse: true },
    ],
  },
];

// Normalized: impact questions are now LikertQuestion objects too
const stressImpactSections: LikertSection[] = [
  {
    id: "s2a",
    title: "Affective Reactions",
    kind: "likert",
    questions: [
      { text: "My mood is negatively affected due to my financial situation." },
      { text: "I worry a lot about my financial situation." },
      { text: "I get emotionally drained because of my financial situation." },
      { text: "My financial situation makes it so that I am easily irritated." },
      { text: "I become frustrated/angry because of my financial situation." },
    ],
  },
  {
    id: "s2b",
    title: "Interpersonal Effects",
    kind: "likert",
    questions: [
      { text: "My financial situation interferes with my daily functioning/routine(s)." },
      { text: "I am unable to focus when doing tasks due to my financial situation." },
      { text: "My financial situation frequently interferes with my relationships with others." },
      { text: "I find talking about money with others to be difficult." },
      { text: "I frequently avoid attending events because of my financial situation." },
    ],
  },
  {
    id: "s2c",
    title: "Physiological Responses",
    kind: "likert",
    questions: [
      { text: "My heartbeat increases because of my financial situation." },
      { text: "I have stomach aches due to my financial situation." },
      { text: "I sweat more because of my financial situation." },
      { text: "My financial concerns affect my sleep quality." },
      { text: "I feel weak because of my financial situation." },
    ],
  },
];

const literacyHabitsSections: LikertSection[] = [
  {
    id: "habits",
    title: "Current Habits",
    kind: "likert",
    questions: [
      { text: "I have a budget. I also tend to follow this budget." },
      { text: "I tend to plan my spending. I tend to not be impulsive." },
      { text: "I tend to live within my means." },
      { text: "I have savings, and often grow my savings when I am able." },
      { text: "I do (or plan to) invest, and I do (or plan to) diversify." },
      { text: "I am confident in my ability to manage a financial emergency." },
      { text: "I do (or plan to) always pay off my bills and credit card balance(s) in full." },
      { text: "I do (or plan to) always use my credit card(s) when possible." },
      { text: "I play a role in filing my taxes, and pay no fees to do so." },
      { text: "I tend to keep up with current financial news and trends." },
    ],
  },
];

const literacyKnowledgeSections: McqSection[] = [
  {
    id: "spending",
    title: "Spending & Budgeting",
    kind: "mcq",
    questions: [
      {
        text: "Imagine you are about to buy a book, intending to use your credit card because it offers 2% cash back. However, the bookstore offers a 10% discount for paying cash. What should you do?",
        options: [
          "Pay with cash for the larger discount",
          "Pay with a credit card for convenience",
          "Either, both are good options, so it doesn’t matter which one",
          "Neither; Pay with debit for security",
          "I am unsure",
        ],
        answer: "a",
      },
      {
        text: "Which of the following is not commonly a fixed expense?",
        tooltip: "A cost that remains the same each month.",
        options: ["Rent", "Groceries", "Subscription services (Netflix, Amazon Prime, etc.)", "Loan payments", "I am unsure"],
        answer: "b",
      },
      {
        text: "How much money would you save on coffee alone in a year if you reduced your weekly coffee purchases from 5 to 1, assuming $5 per coffee? (note: 52 weeks in a year)",
        options: ["$1040", "$260", "$2500", "$1300", "$5200", "I am unsure"],
        answer: "a",
      },
      {
        text: 'Which budgeting category is most typical of a "want" rather than a "need"?',
        options: ["Vehicle/transportation expenses", "Groceries", "Health-related expenses", "Recreation", "I am unsure"],
        answer: "d",
      },
      {
        text: "When you have leftover money from your paycheck after covering living essentials, what should almost always be the first move?",
        options: [
          "Contributing to your TFSA",
          "Contributing to your RRSP, especially when you get an employer match",
          "Paying off any high-interest debt",
          "Putting it in a high-interest savings account",
          "Buying the thing you’ve been saving for",
          "I am unsure",
        ],
        answer: "c",
      },
    ],
  },
  {
    id: "savings",
    title: "Savings, Loans, & Interest Rates",
    kind: "mcq",
    questions: [
      {
        text: "What does having an interest rate of 0.5% in your savings account mean?",
        options: ["You get 0.5% of your balance back daily", "You get 0.5% of your balance back monthly", "You get 1% back annually on your balance", "You get 0.5% back annually on your balance", "I am unsure"],
        answer: "d",
      },
      {
        text: "Which factor(s) affect(s) the amount of interest you pay on a loan?",
        options: ["Your credit rating", "The amount you borrow", "The length of time you agree to pay off the loan", "Both options A & B", "All of the above", "I am unsure"],
        answer: "e",
      },
      {
        text: "Which of the following reasons should people have accounts at ‘The Big 6 Banks’ (RBC, TD Bank, Scotiabank, BMO, CIBC, National Bank)?",
        options: ["They usually have higher savings interest rates", "They usually have lower loan interest rates", "They usually have fewer hidden fees", "Their credit cards usually have higher cash-back", "All of the above", "None of the above", "I am unsure"],
        answer: "f",
      },
      {
        text: "Imagine you took out a loan in August 2010 with a 5% interest rate, agreeing to pay it off by August 2015. However, you fully repaid the loan in 2013. What happens to the total interest paid?",
        options: ["You pay the same amount of interest regardless of how quickly you pay off the loan", "You pay less interest because the loan is paid off faster", "You pay more interest because the loan term was shortened", "Early payments do not affect the total interest paid", "I am unsure"],
        answer: "b",
      },
      {
        text: "If the inflation rate is 5% and the interest rate in your savings account is 3%, what happens to the buying power of your money in the savings account over a year?",
        options: ["Your savings will have 2% less buying power", "Your savings will gain 2% more buying power", "Your savings will gain 3% more buying power", "Inflation doesn’t impact savings; the buying power stays the same", "I am unsure"],
        answer: "a",
      },
    ],
  },
  {
    id: "investments",
    title: "Investing",
    kind: "mcq",
    questions: [
      {
        text: "Which of the following is considered the least risky investment?",
        options: ["TFSA", "GIC", "ETF", "Mutual fund", "Cryptocurrencies", "Stocks", "I am unsure"],
        answer: "b",
      },
      {
        text: "Generally over the long-run, an investment plan involving dollar-cost-averaging can be beneficial due to that ____________, but may be disadvantageous due to that ____________.",
        options: [
          "It can provide reduced risk, it may provide lower returns over lump-sum investing.",
          "It can eliminate any risk, less money gets invested over time.",
          "It can provide higher returns over lump-sum investing, it may lead to increased risk.",
          "It allows you to invest at a surplus, less money gets invested over time.",
          "I am unsure",
        ],
        answer: "a",
      },
      {
        text: "What is a dividend?",
        options: [
          "The commission fee(s) for buying and selling stocks",
          "An agreement with the government to buy and own a percentage of a company",
          "The portion of a company’s profits paid to its stockholders",
          "The conversion fee for buying and selling stocks in a foreign currency",
          "I am unsure",
        ],
        answer: "c",
      },
      {
        text: "If you purchased 2 Amazon stocks in March 2022 for $150 USD each, and the price then dropped to $100 USD per share, what would be the most reasonable action(s) to take?",
        options: [
          "Hold on in hopes of long-term returns",
          "Buy more shares to take advantage of the lower price",
          "Sell all 3 shares to avoid any further losses",
          "Sell only 1 or 2 shares to effectively time the market",
          "Options A & B",
          "Options C & D",
          "I am unsure",
        ],
        answer: "e",
      },
      {
        text: "Which of the following statements is false?",
        options: [
          "Having a longer time horizon (a longer period of time you will have your money invested for) means you are more suitable to take on increased risk",
          "If a stock has a 5-year return of 100%, then it has increased in value by about 20% each year for the past 5 years",
          "ESG (environmental, sustainable, governance) stocks/ETFs generally underperform their non-ESG equivalents",
          "ETFs typically charge more in management fees than mutual funds",
          "I am unsure",
        ],
        answer: "d",
      },
    ],
  },
  {
    id: "credit",
    title: "Credit Cards",
    kind: "mcq",
    questions: [
      {
        text: "If a credit card charges a $150 annual fee and offers 3% cash-back on groceries, how much would you need to spend annually on groceries to break even?",
        options: ["$4500", "$5000", "$500", "$450", "I am unsure"],
        answer: "b",
      },
      {
        text: "What is a billing cycle?",
        options: [
          "The period of time before a credit card statement is issued, with all purchases during this time appearing on the same statement",
          "The period of time between when you get your credit card statement and the payment due date, during which you can pay off your balance without getting charged any interest",
          "The period of time to pay the penalty fee when you don’t pay the minimum payment",
          "None of the above",
          "I am unsure",
        ],
        answer: "a",
      },
      {
        text: "Which of the following is not a benefit of having a credit card?",
        options: [
          "Cash-back, points, and other rewards",
          "Provides a safety net for emergency expenses",
          "It can offer certain tax breaks",
          "Allows deferred payments to generate interest on the amount you pay later",
          "None of the above; all are benefits of having a credit card",
          "I am unsure",
        ],
        answer: "c",
      },
      {
        text: "What is the purpose of a credit card’s APR (annual percentage rate)?",
        options: ["To calculate late fees", "To set your credit limit", "To determine interest for unpaid balances", "To determine monthly minimum payments", "I am unsure"],
        answer: "c",
      },
      {
        text: "Which of the following does not hurt your credit rating?",
        options: [
          "Missing payments on loans or debts",
          "Applying for a credit card",
          "Closing an old credit card account",
          "Using your credit card too frequently",
          "All of the Above; They all hurt your credit rating",
          "I am unsure",
        ],
        answer: "d",
      },
    ],
  },
  {
    id: "taxes",
    title: "Taxes & Account Types",
    kind: "mcq",
    questions: [
      {
        text: "How much interest can you earn in a savings account without reporting it for taxes?",
        options: ["$50 (the cutoff for when you get a T5)", "$100", "You cannot be taxed for saving account interest income", "No cutoff; all savings account interest must be reported", "I am unsure"],
        answer: "d",
      },
      {
        text: "What’s the main difference between an RRSP and a TFSA?",
        options: ["RRSPs are designed more for retirement savings", "RRSPs generally have higher returns than TFSAs", "TFSAs have yearly contribution limits; RRSPs do not", "None of the above; there is virtually no difference between the two", "I am unsure"],
        answer: "a",
      },
      {
        text: "At about what income level do you need to start paying income tax in Canada?",
        options: ["$14,000", "$12,000", "$16,000", "$10,000", "I am unsure"],
        answer: "c",
      },
      {
        text: "What’s the difference between a T4 and a T5 form?",
        options: ["A T4 reports employment income, while a T5 reports non-employment income", "A T4 reports employment income, while a T5 reports investment income", "A T4 is for self-employment income, and a T5 is for savings income", "There’s no difference; both are for employment income", "I am unsure"],
        answer: "b",
      },
      {
        text: "Which of the following expenses is not tax-deductible for most Canadians?",
        options: ["Childcare expenses", "Charitable donations", "Medical expenses", "RRSP contributions", "None of the above; all are tax-deductible", "I am unsure"],
        answer: "e",
      },
    ],
  },
];

const assessmentData: AssessmentData = {
  stress: {
    parts: [
      { name: "Part 1 — Sources", sections: stressSourceSections },
      { name: "Part 2 — Impacts", sections: stressImpactSections },
    ],
  },
  literacy: {
    parts: [
      { name: "Part 1 — Current Habits", sections: literacyHabitsSections },
      { name: "Part 2 — Knowledge", sections: literacyKnowledgeSections },
    ],
  },
};

/** =========================
 * Small UI components
 * ========================= */

function Bar({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 my-1">
      <div className="bg-grima-primary h-2 rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
}

function ScoreScale({
  score,
  isLiteracy,
  showScore = false,
}: {
  score: number;
  isLiteracy: boolean;
  showScore?: boolean;
}) {
  const config = isLiteracy
    ? { min: 0, max: 100, labels: ["Very Low", "Low", "Moderate", "High", "Very High"] }
    : { min: 1, max: 5, labels: ["Very Low", "Low", "Moderate", "High", "Very High"] };

  const pct = Math.max(0, Math.min(100, ((score - config.min) / (config.max - config.min)) * 100));

  return (
    <div className="w-full my-2">
      {showScore && (
        <p className="text-3xl font-bold text-grima-primary text-center mb-3">
          {score.toFixed(isLiteracy ? 0 : 1)}
          <span className="text-2xl text-gray-400">/{isLiteracy ? 100 : 5}</span>
        </p>
      )}
      <div className="bg-gray-200 rounded-full h-2.5 relative">
        <div className="bg-grima-primary h-2.5 rounded-full flex items-center justify-end" style={{ width: `${pct}%` }}>
          <div className="w-4 h-4 bg-white border-2 border-grima-primary rounded-full -mr-2" />
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1.5 px-1">
        {config.labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}

function McqQuestionView({
  name,
  question,
  index,
  value,
  onChange,
}: {
  name: string;
  question: McqQuestion;
  index: number;
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="p-4 border-b">
      <p className="font-medium text-gray-800 mb-3 flex items-center">
        {index}. {question.text} {question.tooltip && <Tooltip text={question.tooltip} />}
      </p>
      <div className="space-y-2">
        {question.options.map((option, optIndex) => {
          const letter = String.fromCharCode(97 + optIndex); // a,b,c...
          return (
            <label key={letter} className="block cursor-pointer">
              <input
                type="radio"
                name={name}
                value={letter}
                onChange={(e) => onChange(e.target.value)}
                checked={value === letter}
                className="sr-only peer"
              />
              <div className="p-3 border rounded-lg peer-checked:bg-grima-50 peer-checked:text-grima-primary peer-checked:border-grima-primary transition-colors">
                {option}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function LikertQuestionView({
  name,
  questionText,
  index,
  value,
  onChange,
}: {
  name: string;
  questionText: string;
  index: number;
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="p-4 border-b">
      <p className="font-medium text-gray-800 mb-3">
        {index}. {questionText}
      </p>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((val) => (
          <label key={val} className="flex-1 min-w-[50px] cursor-pointer">
            <input
              type="radio"
              name={name}
              value={String(val)}
              onChange={(e) => onChange(e.target.value)}
              checked={value === String(val)}
              className="sr-only peer"
            />
            <div className="p-3 text-center border rounded-lg peer-checked:bg-grima-50 peer-checked:text-grima-primary peer-checked:border-grima-primary transition-colors">
              {val}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

function ConfirmationModal({
  onConfirm,
  onCancel,
  title,
  message,
  confirmButtonClasses = "px-6 py-2 bg-grima-primary text-white rounded-md font-semibold text-sm hover:bg-grima-dark",
  cancelButtonClasses = "px-6 py-2 border rounded-md font-medium text-sm hover:bg-gray-50",
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
}: {
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmButtonClasses?: string;
  cancelButtonClasses?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl max-w-sm w-full mx-4">
        <div className="flex items-center justify-center mx-auto bg-yellow-100 rounded-full h-12 w-12">
          <AlertTriangle className="h-6 w-6 text-yellow-600" />
        </div>
        <div className="mt-4 text-center">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-2">{message}</p>
        </div>
        <div className="mt-6 flex justify-center space-x-4">
          <button type="button" onClick={onCancel} className={cancelButtonClasses}>
            {cancelButtonText}
          </button>
          <button type="button" onClick={onConfirm} className={confirmButtonClasses}>
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}

/** =========================
 * Helpers
 * ========================= */

function getInitialState(locationSearch: string): { stage: Stage; test: TestType | null } {
  const queryParams = new URLSearchParams(locationSearch);
  const startTest = queryParams.get("start") as TestType | null;

  if (startTest === "stress" || startTest === "literacy") {
    return { stage: "intro", test: startTest };
  }

  const tempResults = sessionStorage.getItem("tempAssessmentResults");
  if (tempResults) {
    try {
      const parsed = JSON.parse(tempResults) as Partial<AssessmentResult>;
      if (parsed.type && parsed.score_breakdown) {
        return { stage: "results", test: parsed.type as TestType };
      }
    } catch {
      // ignore
    }
  }

  return { stage: "selection", test: null };
}

type Stage = "selection" | "intro" | "taking" | "results";

function reverseLikert(val: number) {
  return 6 - val;
}

export default function AssessmentsPage() {
  // Keep loose for compatibility with your AuthContext
  const { user, assessmentScores, addAssessmentScore } = useAuth() as {
    user: AppUser;
    assessmentScores: StoredScore[];
    addAssessmentScore: (payload: any) => Promise<void>;
  };

  const { showNotification } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();

  const [initialState] = useState(() => getInitialState(location.search));
  const [stage, setStage] = useState<Stage>(initialState.stage);
  const [currentTest, setCurrentTest] = useState<TestType | null>(initialState.test);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<AssessmentResult | null>(() => {
    const raw = sessionStorage.getItem("tempAssessmentResults");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AssessmentResult;
    } catch {
      return null;
    }
  });

  const [showConfirmSubmitModal, setShowConfirmSubmitModal] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);

  const activeTestData = currentTest ? assessmentData[currentTest] : null;

  useEffect(() => {
    if (location.search.includes("start=")) {
      navigate("/assessments", { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stage]);

  const selectTest = (type: TestType) => {
    setCurrentTest(type);
    setStage("intro");
    setCurrentStep(0);
    setAnswers({});
    setResults(null);
    sessionStorage.removeItem("tempAssessmentResults");
  };

  const resetState = () => {
    sessionStorage.removeItem("tempAssessmentResults");
    setStage("selection");
    setCurrentTest(null);
    setCurrentStep(0);
    setAnswers({});
    setResults(null);
  };

  const confirmExitAssessment = () => {
    if (stage === "taking" && Object.keys(answers).length > 0) {
      setShowExitConfirmModal(true);
    } else {
      resetState();
    }
  };

  const handleAttemptSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!activeTestData) return;

    const allSections = activeTestData.parts.flatMap((p) => p.sections);
    const totalQuestions = allSections.reduce((count, section) => count + section.questions.length, 0);

    if (Object.keys(answers).length < totalQuestions) {
      showNotification("Please answer all questions before submitting.", "error");
      return;
    }

    setShowConfirmSubmitModal(true);
  };

  const calculateAndSubmit = async () => {
    if (!currentTest || !activeTestData) return;

    const getVal = (key: string) => parseInt(answers[key] ?? "0", 10) || 0;

    const calculated: AssessmentResult = {
      type: currentTest,
      user_answers: answers,
      created_at: new Date().toISOString(),
      score_breakdown: {
        overallScore: 0,
        // fields filled below
      } as AnyScoreBreakdown,
    };

    if (currentTest === "stress") {
      const subScores: Record<string, number> = {};

      // Part 0 sources (reverse scoring possible)
      stressSourceSections.forEach((sec, sIdx) => {
        subScores[sec.id] = sec.questions.reduce((sum, q, qIdx) => {
          const key = `q_0_${sIdx}_${qIdx}`;
          const val = getVal(key);
          const scored = q.reverse ? reverseLikert(val) : val;
          return sum + scored;
        }, 0);
      });

      // Part 1 impacts (no reverse, but still likert)
      stressImpactSections.forEach((sec, sIdx) => {
        subScores[sec.id] = sec.questions.reduce((sum, _q, qIdx) => {
          const key = `q_1_${sIdx}_${qIdx}`;
          return sum + getVal(key);
        }, 0);
      });

      const sourcesTotal = stressSourceSections.reduce((acc, sec) => acc + subScores[sec.id], 0);
      const impactsTotal = stressImpactSections.reduce((acc, sec) => acc + subScores[sec.id], 0);

      const sourcesN = stressSourceSections.reduce((acc, sec) => acc + sec.questions.length, 0);
      const impactsN = stressImpactSections.reduce((acc, sec) => acc + sec.questions.length, 0);

      const sourcesScore = sourcesN > 0 ? sourcesTotal / sourcesN : 0;
      const impactsScore = impactsN > 0 ? impactsTotal / impactsN : 0;

      const score_breakdown: ScoreBreakdownStress = {
        overallScore: (sourcesScore + impactsScore) / 2,
        sourcesScore,
        impactsScore,
        subScores,
        recommendations: [],
      };

      calculated.score_breakdown = score_breakdown;
    } else {
      // literacy
      const habitsLen = literacyHabitsSections[0].questions.length;

      // Habits are likert 1-5, previously normalized by subtracting 1
      const habitsTotal = Array.from({ length: habitsLen }, (_, i) => {
        const raw = parseInt(answers[`q_0_0_${i}`] ?? "1", 10);
        return Math.max(1, Math.min(5, raw)) - 1; // 0..4
      }).reduce((a, b) => a + b, 0);

      const habitsScore = habitsLen > 0 ? (habitsTotal / (habitsLen * 4)) * 100 : 0;

      const subScores: Record<string, number> = {};
      const totalKnowledgeQuestions = literacyKnowledgeSections.reduce((acc, sec) => acc + sec.questions.length, 0);

      literacyKnowledgeSections.forEach((sec, sIdx) => {
        subScores[sec.id] = sec.questions.reduce((correct, q, qIdx) => {
          const key = `q_1_${sIdx}_${qIdx}`;
          return correct + (answers[key] === q.answer ? 1 : 0);
        }, 0);
      });

      const totalCorrect = Object.values(subScores).reduce((a, b) => a + b, 0);
      const knowledgeScore = totalKnowledgeQuestions > 0 ? (totalCorrect / totalKnowledgeQuestions) * 100 : 0;

      const recs: { name: string; link: string }[] = [];
      const KNOWLEDGE_REC_THRESHOLD_CORRECT = 4;
      const HABITS_REC_THRESHOLD_PERCENT = 60;

      if ((subScores.spending ?? 0) < KNOWLEDGE_REC_THRESHOLD_CORRECT) {
        recs.push({ name: "Spending Habits Session", link: "/coaching" });
        recs.push({ name: "Budgeting Session", link: "/coaching" });
      }
      if ((subScores.savings ?? 0) < KNOWLEDGE_REC_THRESHOLD_CORRECT) {
        recs.push({ name: "Interest, Savings, & Loans Session", link: "/coaching" });
      }
      if ((subScores.investments ?? 0) < KNOWLEDGE_REC_THRESHOLD_CORRECT) {
        recs.push({ name: "Investing Session", link: "/coaching" });
      }
      if ((subScores.credit ?? 0) < KNOWLEDGE_REC_THRESHOLD_CORRECT) {
        recs.push({ name: "Credit Cards Session", link: "/coaching" });
      }
      if ((subScores.taxes ?? 0) < KNOWLEDGE_REC_THRESHOLD_CORRECT) {
        recs.push({ name: "Taxes & Accounts Session", link: "/coaching" });
      }
      if (habitsScore < HABITS_REC_THRESHOLD_PERCENT) {
        recs.push({ name: "Improving Financial Habits Session", link: "/coaching" });
      }

      const score_breakdown: ScoreBreakdownLiteracy = {
        overallScore: (habitsScore + knowledgeScore) / 2,
        habitsScore,
        knowledgeScore,
        subScores,
        recommendations: recs,
      };

      calculated.score_breakdown = score_breakdown;
    }

    setShowConfirmSubmitModal(false);
    setResults(calculated);

    try {
      if (user) {
        await addAssessmentScore({
          user_id: user.id,
          type: currentTest,
          score_breakdown: calculated.score_breakdown,
          user_answers: answers,
        });
        sessionStorage.removeItem("tempAssessmentResults");
      } else {
        sessionStorage.setItem("tempAssessmentResults", JSON.stringify(calculated));
      }
    } catch (err) {
      console.error("Failed to save assessment:", err);
      showNotification("Failed to save your score. Please try again or contact support.", "error");
      // Show results locally
      if (!user) sessionStorage.setItem("tempAssessmentResults", JSON.stringify(calculated));
    }

    setStage("results");
  };

  if (stage === "selection") {
    return (
      <SelectionStage
        onSelect={selectTest}
        setStage={setStage}
        setResults={setResults}
        user={user}
        assessmentScores={assessmentScores}
      />
    );
  }

  if (stage === "intro" && currentTest) {
    return <IntroStage testType={currentTest} setStage={setStage} onExit={resetState} />;
  }

  if (stage === "taking" && activeTestData) {
    return (
      <TakingStage
        assessment={activeTestData}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        answers={answers}
        setAnswers={setAnswers}
        onSubmit={handleAttemptSubmit}
        onExit={confirmExitAssessment}
        showConfirmSubmitModal={showConfirmSubmitModal}
        onConfirmSubmit={calculateAndSubmit}
        onCancelSubmit={() => setShowConfirmSubmitModal(false)}
        showExitConfirmModal={showExitConfirmModal}
        onConfirmExit={resetState}
        onCancelExit={() => setShowExitConfirmModal(false)}
      />
    );
  }

  if (stage === "results") {
    return <ResultsStage results={results} onRestart={resetState} user={user} />;
  }

  return <div className="py-20 bg-grima-50 min-h-screen" />;
}

/** =========================
 * Stages
 * ========================= */

function SelectionStage({
  onSelect,
  setStage,
  setResults,
  user,
  assessmentScores,
}: {
  onSelect: (t: TestType) => void;
  setStage: React.Dispatch<React.SetStateAction<Stage>>;
  setResults: React.Dispatch<React.SetStateAction<AssessmentResult | null>>;
  user: AppUser;
  assessmentScores: StoredScore[];
}) {
  const tempResultsRaw = sessionStorage.getItem("tempAssessmentResults");
  const tempResults: AssessmentResult | null = tempResultsRaw
    ? (() => {
        try {
          return JSON.parse(tempResultsRaw) as AssessmentResult;
        } catch {
          return null;
        }
      })()
    : null;

  const hasTakenLiteracy = assessmentScores.some((s) => s.type === "literacy") || tempResults?.type === "literacy";
  const hasTakenStress = assessmentScores.some((s) => s.type === "stress") || tempResults?.type === "stress";

  const literacyScore = useMemo(() => {
    const stored = assessmentScores.find((s) => s.type === "literacy");
    if (stored) return stored as any;
    return tempResults?.type === "literacy" ? tempResults : null;
  }, [assessmentScores, tempResults]);

  const stressScore = useMemo(() => {
    const stored = assessmentScores.find((s) => s.type === "stress");
    if (stored) return stored as any;
    return tempResults?.type === "stress" ? tempResults : null;
  }, [assessmentScores, tempResults]);

  const viewResults = (score: any) => {
    setResults(score as AssessmentResult);
    setStage("results");
  };

  return (
    <div className="py-20 bg-grima-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-1">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-16">Financial Self-Assessments</h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
          {hasTakenLiteracy && literacyScore ? (
            <ScoreSummaryCard score={literacyScore} onViewResults={() => viewResults(literacyScore)} />
          ) : (
            <AssessmentInfoCard
              type="literacy"
              icon={<Brain className="h-16 w-16 mx-auto text-grima-primary mb-4" strokeWidth={1.5} />}
              title="Financial Literacy"
              time="Approx. 5-7 minutes"
              why={{
                points: [
                  "Identify any specific habits that may need improvement.",
                  "Gain clarity on your level of financial knowledge.",
                  "Provide a starting point to take meaningful steps toward achieving your financial goals.",
                ],
              }}
              onSelect={onSelect}
            />
          )}

          {hasTakenStress && stressScore ? (
            <ScoreSummaryCard score={stressScore} onViewResults={() => viewResults(stressScore)} />
          ) : (
            <AssessmentInfoCard
              type="stress"
              icon={<Heart className="h-16 w-16 mx-auto text-grima-primary mb-4" strokeWidth={1.5} />}
              title="Financial Stress"
              time="Approx. 3-5 minutes"
              why={{
                points: [
                  "Identify key sources of financial stress.",
                  "Understand the potential impacts on your mental, emotional, and physical well-being.",
                  "Provide a starting point for addressing stressors and improving your financial confidence.",
                ],
              }}
              onSelect={onSelect}
            />
          )}
        </div>

        {!user && (
          <p className="text-center text-sm text-gray-500 mt-10">
            Tip: if you complete an assessment while logged out, your results are saved temporarily in this browser.
          </p>
        )}
      </div>
    </div>
  );
}

function AssessmentInfoCard({
  type,
  icon,
  title,
  time,
  why,
  onSelect,
}: {
  type: TestType;
  icon: React.ReactNode;
  title: string;
  time: string;
  why: { points: string[] };
  onSelect: (t: TestType) => void;
}) {
  return (
    <div className="bg-white p-10 rounded-2xl shadow-lg flex flex-col border">
      <div className="text-center mb-6">
        {icon}
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-gray-500 mt-2">{time}</p>
      </div>

      <div className="text-left space-y-8 flex-grow">
        <div>
          <h3 className="font-bold text-gray-900 mb-3 text-lg">Why Take This Assessment?</h3>
          <p>This assessment will help you:</p>
          <ul className="list-disc list-outside space-y-2 text-base text-gray-700 ml-5 mt-2">
            {why.points.map((p, i) => (
              <li key={i} className="pl-1">
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onSelect(type)}
        className="mt-10 w-full bg-grima-primary text-white py-3 px-4 rounded-lg font-semibold text-lg hover:bg-grima-dark transition-colors"
      >
        Take Assessment
      </button>
    </div>
  );
}

function ScoreSummaryCard({ score, onViewResults }: { score: any; onViewResults: () => void }) {
  const isLiteracy = score.type === "literacy";
  const Icon = isLiteracy ? Brain : Heart;

  return (
    <div className="bg-white p-10 rounded-2xl shadow-lg flex flex-col border-2 border-grima-primary">
      <div className="text-center mb-6">
        <Icon className="h-16 w-16 mx-auto text-grima-primary mb-4" strokeWidth={1.5} />
        <h2 className="text-2xl font-bold capitalize">{score.type} Assessment</h2>
        <p className="text-gray-500 mt-2">Completed: {new Date(score.created_at).toLocaleDateString()}</p>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center">
        <p className="text-gray-600 font-medium">Your Overall Score</p>
        <p className={`text-6xl font-bold text-grima-primary my-2 ${isLiteracy ? "leading-tight" : ""}`}>
          {score.score_breakdown.overallScore.toFixed(isLiteracy ? 0 : 1)}
          <span className="text-4xl text-gray-400">/{isLiteracy ? 100 : 5}</span>
        </p>
      </div>

      <button
        type="button"
        onClick={onViewResults}
        className="mt-10 w-full bg-grima-dark text-white py-3 px-4 rounded-lg font-semibold text-lg hover:bg-black transition-colors"
      >
        View Full Results
      </button>
    </div>
  );
}

function IntroStage({
  testType,
  setStage,
  onExit,
}: {
  testType: TestType;
  setStage: React.Dispatch<React.SetStateAction<Stage>>;
  onExit: () => void;
}) {
  const isStress = testType === "stress";

  const structure = isStress
    ? {
        parts: [
          { name: "Part 1 — Sources", sections: stressSourceSections.map((s) => s.title) },
          { name: "Part 2 — Impacts", sections: stressImpactSections.map((s) => s.title) },
        ],
      }
    : {
        parts: [
          { name: "Part 1 — Current Habits", sections: ["Spending", "Budgeting", "Saving", "Investing", "Other financial topics"] },
          { name: "Part 2 — Knowledge", sections: literacyKnowledgeSections.map((s) => s.title) },
        ],
      };

  return (
    <div className="py-12 bg-grima-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 w-full">
        <div className="mb-4">
          <button type="button" onClick={onExit} className="text-gray-600 hover:text-gray-800 flex items-center">
            <ChevronLeft size={16} /> Back to All Assessments
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 text-center">
            {isStress ? "Financial Stress" : "Financial Literacy"} Assessment
          </h1>

          <div className="mt-6 prose prose-base max-w-none text-gray-600">
            <h2 className="font-semibold text-xl">Welcome</h2>

            {isStress ? (
              <>
                <p>
                  This assessment was developed by Grima Financial. With financial stress being so prevalent in Canada,
                  the goal of this tool is to help individuals identify both the sources and impacts of their financial
                  stress. By pinpointing these areas, hopefully you will be more able to take meaningful steps toward
                  improving your financial and overall well-being.
                </p>
                <div className="mt-6">
                  <p className="text-sm italic">
                    Note: Part 2 was adapted from the Financial Therapy Association’s{" "}
                    <a
                      href="https://newprairiepress.org/cgi/viewcontent.cgi?article=1216&context=jft"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-grima-primary underline"
                    >
                      Financial Stress Scale
                    </a>
                    .
                  </p>
                </div>
              </>
            ) : (
              <>
                <p>
                  This assessment was developed by Grima Financial. With financial education so uncommon in Canada, the
                  goal of this tool is to help individuals identify any gaps/issues in personal finance habits and
                  knowledge. By identifying these, hopefully you will be more able to take meaningful steps toward
                  managing your finances, and reduce any levels of financial stress.
                </p>

                <div className="my-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">
                  <p className="font-bold">A Quick Note</p>
                  <p className="text-sm">
                    If you are unsure of the answers in the knowledge section, please avoid guessing, as your score may
                    not accurately reflect your knowledge if you get it right by chance.
                  </p>
                </div>

                <div className="mt-6">
                  <p className="text-sm italic">
                    Note: Part 1 was adapted from the Financial Consumer Agency of Canada’s{" "}
                    <a
                      href="https://itools-ioutils.fcac-acfc.gc.ca/flsat-oaelf/star-comm-eng.aspx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-grima-primary underline"
                    >
                      Financial Literacy Self-assessment Quiz
                    </a>
                    .
                  </p>
                </div>
              </>
            )}

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-3 text-lg">Assessment Structure</h3>
              {structure.parts.map((part) => (
                <div key={part.name} className="mb-3 last:mb-0">
                  <h4 className="font-semibold text-gray-800">{part.name}</h4>
                  <ul className="list-disc list-outside space-y-1 text-sm ml-5 text-gray-600 mt-1">
                    {part.sections.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => setStage("taking")}
              className="w-full bg-grima-primary text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-grima-dark transition-colors"
            >
              Begin Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressSidebar({
  parts,
  currentStep,
  completedSections,
  onSectionClick,
}: {
  parts: Part[];
  currentStep: number;
  completedSections: boolean[];
  onSectionClick: (index: number) => void;
}) {
  let sectionIndex = 0;

  return (
    <aside className="w-full md:w-1/3 p-6 border-b md:border-b-0 md:border-r">
      <h3 className="font-bold mb-4 text-gray-900">Progress</h3>
      <div className="space-y-4">
        {parts.map((part) => (
          <div key={part.name}>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{part.name}</h4>
            <div className="space-y-2 text-sm">
              {part.sections.map((section) => {
                const globalIndex = sectionIndex;
                sectionIndex += 1;
                const done = completedSections[globalIndex];

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => onSectionClick(globalIndex)}
                    className={`w-full flex items-center p-2 rounded-md transition-colors text-left ${
                      currentStep === globalIndex ? "bg-grima-50 font-bold text-grima-primary" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center text-xs flex-shrink-0 ${
                        done ? "bg-grima-primary text-white" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {done ? <CheckCircle size={14} /> : "•"}
                    </div>
                    <span className="truncate">{section.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function TakingStage({
  assessment,
  currentStep,
  setCurrentStep,
  answers,
  setAnswers,
  onSubmit,
  onExit,
  showConfirmSubmitModal,
  onConfirmSubmit,
  onCancelSubmit,
  showExitConfirmModal,
  onConfirmExit,
  onCancelExit,
}: {
  assessment: Assessment;
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onSubmit: (e: FormEvent) => void;
  onExit: () => void;
  showConfirmSubmitModal: boolean;
  onConfirmSubmit: () => void;
  onCancelSubmit: () => void;
  showExitConfirmModal: boolean;
  onConfirmExit: () => void;
  onCancelExit: () => void;
}) {
  const { parts } = assessment;
  const allSections = parts.flatMap((p) => p.sections);

  const currentSectionData = allSections[currentStep];
  const currentPartIndex = useMemo(() => parts.findIndex((p) => p.sections.some((s) => s.id === currentSectionData?.id)), [parts, currentSectionData]);
  const currentPartData = currentPartIndex >= 0 ? parts[currentPartIndex] : null;

  const testType: TestType = useMemo(() => {
    if (!currentPartData) return "stress";
    return currentPartData.name.includes("Sources") || currentPartData.name.includes("Impacts") ? "stress" : "literacy";
  }, [currentPartData]);

  const progressPercent = allSections.length > 0 ? ((currentStep + 1) / allSections.length) * 100 : 0;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const completedSections = useMemo(() => {
    return allSections.map((section) => {
      const partIndex = parts.findIndex((p) => p.sections.some((s) => s.id === section.id));
      const sectionIndexInPart = parts[partIndex]?.sections.findIndex((s) => s.id === section.id) ?? 0;

      return section.questions.every((_q, qIdx) => {
        const key = `q_${partIndex}_${sectionIndexInPart}_${qIdx}`;
        return !!answers[key];
      });
    });
  }, [answers, allSections, parts]);

  const handleNext = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (currentStep < allSections.length - 1) setCurrentStep((s) => s + 1);
  };

  const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const questionNumberStart = useMemo(() => {
    if (!currentPartData || !currentSectionData) return 1;

    const sectionIndexInPart = currentPartData.sections.findIndex((s) => s.id === currentSectionData.id);

    let start = 1;

    // Count questions in all previous parts
    for (let p = 0; p < currentPartIndex; p++) {
      for (const sec of parts[p].sections) start += sec.questions.length;
    }

    // Count questions in earlier sections in this part
    for (let i = 0; i < sectionIndexInPart; i++) {
      start += currentPartData.sections[i].questions.length;
    }

    return start;
  }, [currentPartData, currentSectionData, currentPartIndex, parts]);

  const renderQuestions = () => {
    if (!currentPartData || !currentSectionData) return null;

    const sectionIndexInPart = currentPartData.sections.findIndex((s) => s.id === currentSectionData.id);

    return currentSectionData.questions.map((q, i) => {
      const key = `q_${currentPartIndex}_${sectionIndexInPart}_${i}`;
      const displayIndex = questionNumberStart + i;

      if (currentSectionData.kind === "mcq") {
        return (
          <McqQuestionView
            key={key}
            name={key}
            question={q as McqQuestion}
            index={displayIndex}
            value={answers[key]}
            onChange={(v) => setAnswers((prev) => ({ ...prev, [key]: v }))}
          />
        );
      }

      return (
        <LikertQuestionView
          key={key}
          name={key}
          questionText={(q as LikertQuestion).text}
          index={displayIndex}
          value={answers[key]}
          onChange={(v) => setAnswers((prev) => ({ ...prev, [key]: v }))}
        />
      );
    });
  };

  if (!currentPartData || !currentSectionData) return null;

  return (
    <div className="py-12 bg-grima-50 min-h-screen">
      {showConfirmSubmitModal && (
        <ConfirmationModal
          onConfirm={onConfirmSubmit}
          onCancel={onCancelSubmit}
          title="Confirm Submission"
          message="Once submitted, you cannot change your answers. Are you sure you want to see your results?"
          confirmButtonText="Confirm"
          cancelButtonText="Cancel"
        />
      )}

      {showExitConfirmModal && (
        <ConfirmationModal
          onConfirm={onConfirmExit}
          onCancel={onCancelExit}
          title="Exit Assessment?"
          message="Your progress will not be saved if you exit now. Are you sure you want to leave?"
          confirmButtonText="Confirm"
          cancelButtonText="Cancel"
          confirmButtonClasses="px-6 py-2 border rounded-md font-medium text-sm hover:bg-gray-50"
          cancelButtonClasses="px-6 py-2 bg-grima-primary text-white rounded-md font-semibold text-sm hover:bg-grima-dark"
        />
      )}

      <div className="max-w-6xl mx-auto">
        <button type="button" onClick={onExit} className="text-gray-600 hover:text-gray-800 flex items-center mb-4 text-base">
          <ChevronLeft size={18} className="mr-1" /> Back to Introduction
        </button>

        <div className="bg-white rounded-lg shadow-xl flex flex-col md:flex-row">
          <ProgressSidebar parts={parts} currentStep={currentStep} completedSections={completedSections} onSectionClick={(i) => setCurrentStep(i)} />

          <main className="w-full md:w-3/4 border-l">
            <form onSubmit={onSubmit}>
              <div className="p-4 border-b sticky top-16 bg-white/80 backdrop-blur-sm z-10">
                <h2 className="text-2xl font-bold">{testType === "stress" ? "Financial Stress" : "Financial Literacy"} Assessment</h2>

                {testType === "literacy" && currentPartData.name.includes("Knowledge") ? (
                  <>
                    <p className="mt-1 text-sm text-gray-500">For each question, select the best possible answer.</p>
                    <div className="mt-2 text-sm text-blue-700 bg-blue-100 p-2 rounded-md inline-flex items-center">
                      <AlertCircle size={16} className="mr-2" />
                      Feel free to use a calculator for this section.
                    </div>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">
                    Use the scale 1-5 to rate your level of agreement: (1 = Strongly Disagree, 5 = Strongly Agree)
                  </p>
                )}

                <p className="text-base font-medium text-gray-700 mt-2">
                  {currentPartData.name} — {currentSectionData.title}
                </p>

                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div className="bg-grima-primary h-2 rounded-full" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              <div className="question-content">{renderQuestions()}</div>

              <div className="p-4 border-t flex justify-between bg-white">
                <button type="button" onClick={handleBack} disabled={currentStep === 0} className="px-4 py-2 border rounded-md disabled:opacity-50">
                  Back
                </button>

                {currentStep < allSections.length - 1 ? (
                  <button type="button" onClick={handleNext} className="px-6 py-2 bg-grima-primary text-white rounded-md">
                    Next
                  </button>
                ) : (
                  <button type="submit" className="px-6 py-2 bg-grima-primary text-white rounded-md">
                    Submit &amp; See Results
                  </button>
                )}
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}

function StressResultsDisplay({
  sourcesScore,
  impactsScore,
  subScores,
}: {
  sourcesScore: number;
  impactsScore: number;
  subScores: Record<string, number>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-center mb-4 text-gray-800">Sources of Stress</h3>
        <div className="space-y-5">
          {stressSourceSections.map((sec) => {
            const avg = (subScores[sec.id] ?? 0) / sec.questions.length;
            return (
              <div key={sec.id}>
                <div className="flex justify-between items-baseline">
                  <span className="font-medium text-gray-700">{sec.title}</span>
                  <strong className="font-bold text-gray-900">{avg.toFixed(1)}/5</strong>
                </div>
                <ScoreScale score={avg} isLiteracy={false} />
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-center mb-4 mt-8 text-gray-800">Impacts of Stress</h3>
        <div className="space-y-5">
          {stressImpactSections.map((sec) => {
            const avg = (subScores[sec.id] ?? 0) / sec.questions.length;
            return (
              <div key={sec.id}>
                <div className="flex justify-between items-baseline">
                  <span className="font-medium text-gray-700">{sec.title}</span>
                  <strong className="font-bold text-gray-900">{avg.toFixed(1)}/5</strong>
                </div>
                <ScoreScale score={avg} isLiteracy={false} />
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-center text-gray-500 mt-4">
        Overall Sources Score: <strong>{sourcesScore.toFixed(1)}/5</strong> • Overall Impacts Score:{" "}
        <strong>{impactsScore.toFixed(1)}/5</strong>
      </p>
    </div>
  );
}

function LiteracyResultsDisplay({
  habitsScore,
  knowledgeScore,
  subScores,
  recommendations,
}: {
  habitsScore: number;
  knowledgeScore: number;
  subScores: Record<string, number>;
  recommendations: { name: string; link: string }[];
}) {
  return (
    <div className="space-y-6 text-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center md:text-left">
        <div>
          <h3 className="font-bold text-lg">
            Habits Score: <span className="font-extrabold">{habitsScore.toFixed(0)}/100</span>
          </h3>
          <Bar score={habitsScore} maxScore={100} />
        </div>
        <div>
          <h3 className="font-bold text-lg">
            Knowledge Score: <span className="font-extrabold">{knowledgeScore.toFixed(0)}/100</span>
          </h3>
          <Bar score={knowledgeScore} maxScore={100} />
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Knowledge Breakdown (Correct Answers):</h4>
        <ul className="space-y-1 text-gray-700">
          {literacyKnowledgeSections.map((sec) => (
            <li key={sec.id} className="flex justify-between p-2 bg-gray-50 rounded">
              <span>{sec.title}:</span>
              <strong>
                {(subScores[sec.id] ?? 0)}/{sec.questions.length}
              </strong>
            </li>
          ))}
        </ul>
      </div>

      {recommendations.length > 0 && (
        <div className="bg-grima-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-3">Recommended Sessions</h3>
          <div className="space-y-2">
            {recommendations.map((rec) => (
              <Link key={`${rec.name}-${rec.link}`} to={rec.link} className="flex items-center space-x-2 text-grima-primary font-medium hover:underline">
                <CheckCircle size={16} />
                <span>{rec.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultsStage({ results, onRestart, user }: { results: AssessmentResult | null; onRestart: () => void; user: AppUser }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!results) return null;

  const { type, score_breakdown } = results;
  const isLiteracy = type === "literacy";

  const overallScore = score_breakdown.overallScore;

  // Action plan / insights
  const insightDisplayOrder = useMemo(
    () => [
      "Financial Habits",
      "Spending & Budgeting",
      "Savings, Loans, & Interest Rates",
      "Investing",
      "Credit Cards",
      "Taxes & Account Types",
      "Improving Financial Habits Session",
      "Spending Habits Session",
      "Budgeting Session",
      "Interest, Savings, & Loans Session",
      "Investing Session",
      "Credit Cards Session",
      "Taxes & Accounts Session",
    ],
    []
  );

  const renderNextSteps = () => {
    if (isLiteracy) {
      const sb = score_breakdown as ScoreBreakdownLiteracy;

      const knowledgeSections = literacyKnowledgeSections.map((sec) => ({
        name: sec.title,
        rawScore: sb.subScores[sec.id] ?? 0,
        totalQuestions: sec.questions.length,
      }));

      const habitsSection = {
        name: "Financial Habits",
        // Normalize % into "raw out of N" just for the insight thresholds
        rawScore: (sb.habitsScore / 100) * literacyHabitsSections[0].questions.length,
        totalQuestions: literacyHabitsSections[0].questions.length,
      };

      const all = [...knowledgeSections, habitsSection];

      const STRENGTH_PCT = 0.8;
      const OPPORTUNITY_PCT = 0.6;

      const high = all
        .filter((item) => item.totalQuestions > 0 && item.rawScore / item.totalQuestions >= STRENGTH_PCT)
        .map((item) => item.name)
        .sort((a, b) => insightDisplayOrder.indexOf(a) - insightDisplayOrder.indexOf(b));

      const low = all
        .filter((item) => item.totalQuestions > 0 && item.rawScore / item.totalQuestions < OPPORTUNITY_PCT)
        .map((item) => item.name)
        .sort((a, b) => insightDisplayOrder.indexOf(a) - insightDisplayOrder.indexOf(b));

      return (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg text-left">
          <h3 className="font-bold text-xl mb-4 text-gray-900">Your Action Plan</h3>
          <p className="text-gray-700 mb-6">
            Use your scores to identify your strengths and areas for improvement. Higher scores indicate strength, while lower scores highlight opportunities to learn.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-100/50 border border-green-200 p-4 rounded-lg flex items-start">
              <TrendingUp className="h-6 w-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-800">Area(s) of Strength</p>
                {high.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 mt-1 text-sm text-gray-800 font-medium">
                    {high.map((area) => (
                      <li key={area}>{area}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-700 font-medium">No strong areas detected. Focus on overall growth.</p>
                )}
              </div>
            </div>

            <div className="bg-yellow-100/50 border border-yellow-300 p-4 rounded-lg flex items-start">
              <TrendingDown className="h-6 w-6 text-yellow-600 mr-3 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-yellow-800">Opportunity for Growth</p>
                {low.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 mt-1">
                    {low.map((area) => (
                      <li key={area} className="text-sm text-gray-800 font-medium">
                        {area}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-700 font-medium">You've demonstrated solid foundational understanding across all areas!</p>
                )}
              </div>
            </div>
          </div>

          {sb.recommendations.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="font-bold text-lg mb-3">Recommended Sessions:</h4>
              <ul className="list-disc list-outside space-y-2 text-grima-primary ml-5">
                {sb.recommendations.map((rec) => (
                  <li key={`${rec.name}-${rec.link}`}>
                    <Link to={rec.link} className="font-medium hover:underline text-grima-primary">
                      {rec.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    // Stress insights
    const sb = score_breakdown as ScoreBreakdownStress;

    const sourcesData = stressSourceSections.map((sec) => ({
      name: sec.title,
      score: (sb.subScores[sec.id] ?? 0) / sec.questions.length,
    }));

    const impactsData = stressImpactSections.map((sec) => ({
      name: sec.title,
      score: (sb.subScores[sec.id] ?? 0) / sec.questions.length,
    }));

    const HIGH = 3.5;
    const LOW = 2.0;

    const getAreas = (data: { name: string; score: number }[], isHigh: boolean) => {
      const filtered = isHigh ? data.filter((x) => x.score >= HIGH) : data.filter((x) => x.score <= LOW);
      filtered.sort((a, b) => (isHigh ? b.score - a.score : a.score - b.score));
      return filtered.map((x) => x.name);
    };

    const highSourceAreas = getAreas(sourcesData, true);
    const lowSourceAreas = getAreas(sourcesData, false);
    const highImpactAreas = getAreas(impactsData, true);
    const lowImpactAreas = getAreas(impactsData, false);

    return (
      <div className="mt-8 p-6 bg-gray-50 rounded-lg text-left">
        <h3 className="font-bold text-xl mb-4 text-gray-900">Personalized Insights</h3>
        <p className="text-gray-700 mb-6">
          Understanding where your stress comes from is the first step. Use these insights to address key stressors and improve your financial confidence.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 rounded-lg bg-blue-100 border border-blue-200">
            <h4 className="font-bold text-blue-800 text-lg mb-2">Sources of Stress:</h4>

            {highSourceAreas.length > 0 ? (
              <div className="flex items-start mb-2">
                <TrendingUp className="h-6 w-6 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700">Highest Sources:</p>
                  <ul className="list-disc list-inside space-y-1 mt-1 text-sm text-gray-800 font-medium">
                    {highSourceAreas.map((area) => (
                      <li key={area}>{area}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 mb-2">You generally report low stress from most sources. This indicates strong management!</p>
            )}

            {lowSourceAreas.length > 0 && (
              <div className="flex items-start">
                <TrendingDown className="h-6 w-6 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-700">Lowest Sources:</p>
                  <ul className="list-disc list-inside space-y-1 mt-1 text-sm text-gray-800 font-medium">
                    {lowSourceAreas.map((area) => (
                      <li key={area}>{area}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-lg bg-blue-100 border border-blue-200">
            <h4 className="font-bold text-blue-800 text-lg mb-2">Impacts of Stress:</h4>

            {highImpactAreas.length > 0 ? (
              <div className="flex items-start mb-2">
                <TrendingUp className="h-6 w-6 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700">Highest Impacts:</p>
                  <ul className="list-disc list-inside space-y-1 mt-1 text-sm text-gray-800 font-medium">
                    {highImpactAreas.map((area) => (
                      <li key={area}>{area}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 mb-2">You generally report low impacts of stress. This indicates strong resilience!</p>
            )}

            {lowImpactAreas.length > 0 && (
              <div className="flex items-start">
                <TrendingDown className="h-6 w-6 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-700">Lowest Impacts:</p>
                  <ul className="list-disc list-inside space-y-1 mt-1 text-sm text-gray-800 font-medium">
                    {lowImpactAreas.map((area) => (
                      <li key={area}>{area}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="py-12 px-4 bg-grima-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-xl">
          <h2 className="text-3xl font-bold text-center text-gray-900">Your Results Are In!</h2>

          <div className="text-center border-b pb-6 my-4">
            <p className="text-lg font-medium text-gray-600">
              Overall {type.charAt(0).toUpperCase() + type.slice(1)} Score
            </p>
            <ScoreScale score={overallScore} isLiteracy={isLiteracy} showScore />
          </div>

          {isLiteracy ? (
            <LiteracyResultsDisplay
              habitsScore={(score_breakdown as ScoreBreakdownLiteracy).habitsScore}
              knowledgeScore={(score_breakdown as ScoreBreakdownLiteracy).knowledgeScore}
              subScores={(score_breakdown as ScoreBreakdownLiteracy).subScores}
              recommendations={(score_breakdown as ScoreBreakdownLiteracy).recommendations}
            />
          ) : (
            <StressResultsDisplay
              sourcesScore={(score_breakdown as ScoreBreakdownStress).sourcesScore}
              impactsScore={(score_breakdown as ScoreBreakdownStress).impactsScore}
              subScores={(score_breakdown as ScoreBreakdownStress).subScores}
            />
          )}

          {renderNextSteps()}

          <div className="prose prose-base max-w-none text-gray-600 mt-12 text-left border-t pt-8">
            {isLiteracy ? (
              <>
                <p>Thank you for taking the time to complete this Financial Literacy Assessment.</p>
                <p>
                  I hope this assessment has helped highlight areas where you can grow, and provided some clarity for
                  where to begin or continue improving your financial literacy. Every step you take towards a better
                  financial understanding is a step toward greater confidence and control over your future.
                </p>
              </>
            ) : (
              <>
                <p>Thank you for taking the time to complete this Financial Stress Assessment.</p>
                <p>
                  I hope this assessment has helped shed some light on the specific areas contributing to your financial
                  stress as well as the impacts of your financial stress, and has provided some clarity on how you can
                  best address any of these issues moving forward in your financial journey.
                </p>
              </>
            )}

            <p className="mt-6">
              If you’d like more in-depth insights or personalized financial support, consider booking a free initial
              consultation to discuss your results.
            </p>

            <Link
              to="/booking"
              className="inline-block mt-4 bg-grima-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-grima-dark transition-colors no-underline"
            >
              Book a Free Consultation
            </Link>
          </div>
        </div>

        <div className="text-center mt-8 pb-12">
          {!user ? (
            <>
              <p className="mb-4 font-semibold">Create an account to save your scores and track your progress.</p>
              <Link to="/register" className="bg-gray-800 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center w-full sm:w-auto sm:mx-auto">
                <UserPlus className="mr-2" />
                Create Account
              </Link>
            </>
          ) : (
            <>
              <p className="mb-4 font-semibold">Your score has been saved. You can review it on your dashboard.</p>
              <Link to="/account?tab=scores" className="bg-gray-800 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center w-full sm:w-auto sm:mx-auto">
                <ArrowRight className="mr-2" />
                Go to Dashboard
              </Link>
            </>
          )}

          <button type="button" onClick={onRestart} className="mt-6 text-sm text-gray-500 hover:underline">
            Back to Assessments
          </button>
        </div>
      </div>
    </div>
  );
}
