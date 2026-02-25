"use client";

import { useState, useEffect, use, useCallback, Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface AdminContractorsProps {
  params: Promise<{ lang: "en" | "es" }>;
}

interface Contractor {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}

const PAGE_SIZE = 20;

function AdminContractorsContent({ locale }: { locale: string }) {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const t = {
    title: locale === "es" ? "Gestión de Contratistas" : "Contractor Management",
    back: locale === "es" ? "← Volver al Panel" : "← Back to Dashboard",
    name: locale === "es" ? "Nombre" : "Name",
    contact: locale === "es" ? "Contacto" : "Contact",
    status: locale === "es" ? "Estado" : "Status",
    joined: locale === "es" ? "Registro" : "Joined",
    noContractors: locale === "es" ? "No hay contratistas registrados" : "No contractors registered yet",
  };

  const fetchContractors = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .eq("role", "contractor")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: Contractor[] = (data ?? []).map((p: any) => ({
        id: p.id,
        name: p.full_name || "—",
        phone: p.phone_number || "—",
        createdAt: p.created_at,
      }));

      setContractors(mapped);
      setTotal(count ?? 0);
    } catch (err) {
      console.error("Error fetching contractors:", err);
      setContractors([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchContractors(); }, [fetchContractors]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <Link href={`/${locale}/admin`} className="text-sm text-blue-600 hover:underline mb-2 block">
          {t.back}
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
            <p className="text-sm text-gray-500">
              {total} {locale === "es" ? "contratistas activos" : "active contractors"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : contractors.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 mb-2">{t.noContractors}</p>
              <p className="text-sm text-gray-400 max-w-sm mx-auto">
                {locale === "es"
                  ? "Los contratistas aparecerán aquí una vez que se registren y se les asigne el rol de contratista."
                  : "Contractors will appear here once they register and are assigned the contractor role."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t.name}</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t.contact}</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t.status}</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t.joined}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {contractors.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{c.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">{c.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          {locale === "es" ? "Activo" : "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(c.createdAt).toLocaleDateString(locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">
              {locale === "es" ? `Página ${page} de ${totalPages}` : `Page ${page} of ${totalPages}`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                ←
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminContractorsPage({ params }: AdminContractorsProps) {
  const { lang } = use(params);
  const locale = lang || "en";
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      }
    >
      <AdminContractorsContent locale={locale} />
    </Suspense>
  );
}
