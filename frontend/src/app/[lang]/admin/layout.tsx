"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const NAV = [
  { segment: "admin", label: "Dashboard", labelEs: "Panel", icon: "📊", exact: true },
  { segment: "admin/bookings", label: "Bookings", labelEs: "Reservas", icon: "📅", exact: false },
  { segment: "admin/contractors", label: "Contractors", labelEs: "Contratistas", icon: "🔧", exact: false },
  { segment: "admin/services", label: "Services", labelEs: "Servicios", icon: "🛁", exact: false },
  { segment: "admin/users", label: "Users", labelEs: "Usuarios", icon: "👥", exact: false },
  { segment: "admin/payments", label: "Payments", labelEs: "Pagos", icon: "💳", exact: false },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const lang = pathname.split("/")[1] || "en";
  const isEs = lang === "es";
  const { profile, isLoading, logout } = useAuth();

  // Auth guard — must be before any early returns to satisfy Rules of Hooks
  useEffect(() => {
    if (isLoading) return;
    if (!profile || profile.role !== "admin") {
      router.replace(`/${lang}/admin/login`);
    }
  }, [isLoading, profile, lang, router]);

  // Admin login page bypasses the layout entirely
  const isLoginPage = pathname.endsWith("/admin/login");
  if (isLoginPage) return <>{children}</>;

  const handleLogout = async () => {
    try {
      await logout();
      router.replace(`/${lang}/admin/login`);
    } catch (e) {
      console.error(e);
      window.location.href = `/${lang}/admin/login`;
    }
  };

  // Render nothing while auth state is being resolved to avoid flash
  if (isLoading || !profile || profile.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  function isActive(segment: string, exact: boolean) {
    const full = `/${lang}/${segment}`;
    return exact ? pathname === full : pathname.startsWith(full);
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 fixed top-0 left-0 h-full z-20">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="text-base font-bold text-gray-900 mb-3">Rubens Auto Detail</div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile.full_name || profile.id.slice(0, 8)}
              </p>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 uppercase tracking-wider">
                Admin
              </span>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const active = isActive(item.segment, item.exact);
            return (
              <Link
                key={item.segment}
                href={`/${lang}/${item.segment}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {isEs ? item.labelEs : item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg text-sm font-medium transition-colors mb-4"
          >
            <span>🚪</span>
            {isEs ? "Cerrar sesión" : "Log out"}
          </button>
          <p className="text-xs text-gray-400 text-center">Admin Panel v1.0</p>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-t border-gray-200" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="grid grid-cols-6 h-16">
          {NAV.map((item) => {
            const active = isActive(item.segment, item.exact);
            return (
              <Link
                key={item.segment}
                href={`/${lang}/${item.segment}`}
                className={`relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                  active
                    ? "text-blue-600"
                    : "text-gray-400 active:text-gray-600"
                }`}
              >
                {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full" />}
                <span className={`text-lg leading-none transition-transform ${active ? "scale-110" : ""}`}>{item.icon}</span>
                <span className="truncate w-full text-center px-0.5">{isEs ? item.labelEs : item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 md:ml-56 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
