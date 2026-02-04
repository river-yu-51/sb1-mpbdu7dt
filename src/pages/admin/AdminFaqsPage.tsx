import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { ArrowUp, ArrowDown, Plus, Save, Trash2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Navigate } from "react-router-dom";

type Faq = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number;
  is_published: boolean;
};

export default function AdminFaqsPage() {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [draft, setDraft] = useState<Partial<Faq>>({
    question: "",
    answer: "",
    category: "",
    is_published: true,
  });

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  const load = async () => {
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (!error && data) setFaqs(data as Faq[]);
  };

  useEffect(() => { load(); }, []);

  const createFaq = async () => {
    const maxOrder = faqs.length ? Math.max(...faqs.map(f => f.sort_order)) : 0;
    const { error } = await supabase.from("faqs").insert({
      question: draft.question?.trim(),
      answer: draft.answer?.trim(),
      category: draft.category?.trim() || null,
      is_published: draft.is_published ?? true,
      sort_order: maxOrder + 1,
    });
    if (!error) {
      setDraft({ question: "", answer: "", category: "", is_published: true });
      await load();
    }
  };

  const updateFaq = async (id: string, patch: Partial<Faq>) => {
    const { error } = await supabase.from("faqs").update(patch).eq("id", id);
    if (!error) await load();
  };

  const deleteFaq = async (id: string) => {
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (!error) await load();
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const a = faqs[idx];
    const b = faqs[idx + dir];
    if (!a || !b) return;
    // swap sort_order
    await supabase.from("faqs").update({ sort_order: b.sort_order }).eq("id", a.id);
    await supabase.from("faqs").update({ sort_order: a.sort_order }).eq("id", b.id);
    await load();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Manage FAQs</h1>

      {/* Create */}
      <div className="mt-6 bg-white border rounded-xl p-4 shadow-sm space-y-3">
        <div className="font-semibold">Add new FAQ</div>
        <input
          className="w-full border rounded-lg p-2"
          placeholder="Question"
          value={draft.question ?? ""}
          onChange={(e) => setDraft(d => ({ ...d, question: e.target.value }))}
        />
        <textarea
          className="w-full border rounded-lg p-2 min-h-[120px]"
          placeholder="Answer"
          value={draft.answer ?? ""}
          onChange={(e) => setDraft(d => ({ ...d, answer: e.target.value }))}
        />
        <div className="flex gap-3 items-center">
          <input
            className="border rounded-lg p-2 flex-1"
            placeholder="Category (optional)"
            value={draft.category ?? ""}
            onChange={(e) => setDraft(d => ({ ...d, category: e.target.value }))}
          />
          <label className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={draft.is_published ?? true}
              onChange={(e) => setDraft(d => ({ ...d, is_published: e.target.checked }))}
            />
            Published
          </label>
          <button
            onClick={createFaq}
            className="inline-flex items-center gap-2 bg-black text-white px-3 py-2 rounded-lg"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {/* List */}
      <div className="mt-6 space-y-3">
        {faqs.map((f, idx) => (
          <div key={f.id} className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="flex justify-between gap-3">
              <div className="flex-1">
                <input
                  className="w-full border rounded-lg p-2 font-semibold"
                  value={f.question}
                  onChange={(e) => setFaqs(prev => prev.map(x => x.id === f.id ? { ...x, question: e.target.value } : x))}
                />
                <textarea
                  className="w-full border rounded-lg p-2 mt-2 min-h-[100px]"
                  value={f.answer}
                  onChange={(e) => setFaqs(prev => prev.map(x => x.id === f.id ? { ...x, answer: e.target.value } : x))}
                />
                <div className="flex items-center gap-3 mt-2">
                  <input
                    className="border rounded-lg p-2 flex-1"
                    value={f.category ?? ""}
                    placeholder="Category"
                    onChange={(e) => setFaqs(prev => prev.map(x => x.id === f.id ? { ...x, category: e.target.value } : x))}
                  />
                  <label className="text-sm flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={f.is_published}
                      onChange={(e) => updateFaq(f.id, { is_published: e.target.checked })}
                    />
                    Published
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button className="p-2 border rounded-lg" onClick={() => move(idx, -1)} title="Move up">
                  <ArrowUp size={16} />
                </button>
                <button className="p-2 border rounded-lg" onClick={() => move(idx, 1)} title="Move down">
                  <ArrowDown size={16} />
                </button>
                <button
                  className="p-2 border rounded-lg"
                  onClick={() => updateFaq(f.id, { question: f.question, answer: f.answer, category: (f.category || null) })}
                  title="Save"
                >
                  <Save size={16} />
                </button>
                <button className="p-2 border rounded-lg text-red-600" onClick={() => deleteFaq(f.id)} title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
