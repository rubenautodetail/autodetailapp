'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Image from 'next/image';

interface Booking {
    id: string;
    confirmationCode: string;
    status: string;
    date: string;
    timeWindow: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    total: number;
    service?: {
        name: string;
    };
    contractor?: {
        firstName: string;
        lastName: string;
    };
    beforePhotos?: Array<{
        url: string;
        name: string;
    }>;
    afterPhotos?: Array<{
        url: string;
        name: string;
    }>;
    completedAt?: string;
    approvalStatus?: string;
}

export default function ApproveServicePage() {
    const params = useParams();
    const router = useRouter();
    const bookingId = params.id as string;

    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${bookingId}?populate=*`);
                if (response.ok) {
                    const data = await response.json();
                    setBooking(data.data);
                } else {
                    setError('Booking not found');
                }
            } catch (err) {
                setError('Failed to load booking');
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [bookingId]);

    const handleApprove = async () => {
        setSubmitting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${bookingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: {
                        approvalStatus: 'approved',
                        approvedAt: new Date().toISOString(),
                    },
                }),
            });

            if (response.ok) {
                alert('Thank you! Your payment has been processed.');
                router.push(`/en/booking/${bookingId}/receipt`);
            } else {
                setError('Failed to approve service. Please try again.');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReportIssue = () => {
        router.push(`/en/booking/${bookingId}/report`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading booking details...</p>
                </div>
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="max-w-md">
                    <div className="text-center p-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h1>
                        <p className="text-gray-600 mb-6">{error || 'This booking does not exist.'}</p>
                        <Button onClick={() => router.push('/en')}>Return to Home</Button>
                    </div>
                </Card>
            </div>
        );
    }

    if (booking.approvalStatus === 'approved' || booking.approvalStatus === 'auto_approved') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="max-w-md">
                    <div className="text-center p-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Already Approved</h1>
                        <p className="text-gray-600 mb-6">This service has already been approved and payment has been processed.</p>
                        <Button onClick={() => router.push('/en')}>Return to Home</Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Approve Your Service</h1>
                    <p className="text-gray-600">
                        Booking #{booking.confirmationCode}
                    </p>
                </div>

                <Card className="mb-6">
                    <div className="p-6">
                        <h2 className="text-xl font-semibold mb-4">Service Details</h2>
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Service</dt>
                                <dd className="mt-1 text-sm text-gray-900">{booking.service?.name || 'Detail Service'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Contractor</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {booking.contractor
                                        ? `${booking.contractor.firstName} ${booking.contractor.lastName}`
                                        : 'Not assigned'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Date</dt>
                                <dd className="mt-1 text-sm text-gray-900">{booking.date}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                                <dd className="mt-1 text-sm text-gray-900">${booking.total.toFixed(2)}</dd>
                            </div>
                            <div className="md:col-span-2">
                                <dt className="text-sm font-medium text-gray-500">Location</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {booking.address}, {booking.city}, {booking.state} {booking.zipCode}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </Card>

                {/* Before/After Photos */}
                {(booking.beforePhotos?.length || booking.afterPhotos?.length) && (
                    <Card className="mb-6">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold mb-4">Service Photos</h2>

                            {booking.beforePhotos && booking.beforePhotos.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium text-gray-700 mb-3">Before Photos</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {booking.beforePhotos.map((photo, index) => (
                                            <div key={index} className="aspect-square relative rounded-lg overflow-hidden">
                                                <Image
                                                    src={photo.url}
                                                    alt={`Before photo ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {booking.afterPhotos && booking.afterPhotos.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-3">After Photos</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {booking.afterPhotos.map((photo, index) => (
                                            <div key={index} className="aspect-square relative rounded-lg overflow-hidden">
                                                <Image
                                                    src={photo.url}
                                                    alt={`After photo ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                <Card>
                    <div className="p-6">
                        <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
                        <p className="text-gray-600 mb-6">
                            Please review the service photos and details above. If you're satisfied with the service,
                            approve below to complete your payment. If you have any concerns, please report an issue.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                onClick={handleApprove}
                                disabled={submitting}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            >
                                {submitting ? 'Processing...' : 'Approve & Complete Payment'}
                            </Button>
                            <Button
                                onClick={handleReportIssue}
                                disabled={submitting}
                                variant="outline"
                                className="flex-1"
                            >
                                Report an Issue
                            </Button>
                        </div>

                        <p className="mt-4 text-xs text-gray-500 text-center">
                            If you don't take action within 24 hours, payment will be automatically approved and processed.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
