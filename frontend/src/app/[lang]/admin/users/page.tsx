"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { adminFetch } from "@/lib/adminFetch";

interface AdminUsersProps {
  params: Promise<{ lang: "en" | "es" }>;
}

type Role = "user" | "contractor" | "admin";

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  role: Role;
  createdAt: string;
}

const ROLE_OPTIONS: Role[] = ["user", "contractor", "admin"];
const ROLE_COLORS: Record<Role, string> = {
  user: "bg-gray-100 text-gray-700",
  contractor: "bg-blue-100 text-blue-800",
  admin: "bg-purple-100 text-purple-800",
};

const PAGE_SIZE = 25;

export default function AdminUsersPage({ params }: AdminUsersProps) {
  const { lang } = use(params);
  const locale = lang || "en";

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const t = {
    title: locale === "es" ? "Gestión de Usuarios y Roles" : "User & Role Management",
    back: locale === "es" ? "← Volver al Panel" : "← Back to Dashboard",
    name: locale === "es" ? "Nombre" : "Name",
    contact: locale === "es" ? "Contacto" : "Contact",
    role: locale === "es" ? "Rol" : "Role",
    joined: locale === "es" ? "Registro" : "Joined",
    actions: locale === "es" ? "Acciones" : "Actions",
    noUsers: locale === "es" ? "No hay usuarios" : "No users found",
    all: locale === "es" ? "Todos" : "All",
    changeRole: locale === "es" ? "Cambiar rol" : "Change role",
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (roleFilter !== "all") {
        query = query.eq("role", roleFilter);
      }

      const { data, count, error } = await query;
      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: UserProfile[] = (data ?? []).map((p: any) => ({
        id: p.id,
        name: p.full_name || "—",
        phone: p.phone_number || "—",
        role: p.role || "user",
        createdAt: p.created_at,
      }));

      setUsers(mapped);
      setTotal(count ?? 0);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function changeRole(userId: string, newRole: Role) {
    setUpdating(userId);
    setMessage(null);
    try {
      const res = await adminFetch("/api/admin/users/update-role", {
        method: "POST",
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!res.ok) throw new Error("Failed");

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setMessage({ type: "success", text: locale === "es" ? "Rol actualizado." : "Role updated successfully." });
    } catch {
      setMessage({ type: "error", text: locale === "es" ? "Error al actualizar el rol." : "Failed to update role." });
    } finally {
      setUpdating(null);
    }
  }

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
              {total} {locale === "es" ? "usuarios en total" : "users total"}
            </p>
          </div>
        </div>
        {message && (
          <div className={`mt-3 px-4 py-2 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message.text}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Role filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["all", ...ROLE_OPTIONS] as const).map((r) => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                roleFilter === r
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {r === "all" ? t.all : r}
            </button>
          ))}
        </div>

        {/* Info banner */}
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          {locale === "es"
            ? "Cambia el rol de un usuario usando el menú desplegable. Los contratistas tienen acceso al panel de técnicos."
            : "Change a user's role using the dropdown. Contractors get access to the technician dashboard."}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-gray-500">{t.noUsers}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t.name}</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t.contact}</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t.role}</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t.joined}</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-gray-900">{u.name}</div>
                        <div className="text-xs text-gray-400 font-mono">{u.id.slice(0, 8)}…</div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">{u.phone}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${ROLE_COLORS[u.role] || "bg-gray-100 text-gray-700"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString(locale)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={u.role}
                            disabled={updating === u.id}
                            onChange={(e) => changeRole(u.id, e.target.value as Role)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                          {updating === u.id && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                          )}
                        </div>
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
