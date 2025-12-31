import React, { useEffect, useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import { db, generateTimeSlots, toISODateLocal } from "../lib/database";

type DayAvailability = { booked: string[]; blocked: string[] };

const AdminPage: React.FC = () => {
  const { user } = useAuth() as any;
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  // ---- admin guard (adjust to your user shape) ----
  const isAdmin = Boolean(user?.isAdmin || user?.role === "admin");
  useEffect(() => {
    if (!user) return;
    if (!isAdmin) navigate("/account");
  }, [user, isAdmin, navigate]);

  const [currentWeek, setCurrentWeek] = useState(0);
  const [availability, setAvailability] = useState<Record<string, DayAvailability>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const generateWeekDates = (weekOffset: number) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay(); // Sunday=0
    startOfWeek.setDate(today.getDate() - dayOfWeek + weekOffset * 7);

    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const weekDates = useMemo(() => generateWeekDates(currentWeek), [currentWeek]);

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });

  const formatWeekRange = (dates: Date[]) => `${formatDate(dates[0])} - ${formatDate(dates[6])}`;

  // ---- helpers for "Passed" slots ----
  const parseTime12h = (timeStr: string) => {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (hours === 12 && modifier === "AM") hours = 0;
    if (modifier === "PM" && hours < 12) hours += 12;
    return { hours, minutes };
  };

  const isPastSlot = (date: Date, timeStr: string) => {
    const { hours, minutes } = parseTime12h(timeStr);
    const slotStart = new Date(date);
    slotStart.setHours(hours, minutes, 0, 0);
    return slotStart.getTime() < Date.now();
  };

  // ---- load availability for the week ----
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const out: Record<string, DayAvailability> = {};
        for (const date of weekDates) {
          const iso = toISODateLocal(date);
          const res = await db.getAvailabilityForDate(iso); // { booked, blocked }
          out[iso] = {
            booked: Array.isArray(res?.booked) ? res.booked : [],
            blocked: Array.isArray(res?.blocked) ? res.blocked : [],
          };
        }
        if (!cancelled) setAvailability(out);
      } catch (e) {
        console.error(e);
        if (!cancelled) setAvailability({});
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [weekDates]);

  const isBooked = (iso: string, time: string) => (availability[iso]?.booked ?? []).includes(time);
  const isBlocked = (iso: string, time: string) => (availability[iso]?.blocked ?? []).includes(time);

  const toggleBlocked = async (iso: string, time: string, dateObj?: Date) => {
    // never allow toggling booked or passed slots
    if (isBooked(iso, time)) return;
    if (dateObj && isPastSlot(dateObj, time)) return;

    const key = `${iso} ${time}`;
    const currentlyBlocked = isBlocked(iso, time);
    const nextBlocked = !currentlyBlocked;

    // optimistic UI update
    setAvailability((prev) => {
      const day = prev[iso] ?? { booked: [], blocked: [] };
      const blockedSet = new Set(day.blocked);
      if (nextBlocked) blockedSet.add(time);
      else blockedSet.delete(time);

      return {
        ...prev,
        [iso]: { booked: day.booked, blocked: Array.from(blockedSet) },
      };
    });

    setSavingKey(key);
    try {
      // Expected: (dateISO, timeLabel, shouldBeBlocked)
      await db.updateAvailability(iso, time, nextBlocked);

      showNotification(nextBlocked ? "Slot blocked." : "Slot unblocked.", "success");
    } catch (e) {
      console.error(e);
      showNotification("Could not update slot. Reverting.", "error");

      // revert by reloading day
      try {
        const res = await db.getAvailabilityForDate(iso);
        setAvailability((prev) => ({
          ...prev,
          [iso]: {
            booked: Array.isArray(res?.booked) ? res.booked : [],
            blocked: Array.isArray(res?.blocked) ? res.blocked : [],
          },
        }));
      } catch (e2) {
        console.error(e2);
      }
    } finally {
      setSavingKey(null);
    }
  };

  if (!user || !isAdmin) {
    return (
      <div className="py-20 bg-grima-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-8 flex items-center gap-3 text-gray-700">
            <ShieldAlert className="w-5 h-5" />
            <div>
              <div className="font-semibold">Admin access required</div>
              <div className="text-sm text-gray-500">Redirecting…</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 bg-grima-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Admin Availability</h1>
          <p className="text-gray-600">
            Click a slot to toggle it as blocked (booked slots can’t be changed).
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentWeek((w) => w - 1)}
                disabled={currentWeek === 0}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                <ChevronLeft size={16} className="mr-1" />
                Previous Week
              </button>

              <h2 className="text-lg font-semibold text-gray-900">{formatWeekRange(weekDates)}</h2>

              <button
                onClick={() => setCurrentWeek((w) => w + 1)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                type="button"
              >
                Next Week
                <ChevronRight size={16} className="ml-1" />
              </button>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-gray-700 mb-4">
              <span className="inline-flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-100 border inline-block" /> Available
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-100 border inline-block" /> Blocked
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-gray-100 border inline-block" /> Booked
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-100 border inline-block" /> Passed
              </span>
            </div>

            <div className="overflow-x-auto">
              <div className="border border-gray-200 rounded-lg inline-block min-w-full">
                <div className="grid grid-cols-8 bg-gray-50">
                  <div className="p-3 text-sm font-medium text-gray-700 border-r">Time</div>
                  {weekDates.map((date) => (
                    <div
                      key={date.toISOString()}
                      className="p-3 text-sm font-medium text-center text-gray-700 border-r last:border-r-0"
                    >
                      <span className="text-grima-primary">
                        {date.toLocaleDateString("en-CA", { weekday: "short" })}
                      </span>
                      <br />
                      {date.toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                    </div>
                  ))}
                </div>

                <div>
                  {generateTimeSlots(weekDates[0]).map((time: string) => (
                    <div key={time} className="grid grid-cols-8 border-t">
                      <div className="p-3 text-xs text-gray-600 border-r bg-gray-50 font-medium">
                        {time}
                      </div>

                      {weekDates.map((date) => {
                        const iso = toISODateLocal(date);
                        const booked = isBooked(iso, time);
                        const blocked = isBlocked(iso, time);
                        const passed = isPastSlot(date, time);

                        const key = `${iso} ${time}`;
                        const isSaving = savingKey === key;

                        // Priority: booked > passed > blocked/available
                        return (
                          <div key={date.toISOString()} className="border-r last:border-r-0">
                            {booked ? (
                              <div className="w-full h-12 bg-gray-100 flex items-center justify-center">
                                <span className="text-gray-500 text-xs">Booked</span>
                              </div>
                            ) : passed ? (
                              <div
                                className="w-full h-12 bg-slate-100 flex items-center justify-center"
                                title="This time slot has already passed."
                              >
                                <span className="text-slate-500 text-xs">Passed</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => toggleBlocked(iso, time, date)}
                                disabled={isSaving}
                                className={`w-full h-12 text-xs font-medium transition-colors ${
                                  blocked
                                    ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
                                    : "bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                                } ${isSaving ? "opacity-60 cursor-wait" : ""}`}
                                title={blocked ? "Click to unblock" : "Click to block"}
                              >
                                {blocked ? "Blocked" : "Available"}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-500 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Blocked slots prevent new bookings. Booked slots are informational only.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
