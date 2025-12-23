// src/pages/AssessmentsPage.tsx
import React, { useEffect, useMemo, useState, FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
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
  ChevronRight,
} from "lucide-react";
import Tooltip from "../components/Tooltip";

/** -------------------------
 *  SAFE STORAGE HELPERS
 *  ------------------------- */
type TempResults = {
  type: "stress" | "literacy";
  created_at: string;
  user_answers: Record<string, string>;
  score_breakdown: any;
};

function safeReadTempResults(): TempResults | null {
  const raw = sessionStorage.getItem("tempAssessmentResults");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.type && parsed?.score_breakdown) return parsed as TempResults;
    return null;
  } catch {
    return null;
  }
}

function safeWriteTempResults(results: TempResults) {
  sessionStorage.setItem("tempAssessmentResults", JSON.stringify(results));
}

function clearTempResults() {
  sessionStorage.removeItem("tempAssessmentResults");
}

/** -------------------------
 *  YOUR DATA (unchanged)
 *  ------------------------- */
// (I’m leaving your existing data definitions as-is; paste them above this line in your file)
// stressSourceSections, stressImpactSections, literacyHabitsSections, literacyKnowledgeSections, assessmentData...
// ---- paste your big DATA DEFINITIONS here ----

/** -------------------------
 *  Helper Components (keep yours)
 *  ------------------------- */
// Keep your McqQuestion, ProgressSidebar, Bar, ScoreScale, StressResultsDisplay, LiteracyResultsDisplay,
// QuestionRating, ConfirmationModal, TakingStage, ResultsStage etc.
// ---- paste your helper components here ----

/** -------------------------
 *  INITIAL ROUTE STATE
 *  ------------------------- */
const getInitialState = (locationSearch: string) => {
  const queryParams = new URLSearchParams(locationSearch);
  const startTest = queryParams.get("start") as "stress" | "literacy" | null;

  if (startTest) return { stage: "intro" as const, test: startTest };

  const temp = safeReadTempResults();
  if (temp) return { stage: "results" as const, test: temp.type };

  return { stage: "selection" as const, test: null as null | "stress" | "literacy" };
};

export default function AssessmentsPage() {
  const { user, assessmentScores, addAssessmentScore } = useAuth() as any;
  const scores = Array.isArray(assessmentScores) ? assessmentScores : [];

  const { showNotification } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();

  const [initialState] = useState(() => getInitialState(location.search));
  const [stage, setStage] = useState<"selection" | "intro" | "taking" | "results">(initialState.stage);
  const [currentTest, setCurrentTest] = useState<"stress" | "literacy" | null>(initialState.test);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<TempResults | null>(() => safeReadTempResults());

  const [showConfirmSubmitModal, setShowConfirmSubmitModal] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);

  const activeTestData = useMemo(() => {
    if (!currentTest) return null;
    return (assessmentData as any)[currentTest] ?? null;
  }, [currentTest]);

  useEffect(() => {
    if (location.search.includes("start=")) {
      navigate("/assessments", { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stage]);

  const selectTest = (type: "stress" | "literacy") => {
    setCurrentTest(type);
    setCurrentStep(0);
    setAnswers({});
    setStage("intro");
  };

  const handleAttemptSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!activeTestData) return;

    const allSections = activeTestData.parts.flatMap((p: any) => p.sections);
    const totalQuestions = allSections.reduce((count: number, section: any) => count + section.questions.length, 0);

    if (Object.keys(answers).length < totalQuestions) {
      showNotification("Please answer all questions before submitting.", "error");
      return;
    }
    setShowConfirmSubmitModal(true);
  };

  const resetState = () => {
    clearTempResults();
    setStage("selection");
    setCurrentTest(null);
    setCurrentStep(0);
    setAnswers({});
    setResults(null);
  };

  const confirmExitAssessment = () => {
    if (Object.keys(answers).length > 0 && stage === "taking") {
      setShowExitConfirmModal(true);
    } else {
      resetState();
    }
  };

  const calculateAndSubmit = async () => {
    if (!currentTest || !activeTestData) return;

    const getVal = (key: string) => parseInt(answers[key] ?? "", 10) || 0;
    const reverseScore = (val: number) => 6 - val;

    let calculatedResults: TempResults = {
      type: currentTest,
      user_answers: answers,
      created_at: new Date().toISOString(),
      score_breakdown: {},
    };

    // --- KEEP YOUR EXISTING CALC LOGIC HERE ---
    // I’m not retyping all of it in this message because it’s huge.
    // The important fixes are:
    // 1) don’t crash on storage
    // 2) save temp results safely
    //
    // So: paste your existing `if (currentTest === 'stress') { ... }`
    // and `if (currentTest === 'literacy') { ... }` blocks right here.
    //
    // IMPORTANT: replace any sessionStorage direct writes with safeWriteTempResults / clearTempResults below.

    // (Example of saving logic—same as your intent)
    try {
      if (user) {
        await addAssessmentScore({
          user_id: user.id,
          type: currentTest,
          score_breakdown: calculatedResults.score_breakdown,
          user_answers: answers,
        });
        clearTempResults();
      } else {
        safeWriteTempResults(calculatedResults);
      }
    } catch (error) {
      console.error(error);
      showNotification("Failed to save your score. Please try again.", "error");
    }

    setShowConfirmSubmitModal(false);
    setResults(calculatedResults);
    setStage("results");
  };

  // ---- Render routing ----
  if (stage === "selection") {
    return (
      <SelectionStage
        onSelect={selectTest}
        setStage={setStage}
        setResults={setResults}
        user={user}
        assessmentScores={scores}
      />
    );
  }

  if (stage === "intro") return <IntroStage testType={currentTest!} setStage={setStage} onExit={resetState} />;

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

  if (stage === "results") return <ResultsStage results={results} onRestart={resetState} user={user} />;

  return <div className="py-20 bg-grima-50 min-h-screen" />;
}

/** -------------------------
 *  SelectionStage (fixed!)
 *  ------------------------- */
const SelectionStage = ({ onSelect, setStage, setResults, user, assessmentScores }: any) => {
  const tempResults = safeReadTempResults();

  const hasTakenLiteracy =
    assessmentScores.some((s: any) => s.type === "literacy") || tempResults?.type === "literacy";
  const hasTakenStress = assessmentScores.some((s: any) => s.type === "stress") || tempResults?.type === "stress";

  const literacyScore = useMemo(() => {
    return (
      assessmentScores.find((s: any) => s.type === "literacy") ??
      (tempResults?.type === "literacy" ? tempResults : null)
    );
  }, [assessmentScores, tempResults?.type]);

  const stressScore = useMemo(() => {
    return (
      assessmentScores.find((s: any) => s.type === "stress") ??
      (tempResults?.type === "stress" ? tempResults : null)
    );
  }, [assessmentScores, tempResults?.type]);

  const viewResults = (score: any) => {
    setResults(score);
    setStage("results");
  };

  // Your existing UI can remain the same below (I’m not retyping it all)
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
      </div>
    </div>
  );
};
