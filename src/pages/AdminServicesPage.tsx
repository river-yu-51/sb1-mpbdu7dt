import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import { db, Service } from "../lib/database";

type Draft = Partial<Service> & {
  // for form convenience
  price_dollars?: string;
};

type PrereqDraft = {
  prereq_service_id: string;
  required_status: "completed" | "scheduled_or_completed";
};

const emptyDraft = (): Draft => ({
  category: "Coaching",
  name: "",
  description: "",
  duration_minutes: 60,
  price_dollars: "0",
  is_active: true,
  requires_onboarding: true,
  is_initial: false,
  sort_order: 0,
});

const dollarsToCents = (s: string) => {
  const n = Number(String(s).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
};

const centsToDollars = (c: number) => (c / 100).toFixed(2);

const AdminServicesPage: React.FC = () => {
  const { user } = useAuth() as any;
  const isAdmin = Boolean(user?.isAdmin || user?.role === "admin");
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    if (!user) return;
    if (!isAdmin) navigate("/account");
  }, [user, isAdmin, navigate]);

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);

  // NEW: prerequisites state
  const [prereqs, setPrereqs] = useState<PrereqDraft[]>([]);
  const [prereqsLoading, setPrereqsLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await db.getServices(false); // include inactive for admin
      setServices(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      showNotification("Could not load services.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const startNew = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setPrereqs([]);
  };

  const startEdit = async (s: Service) => {
    setEditingId(s.id);
    setDraft({
      ...s,
      price_dollars: centsToDollars(s.price_cents),
    });

    setPrereqsLoading(true);
    try {
      const rows = await db.getServicePrereqs(s.id);
      setPrereqs(
        (rows ?? []).map((r: any) => ({
          prereq_service_id: r.prereq_service_id,
          required_status: r.required_status ?? "completed",
        }))
      );
    } catch (e) {
      console.error(e);
      showNotification("Could not load prerequisites.", "error");
      setPrereqs([]);
    } finally {
      setPrereqsLoading(false);
    }
  };

  const save = async () => {
    // minimal validation
    if (!draft.name?.trim()) return showNotification("Name is required.", "error");
    if (!draft.category?.trim()) return showNotification("Category is required.", "error");
    const duration = Number(draft.duration_minutes);
    if (!Number.isFinite(duration) || duration <= 0) {
      return showNotification("Duration must be a positive number.", "error");
    }

    const payload: Partial<Service> & Pick<Service, "name" | "category" | "duration_minutes"> = {
      ...(editingId ? { id: editingId } : {}),
      name: draft.name!.trim(),
      category: draft.category!.trim(),
      description: (draft.description ?? "").trim() || null,
      duration_minutes: duration,
      price_cents: dollarsToCents(draft.price_dollars ?? "0"),
      is_active: !!draft.is_active,
      requires_onboarding: !!draft.requires_onboarding,
      is_initial: !!draft.is_initial,
      sort_order: Number(draft.sort_order ?? 0) || 0,
    };

    setSavingId(editingId ?? "__new__");
    try {
      const saved = await db.upsertService(payload);
      const serviceId = saved?.id ?? editingId;
      if (!serviceId) throw new Error("Could not determine saved service id.");

      await db.replaceServicePrereqs(serviceId, prereqs);

      showNotification("Service saved.", "success");
      await load();
      startNew();
    } catch (e) {
      console.error(e);
      showNotification("Could not save service/prerequisites (RLS?)", "error");
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this service? This can affect booking options.")) return;
    try {
      await db.deleteService(id);
      showNotification("Service deleted.", "success");
      await load();
      if (editingId === id) startNew();
    } catch (e) {
      console.error(e);
      showNotification("Could not delete service (RLS?)", "error");
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const s of services) {
      const k = s.category || "Other";
      map.set(k, [...(map.get(k) ?? []), s]);
    }
    return Array.from(map.entries()).map(([cat, list]) => ({
      cat,
      list: [...list].sort(
        (a, b) =>
          (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
          a.name.localeCompare(b.name)
      ),
    }));
  }, [services]);

  const prereqOptions = useMemo(() => {
    const excludeId = editingId ?? null;
    return services
      .filter((s) => s.is_active) // optional: only allow active prereqs
      .filter((s) => s.id !== excludeId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [services, editingId]);

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
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Services</h1>
            <p className="text-gray-600 mt-2">
              Configure what clients can book (topic, duration, price, requirements).
            </p>
          </div>
          <button
            type="button"
            onClick={startNew}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-grima-primary text-white hover:bg-grima-dark"
          >
            <Plus size={16} /> New service
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b font-semibold text-gray-900">
              Existing services {loading ? "(loading…)" : ""}
            </div>
            <div className="p-4 space-y-6">
              {grouped.map(({ cat, list }) => (
                <div key={cat}>
                  <div className="text-sm font-semibold text-gray-700 mb-2">{cat}</div>
                  <div className="space-y-2">
                    {list.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => startEdit(s)}
                        className={`w-full text-left p-3 rounded-lg border hover:bg-gray-50 ${
                          editingId === s.id ? "border-grima-primary" : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {s.name}{" "}
                              {!s.is_active && (
                                <span className="text-xs text-gray-500">(inactive)</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-600">
                              {s.duration_minutes} min •{" "}
                              {s.price_cents === 0
                                ? "FREE"
                                : `$${Math.round(s.price_cents / 100)}`}
                              {s.is_initial ? " • initial" : ""}
                              {s.requires_onboarding ? " • requires onboarding" : ""}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              remove(s.id);
                            }}
                            className="p-2 rounded hover:bg-red-50 text-red-600"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {!loading && services.length === 0 && (
                <div className="text-sm text-gray-600">No services yet.</div>
              )}
            </div>
          </div>

          {/* Editor */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b font-semibold text-gray-900">
              {editingId ? "Edit service" : "New service"}
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  value={draft.category ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Coaching / Budgeting / Debt / Investing…"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (topic)</label>
                <input
                  value={draft.name ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Debt Plan Session"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={draft.description ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[100px]"
                  placeholder="What the client gets, what to prepare, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={draft.duration_minutes ?? 60}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, duration_minutes: Number(e.target.value) }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min={15}
                    step={15}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (CAD)</label>
                  <input
                    value={draft.price_dollars ?? "0"}
                    onChange={(e) => setDraft((d) => ({ ...d, price_dollars: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="0.00"
                  />
                  <div className="text-xs text-gray-500 mt-1">Stored as cents</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={!!draft.is_active}
                    onChange={(e) => setDraft((d) => ({ ...d, is_active: e.target.checked }))}
                  />
                  Active
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={!!draft.is_initial}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, is_initial: e.target.checked }))
                    }
                  />
                  Initial consult
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-700 col-span-2">
                  <input
                    type="checkbox"
                    checked={!!draft.requires_onboarding}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, requires_onboarding: e.target.checked }))
                    }
                  />
                  Requires onboarding (consent + assessments + initial)
                </label>
              </div>

              {/* NEW: prerequisites picker */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Prerequisites</label>
                  {prereqsLoading && <span className="text-xs text-gray-500">Loading…</span>}
                </div>

                <div className="text-xs text-gray-500 mb-3">
                  Choose sessions a client must complete (or at least schedule) before booking this service.
                </div>

                <div className="flex gap-2">
                  <select
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                    defaultValue=""
                    onChange={(e) => {
                      const id = e.target.value;
                      if (!id) return;
                      if (prereqs.some((p) => p.prereq_service_id === id)) {
                        e.currentTarget.value = "";
                        return;
                      }
                      setPrereqs((prev) => [
                        ...prev,
                        { prereq_service_id: id, required_status: "completed" },
                      ]);
                      e.currentTarget.value = "";
                    }}
                    disabled={prereqsLoading}
                  >
                    <option value="">+ Add prerequisite…</option>
                    {prereqOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-3 space-y-2">
                  {prereqs.length === 0 ? (
                    <div className="text-sm text-gray-600">No prerequisites.</div>
                  ) : (
                    prereqs.map((p) => {
                      const svc = services.find((s) => s.id === p.prereq_service_id);
                      return (
                        <div
                          key={p.prereq_service_id}
                          className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {svc?.name ?? p.prereq_service_id}
                            </div>
                            <div className="text-xs text-gray-500 truncate">{svc?.category ?? ""}</div>
                          </div>

                          <select
                            className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                            value={p.required_status}
                            onChange={(e) => {
                              const v = e.target.value as PrereqDraft["required_status"];
                              setPrereqs((prev) =>
                                prev.map((x) =>
                                  x.prereq_service_id === p.prereq_service_id ? { ...x, required_status: v } : x
                                )
                              );
                            }}
                          >
                            <option value="completed">Must be completed</option>
                            <option value="scheduled_or_completed">Scheduled or completed</option>
                          </select>

                          <button
                            type="button"
                            className="p-2 rounded hover:bg-red-50 text-red-600"
                            title="Remove prerequisite"
                            onClick={() =>
                              setPrereqs((prev) =>
                                prev.filter((x) => x.prereq_service_id !== p.prereq_service_id)
                              )
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {!!draft.is_initial && prereqs.length > 0 && (
                  <div className="mt-3 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    Heads up: this service is marked as an initial consult. Adding prerequisites may make it impossible to book.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort order</label>
                <input
                  type="number"
                  value={draft.sort_order ?? 0}
                  onChange={(e) => setDraft((d) => ({ ...d, sort_order: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <button
                type="button"
                onClick={save}
                disabled={savingId !== null}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-grima-primary text-white hover:bg-grima-dark disabled:opacity-50"
              >
                <Save size={16} />
                {savingId ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminServicesPage;
