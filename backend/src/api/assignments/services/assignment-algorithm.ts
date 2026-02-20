/**
 * Contractor Assignment Algorithm
 *
 * Assigns the best available contractor to a booking based on:
 * 1. Service zone coverage (ZIP code)
 * 2. Availability (date/time slot)
 * 3. Distance from contractor home to service location
 * 4. Performance metrics (rating, completion rate, total jobs)
 * 5. Performance tier (elite > preferred > standard)
 */

interface AssignmentCriteria {
    zipCode: string;
    scheduledDate: string; // YYYY-MM-DD
    timeWindow: 'morning' | 'afternoon' | 'evening';
    serviceLatitude?: number;
    serviceLongitude?: number;
    serviceDuration?: number; // minutes
}

interface ContractorScore {
    contractorId: number;
    score: number;
    breakdown: {
        availability: number; // 0-100
        distance: number; // 0-100
        rating: number; // 0-100
        completionRate: number; // 0-100
        tierBonus: number; // 0-30
        totalJobs: number; // 0-10
    };
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 3959; // Earth's radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Score a contractor for assignment
 */
function scoreContractor(
    contractor: any,
    criteria: AssignmentCriteria,
    isAvailable: boolean
): ContractorScore {
    const breakdown = {
        availability: isAvailable ? 100 : 0,
        distance: 0,
        rating: 0,
        completionRate: 0,
        tierBonus: 0,
        totalJobs: 0,
    };

    // If not available, return 0 score
    if (!isAvailable) {
        return {
            contractorId: contractor.id,
            score: 0,
            breakdown,
        };
    }

    // Distance scoring (0-100, closer = better)
    if (
        criteria.serviceLatitude &&
        criteria.serviceLongitude &&
        contractor.homeAddress?.latitude &&
        contractor.homeAddress?.longitude
    ) {
        const distance = calculateDistance(
            contractor.homeAddress.latitude,
            contractor.homeAddress.longitude,
            criteria.serviceLatitude,
            criteria.serviceLongitude
        );

        // Score inversely proportional to distance
        // 0 miles = 100 points, 25+ miles = 0 points
        breakdown.distance = Math.max(0, 100 - (distance / 25) * 100);
    } else {
        // If no location data, give average score
        breakdown.distance = 50;
    }

    // Rating scoring (0-100)
    // 5.0 stars = 100 points, 0 stars = 0 points
    breakdown.rating = (contractor.averageRating || 0) * 20;

    // Completion rate scoring (0-100)
    // 100% = 100 points, 0% = 0 points
    breakdown.completionRate = (contractor.completionRate || 0) * 100;

    // Total jobs scoring (0-10, experience bonus)
    // More jobs = more points, caps at 100 jobs
    breakdown.totalJobs = Math.min(10, (contractor.totalJobs || 0) / 10);

    // Performance tier bonus
    const tierBonuses = {
        elite: 30,
        preferred: 15,
        standard: 0,
    };
    breakdown.tierBonus = tierBonuses[contractor.performanceTier] || 0;

    // Calculate weighted total score
    const score =
        breakdown.availability * 0.4 + // 40% weight - must be available
        breakdown.distance * 0.25 + // 25% weight - prefer nearby
        breakdown.rating * 0.15 + // 15% weight - quality matters
        breakdown.completionRate * 0.1 + // 10% weight - reliability
        breakdown.tierBonus * 0.05 + // 5% weight - proven performers
        breakdown.totalJobs * 0.05; // 5% weight - experience

    return {
        contractorId: contractor.id,
        score: Math.round(score * 100) / 100,
        breakdown,
    };
}

/**
 * Find the best contractor for a booking
 */
export async function assignContractor(
    strapi: any,
    bookingId: number,
    criteria: AssignmentCriteria
): Promise<{ contractorId: number; score: number } | null> {
    try {
        strapi.log.info(`[Assignment] Starting assignment for booking ${bookingId}`);
        strapi.log.info(`[Assignment] Criteria:`, criteria);

        // 1. Find service zone for ZIP code
        const serviceZone = await strapi.db
            .query('api::service-zone.service-zone')
            .findOne({
                where: { zipCode: criteria.zipCode, isActive: true },
                populate: ['contractors'],
            });

        if (!serviceZone) {
            strapi.log.warn(`[Assignment] No service zone found for ZIP ${criteria.zipCode}`);
            return null;
        }

        // 2. Get active contractors for this zone
        const activeContractors =
            serviceZone.contractors?.filter((c: any) => c.status === 'active') || [];

        if (activeContractors.length === 0) {
            strapi.log.warn(`[Assignment] No active contractors in zone for ZIP ${criteria.zipCode}`);
            return null;
        }

        strapi.log.info(`[Assignment] Found ${activeContractors.length} active contractors`);

        // 3. Check availability and score each contractor
        const scores: ContractorScore[] = [];

        for (const contractor of activeContractors) {
            // Check if contractor is available for this time slot
            const isAvailable = await checkContractorAvailability(
                strapi,
                contractor.id,
                criteria.scheduledDate,
                criteria.timeWindow,
                criteria.serviceDuration || 120
            );

            const score = scoreContractor(contractor, criteria, isAvailable);
            scores.push(score);

            strapi.log.info(
                `[Assignment] Contractor ${contractor.id} (${contractor.name}): Score ${score.score}`,
                score.breakdown
            );
        }

        // 4. Sort by score (highest first)
        scores.sort((a, b) => b.score - a.score);

        // 5. Return best contractor if score > 0
        const bestContractor = scores[0];

        if (!bestContractor || bestContractor.score === 0) {
            strapi.log.warn('[Assignment] No suitable contractor found');
            return null;
        }

        strapi.log.info(
            `[Assignment] Best contractor: ${bestContractor.contractorId} with score ${bestContractor.score}`
        );

        return {
            contractorId: bestContractor.contractorId,
            score: bestContractor.score,
        };
    } catch (error) {
        strapi.log.error('[Assignment] Error in assignContractor:', error);
        throw error;
    }
}

/**
 * Check if contractor is available for a specific time slot
 */
async function checkContractorAvailability(
    strapi: any,
    contractorId: number,
    scheduledDate: string,
    timeWindow: string,
    durationMinutes: number
): Promise<boolean> {
    try {
        // Get contractor's availability records for this date
        const availabilityRecords = await strapi.db
            .query('api::contractor-availability.contractor-availability')
            .findMany({
                where: {
                    contractor: contractorId,
                    date: scheduledDate,
                },
            });

        // If no records, check default availability
        if (availabilityRecords.length === 0) {
            // TODO: Implement default availability check from contractor.defaultAvailability
            // For now, assume available
            return true;
        }

        // Check if any availability record covers this time window
        const timeWindowSlots = {
            morning: { start: 9, end: 12 },
            afternoon: { start: 13, end: 16 },
            evening: { start: 16, end: 19 },
        };

        const requestedSlot = timeWindowSlots[timeWindow as keyof typeof timeWindowSlots];
        if (!requestedSlot) return false;

        for (const record of availabilityRecords) {
            // Check if this record covers the requested time
            if (
                record.timeSlot === timeWindow &&
                record.status === 'available'
            ) {
                return true;
            }
        }

        // Also check if there are no conflicting bookings
        const conflictingBookings = await strapi.db.query('api::booking.booking').findMany({
            where: {
                contractor: contractorId,
                scheduledDate: scheduledDate,
                timeWindow: timeWindow,
                status: { $in: ['confirmed', 'in-progress', 'pending'] },
            },
        });

        return conflictingBookings.length === 0;
    } catch (error) {
        strapi.log.error('[Assignment] Error checking availability:', error);
        return false;
    }
}

/**
 * Update contractor availability after assignment
 */
export async function markSlotAsBooked(
    strapi: any,
    contractorId: number,
    scheduledDate: string,
    timeWindow: string
): Promise<void> {
    try {
        // Find or create availability record
        let availabilityRecord = await strapi.db
            .query('api::contractor-availability.contractor-availability')
            .findOne({
                where: {
                    contractor: contractorId,
                    date: scheduledDate,
                    timeSlot: timeWindow,
                },
            });

        if (availabilityRecord) {
            // Update existing record
            await strapi.db
                .query('api::contractor-availability.contractor-availability')
                .update({
                    where: { id: availabilityRecord.id },
                    data: { status: 'booked' },
                });
        } else {
            // Create new record
            await strapi.db
                .query('api::contractor-availability.contractor-availability')
                .create({
                    data: {
                        contractor: contractorId,
                        date: scheduledDate,
                        timeSlot: timeWindow,
                        status: 'booked',
                    },
                });
        }

        strapi.log.info(
            `[Assignment] Marked slot as booked: contractor ${contractorId}, date ${scheduledDate}, slot ${timeWindow}`
        );
    } catch (error) {
        strapi.log.error('[Assignment] Error marking slot as booked:', error);
        throw error;
    }
}
