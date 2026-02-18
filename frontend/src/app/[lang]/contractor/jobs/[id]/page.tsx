"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import * as contractorApi from "@/lib/api/contractor";

interface JobDetailsProps {
    params: Promise<{
        lang: "en" | "es";
        id: string;
    }>;
}

const translations = {
    // ... translations are the same
    en: {
        title: "Job Details",
        customer: "Customer",
        service: "Service",
        address: "Address",
        scheduledTime: "Scheduled Time",
        status: "Status",
        instructions: "Special Instructions",
        checklist: "Service Checklist",
        beforePhotos: "Before Photos",
        afterPhotos: "After Photos",
        uploadPhotos: "Upload Photos",
        takePhoto: "Take Photo",
        completeService: "Complete Service",
        navigate: "Navigate to Location",
        contactCustomer: "Contact Customer",
        markComplete: "Mark as Complete",
        completing: "Completing...",
        success: "Service Marked Complete!",
        allChecklistRequired: "Please complete all checklist items",
        photosRequired: "Please upload before and after photos",
        loading: "Loading...",
        error: "Error loading job details",
    },
    es: {
        title: "Detalles del Trabajo",
        customer: "Cliente",
        service: "Servicio",
        address: "Dirección",
        scheduledTime: "Hora Programada",
        status: "Estado",
        instructions: "Instrucciones Especiales",
        checklist: "Lista de Verificación",
        beforePhotos: "Fotos Antes",
        afterPhotos: "Fotos Después",
        uploadPhotos: "Subir Fotos",
        takePhoto: "Tomar Foto",
        completeService: "Completar Servicio",
        navigate: "Navegar a la Ubicación",
        contactCustomer: "Contactar Cliente",
        markComplete: "Marcar como Completo",
        completing: "Completando...",
        success: "¡Servicio Marcado como Completo!",
        allChecklistRequired: "Por favor complete todos los elementos de la lista",
        photosRequired: "Por favor suba fotos antes y después",
        loading: "Cargando...",
        error: "Error al cargar los detalles del trabajo",
    },
};

export default function JobDetailsPage({ params }: JobDetailsProps) {
    const { lang, id } = use(params);
    const t = translations[lang];
    const router = useRouter();
    const { session, isAuthenticated, isLoading: authLoading } = useAuth();

    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({});
    const [beforePhotos, setBeforePhotos] = useState<File[]>([]);
    const [afterPhotos, setAfterPhotos] = useState<File[]>([]);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            loadJobDetails();
        } else if (!authLoading && !isAuthenticated) {
            setLoading(false);
        }
    }, [authLoading, isAuthenticated, id]);

    const loadJobDetails = async () => {
        try {
            setLoading(true);
            const accessToken = session?.access_token;
            const data = await contractorApi.fetchJobDetails(id, accessToken);
            setJob(data);

            // Initialize checklist based on service
            const initialChecklist: { [key: string]: boolean } = {};
            const checklistItems = getChecklistItems(data.service?.name);
            checklistItems.forEach((item) => {
                initialChecklist[item] = false;
            });
            setChecklist(initialChecklist);
            setError(null);
        } catch (error) {
            console.error("Failed to load job:", error);
            setError(t.error);
        } finally {
            setLoading(false);
        }
    };

    const getChecklistItems = (serviceName: string) => {
        // Default checklist items for all services
        const defaultItems = [
            "Vehicle inspection completed",
            "Customer notified of arrival",
            "Service area prepared",
            "Quality check performed",
            "Customer walkthrough completed",
        ];

        // Add service-specific items
        if (serviceName?.toLowerCase().includes("detail")) {
            return [
                ...defaultItems,
                "Interior vacuumed",
                "Exterior washed",
                "Windows cleaned",
                "Tires dressed",
            ];
        }

        return defaultItems;
    };

    const handleChecklistToggle = (item: string) => {
        setChecklist((prev) => ({ ...prev, [item]: !prev[item] }));
    };

    const handlePhotoUpload = (type: "before" | "after", files: FileList | null) => {
        if (!files) return;

        const newPhotos = Array.from(files);
        if (type === "before") {
            setBeforePhotos((prev) => [...prev, ...newPhotos]);
        } else {
            setAfterPhotos((prev) => [...prev, ...newPhotos]);
        }
    };

    const handleCompleteService = async () => {
        // Validate checklist
        const allChecked = Object.values(checklist).every((checked) => checked);
        if (!allChecked) {
            alert(t.allChecklistRequired);
            return;
        }

        // Validate photos
        if (beforePhotos.length === 0 || afterPhotos.length === 0) {
            alert(t.photosRequired);
            return;
        }

        setCompleting(true);

        try {
            const accessToken = session?.access_token;
            const response = await contractorApi.completeJob(id, {
                checklist: JSON.stringify(checklist),
                beforePhotos,
                afterPhotos
            }, accessToken);

            if (response.success) {
                alert(t.success);
                router.push(`/${lang}/contractor/dashboard`);
            } else {
                alert("Failed to complete service. Please try again.");
            }
        } catch (error) {
            console.error("Completion error:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setCompleting(false);
        }
    };

    const handleNavigate = () => {
        if (job?.location) {
            const address = encodeURIComponent(job.location.address || job.address);
            window.open(`https://maps.google.com/?q=${address}`, "_blank");
        } else if (job?.address) {
            const address = encodeURIComponent(job.address);
            window.open(`https://maps.google.com/?q=${address}`, "_blank");
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
                <p className="text-gray-600 mb-8">Please log in to your contractor account to view job details.</p>
                <Link
                    href={`/${lang}/login`}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    Log In
                </Link>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <p className="text-red-600 font-medium mb-4">{error || "Job not found"}</p>
                <button
                    onClick={loadJobDetails}
                    className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
                <p className="text-gray-600 mt-2">Booking #{job.id}</p>
            </div>

            {/* Job Info Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">{t.service}</h3>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                            {job.service?.name || "N/A"}
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">{t.status}</h3>
                        <p className="mt-1">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {job.status}
                            </span>
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">{t.address}</h3>
                        <p className="mt-1 text-gray-900">{job.location?.address}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">{t.scheduledTime}</h3>
                        <p className="mt-1 text-gray-900">{job.timeWindow || "TBD"}</p>
                    </div>
                </div>

                {job.specialInstructions && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500">{t.instructions}</h3>
                        <p className="mt-1 text-gray-900">{job.specialInstructions}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex gap-3">
                    <button
                        onClick={handleNavigate}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        {t.navigate}
                    </button>
                    <button className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                        {t.contactCustomer}
                    </button>
                </div>
            </div>

            {/* Checklist */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t.checklist}</h2>
                <div className="space-y-2">
                    {Object.keys(checklist).map((item) => (
                        <label
                            key={item}
                            className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                checked={checklist[item]}
                                onChange={() => handleChecklistToggle(item)}
                                className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-3 text-gray-900">{item}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Photo Upload */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t.uploadPhotos}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Before Photos */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">{t.beforePhotos}</h3>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handlePhotoUpload("before", e.target.files)}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            {beforePhotos.map((photo, index) => (
                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                                    <Image
                                        src={URL.createObjectURL(photo)}
                                        alt={`Before ${index + 1}`}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* After Photos */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">{t.afterPhotos}</h3>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handlePhotoUpload("after", e.target.files)}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        />
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            {afterPhotos.map((photo, index) => (
                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                                    <Image
                                        src={URL.createObjectURL(photo)}
                                        alt={`After ${index + 1}`}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Complete Button */}
            <div className="bg-white rounded-lg shadow p-6">
                <button
                    onClick={handleCompleteService}
                    disabled={completing}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
                >
                    {completing ? t.completing : t.completeService}
                </button>
            </div>
        </div>
    );
}
