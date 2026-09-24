"use client";

import { useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ArrowUpRight, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleDashed, FilterX, LogOut, MessageCircleMore, Phone, Search, Sparkles, UserX, UsersRound } from "lucide-react";
import { toast } from "sonner";
import type { Conversation, ConversationStatus, LastMessageSender, Priority } from "@/db/schema";
import { calculateConversionRate, isWithinDateRange } from "@/lib/metrics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const labels = {
  status: { pending: "Pending", actioned: "Ditindaklanjuti", converted: "Converted", closed: "Closed", not_a_lead: "Not a Lead" },
  priority: { urgent: "Urgent", high: "High", medium: "Medium", low: "Low" },
  stage: { new: "Baru", interested: "Tertarik", considering: "Mempertimbangkan", ready_to_pay: "Siap bayar" },
  sender: { customer: "Customer", cs: "CS", system: "Sistem" },
  blocker: { none: "Tidak ada", price: "Harga", schedule: "Jadwal", payment_method: "Metode bayar", needs_more_information: "Butuh info", needs_approval: "Butuh persetujuan", trust: "Kepercayaan", unresponsive: "Tidak merespons", other: "Lainnya" },
} as const;

type MetricFilter = ConversationStatus | "all" | "conversion_rate";

const priorityClass: Record<Priority, string> = {
  urgent: "border-red-200 bg-red-50 text-red-700 ring-1 ring-red-100",
  high: "border-orange-300 bg-orange-200 text-orange-950",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-slate-200 bg-slate-100 text-slate-600",
};

const senderClass: Record<LastMessageSender, string> = {
  customer: "border-emerald-200 bg-emerald-100 text-emerald-800",
  cs: "border-indigo-200 bg-indigo-100 text-indigo-800",
  system: "border-slate-200 bg-slate-100 text-slate-600",
};

const statusClass: Record<ConversationStatus, string> = {
  pending: "bg-blue-50 text-blue-700", actioned: "bg-violet-50 text-violet-700",
  converted: "bg-emerald-50 text-emerald-700", closed: "bg-slate-100 text-slate-600",
  not_a_lead: "bg-rose-50 text-rose-700",
};

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full border border-transparent px-2.5 py-1 text-xs font-bold ${className}`}>{children}</span>;
}

function dateLabel(value: string) { return format(new Date(value), "d MMM yyyy, HH.mm", { locale: id }); }

function StatusSelect({ conversation, onChange, disabled }: { conversation: Conversation; onChange: (status: ConversationStatus) => void; disabled: boolean }) {
  return <Select value={conversation.status} onValueChange={(value) => onChange(value as ConversationStatus)} disabled={disabled}>
    <SelectTrigger aria-label={`Status ${conversation.contact_name ?? conversation.conversation_id}`} className="h-9 min-w-[150px] bg-white"><SelectValue /></SelectTrigger>
    <SelectContent>{Object.entries(labels.status).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
  </Select>;
}

function MetricCard({ label, value, note, tone = "default", icon, active, onClick }: { label: string; value: string | number; note?: string; tone?: "default" | "green"; icon: React.ReactNode; active: boolean; onClick: () => void }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`rounded-2xl border p-5 text-left shadow-[0_1px_2px_rgb(15_23_42/4%)] transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 ${tone === "green" ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 bg-white"} ${active ? "ring-2 ring-teal-500 ring-offset-2" : ""}`}>
    <div className="flex items-start justify-between gap-3"><p className={`text-sm font-semibold ${tone === "green" ? "text-teal-50" : "text-slate-500"}`}>{label}</p><span className={tone === "green" ? "text-teal-100" : "text-teal-700"}>{icon}</span></div>
    <p className="mt-3 text-3xl font-black tracking-tight">{value}</p>{note && <p className={`mt-1 text-xs ${tone === "green" ? "text-teal-100" : "text-slate-500"}`}>{note}</p>}
  </button>;
}

export function Dashboard({ initialConversations }: { initialConversations: Conversation[] }) {
  const [conversations, setConversations] = useState(initialConversations);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all"); const [priority, setPriority] = useState("all");
  const [stage, setStage] = useState("all"); const [sender, setSender] = useState("all");
  const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(20);
  const [activeMetric, setActiveMetric] = useState<MetricFilter>("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ conversation: Conversation; status: ConversationStatus } | null>(null);
  const listRef = useRef<HTMLElement>(null);

  const dateFiltered = useMemo(() => conversations.filter((item) => isWithinDateRange(item.created_at, from, to)), [conversations, from, to]);

  const metrics = useMemo(() => {
    const count = (wanted: ConversationStatus) => dateFiltered.filter((item) => item.status === wanted).length;
    const converted = count("converted"); const closed = count("closed"); const notALead = count("not_a_lead");
    return { total: dateFiltered.length, pending: count("pending"), actioned: count("actioned"), converted, closed, notALead, rate: calculateConversionRate({ converted, closed, notALead }) };
  }, [dateFiltered]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return dateFiltered.filter((item) => {
      return (!term || item.conversation_id.toLowerCase().includes(term) || item.contact_name?.toLowerCase().includes(term) || item.contact_phone?.toLowerCase().includes(term)) &&
        (status === "all" || item.status === status) && (priority === "all" || item.priority === priority) &&
        (stage === "all" || item.stage === stage) && (sender === "all" || item.last_message_sender === sender);
    });
  }, [dateFiltered, search, status, priority, stage, sender]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(pageStart, pageStart + pageSize);
  const activeFilters = [status, priority, stage, sender].filter((value) => value !== "all").length + Number(Boolean(from)) + Number(Boolean(to));
  const clearFilters = () => { setSearch(""); setStatus("all"); setPriority("all"); setStage("all"); setSender("all"); setFrom(""); setTo(""); setPage(1); setActiveMetric("all"); };

  function applyMetricFilter(nextStatus: ConversationStatus | "all", metric: MetricFilter = nextStatus) {
    setSearch("");
    setStatus(nextStatus);
    setPriority("all");
    setStage("all");
    setSender("all");
    setPage(1);
    setActiveMetric(metric);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function persistStatus(conversation: Conversation, nextStatus: ConversationStatus) {
    if (conversation.status === nextStatus) return;
    setSavingId(conversation.id);
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: nextStatus }) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Gagal menyimpan status.");
      setConversations((current) => current.map((item) => item.id === conversation.id ? { ...item, status: nextStatus } : item));
      toast.success(`Status ${conversation.contact_name ?? conversation.conversation_id} diperbarui.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Status gagal disimpan."); }
    finally { setSavingId(null); setConfirmation(null); }
  }

  function requestStatus(conversation: Conversation, nextStatus: ConversationStatus) {
    if (nextStatus === "converted" || nextStatus === "closed" || nextStatus === "not_a_lead") setConfirmation({ conversation, status: nextStatus });
    else void persistStatus(conversation, nextStatus);
  }

  return <div className="min-h-screen bg-[#f4f7f7] text-slate-900">
    <header className="border-b border-slate-200 bg-[#0d4744] text-white"><div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-white/12"><MessageCircleMore className="size-5" /></span><div><p className="text-base font-black leading-5">Syarihub</p><p className="text-xs text-teal-100">CS Conversion</p></div></div>
      <form action="/api/auth/logout" method="post"><button className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/20 px-3 text-sm font-semibold text-white/90 hover:bg-white/10"><LogOut className="size-4" /><span className="hidden sm:inline">Keluar</span></button></form>
    </div></header>

    <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <section aria-label="Ringkasan performa" className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        <MetricCard label="Total" value={metrics.total} active={activeMetric === "all"} onClick={() => applyMetricFilter("all")} icon={<UsersRound className="size-5" />} /><MetricCard label="Pending" value={metrics.pending} active={activeMetric === "pending"} onClick={() => applyMetricFilter("pending")} icon={<CircleDashed className="size-5" />} /><MetricCard label="Ditindaklanjuti" value={metrics.actioned} active={activeMetric === "actioned"} onClick={() => applyMetricFilter("actioned")} icon={<CheckCircle2 className="size-5" />} /><MetricCard label="Converted" value={metrics.converted} active={activeMetric === "converted"} onClick={() => applyMetricFilter("converted")} icon={<Sparkles className="size-5" />} /><MetricCard label="Closed" value={metrics.closed} active={activeMetric === "closed"} onClick={() => applyMetricFilter("closed")} icon={<ChevronDown className="size-5" />} /><MetricCard label="Not a Lead" value={metrics.notALead} active={activeMetric === "not_a_lead"} onClick={() => applyMetricFilter("not_a_lead")} icon={<UserX className="size-5" />} /><MetricCard label="Conversion rate" value={`${metrics.rate}%`} note="Klik untuk lihat Converted" tone="green" active={activeMetric === "conversion_rate"} onClick={() => applyMetricFilter("converted", "conversion_rate")} icon={<ArrowUpRight className="size-5" />} />
      </section>

      <section ref={listRef} className="mt-6 scroll-mt-4 rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgb(15_23_42/5%)]">
        <div className="border-b border-slate-200 p-4 sm:p-5"><div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-64 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari nama, nomor HP, atau ID conversation" className="h-10 pl-9" /></div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:flex"><FilterSelect label="Status" value={status} setValue={(value) => { setStatus(value); setActiveMetric(value as MetricFilter); setPage(1); }} options={labels.status} /><FilterSelect label="Prioritas" value={priority} setValue={(value) => { setPriority(value); setPage(1); }} options={labels.priority} /><FilterSelect label="Stage" value={stage} setValue={(value) => { setStage(value); setPage(1); }} options={labels.stage} /><FilterSelect label="Pengirim" value={sender} setValue={(value) => { setSender(value); setPage(1); }} options={labels.sender} /></div>
        </div><div className="mt-3 flex flex-wrap items-end gap-2"><label className="text-xs font-semibold text-slate-500">Dari tanggal<Input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} className="mt-1 h-9 w-auto text-sm" /></label><label className="text-xs font-semibold text-slate-500">Sampai tanggal<Input type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} className="mt-1 h-9 w-auto text-sm" /></label>{(activeFilters > 0 || search) && <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-600"><FilterX className="size-4" />Reset filter</Button>}<p className="ml-auto text-sm font-semibold text-slate-500">{filtered.length} dari {conversations.length} conversation</p></div></div>
        {filtered.length === 0 ? <div className="grid min-h-72 place-items-center p-8 text-center"><div><FilterX className="mx-auto size-8 text-slate-300" /><h2 className="mt-3 font-bold">Tidak ada conversation</h2><p className="mt-1 text-sm text-slate-500">Coba ubah pencarian atau filter yang aktif.</p><Button variant="outline" className="mt-4" onClick={clearFilters}>Reset filter</Button></div></div> : <><div className="hidden overflow-x-auto lg:block"><ConversationTable conversations={paginated} savingId={savingId} onStatus={requestStatus} /></div><div className="divide-y divide-slate-200 lg:hidden">{paginated.map((conversation) => <ConversationCard key={conversation.id} conversation={conversation} savingId={savingId} onStatus={requestStatus} />)}</div><Pagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} start={pageStart + 1} end={Math.min(pageStart + pageSize, filtered.length)} total={filtered.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} /></>}
      </section>
    </main>

    <AlertDialog open={Boolean(confirmation)} onOpenChange={(open) => { if (!open && !savingId) setConfirmation(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Ubah status menjadi {confirmation ? labels.status[confirmation.status] : ""}?</AlertDialogTitle><AlertDialogDescription>{confirmation?.status === "converted" ? "Pastikan pembayaran sudah diterima dan terverifikasi." : confirmation?.status === "not_a_lead" ? "Pastikan conversation ini memang bukan calon user yang relevan." : "Conversation akan dianggap selesai tanpa conversion."} Tindakan ini tetap dapat diubah kembali secara manual.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={Boolean(savingId)}>Batal</AlertDialogCancel><AlertDialogAction disabled={Boolean(savingId)} onClick={(event) => { event.preventDefault(); if (confirmation) void persistStatus(confirmation.conversation, confirmation.status); }}>{savingId ? "Menyimpan…" : "Ya, ubah status"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog><Toaster richColors position="top-right" />
  </div>;
}

function Pagination({ currentPage, totalPages, pageSize, start, end, total, onPageChange, onPageSizeChange }: { currentPage: number; totalPages: number; pageSize: number; start: number; end: number; total: number; onPageChange: (page: number) => void; onPageSizeChange: (size: number) => void }) {
  return <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
    <p className="text-sm text-slate-500">Menampilkan <span className="font-semibold text-slate-700">{start}–{end}</span> dari <span className="font-semibold text-slate-700">{total}</span></p>
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-2 text-sm text-slate-500">Per halaman<Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}><SelectTrigger aria-label="Jumlah conversation per halaman" className="h-9 w-[72px] bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem><SelectItem value="50">50</SelectItem></SelectContent></Select></label>
      <span className="min-w-[96px] text-center text-sm font-semibold text-slate-600">Halaman {currentPage} dari {totalPages}</span>
      <Button type="button" variant="outline" size="sm" aria-label="Halaman sebelumnya" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}><ChevronLeft className="size-4" /><span className="hidden sm:inline">Sebelumnya</span></Button>
      <Button type="button" variant="outline" size="sm" aria-label="Halaman berikutnya" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}><span className="hidden sm:inline">Berikutnya</span><ChevronRight className="size-4" /></Button>
    </div>
  </div>;
}

function FilterSelect({ label, value, setValue, options }: { label: string; value: string; setValue: (value: string) => void; options: Record<string, string> }) {
  return <Select value={value} onValueChange={setValue}><SelectTrigger className="h-10 w-full min-w-32"><SelectValue placeholder={label} /></SelectTrigger><SelectContent><SelectItem value="all">Semua {label.toLowerCase()}</SelectItem>{Object.entries(options).map(([key, text]) => <SelectItem key={key} value={key}>{text}</SelectItem>)}</SelectContent></Select>;
}

function ConversationTable({ conversations, savingId, onStatus }: { conversations: Conversation[]; savingId: string | null; onStatus: (c: Conversation, s: ConversationStatus) => void }) {
  return <table className="w-full min-w-[1320px] border-collapse text-left"><thead><tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-bold">Calon user</th><th className="px-4 py-3 font-bold">Aktivitas terakhir</th><th className="px-4 py-3 font-bold">Ringkasan AI</th><th className="px-4 py-3 font-bold">Stage & blocker</th><th className="px-4 py-3 font-bold">Prioritas</th><th className="px-4 py-3 font-bold">Tindakan berikutnya</th><th className="px-4 py-3 font-bold">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{conversations.map((c) => <tr key={c.id} className="align-top transition hover:bg-slate-50/70"><td className="w-[175px] px-5 py-4"><p className="font-bold text-slate-900">{c.contact_name ?? "Tanpa nama"}</p><p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-500"><Phone className="size-3.5" />{c.contact_phone ?? "Nomor belum tersedia"}</p></td><td className="w-[190px] px-4 py-4"><p className="text-xs text-slate-500">{dateLabel(c.last_message_at)}</p><Badge className={`mt-2 ${senderClass[c.last_message_sender]}`}>Dari: {labels.sender[c.last_message_sender]}</Badge>{c.conversation_url ? <Button asChild variant="outline" size="sm" className="mt-3 w-full"><a href={c.conversation_url} target="_blank" rel="noopener noreferrer">Buka chat <ArrowUpRight className="size-4" /></a></Button> : <p className="mt-3 text-xs text-slate-400">URL belum tersedia</p>}</td><td className="max-w-[280px] px-4 py-4"><p className="text-sm leading-6 text-slate-700">{c.summary}</p></td><td className="w-[170px] px-4 py-4"><Badge className="bg-teal-50 text-teal-700">{labels.stage[c.stage]}</Badge><p className="mt-2 text-xs text-slate-500">Hambatan: <span className="font-semibold text-slate-700">{labels.blocker[c.blocker]}</span></p></td><td className="w-[105px] px-4 py-4"><Badge className={priorityClass[c.priority]}>{labels.priority[c.priority]}</Badge></td><td className="max-w-[260px] px-4 py-4"><p className="text-sm font-medium leading-6 text-slate-700">{c.next_action}</p></td><td className="w-[175px] px-4 py-4"><StatusSelect conversation={c} onChange={(status) => onStatus(c, status)} disabled={savingId === c.id} /></td></tr>)}</tbody></table>;
}

function ConversationCard({ conversation: c, savingId, onStatus }: { conversation: Conversation; savingId: string | null; onStatus: (c: Conversation, s: ConversationStatus) => void }) {
  return <article className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{c.contact_name ?? "Tanpa nama"}</p><p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500"><Phone className="size-3.5" />{c.contact_phone ?? "Nomor belum tersedia"}</p></div><Badge className={priorityClass[c.priority]}>{labels.priority[c.priority]}</Badge></div><p className="mt-3 text-sm leading-6 text-slate-700">{c.summary}</p><div className="mt-3 flex flex-wrap gap-2"><Badge className="bg-teal-50 text-teal-700">{labels.stage[c.stage]}</Badge><Badge className="bg-slate-100 text-slate-600">{labels.blocker[c.blocker]}</Badge><Badge className={statusClass[c.status]}>{labels.status[c.status]}</Badge></div><div className="mt-4 rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Tindakan berikutnya</p><p className="mt-1 text-sm font-medium leading-6 text-slate-700">{c.next_action}</p></div><div className="mt-3 rounded-xl border border-slate-200 p-3"><p className="text-xs text-slate-500">{dateLabel(c.last_message_at)}</p><div className="mt-2 flex items-center justify-between gap-3"><Badge className={senderClass[c.last_message_sender]}>Dari: {labels.sender[c.last_message_sender]}</Badge>{c.conversation_url ? <Button asChild variant="outline" size="sm"><a href={c.conversation_url} target="_blank" rel="noopener noreferrer">Buka chat <ArrowUpRight className="size-4" /></a></Button> : <span className="text-xs text-slate-400">URL belum tersedia</span>}</div></div><div className="mt-4"><StatusSelect conversation={c} onChange={(status) => onStatus(c, status)} disabled={savingId === c.id} /></div></article>;
}
