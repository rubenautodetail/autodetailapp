import React from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Car, Trash2, Edit2 } from 'lucide-react';
import { Vehicle } from '@/contexts/BookingStatusContext';

interface VehicleCardProps {
    vehicle: Vehicle;
    onDelete: (id: string) => void;
    onEdit?: (id: string) => void;
}

export function VehicleCard({ vehicle, onDelete, onEdit }: VehicleCardProps) {
    const params = useParams();
    const isEs = (params?.lang as string) === 'es';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -5, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
            className="glass-card p-6 rounded-2xl relative group overflow-hidden"
        >
            <Car className="absolute -right-6 -bottom-6 w-32 h-32 text-white/5 transform -rotate-12" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center">
                            <Car className="w-5 h-5 text-accent-gold" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg leading-none">{vehicle.make}</h3>
                            <p className="text-text-secondary text-sm">{vehicle.model}</p>
                        </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                        {onEdit && (
                            <button
                                onClick={() => onEdit(vehicle.id)}
                                className="p-2 hover:bg-white/10 rounded-full text-text-secondary hover:text-white transition-colors"
                                aria-label={isEs ? 'Editar' : 'Edit'}
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => onDelete(vehicle.id)}
                            className="p-2 hover:bg-red-500/10 rounded-full text-text-secondary hover:text-red-500 transition-colors"
                            aria-label={isEs ? 'Eliminar' : 'Delete'}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="space-y-2 mt-4">
                    {vehicle.licensePlate && (
                        <div className="flex justify-between text-sm border-b border-white/5 pb-2">
                            <span className="text-text-muted">{isEs ? 'Placa' : 'License Plate'}</span>
                            <span className="font-mono text-white tracking-wider">{vehicle.licensePlate}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm border-b border-white/5 pb-2">
                        <span className="text-text-muted">{isEs ? 'Año' : 'Year'}</span>
                        <span className="text-white">{vehicle.year}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-1">
                        <span className="text-text-muted">Color</span>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2 border border-white/20" style={{ backgroundColor: vehicle.color.toLowerCase() }}></div>
                            <span className="text-white">{vehicle.color}</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
