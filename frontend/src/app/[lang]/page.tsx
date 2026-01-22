import { getDictionary } from '@/lib/dictionaries';
import { i18n } from '@/i18n-config';
import ZipChecker from '@/components/ZipChecker/ZipChecker';
import styles from './page.module.css';

export default async function HomePage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const validLang = i18n.locales.includes(lang as 'en' | 'es') ? (lang as 'en' | 'es') : 'en';
    const dict = await getDictionary(validLang);

    return (
        <main className={styles.main}>
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <h1 className={styles.title}>{dict.home.hero.title}</h1>
                    <p className={styles.subtitle}>{dict.home.hero.subtitle}</p>
                    <div className={styles.zipCheckerWrapper}>
                        <ZipChecker dict={dict.zipChecker} lang={validLang} />
                    </div>
                </div>
            </section>
        </main>
    );
}
