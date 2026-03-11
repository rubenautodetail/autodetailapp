"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface AdminPaymentsProps {
  params: Promise<{ lang: "en" | "es" }>;
}

interface CompletedJob {
  bookingId: number;
  contractorId: string;
  contractorName: string;
  contractorPhone: string;
  serviceName: string;
  scheduledDate: string;
  totalAmount: number;
  paymentStatus: string;
  confirmationCode: string;
}

interface ContractorSummary {
  contractorId: string;
  contractorName: string;
  contractorPhone: string;
  jobCount: number;
  grossRevenue: number;
  platformFee: number;
  contractorPayout: number;
  jobs: CompletedJob[];
}

const PLATFORM_FEE_RATE = 0.15;

export default function AdminPaymentsPage({ params }: AdminPaymentsProps) {
  const { lang } = use(params);
  const locale = lang || "en";

  const [summaries, setSummaries] = useState<ContractorSummary[]>([]);
  const [allJobs, setAllJobs] = useState<CompletedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [view, setView] = useState<"summary" | "all">("summary");

  const t = {
    title: locale === "es" ? "Pagos a Técnicos" : "Technician Payments",
    back: locale === "es" ? "← Volver al Panel" : "← Back to Dashboard",
    summary: locale === "es" ? "Por Técnico" : "By Technician",
    allJobs: locale === "es" ? "Todos los Trabajos" : "All Jobs",
    noData: locale === "es" ? "No hay trabajos completados aún" : "No completed jobs yet",
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const supabase = createClient();

        // Fetch all completed bookings that have a contractor assigned
        const { data: bookings, error } = await supabase
          .from("bookings")
          .select("*")
          .eq("status", "completed")
          .not("contractor_id", "is", null)
          .order("date", { ascending: false });

        if (error) throw error;

        const bList = (bookings ?? []) as Array<Record<string, unknown>>;

        if (bList.length === 0) {
          setSummaries([]);
          setAllJobs([]);
          setLoading(false);
          return;
        }

        // Collect unique contractor IDs
        const contractorIds = [...new Set(bList.map((b) => b.contractor_id as string).filter(Boolean))];

        // Batch-fetch contractor profiles
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, phone_number")
          .in("id", contractorIds);

        const profileMap: Record<string, { name: string; phone: string }> = {};
        (profiles ?? []).forEach((p) => {
          const pp = p as Record<string, unknown>;
          profileMap[pp.id as string] = {
            name: (pp.full_name as string) ?? "Unknown",
            phone: (pp.phone_number as string) ?? "—",
          };
        });

        // Build job list
        const jobs: CompletedJob[] = bList.map((b) => {
          const contractorId = b.contractor_id as string;
          const profile = profileMap[contractorId] ?? { name: "Unknown", phone: "—" };
          return {
            bookingId: b.id as number,
            contractorId,
            contractorName: profile.name,
            contractorPhone: profile.phone,
            serviceName: (b.service_name as string) ?? "—",
            scheduledDate: (b.date as string) ?? "",
            totalAmount: b.total_amount ? parseFloat(String(b.total_amount)) : 0,
            paymentStatus: (b.payment_status as string) ?? "—",
            confirmationCode: (b.confirmation_code as string) ?? "",
          };
        });

        setAllJobs(jobs);

        // Group by contractor
        const grouped: Record<string, ContractorSummary> = {};
        jobs.forEach((j) => {
          if (!grouped[j.contractorId]) {
            grouped[j.contractorId] = {
              contractorId: j.contractorId,
              contractorName: j.contractorName,
              contractorPhone: j.contractorPhone,
              jobCount: 0,
              grossRevenue: 0,
              platformFee: 0,
              contractorPayout: 0,
              jobs: [],
            };
          }
          const s = grouped[j.contractorId];
          s.jobCount++;
          s.grossRevenue += j.totalAmount;
          s.platformFee = s.grossRevenue * PLATFORM_FEE_RATE;
          s.contractorPayout = s.grossRevenue - s.platformFee;
          s.jobs.push(j);
        });

        setSummaries(Object.values(grouped).sort((a, b) => b.grossRevenue - a.grossRevenue));
      } catch (err) {
        console.error("Payments load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalGross = summaries.reduce((s, c) => s + c.grossRevenue, 0);
  const totalPlatformFee = totalGross * PLATFORM_FEE_RATE;
  const totalPayouts = totalGross - totalPlatformFee;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <Link href={`/${locale}/admin`} className="text-sm text-blue-600 hover:underline mb-2 block">
          {t.back}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <p className="text-sm text-gray-500">
          {locale === "es" ? "Solo trabajos completados" : "Completed jobs only"}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Totals */}
        {!loading && summaries.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-500 mb-1">{locale === "es" ? "Total Facturado" : "Total Billed"}</p>
              <p className="text-2xl font-bold text-gray-900">${totalGross.toFixed(2)}</p>
            </div>
            <div className="bg-purple-50 rounded-xl border border-purple-200 p-5">
              <p className="text-xs text-purple-600 mb-1">{locale === "es" ? "Ingresos Plataforma (15%)" : "Platform Revenue (15%)"}</p>
              <p className="text-2xl font-bold text-purple-700">${totalPlatformFee.toFixed(2)}</p>
            </div>
            <div className="bg-green-50 rounded-xl border border-green-200 p-5">
              <p className="text-xs text-green-600 mb-1">{locale === "es" ? "Pago Total Técnicos (85%)" : "Total Technician Payouts (85%)"}</p>
              <p className="text-2xl font-bold text-green-700">${totalPayouts.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* View toggle */}
        <div className="flex gap-2 mb-4">
          {(["summary", "all"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                view === v ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {v === "summary" ? t.summary : t.allJobs}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : summaries.length === 0 ? (
          <div className="text-center py-20 text-gray-500">{t.noData}</div>
        ) : view === "summary" ? (
          /* Summary view — per contractor */
          <div className="space-y-3">
            {summaries.map((c) => (
              <div key={c.contractorId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Contractor row */}
                <button
                  onClick={() => setExpanded(expanded === c.contractorId ? null : c.contractorId)}
                  className="w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{c.contractorName}</p>
                      <p className="text-xs text-gray-500">{c.contractorPhone} · {c.jobCount} {locale === "es" ? "trabajos" : "jobs"}</p>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <p className="text-xs text-gray-400">{locale === "es" ? "Gross" : "Gross"}</p>
                        <p className="text-sm font-medium text-gray-700">${c.grossRevenue.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-purple-400">{locale === "es" ? "Plataforma" : "Platform"}</p>
                        <p className="text-sm font-medium text-purple-700">${c.platformFee.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-500">{locale === "es" ? "A pagar" : "Owed"}</p>
                        <p className="text-sm font-bold text-green-700">${c.contractorPayout.toFixed(2)}</p>
                      </div>
                      <span className="text-gray-400 text-sm">{expanded === c.contractorId ? "▲" : "▼"}</span>
                    </div>
                  </div>
                </button>

                {/* Expanded job list */}
                {expanded === c.contractorId && (
                  <div className="border-t border-gray-100">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left px-6 py-2 text-xs text-gray-500 font-medium">
                            {locale === "es" ? "Reserva" : "Booking"}
                          </th>
                          <th className="text-left px-6 py-2 text-xs text-gray-500 font-medium">
                            {locale === "es" ? "Servicio" : "Service"}
                          </th>
                          <th className="text-left px-6 py-2 text-xs text-gray-500 font-medium">
                            {locale === "es" ? "Fecha" : "Date"}
                          </th>
                          <th className="text-right px-6 py-2 text-xs text-gray-500 font-medium">
                            {locale === "es" ? "Total" : "Total"}
                          </th>
                          <th className="text-right px-6 py-2 text-xs text-gray-500 font-medium">
                            {locale === "es" ? "A pagar (85%)" : "Payout (85%)"}
                          </th>
                          <th className="text-left px-6 py-2 text-xs text-gray-500 font-medium">
                            {locale === "es" ? "Pago" : "Payment"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {c.jobs.map((j) => (
                          <tr key={j.bookingId} className="hover:bg-gray-50">
                            <td className="px-6 py-3">
                              <Link
                                href={`/${locale}/admin/bookings/${j.bookingId}`}
                                className="text-sm text-blue-600 hover:underline font-mono"
                              >
                                #{j.bookingId}
                              </Link>
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-700">{j.serviceName}</td>
                            <td className="px-6 py-3 text-sm text-gray-500">
                              {j.scheduledDate ? new Date(j.scheduledDate).toLocaleDateString(locale) : "—"}
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-700 text-right">${j.totalAmount.toFixed(2)}</td>
                            <td className="px-6 py-3 text-sm font-semibold text-green-700 text-right">
                              ${(j.totalAmount * (1 - PLATFORM_FEE_RATE)).toFixed(2)}
                            </td>
                            <td className="px-6 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                j.paymentStatus === "captured" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                              }`}>
                                {j.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* All jobs flat list */
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {locale === "es" ? "Reserva" : "Booking"}
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {locale === "es" ? "Técnico" : "Technician"}
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {locale === "es" ? "Servicio" : "Service"}
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {locale === "es" ? "Fecha" : "Date"}
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {locale === "es" ? "Total" : "Total"}
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {locale === "es" ? "Pago técnico" : "Tech Payout"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allJobs.map((j) => (
                    <tr key={j.bookingId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <Link
                          href={`/${locale}/admin/bookings/${j.bookingId}`}
                          className="text-sm text-blue-600 hover:underline font-mono"
                        >
                          #{j.bookingId}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-gray-900">{j.contractorName}</div>
                        <div className="text-xs text-gray-400">{j.contractorPhone}</div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">{j.serviceName}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {j.scheduledDate ? new Date(j.scheduledDate).toLocaleDateString(locale) : "—"}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-900 text-right">${j.totalAmount.toFixed(2)}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-green-700 text-right">
                        ${(j.totalAmount * (1 - PLATFORM_FEE_RATE)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
