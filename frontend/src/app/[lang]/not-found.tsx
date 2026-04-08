import Link from "next/link";

export default function LangNotFound() {
  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center px-4">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center space-y-4">
        <h1 className="text-6xl font-bold text-[#D0B078]">404</h1>
        <h2 className="text-xl font-bold text-white">
          Page not found / P&aacute;gina no encontrada
        </h2>
        <p className="text-text-secondary text-sm">
          The page you are looking for does not exist or has been moved.
        </p>
        <p className="text-text-secondary text-sm">
          La p&aacute;gina que buscas no existe o ha sido movida.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/en"
            className="btn-primary px-6 py-2.5 rounded-xl font-bold text-sm"
          >
            Go Home (EN)
          </Link>
          <Link
            href="/es"
            className="glass-card hover:bg-white/10 text-text-secondary px-6 py-2.5 rounded-xl font-bold text-sm transition-colors"
          >
            Ir al Inicio (ES)
          </Link>
        </div>
      </div>
    </div>
  );
}
