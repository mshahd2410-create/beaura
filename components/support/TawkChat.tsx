"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: Date;
  }
}

export default function TawkChat() {
  useEffect(() => {
    async function loadTawk() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let name = "Guest";
      let email = "";

      if (user) {
        email = user.email || "";

        const { data: bride } = await supabase
          .from("bride_profiles")
          .select("first_name,last_name,email")
          .eq("id", user.id)
          .maybeSingle();

        const { data: mua } = await supabase
          .from("mua_profiles")
          .select("first_name,last_name")
          .eq("id", user.id)
          .maybeSingle();

        if (bride) {
          name = `${bride.first_name || ""} ${bride.last_name || ""}`.trim();
          email = bride.email || email;
        }

        if (mua) {
          name = `${mua.first_name || ""} ${mua.last_name || ""}`.trim();
        }
      }

      window.Tawk_API = window.Tawk_API || {};
      window.Tawk_LoadStart = new Date();

      window.Tawk_API.visitor = {
        name,
        email,
      };

      const script = document.createElement("script");
      script.async = true;
      script.src =
        "https://embed.tawk.to/6a25e143a4e2b61c33fca4ef/1jqhvfs24";
      script.charset = "UTF-8";
      script.setAttribute("crossorigin", "*");

      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }

    loadTawk();
  }, []);

  return null;
}