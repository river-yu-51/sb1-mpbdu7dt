import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);

      if (error) {
        console.error(error);
        navigate("/login?verified=0", { replace: true });
        return;
      }

      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      const verified = !!user?.email_confirmed_at;

      navigate(verified ? "/login?verified=1" : "/login?verified=0", { replace: true });
    })();
  }, [navigate]);

  return <div className="p-8">Verifying email…</div>;
}
