import React, { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BarChart2,
  Calendar,
  CheckCircle,
  ChevronRight,
  Download,
  ExternalLink,
  FileSignature,
  FileText,
  RefreshCcw,
  User,
  XCircle,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";

import AccountInfo from "../components/AccountInfo";
import ScoreDisplay from "../components/ScoreDisplay";

import type { Appointment, SessionNote } from "../lib/database";

type AppointmentMaybeJoined = Appointment & {
  session_notes?: SessionNote[];
  google_meet_link?: string | null;
};

const ConfirmationModal = ({
  onConfirm,
  onCancel,
  title,
  message,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
    <div className="bg-white p-8 rounded-lg shadow-2xl max-w-sm w-full mx-4">
      <div className="flex items-center justify-center mx-auto bg-red-100 rounded-full h-12 w-12">
        <AlertTriangle className="h-6 w-6 text-red-600" />
      </div>
      <div className="mt-4 text-center">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-2">{message}</p>
      </div>
      <div className="mt-6 flex justify-center space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border rounded-md font-medium text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-6 py-2 bg-red-600 text-white rounded-md font-semibold text-sm hover:bg-red-700"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
);

const OnboardingChecklist = () => {
  const { user, assessmentScores } = useAuth();
  const navigate = useNavigate();

  const hasTakenStressTest = assessmentScores.some((s) => s.type === "stress");
  const hasTakenLiteracyTest = assessmentScores.some((s) => s.type === "literacy");
  const allTasksComplete = !!user?.consentSigned && hasTakenStressTest && hasTakenLiteracyTest;

  const handleGoToStep = (assessmentType: "stress" | "literacy" | null) => {
    const path = assessmentType ? `/assessments?start=${assessmentType}` : "/consent";
    navigate(path);

    if (window.location.pathname === "/assessments") {
      window.location.reload();
    }
  };

  const checklistItems = [
    { name: "Sign Consent Form", completed: !!user?.consentSigned, action: () => handleGoToStep(null) },
    { name: "Financial Stress Assessment", completed: hasTakenStressTest, action: () => handleGoToStep("stress") },
    { name: "Financial Literacy Assessment", completed: hasTakenLiteracyTest, action: () => handleGoToStep("literacy") },
  ];

  if (allTasksComplete) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border mb-12">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Complete Your Onboarding</h2>
      <p className="text-gray-600 mb-6">
        Please complete the following steps to prepare for your first session.
      </p>

      <div className="space-y-4">
        {checklistItems.map((item, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg flex items-center justify-between ${
              item.completed ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
            } border`}
          >
            <div className="flex items-center">
              <div
                className={`mr-4 w-6 h-6 rounded-full flex items-center justify-center ${
                  item.completed ? "bg-green-500" : "bg-yellow-400"
                }`}
              >
                {item.completed ? (
                  <CheckCircle size={16} className="text-white" />
                ) : (
                  <FileSignature size={16} className="text-white" />
                )}
              </div>
              <span
                className={`font-medium ${
                  item.completed ? "text-gray-500 line-through" : "text-gray-800"
                }`}
              >
                {item.name}
              </span>
            </div>

            {!item.completed && (
              <button
                type="button"
                onClick={item.action}
                className="text-sm font-semibold text-grima-primary hover:text-grima-dark"
              >
                Go to Step →
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

function parseTs(ts: string | Date | null | undefined): Date | null {
  if (!ts) return null;
  const d = ts instanceof Date ? ts : new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateLong(d: Date) {
  return d.toLocaleDateString("en-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function formatTimeRange(start: Date | null, end: Date | null) {
  const fmt = (x: Date) => x.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return fmt(start);
  return "";
}

const UpcomingAppointmentCard = ({
  apt,
  onCancel,
  onReschedule,
}: {
  apt: AppointmentMaybeJoined;
  onCancel: (id: string) => void;
  onReschedule: (id: string) => void;
}) => {
  const start = parseTs((apt as any).start_time);
  const end = parseTs((apt as any).end_time);

  const isSessionTime = () => {
    // “session time” = within [start - 15m, end + 0m] (or +60m fallback)
    const now = new Date();
    if (!start) return false;

    const windowStart = new Date(start.getTime() - 15 * 60 * 1000);
    const windowEnd = end ? end : new Date(start.getTime() + 60 * 60 * 1000);
    return now >= windowStart && now <= windowEnd;
  };

  const canTakeAction = () => {
    // Must be 24h in advance
    if (!start) return false;
    const cutoff = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return start > cutoff;
  };

  const meetLink = (apt as any).google_meet_link as string | null | undefined;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border mb-4">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="font-bold text-xl text-gray-900">{(apt as any).service_type}</h3>

          {start && <p className="text-gray-600 font-medium">{formatDateLong(start)}</p>}
          <p className="text-sm text-gray-500">{formatTimeRange(start, end)}</p>
        </div>

        {/*isSessionTime() &&*/ meetLink ? (
          <a
            href={meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-grima-primary text-white px-4 py-2 text-sm rounded-lg font-semibold hover:bg-green-700 flex items-center shadow-sm"
          >
            <ExternalLink size={14} className="mr-2" />
            Join Google Meet
          </a>
        ) : (
          <div className="text-right">
            <div className="flex space-x-2 justify-end">
              <button
                type="button"
                disabled={!canTakeAction()}
                onClick={() => onReschedule((apt as any).id)}
                className="flex items-center text-sm text-grima-primary font-medium disabled:text-gray-400 disabled:cursor-not-allowed hover:underline"
              >
                <RefreshCcw size={14} className="mr-1" />
                Reschedule
              </button>
              <button
                type="button"
                disabled={!canTakeAction()}
                onClick={() => onCancel((apt as any).id)}
                className="flex items-center text-sm text-red-500 font-medium disabled:text-gray-400 disabled:cursor-not-allowed hover:underline"
              >
                <XCircle size={14} className="mr-1" />
                Cancel
              </button>
            </div>

            {!canTakeAction() && (
              <p className="text-xs text-gray-400 mt-1">Changes must be made 24h in advance.</p>
            )}

            {isSessionTime() && !meetLink && (
              <p className="text-xs text-gray-400 mt-1">Join link will appear here when available.</p>
            )}
          </div>
        )}
      </div>

      {(apt as any).notes && (
        <div className="mt-4 border-t pt-4">
          <p className="text-sm font-semibold text-gray-800 flex items-center">
            <FileText size={14} className="mr-2 text-gray-400" />
            Your Notes for the Session:
          </p>
          <p className="text-sm text-gray-600 italic mt-1 ml-6">"{(apt as any).notes}"</p>
        </div>
      )}
    </div>
  );
};

const AccountPage = () => {
  const { user, appointments, assessmentScores, cancelAppointment, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"appointments" | "scores" | "account">("appointments");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const recommendedSessions = useMemo(() => {
    const literacy = assessmentScores.filter((s) => s.type === "literacy").sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const stress = assessmentScores.filter((s) => s.type === "stress").sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const latestLiteracyScore = literacy.slice(-1)[0];
    const latestStressScore = stress.slice(-1)[0];

    const recommendations = new Set<string>();
    (latestLiteracyScore?.score_breakdown?.recommendations || []).forEach((rec: any) =>
      recommendations.add(JSON.stringify(rec))
    );
    (latestStressScore?.score_breakdown?.recommendations || []).forEach((rec: any) =>
      recommendations.add(JSON.stringify(rec))
    );

    return Array.from(recommendations).map((rec) => JSON.parse(rec));
  }, [assessmentScores]);

  if (isLoading) return <div className="flex justify-center items-center h-screen"><p>Loading Dashboard...</p></div>;
  if (!user) return <Navigate to="/login" replace />;

  const tabs = [
    { id: "appointments" as const, name: "Appointments", icon: <Calendar size={18} /> },
    { id: "scores" as const, name: "My Scores", icon: <BarChart2 size={18} /> },
    { id: "account" as const, name: "My Account", icon: <User size={18} /> },
  ];

  const appts = (appointments as unknown as AppointmentMaybeJoined[]) ?? [];

  const upcomingAppointments = appts.filter((apt) => (apt as any).status === "scheduled");
  const pastAppointments = appts.filter((apt) => (apt as any).status !== "scheduled");

  const literacyScores = assessmentScores
    .filter((s) => s.type === "literacy")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const stressScores = assessmentScores
    .filter((s) => s.type === "stress")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleCancelClick = (id: string) => {
    setSelectedAppointmentId(id);
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (selectedAppointmentId) {
      await cancelAppointment(selectedAppointmentId);
      showNotification("Appointment cancelled successfully.", "info");
    }
    setShowCancelModal(false);
    setSelectedAppointmentId(null);
  };

  const handleReschedule = (id: string) => {
    navigate(`/reschedule/${id}`);
  };

  const formatDateFromStart = (apt: AppointmentMaybeJoined) => {
    const start = parseTs((apt as any).start_time);
    return start ? start.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" }) : "";
  };

  return (
    <div className="py-12 md:py-20 bg-grima-50 min-h-screen">
      {showCancelModal && (
        <ConfirmationModal
          onConfirm={confirmCancel}
          onCancel={() => setShowCancelModal(false)}
          title="Cancel Appointment"
          message="Are you sure you want to cancel? This action cannot be undone."
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:grid md:grid-cols-4 md:gap-8">
          <aside className="md:col-span-1 mb-8 md:mb-0">
            <div className="bg-white rounded-lg shadow-md p-4 sticky top-24">
              <h2 className="text-lg font-bold text-gray-800 mb-4 px-3">Dashboard</h2>

              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id ? "bg-grima-100 text-grima-primary" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>

              {recommendedSessions.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <h3 className="px-3 text-sm font-semibold text-gray-900 mb-2">Recommended For You</h3>
                  <div className="space-y-1">
                    {recommendedSessions.map((rec: any, index: number) => (
                      <Link
                        key={index}
                        to={rec.link}
                        className="flex items-center space-x-2 text-grima-primary font-medium text-sm p-2 hover:bg-grima-50 rounded-md"
                      >
                        <CheckCircle size={16} />
                        <span>{rec.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          <main className="md:col-span-3">
            <OnboardingChecklist />

            {activeTab === "appointments" && (
              <div className="space-y-12">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Appointments</h2>
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map((apt) => (
                      <UpcomingAppointmentCard
                        key={(apt as any).id}
                        apt={apt}
                        onCancel={handleCancelClick}
                        onReschedule={handleReschedule}
                      />
                    ))
                  ) : (
                    <div className="text-center p-8 bg-white rounded-lg shadow-md border">
                      <p className="text-gray-600">No upcoming sessions.</p>
                      <Link to="/booking" className="text-grima-primary font-semibold mt-2 inline-block">
                        Book a new session →
                      </Link>
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Appointment History</h2>

                  {pastAppointments.length > 0 ? (
                    <div className="space-y-2">
                      {pastAppointments.map((apt) => (
                        <details key={(apt as any).id} className="bg-white rounded-lg shadow-md border group">
                          <summary className="p-4 cursor-pointer flex justify-between items-center list-none">
                            <div className="flex items-center">
                              <h3 className="font-semibold text-gray-800">
                                {(apt as any).service_type} on {formatDateFromStart(apt)}
                              </h3>
                              <span
                                className={`capitalize text-xs ml-3 px-2 py-0.5 rounded-full ${
                                  (apt as any).status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {(apt as any).status}
                              </span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 group-open:rotate-90 transition-transform" />
                          </summary>

                          <div className="px-4 pb-4 border-t">
                            <h4 className="font-medium mt-3">Session Notes & Files:</h4>

                            {apt.session_notes && apt.session_notes.length > 0 ? (
                              apt.session_notes.map((note) => (
                                <div key={note.id} className="mt-2 p-3 bg-gray-50 rounded-md">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {note.title || "Session Note"}
                                  </p>
                                  <p className="text-sm text-gray-800 mt-1">{note.content}</p>

                                  {note.file_url && (
                                    <a
                                      href={note.file_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs text-grima-primary hover:underline mt-2 flex items-center font-medium"
                                    >
                                      <Download size={12} className="mr-1" />
                                      Download attachment
                                    </a>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500 mt-1">No notes or files for this session.</p>
                            )}
                          </div>
                        </details>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-white rounded-lg shadow-md border">
                      <p className="text-gray-600">No completed sessions yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "scores" && (
              <div className="space-y-10">
                {literacyScores.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Financial Literacy Scores</h2>
                    <div className="space-y-4">
                      {literacyScores.map((score) => (
                        <ScoreDisplay key={score.id} scoreData={score} />
                      ))}
                    </div>
                  </div>
                )}

                {stressScores.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Financial Stress Scores</h2>
                    <div className="space-y-4">
                      {stressScores.map((score) => (
                        <ScoreDisplay key={score.id} scoreData={score} />
                      ))}
                    </div>
                  </div>
                )}

                {assessmentScores.length === 0 && (
                  <div className="text-center p-8 bg-white rounded-lg shadow-md border">
                    <p className="text-gray-600">You haven't completed any assessments yet.</p>
                    <Link to="/assessments" className="text-grima-primary font-semibold mt-2 inline-block">
                      Take an assessment →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === "account" && <AccountInfo />}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
