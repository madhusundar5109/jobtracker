import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { useCloudData } from "./lib/useCloudData";
import AuthScreen from "./AuthScreen";
import {
  Style, NAV_ITEMS, TopBar, SearchResults,
  Dashboard, JobsPage, ApplicationsPage, OutreachPage, ContactsPage,
  InterviewsPage, ResumesPage, CompaniesPage, FollowUpsPage, TemplatesPage, AnalyticsPage
} from "./pages";
import { Briefcase, X, Menu, CheckCircle2, LogOut } from "lucide-react";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = checking, null = signed out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#5C6862", fontFamily: "ui-sans-serif,sans-serif" }}>
        Loading…
      </div>
    );
  }
  if (!session) return <AuthScreen />;

  return <JobTrackApp user={session.user} />;
}

function JobTrackApp({ user }) {
  const { data, loaded, addItem, updateItem, deleteItem } = useCloudData(user);
  const [view, setView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const [toast, setToast] = useState(null);

  function notify(msg) { setToast(msg); setTimeout(() => setToast(null), 2200); }
  const actions = { addItem, updateItem, deleteItem, notify };

  if (!loaded) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <div className="text-sm" style={{ color: "var(--ink-soft)" }}>Syncing your workspace…</div>
        <Style />
      </div>
    );
  }

  return (
    <div className="w-full flex" style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font)", color: "var(--ink)" }}>
      <Style />
      <div className={`fixed md:static inset-y-0 left-0 z-40 w-64 shrink-0 transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
        style={{ background: "var(--sidebar)" }}>
        <div className="px-5 py-5 flex items-center gap-2 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <Briefcase size={16} color="#fff" />
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "#fff" }}>JobTrack</div>
            <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>Synced across devices</div>
          </div>
          <button className="ml-auto md:hidden p-1" onClick={() => setSidebarOpen(false)}><X size={16} color="#fff" /></button>
        </div>
        <nav className="px-3 py-3 flex flex-col gap-0.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = view === item.key;
            return (
              <button key={item.key} onClick={() => { setView(item.key); setSidebarOpen(false); }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-left transition-colors"
                style={{
                  background: active ? "rgba(255,255,255,0.08)" : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.62)",
                  borderLeft: active ? "2px solid var(--accent-bright)" : "2px solid transparent"
                }}>
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="px-5 py-4 mt-2">
          <div className="text-[11px] mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>{user.email}</div>
          <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-1.5 text-[12px]" style={{ color: "rgba(255,255,255,0.55)" }}>
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </div>
      {sidebarOpen && <div className="fixed inset-0 z-30 md:hidden" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar view={view} setSidebarOpen={setSidebarOpen} globalQuery={globalQuery} setGlobalQuery={setGlobalQuery} data={data} setView={setView} />
        <div className="flex-1 min-w-0 p-4 md:p-7">
          {globalQuery.trim() ? (
            <SearchResults query={globalQuery} data={data} setView={setView} clear={() => setGlobalQuery("")} />
          ) : (
            <>
              {view === "dashboard" && <Dashboard data={data} setView={setView} />}
              {view === "jobs" && <JobsPage data={data} {...actions} setView={setView} />}
              {view === "applications" && <ApplicationsPage data={data} {...actions} />}
              {view === "outreach" && <OutreachPage data={data} {...actions} />}
              {view === "contacts" && <ContactsPage data={data} {...actions} />}
              {view === "interviews" && <InterviewsPage data={data} {...actions} />}
              {view === "resumes" && <ResumesPage data={data} {...actions} />}
              {view === "companies" && <CompaniesPage data={data} {...actions} />}
              {view === "followups" && <FollowUpsPage data={data} {...actions} setView={setView} />}
              {view === "templates" && <TemplatesPage data={data} {...actions} />}
              {view === "analytics" && <AnalyticsPage data={data} />}
            </>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-md shadow-lg text-sm text-white flex items-center gap-2" style={{ background: "var(--ink)" }}>
          <CheckCircle2 size={15} color="var(--accent-bright)" /> {toast}
        </div>
      )}
    </div>
  );
}
