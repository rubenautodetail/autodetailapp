"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock, ChevronLeft, AlertCircle, Info, ChevronDown, XCircle, CalendarClock } from "lucide-react";


interface TimeWindowConfig {
  slot: string;
  label: string;
  labelEs: string;
  range: string;
  rangeEs: string;
}

const DEFAULT_TIME_SLOTS: TimeWindowConfig[] = [
  { slot: "09:00", label: "9:00 AM", labelEs: "9:00 AM", range: "9:00 AM", rangeEs: "9:00 AM" },
  { slot: "10:00", label: "10:00 AM", labelEs: "10:00 AM", range: "10:00 AM", rangeEs: "10:00 AM" },
  { slot: "11:00", label: "11:00 AM", labelEs: "11:00 AM", range: "11:00 AM", rangeEs: "11:00 AM" },
  { slot: "12:00", label: "12:00 PM", labelEs: "12:00 PM", range: "12:00 PM", rangeEs: "12:00 PM" },
  { slot: "13:00", label: "1:00 PM", labelEs: "1:00 PM", range: "1:00 PM", rangeEs: "1:00 PM" },
  { slot: "14:00", label: "2:00 PM", labelEs: "2:00 PM", range: "2:00 PM", rangeEs: "2:00 PM" },
  { slot: "15:00", label: "3:00 PM", labelEs: "3:00 PM", range: "3:00 PM", rangeEs: "3:00 PM" },
  { slot: "16:00", label: "4:00 PM", labelEs: "4:00 PM", range: "4:00 PM", rangeEs: "4:00 PM" },
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
  const [showPolicy, setShowPolicy] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeWindowConfig[]>([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(true);

  // Fetch booking data via API (bypasses RLS)
  useEffect(() => {
    fetch(`/api/booking/get?id=${id}`)
      .then((res) => res.ok ? res.json() : null)
      .then((json) => {
        if (json?.booking) {
          setBooking({ date: json.booking.date, status: json.booking.status, service_name: json.booking.service_name });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  // Fetch time slots — same logic as the original booking schedule page
  useEffect(() => {
    const fetchTimeSlots = async () => {
      setIsLoadingTimeSlots(true);
      try {
        const response = await fetch("/api/admin/time-windows", {
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          setTimeSlots(DEFAULT_TIME_SLOTS);
        } else {
          const data = await response.json();
          if (data.timeWindows && data.timeWindows.length > 0) {
            // Normalize API response (label_es -> labelEs, range_es -> rangeEs)
            const normalized: TimeWindowConfig[] = data.timeWindows
              .filter((tw: { is_active?: boolean }) => tw.is_active !== false)
              .map((tw: { slot: string; label: string; label_es?: string; labelEs?: string; range: string; range_es?: string; rangeEs?: string }) => ({
                slot: tw.slot,
                label: tw.label,
                labelEs: tw.labelEs || tw.label_es || tw.label,
                range: tw.range,
                rangeEs: tw.rangeEs || tw.range_es || tw.range,
              }));
            setTimeSlots(normalized.length > 0 ? normalized : DEFAULT_TIME_SLOTS);
          } else {
            setTimeSlots(DEFAULT_TIME_SLOTS);
          }
        }
      } catch {
        setTimeSlots(DEFAULT_TIME_SLOTS);
      } finally {
        setIsLoadingTimeSlots(false);
      }
    };

    fetchTimeSlots();
  }, []);

  const notFound = !loading && !booking;
  const canReschedule = booking
    ? (new Date(booking.date).getTime() - Date.now()) / (1000 * 60 * 60) >= 2
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

  const isTimeSlotAvailable = (slot: TimeWindowConfig): boolean => {
    if (!selectedDate) return true;
    const selectedDateObj = new Date(selectedDate + "T00:00:00");
    const now = new Date();
    const isToday = selectedDateObj.toDateString() === now.toDateString();
    if (!isToday) return true;
    // Require at least 1 hour lead time (same as original booking flow)
    const slotHour = parseInt(slot.slot.split(":")[0], 10);
    return slotHour > now.getHours() + 1;
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedWindow) {
      setError(isEs ? "Selecciona fecha y horario" : "Select a date and time slot");
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
      router.push(`/${lang}/customer`);
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
              ? "No puedes reprogramar con menos de 2 horas de anticipación."
              : "You cannot reschedule less than 2 hours before your appointment."}
          </p>
        </div>
      ) : (
        <>
          {/* Contextual warning when within 24h */}
          {booking && (new Date(booking.date).getTime() - Date.now()) / (1000 * 60 * 60) < 24 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex gap-2 mb-4">
              <CalendarClock className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
              <p className="text-green-300 text-xs">
                {isEs
                  ? "Tu cita es en menos de 24 horas. Reprogramar es gratis, pero cancelar aplicaría un cargo del 50%."
                  : "Your appointment is less than 24 hours away. Rescheduling is free, but cancelling would incur a 50% fee."}
              </p>
            </div>
          )}

          {/* Policy info toggle */}
          <div className="mb-6 space-y-2">
            <button
              onClick={() => setShowPolicy(!showPolicy)}
              className="flex items-center gap-1.5 text-xs text-[#A5B0D1]/70 hover:text-[#A5B0D1] transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
              {isEs ? "Políticas de cancelación y reprogramación" : "Cancellation & reschedule policy"}
              <ChevronDown className={`w-3 h-3 transition-transform ${showPolicy ? "rotate-180" : ""}`} />
            </button>
            {showPolicy && (
              <div className="bg-[#1A2142] border border-[#2C355E] rounded-xl p-3 space-y-2 text-xs text-[#A5B0D1]/80">
                <div className="flex items-start gap-2">
                  <CalendarClock className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <p>
                    {isEs
                      ? "Reprogramación gratuita hasta 2 horas antes de la cita. No se permite reprogramar con menos de 2 horas de anticipación."
                      : "Free rescheduling up to 2 hours before your appointment. Rescheduling is not available less than 2 hours before."}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <p>
                    {isEs
                      ? "Cancelación gratuita hasta 24 horas antes de la cita. Cancelaciones con menos de 24 horas incurren un cargo del 50% del servicio."
                      : "Free cancellation up to 24 hours before your appointment. Cancellations within 24 hours incur a 50% service fee."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Calendar */}
          <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="text-[#A5B0D1] hover:text-white px-2 py-1"
              >
                &#8249;
              </button>
              <span className="text-white font-semibold">
                {currentMonth.toLocaleDateString(lang, { month: "long", year: "numeric", timeZone: "America/New_York" })}
              </span>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="text-[#A5B0D1] hover:text-white px-2 py-1"
              >
                &#8250;
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {(isEs
                ? ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"]
                : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
              ).map(d => (
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
                const hoursAway = (dateObj.getTime() - Date.now()) / (1000 * 60 * 60);
                const isDisabled = isPast || hoursAway < 2;
                const isSelected = selectedDate === dateStr;

                return (
                  <button
                    key={day}
                    disabled={isDisabled}
                    onClick={() => { setSelectedDate(dateStr); setSelectedWindow(""); }}
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

          {/* Time slots — same granular slots as original booking flow */}
          {selectedDate && (
            <div className="mb-6">
              <p className="text-[#A5B0D1] text-sm mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {isEs ? "Selecciona un horario" : "Select a time slot"}
              </p>

              {isLoadingTimeSlots ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-6 h-6 border-2 border-[#D0B078] border-t-transparent rounded-full animate-spin" />
                  <span className="ml-2 text-[#A5B0D1] text-sm">
                    {isEs ? "Cargando horarios..." : "Loading time slots..."}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {timeSlots.map((slot) => {
                    const isSelected = selectedWindow === slot.slot;
                    const isAvailable = isTimeSlotAvailable(slot);
                    const displayLabel = isEs ? slot.labelEs : slot.label;

                    return (
                      <button
                        key={slot.slot}
                        disabled={!isAvailable}
                        onClick={() => setSelectedWindow(slot.slot)}
                        className={`
                          p-4 rounded-xl border transition-all duration-200 relative
                          ${!isAvailable
                            ? "border-[#2C355E] bg-transparent opacity-40 cursor-not-allowed"
                            : isSelected
                              ? "border-[#D0B078] bg-[#D0B078]/10 ring-1 ring-[#D0B078]"
                              : "border-[#2C355E] bg-white/5 hover:bg-white/10 hover:border-[#D0B078]/30"
                          }
                        `}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5">
                            <div className="w-4 h-4 bg-[#D0B078] rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-[#131835]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                        <p className={`font-bold text-center transition-colors ${isSelected ? "text-[#D0B078]" : "text-white"}`}>
                          {displayLabel}
                        </p>
                        <p className={`text-xs text-center mt-1 ${
                          !isAvailable
                            ? "text-[#5E698F]"
                            : isSelected
                              ? "text-[#D0B078]/80"
                              : "text-[#5E698F]"
                        }`}>
                          {!isAvailable
                            ? (isEs ? "Pasado" : "Passed")
                            : (isEs ? "Disponible" : "Available")}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Selection summary */}
          {selectedDate && selectedWindow && (
            <div className="bg-[#D0B078]/5 border border-[#D0B078]/30 rounded-xl p-4 mb-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D0B078]/20 flex-shrink-0 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#D0B078]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-white text-sm">
                  {isEs ? "Nueva Cita" : "New Appointment"}
                </p>
                <p className="text-white text-sm">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString(lang, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    timeZone: "America/New_York",
                  })}
                </p>
                <p className="text-[#D0B078] text-sm">
                  {isEs
                    ? (timeSlots.find(s => s.slot === selectedWindow)?.labelEs || selectedWindow)
                    : (timeSlots.find(s => s.slot === selectedWindow)?.label || selectedWindow)}
                </p>
              </div>
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
