export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
            <div className="prose prose-slate">
                <p className="mb-4">Last Updated: {new Date().toLocaleDateString()}</p>

                <h2 className="text-xl font-semibold mt-6 mb-3">1. Acceptance of Terms</h2>
                <p>By accessing and using the Rubens Auto Detail Platform, you accept and agree to be bound by the terms and provision of this agreement.</p>

                <h2 className="text-xl font-semibold mt-6 mb-3">2. Service Description</h2>
                <p>We provide a platform connecting vehicle owners ("Customers") with independent auto detailing professionals ("Contractors"). We facilitate bookings and payments but are not directly responsible for the services provided by Contractors.</p>

                <h2 className="text-xl font-semibold mt-6 mb-3">3. User Obligations</h2>
                <p>Users verify that all information provided is accurate. Customers agree to provide a safe working environment. Contractors agree to maintain professional standards and insurance.</p>

                <h2 className="text-xl font-semibold mt-6 mb-3">4. Payments and Refunds</h2>
                <p>Payments are processed securely via Stripe. Cancellations made less than 24 hours before service may be subject to a cancellation fee.</p>

                <h2 className="text-xl font-semibold mt-6 mb-3">5. Liability</h2>
                <p>Rubens Auto Detail Platform is not liable for indirect, incidental, special, consequential or punitive damages occurring from the use of our service.</p>
            </div>
        </div>
    );
}
