'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const ISSUE_TYPES = [
    { value: 'incomplete', label: 'Service appears incomplete' },
    { value: 'quality', label: 'Quality concerns' },
    { value: 'damage', label: 'Vehicle damage' },
    { value: 'different', label: 'Different than expected' },
    { value: 'other', label: 'Other issue' },
];

export default function ReportIssuePage() {
    const params = useParams();
    const router = useRouter();
    const bookingId = params.id as string;

    const [issueType, setIssueType] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!issueType || !description.trim()) {
            setError('Please select an issue type and provide a description.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${bookingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: {
                        approvalStatus: 'disputed',
                        disputeReason: issueType,
                        disputeDescription: description,
                        disputedAt: new Date().toISOString(),
                    },
                }),
            });

            if (response.ok) {
                alert('Thank you for your report. Our support team will contact you shortly.');
                router.push('/en');
            } else {
                setError('Failed to submit report. Please try again or contact support directly.');
            }
        } catch (err) {
            setError('An error occurred. Please try again or contact support directly.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Report an Issue</h1>
                    <p className="text-gray-600">
                        We're sorry to hear you're not satisfied. Please provide details below.
                    </p>
                </div>

                <Card>
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Issue Type Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                What type of issue are you experiencing?
                            </label>
                            <div className="space-y-2">
                                {ISSUE_TYPES.map((type) => (
                                    <label
                                        key={type.value}
                                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                                    >
                                        <input
                                            type="radio"
                                            name="issueType"
                                            value={type.value}
                                            checked={issueType === type.value}
                                            onChange={(e) => setIssueType(e.target.value)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="ml-3 text-sm text-gray-900">{type.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                Please describe the issue in detail
                            </label>
                            <textarea
                                id="description"
                                rows={6}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Provide as much detail as possible to help us resolve your concern..."
                                required
                            />
                            <p className="mt-2 text-xs text-gray-500">
                                Include specific areas of concern, any visible issues, or other relevant details.
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        {/* Submit Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            >
                                {submitting ? 'Submitting...' : 'Submit Report'}
                            </Button>
                            <Button
                                type="button"
                                onClick={() => router.back()}
                                disabled={submitting}
                                variant="outline"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>

                        {/* Support Info */}
                        <div className="pt-4 border-t border-gray-200">
                            <p className="text-sm text-gray-600 text-center">
                                Our support team will review your report and contact you within 24 hours.
                                <br />
                                For urgent matters, call us at{' '}
                                <a href="tel:+1-555-123-4567" className="text-blue-600 hover:underline">
                                    (555) 123-4567
                                </a>
                            </p>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
