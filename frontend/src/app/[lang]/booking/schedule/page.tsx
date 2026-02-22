"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/contexts";
import { PricingSummary } from "@/components/booking";

interface SchedulePageProps {
  params: Promise<{
    lang: "en" | "es";
  }>;
}

const TIME_WINDOWS = [
  {
    slot: "morning" as const,
    label: "Morning",
    labelEs: "Mañana",
    range: "9:00 AM - 12:00 PM",
    rangeEs: "9:00 AM - 12:00 PM",
  },
  {
    slot: "afternoon" as const,
    label: "Afternoon",
    labelEs: "Tarde",
    range: "1:00 PM - 4:00 PM",
    rangeEs: "1:00 PM - 4:00 PM",
  },
  {
    slot: "evening" as const,
    label: "Evening",
    labelEs: "Noche",
    range: "4:00 PM - 7:00 PM",
    rangeEs: "4:00 PM - 7:00 PM",
  },
];

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
  const [tempSelectedWindow, setTempSelectedWindow] = useState<typeof TIME_WINDOWS[0] | null>(
    selectedTimeWindow
  );
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  // Redirect if prerequisites not met
  useEffect(() => {
    if (!selectedService) {
      router.push(`/${locale}/booking/select`);
    }
    if (!customerLocation) {
      router.push(`/${locale}/booking/location`);
    }
  }, [selectedService, customerLocation, router, locale]);

  // Fetch availability when month changes
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!customerLocation?.zipCode || !selectedService) return;

      setIsLoadingAvailability(true);
      try {
        const month = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;

        const response = await fetch(
          `/api/booking/availability`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              zipCode: customerLocation.zipCode,
              serviceId: selectedService.documentId,
              month,
            }),
          }
        );

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

    // Can't book same day or past dates
    if (date < today) return false;

    // Check real contractor availability from API
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return availableDates.has(dateStr);
  };

  const handleDateSelect = (date: Date) => {
    if (!isDateAvailable(date)) return;
    setTempSelectedDate(date);
    setTempSelectedWindow(null); // Reset time window when date changes
  };

  const handleWindowSelect = (window: typeof TIME_WINDOWS[0]) => {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    font-semibold text-sm
                    ${currentStep >= step
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                    }
                  `}
                >
                  {step}
                </div>
                {step < 6 && (
                  <div
                    className={`
                      w-12 h-1 mx-2
                      ${currentStep > step ? "bg-blue-600" : "bg-gray-200"}
                    `}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between max-w-3xl mx-auto mt-2 text-xs text-gray-600">
            <span>{locale === "es" ? "Servicio" : "Service"}</span>
            <span>{locale === "es" ? "Ubicación" : "Location"}</span>
            <span className="font-semibold text-blue-600">
              {locale === "es" ? "Horario" : "Schedule"}
            </span>
            <span>{locale === "es" ? "Revisar" : "Review"}</span>
            <span>{locale === "es" ? "Vehículo" : "Vehicle"}</span>
            <span>{locale === "es" ? "Pago" : "Payment"}</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {locale === "es"
              ? "Elige Fecha y Horario"
              : "Choose Date & Time"}
          </h1>
          <p className="text-lg text-gray-600">
            {locale === "es"
              ? "Selecciona cuándo te gustaría el servicio"
              : "Select when you'd like service"}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column: Calendar & Time Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Calendar */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              {isLoadingAvailability && (
                <div className="absolute top-4 right-4 flex items-center gap-2 text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  {locale === "es" ? "Cargando..." : "Loading..."}
                </div>
              )}

              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                    )
                  }
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <h2 className="text-xl font-bold">{monthName}</h2>

                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
                    )
                  }
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Week day headers */}
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
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
                        aspect-square rounded-lg flex items-center justify-center
                        font-medium text-sm transition-all
                        ${isSelected
                          ? "bg-blue-600 text-white shadow-md"
                          : isAvailable
                            ? "bg-white text-gray-900 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }
                        ${isToday && !isSelected ? "border-blue-400" : ""}
                      `}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Windows */}
            {tempSelectedDate && (
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {locale === "es"
                    ? "Selecciona Horario"
                    : "Select Time Window"}
                </h3>

                <div className="grid md:grid-cols-3 gap-4">
                  {TIME_WINDOWS.map((window) => {
                    const isSelected = tempSelectedWindow?.slot === window.slot;
                    const label = locale === "es" ? window.labelEs : window.label;
                    const range = locale === "es" ? window.rangeEs : window.range;

                    return (
                      <button
                        key={window.slot}
                        onClick={() => handleWindowSelect(window)}
                        className={`
                          p-6 rounded-xl border-2 transition-all
                          ${isSelected
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300 bg-white"
                          }
                        `}
                      >
                        {isSelected && (
                          <div className="flex justify-end mb-2">
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}

                        <div className="text-center">
                          <p className="font-bold text-lg text-gray-900 mb-1">{label}</p>
                          <p className="text-sm text-gray-600">{range}</p>
                          <p className="text-xs text-green-600 mt-2">
                            {locale === "es" ? "✓ Disponible" : "✓ Available"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selection Summary */}
            {tempSelectedDate && tempSelectedWindow && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-green-900 mb-1">
                      {locale === "es" ? "Tu Cita" : "Your Appointment"}
                    </p>
                    <p className="text-green-800">
                      {tempSelectedDate.toLocaleDateString(locale, {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-green-700 text-sm">
                      {locale === "es" ? tempSelectedWindow.labelEs : tempSelectedWindow.label} •{" "}
                      {locale === "es" ? tempSelectedWindow.rangeEs : tempSelectedWindow.range}
                    </p>
                  </div>
                </div>
              </div>
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
              <div className="space-y-3">
                <button
                  onClick={handleContinue}
                  disabled={!tempSelectedDate || !tempSelectedWindow}
                  className="
                    w-full bg-blue-600 text-white font-semibold py-4 rounded-xl
                    hover:bg-blue-700 transition-colors duration-200
                    disabled:bg-gray-300 disabled:cursor-not-allowed
                    shadow-lg hover:shadow-xl
                  "
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
                </button>

                <button
                  onClick={handleBack}
                  className="
                    w-full bg-white text-gray-700 font-semibold py-4 rounded-xl
                    border-2 border-gray-300 hover:border-gray-400
                    transition-colors duration-200
                  "
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
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
