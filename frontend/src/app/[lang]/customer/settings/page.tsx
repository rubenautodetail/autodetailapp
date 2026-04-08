"use client";

import React, { useState, useEffect } from 'react';
import { useBookingStatus, UserProfile } from '@/contexts/BookingStatusContext';
import { NotificationToast } from '@/components/dashboard/NotificationToast';
import { ChevronLeft, User, Bell, Shield, Moon, Save, Camera, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function SettingsPage() {
    const params = useParams();
    const lang = (params?.lang as string) || 'en';
    const isEs = lang === 'es';
    const { userProfile, updateProfile, settings, updateSettings, notifications, dismissNotification, isLoading } = useBookingStatus();

    // Local state for form values
    const [profileForm, setProfileForm] = useState<UserProfile>({
        name: '',
        email: '',
        phone: '',
        memberSince: '',
        path: ''
    });

    // Sync form with profile once loaded
    useEffect(() => {
        if (userProfile) {
            setProfileForm(userProfile);
        }
    }, [userProfile]);

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        await updateProfile(profileForm);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-bg-primary flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-accent-gold animate-spin" />
            </div>
        );
    }

    if (!userProfile) {
        return (
            <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4">
                <h2 className="text-white text-2xl font-bold mb-4">{isEs ? 'Perfil No Encontrado' : 'Profile Not Found'}</h2>
                <Link href={`/${params.lang || 'en'}/customer`} className="btn-primary px-6 py-2 rounded-lg">
                    {isEs ? 'Volver al Panel' : 'Back to Dashboard'}
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-primary pb-20 text-white">
            {/* Header */}
            <div className="glass-card border-b border-white/5 sticky top-0 z-40 backdrop-blur-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href={`/${params.lang || 'en'}/customer`} className="text-text-secondary hover:text-white flex items-center text-sm font-medium transition-colors">
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        {isEs ? 'Volver al Panel' : 'Back to Dashboard'}
                    </Link>
                    <h1 className="font-bold hidden md:block">{isEs ? 'Configuración' : 'Settings'}</h1>
                    <div className="w-20"></div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <h1 className="text-3xl font-bold mb-2">{isEs ? 'Configuración de Cuenta' : 'Account Settings'}</h1>
                <p className="text-text-secondary mb-8">{isEs ? 'Administra tu perfil y preferencias.' : 'Manage your profile and application preferences.'}</p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Navigation */}
                    <div className="hidden lg:block space-y-2">
                        <div className="glass-card p-4 rounded-xl">
                            <button className="w-full text-left px-4 py-3 rounded-lg bg-white/10 text-white font-medium flex items-center transition-colors">
                                <User className="w-5 h-5 mr-3 text-accent-gold" />
                                {isEs ? 'Perfil' : 'Profile'}
                            </button>
                            <button className="w-full text-left px-4 py-3 rounded-lg text-text-secondary hover:bg-white/5 hover:text-white transition-colors flex items-center">
                                <Bell className="w-5 h-5 mr-3" />
                                {isEs ? 'Notificaciones' : 'Notifications'}
                            </button>
                            <button className="w-full text-left px-4 py-3 rounded-lg text-text-secondary hover:bg-white/5 hover:text-white transition-colors flex items-center">
                                <Shield className="w-5 h-5 mr-3" />
                                {isEs ? 'Seguridad' : 'Security'}
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Profile Section */}
                        <section className="glass-card p-8 rounded-2xl relative overflow-hidden">
                            <div className="flex items-center mb-6">
                                <div className="relative group cursor-pointer">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-700 to-black border-2 border-accent-gold flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
                                        {profileForm.name ? profileForm.name.charAt(0) : 'U'}
                                    </div>
                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="ml-6">
                                    <h2 className="text-xl font-bold">{userProfile.name}</h2>
                                    <p className="text-text-secondary text-sm">{isEs ? 'Miembro desde' : 'Member since'} {userProfile.memberSince}</p>
                                </div>
                            </div>

                            <form onSubmit={handleProfileSave} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase text-text-muted font-bold mb-1">{isEs ? 'Nombre Completo' : 'Full Name'}</label>
                                        <input
                                            type="text"
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent-gold focus:outline-none transition-colors"
                                            value={profileForm.name}
                                            onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase text-text-muted font-bold mb-1">{isEs ? 'Teléfono' : 'Phone Number'}</label>
                                        <input
                                            type="tel"
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent-gold focus:outline-none transition-colors"
                                            placeholder="+1 (000) 000-0000"
                                            value={profileForm.phone}
                                            onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs uppercase text-text-muted font-bold mb-1">{isEs ? 'Correo Electrónico' : 'Email Address'}</label>
                                    <input
                                        type="email"
                                        disabled
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-text-muted focus:outline-none cursor-not-allowed"
                                        value={profileForm.email}
                                    />
                                    <p className="text-[10px] text-text-muted mt-1 italic">{isEs ? 'El correo no se puede cambiar directamente.' : 'Email cannot be changed directly.'}</p>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button type="submit" className="btn-primary py-2 px-6 rounded-lg font-bold shadow-glow flex items-center">
                                        <Save className="w-4 h-4 mr-2" />
                                        {isEs ? 'Guardar Cambios' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </section>

                        {/* Preferences Section */}
                        <section className="glass-card p-8 rounded-2xl">
                            <h3 className="text-lg font-bold mb-6">{params.lang === 'es' ? 'Preferencias' : 'Preferences'}</h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-blue-500/10 rounded-lg mr-4">
                                            <Bell className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{isEs ? 'Notificaciones Push' : 'Push Notifications'}</p>
                                            <p className="text-text-secondary text-sm">{isEs ? 'Recibe actualizaciones sobre el estado de tu reserva' : 'Receive updates about your booking status'}</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.notificationsEnabled}
                                            onChange={e => updateSettings({ notificationsEnabled: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-gold"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-purple-500/10 rounded-lg mr-4">
                                            <Moon className="w-5 h-5 text-purple-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{isEs ? 'Modo Oscuro' : 'Dark Mode'}</p>
                                            <p className="text-text-secondary text-sm">{isEs ? 'Usar siempre tema oscuro (Recomendado)' : 'Always use dark theme (Recommended)'}</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.darkMode}
                                            onChange={e => updateSettings({ darkMode: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-gold"></div>
                                    </label>
                                </div>
                            </div>
                        </section>
                        {/* About Section */}
                        <section className="glass-card p-8 rounded-2xl">
                            <h3 className="text-lg font-bold mb-6">{params.lang === 'es' ? 'Acerca de' : 'About'}</h3>
                            <div className="space-y-4 text-sm text-text-secondary">
                                <div className="flex items-center justify-between py-3 border-b border-white/5">
                                    <span>{params.lang === 'es' ? 'Versión de la aplicación' : 'App Version'}</span>
                                    <span className="text-white/40">1.0.0</span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-white/5">
                                    <Link
                                        href={`/${params.lang || 'en'}/terms`}
                                        className="hover:text-white transition-colors"
                                    >
                                        {params.lang === 'es' ? 'Términos de Servicio' : 'Terms of Service'}
                                    </Link>
                                    <span className="text-white/20">→</span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-white/5">
                                    <Link
                                        href={`/${params.lang || 'en'}/privacy`}
                                        className="hover:text-white transition-colors"
                                    >
                                        {params.lang === 'es' ? 'Política de Privacidad' : 'Privacy Policy'}
                                    </Link>
                                    <span className="text-white/20">→</span>
                                </div>
                                <div className="pt-4 text-center">
                                    <p className="text-white/25 text-xs">
                                        {params.lang === 'es' ? 'Diseñado por' : 'Designed by'}{' '}
                                        <span className="text-white/40 font-medium">OAC Digital Innovations</span>
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <NotificationToast notifications={notifications} onDismiss={dismissNotification} />
        </div>
    );
}
