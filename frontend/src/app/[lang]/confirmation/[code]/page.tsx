import { getBooking } from '@/lib/api/bookings';
import styles from './confirmation.module.css';

export default async function ConfirmationPage({
    params,
}: {
    params: { lang: string; code: string };
}) {
    // In a real app, you'd verify the confirmation code
    // For now, we'll use it as the booking ID
    const bookingId = parseInt(params.code);
    const booking = await getBooking(bookingId);

    if (!booking) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <h1>Booking Not Found</h1>
                    <p>We couldn't find a booking with that confirmation code.</p>
                    <a href={`/${params.lang}`} className={styles.homeButton}>
                        Return to Homepage
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.success}>
                <div className={styles.checkmark}>
                    <svg viewBox="0 0 52 52" className={styles.checkmarkSvg}>
                        <circle cx="26" cy="26" r="25" fill="none" className={styles.checkmarkCircle} />
                        <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" className={styles.checkmarkCheck} />
                    </svg>
                </div>

                <h1 className={styles.title}>Booking Confirmed!</h1>
                <p className={styles.subtitle}>
                    Your payment has been processed successfully
                </p>

                <div className={styles.confirmationCode}>
                    <span className={styles.codeLabel}>Confirmation Code:</span>
                    <span className={styles.code}>#{params.code}</span>
                </div>

                <div className={styles.details}>
                    <h2>Booking Details</h2>

                    <div className={styles.detailSection}>
                        <h3>Service</h3>
                        <p>{typeof booking.service === 'object' ? booking.service.name : 'Service'}</p>
                    </div>

                    <div className={styles.detailSection}>
                        <h3>Date & Time</h3>
                        <p>{new Date(booking.date).toLocaleDateString()}</p>
                        <p className={styles.timeWindow}>
                            {booking.timeWindow.charAt(0).toUpperCase() + booking.timeWindow.slice(1)} Window
                        </p>
                    </div>

                    <div className={styles.detailSection}>
                        <h3>Service Address</h3>
                        <p>{booking.address}</p>
                        <p>{booking.city}, {booking.state} {booking.zipCode}</p>
                    </div>

                    {booking.totalAmount && (
                        <div className={styles.detailSection}>
                            <h3>Total Paid</h3>
                            <p className={styles.amount}>${booking.totalAmount.toFixed(2)}</p>
                        </div>
                    )}
                </div>

                <div className={styles.nextSteps}>
                    <h2>What's Next?</h2>
                    <ul>
                        <li>
                            <span className={styles.stepIcon}>📧</span>
                            <div>
                                <strong>Confirmation Email</strong>
                                <p>We've sent a confirmation email to {booking.customerEmail}</p>
                            </div>
                        </li>
                        <li>
                            <span className={styles.stepIcon}>👨‍🔧</span>
                            <div>
                                <strong>Contractor Assignment</strong>
                                <p>We'll assign a professional detailer to your booking shortly</p>
                            </div>
                        </li>
                        <li>
                            <span className={styles.stepIcon}>📱</span>
                            <div>
                                <strong>Service Reminder</strong>
                                <p>You'll receive a reminder 24 hours before your appointment</p>
                            </div>
                        </li>
                        <li>
                            <span className={styles.stepIcon}>✨</span>
                            <div>
                                <strong>Service Day</strong>
                                <p>Our detailer will arrive during your selected time window</p>
                            </div>
                        </li>
                    </ul>
                </div>

                <div className={styles.actions}>
                    <a href={`/${params.lang}`} className={styles.homeButton}>
                        Return to Homepage
                    </a>
                    <button onClick={() => window.print()} className={styles.printButton}>
                        Print Confirmation
                    </button>
                </div>
            </div>
        </div>
    );
}
