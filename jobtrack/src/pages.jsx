import { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard, Briefcase, ListChecks, Send, Contact as ContactIcon,
  CalendarCheck, FileText, Building2, Bell, BarChart3, MessageSquareText,
  Search, Plus, X, Trash2, Pencil, ExternalLink, Copy, Clock, CheckCircle2,
  AlertTriangle, ChevronDown, Menu, ArrowRight, Sparkles
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

/* ============================== CONSTANTS ============================== */

const JOB_SOURCES = ["LinkedIn", "Naukri", "Indeed", "Company Website", "Referral", "Recruiter", "Email", "Other"];
const WORK_TYPES = ["Remote", "Hybrid", "On-site"];
const APP_STATUSES = ["Saved", "Applied", "Recruiter Contacted", "Screening", "Technical Round", "Manager Round", "HR Round", "Offer", "Rejected", "Withdrawn", "No Response"];
const KANBAN_STATUSES = ["Saved", "Applied", "Recruiter Contacted", "Screening", "Technical Round", "Manager Round", "HR Round", "Offer"];
const OUTREACH_TYPES = ["LinkedIn", "Cold Email", "Referral Request", "Recruiter Outreach", "Employee Outreach", "Other"];
const OUTREACH_STATUSES = ["Draft", "Sent", "Follow-up Due", "Replied", "Positive", "Negative", "No Response"];
const CONTACT_TYPES = ["Recruiter", "HR", "Hiring Manager", "Employee", "Referral", "Agency", "Other"];
const INTERVIEW_ROUNDS = ["HR Screening", "Recruiter Screening", "Technical", "Coding", "System Design", "Managerial", "HR", "Final"];
const INTERVIEW_RESULTS = ["Pending", "Passed", "Failed", "Cancelled", "Rescheduled"];
const TEMPLATE_CATEGORIES = [
  "LinkedIn - Connection Request", "LinkedIn - Recruiter Message", "LinkedIn - Hiring Manager Message",
  "LinkedIn - Employee Approach", "LinkedIn - Referral Request", "LinkedIn - Follow-up", "LinkedIn - Thank-you",
  "Email - Cold Email", "Email - Recruiter Email", "Email - Referral Request", "Email - Follow-up",
  "Email - Application Follow-up", "Email - Thank-you"
];

const STATUS_COLOR = {
  Saved: "#8A93A6", Applied: "#3B6FD1", "Recruiter Contacted": "#7E57C2", Screening: "#C98A2E",
  "Technical Round": "#2F6F5E", "Manager Round": "#1F7A67", "HR Round": "#4C9C86", Offer: "#1E8E5A",
  Rejected: "#C4453A", Withdrawn: "#9AA1AC", "No Response": "#B08D57",
  Draft: "#9AA1AC", Sent: "#3B6FD1", "Follow-up Due": "#C98A2E", Replied: "#7E57C2",
  Positive: "#1E8E5A", Negative: "#C4453A",
  Pending: "#C98A2E", Passed: "#1E8E5A", Failed: "#C4453A", Cancelled: "#9AA1AC", Rescheduled: "#3B6FD1"
};

export const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "jobs", label: "Jobs", icon: Briefcase },
  { key: "applications", label: "Applications", icon: ListChecks },
  { key: "outreach", label: "Outreach", icon: Send },
  { key: "contacts", label: "Contacts", icon: ContactIcon },
  { key: "interviews", label: "Interviews", icon: CalendarCheck },
  { key: "resumes", label: "Resumes", icon: FileText },
  { key: "companies", label: "Companies", icon: Building2 },
  { key: "followups", label: "Follow-ups", icon: Bell },
  { key: "templates", label: "Templates", icon: MessageSquareText },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
];

const STORAGE_KEY = "jobtrack:data";
const emptyData = { jobs: [], applications: [], outreach: [], contacts: [], interviews: [], resumes: [], companies: [], templates: [] };

function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4); }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function fmtDate(d) { if (!d) return "—"; const dt = new Date(d + (d.length === 10 ? "T00:00:00" : "")); if (isNaN(dt)) return d; return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
function daysBetween(a, b) { const A = new Date(a), B = new Date(b); return Math.round((B - A) / 86400000); }

/* ============================== STYLE ============================== */

export function Style() {
  return (
    <style>{`
      :root{
        --bg:#F6F7F5; --surface:#FFFFFF; --surface-alt:#EFF2F0; --border:#DEE3E0;
        --ink:#161B18; --ink-soft:#5C6862; --accent:#2F6F5E; --accent-bright:#57C2A0;
        --accent-soft:#E3EFEA; --font: ui-sans-serif, -apple-system, "Segoe UI", Inter, Roboto, sans-serif;
        --sidebar:#12211D;
      }
      * { box-sizing: border-box; }
      input,select,textarea{ outline:none; background:var(--surface); font-family:var(--font); }
      input:focus,select:focus,textarea:focus{ border-color:var(--accent) !important; box-shadow:0 0 0 3px var(--accent-soft); }
      ::-webkit-scrollbar{ width:8px; height:8px; }
      ::-webkit-scrollbar-thumb{ background:#C7CEC9; border-radius:8px; }
      .kanban-col.drag-over{ background:var(--accent-soft) !important; }
      button{ cursor:pointer; font-family:var(--font); }
      table{ border-collapse:collapse; }
    `}</style>
  );
}

/* ============================== SHARED UI ============================== */

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="rounded-lg px-4 py-3.5 flex items-center gap-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0" style={{ background: accent ? accent + "1A" : "var(--accent-soft)" }}>
        <Icon size={16} color={accent || "var(--accent)"} />
      </div>
      <div className="min-w-0">
        <div className="text-xl font-semibold leading-tight" style={{ color: "var(--ink)" }}>{value}</div>
        <div className="text-[12px] truncate" style={{ color: "var(--ink-soft)" }}>{label}</div>
      </div>
    </div>
  );
}

function Badge({ label, color }) {
  const c = color || "#8A93A6";
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap" style={{ background: c + "1A", color: c }}>{label}</span>;
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
      <div>
        <h2 className="text-lg font-semibold" style={{ color: "var(--ink)" }}>{title}</h2>
        {subtitle && <p className="text-[13px] mt-0.5" style={{ color: "var(--ink-soft)" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function PrimaryButton({ children, onClick, icon: Icon }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium text-white"
      style={{ background: "var(--accent)" }}>
      {Icon && <Icon size={15} />} {children}
    </button>
  );
}

function EmptyState({ text, cta }) {
  return (
    <div className="rounded-lg border border-dashed py-12 flex flex-col items-center justify-center text-center px-4" style={{ borderColor: "var(--border)" }}>
      <p className="text-sm" style={{ color: "var(--ink-soft)" }}>{text}</p>
      {cta}
    </div>
  );
}

function TextInput(props) {
  return <input {...props} className={"w-full px-3 py-2 rounded-md border text-sm " + (props.className || "")} style={{ borderColor: "var(--border)", ...props.style }} />;
}

function Select({ value, onChange, options, placeholder, className, style }) {
  return (
    <select value={value || ""} onChange={e => onChange(e.target.value)} className={"w-full px-3 py-2 rounded-md border text-sm " + (className || "")} style={{ borderColor: "var(--border)", ...style }}>
      <option value="">{placeholder || "Select…"}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

/* Generic modal form driven by a field schema */
function FormModal({ title, fields, initial, onCancel, onSave, wide }) {
  const [vals, setVals] = useState(() => {
    const v = {};
    fields.forEach(f => { v[f.key] = (initial && initial[f.key] !== undefined) ? initial[f.key] : (f.default !== undefined ? f.default : ""); });
    return v;
  });
  function set(k, val) { setVals(v => ({ ...v, [k]: val })); }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(12,18,16,0.5)" }} onClick={onCancel}>
      <div className={"w-full rounded-lg shadow-xl overflow-hidden flex flex-col " + (wide ? "max-w-2xl" : "max-w-lg")} style={{ background: "var(--surface)", maxHeight: "88vh" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
          <h3 className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>{title}</h3>
          <button onClick={onCancel} className="p-1 rounded hover:bg-black/5"><X size={17} /></button>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-3.5 overflow-y-auto">
          {fields.map(f => (
            <div key={f.key} className={(f.span === 2 || f.type === "textarea") ? "col-span-2" : "col-span-2 sm:col-span-1"}>
              <label className="block text-[12px] mb-1" style={{ color: "var(--ink-soft)" }}>{f.label}{f.required && " *"}</label>
              {f.type === "textarea" ? (
                <textarea rows={f.rows || 3} value={vals[f.key]} onChange={e => set(f.key, e.target.value)} className="w-full px-3 py-2 rounded-md border text-sm" style={{ borderColor: "var(--border)" }} placeholder={f.placeholder} />
              ) : f.type === "select" ? (
                <Select value={vals[f.key]} onChange={val => set(f.key, val)} options={f.options} placeholder={f.placeholder} />
              ) : (
                <TextInput type={f.type || "text"} value={vals[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t shrink-0" style={{ borderColor: "var(--border)" }}>
          <button onClick={onCancel} className="px-3.5 py-2 rounded-md text-sm" style={{ color: "var(--ink-soft)" }}>Cancel</button>
          <button onClick={() => onSave(vals)} className="px-4 py-2 rounded-md text-sm text-white font-medium" style={{ background: "var(--accent)" }}>Save</button>
        </div>
      </div>
    </div>
  );
}

/* Generic table */
function DataTable({ columns, rows, onEdit, onDelete, onRowClick, emptyText }) {
  if (!rows.length) return <EmptyState text={emptyText || "Nothing here yet."} />;
  return (
    <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr style={{ background: "var(--surface-alt)" }}>
            {columns.map(c => <th key={c.key} className="text-left px-4 py-2.5 font-medium text-[12px]" style={{ color: "var(--ink-soft)" }}>{c.label}</th>)}
            {(onEdit || onDelete) && <th className="px-4 py-2.5" />}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-t" style={{ borderColor: "var(--border)", background: "var(--surface)", cursor: onRowClick ? "pointer" : "default" }}
              onClick={() => onRowClick && onRowClick(r)}>
              {columns.map(c => <td key={c.key} className="px-4 py-2.5 align-top" style={{ color: "var(--ink)" }}>{c.render ? c.render(r) : (r[c.key] ?? "—")}</td>)}
              {(onEdit || onDelete) && (
                <td className="px-4 py-2.5 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                  {onEdit && <button onClick={() => onEdit(r)} className="p-1.5 rounded hover:bg-black/5 mr-1"><Pencil size={14} color="var(--ink-soft)" /></button>}
                  {onDelete && <button onClick={() => { if (confirm("Delete this item? This can't be undone.")) onDelete(r.id); }} className="p-1.5 rounded hover:bg-black/5"><Trash2 size={14} color="#C4453A" /></button>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FilterBar({ filters, values, onChange, search, onSearch }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4 items-center">
      {onSearch && (
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5" color="var(--ink-soft)" />
          <input value={search} onChange={e => onSearch(e.target.value)} placeholder="Search…" className="pl-8 pr-3 py-2 rounded-md border text-sm w-48" style={{ borderColor: "var(--border)" }} />
        </div>
      )}
      {filters.map(f => (
        <select key={f.key} value={values[f.key] || ""} onChange={e => onChange(f.key, e.target.value)} className="px-2.5 py-2 rounded-md border text-sm" style={{ borderColor: "var(--border)", color: values[f.key] ? "var(--ink)" : "var(--ink-soft)" }}>
          <option value="">{f.label}: All</option>
          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ))}
    </div>
  );
}

/* ============================== TOP BAR ============================== */

export function TopBar({ view, setSidebarOpen, globalQuery, setGlobalQuery, data, setView }) {
  const label = NAV_ITEMS.find(n => n.key === view)?.label || "Search";
  return (
    <div className="flex items-center gap-3 px-4 md:px-7 py-3.5 border-b" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <button className="md:hidden p-1.5 rounded hover:bg-black/5" onClick={() => setSidebarOpen(true)}><Menu size={19} /></button>
      <div className="text-[15px] font-semibold hidden md:block" style={{ color: "var(--ink)" }}>{label}</div>
      <div className="relative flex-1 max-w-md ml-auto">
        <Search size={15} className="absolute left-3 top-2.5" color="var(--ink-soft)" />
        <input value={globalQuery} onChange={e => setGlobalQuery(e.target.value)} placeholder="Search jobs, companies, contacts, notes…"
          className="w-full pl-9 pr-3 py-2 rounded-md border text-sm" style={{ borderColor: "var(--border)", background: "var(--surface-alt)" }} />
      </div>
    </div>
  );
}

export function SearchResults({ query, data, setView, clear }) {
  const q = query.toLowerCase();
  const match = (s) => (s || "").toString().toLowerCase().includes(q);
  const jobs = data.jobs.filter(j => match(j.title) || match(j.company) || match(j.location) || match(j.notes) || match(j.url));
  const applications = data.applications.filter(a => match(a.notes) || match(companyOf(data, a)) || match(titleOf(data, a)));
  const contacts = data.contacts.filter(c => match(c.name) || match(c.company) || match(c.notes));
  const outreach = data.outreach.filter(o => match(o.personName) || match(o.company) || match(o.notes));
  const companies = uniqCompanyNames(data).filter(c => match(c));
  const total = jobs.length + applications.length + contacts.length + outreach.length + companies.length;
  return (
    <div>
      <SectionHeader title={`Search results for "${query}"`} subtitle={`${total} matches`} action={<button onClick={clear} className="text-sm" style={{ color: "var(--accent)" }}>Clear</button>} />
      {total === 0 && <EmptyState text="No matches. Try a different term." />}
      {jobs.length > 0 && <ResultGroup title="Jobs" onSeeAll={() => { setView("jobs"); clear(); }} items={jobs.map(j => ({ id: j.id, primary: j.title, secondary: j.company }))} />}
      {applications.length > 0 && <ResultGroup title="Applications" onSeeAll={() => { setView("applications"); clear(); }} items={applications.map(a => ({ id: a.id, primary: titleOf(data, a), secondary: companyOf(data, a) }))} />}
      {contacts.length > 0 && <ResultGroup title="Contacts" onSeeAll={() => { setView("contacts"); clear(); }} items={contacts.map(c => ({ id: c.id, primary: c.name, secondary: c.company }))} />}
      {outreach.length > 0 && <ResultGroup title="Outreach" onSeeAll={() => { setView("outreach"); clear(); }} items={outreach.map(o => ({ id: o.id, primary: o.personName, secondary: o.company }))} />}
      {companies.length > 0 && <ResultGroup title="Companies" onSeeAll={() => { setView("companies"); clear(); }} items={companies.map(c => ({ id: c, primary: c }))} />}
    </div>
  );
}
function ResultGroup({ title, items, onSeeAll }) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[12px] font-medium" style={{ color: "var(--ink-soft)" }}>{title}</div>
        <button onClick={onSeeAll} className="text-[12px]" style={{ color: "var(--accent)" }}>Open section →</button>
      </div>
      <div className="rounded-lg border divide-y" style={{ borderColor: "var(--border)" }}>
        {items.slice(0, 6).map(it => (
          <div key={it.id} className="px-4 py-2.5 text-sm" style={{ background: "var(--surface)" }}>
            <div style={{ color: "var(--ink)" }}>{it.primary || "Untitled"}</div>
            {it.secondary && <div className="text-[12px]" style={{ color: "var(--ink-soft)" }}>{it.secondary}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================== LOOKUP HELPERS ============================== */

function jobOf(data, application) { return data.jobs.find(j => j.id === application.jobId); }
function titleOf(data, application) { return jobOf(data, application)?.title || application.title || "Untitled role"; }
function companyOf(data, application) { return jobOf(data, application)?.company || application.company || "—"; }
function uniqCompanyNames(data) {
  const set = new Set();
  data.jobs.forEach(j => j.company && set.add(j.company));
  data.companies.forEach(c => c.name && set.add(c.name));
  return Array.from(set).sort();
}

/* ============================== DASHBOARD ============================== */

export function Dashboard({ data, setView }) {
  const { jobs, applications, outreach, interviews } = data;
  const now = new Date();
  const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
  const monthAgo = new Date(now); monthAgo.setDate(now.getDate() - 30);

  const appsThisWeek = applications.filter(a => a.appliedDate && new Date(a.appliedDate) >= weekAgo).length;
  const appsThisMonth = applications.filter(a => a.appliedDate && new Date(a.appliedDate) >= monthAgo).length;
  const recruiterContacts = data.contacts.filter(c => c.type === "Recruiter").length;
  const linkedinApproaches = outreach.filter(o => o.type === "LinkedIn").length;
  const coldEmails = outreach.filter(o => o.type === "Cold Email").length;
  const offers = applications.filter(a => a.status === "Offer").length;
  const rejections = applications.filter(a => a.status === "Rejected").length;
  const followUps = getFollowUps(data);
  const pending = followUps.filter(f => f.date <= todayISO()).length;

  const pipelineOrder = KANBAN_STATUSES;
  const pipelineCounts = pipelineOrder.map(s => applications.filter(a => a.status === s).length);

  const bySource = useMemo(() => {
    const m = {};
    applications.forEach(a => { const j = jobOf(data, a); const s = j?.source || "Other"; m[s] = (m[s] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [applications, jobs]);

  const byStatus = APP_STATUSES.map(s => ({ name: s, value: applications.filter(a => a.status === s).length })).filter(x => x.value > 0);

  const overTime = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ key: d.getFullYear() + "-" + d.getMonth(), name: d.toLocaleDateString("en-US", { month: "short" }), value: 0 }); }
    applications.forEach(a => { if (!a.appliedDate) return; const d = new Date(a.appliedDate); const key = d.getFullYear() + "-" + d.getMonth(); const m = months.find(x => x.key === key); if (m) m.value++; });
    return months;
  }, [applications]);

  const upcomingInterviews = interviews.filter(iv => iv.date && iv.date >= todayISO()).sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || ""))).slice(0, 4);
  const todaysFollowUps = followUps.filter(f => f.date === todayISO());
  const overdueFollowUps = followUps.filter(f => f.date < todayISO());
  const recruitersToContact = data.contacts.filter(c => c.type === "Recruiter" && (!c.lastContacted)).slice(0, 4);
  const pendingLinkedIn = outreach.filter(o => o.type === "LinkedIn" && ["Draft", "Sent"].includes(o.status)).slice(0, 4);

  const COLORS = ["#2F6F5E", "#3B6FD1", "#C98A2E", "#7E57C2", "#4C9C86", "#C4453A", "#8A93A6", "#B08D57"];

  return (
    <div>
      <SectionHeader title="Dashboard" subtitle="An overview of your entire job search." />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard label="Jobs saved" value={jobs.length} icon={Briefcase} />
        <StatCard label="Applications" value={applications.length} icon={ListChecks} />
        <StatCard label="This week" value={appsThisWeek} icon={CalendarCheck} />
        <StatCard label="This month" value={appsThisMonth} icon={CalendarCheck} />
        <StatCard label="Recruiter contacts" value={recruiterContacts} icon={ContactIcon} />
        <StatCard label="LinkedIn approaches" value={linkedinApproaches} icon={Send} />
        <StatCard label="Cold emails sent" value={coldEmails} icon={MessageSquareText} />
        <StatCard label="Interviews" value={interviews.length} icon={CalendarCheck} accent="#3B6FD1" />
        <StatCard label="Offers" value={offers} icon={Sparkles} accent="#1E8E5A" />
        <StatCard label="Rejections" value={rejections} icon={X} accent="#C4453A" />
        <StatCard label="Pending follow-ups" value={pending} icon={Bell} accent="#C98A2E" />
      </div>

      {/* Pipeline */}
      <div className="rounded-lg border p-4 mb-6" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="text-[13px] font-medium mb-3" style={{ color: "var(--ink-soft)" }}>Application pipeline</div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {pipelineOrder.map((s, i) => (
            <div key={s} className="flex items-center shrink-0">
              <div className="rounded-md px-3 py-2 min-w-[104px] text-center" style={{ background: STATUS_COLOR[s] + "14" }}>
                <div className="text-lg font-semibold" style={{ color: STATUS_COLOR[s] }}>{pipelineCounts[i]}</div>
                <div className="text-[11px] leading-tight" style={{ color: "var(--ink-soft)" }}>{s}</div>
              </div>
              {i < pipelineOrder.length - 1 && <ArrowRight size={14} className="mx-1.5 shrink-0" color="var(--border)" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <ChartCard title="Applications over time">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={overTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Applications by source">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bySource}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={45} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Applications by status">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={72} label={{ fontSize: 10 }}>
                {byStatus.map((e, i) => <Cell key={i} fill={STATUS_COLOR[e.name] || COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Today's actions */}
      <div className="rounded-lg border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[13px] font-medium" style={{ color: "var(--ink-soft)" }}>Today's actions</div>
          <button onClick={() => setView("followups")} className="text-[12px]" style={{ color: "var(--accent)" }}>View all follow-ups →</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionList title="Follow-ups due today" empty="Nothing due today." items={todaysFollowUps.map(f => f.label)} icon={Bell} color="#C98A2E" />
          <ActionList title="Overdue follow-ups" empty="You're all caught up." items={overdueFollowUps.map(f => f.label)} icon={AlertTriangle} color="#C4453A" />
          <ActionList title="Interviews scheduled" empty="No upcoming interviews." items={upcomingInterviews.map(iv => `${iv.company || ""} — ${iv.round || "Interview"} (${fmtDate(iv.date)})`)} icon={CalendarCheck} color="#3B6FD1" />
          <ActionList title="LinkedIn approaches pending" empty="Nothing pending." items={pendingLinkedIn.map(o => o.personName + (o.company ? " @ " + o.company : ""))} icon={Send} color="#7E57C2" />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="text-[13px] font-medium mb-2" style={{ color: "var(--ink-soft)" }}>{title}</div>
      {children}
    </div>
  );
}
function ActionList({ title, items, empty, icon: Icon, color }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={13} color={color} />
        <div className="text-[12px] font-medium" style={{ color: "var(--ink)" }}>{title}</div>
      </div>
      {items.length === 0 ? (
        <div className="text-[12px]" style={{ color: "var(--ink-soft)" }}>{empty}</div>
      ) : (
        <ul className="space-y-1">
          {items.slice(0, 4).map((it, i) => <li key={i} className="text-[12px] truncate" style={{ color: "var(--ink-soft)" }}>• {it}</li>)}
        </ul>
      )}
    </div>
  );
}

function getFollowUps(data) {
  const items = [];
  data.applications.forEach(a => {
    if (a.nextFollowUp) items.push({ id: "app-" + a.id, date: a.nextFollowUp, type: "Application", label: `${titleOf(data, a)} @ ${companyOf(data, a)}`, refId: a.id, entity: "applications" });
  });
  data.outreach.forEach(o => {
    if (o.followUpDate) items.push({ id: "out-" + o.id, date: o.followUpDate, type: o.type || "Outreach", label: `${o.personName || "Contact"}${o.company ? " @ " + o.company : ""}`, refId: o.id, entity: "outreach" });
  });
  data.contacts.forEach(c => {
    if (c.nextFollowUp) items.push({ id: "con-" + c.id, date: c.nextFollowUp, type: "Contact", label: `${c.name}${c.company ? " @ " + c.company : ""}`, refId: c.id, entity: "contacts" });
  });
  return items.sort((a, b) => a.date.localeCompare(b.date));
}

/* ============================== JOBS ============================== */

const JOB_FIELDS = [
  { key: "title", label: "Job title", required: true },
  { key: "company", label: "Company", required: true },
  { key: "location", label: "Location" },
  { key: "workType", label: "Work type", type: "select", options: WORK_TYPES },
  { key: "experience", label: "Experience required", placeholder: "e.g. 3-5 years" },
  { key: "salary", label: "Salary" },
  { key: "source", label: "Source", type: "select", options: JOB_SOURCES },
  { key: "url", label: "Job URL", placeholder: "https://" },
  { key: "datePosted", label: "Date posted", type: "date" },
  { key: "deadline", label: "Application deadline", type: "date" },
  { key: "requiredSkills", label: "Required skills", placeholder: "Comma-separated", span: 2 },
  { key: "preferredSkills", label: "Preferred skills", placeholder: "Comma-separated", span: 2 },
  { key: "description", label: "Job description", type: "textarea", span: 2, rows: 4 },
  { key: "notes", label: "Notes", type: "textarea", span: 2 },
];

export function JobsPage({ data, addItem, updateItem, deleteItem, notify, setView }) {
  const [modal, setModal] = useState(null); // {mode:'add'|'edit', item}
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});

  const rows = data.jobs.filter(j => {
    if (search && !((j.title + j.company + j.location + (j.notes || "")).toLowerCase().includes(search.toLowerCase()))) return false;
    if (filters.source && j.source !== filters.source) return false;
    if (filters.workType && j.workType !== filters.workType) return false;
    return true;
  }).sort((a, b) => (b.dateAdded || b.createdAt || "").localeCompare(a.dateAdded || a.createdAt || ""));

  function hasApplication(jobId) { return data.applications.some(a => a.jobId === jobId); }

  function markApplied(job) {
    addItem("applications", { jobId: job.id, status: "Applied", appliedDate: todayISO(), notes: "", timeline: [{ id: uid(), date: todayISO(), note: "Applied" }] });
    notify(`Marked "${job.title}" as applied`);
    setView("applications");
  }

  return (
    <div>
      <SectionHeader title="Jobs" subtitle="Every opportunity you've found, in one place."
        action={<PrimaryButton icon={Plus} onClick={() => setModal({ mode: "add" })}>Add job</PrimaryButton>} />
      <FilterBar
        search={search} onSearch={setSearch}
        filters={[{ key: "source", label: "Source", options: JOB_SOURCES }, { key: "workType", label: "Work type", options: WORK_TYPES }]}
        values={filters} onChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))} />

      <DataTable
        emptyText="No jobs saved yet. Add your first opportunity to get started."
        columns={[
          { key: "title", label: "Role", render: r => <div><div className="font-medium">{r.title}</div><div className="text-[12px]" style={{ color: "var(--ink-soft)" }}>{r.company}</div></div> },
          { key: "location", label: "Location", render: r => <>{r.location || "—"}{r.workType ? <span className="text-[12px]" style={{ color: "var(--ink-soft)" }}> · {r.workType}</span> : ""}</> },
          { key: "source", label: "Source", render: r => r.source ? <Badge label={r.source} color="#3B6FD1" /> : "—" },
          { key: "dateAdded", label: "Added", render: r => fmtDate(r.dateAdded || r.createdAt?.slice(0, 10)) },
          {
            key: "actions2", label: "", render: r => (
              <div className="flex gap-2">
                {r.url && <a href={r.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="p-1.5 rounded hover:bg-black/5 inline-flex"><ExternalLink size={14} color="var(--ink-soft)" /></a>}
                {!hasApplication(r.id) ? (
                  <button onClick={e => { e.stopPropagation(); markApplied(r); }} className="text-[12px] px-2 py-1 rounded-md text-white" style={{ background: "var(--accent)" }}>Mark applied</button>
                ) : <Badge label="Applied" color="#1E8E5A" />}
              </div>
            )
          },
        ]}
        rows={rows}
        onEdit={r => setModal({ mode: "edit", item: r })}
        onDelete={id => deleteItem("jobs", id)}
        onRowClick={r => setModal({ mode: "edit", item: r })}
      />

      {modal && (
        <FormModal
          wide
          title={modal.mode === "add" ? "Add a job" : "Edit job"}
          fields={JOB_FIELDS}
          initial={modal.item}
          onCancel={() => setModal(null)}
          onSave={(vals) => {
            if (modal.mode === "add") addItem("jobs", { ...vals, dateAdded: todayISO() });
            else updateItem("jobs", modal.item.id, vals);
            notify(modal.mode === "add" ? "Job added" : "Job updated");
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

/* ============================== APPLICATIONS ============================== */

export function ApplicationsPage({ data, addItem, updateItem, deleteItem, notify }) {
  const [layout, setLayout] = useState("kanban");
  const [detail, setDetail] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState("");

  const rows = data.applications.filter(a => {
    const t = (titleOf(data, a) + " " + companyOf(data, a) + " " + (a.notes || "")).toLowerCase();
    if (search && !t.includes(search.toLowerCase())) return false;
    if (filters.status && a.status !== filters.status) return false;
    return true;
  }).sort((a, b) => (b.appliedDate || "").localeCompare(a.appliedDate || ""));

  function makeDropHandler(status) {
    return (e) => {
      e.preventDefault();
      setDragOverCol(null);
      const id = e.dataTransfer.getData("text/plain");
      if (!id) return;
      const app = data.applications.find(a => a.id === id);
      if (!app || app.status === status) return;
      const timeline = [...(app.timeline || []), { id: uid(), date: todayISO(), note: `Moved to ${status}` }];
      updateItem("applications", id, { status, timeline });
      notify(`Moved to ${status}`);
    };
  }

  return (
    <div>
      <SectionHeader title="Applications" subtitle="Track every application from saved to offer."
        action={
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <button onClick={() => setLayout("kanban")} className="px-3 py-1.5 text-sm" style={{ background: layout === "kanban" ? "var(--accent-soft)" : "var(--surface)", color: layout === "kanban" ? "var(--accent)" : "var(--ink-soft)" }}>Kanban</button>
              <button onClick={() => setLayout("list")} className="px-3 py-1.5 text-sm" style={{ background: layout === "list" ? "var(--accent-soft)" : "var(--surface)", color: layout === "list" ? "var(--accent)" : "var(--ink-soft)" }}>List</button>
            </div>
          </div>
        } />

      {data.applications.length === 0 ? (
        <EmptyState text="No applications yet. Mark a job as applied from the Jobs page to start tracking." />
      ) : layout === "kanban" ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {KANBAN_STATUSES.concat(["Rejected", "Withdrawn", "No Response"]).map(status => {
            const items = data.applications.filter(a => a.status === status);
            return (
              <div key={status}
                className={"kanban-col rounded-lg shrink-0 w-64 flex flex-col " + (dragOverCol === status ? "drag-over" : "")}
                style={{ background: "var(--surface-alt)", border: "1px solid var(--border)" }}
                onDragOver={e => { e.preventDefault(); setDragOverCol(status); }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={makeDropHandler(status)}>
                <div className="px-3 py-2.5 flex items-center justify-between border-b" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLOR[status] }} />
                    <span className="text-[12px] font-medium" style={{ color: "var(--ink)" }}>{status}</span>
                  </div>
                  <span className="text-[11px]" style={{ color: "var(--ink-soft)" }}>{items.length}</span>
                </div>
                <div className="p-2 flex flex-col gap-2 min-h-[80px]">
                  {items.map(a => (
                    <div key={a.id} draggable onDragStart={e => e.dataTransfer.setData("text/plain", a.id)}
                      onClick={() => setDetail(a)}
                      className="rounded-md px-3 py-2.5 cursor-pointer" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                      <div className="text-[13px] font-medium truncate" style={{ color: "var(--ink)" }}>{titleOf(data, a)}</div>
                      <div className="text-[12px] truncate" style={{ color: "var(--ink-soft)" }}>{companyOf(data, a)}</div>
                      {a.nextFollowUp && <div className="text-[11px] mt-1.5 inline-flex items-center gap-1" style={{ color: a.nextFollowUp < todayISO() ? "#C4453A" : "var(--ink-soft)" }}><Clock size={11} /> {fmtDate(a.nextFollowUp)}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <FilterBar search={search} onSearch={setSearch} filters={[{ key: "status", label: "Status", options: APP_STATUSES }]} values={filters} onChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))} />
          <DataTable
            columns={[
              { key: "title", label: "Role", render: r => <div><div className="font-medium">{titleOf(data, r)}</div><div className="text-[12px]" style={{ color: "var(--ink-soft)" }}>{companyOf(data, r)}</div></div> },
              { key: "status", label: "Status", render: r => <Badge label={r.status} color={STATUS_COLOR[r.status]} /> },
              { key: "appliedDate", label: "Applied", render: r => fmtDate(r.appliedDate) },
              { key: "nextFollowUp", label: "Next follow-up", render: r => r.nextFollowUp ? <span style={{ color: r.nextFollowUp < todayISO() ? "#C4453A" : "var(--ink)" }}>{fmtDate(r.nextFollowUp)}</span> : "—" },
              { key: "resumeId", label: "Resume", render: r => data.resumes.find(rs => rs.id === r.resumeId)?.name || "—" },
            ]}
            rows={rows}
            onRowClick={a => setDetail(a)}
            onDelete={id => deleteItem("applications", id)}
          />
        </>
      )}

      {detail && (
        <ApplicationDetail data={data} application={detail} updateItem={updateItem} onClose={() => setDetail(null)} notify={notify} />
      )}
    </div>
  );
}

function ApplicationDetail({ data, application, updateItem, onClose, notify }) {
  const job = jobOf(data, application);
  const [form, setForm] = useState({
    status: application.status || "Saved",
    appliedDate: application.appliedDate || "",
    resumeId: application.resumeId || "",
    notes: application.notes || "",
    recruiterName: application.recruiterName || "",
    hiringManagerName: application.hiringManagerName || "",
    contactEmail: application.contactEmail || "",
    contactLinkedin: application.contactLinkedin || "",
    nextFollowUp: application.nextFollowUp || "",
    followUpType: application.followUpType || "",
  });
  const [newNote, setNewNote] = useState("");
  const timeline = application.timeline || [];

  function save(patch) {
    const merged = { ...form, ...patch };
    setForm(merged);
    updateItem("applications", application.id, merged);
  }
  function addTimelineEntry() {
    if (!newNote.trim()) return;
    const entry = { id: uid(), date: todayISO(), note: newNote.trim() };
    updateItem("applications", application.id, { timeline: [...timeline, entry] });
    setNewNote("");
    notify("Activity logged");
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(12,18,16,0.5)" }} onClick={onClose}>
      <div className="w-full max-w-xl h-full overflow-y-auto" style={{ background: "var(--surface)" }} onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b flex items-start justify-between sticky top-0" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div>
            <div className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>{titleOf(data, application)}</div>
            <div className="text-[13px]" style={{ color: "var(--ink-soft)" }}>{companyOf(data, application)}</div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5"><X size={18} /></button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {job && (
            <div>
              <div className="text-[12px] font-medium mb-2" style={{ color: "var(--ink-soft)" }}>Job information</div>
              <div className="text-[13px] space-y-1" style={{ color: "var(--ink)" }}>
                <div>{job.location || "—"} {job.workType && `· ${job.workType}`}</div>
                {job.source && <div>Source: {job.source}</div>}
                {job.url && <a href={job.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1" style={{ color: "var(--accent)" }}>Open posting <ExternalLink size={12} /></a>}
              </div>
            </div>
          )}

          <div>
            <div className="text-[12px] font-medium mb-2" style={{ color: "var(--ink-soft)" }}>Application</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] mb-1" style={{ color: "var(--ink-soft)" }}>Status</label>
                <Select value={form.status} onChange={v => save({ status: v })} options={APP_STATUSES} />
              </div>
              <div>
                <label className="block text-[11px] mb-1" style={{ color: "var(--ink-soft)" }}>Applied date</label>
                <TextInput type="date" value={form.appliedDate} onChange={e => save({ appliedDate: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] mb-1" style={{ color: "var(--ink-soft)" }}>Resume used</label>
                <select value={form.resumeId} onChange={e => save({ resumeId: e.target.value })} className="w-full px-3 py-2 rounded-md border text-sm" style={{ borderColor: "var(--border)" }}>
                  <option value="">{data.resumes.length ? "Select resume…" : "No resumes added yet"}</option>
                  {data.resumes.map(r => <option key={r.id} value={r.id}>{r.name}{r.version ? " · " + r.version : ""}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div>
            <div className="text-[12px] font-medium mb-2" style={{ color: "var(--ink-soft)" }}>Contact information</div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[11px] mb-1" style={{ color: "var(--ink-soft)" }}>Recruiter</label><TextInput value={form.recruiterName} onChange={e => save({ recruiterName: e.target.value })} /></div>
              <div><label className="block text-[11px] mb-1" style={{ color: "var(--ink-soft)" }}>Hiring manager</label><TextInput value={form.hiringManagerName} onChange={e => save({ hiringManagerName: e.target.value })} /></div>
              <div><label className="block text-[11px] mb-1" style={{ color: "var(--ink-soft)" }}>Email</label><TextInput value={form.contactEmail} onChange={e => save({ contactEmail: e.target.value })} /></div>
              <div><label className="block text-[11px] mb-1" style={{ color: "var(--ink-soft)" }}>LinkedIn</label><TextInput value={form.contactLinkedin} onChange={e => save({ contactLinkedin: e.target.value })} /></div>
            </div>
          </div>

          <div>
            <div className="text-[12px] font-medium mb-2" style={{ color: "var(--ink-soft)" }}>Follow-up</div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[11px] mb-1" style={{ color: "var(--ink-soft)" }}>Next follow-up date</label><TextInput type="date" value={form.nextFollowUp} onChange={e => save({ nextFollowUp: e.target.value })} /></div>
              <div><label className="block text-[11px] mb-1" style={{ color: "var(--ink-soft)" }}>Follow-up type</label><TextInput placeholder="e.g. Email nudge" value={form.followUpType} onChange={e => save({ followUpType: e.target.value })} /></div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] mb-1" style={{ color: "var(--ink-soft)" }}>Notes</label>
            <textarea rows={3} value={form.notes} onChange={e => save({ notes: e.target.value })} className="w-full px-3 py-2 rounded-md border text-sm" style={{ borderColor: "var(--border)" }} />
          </div>

          <div>
            <div className="text-[12px] font-medium mb-2" style={{ color: "var(--ink-soft)" }}>Activity timeline</div>
            <div className="space-y-2 mb-3">
              {timeline.length === 0 && <div className="text-[12px]" style={{ color: "var(--ink-soft)" }}>No activity logged yet.</div>}
              {[...timeline].reverse().map(t => (
                <div key={t.id} className="flex gap-2 text-[13px]">
                  <div className="w-20 shrink-0" style={{ color: "var(--ink-soft)" }}>{fmtDate(t.date)}</div>
                  <div style={{ color: "var(--ink)" }}>{t.note}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <TextInput placeholder="Log an update (e.g. Recruiter screening scheduled)" value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === "Enter" && addTimelineEntry()} />
              <button onClick={addTimelineEntry} className="px-3 py-2 rounded-md text-sm text-white shrink-0" style={{ background: "var(--accent)" }}>Add</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== OUTREACH ============================== */

const OUTREACH_FIELDS_BASE = [
  { key: "personName", label: "Person name", required: true },
  { key: "company", label: "Company" },
  { key: "jobTitle", label: "Job title" },
  { key: "type", label: "Contact type", type: "select", options: OUTREACH_TYPES },
  { key: "email", label: "Email" },
  { key: "linkedin", label: "LinkedIn profile", placeholder: "https://" },
  { key: "dateContacted", label: "Date contacted", type: "date" },
  { key: "followUpDate", label: "Follow-up date", type: "date" },
  { key: "status", label: "Outreach status", type: "select", options: OUTREACH_STATUSES },
  { key: "response", label: "Response status", placeholder: "e.g. Positive, awaiting reply" },
  { key: "subject", label: "Subject (if email)", span: 2 },
  { key: "notes", label: "Message / notes", type: "textarea", span: 2 },
];

export function OutreachPage({ data, addItem, updateItem, deleteItem, notify }) {
  const [tab, setTab] = useState("All");
  const [modal, setModal] = useState(null);
  const tabs = ["All", ...OUTREACH_TYPES];

  const rows = data.outreach.filter(o => tab === "All" || o.type === tab).sort((a, b) => (b.dateContacted || "").localeCompare(a.dateContacted || ""));

  return (
    <div>
      <SectionHeader title="Outreach" subtitle="Your networking and direct-approach CRM."
        action={<PrimaryButton icon={Plus} onClick={() => setModal({ mode: "add" })}>Log outreach</PrimaryButton>} />

      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-3 py-1.5 rounded-md text-[13px] shrink-0"
            style={{ background: tab === t ? "var(--accent-soft)" : "transparent", color: tab === t ? "var(--accent)" : "var(--ink-soft)" }}>{t}</button>
        ))}
      </div>

      <DataTable
        emptyText="No outreach logged yet. Track your LinkedIn messages, cold emails, and referral requests here."
        columns={[
          { key: "personName", label: "Person", render: r => <div><div className="font-medium">{r.personName}</div><div className="text-[12px]" style={{ color: "var(--ink-soft)" }}>{r.company}{r.jobTitle ? " · " + r.jobTitle : ""}</div></div> },
          { key: "type", label: "Type", render: r => <Badge label={r.type || "Other"} color="#7E57C2" /> },
          { key: "status", label: "Status", render: r => <Badge label={r.status || "Draft"} color={STATUS_COLOR[r.status] || "#8A93A6"} /> },
          { key: "dateContacted", label: "Contacted", render: r => fmtDate(r.dateContacted) },
          { key: "followUpDate", label: "Follow-up", render: r => r.followUpDate ? <span style={{ color: r.followUpDate < todayISO() ? "#C4453A" : "var(--ink)" }}>{fmtDate(r.followUpDate)}</span> : "—" },
        ]}
        rows={rows}
        onEdit={r => setModal({ mode: "edit", item: r })}
        onDelete={id => deleteItem("outreach", id)}
        onRowClick={r => setModal({ mode: "edit", item: r })}
      />

      {modal && (
        <FormModal wide title={modal.mode === "add" ? "Log outreach" : "Edit outreach"}
          fields={OUTREACH_FIELDS_BASE} initial={modal.item}
          onCancel={() => setModal(null)}
          onSave={vals => {
            if (modal.mode === "add") addItem("outreach", vals); else updateItem("outreach", modal.item.id, vals);
            notify(modal.mode === "add" ? "Outreach logged" : "Outreach updated");
            setModal(null);
          }} />
      )}
    </div>
  );
}

/* ============================== CONTACTS ============================== */

const CONTACT_FIELDS = [
  { key: "name", label: "Name", required: true },
  { key: "company", label: "Company" },
  { key: "designation", label: "Designation" },
  { key: "type", label: "Contact type", type: "select", options: CONTACT_TYPES },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://" },
  { key: "relationship", label: "Relationship", placeholder: "e.g. Ex-colleague" },
  { key: "lastContacted", label: "Last contacted", type: "date" },
  { key: "nextFollowUp", label: "Next follow-up", type: "date" },
  { key: "notes", label: "Notes", type: "textarea", span: 2 },
];

export function ContactsPage({ data, addItem, updateItem, deleteItem, notify }) {
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const rows = data.contacts.filter(c => {
    if (search && !((c.name + c.company + (c.notes || "")).toLowerCase().includes(search.toLowerCase()))) return false;
    if (filters.type && c.type !== filters.type) return false;
    return true;
  });
  return (
    <div>
      <SectionHeader title="Contacts" subtitle="Your recruiter and career-network CRM."
        action={<PrimaryButton icon={Plus} onClick={() => setModal({ mode: "add" })}>Add contact</PrimaryButton>} />
      <FilterBar search={search} onSearch={setSearch} filters={[{ key: "type", label: "Type", options: CONTACT_TYPES }]} values={filters} onChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))} />
      <DataTable
        emptyText="No contacts yet. Add recruiters, hiring managers, and referrals as you meet them."
        columns={[
          { key: "name", label: "Name", render: r => <div><div className="font-medium">{r.name}</div><div className="text-[12px]" style={{ color: "var(--ink-soft)" }}>{r.designation}</div></div> },
          { key: "company", label: "Company" },
          { key: "type", label: "Type", render: r => r.type ? <Badge label={r.type} color="#3B6FD1" /> : "—" },
          { key: "lastContacted", label: "Last contacted", render: r => fmtDate(r.lastContacted) },
          { key: "nextFollowUp", label: "Next follow-up", render: r => r.nextFollowUp ? <span style={{ color: r.nextFollowUp < todayISO() ? "#C4453A" : "var(--ink)" }}>{fmtDate(r.nextFollowUp)}</span> : "—" },
        ]}
        rows={rows}
        onEdit={r => setModal({ mode: "edit", item: r })}
        onDelete={id => deleteItem("contacts", id)}
        onRowClick={r => setModal({ mode: "edit", item: r })}
      />
      {modal && (
        <FormModal wide title={modal.mode === "add" ? "Add contact" : "Edit contact"} fields={CONTACT_FIELDS} initial={modal.item}
          onCancel={() => setModal(null)}
          onSave={vals => { if (modal.mode === "add") addItem("contacts", vals); else updateItem("contacts", modal.item.id, vals); notify("Contact saved"); setModal(null); }} />
      )}
    </div>
  );
}

/* ============================== INTERVIEWS ============================== */

const INTERVIEW_FIELDS = [
  { key: "company", label: "Company", required: true },
  { key: "jobTitle", label: "Job title" },
  { key: "round", label: "Interview round", type: "select", options: INTERVIEW_ROUNDS },
  { key: "date", label: "Date", type: "date" },
  { key: "time", label: "Time", type: "time" },
  { key: "interviewer", label: "Interviewer" },
  { key: "meetingLink", label: "Meeting link", placeholder: "https://" },
  { key: "interviewType", label: "Interview type", placeholder: "e.g. Video, Onsite, Phone" },
  { key: "result", label: "Result", type: "select", options: INTERVIEW_RESULTS },
  { key: "prepNotes", label: "Preparation notes", type: "textarea", span: 2 },
  { key: "feedback", label: "Feedback", type: "textarea", span: 2 },
];

export function InterviewsPage({ data, addItem, updateItem, deleteItem, notify }) {
  const [modal, setModal] = useState(null);
  const rows = [...data.interviews].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  return (
    <div>
      <SectionHeader title="Interviews" subtitle="Every round, scheduled and tracked."
        action={<PrimaryButton icon={Plus} onClick={() => setModal({ mode: "add" })}>Add interview</PrimaryButton>} />
      <DataTable
        emptyText="No interviews scheduled yet."
        columns={[
          { key: "company", label: "Company", render: r => <div><div className="font-medium">{r.company}</div><div className="text-[12px]" style={{ color: "var(--ink-soft)" }}>{r.jobTitle}</div></div> },
          { key: "round", label: "Round", render: r => r.round ? <Badge label={r.round} color="#3B6FD1" /> : "—" },
          { key: "date", label: "When", render: r => <>{fmtDate(r.date)}{r.time ? " · " + r.time : ""}</> },
          { key: "interviewer", label: "Interviewer" },
          { key: "result", label: "Result", render: r => r.result ? <Badge label={r.result} color={STATUS_COLOR[r.result]} /> : <Badge label="Pending" color="#C98A2E" /> },
          { key: "link", label: "", render: r => r.meetingLink ? <a href={r.meetingLink} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ color: "var(--accent)" }}><ExternalLink size={14} /></a> : null },
        ]}
        rows={rows}
        onEdit={r => setModal({ mode: "edit", item: r })}
        onDelete={id => deleteItem("interviews", id)}
        onRowClick={r => setModal({ mode: "edit", item: r })}
      />
      {modal && (
        <FormModal wide title={modal.mode === "add" ? "Add interview" : "Edit interview"} fields={INTERVIEW_FIELDS} initial={modal.item}
          onCancel={() => setModal(null)}
          onSave={vals => { if (modal.mode === "add") addItem("interviews", vals); else updateItem("interviews", modal.item.id, vals); notify("Interview saved"); setModal(null); }} />
      )}
    </div>
  );
}

/* ============================== RESUMES ============================== */

const RESUME_FIELDS = [
  { key: "name", label: "Resume name", required: true, placeholder: "e.g. DevSecOps Resume" },
  { key: "version", label: "Version", placeholder: "e.g. v3" },
  { key: "targetRole", label: "Target role" },
  { key: "updatedDate", label: "Last updated", type: "date" },
  { key: "fileNote", label: "File reference", placeholder: "Filename or storage link", span: 2 },
  { key: "notes", label: "Notes", type: "textarea", span: 2 },
];

export function ResumesPage({ data, addItem, updateItem, deleteItem, notify }) {
  const [modal, setModal] = useState(null);
  return (
    <div>
      <SectionHeader title="Resumes" subtitle="Keep every version organized and know which one you sent where."
        action={<PrimaryButton icon={Plus} onClick={() => setModal({ mode: "add" })}>Add resume</PrimaryButton>} />
      <DataTable
        emptyText="No resumes added yet. Add each version you use so you can pick the right one per application."
        columns={[
          { key: "name", label: "Resume", render: r => <div><div className="font-medium">{r.name}</div><div className="text-[12px]" style={{ color: "var(--ink-soft)" }}>{r.version}</div></div> },
          { key: "targetRole", label: "Target role" },
          { key: "used", label: "Times used", render: r => data.applications.filter(a => a.resumeId === r.id).length },
          { key: "updatedDate", label: "Updated", render: r => fmtDate(r.updatedDate) },
        ]}
        rows={data.resumes}
        onEdit={r => setModal({ mode: "edit", item: r })}
        onDelete={id => deleteItem("resumes", id)}
        onRowClick={r => setModal({ mode: "edit", item: r })}
      />
      {modal && (
        <FormModal title={modal.mode === "add" ? "Add resume" : "Edit resume"} fields={RESUME_FIELDS} initial={modal.item}
          onCancel={() => setModal(null)}
          onSave={vals => { if (modal.mode === "add") addItem("resumes", vals); else updateItem("resumes", modal.item.id, vals); notify("Resume saved"); setModal(null); }} />
      )}
    </div>
  );
}

/* ============================== COMPANIES ============================== */

const COMPANY_FIELDS = [
  { key: "name", label: "Company name", required: true },
  { key: "website", label: "Website", placeholder: "https://" },
  { key: "industry", label: "Industry" },
  { key: "location", label: "Location" },
  { key: "careersPage", label: "Careers page", placeholder: "https://" },
  { key: "notes", label: "Notes", type: "textarea", span: 2 },
];

export function CompaniesPage({ data, addItem, updateItem, deleteItem, notify }) {
  const [modal, setModal] = useState(null);
  const [detailName, setDetailName] = useState(null);

  const names = uniqCompanyNames(data);
  const rows = names.map(name => {
    const rec = data.companies.find(c => c.name === name);
    const jobs = data.jobs.filter(j => j.company === name);
    const apps = data.applications.filter(a => companyOf(data, a) === name);
    const interviews = data.interviews.filter(iv => iv.company === name);
    const offers = apps.filter(a => a.status === "Offer").length;
    return { id: rec?.id || name, name, rec, jobs: jobs.length, apps: apps.length, interviews: interviews.length, offers };
  });

  return (
    <div>
      <SectionHeader title="Companies" subtitle="Your complete history with every company you've engaged."
        action={<PrimaryButton icon={Plus} onClick={() => setModal({ mode: "add" })}>Add company</PrimaryButton>} />
      <DataTable
        emptyText="No companies yet. They'll appear automatically as you add jobs, or you can add one manually."
        columns={[
          { key: "name", label: "Company", render: r => <div className="font-medium">{r.name}</div> },
          { key: "jobs", label: "Jobs saved" },
          { key: "apps", label: "Applications" },
          { key: "interviews", label: "Interviews" },
          { key: "offers", label: "Offers", render: r => r.offers > 0 ? <Badge label={r.offers} color="#1E8E5A" /> : 0 },
        ]}
        rows={rows}
        onEdit={r => setModal({ mode: "edit", item: r.rec || { name: r.name } })}
        onDelete={id => { const rec = data.companies.find(c => c.id === id); if (rec) deleteItem("companies", rec.id); } }
        onRowClick={r => setDetailName(r.name)}
      />
      {modal && (
        <FormModal title={modal.mode === "add" ? "Add company" : "Edit company"} fields={COMPANY_FIELDS} initial={modal.item}
          onCancel={() => setModal(null)}
          onSave={vals => {
            const existing = data.companies.find(c => c.name === vals.name);
            if (existing) updateItem("companies", existing.id, vals); else addItem("companies", vals);
            notify("Company saved"); setModal(null);
          }} />
      )}
      {detailName && (
        <CompanyDetail name={detailName} data={data} onClose={() => setDetailName(null)} />
      )}
    </div>
  );
}

function CompanyDetail({ name, data, onClose }) {
  const rec = data.companies.find(c => c.name === name);
  const jobs = data.jobs.filter(j => j.company === name);
  const apps = data.applications.filter(a => companyOf(data, a) === name);
  const interviews = data.interviews.filter(iv => iv.company === name);
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(12,18,16,0.5)" }} onClick={onClose}>
      <div className="w-full max-w-lg h-full overflow-y-auto" style={{ background: "var(--surface)" }} onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b flex items-start justify-between sticky top-0" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div>
            <div className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>{name}</div>
            {rec?.industry && <div className="text-[13px]" style={{ color: "var(--ink-soft)" }}>{rec.industry}</div>}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5"><X size={18} /></button>
        </div>
        <div className="px-5 py-4 space-y-5 text-sm">
          {rec?.website && <div><a href={rec.website} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>{rec.website}</a></div>}
          <div>
            <div className="text-[12px] font-medium mb-2" style={{ color: "var(--ink-soft)" }}>Jobs saved ({jobs.length})</div>
            {jobs.map(j => <div key={j.id} className="py-1" style={{ color: "var(--ink)" }}>{j.title}</div>)}
            {jobs.length === 0 && <div style={{ color: "var(--ink-soft)" }}>None yet.</div>}
          </div>
          <div>
            <div className="text-[12px] font-medium mb-2" style={{ color: "var(--ink-soft)" }}>Applications ({apps.length})</div>
            {apps.map(a => <div key={a.id} className="py-1 flex items-center gap-2" style={{ color: "var(--ink)" }}>{titleOf(data, a)} <Badge label={a.status} color={STATUS_COLOR[a.status]} /></div>)}
            {apps.length === 0 && <div style={{ color: "var(--ink-soft)" }}>None yet.</div>}
          </div>
          <div>
            <div className="text-[12px] font-medium mb-2" style={{ color: "var(--ink-soft)" }}>Interviews ({interviews.length})</div>
            {interviews.map(iv => <div key={iv.id} className="py-1" style={{ color: "var(--ink)" }}>{iv.round} — {fmtDate(iv.date)}</div>)}
            {interviews.length === 0 && <div style={{ color: "var(--ink-soft)" }}>None yet.</div>}
          </div>
          {rec?.notes && (
            <div>
              <div className="text-[12px] font-medium mb-2" style={{ color: "var(--ink-soft)" }}>Notes</div>
              <div style={{ color: "var(--ink)" }}>{rec.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================== FOLLOW-UPS ============================== */

export function FollowUpsPage({ data, updateItem, setView }) {
  const items = getFollowUps(data);
  const overdue = items.filter(f => f.date < todayISO());
  const today = items.filter(f => f.date === todayISO());
  const upcoming = items.filter(f => f.date > todayISO());

  function complete(item) {
    if (item.entity === "applications") updateItem("applications", item.refId, { nextFollowUp: "" });
    if (item.entity === "outreach") updateItem("outreach", item.refId, { followUpDate: "" });
    if (item.entity === "contacts") updateItem("contacts", item.refId, { nextFollowUp: "" });
  }

  return (
    <div>
      <SectionHeader title="Follow-ups" subtitle="Everything you owe a reply or nudge, in one queue." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FollowGroup title="Overdue" color="#C4453A" items={overdue} onComplete={complete} setView={setView} />
        <FollowGroup title="Today" color="#C98A2E" items={today} onComplete={complete} setView={setView} />
        <FollowGroup title="Upcoming" color="#3B6FD1" items={upcoming} onComplete={complete} setView={setView} />
      </div>
    </div>
  );
}
function FollowGroup({ title, color, items, onComplete, setView }) {
  return (
    <div className="rounded-lg border p-3.5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
        <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>{title}</div>
        <span className="text-[12px] ml-auto" style={{ color: "var(--ink-soft)" }}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="text-[12px] py-4 text-center" style={{ color: "var(--ink-soft)" }}>Nothing here.</div>
      ) : (
        <div className="space-y-2">
          {items.map(it => (
            <div key={it.id} className="rounded-md px-3 py-2 flex items-start gap-2" style={{ background: "var(--surface-alt)" }}>
              <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setView(it.entity)}>
                <div className="text-[13px] truncate" style={{ color: "var(--ink)" }}>{it.label}</div>
                <div className="text-[11px]" style={{ color: "var(--ink-soft)" }}>{it.type} · {fmtDate(it.date)}</div>
              </div>
              <button onClick={() => onComplete(it)} title="Mark done" className="p-1 rounded hover:bg-black/5 shrink-0"><CheckCircle2 size={16} color="var(--accent)" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================== TEMPLATES ============================== */

const TEMPLATE_FIELDS = [
  { key: "name", label: "Template name", required: true },
  { key: "category", label: "Category", type: "select", options: TEMPLATE_CATEGORIES },
  { key: "subject", label: "Subject (email only)" },
  { key: "tags", label: "Tags", placeholder: "Comma-separated" },
  { key: "body", label: "Message body", type: "textarea", rows: 6, span: 2, placeholder: "Hi {{name}}, I came across the {{job_title}} role at {{company}}..." },
];

const PLACEHOLDERS = ["{{name}}", "{{company}}", "{{job_title}}", "{{job_url}}", "{{your_name}}", "{{skills}}"];

export function TemplatesPage({ data, addItem, updateItem, deleteItem, notify }) {
  const [modal, setModal] = useState(null);
  const [useModal, setUseModal] = useState(null);

  return (
    <div>
      <SectionHeader title="Text templates" subtitle="Reusable LinkedIn and email messages — fill placeholders and copy."
        action={<PrimaryButton icon={Plus} onClick={() => setModal({ mode: "add" })}>New template</PrimaryButton>} />
      <div className="mb-3 flex flex-wrap gap-1.5">
        {PLACEHOLDERS.map(p => <span key={p} className="text-[11px] px-2 py-1 rounded-md" style={{ background: "var(--surface-alt)", color: "var(--ink-soft)" }}>{p}</span>)}
      </div>
      <DataTable
        emptyText="No templates yet. Save your go-to LinkedIn messages and cold emails here."
        columns={[
          { key: "name", label: "Template", render: r => <div className="font-medium">{r.name}</div> },
          { key: "category", label: "Category", render: r => r.category ? <Badge label={r.category} color="#7E57C2" /> : "—" },
          { key: "body", label: "Preview", render: r => <span className="text-[12px]" style={{ color: "var(--ink-soft)" }}>{(r.body || "").slice(0, 60)}{(r.body || "").length > 60 ? "…" : ""}</span> },
        ]}
        rows={data.templates}
        onEdit={r => setModal({ mode: "edit", item: r })}
        onDelete={id => deleteItem("templates", id)}
        onRowClick={r => setUseModal(r)}
      />
      {modal && (
        <FormModal wide title={modal.mode === "add" ? "New template" : "Edit template"} fields={TEMPLATE_FIELDS} initial={modal.item}
          onCancel={() => setModal(null)}
          onSave={vals => { if (modal.mode === "add") addItem("templates", vals); else updateItem("templates", modal.item.id, vals); notify("Template saved"); setModal(null); }} />
      )}
      {useModal && <UseTemplateModal template={useModal} onClose={() => setUseModal(null)} notify={notify} />}
    </div>
  );
}

function UseTemplateModal({ template, onClose, notify }) {
  const [vals, setVals] = useState({ name: "", company: "", job_title: "", job_url: "", your_name: "", skills: "" });
  const filled = useMemo(() => {
    let s = template.body || "";
    Object.entries(vals).forEach(([k, v]) => { s = s.split(`{{${k}}}`).join(v || `{{${k}}}`); });
    return s;
  }, [vals, template.body]);

  function copy() {
    navigator.clipboard?.writeText(filled).then(() => notify("Copied to clipboard"));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(12,18,16,0.5)" }} onClick={onClose}>
      <div className="w-full max-w-2xl rounded-lg shadow-xl overflow-hidden flex flex-col" style={{ background: "var(--surface)", maxHeight: "88vh" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>{template.name}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5"><X size={17} /></button>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-3 overflow-y-auto">
          {Object.keys(vals).map(k => (
            <div key={k}>
              <label className="block text-[11px] mb-1 capitalize" style={{ color: "var(--ink-soft)" }}>{k.replace("_", " ")}</label>
              <TextInput value={vals[k]} onChange={e => setVals(v => ({ ...v, [k]: e.target.value }))} />
            </div>
          ))}
          <div className="col-span-2">
            <label className="block text-[11px] mb-1" style={{ color: "var(--ink-soft)" }}>Preview</label>
            <div className="w-full px-3 py-2.5 rounded-md border text-sm whitespace-pre-wrap" style={{ borderColor: "var(--border)", background: "var(--surface-alt)", minHeight: 120 }}>{filled}</div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t" style={{ borderColor: "var(--border)" }}>
          <button onClick={onClose} className="px-3.5 py-2 rounded-md text-sm" style={{ color: "var(--ink-soft)" }}>Close</button>
          <button onClick={copy} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm text-white font-medium" style={{ background: "var(--accent)" }}><Copy size={14} /> Copy text</button>
        </div>
      </div>
    </div>
  );
}

/* ============================== ANALYTICS ============================== */

export function AnalyticsPage({ data }) {
  const { applications, outreach } = data;
  const total = applications.length || 1;
  const responded = applications.filter(a => a.status !== "Applied" && a.status !== "Saved").length;
  const interviewed = applications.filter(a => ["Screening", "Technical Round", "Manager Round", "HR Round", "Offer"].includes(a.status)).length;
  const offers = applications.filter(a => a.status === "Offer").length;
  const rejected = applications.filter(a => a.status === "Rejected").length;

  const responseRate = Math.round((responded / total) * 100);
  const interviewRate = Math.round((interviewed / total) * 100);
  const offerRate = Math.round((offers / total) * 100);
  const rejectionRate = Math.round((rejected / total) * 100);

  const outreachTotal = outreach.length || 1;
  const outreachReplied = outreach.filter(o => ["Replied", "Positive", "Negative"].includes(o.status)).length;
  const outreachPositive = outreach.filter(o => o.status === "Positive").length;
  const outreachResponseRate = Math.round((outreachReplied / outreachTotal) * 100);

  const bySource = useMemo(() => {
    const m = {};
    JOB_SOURCES.forEach(s => m[s] = { name: s, applications: 0, interviews: 0, offers: 0 });
    applications.forEach(a => {
      const j = jobOf(data, a);
      const s = j?.source || "Other";
      if (!m[s]) m[s] = { name: s, applications: 0, interviews: 0, offers: 0 };
      m[s].applications++;
      if (["Screening", "Technical Round", "Manager Round", "HR Round", "Offer"].includes(a.status)) m[s].interviews++;
      if (a.status === "Offer") m[s].offers++;
    });
    return Object.values(m).filter(x => x.applications > 0);
  }, [applications]);

  return (
    <div>
      <SectionHeader title="Analytics" subtitle="How effective is your job search, really." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Response rate" value={responseRate + "%"} icon={TrendingIcon} />
        <StatCard label="Interview rate" value={interviewRate + "%"} icon={CalendarCheck} accent="#3B6FD1" />
        <StatCard label="Offer rate" value={offerRate + "%"} icon={Sparkles} accent="#1E8E5A" />
        <StatCard label="Rejection rate" value={rejectionRate + "%"} icon={X} accent="#C4453A" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <StatCard label="LinkedIn approaches" value={outreach.filter(o => o.type === "LinkedIn").length} icon={Send} />
        <StatCard label="Cold emails" value={outreach.filter(o => o.type === "Cold Email").length} icon={MessageSquareText} />
        <StatCard label="Outreach response rate" value={outreachResponseRate + "%"} icon={TrendingIcon} accent="#7E57C2" />
        <StatCard label="Recruiter contacts" value={outreach.filter(o => o.type === "Recruiter Outreach").length} icon={ContactIcon} />
        <StatCard label="Positive responses" value={outreachPositive} icon={CheckCircle2} accent="#1E8E5A" />
        <StatCard label="Referral requests" value={outreach.filter(o => o.type === "Referral Request").length} icon={Send} />
      </div>

      <ChartCard title="Source performance — applications, interviews, offers">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={bySource}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="applications" fill="#8A93A6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="interviews" fill="#3B6FD1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="offers" fill="#1E8E5A" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
function TrendingIcon(props) { return <ArrowRight {...props} style={{ transform: "rotate(-45deg)" }} />; }
