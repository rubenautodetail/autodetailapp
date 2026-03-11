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
        selectZipCodes: "Service ZIP Codes",
        zipCodeHint: "Enter the ZIP codes where you can work, separated by commas. Example: 33186, 33155, 33143",
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
        selectZipCodes: "Códigos Postales de Servicio",
        zipCodeHint: "Ingresa los códigos postales donde puedes trabajar, separados por comas. Ejemplo: 33186, 33155, 33143",
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
    const [stepError, setStepError] = useState("");

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

    const handleNext = () => {
        setStepError("");
        if (currentStep === 1) {
            if (!formData.fullName.trim()) { setStepError(lang === "es" ? "El nombre completo es obligatorio." : "Full name is required."); return; }
            if (!formData.email.trim()) { setStepError(lang === "es" ? "El correo es obligatorio." : "Email is required."); return; }
            if (!formData.phone.trim()) { setStepError(lang === "es" ? "El teléfono es obligatorio." : "Phone number is required."); return; }
            if (!formData.address.trim()) { setStepError(lang === "es" ? "La dirección es obligatoria." : "Home address is required."); return; }
        }
        if (currentStep === 2 && formData.serviceZipCodes.length === 0) {
            setStepError(lang === "es" ? "Selecciona al menos un código postal." : "Select at least one service ZIP code.");
            return;
        }
        if (currentStep === 3 && !formData.documents.driversLicense) {
            setStepError(lang === "es" ? "La licencia de conducir es obligatoria." : "Driver's license is required.");
            return;
        }
        setCurrentStep((prev) => Math.min(4, prev + 1));
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
                `/api/contractors/register`,
                {
                    method: "POST",
                    body: submitData,
                }
            );

            if (response.ok) {
                setIsSubmitted(true);
            } else {
                setStepError(lang === "es" ? "Error al enviar la solicitud. Inténtalo de nuevo." : "Failed to submit application. Please try again.");
            }
        } catch (error) {
            console.error("Registration error:", error);
            setStepError(lang === "es" ? "Ocurrió un error. Inténtalo de nuevo." : "An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-[#131835] flex items-center justify-center p-4">
                <div className="bg-white/5 border border-white/10 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
                    <div className="mb-4">
                        <svg
                            className="mx-auto h-16 w-16 text-green-400"
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
                    <h2 className="text-2xl font-bold text-white mb-4">{t.success}</h2>
                    <p className="text-white/60">{t.pendingApproval}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#131835] py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white">{t.title}</h1>
                    <p className="mt-2 text-white/60">{t.subtitle}</p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex justify-between">
                        {[1, 2, 3, 4].map((step) => (
                            <div
                                key={step}
                                className={`flex-1 ${step < 4 ? "border-t-4" : ""} ${step <= currentStep ? "border-yellow-400" : "border-white/20"
                                    }`}
                            >
                                <div className="relative">
                                    <div
                                        className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center font-semibold ${step <= currentStep
                                            ? "bg-yellow-400 text-[#131835]"
                                            : "bg-white/10 text-white/40"
                                            }`}
                                    >
                                        {step}
                                    </div>
                                    <div className="text-xs text-center mt-2 text-white/60">
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
                <div className="bg-white/5 border border-white/10 rounded-lg shadow-lg p-6">
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white/80">
                                    {t.fullName}
                                </label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                                    className="mt-1 block w-full rounded-md bg-white/5 border border-white/20 text-white placeholder-white/30 shadow-sm focus:border-yellow-400 focus:ring-yellow-400 focus:outline-none px-3 py-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/80">
                                    {t.email}
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                    className="mt-1 block w-full rounded-md bg-white/5 border border-white/20 text-white placeholder-white/30 shadow-sm focus:border-yellow-400 focus:ring-yellow-400 focus:outline-none px-3 py-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/80">
                                    {t.phone}
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange("phone", e.target.value)}
                                    className="mt-1 block w-full rounded-md bg-white/5 border border-white/20 text-white placeholder-white/30 shadow-sm focus:border-yellow-400 focus:ring-yellow-400 focus:outline-none px-3 py-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/80">
                                    {t.address}
                                </label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => handleInputChange("address", e.target.value)}
                                    className="mt-1 block w-full rounded-md bg-white/5 border border-white/20 text-white placeholder-white/30 shadow-sm focus:border-yellow-400 focus:ring-yellow-400 focus:outline-none px-3 py-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/80">
                                    {t.businessName}
                                </label>
                                <input
                                    type="text"
                                    value={formData.businessName}
                                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                                    className="mt-1 block w-full rounded-md bg-white/5 border border-white/20 text-white placeholder-white/30 shadow-sm focus:border-yellow-400 focus:ring-yellow-400 focus:outline-none px-3 py-2"
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div>
                            <h3 className="text-lg font-medium mb-2 text-white">{t.selectZipCodes}</h3>
                            <p className="text-sm text-white/50 mb-4">{t.zipCodeHint}</p>
                            <textarea
                                value={formData.serviceZipCodes.join(", ")}
                                onChange={(e) => {
                                    const raw = e.target.value;
                                    const zips = raw
                                        .split(/[\s,]+/)
                                        .map((z) => z.trim())
                                        .filter((z) => /^\d{5}$/.test(z));
                                    setFormData((prev) => ({ ...prev, serviceZipCodes: [...new Set(zips)] }));
                                }}
                                rows={3}
                                placeholder="33186, 33155, 33143, 33165..."
                                className="mt-1 block w-full rounded-md bg-white/5 border border-white/20 text-white placeholder-white/30 shadow-sm focus:border-yellow-400 focus:ring-yellow-400 focus:outline-none px-3 py-2"
                            />
                            {formData.serviceZipCodes.length > 0 && (
                                <p className="mt-2 text-sm text-yellow-400">
                                    {formData.serviceZipCodes.length} ZIP{formData.serviceZipCodes.length !== 1 ? "s" : ""} entered: {formData.serviceZipCodes.join(", ")}
                                </p>
                            )}
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium mb-4 text-white">{t.uploadDocuments}</h3>
                            <div>
                                <label className="block text-sm font-medium text-white/80">
                                    {t.driversLicense} *
                                </label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) =>
                                        handleFileChange("driversLicense", e.target.files?.[0] || null)
                                    }
                                    className="mt-1 block w-full text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-white/10 file:text-white hover:file:bg-white/20"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/80">
                                    {t.vehicleInsurance} *
                                </label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) =>
                                        handleFileChange("vehicleInsurance", e.target.files?.[0] || null)
                                    }
                                    className="mt-1 block w-full text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-white/10 file:text-white hover:file:bg-white/20"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/80">
                                    {t.businessLicense}
                                </label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) =>
                                        handleFileChange("businessLicense", e.target.files?.[0] || null)
                                    }
                                    className="mt-1 block w-full text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-white/10 file:text-white hover:file:bg-white/20"
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium mb-4 text-white">{t.step4}</h3>
                            <div className="bg-white/5 border border-white/10 p-4 rounded space-y-2 text-white/80">
                                <p><strong className="text-white">{t.fullName}:</strong> {formData.fullName}</p>
                                <p><strong className="text-white">{t.email}:</strong> {formData.email}</p>
                                <p><strong className="text-white">{t.phone}:</strong> {formData.phone}</p>
                                <p>
                                    <strong className="text-white">{t.selectZipCodes}:</strong>{" "}
                                    {formData.serviceZipCodes.join(", ")}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step error */}
                    {stepError && (
                        <div className="mt-4 p-3 bg-red-900/30 border border-red-500/40 rounded-md text-sm text-red-300">
                            {stepError}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="mt-6 flex justify-between">
                        <button
                            onClick={() => { setStepError(""); setCurrentStep((prev) => Math.max(1, prev - 1)); }}
                            disabled={currentStep === 1}
                            className="px-4 py-2 border border-white/20 rounded-md shadow-sm text-sm font-medium text-white/70 bg-white/5 hover:bg-white/10 disabled:opacity-30"
                        >
                            {t.back}
                        </button>
                        {currentStep < 4 ? (
                            <button
                                onClick={handleNext}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-[#131835] bg-yellow-400 hover:bg-yellow-300"
                            >
                                {t.next}
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-[#131835] bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50"
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
