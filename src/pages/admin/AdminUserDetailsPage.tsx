import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Calendar, CheckCircle2, ClipboardList, XCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { db, type Appointment, type AssessmentScore, type User } from "../../lib/database";

function displayName(u: User) {
  const first = (u.first ?? "").trim();
  const last = (u.last ?? "").trim();
  const full = `${first} ${last}`.trim();
  return full || u.email;
}

function getOverallScore(s: AssessmentScore): number | null {
  const raw = (s as any)?.score_breakdown?.overallScore;
  if (!Number.isFinite(raw)) return null;

  // Stress scores are out of 5 -> convert to /100
  if (s.type === "stress") {
    return Math.round(Number(raw) * 20);
  }

  // Literacy already out of 100
  return Math.round(Number(raw));
}


export default function AdminUserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { admin_getAppointmentsForClient, admin_getScoresForClient } = useAuth();

  const [profile, setProfile] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [scores, setScores] = useState<AssessmentScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [p, a, s] = await Promise.all([
          db.getUserById(id),
          admin_getAppointmentsForClient(id),
          admin_getScoresForClient(id),
        ]);
        if (cancelled) return;
        setProfile(p);
        setAppointments(Array.isArray(a) ? a : []);
        setScores(Array.isArray(s) ? s : []);
      } catch (e) {
        console.error("AdminUserDetailsPage load failed:", e);
        if (cancelled) return;
        setProfile(null);
        setAppointments([]);
        setScores([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, admin_getAppointmentsForClient, admin_getScoresForClient]);

  const latestByType = useMemo(() => {
    const out: Record<string, AssessmentScore | null> = { stress: null, literacy: null };
    for (const s of scores) {
      if (!out[s.type]) out[s.type] = s;
    }
    return out as { stress: AssessmentScore | null; literacy: AssessmentScore | null };
  }, [scores]);

  const completedAppointments = useMemo(
    () => appointments.filter((a) => a.status === "completed"),
    [appointments]
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 text-sm text-gray-600">Loading user...</div>
      ) : !profile ? (
        <div className="mt-4 text-sm text-gray-600">User not found (or you don’t have access).</div>
      ) : (
        <>
          <div className="mt-4">
            <h1 className="text-xl font-bold">{displayName(profile)}</h1>
            <p className="text-gray-600 mt-1">{profile.email}</p>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-xl p-4">
              <div className="text-sm text-gray-600">Consent</div>
              <div className="mt-2 flex items-center gap-2 font-medium">
                {profile.consent_signed ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Signed
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-amber-600" />
                    Not signed
                  </>
                )}
              </div>
              {profile.consent_signed_at && (
                <div className="mt-1 text-xs text-gray-500">
                  Signed on {new Date(profile.consent_signed_at).toLocaleString()}
                </div>
              )}
            </div>

            <div className="border rounded-xl p-4">
              <div className="text-sm text-gray-600">Literacy score (latest)</div>
              <div className="mt-2 text-2xl font-bold">
                {latestByType.literacy ? (getOverallScore(latestByType.literacy) ?? "—") : "—"}
              </div>
              {latestByType.literacy?.created_at && (
                <div className="mt-1 text-xs text-gray-500">
                  {new Date(latestByType.literacy.created_at).toLocaleString()}
                </div>
              )}
            </div>

            <div className="border rounded-xl p-4">
              <div className="text-sm text-gray-600">Stress score (latest)</div>
              <div className="mt-2 text-2xl font-bold">
                {latestByType.stress ? (getOverallScore(latestByType.stress) ?? "—") : "—"}
              </div>
              {latestByType.stress?.created_at && (
                <div className="mt-1 text-xs text-gray-500">
                  {new Date(latestByType.stress.created_at).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="font-bold flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Score history
            </h2>
            <div className="mt-3 border rounded-xl overflow-hidden">
              {scores.length === 0 ? (
                <div className="p-4 text-sm text-gray-600">No assessments yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left font-medium p-3">Type</th>
                      <th className="text-left font-medium p-3">Overall</th>
                      <th className="text-left font-medium p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {scores.map((s) => (
                      <tr key={s.id}>
                        <td className="p-3 capitalize">{s.type}</td>
                        <td className="p-3">{getOverallScore(s) ?? "—"}</td>
                        <td className="p-3">{new Date(s.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Session history
            </h2>
            <div className="mt-3 border rounded-xl overflow-hidden">
              {completedAppointments.length === 0 ? (
                <div className="p-4 text-sm text-gray-600">No completed sessions yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left font-medium p-3">Service</th>
                      <th className="text-left font-medium p-3">Start</th>
                      <th className="text-left font-medium p-3">End</th>
                      <th className="text-left font-medium p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {completedAppointments.map((a) => (
                      <tr key={a.id}>
                        <td className="p-3">{a.service?.name ?? a.service_type ?? "—"}</td>
                        <td className="p-3">{new Date(a.start_time).toLocaleString()}</td>
                        <td className="p-3">{new Date(a.end_time).toLocaleString()}</td>
                        <td className="p-3 capitalize">{a.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {appointments.length > completedAppointments.length && (
              <div className="mt-2 text-xs text-gray-500">
                Showing completed sessions only (there are also scheduled/cancelled items).
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
