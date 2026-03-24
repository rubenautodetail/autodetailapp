"use client";

import { useState, use } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { HelpCircle, Send, CheckCircle } from "lucide-react";

interface Props {
    params: Promise<{ lang: "en" | "es" }>;
}

const t = {
    en: {
        title: "Contact Support",
        subtitle: "Have a question, complaint, or suggestion? We're here to help.",
        name: "Your Name",
        email: "Your Email",
        category: "Category",
        categories: {
            question: "Question",
            complaint: "Complaint",
            suggestion: "Suggestion",
            request: "Request",
            other: "Other",
        },
        subject: "Subject",
        subjectPlaceholder: "Brief description of your issue",
        message: "Message",
        messagePlaceholder: "Please describe your issue or feedback in detail...",
        send: "Send Message",
        sending: "Sending...",
        successTitle: "Message sent!",
        successBody: "We've received your message and will get back to you shortly. Check your email for a confirmation.",
        sendAnother: "Send another message",
        error: "Failed to send. Please try again.",
        emailNote: "We'll reply to the email address above.",
    },
    es: {
        title: "Contactar Soporte",
        subtitle: "¿Tienes una pregunta, queja o sugerencia? Estamos aquí para ayudarte.",
        name: "Tu Nombre",
        email: "Tu Correo",
        category: "Categoría",
        categories: {
            question: "Pregunta",
            complaint: "Queja",
            suggestion: "Sugerencia",
            request: "Solicitud",
            other: "Otro",
        },
        subject: "Asunto",
        subjectPlaceholder: "Descripción breve de tu problema",
        message: "Mensaje",
        messagePlaceholder: "Por favor describe tu problema o comentario en detalle...",
        send: "Enviar Mensaje",
        sending: "Enviando...",
        successTitle: "¡Mensaje enviado!",
        successBody: "Recibimos tu mensaje y te responderemos en breve. Revisa tu correo para una confirmación.",
        sendAnother: "Enviar otro mensaje",
        error: "Error al enviar. Por favor intenta de nuevo.",
        emailNote: "Te responderemos al correo indicado arriba.",
    },
};

export default function SupportPage({ params }: Props) {
    const { lang } = use(params);
    const labels = t[lang];
    const { user, profile } = useAuth();

    const [name, setName] = useState<string>(profile?.full_name || "");
    const [email, setEmail] = useState<string>(user?.email || "");
    const [category, setCategory] = useState<string>("question");
    const [subject, setSubject] = useState<string>("");
    const [message, setMessage] = useState<string>("");
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSending(true);
        try {
            const res = await fetch("/api/support/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, category, subject, message }),
            });
            const json = await res.json() as { error?: string };
            if (!res.ok) throw new Error(json.error || "Failed");
            setSent(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : labels.error);
        } finally {
            setSending(false);
        }
    };

    const reset = () => {
        setSent(false);
        setSubject("");
        setMessage("");
        setCategory("question");
        setError(null);
    };

    return (
        <div className="min-h-screen bg-bg-primary px-4 py-8">
            <div className="max-w-xl mx-auto">

                {/* Header */}
                <div className="mb-8 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                        <HelpCircle className="w-5 h-5 text-accent-gold" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{labels.title}</h1>
                        <p className="text-text-secondary text-sm mt-1">{labels.subtitle}</p>
                    </div>
                </div>

                {/* Success state */}
                {sent ? (
                    <div className="bg-[#1A2142] border border-emerald-500/30 rounded-2xl p-8 text-center">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-7 h-7 text-emerald-400" />
                        </div>
                        <h2 className="text-white font-bold text-xl mb-2">{labels.successTitle}</h2>
                        <p className="text-text-secondary text-sm leading-relaxed mb-6">{labels.successBody}</p>
                        <button
                            onClick={reset}
                            className="px-6 py-2.5 bg-[#2A3155] text-white text-sm font-medium rounded-xl hover:bg-[#323d6b] transition-colors"
                        >
                            {labels.sendAnother}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-[#1A2142] border border-[#2A3155] rounded-2xl p-6 space-y-5">

                        {/* Name + Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                                    {labels.name}
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full bg-[#131835] border border-[#2A3155] rounded-xl px-4 py-2.5 text-white text-sm placeholder-text-secondary/40 focus:outline-none focus:border-accent-gold/60 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                                    {labels.email}
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-[#131835] border border-[#2A3155] rounded-xl px-4 py-2.5 text-white text-sm placeholder-text-secondary/40 focus:outline-none focus:border-accent-gold/60 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                                {labels.category}
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-[#131835] border border-[#2A3155] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent-gold/60 transition-colors appearance-none"
                            >
                                {Object.entries(labels.categories).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Subject */}
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                                {labels.subject}
                            </label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder={labels.subjectPlaceholder}
                                required
                                maxLength={200}
                                className="w-full bg-[#131835] border border-[#2A3155] rounded-xl px-4 py-2.5 text-white text-sm placeholder-text-secondary/40 focus:outline-none focus:border-accent-gold/60 transition-colors"
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                                {labels.message}
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={labels.messagePlaceholder}
                                required
                                rows={5}
                                maxLength={5000}
                                className="w-full bg-[#131835] border border-[#2A3155] rounded-xl px-4 py-3 text-white text-sm placeholder-text-secondary/40 resize-none focus:outline-none focus:border-accent-gold/60 transition-colors"
                            />
                            <p className="text-text-secondary/50 text-xs mt-1 text-right">{message.length}/5000</p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Note */}
                        <p className="text-text-secondary/60 text-xs">{labels.emailNote}</p>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={sending}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent-gold text-[#131835] font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                        >
                            {sending ? (
                                <>
                                    <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    {labels.sending}
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 shrink-0" />
                                    {labels.send}
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
