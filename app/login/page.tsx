import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { LockKeyhole, MessageCircleMore } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAuthenticated()) redirect("/");
  const { error } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-[#0c3d3b] px-5 py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white p-7 shadow-2xl sm:p-9">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-teal-700 text-white"><MessageCircleMore /></span>
          <div><p className="font-bold text-slate-900">Syarihub</p><p className="text-sm text-slate-500">CS Conversion</p></div>
        </div>
        <div className="mb-6">
          <div className="mb-3 grid size-10 place-items-center rounded-full bg-teal-50 text-teal-700"><LockKeyhole className="size-5" /></div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Masuk ke dashboard</h1>
          <p className="mt-2 text-base leading-6 text-slate-600">Gunakan akun internal tim CS untuk melanjutkan.</p>
        </div>
        {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">Username atau password tidak sesuai.</p>}
        <form action="/api/auth/login" method="post" className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700">Username
            <input name="username" autoComplete="username" required className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-base outline-none ring-teal-600 focus:ring-2" />
          </label>
          <label className="block text-sm font-semibold text-slate-700">Password
            <input name="password" type="password" autoComplete="current-password" required className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-base outline-none ring-teal-600 focus:ring-2" />
          </label>
          <button className="mt-2 h-11 w-full rounded-xl bg-teal-700 font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300">Masuk</button>
        </form>
      </div>
    </main>
  );
}
