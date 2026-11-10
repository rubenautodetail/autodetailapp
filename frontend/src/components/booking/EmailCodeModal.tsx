"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface EmailCodeModalProps {
  locale: "en" | "es";
  email: string;
  /** Required in "booking" mode (used to create the account); ignored in "login" mode. */
  name?: string;
  /** "booking": creates the account if new. "login": only signs in an existing account. */
  mode?: "booking" | "login";
  onVerified: () => void;
  onClose: () => void;
}

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

/**
 * Asks the visitor for the 6-digit code we emailed them. Verifying it signs them in
 * (creating the account if the email is new), so the booking can move on to payment
 * without a separate sign-up step.
 */
export function EmailCodeModal({ locale, email, name = "", mode = "booking", onVerified, onClose }: EmailCodeModalProps) {
  const es = locale === "es";
  const isLogin = mode === "login";
  const { refreshProfile } = useAuth();
  const supabase = createClient();

  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"sending" | "ready" | "verifying">("sending");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestedRef = useRef(false);

  const t = {
    title: es ? "Revisa tu correo" : "Check your email",
    sentTo: es ? "Enviamos un código de 6 dígitos a" : "We sent a 6-digit code to",
    why: isLogin
      ? (es ? "Con este código entras a tu cuenta. No necesitas contraseña." : "This code signs you in to your account. No password needed.")
      : (es
        ? "Con este código creamos tu cuenta y guardamos tu reserva. No necesitas contraseña."
        : "This code creates your account and saves your booking. No password needed."),
    verifyLogin: es ? "Verificar y entrar" : "Verify and sign in",
    label: es ? "Código" : "Code",
    verify: es ? "Verificar y continuar" : "Verify and continue",
    verifying: es ? "Verificando…" : "Verifying…",
    sending: es ? "Enviando código…" : "Sending code…",
    resend: es ? "Reenviar código" : "Resend code",
    resendIn: es ? "Reenviar en" : "Resend in",
    wrongEmail: es ? "Corregir correo" : "Change email",
    badCode: es
      ? "Ese código no es correcto o ya venció. Revisa el correo o pide uno nuevo."
      : "That code is incorrect or has expired. Check your email or request a new one.",
    sendFailed: es
      ? "No pudimos enviar el código. Revisa el correo e inténtalo de nuevo."
      : "We couldn't send the code. Check the email and try again.",
    rateLimited: es
      ? "Se pidieron demasiados códigos. Espera unos minutos e inténtalo de nuevo."
      : "Too many codes requested. Please wait a few minutes and try again.",
    profileFailed: es
      ? "Tu código es válido, pero no pudimos terminar de crear tu cuenta. Inténtalo de nuevo."
      : "Your code is valid, but we couldn't finish creating your account. Please try again.",
    spam: es ? "¿No llega? Revisa spam o promociones." : "Not arriving? Check spam or promotions.",
    close: es ? "Cerrar" : "Close",
  };

  const requestCode = useCallback(async () => {
    setError("");
    setStatus("sending");
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, mode }),
      });
      if (!res.ok) {
        setError(res.status === 429 ? t.rateLimited : t.sendFailed);
        setStatus("ready");
        return;
      }
      setCooldown(RESEND_SECONDS);
      setStatus("ready");
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch {
      setError(t.sendFailed);
      setStatus("ready");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, name, mode, es]);

  // Send the first code when the window opens (once, even in React strict mode).
  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    void requestCode();
  }, [requestCode]);

  // Resend countdown.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const verify = useCallback(
    async (value: string) => {
      if (value.length !== CODE_LENGTH || status === "verifying") return;
      setError("");
      setStatus("verifying");

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: value,
        type: "email",
      });

      if (verifyError || !data.session || !data.user) {
        setError(t.badCode);
        setStatus("ready");
        setCode("");
        setTimeout(() => inputRef.current?.focus(), 50);
        return;
      }

      // Login mode: the account already exists, nothing to create.
      if (isLogin) {
        await refreshProfile();
        onVerified();
        return;
      }

      // Make sure the profile row exists (new accounts). Existing profiles are left untouched.
      try {
        const profileRes = await fetch("/api/auth/create-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({ userId: data.user.id, name, role: "user" }),
        });
        if (!profileRes.ok) throw new Error(`create-profile ${profileRes.status}`);
      } catch {
        setError(t.profileFailed);
        setStatus("ready");
        return;
      }

      await refreshProfile();
      onVerified();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [email, name, status, es, isLogin]
  );

  const onChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
    if (digits.length === CODE_LENGTH) void verify(digits);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-code-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-[#2C355E] bg-[#1A2145] p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label={t.close}
          className="absolute right-4 top-4 text-[#8994B8] transition-colors hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#D0B078]/15 text-[#D0B078]">
          <Mail size={22} />
        </div>

        <h2 id="email-code-title" className="text-xl font-bold text-white">
          {t.title}
        </h2>
        <p className="mt-2 text-sm text-[#A5B0D1]">
          {t.sentTo} <span className="font-semibold text-white break-words">{email}</span>
        </p>
        <p className="mt-1 text-xs text-[#8994B8]">{t.why}</p>

        <label htmlFor="email-code-input" className="mt-6 block text-xs font-medium uppercase tracking-wider text-[#8994B8]">
          {t.label}
        </label>
        <input
          id="email-code-input"
          ref={inputRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={CODE_LENGTH}
          placeholder="••••••"
          disabled={status === "verifying"}
          className="mt-2 w-full rounded-xl border border-[#2C355E] bg-[#131835] px-4 py-3 text-center text-2xl font-semibold tracking-[0.5em] text-white outline-none transition-colors placeholder:text-[#4A5480] focus:border-[#D0B078]"
        />

        <div aria-live="polite" className="mt-3 min-h-[1.25rem] text-sm">
          {status === "sending" && <p className="text-[#A5B0D1]">{t.sending}</p>}
          {error && <p className="text-[#FF8A8A]">{error}</p>}
        </div>

        <button
          type="button"
          onClick={() => verify(code)}
          disabled={code.length !== CODE_LENGTH || status !== "ready"}
          className="btn-primary mt-3 inline-flex w-full items-center justify-center rounded-full px-6 py-4 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "verifying" ? t.verifying : isLogin ? t.verifyLogin : t.verify}
        </button>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={onClose}
            className="text-[#A5B0D1] underline-offset-2 transition-colors hover:text-white hover:underline"
          >
            {t.wrongEmail}
          </button>
          <button
            type="button"
            onClick={() => void requestCode()}
            disabled={cooldown > 0 || status !== "ready"}
            className="text-[#D0B078] underline-offset-2 transition-colors hover:underline disabled:cursor-not-allowed disabled:text-[#6B7599] disabled:no-underline"
          >
            {cooldown > 0 ? `${t.resendIn} ${cooldown}s` : t.resend}
          </button>
        </div>

        <p className="mt-4 text-xs text-[#6B7599]">{t.spam}</p>
      </div>
    </div>
  );
}
