'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { strapiClient } from '@/lib/api';
import styles from './DateSelector.module.css';

interface DateSelectorProps {
    zipCode: string;
    serviceId: string;
    addOnIds: string[];
    totalPrice: number;
    totalDuration: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dict: Record<string, any>;
    lang: string;
}

interface TimeSlot {
    window: 'morning' | 'afternoon' | 'evening';
    label: string;
    contractorsAvailable: number;
}

interface AvailableDate {
    date: string;
    slots: TimeSlot[];
}

export default function DateSelector({
    zipCode,
    serviceId,
    addOnIds,
    totalPrice,
    totalDuration,
    dict,
    lang
}: DateSelectorProps) {
    const router = useRouter();
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
    const [nextAvailable, setNextAvailable] = useState<{ date: string; window: string; label: string } | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedWindow, setSelectedWindow] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [holdingSlot, setHoldingSlot] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch availability when month changes
    useEffect(() => {
        const fetchAvailability = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await strapiClient.getAvailability(zipCode, serviceId, currentMonth);
                setAvailableDates(result.availableDates || []);
                setNextAvailable(result.nextAvailable);
            } catch (err) {
                console.error('Error fetching availability:', err);
                setError(dict.dateSelector?.errorLoading || 'Failed to load availability');
            } finally {
                setLoading(false);
            }
        };

        fetchAvailability();
    }, [currentMonth, zipCode, serviceId, dict]);

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const [year, month] = currentMonth.split('-').map(Number);
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        const days: Array<{ date: string; dayNum: number; isAvailable: boolean; isPast: boolean }> = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Add empty cells for days before the 1st
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push({ date: '', dayNum: 0, isAvailable: false, isPast: true });
        }

        // Add actual days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, month - 1, day);
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isAvailable = availableDates.some(d => d.date === dateStr);
            const isPast = dateObj < today;

            days.push({ date: dateStr, dayNum: day, isAvailable, isPast });
        }

        return days;
    }, [currentMonth, availableDates]);

    // Get slots for selected date
    const selectedDateSlots = useMemo(() => {
        if (!selectedDate) return [];
        const dateData = availableDates.find(d => d.date === selectedDate);
        return dateData?.slots || [];
    }, [selectedDate, availableDates]);

    // Navigation handlers
    const goToPreviousMonth = () => {
        const [year, month] = currentMonth.split('-').map(Number);
        const now = new Date();
        const currentMonthDate = new Date(year, month - 1, 1);
        const thisMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);

        if (currentMonthDate > thisMonthDate) {
            const newMonth = month === 1 ? 12 : month - 1;
            const newYear = month === 1 ? year - 1 : year;
            setCurrentMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
        }
    };

    const goToNextMonth = () => {
        const [year, month] = currentMonth.split('-').map(Number);
        const newMonth = month === 12 ? 1 : month + 1;
        const newYear = month === 12 ? year + 1 : year;
        setCurrentMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
    };

    // Select next available slot
    const selectNextAvailable = () => {
        if (nextAvailable) {
            // Check if next available is in current month
            const nextMonth = nextAvailable.date.substring(0, 7);
            if (nextMonth !== currentMonth) {
                setCurrentMonth(nextMonth);
            }
            setSelectedDate(nextAvailable.date);
            setSelectedWindow(nextAvailable.window);
        }
    };

    // Handle slot hold and continue
    const handleContinue = async () => {
        if (!selectedDate || !selectedWindow) return;

        setHoldingSlot(true);
        try {
            const result = await strapiClient.holdSlot(zipCode, selectedDate, selectedWindow, totalDuration);

            if (result.success && result.holdToken) {
                // Navigate to payment page with hold token
                const holdToken = result.holdToken;
                const params = new URLSearchParams({
                    zip: zipCode,
                    service: serviceId,
                    addons: addOnIds.join(','),
                    date: selectedDate,
                    window: selectedWindow,
                    hold: holdToken,
                });
                router.push(`/${lang}/booking/payment?${params.toString()}`);
            } else {
                setError(result.message || dict.dateSelector?.slotUnavailable || 'Slot no longer available');
            }
        } catch (err) {
            console.error('Error holding slot:', err);
            setError(dict.dateSelector?.errorHolding || 'Failed to reserve slot');
        } finally {
            setHoldingSlot(false);
        }
    };

    // Format month/year for display
    const monthYearDisplay = useMemo(() => {
        const [year, month] = currentMonth.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        return date.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
            month: 'long',
            year: 'numeric'
        });
    }, [currentMonth, lang]);

    const weekDays = lang === 'es'
        ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h2>{dict.dateSelector?.title || 'Select Date & Time'}</h2>
                <p className={styles.subtitle}>
                    {dict.dateSelector?.subtitle || 'Choose your preferred appointment slot'}
                </p>
            </div>

            {/* Next Available Button */}
            {nextAvailable && (
                <button
                    className={styles.nextAvailableBtn}
                    onClick={selectNextAvailable}
                >
                    <span className={styles.nextAvailableIcon}>⚡</span>
                    {dict.dateSelector?.nextAvailable || 'Next Available'}: {' '}
                    <strong>
                        {new Date(nextAvailable.date).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                        })} - {nextAvailable.label}
                    </strong>
                </button>
            )}

            {/* Calendar */}
            <div className={styles.calendar}>
                {/* Month Navigation */}
                <div className={styles.monthNav}>
                    <button
                        onClick={goToPreviousMonth}
                        className={styles.navBtn}
                        aria-label="Previous month"
                    >
                        ←
                    </button>
                    <span className={styles.monthYear}>{monthYearDisplay}</span>
                    <button
                        onClick={goToNextMonth}
                        className={styles.navBtn}
                        aria-label="Next month"
                    >
                        →
                    </button>
                </div>

                {/* Week Days Header */}
                <div className={styles.weekDays}>
                    {weekDays.map(day => (
                        <div key={day} className={styles.weekDay}>{day}</div>
                    ))}
                </div>

                {/* Calendar Grid */}
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        {dict.dateSelector?.loading || 'Loading availability...'}
                    </div>
                ) : (
                    <div className={styles.daysGrid}>
                        {calendarDays.map((day, index) => (
                            <button
                                key={index}
                                className={`${styles.dayCell} ${day.dayNum === 0 ? styles.empty : ''
                                    } ${day.isPast ? styles.past : ''} ${day.isAvailable ? styles.available : styles.unavailable
                                    } ${selectedDate === day.date ? styles.selected : ''}`}
                                onClick={() => day.isAvailable && !day.isPast && setSelectedDate(day.date)}
                                disabled={!day.isAvailable || day.isPast || day.dayNum === 0}
                            >
                                {day.dayNum > 0 && (
                                    <>
                                        <span className={styles.dayNum}>{day.dayNum}</span>
                                        {day.isAvailable && !day.isPast && (
                                            <span className={styles.availableDot}></span>
                                        )}
                                    </>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Time Slots */}
            {selectedDate && selectedDateSlots.length > 0 && (
                <div className={styles.timeSlots}>
                    <h3>
                        {dict.dateSelector?.selectTime || 'Select Time Window'}: {' '}
                        {new Date(selectedDate).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </h3>
                    <div className={styles.slotsGrid}>
                        {selectedDateSlots.map(slot => (
                            <button
                                key={slot.window}
                                className={`${styles.slotCard} ${selectedWindow === slot.window ? styles.selectedSlot : ''
                                    }`}
                                onClick={() => setSelectedWindow(slot.window)}
                            >
                                <span className={styles.slotIcon}>
                                    {slot.window === 'morning' ? '🌅' : slot.window === 'afternoon' ? '☀️' : '🌆'}
                                </span>
                                <span className={styles.slotLabel}>
                                    {dict.dateSelector?.[slot.window] || slot.window}
                                </span>
                                <span className={styles.slotTime}>{slot.label}</span>
                                <span className={styles.slotAvailability}>
                                    {slot.contractorsAvailable} {dict.dateSelector?.available || 'available'}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}

            {/* Sticky Footer */}
            <div className={styles.footer}>
                <div className={styles.footerContent}>
                    <div className={styles.selectedSummary}>
                        {selectedDate && selectedWindow ? (
                            <>
                                <span className={styles.checkIcon}>✓</span>
                                {new Date(selectedDate).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                })} - {dict.dateSelector?.[selectedWindow] || selectedWindow}
                            </>
                        ) : (
                            <span className={styles.selectPrompt}>
                                {dict.dateSelector?.selectDateAndTime || 'Select a date and time'}
                            </span>
                        )}
                    </div>
                    <div className={styles.priceTotal}>
                        <span>{dict.priceSummary?.total || 'Total'}:</span>
                        <span className={styles.price}>${totalPrice.toFixed(2)}</span>
                    </div>
                    <button
                        className={styles.continueBtn}
                        onClick={handleContinue}
                        disabled={!selectedDate || !selectedWindow || holdingSlot}
                    >
                        {holdingSlot
                            ? (dict.dateSelector?.reserving || 'Reserving...')
                            : (dict.dateSelector?.continueToPayment || 'Continue to Payment')}
                    </button>
                </div>
            </div>
        </div>
    );
}
