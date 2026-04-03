"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/contexts";
import { PricingSummary, ProgressIndicator } from "@/components/booking";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface TimeWindowConfig {
  slot: string;
  label: string;
  labelEs: string;
  range: string;
  rangeEs: string;
}

interface SchedulePageProps {
  params: Promise<{
    lang: "en" | "es";
  }>;
}

// Time windows will be fetched from API
let TIME_WINDOWS: Array<{ slot: string; label: string; labelEs: string; range: string; rangeEs: string }> = [];

export default function SchedulePage({ params }: SchedulePageProps) {
  const router = useRouter();
  const { lang } = use(params);
  const locale = lang || "en";

  const {
    selectedService,
    selectedAddOns,
    customerLocation,
    selectedDate,
    selectedTimeWindow,
    setSchedule,
    subtotal,
    serviceFee,
    total,
    currentStep,
    nextStep,
    previousStep,
  } = useBooking();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(selectedDate);
  const [tempSelectedWindow, setTempSelectedWindow] = useState<TimeWindowConfig | null>(null);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [timeWindows, setTimeWindows] = useState<TimeWindowConfig[]>([]);
  const [isLoadingTimeWindows, setIsLoadingTimeWindows] = useState(true);

  // Redirect if prerequisites not met
  useEffect(() => {
    if (!selectedService) {
      router.push(`/${locale}/booking/select`);
    }
    if (!customerLocation) {
      router.push(`/${locale}/booking/location`);
    }
  }, [selectedService, customerLocation, router, locale]);

  // Fetch time windows when language changes
  useEffect(() => {
    const fetchTimeWindows = async () => {
      setIsLoadingTimeWindows(true);
      try {
        const response = await fetch(`/api/admin/time-windows`, {
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          // Fallback to default time windows if API fails
          setTimeWindows([
            { slot: "09:00", label: "9:00 AM", labelEs: "9:00 AM", range: "9:00 AM", rangeEs: "9:00 AM" },
            { slot: "10:00", label: "10:00 AM", labelEs: "10:00 AM", range: "10:00 AM", rangeEs: "10:00 AM" },
            { slot: "11:00", label: "11:00 AM", labelEs: "11:00 AM", range: "11:00 AM", rangeEs: "11:00 AM" },
            { slot: "12:00", label: "12:00 PM", labelEs: "12:00 PM", range: "12:00 PM", rangeEs: "12:00 PM" },
            { slot: "13:00", label: "1:00 PM", labelEs: "1:00 PM", range: "1:00 PM", rangeEs: "1:00 PM" },
            { slot: "14:00", label: "2:00 PM", labelEs: "2:00 PM", range: "2:00 PM", rangeEs: "2:00 PM" },
            { slot: "15:00", label: "3:00 PM", labelEs: "3:00 PM", range: "3:00 PM", rangeEs: "3:00 PM" },
            { slot: "16:00", label: "4:00 PM", labelEs: "4:00 PM", range: "4:00 PM", rangeEs: "4:00 PM" },
          ]);
        } else {
          const data = await response.json();
          setTimeWindows(data.timeWindows || []);
        }
      } catch (error) {
        console.error("Error fetching time windows:", error);
        // Fallback to default time windows
        setTimeWindows([
          { slot: "09:00", label: "9:00 AM", labelEs: "9:00 AM", range: "9:00 AM", rangeEs: "9:00 AM" },
          { slot: "10:00", label: "10:00 AM", labelEs: "10:00 AM", range: "10:00 AM", rangeEs: "10:00 AM" },
          { slot: "11:00", label: "11:00 AM", labelEs: "11:00 AM", range: "11:00 AM", rangeEs: "11:00 AM" },
          { slot: "12:00", label: "12:00 PM", labelEs: "12:00 PM", range: "12:00 PM", rangeEs: "12:00 PM" },
          { slot: "13:00", label: "1:00 PM", labelEs: "1:00 PM", range: "1:00 PM", rangeEs: "1:00 PM" },
          { slot: "14:00", label: "2:00 PM", labelEs: "2:00 PM", range: "2:00 PM", rangeEs: "2:00 PM" },
          { slot: "15:00", label: "3:00 PM", labelEs: "3:00 PM", range: "3:00 PM", rangeEs: "3:00 PM" },
          { slot: "16:00", label: "4:00 PM", labelEs: "4:00 PM", range: "4:00 PM", rangeEs: "4:00 PM" },
        ]);
      } finally {
        setIsLoadingTimeWindows(false);
      }
    };

    fetchTimeWindows();
  }, [locale]);

  // Fetch availability when month changes
  useEffect(() => {
    const controller = new AbortController();

    const fetchAvailability = async () => {
      if (!customerLocation?.zipCode || !selectedService) return;

      setIsLoadingAvailability(true);
      try {
        const month = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;

        const response = await fetch(`/api/booking/availability`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            zipCode: customerLocation.zipCode,
            serviceId: selectedService.documentId,
            month,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch availability");
        }

        const data = await response.json();

        // Convert available dates to Set for quick lookup
        const dateSet = new Set<string>();
        if (data.availableDates && Array.isArray(data.availableDates)) {
          data.availableDates.forEach((dateInfo: any) => {
            if (dateInfo.date) {
              dateSet.add(dateInfo.date);
            }
          });
        }

        setAvailableDates(dateSet);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Error fetching availability:", error);
        // On error, allow all future dates (fallback behavior)
        const dateSet = new Set<string>();
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month, day);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (date >= today) {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            dateSet.add(dateStr);
          }
        }

        setAvailableDates(dateSet);
      } finally {
        setIsLoadingAvailability(false);
      }
    };

    fetchAvailability();
    return () => controller.abort();
  }, [currentMonth, customerLocation, selectedService]);

  // Generate calendar days
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isDateAvailable = (date: Date | null): boolean => {
    if (!date) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create max date (14 days from today)
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 14);

    // Can't book past dates or beyond 14 days
    if (date < today || date > maxDate) return false;

    // Optional: check real contractor availability from API
    // If we only enforce the 14 days, we can skip API check if it's missing,
    // but the API also handles holiday/busy schedules.
    // For now, if it's within 14 days, it's considered available locally unless the API strictly overrides.
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    // If availableDates is populated from API, use it. Otherwise rely on local 14-days logic.
    if (availableDates.size > 0 && !availableDates.has(dateStr)) {
      return false;
    }

    return true;
  };

  const handleDateSelect = (date: Date) => {
    if (!isDateAvailable(date)) return;
    setTempSelectedDate(date);
    setTempSelectedWindow(null);
  };

  const isTimeWindowAvailable = (window: TimeWindowConfig): boolean => {
    if (!tempSelectedDate) return true;
    const today = new Date();
    const isToday = tempSelectedDate.toDateString() === today.toDateString();
    if (!isToday) return true;
    // Require at least 1 hour lead time
    const slotHour = parseInt(window.slot.split(":")[0], 10);
    return slotHour > today.getHours() + 1;
  };

  const handleWindowSelect = (window: TimeWindowConfig) => {
    if (!isTimeWindowAvailable(window)) return;
    setTempSelectedWindow(window);
  };

  const handleContinue = () => {
    if (!tempSelectedDate || !tempSelectedWindow) return;

    setSchedule(tempSelectedDate, tempSelectedWindow);
    nextStep();
    router.push(`/${locale}/booking/review`);
  };

  const handleBack = () => {
    previousStep();
    router.push(`/${locale}/booking/location`);
  };

  const monthName = currentMonth.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });

  const weekDays =
    locale === "es"
      ? ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const days = getDaysInMonth(currentMonth);

  if (!selectedService || !customerLocation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#131835] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Indicator */}
        <ProgressIndicator currentStep={currentStep} locale={locale} />

        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            {locale === "es"
              ? "Elige Fecha y Horario"
              : "Choose Date & Time"}
          </h1>
          <p className="text-lg text-[var(--text-secondary)]">
            {locale === "es"
              ? "Selecciona cuándo te gustaría el servicio"
              : "Select when you'd like service"}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Left column: Calendar & Time Selection */}
          <div className="lg:col-span-2 space-y-8">
            {/* Calendar */}
            <Card className="p-4 sm:p-8 relative !bg-[#1A2142] !border-[#2C355E]">
              {isLoadingAvailability && (
                <div className="absolute top-6 right-6 flex items-center gap-2 text-sm text-[#D0B078] animate-fade-in">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#D0B078]"></div>
                  {locale === "es" ? "Cargando..." : "Loading..."}
                </div>
              )}

              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                    )
                  }
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-[var(--text-secondary)] hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <h2 className="text-xl font-bold text-white capitalize">{monthName}</h2>

                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
                    )
                  }
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-[var(--text-secondary)] hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-x-1 sm:gap-x-2 gap-y-2 sm:gap-y-4">
                {/* Week day headers */}
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-xs font-semibold uppercase tracking-wider text-[#5E698F] py-2">
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {days.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const isAvailable = isDateAvailable(date);
                  const isSelected =
                    tempSelectedDate?.toDateString() === date.toDateString();
                  const isToday = date.toDateString() === new Date().toDateString();

                  return (
                    <button
                      key={index}
                      onClick={() => handleDateSelect(date)}
                      disabled={!isAvailable}
                      className={`
                        aspect-square rounded-xl flex items-center justify-center
                        font-medium text-sm transition-all duration-300
                        ${isSelected
                          ? "bg-[#D0B078] text-[#131835] shadow-[0_0_15px_rgba(208,176,120,0.4)]"
                          : isAvailable
                            ? "bg-white/5 text-white hover:bg-white/10 border border-[#2C355E] hover:border-[#D0B078]/50"
                            : "bg-transparent text-[#5E698F] opacity-50 cursor-not-allowed"
                        }
                        ${isToday && !isSelected ? "border-[#D0B078]/50" : ""}
                      `}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Time Windows */}
            {tempSelectedDate && (
              <Card className="p-8 animate-fade-in-up !bg-[#1A2142] !border-[#2C355E]">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#D0B078]/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#D0B078]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  {locale === "es"
                    ? "Selecciona Horario"
                    : "Select Time"}
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  {timeWindows.map((window) => {
                    const isSelected = tempSelectedWindow?.slot === window.slot;
                    const isAvailable = isTimeWindowAvailable(window);
                    const label = locale === "es" ? window.labelEs : window.label;

                    return (
                      <button
                        key={window.slot}
                        onClick={() => handleWindowSelect(window)}
                        disabled={!isAvailable}
                        className={`
                          p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group
                          ${!isAvailable
                            ? "border-[#2C355E] bg-transparent opacity-40 cursor-not-allowed"
                            : isSelected
                              ? "border-[#D0B078] bg-[#D0B078]/10 ring-1 ring-[#D0B078]"
                              : "border-[#2C355E] bg-white/5 hover:bg-white/10 hover:border-[#D0B078]/30"
                          }
                        `}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <div className="w-5 h-5 bg-[#D0B078] rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-[#131835]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}

                        <div className="text-center mt-2 mb-1">
                          <p className={`font-bold text-lg mb-1 transition-colors ${isSelected ? 'text-[#D0B078]' : 'text-white'}`}>{label}</p>
                          <p className={`text-xs flex justify-center items-center gap-1 opacity-80 ${!isAvailable ? 'text-[#5E698F]' : isSelected ? 'text-[#D0B078]' : 'text-[#5E698F] group-hover:text-green-400'}`}>
                            {!isAvailable
                              ? (locale === "es" ? "Pasado" : "Passed")
                              : (locale === "es" ? "Disponible" : "Available")}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Selection Summary */}
            {(tempSelectedDate && tempSelectedWindow) && (
              <Card className="p-6 !bg-[#D0B078]/5 !border-[#D0B078]/30 animate-fade-in-up">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#D0B078]/20 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#D0B078]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-1">
                      {locale === "es" ? "Tu Cita" : "Your Appointment"}
                    </p>
                    <p className="text-white font-medium text-lg">
                      {tempSelectedDate.toLocaleDateString(locale, {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-[#D0B078]">
                      {locale === "es" ? tempSelectedWindow.labelEs : tempSelectedWindow.label}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right column: Summary (sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              <PricingSummary
                service={selectedService}
                addOns={selectedAddOns}
                subtotal={subtotal}
                serviceFee={serviceFee}
                total={total}
                locale={locale}
              />

              {/* Action buttons */}
              <div className="mt-6 space-y-3">
                <Button
                  fullWidth
                  variant="primary"
                  onClick={handleContinue}
                  disabled={!tempSelectedDate || !tempSelectedWindow}
                  className={(!tempSelectedDate || !tempSelectedWindow) ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  {locale === "es" ? "Continuar a Revisar" : "Continue to Review"}
                  <svg
                    className="inline-block ml-2 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Button>

                <Button
                  fullWidth
                  variant="secondary"
                  onClick={handleBack}
                >
                  <svg
                    className="inline-block mr-2 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  {locale === "es" ? "Volver a Ubicación" : "Back to Location"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
