"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LanguageSwitch from "@/components/landing/LanguageSwitch";

// Only the open steps (1-4). Payment and confirmation never show it.
const STEP_PATH = /^\/(en|es)\/booking\/(select|location|schedule|review)\/?$/;

/**
 * EN/ES switch for booking steps 1-4. Goes to the same step in the other language,
 * keeping the query string (e.g. ?service=...). What the customer already chose lives in
 * the browser, not in the URL, so nothing is lost when the language changes.
 */
export default function BookingLanguageSwitch() {
  const pathname = usePathname();
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch(window.location.search);
  }, [pathname]);

  const match = pathname?.match(STEP_PATH);
  if (!match) return null;

  const current = match[1] as "en" | "es";
  const target = current === "en" ? "es" : "en";

  return (
    <div className="flex justify-end px-4 pt-3 sm:px-6">
      <LanguageSwitch locale={current} href={`/${target}/booking/${match[2]}${search}`} />
    </div>
  );
}
