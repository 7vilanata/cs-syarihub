import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { listConversations } from "@/lib/conversations";
import { Dashboard } from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!(await isAuthenticated())) redirect("/login");
  let conversations;
  try {
    conversations = await listConversations();
  } catch {
    return <main className="grid min-h-screen place-items-center bg-slate-100 px-5"><div className="max-w-lg rounded-2xl border border-amber-200 bg-white p-8 shadow-sm"><p className="text-sm font-bold uppercase tracking-wider text-amber-700">Dashboard belum tersambung</p><h1 className="mt-2 text-2xl font-bold text-slate-950">Database belum siap</h1><p className="mt-3 leading-7 text-slate-600">Pastikan PostgreSQL berjalan, lalu jalankan migration dan seed sesuai petunjuk di README.</p></div></main>;
  }
  return <Dashboard initialConversations={conversations} />;
}
