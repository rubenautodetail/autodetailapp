export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
            <div className="prose prose-slate">
                <p className="mb-4">Last Updated: {new Date().toLocaleDateString()}</p>

                <h2 className="text-xl font-semibold mt-6 mb-3">1. Information We Collect</h2>
                <p>We collect information you provide directly to us, including name, contact info, vehicle details, and payment information.</p>

                <h2 className="text-xl font-semibold mt-6 mb-3">2. How We Use Information</h2>
                <p>We use your information to facilitate service bookings, process payments, and improve our platform functionality.</p>

                <h2 className="text-xl font-semibold mt-6 mb-3">3. Information Sharing</h2>
                <p>We share necessary information with Contractors to fulfill service requests. We do not sell your personal data to third parties.</p>

                <h2 className="text-xl font-semibold mt-6 mb-3">4. Data Security</h2>
                <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access.</p>

                <h2 className="text-xl font-semibold mt-6 mb-3">5. Contact Us</h2>
                <p>If you have questions about this policy, please contact us at support@rubensautodetail.com.</p>
            </div>
        </div>
    );
}
