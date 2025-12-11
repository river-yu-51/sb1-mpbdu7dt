import React, { useState } from 'react';
import { AssessmentScore } from '../lib/database';
import { ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';

// --- DATA DEFINITIONS (MOVED BACK INTO THIS FILE) ---
const stressSourceSections = [
    { id: 's1a', title: "Spending & Budgeting", questions: [ { text: "I often lose control when spending money.", reverse: false }, { text: "I wish I could spend less / stick to my budget better.", reverse: false }, { text: "I find it easy to track and organize my bills and other expenses.", reverse: true }, { text: "I often worry about making the wrong financial decisions.", reverse: false } ]},
    { id: 's1b', title: "Current Confidence", questions: [ { text: "I don't know how to start improving my financial situation.", reverse: false }, { text: "I get overwhelmed learning personal finance topics (investing, budgeting, etc.).", reverse: false }, { text: "I feel that any actions I take to better manage my money won’t make a difference.", reverse: false }, { text: "I feel confident that I’m currently managing my money effectively.", reverse: true } ]},
    { id: 's1c', title: "Social Influences", questions: [ { text: "I feel pressure to keep up financially with my friends, peers, or colleagues.", reverse: false }, { text: "I feel comfortable/open having conversations about my financial situation.", reverse:true }, { text: "I feel that those around me don’t/won’t support me financially.", reverse: false }, { text: "I feel judged by others due to my financial situation.", reverse: false } ]},
    { id: 's1d', title: "Future Security", questions: [ { text: "I worry about not being able to handle a big emergency expense.", reverse: false }, { text: "I worry about how inflation will affect my ability to afford things.", reverse: false }, { text: "I feel that even if I lost my job/income, I would be able to manage my finances well.", reverse: true }, { text: "I worry about how interest-rate changes will impact my savings and debt.", reverse: false } ]},
    { id: 's1e', title: "Other Stressors", questions: [ { text: "I feel like I don’t have enough time to focus on financial planning.", reverse: false }, { text: "I often worry when thinking about how to pay off current/future debt effectively.", reverse: false }, { text: "I often worry about my current/future investments (stocks, crypto, options, etc.).", reverse: false }, { text: "I feel confident in my ability to save for retirement.", reverse: true } ]}
];

const stressImpactSections = [
    { id: 's2a', title: "Affective Reactions", questions: [ "My mood is negatively affected due to my financial situation.", "I worry a lot about my financial situation.", "I get emotionally drained because of my financial situation.", "My financial situation makes it so that I am easily irritated.", "I become frustrated/angry because of my financial situation." ]},
    { id: 's2b', title: "Interpersonal Effects", questions: [ "My financial situation interferes with my daily functioning/routine(s).", "I am unable to focus when doing tasks due to my financial situation.", "My financial situation frequently interferes with my relationships with others.", "I find talking about money with others to be difficult.", "I frequently avoid attending events because of my financial situation." ]},
    { id: 's2c', title: "Physiological Responses", questions: [ "My heartbeat increases because of my financial situation.", "I have stomach aches due to my financial situation.", "I sweat more because of my financial situation.", "My financial concerns affect my sleep quality.", "I feel weak because of my financial situation." ]}
];

const literacyHabitsSections = [
    { id: 'habits', title: "Current Habits", questions: [ "I have a budget. I also tend to follow this budget.", "I tend to plan my spending. I tend to not be impulsive.", "I tend to live within my means.", "I have savings, and often grow my savings when I am able.", "I do (or plan to) invest, and I do (or plan to) diversify.", "I am confident in my ability to manage a financial emergency.", "I do (or plan to) always pay off my bills and credit card balance(s) in full.", "I do (or plan to) always use my credit card(s) when possible.", "I play a role in filing my taxes, and pay no fees to do so.", "I tend to keep up with current financial news and trends." ]}
];

const literacyKnowledgeSections = [ { id: 'spending', title: 'Spending & Budgeting', questions: [ { text: "Imagine you are about to buy a book, intending to use your credit card because it offers 2% cash back. However, the bookstore offers a 10% discount for paying cash. What should you do?", options: ["Pay with cash for the larger discount", "Pay with a credit card for convenience", "Either, both are good options, so it doesn’t matter which one", "Neither; Pay with debit for security", "I am unsure"], answer: 'a' }, { text: "Which of the following is not commonly a fixed expense?", tooltip: "A cost that remains the same each month.", options: ["Rent", "Groceries", "Subscription services (Netflix, Amazon Prime, etc.)", "Loan payments", "I am unsure"], answer: 'b' }, { text: "How much money would you save on coffee alone in a year if you reduced your weekly coffee purchases from 5 to 1, assuming $5 per coffee? (note: 52 weeks in a year)", options: ["$1040", "$260", "$2500", "$1300", "$5200", "I am unsure"], answer: 'a' }, { text: 'Which budgeting category is most typical of a "want" rather than a "need"?', options: ["Vehicle/transportation expenses", "Groceries", "Health-related expenses", "Recreation", "I am unsure"], answer: 'd' }, { text: "When you have leftover money from your paycheck after covering living essentials, what should almost always be the first move?", options: ["Contributing to your TFSA", "Contributing to your RRSP, especially when you get an employer match", "Paying off any high-interest debt", "Putting it in a high-interest savings account", "Buying the thing you’ve been saving for", "I am unsure"], answer: 'c' } ] }, { id: 'savings', title: 'Savings, Loans, & Interest Rates', questions: [ { text: "What does having an interest rate of 0.5% in your savings account mean?", options: ["You get 0.5% of your balance back daily", "You get 0.5% of your balance back monthly", "You get 1% back annually on your balance", "You get 0.5% back annually on your balance", "I am unsure"], answer: 'd' }, { text: "Which factor(s) affect(s) the amount of interest you pay on a loan?", options: ["Your credit rating", "The amount you borrow", "The length of time you agree to pay off the loan", "Both options A & B", "All of the above", "I am unsure"], answer: 'e' }, { text: "Which of the following reasons should people have accounts at ‘The Big 6 Banks’ (RBC, TD Bank, Scotiabank, BMO, CIBC, National Bank)?", options: ["They usually have higher savings interest rates", "They usually have lower loan interest rates", "They usually have fewer hidden fees", "Their credit cards usually have higher cash-back", "All of the above", "None of the above", "I am unsure"], answer: 'f' }, { text: "Imagine you took out a loan in August 2010 with a 5% interest rate, agreeing to pay it off by August 2015. However, you fully repaid the loan in 2013. What happens to the total interest paid?", options: ["You pay the same amount of interest regardless of how quickly you pay off the loan", "You pay less interest because the loan is paid off faster", "You pay more interest because the loan term was shortened", "Early payments do not affect the total interest paid", "I am unsure"], answer: 'b' }, { text: "If the inflation rate is 5% and the interest rate in your savings account is 3%, what happens to the buying power of your money in the savings account over a year?", options: ["Your savings will have 2% less buying power", "Your savings will gain 2% more buying power", "Your savings will gain 3% more buying power", "Inflation doesn’t impact savings; the buying power stays the same", "I am unsure"], answer: 'a' } ] }, { id: 'investments', title: 'Investing', questions: [ { text: "Which of the following is considered the least risky investment?", options: ["TFSA", "GIC", "ETF", "Mutual fund", "Cryptocurrencies", "Stocks", "I am unsure"], answer: 'b' }, { text: "Generally over the long-run, an investment plan involving dollar-cost-averaging can be beneficial due to that ____________, but may be disadvantageous due to that ____________.", options: ["It can provide reduced risk, it may provide lower returns over lump-sum investing.", "It can eliminate any risk, less money gets invested over time.", "It can provide higher returns over lump-sum investing, it may lead to increased risk.", "It allows you to invest at a surplus, less money gets invested over time.", "I am unsure"], answer: 'a' }, { text: "What is a dividend?", options: ["The commission fee(s) for buying and selling stocks", "An agreement with the government to buy and own a percentage of a company", "The portion of a company’s profits paid to its stockholders", "The conversion fee for buying and selling stocks in a foreign currency", "I am unsure"], answer: 'c' }, { text: "If you purchased 2 Amazon stocks in March 2022 for $150 USD each, and the price then dropped to $100 USD per share, what would be the most reasonable action(s) to take?", options: ["Hold on in hopes of long-term returns", "Buy more shares to take advantage of the lower price", "Sell all 3 shares to avoid any further losses", "Sell only 1 or 2 shares to effectively time the market", "Options A & B", "Options C & D", "I am unsure"], answer: 'e' }, { text: "Which of the following statements is false?", options: ["Having a longer time horizon (a longer period of time you will have your money invested for) means you are more suitable to take on increased risk", "If a stock has a 5-year return of 100%, then it has increased in value by about 20% each year for the past 5 years", "ESG (environmental, sustainable, governance) stocks/ETFs generally underperform their non-ESG equivalents", "ETFs typically charge more in management fees than mutual funds", "I am unsure"], answer: 'd' } ] }, { id: 'credit', title: "Credit Cards", questions: [ { text: "If a credit card charges a $150 annual fee and offers 3% cash-back on groceries, how much would you need to spend annually on groceries to break even?", options: ["$4500", "$5000", "$500", "$450", "I am unsure"], answer: 'b' }, { text: "What is a billing cycle?", options: ["The period of time before a credit card statement is issued, with all purchases during this time appearing on the same statement", "The period of time between when you get your credit card statement and the payment due date, during which you can pay off your balance without getting charged any interest", "The period of time to pay the penalty fee when you don’t pay the minimum payment", "None of the above", "I am unsure"], answer: 'a' }, { text: "Which of the following is not a benefit of having a credit card?", options: ["Cash-back, points, and other rewards", "Provides a safety net for emergency expenses", "It can offer certain tax breaks", "Allows deferred payments to generate interest on the amount you pay later", "None of the above; all are benefits of having a credit card", "I am unsure"], answer: 'c' }, { text: "What is the purpose of a credit card’s APR (annual percentage rate)?", options: ["To calculate late fees", "To set your credit limit", "To determine interest for unpaid balances", "To determine monthly minimum payments", "I am unsure"], answer: 'c' }, { text: "Which of the following does not hurt your credit rating?", options: ["Missing payments on loans or debts", "Applying for a credit card", "Closing an old credit card account", "Using your credit card too frequently", "All of the Above; They all hurt your credit rating", "I am unsure"], answer: 'd' } ]}, { id: 'taxes', title: "Taxes & Account Types", questions: [ { text: "How much interest can you earn in a savings account without reporting it for taxes?", options: ["$50 (the cutoff for when you get a T5)", "$100", "You cannot be taxed for saving account interest income", "No cutoff; all savings account interest must be reported", "I am unsure"], answer: 'd' }, { text: "What’s the main difference between an RRSP and a TFSA?", options: ["RRSPs are designed more for retirement savings", "RRSPs generally have higher returns than TFSAs", "TFSAs have yearly contribution limits; RRSPs do not", "None of the above; there is virtually no difference between the two", "I am unsure"], answer: 'a' }, { text: "At about what income level do you need to start paying income tax in Canada?", options: ["$14,000", "$12,000", "$16,000", "$10,000", "I am unsure"], answer: 'c' }, { text: "What’s the difference between a T4 and a T5 form?", options: ["A T4 reports employment income, while a T5 reports non-employment income", "A T4 reports employment income, while a T5 reports investment income", "A T4 is for self-employment income, and a T5 is for savings income", "There’s no difference; both are for employment income", "I am unsure"], answer: 'b' }, { text: "Which of the following expenses is not tax-deductible for most Canadians?", options: ["Childcare expenses", "Charitable donations", "Medical expenses", "RRSP contributions", "None of the above; all are tax-deductible", "I am unsure"], answer: 'e' } ] } ];

const assessmentData = {
    stress: {
        parts: [
            { name: "Part 1 — Sources", sections: stressSourceSections },
            { name: "Part 2 — Impacts", sections: stressImpactSections }
        ]
    },
    literacy: {
        parts: [
            { name: "Part 1 — Current Habits", sections: literacyHabitsSections },
            { name: "Part 2 — Knowledge", sections: literacyKnowledgeSections }
        ]
    }
};

const ScoreDisplay = ({ scoreData }: { scoreData: AssessmentScore }) => {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [isAnswersExpanded, setIsAnswersExpanded] = useState(false);
  
  if (!scoreData || !scoreData.score_breakdown) return null;

  const { type, score_breakdown, user_answers, created_at } = scoreData;
  const isLiteracy = type === 'literacy';
  const overallScore = score_breakdown.overallScore;
  
  const renderStressBreakdown = () => (
    <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 mt-4 text-sm">
        <div>
          <h4 className="font-semibold text-gray-800">Sources of Stress: <span className="font-bold">{score_breakdown.sourcesScore.toFixed(1)}/5</span></h4>
          <ul className="mt-1 space-y-1 text-gray-600">
            {/* Removed individual ScoreScale to reduce clutter */}
            <li className="flex justify-between"><span>Spending & Budgeting:</span> <strong>{(score_breakdown.subScores.s1a / 4).toFixed(1)}/5</strong></li>
            <li className="flex justify-between"><span>Current Confidence:</span> <strong>{(score_breakdown.subScores.s1b / 4).toFixed(1)}/5</strong></li>
            <li className="flex justify-between"><span>Social Influences:</span> <strong>{(score_breakdown.s1c / 4).toFixed(1)}/5</strong></li>
            <li className="flex justify-between"><span>Future Security:</span> <strong>{(score_breakdown.s1d / 4).toFixed(1)}/5</strong></li>
            <li className="flex justify-between"><span>Other Stressors:</span> <strong>{(score_breakdown.s1e / 4).toFixed(1)}/5</strong></li>
          </ul>
        </div>
        <div>
            <h4 className="font-semibold text-gray-800">Impacts of Stress: <span className="font-bold">{score_breakdown.impactsScore.toFixed(1)}/5</span></h4>
            <ul className="mt-1 space-y-1 text-gray-600">
                {/* Removed individual ScoreScale to reduce clutter */}
                <li className="flex justify-between"><span>Affective Reactions:</span> <strong>{(score_breakdown.subScores.s2a / 5).toFixed(1)}/5</strong></li>
                <li className="flex justify-between"><span>Interpersonal Effects:</span> <strong>{(score_breakdown.s2b / 5).toFixed(1)}/5</strong></li>
                <li className="flex justify-between"><span>Physiological Responses:</span> <strong>{(score_breakdown.s2c / 5).toFixed(1)}/5</strong></li>
            </ul>
        </div>
    </div>
  );
  
  const renderLiteracyBreakdown = () => (
    <div className="space-y-4 mt-4 text-sm">
      <div className="flex justify-around p-2 bg-gray-50 rounded-md">
        <p><strong>Habits Score:</strong> {score_breakdown.habitsScore.toFixed(0)}/100</p>
        <p><strong>Knowledge Score:</strong> {score_breakdown.knowledgeScore.toFixed(0)}/100</p>
      </div>
       <div>
            <h4 className="font-semibold text-gray-800">Knowledge Section Scores:</h4>
            <ul className="mt-1 space-y-1 text-gray-600">
              <li className="flex justify-between"><span>Spending & Budgeting:</span> <strong>{score_breakdown.subScores.spending}/5</strong></li>
              <li className="flex justify-between"><span>Interest Rates, Savings, & Loans:</span> <strong>{score_breakdown.subScores.savings}/5</strong></li>
              <li className="flex justify-between"><span>Investments & Account Types:</span> <strong>{score_breakdown.subScores.investments}/5</strong></li>
              <li className="flex justify-between"><span>Credit Cards:</span> <strong>{score_breakdown.subScores.credit}/5</strong></li>
              <li className="flex justify-between"><span>Taxes:</span> <strong>{score_breakdown.subScores.taxes}/5</strong></li>
            </ul>
        </div>
    </div>
  );

  const renderAnswers = () => {
    const testData = assessmentData[type];
    if (!testData) return <p>Could not load answers.</p>;
  
    return (
      <div className="space-y-4 text-sm text-gray-800">
        {testData.parts.map((part, pIdx) => (
          <div key={pIdx}>
            <h4 className="font-bold text-base text-gray-900 mb-2 mt-4 border-b pb-1">{part.name}</h4>
            {part.sections.map((sec:any, sIdx:number) => { // Added :any to sec for linting, and :number to sIdx
              // Get original question text based on test type and section ID
              let sectionQuestions;
              if (type === 'stress') {
                sectionQuestions = stressSourceSections.find(s => s.id === sec.id)?.questions ||
                                   stressImpactSections.find(s => s.id === sec.id)?.questions;
              } else { // literacy
                if (part.name.includes("Habits")) {
                  sectionQuestions = literacyHabitsSections.find(s => s.id === sec.id)?.questions;
                } else {
                  sectionQuestions = literacyKnowledgeSections.find(s => s.id === sec.id)?.questions;
                }
              }
              if (!sectionQuestions) return null;


              return (
              <div key={sIdx} className="mb-3">
                <h5 className="font-semibold text-gray-700">{sec.title}</h5>
                <ul className="list-disc list-outside space-y-2 mt-2 ml-5 text-gray-600">
                  {sectionQuestions.map((q: any, qIdx: number) => {
                    const answerKey = `q_${pIdx}_${sIdx}_${qIdx}`;
                    const userAnswer = user_answers[answerKey];
                    if (!userAnswer) return null;

                    const questionIsObject = typeof q === 'object' && q !== null;
                    const questionText = questionIsObject ? q.text : q;

                    // Literacy knowledge questions (multiple choice)
                    if (isLiteracy && questionIsObject && 'options' in q) {
                      const selectedOptionIndex = userAnswer.charCodeAt(0) - 'a'.charCodeAt(0);
                      const selectedOptionText = q.options[selectedOptionIndex];
                      const isCorrect = userAnswer === q.answer;
                      return (
                        <li key={qIdx}>
                          {questionText}
                          <div className={`flex items-center text-xs mt-1 p-2 rounded-md ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                            {isCorrect ? <CheckCircle className="h-4 w-4 mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                            <span>Your answer: <span className="font-semibold">{selectedOptionText}</span></span>
                          </div>
                        </li>
                      );
                    }
                    
                    // Rating-based questions (stress and literacy habits)
                    return (
                       <li key={qIdx}>
                         {questionText}
                         <span className="font-semibold text-gray-800 ml-2"> (Your rating: {userAnswer}/5)</span>
                       </li>
                    );

                  })}
                </ul>
              </div>
            )})}
          </div>
        ))}
      </div>
    )
  }


  return (
    <div className="bg-white p-4 rounded-lg shadow-md border">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">{new Date(created_at).toLocaleDateString('en-CA', { dateStyle: 'long' })}</p>
            <h3 className="text-xl font-bold text-gray-900 capitalize">{type} Score</h3>
          </div>
          <p className="text-3xl font-bold text-grima-primary">
              {overallScore.toFixed(isLiteracy ? 0 : 1)}<span className="text-xl text-gray-400">/{isLiteracy ? 100 : 5}</span>
          </p>
        </div>
        
        <div className="flex space-x-4">
            <button type="button" onClick={() => setIsDetailsExpanded(!isDetailsExpanded)} className="text-xs text-gray-500 mt-2 flex items-center hover:underline">
                {isDetailsExpanded ? 'Hide' : 'Show'} Score Breakdown {isDetailsExpanded ? <ChevronUp size={14} className="ml-1"/> : <ChevronDown size={14} className="ml-1"/>}
            </button>
             <button type="button" onClick={() => setIsAnswersExpanded(!isAnswersExpanded)} className="text-xs text-gray-500 mt-2 flex items-center hover:underline">
                {isAnswersExpanded ? 'Hide' : 'Review'} Answers {isAnswersExpanded ? <ChevronUp size={14} className="ml-1"/> : <ChevronDown size={14} className="ml-1"/>}
            </button>
        </div>

        {isDetailsExpanded && (
            <div className="mt-4 border-t pt-4">
              {isLiteracy ? renderLiteracyBreakdown() : renderStressBreakdown()}
            </div>
        )}
        {isAnswersExpanded && (
             <div className="mt-4 border-t pt-4 max-h-96 overflow-y-auto">
                <h4 className="font-semibold text-base mb-2">Your Answers:</h4>
                {renderAnswers()}
              </div>
        )}
    </div>
  );
};

export default ScoreDisplay;