"use client";

import { useEffect, useState } from "react";

interface GoogleIntegrationsCardProps {
  locale?: "en" | "es";
}

interface ServiceStatus {
  configured: boolean;
  apiKeySnippet?: string | null;
  measurementId?: string | null;
  verificationToken?: string | null;
  apiReady?: boolean;
}

interface GoogleStatusResponse {
  configured: boolean;
  oauth: {
    authenticated: boolean;
    reason: string;
  };
  services: {
    maps: ServiceStatus;
    analytics: ServiceStatus;
    searchConsole: ServiceStatus;
    businessProfile: ServiceStatus;
  };
}

export function GoogleIntegrationsCard({ locale = "en" }: GoogleIntegrationsCardProps) {
  const isEs = locale === "es";
  const [status, setStatus] = useState<GoogleStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/google/status");
      const data = await res.json();
      if (res.ok) {
        setStatus(data);
      } else {
        setError(data.error || "Failed to load Google status");
      }
    } catch (err: any) {
      setError(err.message || "Network error fetching status");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      setError(null);
      const res = await fetch("/api/google/auth/url");
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to generate authorization URL");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect");
    } finally {
      setConnecting(false);
    }
  };

  const labels = {
    title: isEs ? "Integraciones de Google" : "Google Integrations Status",
    subtitle: isEs
      ? "Estado de conexión para Search Console, Maps, Analytics y Business Profile."
      : "Connection status for Search Console, Maps, Analytics & Business Profile.",
    connectButton: isEs ? "Conectar Cuenta de Google (OAuth 2.0)" : "Connect Google Account (OAuth 2.0)",
    reconnectButton: isEs ? "Re-conectar Cuenta de Google" : "Re-authorize Google Account",
    statusConnected: isEs ? "Conectado" : "Connected",
    statusNotConnected: isEs ? "No Conectado" : "Not Authorized",
    maps: isEs ? "Google Maps API" : "Google Maps API",
    analytics: isEs ? "Google Analytics 4 (GA4)" : "Google Analytics 4 (GA4)",
    searchConsole: isEs ? "Google Search Console" : "Google Search Console",
    businessProfile: isEs ? "Google Business Profile" : "Google Business Profile",
    ready: isEs ? "Listo" : "Ready",
    configured: isEs ? "Configurado" : "Configured",
    pendingAuth: isEs ? "Pendiente Autorización OAuth" : "Pending OAuth Auth",
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 text-slate-100 shadow-xl backdrop-blur-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.545,6.477,2.545,12s4.476,10,10,10c5.768,0,9.667-4.058,9.667-9.845c0-0.697-0.064-1.378-0.183-2.035H12.545z" />
            </svg>
            {labels.title}
          </h3>
          <p className="mt-1 text-sm text-slate-400">{labels.subtitle}</p>
        </div>

        <button
          onClick={handleConnect}
          disabled={connecting}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 transition"
        >
          {connecting ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {isEs ? "Redirigiendo..." : "Redirecting..."}
            </span>
          ) : status?.oauth?.authenticated ? (
            labels.reconnectButton
          ) : (
            labels.connectButton
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-950/80 border border-red-800 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-6 flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search Console */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">{labels.searchConsole}</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  status?.services?.searchConsole?.apiReady
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                    : "bg-amber-950 text-amber-300 border border-amber-800"
                }`}
              >
                {status?.services?.searchConsole?.apiReady ? labels.ready : labels.pendingAuth}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Site: <span className="text-slate-200 font-mono">https://dtailwash.com</span>
            </p>
          </div>

          {/* Google Maps */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">{labels.maps}</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  status?.services?.maps?.configured
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                    : "bg-rose-950 text-rose-300 border border-rose-800"
                }`}
              >
                {status?.services?.maps?.configured ? labels.configured : "Missing Key"}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              API Key:{" "}
              <span className="text-slate-200 font-mono">
                {status?.services?.maps?.apiKeySnippet || "Not set"}
              </span>
            </p>
          </div>

          {/* Google Analytics */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">{labels.analytics}</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  status?.services?.analytics?.configured
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                    : "bg-rose-950 text-rose-300 border border-rose-800"
                }`}
              >
                {status?.services?.analytics?.configured ? labels.configured : "Missing ID"}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Measurement ID:{" "}
              <span className="text-slate-200 font-mono">
                {status?.services?.analytics?.measurementId || "G-J70SXKFB1N"}
              </span>
            </p>
          </div>

          {/* Business Profile */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">{labels.businessProfile}</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  status?.services?.businessProfile?.apiReady
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                    : "bg-amber-950 text-amber-300 border border-amber-800"
                }`}
              >
                {status?.services?.businessProfile?.apiReady ? labels.ready : labels.pendingAuth}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Niche: <span className="text-slate-200">Mobile Car Detail (Miami)</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
