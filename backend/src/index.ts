import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Seed test data on first run
    await seedTestData(strapi);
  },
};

/**
 * Seed test data if database is empty
 */
async function seedTestData(strapi: Core.Strapi) {
  try {
    // Check if data already exists
    const existingServices = await strapi.entityService.findMany('api::service.service', {
      limit: 1,
    });

    if (existingServices && existingServices.length > 0) {
      strapi.log.info('✓ Database already seeded, skipping...');
      return;
    }

    strapi.log.info('🌱 Seeding test data...');

    // Create Services
    const services = [
      {
        name: 'Interior Detail',
        description: 'Complete interior cleaning and conditioning. Perfect for maintaining your vehicle\'s cabin.',
        basePrice: 89.99,
        durationMinutes: 120,
        sortOrder: 1,
        checklist: [
          'Vacuum all seats, floor, and trunk',
          'Clean and condition leather/vinyl',
          'Clean dashboard and console',
          'Clean door panels and cup holders',
          'Clean windows (interior)',
          'Air freshener application'
        ],
        locale: 'en',
        publishedAt: new Date()
      },
      {
        name: 'Exterior Detail',
        description: 'Professional hand wash and exterior shine. Your vehicle will look showroom fresh.',
        basePrice: 79.99,
        durationMinutes: 90,
        sortOrder: 2,
        checklist: [
          'Hand wash with premium soap',
          'Wheel and tire cleaning',
          'Wheel wells cleaned',
          'Exterior trim restoration',
          'Windows cleaned (exterior)',
          'Quick spray wax application'
        ],
        locale: 'en',
        publishedAt: new Date()
      },
      {
        name: 'Full Detail Package',
        description: 'The ultimate detail combining complete interior and exterior service. Best value!',
        basePrice: 149.99,
        durationMinutes: 180,
        sortOrder: 3,
        checklist: [
          '✨ All Interior Detail services',
          '✨ All Exterior Detail services',
          'Engine bay cleaning (exterior only)',
          'Headlight cleaning',
          'Complete vehicle inspection'
        ],
        locale: 'en',
        publishedAt: new Date()
      }
    ];

    for (const service of services) {
      await strapi.entityService.create('api::service.service', { data: service });
      strapi.log.info(`✓ Created service: ${service.name}`);
    }

    // Create Add-ons
    const addOns = [
      {
        name: 'Premium Wax',
        description: 'High-grade carnauba wax for long-lasting shine and protection',
        price: 29.99,
        durationMinutes: 30,
        sortOrder: 1,
        checklist: ['Apply premium carnauba wax', 'Hand buff to high shine'],
        locale: 'en',
        publishedAt: new Date()
      },
      {
        name: 'Tire Shine & Dressing',
        description: 'Professional tire dressing for a deep black shine',
        price: 15.99,
        durationMinutes: 15,
        sortOrder: 2,
        checklist: ['Apply tire shine to all 4 tires', 'Wheel well dressing'],
        locale: 'en',
        publishedAt: new Date()
      },
      {
        name: 'Pet Hair Removal',
        description: 'Deep cleaning to remove pet hair from seats and carpet',
        price: 34.99,
        durationMinutes: 45,
        sortOrder: 3,
        checklist: ['Use specialized pet hair tools', 'Deep vacuum all surfaces', 'Lint roller finish'],
        locale: 'en',
        publishedAt: new Date()
      },
      {
        name: 'Headlight Restoration',
        description: 'Restore cloudy headlights to like-new clarity',
        price: 44.99,
        durationMinutes: 60,
        sortOrder: 4,
        checklist: ['Wet sand headlights', 'Buff with compound', 'Apply UV sealant'],
        locale: 'en',
        publishedAt: new Date()
      }
    ];

    for (const addOn of addOns) {
      await strapi.entityService.create('api::add-on.add-on', { data: addOn });
      strapi.log.info(`✓ Created add-on: ${addOn.name}`);
    }

    // Create Service Zones
    const zones = [
      { zipCode: '33186', isActive: true, coverageRadiusMiles: 5, priceMultiplier: 1.0, publishedAt: new Date() },
      { zipCode: '33183', isActive: true, coverageRadiusMiles: 5, priceMultiplier: 1.0, publishedAt: new Date() },
      { zipCode: '33156', isActive: true, coverageRadiusMiles: 5, priceMultiplier: 1.1, publishedAt: new Date() },
      { zipCode: '33176', isActive: true, coverageRadiusMiles: 5, priceMultiplier: 1.0, publishedAt: new Date() },
    ];

    for (const zone of zones) {
      await strapi.entityService.create('api::service-zone.service-zone', { data: zone });
      strapi.log.info(`✓ Created zone: ${zone.zipCode}`);
    }

    // Create Contractors
    const contractors = [
      {
        name: 'Juan Rodriguez',
        email: 'juan@testdetailer.com',
        phone: '+1-305-555-0101',
        preferredLanguage: 'es',
        status: 'active',
        performanceTier: 'preferred',
        averageRating: 4.8,
        totalJobs: 127,
        completionRate: 0.96,
        publishedAt: new Date()
      },
      {
        name: 'Maria Santos',
        email: 'maria@testdetailer.com',
        phone: '+1-305-555-0102',
        preferredLanguage: 'en',
        status: 'active',
        performanceTier: 'elite',
        averageRating: 4.9,
        totalJobs: 203,
        completionRate: 0.98,
        publishedAt: new Date()
      }
    ];

    for (const contractor of contractors) {
      await strapi.entityService.create('api::contractor.contractor', { data: contractor as any });
      strapi.log.info(`✓ Created contractor: ${contractor.name}`);
    }

    strapi.log.info('✨ Test data seeded successfully!');
  } catch (error) {
    strapi.log.error('Error seeding test data:', error);
  }
}
