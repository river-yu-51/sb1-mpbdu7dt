import React, { useEffect, useMemo, useState, FormEvent } from "react";
import { MessageSquare, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

type ContactPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
  user_id: string | null;
};

const ChatWidget: React.FC = () => {
  const { user, addMessage } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const displayName = useMemo(() => {
    if (!user) return "";
    const first = (user as any).firstName ?? (user as any).first ?? "";
    const last = (user as any).lastName ?? (user as any).last ?? "";
    return `${first} ${last}`.trim();
  }, [user]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "General Inquiry",
    message: "",
  });

  // Keep form in sync when user loads/logs out
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: user ? displayName : prev.name,
      email: user ? user.email ?? "" : prev.email,
    }));
  }, [user, displayName]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmed = formData.message.trim();
    const subject = (formData.subject || "General Inquiry").trim();

    if (!trimmed) return;

    // If not logged in, require name/email
    if (!user) {
      if (!formData.name.trim()) return;
      if (!formData.email.trim()) return;
    }

    const payload: ContactPayload = {
      user_id: user?.id ?? null,
      name: user ? displayName || formData.name.trim() : formData.name.trim(),
      email: user ? (user.email ?? formData.email).trim() : formData.email.trim(),
      subject,
      message: trimmed,
    };

    setSending(true);
    try {
      // 1) Store message (audit trail / admin inbox)
      // If your RLS is not fixed yet, this might throw.
      try {
        await addMessage({
          user_id: payload.user_id,
          name: payload.name,
          email: payload.email,
          subject: payload.subject,
          message: payload.message,
        });
      } catch (dbErr) {
        // Don't fail the whole UX if email send works.
        console.warn("addMessage failed (likely RLS):", dbErr);
      }

      // 2) Send email via Supabase Edge Function
      // IMPORTANT: function name matches your folder: contact_email
      const { data, error } = await supabase.functions.invoke("contact_email", {
        body: {
          name: payload.name,
          email: payload.email,
          subject: payload.subject,
          message: payload.message,
        },
      });

      if (error) {
        console.error("contact_email invoke error:", error);
        throw new Error("Failed to send email. Please try again.");
      }

      // optional: if your function returns { ok: true }
      // console.log("contact_email success:", data);

      setSubmitted(true);

      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setFormData((prev) => ({ ...prev, message: "" }));
      }, 2000);
    } catch (err: any) {
      console.error("ChatWidget send failed:", err);
      setErrorMsg(err?.message ?? "Something went wrong sending your message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-5 z-50">
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="bg-grima-primary text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:bg-grima-dark transition-transform transform hover:scale-110"
          aria-label="Open chat"
        >
          <MessageSquare size={32} />
        </button>
      )}

      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-80 h-auto flex flex-col transition-all">
          <div className="bg-grima-primary text-white p-4 flex justify-between items-center rounded-t-lg">
            <h3 className="font-bold">Contact Us</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-4 flex-grow">
            {submitted ? (
              <div className="text-center py-10">
                <p className="font-semibold">Thank you!</p>
                <p className="text-sm">Your message has been sent.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {!user && (
                  <>
                    <div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your Name"
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                        required
                        disabled={sending}
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Your Email"
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                        required
                        disabled={sending}
                      />
                    </div>
                  </>
                )}

                {/* Optional: expose subject if you want */}
                {/* <div>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Subject"
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    disabled={sending}
                  />
                </div> */}

                <div>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Type your message..."
                    rows={5}
                    className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                    required
                    disabled={sending}
                  />
                </div>

                {errorMsg && (
                  <div className="text-sm text-red-600">{errorMsg}</div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-grima-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-grima-dark transition-colors disabled:opacity-50"
                  >
                    {sending ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
