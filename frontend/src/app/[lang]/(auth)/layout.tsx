import AuthLangSwitch from '@/components/ui/AuthLangSwitch';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <AuthLangSwitch />
            {children}
        </>
    );
}
