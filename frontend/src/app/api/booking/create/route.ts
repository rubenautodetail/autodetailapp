/**
 * POST /api/booking/create
 *
 * DESACTIVADO. Esta ruta antigua creaba reservas sin cobrar.
 * Todas las reservas deben pasar por /api/booking/create-with-payment,
 * que crea la reserva y la retencion en la tarjeta en un solo paso.
 */

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint has been retired. Use /api/booking/create-with-payment.' },
    { status: 410 }
  );
}
