'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

type Role = 'user' | 'contractor' | 'admin';

const ROLE_DESTINATIONS: Record<Role, string> = {
    user: '/en/dashboard',
    contractor: '/en/contractor/dashboard',
    admin: '/en/admin',
};

const ROLE_COLORS: Record<Role, string> = {
    user: 'bg-blue-600 hover:bg-blue-700',
    contractor: 'bg-emerald-600 hover:bg-emerald-700',
    admin: 'bg-purple-600 hover:bg-purple-700',
};

export default function DevRoleSwitcher() {
    const [userId, setUserId] = useState<string | null>(null);
    const [currentRole, setCurrentRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data }) => {
            if (!data.user) return;
            setUserId(data.user.id);

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single();

            if (profile) setCurrentRole(profile.role as Role);
        });
    }, []);

    if (!userId) return null;

    async function switchRole(role: Role) {
        setLoading(true);
        await fetch('/api/dev/switch-role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, role }),
        });
        // Navigate to the right dashboard for that role
        window.location.assign(ROLE_DESTINATIONS[role]);
    }

    return (
        <div className="fixed bottom-24 right-4 z-[9999] md:bottom-6">
            {open && (
                <div className="mb-2 flex flex-col gap-1 rounded-xl bg-gray-900 p-3 shadow-2xl border border-gray-700">
                    <p className="text-xs text-gray-400 mb-1 text-center font-mono">
                        DEV · current: <span className="text-white font-bold">{currentRole ?? '…'}</span>
                    </p>
                    {(['user', 'contractor', 'admin'] as Role[]).map((role) => (
                        <button
                            key={role}
                            onClick={() => switchRole(role)}
                            disabled={loading || currentRole === role}
                            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-40 ${ROLE_COLORS[role]}`}
                        >
                            {loading ? '…' : `→ ${role.charAt(0).toUpperCase() + role.slice(1)}`}
                        </button>
                    ))}
                </div>
            )}
            <button
                onClick={() => setOpen((o) => !o)}
                className="ml-auto flex items-center gap-1.5 rounded-full bg-gray-900 border border-gray-600 px-3 py-2 text-xs font-mono font-bold text-yellow-400 shadow-xl hover:bg-gray-800 transition"
            >
                🛠 DEV
            </button>
        </div>
    );
}
