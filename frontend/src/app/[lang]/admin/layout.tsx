"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const NAV = [
  { segment: "admin", label: "Dashboard", labelEs: "Panel", icon: "📊", exact: true },
  { segment: "admin/bookings", label: "Bookings", labelEs: "Reservas", icon: "📅", exact: false },
  { segment: "admin/contractors", label: "Contractors", labelEs: "Contratistas", icon: "🔧", exact: false },
  { segment: "admin/users", label: "Users", labelEs: "Usuarios", icon: "👥", exact: false },
  { segment: "admin/payments", label: "Payments", labelEs: "Pagos", icon: "💳", exact: false },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const lang = pathname.split("/")[1] || "en";
  const isEs = lang === "es";
  const { profile, isLoading } = useAuth();

  // Auth guard — only users with role === 'admin' may access this section
  useEffect(() => {
    if (isLoading) return;
    if (!profile || profile.role !== "admin") {
      router.replace(`/${lang}`);
    }
  }, [isLoading, profile, lang, router]);

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
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-0.5">Admin</div>
          <div className="text-base font-bold text-gray-900">Rubens Auto Detail</div>
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
          <p className="text-xs text-gray-400">Admin Panel v1.0</p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b border-gray-200 flex overflow-x-auto">
        {NAV.map((item) => {
          const active = isActive(item.segment, item.exact);
          return (
            <Link
              key={item.segment}
              href={`/${lang}/${item.segment}`}
              className={`flex flex-col items-center gap-0.5 px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
                active
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {isEs ? item.labelEs : item.label}
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-56 pt-[56px] md:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
