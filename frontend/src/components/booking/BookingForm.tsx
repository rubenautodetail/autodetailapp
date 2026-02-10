'use client';

/**
 * Booking Form Component
 * Multi-step form for booking a detailing service
 */

import { useState, useEffect } from 'react';
import { Service, AddOn, BookingFormData } from '@/types/booking';
import { createBooking } from '@/lib/api/bookings';
import { calculatePrice, createPaymentIntent } from '@/lib/stripe/api';
import PaymentForm from '@/components/payment/PaymentForm';
import { useRouter } from 'next/navigation';
import styles from './BookingForm.module.css';

interface BookingFormProps {
    service: Service;
    addOns: AddOn[];
    zipCode?: string;
    lang: string;
}

type Step = 'addons' | 'datetime' | 'details' | 'review' | 'payment';

export default function BookingForm({ service, addOns, zipCode, lang }: BookingFormProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<Step>('addons');
    const [selectedAddOns, setSelectedAddOns] = useState<number[]>([]);
    const [formData, setFormData] = useState<Partial<BookingFormData>>({
        serviceId: service.id,
        addOnIds: [],
        zipCode: zipCode || '',
        state: 'FL',
    });
    const [pricing, setPricing] = useState<any>(null);
    const [bookingId, setBookingId] = useState<number | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calculate price when add-ons change
    useEffect(() => {
        const fetchPrice = async () => {
            try {
                const price = await calculatePrice(service.id, selectedAddOns, zipCode);
                setPricing(price);
            } catch (err) {
                console.error('Error calculating price:', err);
            }
        };
        fetchPrice();
    }, [service.id, selectedAddOns, zipCode]);

    const handleAddOnToggle = (addOnId: number) => {
        setSelectedAddOns(prev =>
            prev.includes(addOnId)
                ? prev.filter(id => id !== addOnId)
                : [...prev, addOnId]
        );
    };

    const handleNext = () => {
        const steps: Step[] = ['addons', 'datetime', 'details', 'review', 'payment'];
        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex < steps.length - 1) {
            setCurrentStep(steps[currentIndex + 1]);
        }
    };

    const handleBack = () => {
        const steps: Step[] = ['addons', 'datetime', 'details', 'review', 'payment'];
        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex > 0) {
            setCurrentStep(steps[currentIndex - 1]);
        }
    };

    const handleSubmitBooking = async () => {
        setLoading(true);
        setError(null);

        try {
            // Create booking
            const booking = await createBooking({
                ...formData as BookingFormData,
                addOnIds: selectedAddOns,
            });

            setBookingId(booking.id!);

            // Create payment intent
            const payment = await createPaymentIntent(booking.id!);
            setClientSecret(payment.clientSecret);

            // Move to payment step
            setCurrentStep('payment');
        } catch (err: any) {
            setError(err.message || 'Failed to create booking');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = (confirmationCode: string) => {
        router.push(`/${lang}/confirmation/${confirmationCode}`);
    };

    const handlePaymentError = (error: string) => {
        setError(error);
    };

    return (
        <div className={styles.container}>
            {/* Progress Steps */}
            <div className={styles.progress}>
                <div className={`${styles.step} ${currentStep === 'addons' ? styles.active : ''} ${['datetime', 'details', 'review', 'payment'].includes(currentStep) ? styles.completed : ''}`}>
                    <div className={styles.stepNumber}>1</div>
                    <div className={styles.stepLabel}>Add-ons</div>
                </div>
                <div className={styles.progressLine}></div>
                <div className={`${styles.step} ${currentStep === 'datetime' ? styles.active : ''} ${['details', 'review', 'payment'].includes(currentStep) ? styles.completed : ''}`}>
                    <div className={styles.stepNumber}>2</div>
                    <div className={styles.stepLabel}>Date & Time</div>
                </div>
                <div className={styles.progressLine}></div>
                <div className={`${styles.step} ${currentStep === 'details' ? styles.active : ''} ${['review', 'payment'].includes(currentStep) ? styles.completed : ''}`}>
                    <div className={styles.stepNumber}>3</div>
                    <div className={styles.stepLabel}>Your Details</div>
                </div>
                <div className={styles.progressLine}></div>
                <div className={`${styles.step} ${currentStep === 'review' ? styles.active : ''} ${currentStep === 'payment' ? styles.completed : ''}`}>
                    <div className={styles.stepNumber}>4</div>
                    <div className={styles.stepLabel}>Review</div>
                </div>
                <div className={styles.progressLine}></div>
                <div className={`${styles.step} ${currentStep === 'payment' ? styles.active : ''}`}>
                    <div className={styles.stepNumber}>5</div>
                    <div className={styles.stepLabel}>Payment</div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className={styles.error}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Step Content */}
            <div className={styles.content}>
                {currentStep === 'addons' && (
                    <AddOnsStep
                        service={service}
                        addOns={addOns}
                        selectedAddOns={selectedAddOns}
                        onToggle={handleAddOnToggle}
                        pricing={pricing}
                        onNext={handleNext}
                    />
                )}

                {currentStep === 'datetime' && (
                    <DateTimeStep
                        formData={formData}
                        setFormData={setFormData}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                )}

                {currentStep === 'details' && (
                    <DetailsStep
                        formData={formData}
                        setFormData={setFormData}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                )}

                {currentStep === 'review' && (
                    <ReviewStep
                        service={service}
                        addOns={addOns.filter(a => selectedAddOns.includes(a.id))}
                        formData={formData}
                        pricing={pricing}
                        onSubmit={handleSubmitBooking}
                        onBack={handleBack}
                        loading={loading}
                    />
                )}

                {currentStep === 'payment' && clientSecret && bookingId && pricing && (
                    <div className={styles.paymentStep}>
                        <h2>Complete Your Payment</h2>
                        <PaymentForm
                            clientSecret={clientSecret}
                            bookingId={bookingId}
                            amount={pricing.total}
                            onSuccess={handlePaymentSuccess}
                            onError={handlePaymentError}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// Add-ons Step Component
function AddOnsStep({ service, addOns, selectedAddOns, onToggle, pricing, onNext }: any) {
    return (
        <div className={styles.stepContent}>
            <h2>Select Add-On Services (Optional)</h2>
            <p className={styles.stepDescription}>
                Enhance your {service.name} with these additional services
            </p>

            <div className={styles.addOnsList}>
                {addOns.length === 0 ? (
                    <p className={styles.noAddOns}>No add-ons available for this service.</p>
                ) : (
                    addOns.map((addOn: AddOn) => (
                        <label key={addOn.id} className={styles.addOnCard}>
                            <input
                                type="checkbox"
                                checked={selectedAddOns.includes(addOn.id)}
                                onChange={() => onToggle(addOn.id)}
                                className={styles.checkbox}
                            />
                            <div className={styles.addOnContent}>
                                <div className={styles.addOnHeader}>
                                    <h3>{addOn.name}</h3>
                                    <span className={styles.addOnPrice}>+${addOn.price.toFixed(2)}</span>
                                </div>
                                {addOn.description && (
                                    <p className={styles.addOnDescription}>{addOn.description}</p>
                                )}
                                {addOn.durationMinutes && (
                                    <span className={styles.addOnDuration}>
                                        ⏱️ +{addOn.durationMinutes} minutes
                                    </span>
                                )}
                            </div>
                        </label>
                    ))
                )}
            </div>

            {pricing && (
                <div className={styles.priceSummary}>
                    <div className={styles.priceRow}>
                        <span>Subtotal:</span>
                        <span>${pricing.subtotal.toFixed(2)}</span>
                    </div>
                    <div className={styles.priceRow}>
                        <span>Service Fee:</span>
                        <span>${pricing.serviceFee.toFixed(2)}</span>
                    </div>
                    <div className={`${styles.priceRow} ${styles.total}`}>
                        <span>Total:</span>
                        <span>${pricing.total.toFixed(2)}</span>
                    </div>
                </div>
            )}

            <button onClick={onNext} className={styles.nextButton}>
                Continue to Date & Time →
            </button>
        </div>
    );
}

// Date & Time Step Component
function DateTimeStep({ formData, setFormData, onNext, onBack }: any) {
    const [date, setDate] = useState(formData.date || '');
    const [timeWindow, setTimeWindow] = useState(formData.timeWindow || '');

    const handleContinue = () => {
        if (!date || !timeWindow) {
            alert('Please select both date and time window');
            return;
        }
        setFormData({ ...formData, date, timeWindow });
        onNext();
    };

    // Get minimum date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    return (
        <div className={styles.stepContent}>
            <h2>Select Date & Time</h2>
            <p className={styles.stepDescription}>
                Choose when you'd like your service
            </p>

            <div className={styles.formGroup}>
                <label>Service Date</label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={minDate}
                    className={styles.input}
                    required
                />
            </div>

            <div className={styles.formGroup}>
                <label>Time Window</label>
                <div className={styles.timeWindows}>
                    <label className={`${styles.timeWindow} ${timeWindow === 'morning' ? styles.selected : ''}`}>
                        <input
                            type="radio"
                            name="timeWindow"
                            value="morning"
                            checked={timeWindow === 'morning'}
                            onChange={(e) => setTimeWindow(e.target.value)}
                        />
                        <div className={styles.timeWindowContent}>
                            <span className={styles.timeWindowIcon}>🌅</span>
                            <strong>Morning</strong>
                            <span>8:00 AM - 12:00 PM</span>
                        </div>
                    </label>

                    <label className={`${styles.timeWindow} ${timeWindow === 'afternoon' ? styles.selected : ''}`}>
                        <input
                            type="radio"
                            name="timeWindow"
                            value="afternoon"
                            checked={timeWindow === 'afternoon'}
                            onChange={(e) => setTimeWindow(e.target.value)}
                        />
                        <div className={styles.timeWindowContent}>
                            <span className={styles.timeWindowIcon}>☀️</span>
                            <strong>Afternoon</strong>
                            <span>12:00 PM - 4:00 PM</span>
                        </div>
                    </label>

                    <label className={`${styles.timeWindow} ${timeWindow === 'evening' ? styles.selected : ''}`}>
                        <input
                            type="radio"
                            name="timeWindow"
                            value="evening"
                            checked={timeWindow === 'evening'}
                            onChange={(e) => setTimeWindow(e.target.value)}
                        />
                        <div className={styles.timeWindowContent}>
                            <span className={styles.timeWindowIcon}>🌆</span>
                            <strong>Evening</strong>
                            <span>4:00 PM - 8:00 PM</span>
                        </div>
                    </label>
                </div>
            </div>

            <div className={styles.buttonGroup}>
                <button onClick={onBack} className={styles.backButton}>
                    ← Back
                </button>
                <button onClick={handleContinue} className={styles.nextButton}>
                    Continue to Details →
                </button>
            </div>
        </div>
    );
}

// Details Step Component
function DetailsStep({ formData, setFormData, onNext, onBack }: any) {
    const [data, setData] = useState({
        customerName: formData.customerName || '',
        customerEmail: formData.customerEmail || '',
        customerPhone: formData.customerPhone || '',
        address: formData.address || '',
        city: formData.city || '',
        state: formData.state || 'FL',
        zipCode: formData.zipCode || '',
        vehicleType: formData.vehicleType || '',
        vehicleColor: formData.vehicleColor || '',
        specialInstructions: formData.specialInstructions || '',
    });

    const handleContinue = () => {
        if (!data.customerName || !data.customerEmail || !data.customerPhone || !data.address || !data.city || !data.zipCode) {
            alert('Please fill in all required fields');
            return;
        }
        setFormData({ ...formData, ...data });
        onNext();
    };

    return (
        <div className={styles.stepContent}>
            <h2>Your Information</h2>
            <p className={styles.stepDescription}>
                Tell us where to provide the service
            </p>

            <div className={styles.formSection}>
                <h3>Contact Information</h3>
                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label>Full Name *</label>
                        <input
                            type="text"
                            value={data.customerName}
                            onChange={(e) => setData({ ...data, customerName: e.target.value })}
                            className={styles.input}
                            placeholder="John Doe"
                            required
                        />
                    </div>
                </div>

                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label>Email *</label>
                        <input
                            type="email"
                            value={data.customerEmail}
                            onChange={(e) => setData({ ...data, customerEmail: e.target.value })}
                            className={styles.input}
                            placeholder="john@example.com"
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Phone *</label>
                        <input
                            type="tel"
                            value={data.customerPhone}
                            onChange={(e) => setData({ ...data, customerPhone: e.target.value })}
                            className={styles.input}
                            placeholder="(555) 123-4567"
                            required
                        />
                    </div>
                </div>
            </div>

            <div className={styles.formSection}>
                <h3>Service Address</h3>
                <div className={styles.formGroup}>
                    <label>Street Address *</label>
                    <input
                        type="text"
                        value={data.address}
                        onChange={(e) => setData({ ...data, address: e.target.value })}
                        className={styles.input}
                        placeholder="123 Main St"
                        required
                    />
                </div>

                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label>City *</label>
                        <input
                            type="text"
                            value={data.city}
                            onChange={(e) => setData({ ...data, city: e.target.value })}
                            className={styles.input}
                            placeholder="Miami"
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>State *</label>
                        <select
                            value={data.state}
                            onChange={(e) => setData({ ...data, state: e.target.value })}
                            className={styles.input}
                            required
                        >
                            <option value="FL">Florida</option>
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label>ZIP Code *</label>
                        <input
                            type="text"
                            value={data.zipCode}
                            onChange={(e) => setData({ ...data, zipCode: e.target.value })}
                            className={styles.input}
                            placeholder="33186"
                            required
                        />
                    </div>
                </div>
            </div>

            <div className={styles.formSection}>
                <h3>Vehicle Details (Optional)</h3>
                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label>Vehicle Type</label>
                        <input
                            type="text"
                            value={data.vehicleType}
                            onChange={(e) => setData({ ...data, vehicleType: e.target.value })}
                            className={styles.input}
                            placeholder="e.g., Sedan, SUV, Truck"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Vehicle Color</label>
                        <input
                            type="text"
                            value={data.vehicleColor}
                            onChange={(e) => setData({ ...data, vehicleColor: e.target.value })}
                            className={styles.input}
                            placeholder="e.g., Black, White, Silver"
                        />
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label>Special Instructions</label>
                    <textarea
                        value={data.specialInstructions}
                        onChange={(e) => setData({ ...data, specialInstructions: e.target.value })}
                        className={styles.textarea}
                        placeholder="Any special requests or instructions for the detailer..."
                        rows={4}
                    />
                </div>
            </div>

            <div className={styles.buttonGroup}>
                <button onClick={onBack} className={styles.backButton}>
                    ← Back
                </button>
                <button onClick={handleContinue} className={styles.nextButton}>
                    Continue to Review →
                </button>
            </div>
        </div>
    );
}

// Review Step Component
function ReviewStep({ service, addOns, formData, pricing, onSubmit, onBack, loading }: any) {
    return (
        <div className={styles.stepContent}>
            <h2>Review Your Booking</h2>
            <p className={styles.stepDescription}>
                Please review your booking details before proceeding to payment
            </p>

            <div className={styles.reviewSection}>
                <h3>Service</h3>
                <div className={styles.reviewItem}>
                    <strong>{service.name}</strong>
                    <span>${service.basePrice.toFixed(2)}</span>
                </div>
            </div>

            {addOns.length > 0 && (
                <div className={styles.reviewSection}>
                    <h3>Add-Ons</h3>
                    {addOns.map((addOn: AddOn) => (
                        <div key={addOn.id} className={styles.reviewItem}>
                            <span>{addOn.name}</span>
                            <span>+${addOn.price.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className={styles.reviewSection}>
                <h3>Date & Time</h3>
                <div className={styles.reviewItem}>
                    <span>Date:</span>
                    <strong>{new Date(formData.date).toLocaleDateString()}</strong>
                </div>
                <div className={styles.reviewItem}>
                    <span>Time Window:</span>
                    <strong>{formData.timeWindow.charAt(0).toUpperCase() + formData.timeWindow.slice(1)}</strong>
                </div>
            </div>

            <div className={styles.reviewSection}>
                <h3>Contact Information</h3>
                <div className={styles.reviewItem}>
                    <span>Name:</span>
                    <span>{formData.customerName}</span>
                </div>
                <div className={styles.reviewItem}>
                    <span>Email:</span>
                    <span>{formData.customerEmail}</span>
                </div>
                <div className={styles.reviewItem}>
                    <span>Phone:</span>
                    <span>{formData.customerPhone}</span>
                </div>
            </div>

            <div className={styles.reviewSection}>
                <h3>Service Address</h3>
                <div className={styles.reviewItem}>
                    <span>{formData.address}</span>
                </div>
                <div className={styles.reviewItem}>
                    <span>{formData.city}, {formData.state} {formData.zipCode}</span>
                </div>
            </div>

            {pricing && (
                <div className={styles.reviewSection}>
                    <h3>Price Summary</h3>
                    <div className={styles.reviewItem}>
                        <span>Subtotal:</span>
                        <span>${pricing.subtotal.toFixed(2)}</span>
                    </div>
                    <div className={styles.reviewItem}>
                        <span>Service Fee:</span>
                        <span>${pricing.serviceFee.toFixed(2)}</span>
                    </div>
                    <div className={`${styles.reviewItem} ${styles.total}`}>
                        <strong>Total:</strong>
                        <strong>${pricing.total.toFixed(2)}</strong>
                    </div>
                </div>
            )}

            <div className={styles.buttonGroup}>
                <button onClick={onBack} className={styles.backButton} disabled={loading}>
                    ← Back
                </button>
                <button onClick={onSubmit} className={styles.submitButton} disabled={loading}>
                    {loading ? 'Processing...' : 'Proceed to Payment →'}
                </button>
            </div>
        </div>
    );
}
