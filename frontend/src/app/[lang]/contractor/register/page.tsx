"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";

interface ContractorRegisterProps {
    params: Promise<{
        lang: "en" | "es";
    }>;
}

const translations = {
    en: {
        title: "Contractor Registration",
        subtitle: "Join our network of professional detailers",
        step1: "Personal Information",
        step2: "Service Areas",
        step3: "Documents",
        step4: "Review & Submit",
        fullName: "Full Name",
        email: "Email Address",
        phone: "Phone Number",
        address: "Home Address",
        businessName: "Business Name (Optional)",
        selectZipCodes: "Select Service ZIP Codes",
        uploadDocuments: "Upload Required Documents",
        driversLicense: "Driver's License",
        vehicleInsurance: "Vehicle Insurance",
        businessLicense: "Business License (Optional)",
        next: "Next",
        back: "Back",
        submit: "Submit Application",
        submitting: "Submitting...",
        success: "Application Submitted Successfully!",
        pendingApproval: "Your application is pending approval. We'll contact you within 24-48 hours.",
    },
    es: {
        title: "Registro de Contratista",
        subtitle: "Únete a nuestra red de detallistas profesionales",
        step1: "Información Personal",
        step2: "Áreas de Servicio",
        step3: "Documentos",
        step4: "Revisar y Enviar",
        fullName: "Nombre Completo",
        email: "Correo Electrónico",
        phone: "Número de Teléfono",
        address: "Dirección de Casa",
        businessName: "Nombre del Negocio (Opcional)",
        selectZipCodes: "Seleccionar Códigos Postales de Servicio",
        uploadDocuments: "Cargar Documentos Requeridos",
        driversLicense: "Licencia de Conducir",
        vehicleInsurance: "Seguro de Vehículo",
        businessLicense: "Licencia de Negocio (Opcional)",
        next: "Siguiente",
        back: "Atrás",
        submit: "Enviar Solicitud",
        submitting: "Enviando...",
        success: "¡Solicitud Enviada Exitosamente!",
        pendingApproval: "Su solicitud está pendiente de aprobación. Nos pondremos en contacto con usted en 24-48 horas.",
    },
};

export default function ContractorRegisterPage({
    params,
}: ContractorRegisterProps) {
    const { lang } = use(params);
    const t = translations[lang];
    const router = useRouter();

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        businessName: "",
        serviceZipCodes: [] as string[],
        documents: {
            driversLicense: null as File | null,
            vehicleInsurance: null as File | null,
            businessLicense: null as File | null,
        },
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (field: string, file: File | null) => {
        setFormData((prev) => ({
            ...prev,
            documents: { ...prev.documents, [field]: file },
        }));
    };

    const handleZipCodeToggle = (zipCode: string) => {
        setFormData((prev) => ({
            ...prev,
            serviceZipCodes: prev.serviceZipCodes.includes(zipCode)
                ? prev.serviceZipCodes.filter((z) => z !== zipCode)
                : [...prev.serviceZipCodes, zipCode],
        }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            // Create FormData for file upload
            const submitData = new FormData();
            submitData.append("fullName", formData.fullName);
            submitData.append("email", formData.email);
            submitData.append("phone", formData.phone);
            submitData.append("address", formData.address);
            submitData.append("businessName", formData.businessName);
            submitData.append("serviceZipCodes", JSON.stringify(formData.serviceZipCodes));

            if (formData.documents.driversLicense) {
                submitData.append("driversLicense", formData.documents.driversLicense);
            }
            if (formData.documents.vehicleInsurance) {
                submitData.append("vehicleInsurance", formData.documents.vehicleInsurance);
            }
            if (formData.documents.businessLicense) {
                submitData.append("businessLicense", formData.documents.businessLicense);
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/contractors/register`,
                {
                    method: "POST",
                    body: submitData,
                }
            );

            if (response.ok) {
                setIsSubmitted(true);
            } else {
                alert("Failed to submit application. Please try again.");
            }
        } catch (error) {
            console.error("Registration error:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
                    <div className="mb-4">
                        <svg
                            className="mx-auto h-16 w-16 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.success}</h2>
                    <p className="text-gray-600">{t.pendingApproval}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
                    <p className="mt-2 text-gray-600">{t.subtitle}</p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex justify-between">
                        {[1, 2, 3, 4].map((step) => (
                            <div
                                key={step}
                                className={`flex-1 ${step < 4 ? "border-t-4" : ""} ${step <= currentStep ? "border-blue-500" : "border-gray-300"
                                    }`}
                            >
                                <div className="relative">
                                    <div
                                        className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${step <= currentStep
                                                ? "bg-blue-500 text-white"
                                                : "bg-gray-300 text-gray-600"
                                            }`}
                                    >
                                        {step}
                                    </div>
                                    <div className="text-xs text-center mt-2">
                                        {step === 1 && t.step1}
                                        {step === 2 && t.step2}
                                        {step === 3 && t.step3}
                                        {step === 4 && t.step4}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    {t.fullName}
                                </label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    {t.email}
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    {t.phone}
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange("phone", e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    {t.address}
                                </label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => handleInputChange("address", e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    {t.businessName}
                                </label>
                                <input
                                    type="text"
                                    value={formData.businessName}
                                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div>
                            <h3 className="text-lg font-medium mb-4">{t.selectZipCodes}</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {["33186", "33155", "33143", "33165", "33193", "33196"].map(
                                    (zip) => (
                                        <button
                                            key={zip}
                                            onClick={() => handleZipCodeToggle(zip)}
                                            className={`p-3 rounded-lg border-2 text-center ${formData.serviceZipCodes.includes(zip)
                                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                                    : "border-gray-300 hover:border-gray-400"
                                                }`}
                                        >
                                            {zip}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium mb-4">{t.uploadDocuments}</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    {t.driversLicense} *
                                </label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) =>
                                        handleFileChange("driversLicense", e.target.files?.[0] || null)
                                    }
                                    className="mt-1 block w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    {t.vehicleInsurance} *
                                </label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) =>
                                        handleFileChange("vehicleInsurance", e.target.files?.[0] || null)
                                    }
                                    className="mt-1 block w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    {t.businessLicense}
                                </label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) =>
                                        handleFileChange("businessLicense", e.target.files?.[0] || null)
                                    }
                                    className="mt-1 block w-full"
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium mb-4">{t.step4}</h3>
                            <div className="bg-gray-50 p-4 rounded">
                                <p><strong>{t.fullName}:</strong> {formData.fullName}</p>
                                <p><strong>{t.email}:</strong> {formData.email}</p>
                                <p><strong>{t.phone}:</strong> {formData.phone}</p>
                                <p>
                                    <strong>{t.selectZipCodes}:</strong>{" "}
                                    {formData.serviceZipCodes.join(", ")}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="mt-6 flex justify-between">
                        <button
                            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                            disabled={currentStep === 1}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            {t.back}
                        </button>
                        {currentStep < 4 ? (
                            <button
                                onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                            >
                                {t.next}
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isSubmitting ? t.submitting : t.submit}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
