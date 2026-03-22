"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

// ── i18n ─────────────────────────────────────────────────────────────────────

const t = {
    en: {
        title: "Settings",
        subtitle: "Manage your profile, availability, and payment info",
        // Section A
        profileTitle: "Profile",
        fullName: "Full Name",
        fullNamePlaceholder: "e.g. Carlos Mendez",
        phone: "Phone",
        phonePlaceholder: "e.g. (305) 555-0123",
        bio: "Bio",
        bioPlaceholder: "Short description of your services — customers will see this",
        saveProfile: "Save Profile",
        // Section B
        serviceAreaTitle: "Service Area",
        serviceAreaLabel: "ZIP Codes You Serve (comma separated)",
        serviceAreaPlaceholder: "33101, 33102, 33139",
        serviceAreaHelp: "Leave empty to accept jobs anywhere",
        saveServiceArea: "Save Service Area",
        // Section C — Availability toggle
        availabilityToggleTitle: "Availability",
        availabilityToggleLabel: "Accept New Jobs",
        availabilityToggleOn: "You are currently accepting new bookings",
        availabilityToggleOff: "You are currently not accepting new bookings",
        // Section D — Schedule
        scheduleTitle: "Working Schedule",
        daysLabel: "Working Days",
        startHour: "Start Time",
        endHour: "End Time",
        saveAvailability: "Save Schedule",
        days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as string[],
        dayLabels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as string[],
        // Section E — Payment Info
        paymentTitle: "Payment Info",
        paymentDesc: "How you'd like to be paid for completed jobs. Admin uses this to send your earnings.",
        paymentMethod: "Payment Method",
        paymentMethodPlaceholder: "Select method",
        paymentMethodZelle: "Zelle",
        paymentMethodACH: "ACH / Direct Deposit",
        zelleContact: "Zelle Phone or Email",
        zelleContactPlaceholder: "e.g. (305) 555-0123 or you@email.com",
        bankName: "Bank Name",
        bankNamePlaceholder: "e.g. Chase, Bank of America",
        bankAccountNumber: "Account Number",
        bankAccountNumberPlaceholder: "Enter account number",
        bankRoutingNumber: "Routing Number",
        bankRoutingNumberPlaceholder: "9-digit routing number",
        bankAccountType: "Account Type",
        bankChecking: "Checking",
        bankSavings: "Savings",
        savePayment: "Save Payment Info",
        paymentSaved: "Payment info saved",
        // Section F — Notifications
        notificationsTitle: "Notifications",
        notifEmailLabel: "Email Notifications",
        notifEmailDesc: "Receive new job alerts and booking updates by email",
        notifPushLabel: "Push Notifications",
        notifPushDesc: "Get real-time alerts in your browser",
        saveNotifications: "Save Notifications",
        // Section G — Account
        accountTitle: "Account",
        emailLabel: "Email",
        roleLabel: "Role",
        logoutBtn: "Sign Out",
        logoutConfirm: "Signed out successfully",
        // Generic
        loading: "Loading settings...",
        saving: "Saving...",
        saved: "Saved successfully",
        errorLoad: "Failed to load profile",
        errorSave: "Failed to save changes",
    },
    es: {
        title: "Configuración",
        subtitle: "Administra tu perfil, disponibilidad e info de pago",
        // Section A
        profileTitle: "Perfil",
        fullName: "Nombre Completo",
        fullNamePlaceholder: "ej. Carlos Mendez",
        phone: "Teléfono",
        phonePlaceholder: "ej. (305) 555-0123",
        bio: "Descripción",
        bioPlaceholder: "Descripción corta de tus servicios — los clientes la verán",
        saveProfile: "Guardar Perfil",
        // Section B
        serviceAreaTitle: "Área de Servicio",
        serviceAreaLabel: "Códigos ZIP que Atiendes (separados por coma)",
        serviceAreaPlaceholder: "33101, 33102, 33139",
        serviceAreaHelp: "Deja vacío para aceptar trabajos en cualquier lugar",
        saveServiceArea: "Guardar Área",
        // Section C — Availability toggle
        availabilityToggleTitle: "Disponibilidad",
        availabilityToggleLabel: "Aceptar Nuevos Trabajos",
        availabilityToggleOn: "Actualmente estás aceptando nuevas reservaciones",
        availabilityToggleOff: "Actualmente no estás aceptando nuevas reservaciones",
        // Section D — Schedule
        scheduleTitle: "Horario de Trabajo",
        daysLabel: "Días de Trabajo",
        startHour: "Hora de Inicio",
        endHour: "Hora de Fin",
        saveAvailability: "Guardar Horario",
        days: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as string[],
        dayLabels: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as string[],
        // Section E — Payment Info
        paymentTitle: "Info de Pago",
        paymentDesc: "Cómo te gustaría recibir tus pagos por trabajos completados. El administrador usa esto para enviarte tus ganancias.",
        paymentMethod: "Método de Pago",
        paymentMethodPlaceholder: "Selecciona método",
        paymentMethodZelle: "Zelle",
        paymentMethodACH: "ACH / Depósito Directo",
        zelleContact: "Teléfono o Email de Zelle",
        zelleContactPlaceholder: "ej. (305) 555-0123 o tu@email.com",
        bankName: "Nombre del Banco",
        bankNamePlaceholder: "ej. Chase, Bank of America",
        bankAccountNumber: "Número de Cuenta",
        bankAccountNumberPlaceholder: "Ingresa número de cuenta",
        bankRoutingNumber: "Número de Ruta (Routing)",
        bankRoutingNumberPlaceholder: "9 dígitos de routing",
        bankAccountType: "Tipo de Cuenta",
        bankChecking: "Corriente (Checking)",
        bankSavings: "Ahorros (Savings)",
        savePayment: "Guardar Info de Pago",
        paymentSaved: "Info de pago guardada",
        // Section F — Notifications
        notificationsTitle: "Notificaciones",
        notifEmailLabel: "Notificaciones por Correo",
        notifEmailDesc: "Recibe alertas de trabajos nuevos y actualizaciones por correo",
        notifPushLabel: "Notificaciones Push",
        notifPushDesc: "Recibe alertas en tiempo real en tu navegador",
        saveNotifications: "Guardar Notificaciones",
        // Section G — Account
        accountTitle: "Cuenta",
        emailLabel: "Correo Electrónico",
        roleLabel: "Rol",
        logoutBtn: "Cerrar Sesión",
        logoutConfirm: "Sesión cerrada exitosamente",
        // Generic
        loading: "Cargando configuración...",
        saving: "Guardando...",
        saved: "Guardado exitosamente",
        errorLoad: "Error al cargar el perfil",
        errorSave: "Error al guardar los cambios",
    },
} as const;

// ── Hour options ──────────────────────────────────────────────────────────────

function buildHourOptions(from: number, to: number): { value: number; label: string }[] {
    const opts: { value: number; label: string }[] = [];
    for (let h = from; h <= to; h++) {
        const period = h < 12 ? "am" : "pm";
        const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
        opts.push({ value: h, label: `${display}:00 ${period}` });
    }
    return opts;
}

const START_HOUR_OPTIONS = buildHourOptions(6, 12);
const END_HOUR_OPTIONS = buildHourOptions(12, 20);

// Canonical English day keys — used as stable identifiers regardless of locale
const ALL_DAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Shared UI primitives ──────────────────────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-[#1A2142] border border-[#2C355E] rounded-2xl p-6 space-y-5">
            {children}
        </div>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h2 className="text-base font-semibold text-white tracking-tight border-b border-[#2C355E] pb-4">
            {children}
        </h2>
    );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <label className="block text-xs font-semibold text-[#7D8DB5] uppercase tracking-wider mb-1.5">
            {children}
        </label>
    );
}

function TextInput({
    value,
    onChange,
    placeholder,
    type = "text",
    readOnly = false,
}: {
    value: string;
    onChange?: (v: string) => void;
    placeholder?: string;
    type?: string;
    readOnly?: boolean;
}) {
    return (
        <input
            type={type}
            value={value}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            placeholder={placeholder}
            readOnly={readOnly}
            className={`w-full bg-[#131835] border border-[#2C355E] rounded-xl px-4 py-3 text-white text-sm placeholder-[#4A5578] focus:outline-none focus:ring-2 focus:ring-[#D0B078]/40 focus:border-[#D0B078]/60 transition-all${readOnly ? " opacity-60 cursor-not-allowed" : ""}`}
        />
    );
}

function TextAreaInput({
    value,
    onChange,
    placeholder,
    rows = 3,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    rows?: number;
}) {
    return (
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full bg-[#131835] border border-[#2C355E] rounded-xl px-4 py-3 text-white text-sm placeholder-[#4A5578] focus:outline-none focus:ring-2 focus:ring-[#D0B078]/40 focus:border-[#D0B078]/60 transition-all resize-none"
        />
    );
}

function SaveBtn({
    onClick,
    loading,
    label,
    loadingLabel,
}: {
    onClick: () => void;
    loading: boolean;
    label: string;
    loadingLabel: string;
}) {
    return (
        <div className="flex justify-end pt-1">
            <button
                onClick={onClick}
                disabled={loading}
                className="px-6 py-2.5 bg-[#D0B078] text-[#131835] text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
            >
                {loading ? loadingLabel : label}
            </button>
        </div>
    );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
    return (
        <div className="min-h-screen bg-[#131835] py-8 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="h-8 w-40 bg-white/5 rounded-lg animate-pulse" />
                <div className="h-4 w-72 bg-white/5 rounded animate-pulse" />
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-[#1A2142] border border-[#2C355E] rounded-2xl p-6 space-y-4">
                        <div className="h-4 w-32 bg-white/10 rounded animate-pulse pb-4 border-b border-[#2C355E]" />
                        <div className="h-11 w-full bg-white/5 rounded-xl animate-pulse" />
                        <div className="h-11 w-full bg-white/5 rounded-xl animate-pulse" />
                        <div className="flex justify-end">
                            <div className="h-10 w-32 bg-white/10 rounded-xl animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Main page component ───────────────────────────────────────────────────────

interface SettingsPageProps {
    params: Promise<{ lang: "en" | "es" }>;
}

interface ProfileData {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    bio: string | null;
    service_area_zips: string[] | null;
    availability: { days: string[]; start_hour: number; end_hour: number } | null;
    is_available: boolean | null;
    languages: string[] | null;
    role: string | null;
    payment_preference: string | null;
    zelle_contact: string | null;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_routing_number: string | null;
    bank_account_type: string | null;
}

export default function ContractorSettingsPage({ params }: SettingsPageProps) {
    const { lang } = use(params);
    const labels = t[lang];
    const router = useRouter();
    const { session, isAuthenticated, isLoading: authLoading, logout } = useAuth();

    // ── Remote data ───────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<ProfileData | null>(null);

    // ── Section A — Profile ───────────────────────────────────────────────────
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [bio, setBio] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);

    // ── Section B — Service Area ──────────────────────────────────────────────
    const [serviceAreaInput, setServiceAreaInput] = useState("");
    const [savingArea, setSavingArea] = useState(false);

    // ── Section C — Availability toggle ──────────────────────────────────────
    const [isAvailable, setIsAvailable] = useState(true);
    const [togglingAvailability, setTogglingAvailability] = useState(false);

    // ── Section D — Working schedule ─────────────────────────────────────────
    const [selectedDays, setSelectedDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
    const [startHour, setStartHour] = useState(8);
    const [endHour, setEndHour] = useState(18);
    const [savingSchedule, setSavingSchedule] = useState(false);

    // ── Section E — Payment Info ──────────────────────────────────────────────
    const [paymentPreference, setPaymentPreference] = useState("");
    const [zelleContact, setZelleContact] = useState("");
    const [bankName, setBankName] = useState("");
    const [bankAccountNumber, setBankAccountNumber] = useState("");
    const [bankRoutingNumber, setBankRoutingNumber] = useState("");
    const [bankAccountType, setBankAccountType] = useState("checking");
    const [savingPayment, setSavingPayment] = useState(false);

    // ── Section F — Notifications ─────────────────────────────────────────────
    const [notifEmail, setNotifEmail] = useState(true);
    const [notifPush, setNotifPush] = useState(false);
    const [savingNotifs, setSavingNotifs] = useState(false);

    // ── Load profile ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated || !session?.access_token) {
            setLoading(false);
            return;
        }
        loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, isAuthenticated]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/contractors/profile", {
                headers: { Authorization: `Bearer ${session!.access_token}` },
            });
            if (!res.ok) throw new Error("Failed to load");
            const data = await res.json();
            const p: ProfileData = data.profile;
            setProfile(p);

            // Hydrate form fields
            setFullName(p.full_name ?? "");
            setPhone(p.phone ?? "");
            setBio(p.bio ?? "");
            setServiceAreaInput((p.service_area_zips ?? []).join(", "));
            setIsAvailable(p.is_available ?? true);

            if (p.availability) {
                setSelectedDays(p.availability.days ?? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
                setStartHour(p.availability.start_hour ?? 8);
                setEndHour(p.availability.end_hour ?? 18);
            }

            setPaymentPreference(p.payment_preference ?? "");
            setZelleContact(p.zelle_contact ?? "");
            setBankName(p.bank_name ?? "");
            setBankAccountNumber(p.bank_account_number ?? "");
            setBankRoutingNumber(p.bank_routing_number ?? "");
            setBankAccountType(p.bank_account_type ?? "checking");
        } catch (err) {
            console.error("Load profile error:", err);
            toast.error(labels.errorLoad);
        } finally {
            setLoading(false);
        }
    };

    // ── Generic PATCH ─────────────────────────────────────────────────────────
    const patchProfile = async (payload: Record<string, unknown>) => {
        const res = await fetch("/api/contractors/profile", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session!.access_token}`,
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error((err as { error?: string }).error ?? "Unknown error");
        }
        return res.json();
    };

    // ── Section A handler ─────────────────────────────────────────────────────
    const handleSaveProfile = async () => {
        setSavingProfile(true);
        try {
            await patchProfile({ full_name: fullName, phone, bio });
            toast.success(labels.saved);
        } catch {
            toast.error(labels.errorSave);
        } finally {
            setSavingProfile(false);
        }
    };

    // ── Section B handler ─────────────────────────────────────────────────────
    const handleSaveServiceArea = async () => {
        setSavingArea(true);
        try {
            const zips = serviceAreaInput
                .split(",")
                .map((z) => z.trim())
                .filter(Boolean);
            await patchProfile({ service_area_zips: zips });
            toast.success(labels.saved);
        } catch {
            toast.error(labels.errorSave);
        } finally {
            setSavingArea(false);
        }
    };

    // ── Section C handler — availability toggle ───────────────────────────────
    const handleToggleAvailability = async (next: boolean) => {
        setIsAvailable(next); // optimistic
        setTogglingAvailability(true);
        try {
            await patchProfile({ is_available: next });
        } catch {
            setIsAvailable(!next); // revert on failure
            toast.error(labels.errorSave);
        } finally {
            setTogglingAvailability(false);
        }
    };

    // ── Section D handler — schedule ──────────────────────────────────────────
    const handleSaveSchedule = async () => {
        setSavingSchedule(true);
        try {
            await patchProfile({
                availability: { days: selectedDays, start_hour: startHour, end_hour: endHour },
            });
            toast.success(labels.saved);
        } catch {
            toast.error(labels.errorSave);
        } finally {
            setSavingSchedule(false);
        }
    };

    // ── Toggle day ────────────────────────────────────────────────────────────
    const toggleDay = (dayEn: string) => {
        setSelectedDays((prev) =>
            prev.includes(dayEn) ? prev.filter((d) => d !== dayEn) : [...prev, dayEn]
        );
    };

    // ── Section E — Payment info save ────────────────────────────────────────
    const handleSavePayment = async () => {
        setSavingPayment(true);
        try {
            const payload: Record<string, unknown> = { payment_preference: paymentPreference };
            if (paymentPreference === "zelle") {
                payload.zelle_contact = zelleContact;
            } else if (paymentPreference === "direct_deposit") {
                payload.bank_name = bankName;
                payload.bank_account_number = bankAccountNumber;
                payload.bank_routing_number = bankRoutingNumber;
                payload.bank_account_type = bankAccountType;
            }
            await patchProfile(payload);
            toast.success(labels.paymentSaved);
        } catch {
            toast.error(labels.errorSave);
        } finally {
            setSavingPayment(false);
        }
    };

    // ── Section F handler — notifications ────────────────────────────────────
    // Notification preferences are stored locally (localStorage) since the
    // profiles table doesn't have a notification_prefs column yet. This keeps
    // the UI functional without a schema migration.
    useEffect(() => {
        try {
            const stored = localStorage.getItem("contractor_notif_prefs");
            if (stored) {
                const prefs = JSON.parse(stored) as { email: boolean; push: boolean };
                setNotifEmail(prefs.email ?? true);
                setNotifPush(prefs.push ?? false);
            }
        } catch {
            // ignore parse errors
        }
    }, []);

    const handleSaveNotifications = async () => {
        setSavingNotifs(true);
        try {
            localStorage.setItem(
                "contractor_notif_prefs",
                JSON.stringify({ email: notifEmail, push: notifPush })
            );
            toast.success(labels.saved);
        } catch {
            toast.error(labels.errorSave);
        } finally {
            setSavingNotifs(false);
        }
    };

    // ── Logout ────────────────────────────────────────────────────────────────
    const handleLogout = async () => {
        try {
            await logout();
            toast.success(labels.logoutConfirm);
            router.push(`/${lang}/contractor/login`);
        } catch {
            toast.error(labels.errorSave);
        }
    };

    // ── Guards ────────────────────────────────────────────────────────────────
    if (authLoading || loading) return <LoadingSkeleton />;

    const userEmail = session?.user?.email ?? profile?.email ?? "";
    const userRole = profile?.role ?? "contractor";

    return (
        <div className="min-h-screen bg-[#131835] py-8 px-4">
            <div className="max-w-2xl mx-auto space-y-6">

                {/* Page header */}
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">{labels.title}</h1>
                    <p className="mt-1 text-[#7D8DB5] text-sm">{labels.subtitle}</p>
                </div>

                {/* ── Section A: Profile ──────────────────────────────────── */}
                <SectionCard>
                    <SectionTitle>{labels.profileTitle}</SectionTitle>

                    <div>
                        <FieldLabel>{labels.fullName}</FieldLabel>
                        <TextInput
                            value={fullName}
                            onChange={setFullName}
                            placeholder={labels.fullNamePlaceholder}
                        />
                    </div>

                    <div>
                        <FieldLabel>{labels.phone}</FieldLabel>
                        <TextInput
                            value={phone}
                            onChange={setPhone}
                            placeholder={labels.phonePlaceholder}
                            type="tel"
                        />
                    </div>

                    <div>
                        <FieldLabel>{labels.bio}</FieldLabel>
                        <TextAreaInput
                            value={bio}
                            onChange={setBio}
                            placeholder={labels.bioPlaceholder}
                            rows={3}
                        />
                    </div>

                    <SaveBtn
                        onClick={handleSaveProfile}
                        loading={savingProfile}
                        label={labels.saveProfile}
                        loadingLabel={labels.saving}
                    />
                </SectionCard>

                {/* ── Section B: Service Area ─────────────────────────────── */}
                {/* DORMANT: geo-routing by ZIP disabled — all contractors serve full coverage area */}
                {/* Re-enable this block when multi-zone routing is needed
                <SectionCard>
                    <SectionTitle>{labels.serviceAreaTitle}</SectionTitle>
                    <div>
                        <FieldLabel>{labels.serviceAreaLabel}</FieldLabel>
                        <TextInput value={serviceAreaInput} onChange={setServiceAreaInput} placeholder={labels.serviceAreaPlaceholder} />
                        <p className="mt-2 text-xs text-[#5E698F]">{labels.serviceAreaHelp}</p>
                    </div>
                    <SaveBtn onClick={handleSaveServiceArea} loading={savingArea} label={labels.saveServiceArea} loadingLabel={labels.saving} />
                </SectionCard>
                */}

                {/* ── Section C: Availability Toggle ──────────────────────── */}
                <SectionCard>
                    <SectionTitle>{labels.availabilityToggleTitle}</SectionTitle>

                    <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-white">{labels.availabilityToggleLabel}</p>
                            <p className="mt-0.5 text-xs text-[#5E698F]">
                                {isAvailable ? labels.availabilityToggleOn : labels.availabilityToggleOff}
                            </p>
                        </div>
                        <ToggleSwitch
                            checked={isAvailable}
                            onChange={handleToggleAvailability}
                            disabled={togglingAvailability}
                            label={labels.availabilityToggleLabel}
                        />
                    </div>
                </SectionCard>

                {/* ── Section D: Working Schedule ─────────────────────────── */}
                <SectionCard>
                    <SectionTitle>{labels.scheduleTitle}</SectionTitle>

                    {/* Day pill toggles */}
                    <div>
                        <FieldLabel>{labels.daysLabel}</FieldLabel>
                        <div className="flex flex-wrap gap-2">
                            {ALL_DAYS_EN.map((dayEn, idx) => {
                                const dayLabel = labels.days[idx];
                                const active = selectedDays.includes(dayEn);
                                return (
                                    <button
                                        key={dayEn}
                                        type="button"
                                        onClick={() => toggleDay(dayEn)}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                            active
                                                ? "bg-[#D0B078]/15 border-[#D0B078]/50 text-[#D0B078]"
                                                : "bg-transparent border-[#2C355E] text-[#5E698F] hover:border-white/20 hover:text-white/60"
                                        }`}
                                    >
                                        {dayLabel}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Hour selects */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <FieldLabel>{labels.startHour}</FieldLabel>
                            <select
                                value={startHour}
                                onChange={(e) => setStartHour(Number(e.target.value))}
                                className="w-full bg-[#131835] border border-[#2C355E] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D0B078]/40 focus:border-[#D0B078]/60 transition-all"
                            >
                                {START_HOUR_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <FieldLabel>{labels.endHour}</FieldLabel>
                            <select
                                value={endHour}
                                onChange={(e) => setEndHour(Number(e.target.value))}
                                className="w-full bg-[#131835] border border-[#2C355E] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D0B078]/40 focus:border-[#D0B078]/60 transition-all"
                            >
                                {END_HOUR_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <SaveBtn
                        onClick={handleSaveSchedule}
                        loading={savingSchedule}
                        label={labels.saveAvailability}
                        loadingLabel={labels.saving}
                    />
                </SectionCard>

                {/* ── Section E: Payment Info ──────────────────────────────── */}
                <SectionCard>
                    <SectionTitle>{labels.paymentTitle}</SectionTitle>
                    <p className="text-xs text-[#5E698F] -mt-2">{labels.paymentDesc}</p>

                    <div>
                        <FieldLabel>{labels.paymentMethod}</FieldLabel>
                        <select
                            value={paymentPreference}
                            onChange={(e) => setPaymentPreference(e.target.value)}
                            className="w-full bg-[#131835] border border-[#2C355E] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D0B078]/40 focus:border-[#D0B078]/60 transition-all"
                        >
                            <option value="">{labels.paymentMethodPlaceholder}</option>
                            <option value="zelle">{labels.paymentMethodZelle}</option>
                            <option value="direct_deposit">{labels.paymentMethodACH}</option>
                        </select>
                    </div>

                    {paymentPreference === "zelle" && (
                        <div>
                            <FieldLabel>{labels.zelleContact}</FieldLabel>
                            <TextInput
                                value={zelleContact}
                                onChange={setZelleContact}
                                placeholder={labels.zelleContactPlaceholder}
                            />
                        </div>
                    )}

                    {paymentPreference === "direct_deposit" && (
                        <>
                            <div>
                                <FieldLabel>{labels.bankName}</FieldLabel>
                                <TextInput
                                    value={bankName}
                                    onChange={setBankName}
                                    placeholder={labels.bankNamePlaceholder}
                                />
                            </div>
                            <div>
                                <FieldLabel>{labels.bankAccountNumber}</FieldLabel>
                                <TextInput
                                    value={bankAccountNumber}
                                    onChange={setBankAccountNumber}
                                    placeholder={labels.bankAccountNumberPlaceholder}
                                />
                            </div>
                            <div>
                                <FieldLabel>{labels.bankRoutingNumber}</FieldLabel>
                                <TextInput
                                    value={bankRoutingNumber}
                                    onChange={setBankRoutingNumber}
                                    placeholder={labels.bankRoutingNumberPlaceholder}
                                />
                            </div>
                            <div>
                                <FieldLabel>{labels.bankAccountType}</FieldLabel>
                                <select
                                    value={bankAccountType}
                                    onChange={(e) => setBankAccountType(e.target.value)}
                                    className="w-full bg-[#131835] border border-[#2C355E] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D0B078]/40 focus:border-[#D0B078]/60 transition-all"
                                >
                                    <option value="checking">{labels.bankChecking}</option>
                                    <option value="savings">{labels.bankSavings}</option>
                                </select>
                            </div>
                        </>
                    )}

                    {paymentPreference && (
                        <SaveBtn
                            onClick={handleSavePayment}
                            loading={savingPayment}
                            label={labels.savePayment}
                            loadingLabel={labels.saving}
                        />
                    )}
                </SectionCard>

                {/* ── Section F: Notifications ────────────────────────────── */}
                <SectionCard>
                    <SectionTitle>{labels.notificationsTitle}</SectionTitle>

                    <div className="space-y-4">
                        {/* Email notifications toggle */}
                        <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-white">{labels.notifEmailLabel}</p>
                                <p className="mt-0.5 text-xs text-[#5E698F]">{labels.notifEmailDesc}</p>
                            </div>
                            <ToggleSwitch
                                checked={notifEmail}
                                onChange={setNotifEmail}
                                label={labels.notifEmailLabel}
                            />
                        </div>

                        {/* Divider */}
                        <div className="border-t border-[#2C355E]" />

                        {/* Push notifications toggle */}
                        <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-white">{labels.notifPushLabel}</p>
                                <p className="mt-0.5 text-xs text-[#5E698F]">{labels.notifPushDesc}</p>
                            </div>
                            <ToggleSwitch
                                checked={notifPush}
                                onChange={setNotifPush}
                                label={labels.notifPushLabel}
                            />
                        </div>
                    </div>

                    <SaveBtn
                        onClick={handleSaveNotifications}
                        loading={savingNotifs}
                        label={labels.saveNotifications}
                        loadingLabel={labels.saving}
                    />
                </SectionCard>

                {/* ── Section G: Account ──────────────────────────────────── */}
                <SectionCard>
                    <SectionTitle>{labels.accountTitle}</SectionTitle>

                    <div className="space-y-4">
                        <div>
                            <FieldLabel>{labels.emailLabel}</FieldLabel>
                            <TextInput value={userEmail} readOnly />
                        </div>
                        <div>
                            <FieldLabel>{labels.roleLabel}</FieldLabel>
                            <TextInput value={userRole} readOnly />
                        </div>
                    </div>

                    {/* Logout — separated visually from read-only fields */}
                    <div className="border-t border-[#2C355E] pt-5">
                        <button
                            onClick={handleLogout}
                            className="w-full sm:w-auto px-6 py-2.5 border border-red-500/40 text-red-400 text-sm font-semibold rounded-xl hover:bg-red-500/10 hover:border-red-500/60 transition-all"
                        >
                            {labels.logoutBtn}
                        </button>
                    </div>
                </SectionCard>

            </div>
        </div>
    );
}
