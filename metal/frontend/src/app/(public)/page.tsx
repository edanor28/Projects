import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-xl">
        <h1 className="text-3xl font-bold">Metalurgia ERP</h1>
        <p className="mt-3 text-slate-300">Portal corporativo de acceso seguro</p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500"
        >
          Ir al login
        </Link>
      </div>
    </main>
  );
}
