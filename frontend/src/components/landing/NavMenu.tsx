import { createServiceClient } from '@/lib/supabase/server';
import { SERVICES } from '@/lib/seo/services';
import { serviceName, servicePath } from '@/lib/seo/serviceNames';
import NavMenuClient, { type NavService } from './NavMenuClient';

interface NavMenuProps {
    locale: 'en' | 'es';
}

type DbNavService = { id: number; name: string; name_es: string | null };

/**
 * Header menu. The "Services" list comes from the same Supabase table as the home-page
 * cards and the service pages, so the menu always matches what is offered and links
 * to /{lang}/services/{slug}. If the table can't be read, it falls back to the SEO
 * catalog so the menu is never empty.
 */
export async function NavMenu({ locale }: NavMenuProps) {
    let services: NavService[] = [];

    try {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('services')
            .select('id, name, name_es, sort_order')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .limit(6);
        if (error) console.error('[NavMenu] services query error:', error.message);
        services = ((data ?? []) as unknown as DbNavService[]).map((s) => ({
            name: serviceName(s, locale),
            href: servicePath(s, locale),
        }));
    } catch (e) {
        console.error('[NavMenu] services fetch failed:', e);
    }

    if (services.length === 0) {
        services = SERVICES.map((s) => ({
            name: s.name[locale],
            href: `/${locale}/${s.slug[locale]}/miami`,
        }));
    }

    return <NavMenuClient locale={locale} services={services} />;
}
