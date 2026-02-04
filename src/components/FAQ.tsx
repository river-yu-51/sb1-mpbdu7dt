import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Faq = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number;
  is_published: boolean;
};

export default function FAQ() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (!error && data) setFaqs(data as Faq[]);
    })();
  }, []);

  return (
    <div className="space-y-3">
      {faqs.map((f) => {
        const isOpen = open === f.id;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => setOpen(isOpen ? null : f.id)}
            className="w-full text-left bg-white border rounded-xl p-4 shadow-sm"
          >
            <div className="font-semibold text-gray-900">{f.question}</div>
            {isOpen && <div className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{f.answer}</div>}
          </button>
        );
      })}
    </div>
  );
}
