import React, { useEffect, useMemo, useState } from "react";
import { ChevronRight, Search, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import type { User } from "../../lib/database";

function displayName(u: User) {
  const first = (u.first ?? "").trim();
  const last = (u.last ?? "").trim();
  const full = `${first} ${last}`.trim();
  return full || u.email;
}

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { loadAllUsers } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await loadAllUsers();
        if (cancelled) return;
        setUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("loadAllUsers failed:", e);
        if (cancelled) return;
        setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadAllUsers]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((u) => {
      const hay = `${u.email} ${u.first ?? ""} ${u.last ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [users, q]);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Users
          </h1>
          <p className="text-gray-600 mt-1">Click a user to view consent, scores, and session history.</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          />
        </div>
      </div>

      <div className="mt-4 border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-4 text-sm text-gray-600">Loading users...</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">No users found.</div>
        ) : (
          <ul className="divide-y">
            {filtered.map((u) => (
              <li key={u.id}>
                <button
                  onClick={() => navigate(`/admin/users/${u.id}`)}
                  className="w-full text-left p-4 hover:bg-gray-50 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{displayName(u)}</div>
                    <div className="text-sm text-gray-600 truncate">{u.email}</div>
                    <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
                      <span className={u.consent_signed ? "text-emerald-700" : "text-amber-700"}>
                        {u.consent_signed ? "Consent: signed" : "Consent: not signed"}
                      </span>
                      <span>•</span>
                      <span>Joined {new Date(u.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-none" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
