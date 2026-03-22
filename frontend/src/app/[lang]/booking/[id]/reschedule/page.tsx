"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock, ChevronLeft, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const TIME_WINDOWS = [
  { slot: "morning", label: "Morning", labelEs: "Mañana", range: "8:00 AM – 12:00 PM", rangeEs: "8:00 AM – 12:00 PM" },
  { slot: "afternoon", label: "Afternoon", labelEs: "Tarde", range: "12:00 PM – 4:00 PM", rangeEs: "12:00 PM – 4:00 PM" },
  { slot: "evening", label: "Evening", labelEs: "Noche", range: "4:00 PM – 7:00 PM", rangeEs: "4:00 PM – 7:00 PM" },
];

export default function ReschedulePage() {
  const params = useParams();
  const router = useRouter();
  const lang = (params?.lang as string) || "en";
  const id = params?.id as string;
  const isEs = lang === "es";

  const [booking, setBooking] = useState<{ date: string; status: string; service_name: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedWindow, setSelectedWindow] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("bookings")
      .select("date, status, service_name")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setBooking(data);
        setLoading(false);
      });
  }, [id]);

  const notFound = !loading && !booking;
  const canReschedule = booking
    ? (new Date(booking.date).getTime() - Date.now()) / (1000 * 60 * 60) >= 24
    : false;

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleSubmit = async () => {
    if (!selectedDate || !selectedWindow) {
      setError(isEs ? "Selecciona fecha y horario" : "Select a date and time window");
      return;
    }
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/booking/reschedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: id, newDate: selectedDate, newTimeWindow: selectedWindow }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || (isEs ? "Error al reprogramar" : "Failed to reschedule"));
      setSubmitting(false);
    } else {
      router.push(`/${lang}/dashboard`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131835] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D0B078] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#131835] px-6 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[#A5B0D1] hover:text-white mb-6 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
        {isEs ? "Volver" : "Back"}
      </button>

      <h1 className="text-2xl font-bold text-white mb-1">
        {isEs ? "Reprogramar Cita" : "Reschedule Appointment"}
      </h1>
      {booking?.service_name && (
        <p className="text-[#A5B0D1] text-sm mb-6">{booking.service_name}</p>
      )}

      {notFound ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">
            {isEs ? "Reserva no encontrada." : "Booking not found."}
          </p>
        </div>
      ) : !canReschedule ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">
            {isEs
              ? "No puedes reprogramar con menos de 24 horas de anticipación."
              : "You cannot reschedule less than 24 hours before your appointment."}
          </p>
        </div>
      ) : (
        <>
          {/* Notice */}
          <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-3 flex gap-2 mb-6">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-300 text-xs">
              {isEs
                ? "Solo puedes reprogramar con 24 horas de anticipación o más."
                : "Rescheduling is only allowed 24+ hours before your appointment."}
            </p>
          </div>

          {/* Calendar */}
          <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="text-[#A5B0D1] hover:text-white px-2 py-1"
              >
                ‹
              </button>
              <span className="text-white font-semibold">
                {currentMonth.toLocaleDateString(lang, { month: "long", year: "numeric" })}
              </span>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="text-[#A5B0D1] hover:text-white px-2 py-1"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                <div key={d} className="text-center text-xs text-[#A5B0D1] py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const y = currentMonth.getFullYear();
                const m = String(currentMonth.getMonth() + 1).padStart(2, "0");
                const d = String(day).padStart(2, "0");
                const dateStr = `${y}-${m}-${d}`;
                const isPast = dateObj < today;
                // Must be at least 24h from now
                const hoursAway = (dateObj.getTime() - Date.now()) / (1000 * 60 * 60);
                const isDisabled = isPast || hoursAway < 24;
                const isSelected = selectedDate === dateStr;

                return (
                  <button
                    key={day}
                    disabled={isDisabled}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-[#D0B078] text-[#131835]"
                        : isDisabled
                        ? "text-[#3C4568] cursor-not-allowed"
                        : "text-white hover:bg-[#D0B078]/20"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time windows */}
          {selectedDate && (
            <div className="space-y-2 mb-6">
              <p className="text-[#A5B0D1] text-sm mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {isEs ? "Selecciona un horario" : "Select a time window"}
              </p>
              {TIME_WINDOWS.map((w) => (
                <button
                  key={w.slot}
                  onClick={() => setSelectedWindow(w.slot)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    selectedWindow === w.slot
                      ? "border-[#D0B078] bg-[#D0B078]/5"
                      : "border-[#2C355E] hover:border-[#D0B078]/30"
                  }`}
                >
                  <span className="text-white font-medium">{isEs ? w.labelEs : w.label}</span>
                  <span className="text-[#A5B0D1] text-sm">{isEs ? w.rangeEs : w.range}</span>
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedDate || !selectedWindow}
            className="w-full py-4 rounded-xl bg-[#D0B078] text-[#131835] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all"
          >
            {submitting
              ? (isEs ? "Guardando..." : "Saving...")
              : (isEs ? "Confirmar Reprogramación" : "Confirm Reschedule")}
          </button>
        </>
      )}
    </div>
  );
}
