import { useState, useMemo, Fragment } from "react";
import { processLeads, RAW_LEADS, LeadRaw, LeadCalculated, LeadScenario } from "./data";
import { AnimatedNumber, ResultTile, ScenarioPanel, SliderField, WeightSliders, type Preset } from "./Scenario";
import { 
  Building, 
  Search, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  DollarSign, 
  Clock, 
  Compass, 
  Target, 
  Mail, 
  MapPin, 
  User, 
  ArrowRight, 
  Sparkles,
  Zap,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useDemoRows, type Row } from "./demoApi";
import { DemoNote, DemoToolbar, RecordModal, ConfirmModal, OwnRowActions, OwnTag, type FieldDef } from "./DemoUI";


// ---- Live data: rows come from the database; the bundled sample rows are the offline fallback ----

const FALLBACK_ROWS: Row[] = RAW_LEADS.map((l) => ({
  id: l.leadId, session_id: null, seed_key: l.leadId, created_at: "",
  company: l.company, industry: l.industry, contact: l.contact, lead_source: l.leadSource, budget_gbp: l.budgetGbp,
  timeline_months: l.timelineMonths, decision_makers: l.decisionMakers, previous_engagement: l.previousEngagement,
  pain_point_clarity: l.painPointClarity, fit_score: l.fitScore, flags_str: l.flagsStr, notes: l.notes,
}));

function leadFromRow(r: Row): LeadRaw {
  return {
    leadId: r.seed_key ?? r.id, rowId: r.id, own: r.session_id !== null,
    company: r.company, industry: r.industry, contact: r.contact, leadSource: r.lead_source, budgetGbp: Number(r.budget_gbp),
    timelineMonths: Number(r.timeline_months), decisionMakers: Number(r.decision_makers), previousEngagement: r.previous_engagement,
    painPointClarity: r.pain_point_clarity, fitScore: Number(r.fit_score), flagsStr: r.flags_str, notes: r.notes ?? "",
  };
}

const LEAD_FLAG_OPTIONS = ["Long sales cycle", "Many stakeholders", "Budget below average", "Single champion", "No follow-up", "Low engagement", "Low budget", "Long timeline", "Single decision maker", "No engagement", "Outside core ICP"];

const LEAD_FIELDS: FieldDef[] = [
  { key: "company", label: "Company", type: "text", maxLength: 60 },
  { key: "industry", label: "Industry", type: "text", maxLength: 40 },
  { key: "contact", label: "Contact name", type: "text", maxLength: 60, help: "Use a made-up name, not a real person." },
  { key: "lead_source", label: "Lead source", type: "select", options: ["Inbound", "Outbound", "Referral", "Event"] },
  { key: "budget_gbp", label: "Budget (£)", type: "int", min: 0, max: 5000000 },
  { key: "timeline_months", label: "Timeline (months)", type: "int", min: 0, max: 60 },
  { key: "decision_makers", label: "Decision makers", type: "int", min: 0, max: 30 },
  { key: "fit_score", label: "Fit score (0 to 100)", type: "int", min: 0, max: 100 },
  { key: "pain_point_clarity", label: "Pain point clarity", type: "select", options: ["High", "Medium", "Low"] },
  { key: "previous_engagement", label: "Previous engagement", type: "text", maxLength: 120, help: "For example: Demo attended | Proposal requested" },
  { key: "h_flags", label: "Risk flags (tick any that apply)", type: "heading" },
  ...LEAD_FLAG_OPTIONS.map((f): FieldDef => ({ key: "flag:" + f, label: f, type: "check" })),
  { key: "notes", label: "Notes (optional)", type: "textarea", maxLength: 400, required: false },
];

type FormState = { mode: "add" } | { mode: "edit"; lead: LeadCalculated } | { mode: "delete"; lead: LeadCalculated } | null;

// ---- What-if scenario (view only; never saved) ----
interface SalesScn { weights: number[]; hot: number; win: number; calls: number }
const DEFAULT_SALES_SCN: SalesScn = { weights: [25, 25, 25, 25], hot: 80, win: 25, calls: 5 };
const isDefaultSalesScn = (s: SalesScn) => s.hot === 80 && s.win === 25 && s.calls === 5 && s.weights.every((w) => w === 25);
const SALES_PRESETS: (Preset & { scn: SalesScn })[] = [
  { id: 'aggressive-growth', label: 'Aggressive growth', hint: 'Lower the hot bar, work more leads, win more', scn: { weights: [30, 25, 25, 20], hot: 65, win: 35, calls: 12 } },
  { id: 'quality-first', label: 'Quality over quantity', hint: 'A high hot bar, fewer calls, higher win rate', scn: { weights: [25, 40, 15, 20], hot: 88, win: 40, calls: 3 } },
  { id: 'engagement-first', label: 'Engagement first', hint: 'Weights engagement and stakeholders most', scn: { weights: [15, 20, 15, 50], hot: 80, win: 30, calls: 8 } },
];

export default function App() {
  const demo = useDemoRows("leads", FALLBACK_ROWS);
  const [scn, setScn] = useState<SalesScn>(DEFAULT_SALES_SCN);
  const [preset, setPreset] = useState<string | null>(null);
  const scnActive = !isDefaultSalesScn(scn);
  const leadScenario = useMemo<LeadScenario>(() => ({ weights: scn.weights, hotThreshold: scn.hot }), [scn.weights, scn.hot]);
  const allLeads = useMemo(() => processLeads(demo.rows.map(leadFromRow), leadScenario), [demo.rows, leadScenario]);
  const baselineLeads = useMemo(() => processLeads(demo.rows.map(leadFromRow)), [demo.rows]);
  const baseRank = useMemo(() => new Map(baselineLeads.map((l) => [l.leadId, l.rank])), [baselineLeads]);
  const baseCounts = useMemo(() => ({ hot: baselineLeads.filter((l) => l.scoreCategory === "HOT").length, warm: baselineLeads.filter((l) => l.scoreCategory === "WARM").length, cold: baselineLeads.filter((l) => l.scoreCategory === "COLD").length }), [baselineLeads]);
  // The leads you would call this week: the top-ranked N.
  const calledIds = useMemo(() => new Map(allLeads.slice(0, scn.calls).map((l, i) => [l.leadId, i + 1])), [allLeads, scn.calls]);
  const calledBudget = useMemo(() => allLeads.filter((l) => calledIds.has(l.leadId)).reduce((a, l) => a + l.budgetGbp, 0), [allLeads, calledIds]);
  const forecast = Math.round((calledBudget * scn.win) / 100);
  const setScenario = (next: SalesScn, presetId: string | null = null) => { setScn(next); setPreset(presetId); };
  const [form, setForm] = useState<FormState>(null);
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState<"ALL" | "HOT" | "WARM" | "COLD">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>("L001"); // default first row expanded for visual impact

  // Calculate counts
  const stats = useMemo(() => {
    const hotCount = allLeads.filter(l => l.scoreCategory === "HOT").length;
    const warmCount = allLeads.filter(l => l.scoreCategory === "WARM").length;
    const coldCount = allLeads.filter(l => l.scoreCategory === "COLD").length;
    return {
      total: allLeads.length,
      hot: hotCount,
      warm: warmCount,
      cold: coldCount
    };
  }, [allLeads]);

  // Filter and Search Leads
  const filteredLeads = useMemo(() => {
    return allLeads.filter(lead => {
      const matchesFilter = filter === "ALL" || lead.scoreCategory === filter;
      const matchesSearch = 
        lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.recommendedAction.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [allLeads, filter, searchQuery]);

  // Top Opportunities (HOT score category only, rank sorted)
  const topOpportunities = useMemo(() => {
    return allLeads
      .filter(l => l.scoreCategory === "HOT")
      .slice(0, 3);
  }, [allLeads]);

  const formatGBP = (num: number) => {
    return "£" + num.toLocaleString("en-GB");
  };

  const getScoreBadgeStyles = (category: "HOT" | "WARM" | "COLD") => {
    switch (category) {
      case "HOT":
        return "bg-[#dcfce7] text-[#166534] border-[#86efac]";
      case "WARM":
        return "bg-[#fef9c3] text-[#854d0e] border-[#fde047]";
      case "COLD":
        return "bg-[#fee2e2] text-[#991b1b] border-[#fca5a5]";
    }
  };

  const toggleRow = (leadId: string) => {
    setExpandedLeadId(prev => (prev === leadId ? null : leadId));
  };

  return (
    <div className="bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white antialiased pb-16">
      {/* Upper Navigation/Branding Panel */}
      <header className="border-b border-[#e2e8f0] py-6 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center bg-[#2563EB] text-white p-2 rounded-lg">
                <Target className="w-6 h-6" id="dashboard-logo-icon" />
              </span>
              <h1 className="text-xl md:text-2xl font-semibold text-[#0B1F33] tracking-tight">
                Sales Lead Scoring Dashboard
              </h1>
            </div>
            <p className="text-sm text-[#6b7280] mt-1.5 font-normal">
              Rule-based lead prioritisation and next action recommendations
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-[#f4f6f9] text-[#6b7280] px-3.5 py-1.5 rounded-lg border border-[#e2e8f0] self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>Live demo · fictional data</span>
          </div>
        </div>
      </header>

      <DemoNote status={demo.status} />

      <main className="max-w-7xl mx-auto px-4 md:px-12 mt-8 space-y-8">
        <ScenarioPanel
          title="Tune your pipeline"
          subtitle="Decide what matters most when scoring leads, set how hot is hot, then see who you would call first and what the pipeline could be worth."
          presets={SALES_PRESETS} activePreset={preset}
          onPreset={(id) => { const p = SALES_PRESETS.find((x) => x.id === id); if (p) setScenario(p.scn, id); }}
          onReset={() => setScenario(DEFAULT_SALES_SCN)} changed={scnActive}
          note="How it works: the weights scale the points in the existing conversion-probability formula (Budget, Need = fit score, Timeline, Engagement). In the scenario view a lead is Hot when its probability reaches the threshold and it has a confirmed budget, a short timeline and several decision makers. Forecast = win rate x the budget of the leads you call. All leads and figures are fictional."
          results={<>
            <ResultTile testId="tile-hot" label="Hot leads" value={allLeads.filter((l) => l.scoreCategory === "HOT").length} format={(n) => String(Math.round(n))} delta={allLeads.filter((l) => l.scoreCategory === "HOT").length - baseCounts.hot} deltaFormat={(n) => String(Math.round(n))} goodWhen="up" tone="green" />
            <ResultTile testId="tile-warm" label="Warm leads" value={allLeads.filter((l) => l.scoreCategory === "WARM").length} format={(n) => String(Math.round(n))} delta={allLeads.filter((l) => l.scoreCategory === "WARM").length - baseCounts.warm} deltaFormat={(n) => String(Math.round(n))} goodWhen="up" tone="amber" />
            <ResultTile testId="tile-cold" label="Cold leads" value={allLeads.filter((l) => l.scoreCategory === "COLD").length} format={(n) => String(Math.round(n))} delta={allLeads.filter((l) => l.scoreCategory === "COLD").length - baseCounts.cold} deltaFormat={(n) => String(Math.round(n))} goodWhen="down" tone="red" />
            <ResultTile testId="tile-forecast" label={`Forecast revenue (${scn.win}% of ${Math.min(scn.calls, allLeads.length)} calls)`} value={forecast} format={formatGBP} tone="navy" />
          </>}
        >
          <div className="scn-body two">
            <div className="scn-group">
              <h3>Scoring weights</h3>
              <WeightSliders idPrefix="w" names={["Budget", "Need", "Timeline", "Engagement"]} values={scn.weights} onChange={(w) => setScenario({ ...scn, weights: w })} />
            </div>
            <div className="scn-group">
              <h3>Thresholds and forecast</h3>
              <SliderField id="hot" label="Hot-lead threshold" value={scn.hot} min={50} max={95} step={1} format={(v) => `${v}% probability`} onChange={(v) => setScenario({ ...scn, hot: v })} />
              <SliderField id="win" label="Win rate" value={scn.win} min={5} max={50} step={1} format={(v) => `${v}%`} onChange={(v) => setScenario({ ...scn, win: v })} />
              <SliderField id="calls" label="Sales calls per week" value={scn.calls} min={1} max={20} step={1} format={(v) => `${v} calls`} onChange={(v) => setScenario({ ...scn, calls: v })} hint="The top-ranked leads get a Call badge in the table." />
            </div>
          </div>
        </ScenarioPanel>

        {/* KPI Cards Row */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Total Leads */}
          <div className="bg-[#f4f6f9] border border-[#e2e8f0] rounded-xl p-5 hover:border-[#2563EB]/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Total Leads</span>
              <Compass className="w-4 h-4 text-[#6b7280]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-bold text-[#0B1F33]"><AnimatedNumber value={stats.total} /></span>
              <span className="text-xs text-[#6b7280] font-medium">Sample leads</span>
            </div>
            <div className="w-full bg-[#e2e8f0] h-[3px] rounded-full mt-4">
              <div className="bg-[#0B1F33] h-full rounded-full" style={{ width: "100%" }} />
            </div>
          </div>

          {/* Hot Leads */}
          <div className="bg-[#f4f6f9] border border-[#e2e8f0] rounded-xl p-5 hover:border-green-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Hot Leads</span>
              <Zap className="w-4 h-4 text-[#166534]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-bold text-[#0B1F33]"><AnimatedNumber value={stats.hot} /></span>
              <span className="text-xs text-[#166534] font-medium">
                {Math.round((stats.hot / stats.total) * 100)}% of pipeline
              </span>
            </div>
            <div className="w-full bg-[#e2e8f0] h-[3px] rounded-full mt-4">
              <div className="bg-green-600 h-full rounded-full" style={{ width: `${(stats.hot / stats.total) * 100}%` }} />
            </div>
          </div>

          {/* Warm Leads */}
          <div className="bg-[#f4f6f9] border border-[#e2e8f0] rounded-xl p-5 hover:border-yellow-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Warm Leads</span>
              <TrendingUp className="w-4 h-4 text-[#854d0e]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-bold text-[#0B1F33]"><AnimatedNumber value={stats.warm} /></span>
              <span className="text-xs text-[#854d0e] font-medium">
                {Math.round((stats.warm / stats.total) * 100)}% of pipeline
              </span>
            </div>
            <div className="w-full bg-[#e2e8f0] h-[3px] rounded-full mt-4">
              <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${(stats.warm / stats.total) * 100}%` }} />
            </div>
          </div>

          {/* Cold Leads */}
          <div className="bg-[#f4f6f9] border border-[#e2e8f0] rounded-xl p-5 hover:border-red-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Cold Leads</span>
              <AlertTriangle className="w-4 h-4 text-[#991b1b]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-bold text-[#0B1F33]"><AnimatedNumber value={stats.cold} /></span>
              <span className="text-xs text-[#991b1b] font-medium">
                {Math.round((stats.cold / stats.total) * 100)}% of pipeline
              </span>
            </div>
            <div className="w-full bg-[#e2e8f0] h-[3px] rounded-full mt-4">
              <div className="bg-red-500 h-full rounded-full" style={{ width: `${(stats.cold / stats.total) * 100}%` }} />
            </div>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <section className="bg-[#f4f6f9] border border-[#e2e8f0] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mr-2 hidden sm:inline">
              Filter by Status:
            </span>
            {[
              { id: "ALL", label: "All Leads", count: stats.total },
              { id: "HOT", label: "Hot Only", count: stats.hot },
              { id: "WARM", label: "Warm Only", count: stats.warm },
              { id: "COLD", label: "Cold Only", count: stats.cold }
            ].map((btn) => {
              const isActive = filter === btn.id;
              return (
                <button
                  key={btn.id}
                  onClick={() => setFilter(btn.id as any)}
                  className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isActive
                      ? "bg-[#2563EB] text-white border-[#2563EB] shadow-sm"
                      : "bg-white text-[#0B1F33] border-[#e2e8f0] hover:bg-slate-50"
                  }`}
                >
                  <span>{btn.label}</span>
                  <span className={`inline-flex px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? "bg-white/20 text-white" : "bg-[#e2e8f0] text-[#6b7280]"
                  }`}>
                    {btn.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Search Box */}
          <div className="relative md:w-80">
            <Search className="w-4 h-4 text-[#6b7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company, industry or action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-[#e2e8f0] bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6b7280] hover:text-[#0B1F33]"
              >
                Clear
              </button>
            )}
          </div>
        </section>

        <div className="space-y-3">
          <DemoToolbar
            addLabel="Add lead"
            onAdd={() => { demo.clearError(); setForm({ mode: "add" }); }}
            onReset={async () => { await demo.reset(); setExpandedLeadId("L001"); }}
            busy={demo.busy} canWrite={demo.canWrite} ownCount={demo.ownCount}
            error={form ? "" : demo.error} onDismissError={demo.clearError}
          />
          {notice && (
            <p role="status" className="flex items-start justify-between gap-3 rounded-lg border border-[#bae6fd] bg-[#e0f2fe] px-4 py-3 text-sm text-[#0c4a6e]">
              <span>{notice}</span>
              <button type="button" onClick={() => setNotice("")} className="font-semibold underline cursor-pointer">Dismiss</button>
            </p>
          )}
        </div>

        {form && form.mode !== "delete" && (
          <RecordModal
            title={form.mode === "add" ? "Add a lead" : `Edit ${form.lead.company}`}
            submitLabel={form.mode === "add" ? "Add lead" : "Save changes"}
            fields={LEAD_FIELDS}
            initial={form.mode === "edit"
              ? { company: form.lead.company, industry: form.lead.industry, contact: form.lead.contact, lead_source: form.lead.leadSource, budget_gbp: form.lead.budgetGbp, timeline_months: form.lead.timelineMonths, decision_makers: form.lead.decisionMakers, fit_score: form.lead.fitScore, pain_point_clarity: form.lead.painPointClarity, previous_engagement: form.lead.previousEngagement, notes: form.lead.notes, ...Object.fromEntries(LEAD_FLAG_OPTIONS.map((f) => ["flag:" + f, form.lead.flags.includes(f)])) }
              : { company: "", industry: "", contact: "", lead_source: "Inbound", budget_gbp: 30000, timeline_months: 3, decision_makers: 2, fit_score: 70, pain_point_clarity: "Medium", previous_engagement: "Intro call done", notes: "" }}
            busy={demo.busy} error={demo.error}
            onClose={() => { demo.clearError(); setForm(null); }}
            onSubmit={async (v) => {
              const picked = LEAD_FLAG_OPTIONS.filter((f) => v["flag:" + f] === true);
              const record: Record<string, unknown> = Object.fromEntries(Object.entries(v).filter(([k]) => !k.startsWith("flag:")));
              record.flags_str = picked.length ? picked.join(" | ") : "None";
              const saved = form.mode === "edit" ? await demo.update((form.lead as LeadRaw).rowId!, record) : await demo.add(record);
              if (saved) { if (form.mode === "add") setExpandedLeadId(saved.seed_key ?? saved.id); setForm(null); }
            }}
          />
        )}
        {form && form.mode === "delete" && (
          <ConfirmModal
            title={`Delete ${form.lead.company}?`} text="This removes your lead from the demo. It cannot be undone." confirmLabel="Delete" busy={demo.busy}
            onCancel={() => { demo.clearError(); setForm(null); }}
            onConfirm={async () => { if (await demo.remove((form.lead as LeadRaw).rowId!)) { setExpandedLeadId(null); setForm(null); } }}
          />
        )}

        {/* Lead Table and Subpanel Section */}
        <section className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#f4f6f9] border-b border-[#e2e8f0]">
                  <th className="py-4 px-4 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider text-center w-12">
                    Rank
                  </th>
                  <th className="py-4 px-5 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">
                    Company Name
                  </th>
                  <th className="py-4 px-4 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider hidden md:table-cell">
                    Industry
                  </th>
                  <th className="py-4 px-4 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">
                    Score
                  </th>
                  <th className="py-4 px-4 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="py-4 px-4 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider hidden lg:table-cell text-center">
                    Timeline
                  </th>
                  <th className="py-4 px-5 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">
                    Probability
                  </th>
                  <th className="py-4 px-4 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider hidden lg:table-cell">
                    Engagement
                  </th>
                  <th className="py-4 px-4 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider hidden sm:table-cell">
                    Risk Flags
                  </th>
                  <th className="py-4 px-4 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">
                    Next Action
                  </th>
                  <th className="py-4 px-4 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-sm text-[#6b7280] bg-white">
                      No sales leads match your filter or search query.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const isExpanded = expandedLeadId === lead.leadId;
                    return (
                      <Fragment key={lead.leadId}>
                        {/* Primary Lead Row */}
                        <motion.tr layout="position" transition={{ type: "spring", stiffness: 300, damping: 32 }}
                          onClick={() => toggleRow(lead.leadId)}
                          className={`group cursor-pointer transition-colors ${
                            isExpanded ? "bg-[#f0f4ff]" : calledIds.has(lead.leadId) ? "bg-[#FFFBEB] hover:bg-[#FEF3C7]" : "hover:bg-[#f0f4ff]/40 bg-white"
                          }`}
                        >
                          {/* Rank */}
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#f4f6f9] group-hover:bg-[#2563EB]/10 text-xs font-semibold text-[#0B1F33]">
                              {lead.rank}
                            </span>
                            {scnActive && baseRank.get(lead.leadId) !== undefined && baseRank.get(lead.leadId) !== lead.rank && (
                              <span className={`rank-chip ${lead.rank < (baseRank.get(lead.leadId) ?? 0) ? "up" : "down"}`} title="Rank change versus the baseline">{lead.rank < (baseRank.get(lead.leadId) ?? 0) ? "▲" : "▼"}{Math.abs(lead.rank - (baseRank.get(lead.leadId) ?? 0))}</span>
                            )}
                          </td>

                          {/* Company */}
                          <td className="py-4 px-5">
                            <div>
                              <div className="font-semibold text-sm text-[#0B1F33] group-hover:text-[#2563EB] transition-colors flex items-center gap-1.5">
                                <span>{lead.company}<OwnTag own={Boolean(lead.own)} />{calledIds.has(lead.leadId) && <span className="call-badge">Call #{calledIds.get(lead.leadId)}</span>}</span>
                              </div>
                              <div className="text-xs text-[#6b7280] mt-0.5 flex items-center gap-1">
                                <span className="font-medium text-[#0B1F33]/70">{lead.contact}</span>
                                <span>•</span>
                                <span>{lead.leadSource}</span>
                              </div>
                            </div>
                          </td>

                          {/* Industry */}
                          <td className="py-4 px-4 text-xs text-[#0B1F33] font-medium hidden md:table-cell">
                            {lead.industry}
                          </td>

                          {/* Score Badge */}
                          <td className="py-4 px-4">
                            <span className={`tier-badge inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getScoreBadgeStyles(lead.scoreCategory)}`}>
                              {lead.scoreCategory}
                            </span>
                          </td>

                          {/* Budget */}
                          <td className="py-4 px-4 text-xs font-mono font-medium text-[#0B1F33]">
                            {formatGBP(lead.budgetGbp)}
                          </td>

                          {/* Timeline */}
                          <td className="py-4 px-4 text-xs text-center font-medium hidden lg:table-cell">
                            {lead.timelineMonths} {lead.timelineMonths === 1 ? 'mo' : 'mos'}
                          </td>

                          {/* Conversion Probability */}
                          <td className="py-4 px-5">
                            <div className="w-32">
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="text-xs font-mono font-semibold text-[#0B1F33]">
                                  <AnimatedNumber value={lead.conversionProbability} duration={0.5} />%
                                </span>
                              </div>
                              <div className="w-full bg-[#e2e8f0] h-[6px] rounded-[3px] overflow-hidden">
                                <div 
                                  className="bg-[#2563EB] h-full rounded-[3px] transition-all duration-500" 
                                  style={{ width: `${lead.conversionProbability}%` }} 
                                />
                              </div>
                            </div>
                          </td>

                          {/* Engagement Level */}
                          <td className="py-4 px-4 hidden lg:table-cell">
                            <span className={`text-xs font-semibold flex items-center gap-1.5 ${
                              lead.painPointClarity === "High" ? "text-green-600" :
                              lead.painPointClarity === "Medium" ? "text-yellow-600" : "text-red-500"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                lead.painPointClarity === "High" ? "bg-green-600 animate-pulse" :
                                lead.painPointClarity === "Medium" ? "bg-yellow-500" : "bg-red-500"
                              }`} />
                              {lead.painPointClarity === "High" ? "High" : lead.painPointClarity === "Medium" ? "Medium" : "Low"}
                            </span>
                          </td>

                          {/* Risk Flags */}
                          <td className="py-4 px-4 hidden sm:table-cell">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {lead.flags.length === 0 ? (
                                <span className="text-xs font-semibold text-green-600 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                                  <CheckCircle2 className="w-3 h-3 text-green-500" /> None
                                </span>
                              ) : (
                                lead.flags.map((flag, idx) => (
                                  <span key={idx} className="text-[10px] font-medium bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-md">
                                    {flag}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>

                          {/* Next Action */}
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center text-xs font-semibold bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd] px-3 py-1 rounded-full">
                              {lead.recommendedAction}
                            </span>
                          </td>

                          {/* Chevron Icon */}
                          <td className="py-4 px-4 text-center">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-[#6b7280]" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-[#6b7280]" />
                            )}
                          </td>
                        </motion.tr>

                        {/* Expandable Detail Panel */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <tr>
                              <td colSpan={11} className="p-0 border-t border-[#e2e8f0]">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.25, ease: "easeInOut" }}
                                  className="overflow-hidden bg-[#f4f6f9] p-6 lg:p-8"
                                >
                                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                    {/* Left Details block: Core Specs */}
                                    <div className="lg:col-span-4 space-y-6">
                                      <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm">
                                        <h4 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                          <User className="w-3.5 h-3.5 text-[#2563EB]" /> Lead Contact & Source
                                        </h4>
                                        <div className="space-y-3">
                                          <div>
                                            <span className="text-xs text-[#6b7280]">Key Contact Name</span>
                                            <p className="text-sm font-semibold text-[#0B1F33] mt-0.5">{lead.contact}</p>
                                          </div>
                                          <div>
                                            <span className="text-xs text-[#6b7280]">Lead Source Channel</span>
                                            <p className="text-sm font-medium text-[#0B1F33] mt-0.5">{lead.leadSource}</p>
                                          </div>
                                          <div>
                                            <span className="text-xs text-[#6b7280]">Decision Makers Engaged</span>
                                            <p className="text-sm font-semibold text-[#0B1F33] mt-0.5 flex items-center gap-1.5">
                                              <Users className="w-4 h-4 text-[#6b7280]" />
                                              {lead.decisionMakers} stakeholders
                                            </p>
                                          </div>
                                          <div>
                                            <span className="text-xs text-[#6b7280]">Pain Point Clarity</span>
                                            <p className="text-sm font-semibold text-[#0B1F33] mt-0.5 flex items-center gap-1.5">
                                              <span className={`w-2 h-2 rounded-full ${
                                                lead.painPointClarity === "High" ? "bg-green-500" :
                                                lead.painPointClarity === "Medium" ? "bg-yellow-500" : "bg-red-500"
                                              }`} />
                                              {lead.painPointClarity} clarity rating
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm">
                                        <h4 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                          <Building className="w-3.5 h-3.5 text-[#2563EB]" /> Engagement History
                                        </h4>
                                        <div className="space-y-3 text-xs text-[#0B1F33]">
                                          <div className="p-3 bg-[#f4f6f9] rounded-lg border border-[#e2e8f0]">
                                            <p className="font-semibold text-[#6b7280] uppercase text-[9px] tracking-wider">Past Activities</p>
                                            <p className="font-medium text-sm mt-1">{lead.previousEngagement}</p>
                                          </div>
                                          <div className="p-3 bg-[#f4f6f9] rounded-lg border border-[#e2e8f0]">
                                            <p className="font-semibold text-[#6b7280] uppercase text-[9px] tracking-wider">Executive Sales Notes</p>
                                            <p className="font-medium text-xs mt-1 text-[#0B1F33]/90 leading-relaxed">{lead.notes}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Middle Details block: Conversion Prob Mathematical Calculation */}
                                    <div className="lg:col-span-4 space-y-6">
                                      <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm h-full flex flex-col justify-between">
                                        <div>
                                          <h4 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" /> Conversion Probability Logic
                                          </h4>
                                          <div className="space-y-3 font-mono text-xs">
                                            {/* Formula entries */}
                                            <div className="flex justify-between items-center py-1 border-b border-dashed border-[#e2e8f0]">
                                              <span className="text-[#6b7280]">Base (Fit Score)</span>
                                              <span className="font-semibold text-[#0B1F33]">{lead.probabilityBreakdown.base}</span>
                                            </div>
                                            
                                            <div className="flex justify-between items-center py-1 border-b border-dashed border-[#e2e8f0] text-green-600">
                                              <span>Budget &ge; £40k Bonus</span>
                                              <span>+{lead.probabilityBreakdown.budgetBonus}</span>
                                            </div>

                                            <div className="flex justify-between items-center py-1 border-b border-dashed border-[#e2e8f0] text-green-600">
                                              <span>Timeline &le; 3 mos Bonus</span>
                                              <span>+{lead.probabilityBreakdown.timelineBonus}</span>
                                            </div>

                                            <div className="flex justify-between items-center py-1 border-b border-dashed border-[#e2e8f0] text-green-600">
                                              <span>&ge; 3 Decision Makers Bonus</span>
                                              <span>+{lead.probabilityBreakdown.decisionMakersBonus}</span>
                                            </div>

                                            {lead.probabilityBreakdown.engagementDeduction > 0 && (
                                              <div className="flex justify-between items-center py-1 border-b border-dashed border-[#e2e8f0] text-red-500">
                                                <span>Low/No Engagement Penalty</span>
                                                <span>-{lead.probabilityBreakdown.engagementDeduction}</span>
                                              </div>
                                            )}

                                            {lead.probabilityBreakdown.lowBudgetDeduction > 0 && (
                                              <div className="flex justify-between items-center py-1 border-b border-dashed border-[#e2e8f0] text-red-500">
                                                <span>Low Budget Penalty</span>
                                                <span>-{lead.probabilityBreakdown.lowBudgetDeduction}</span>
                                              </div>
                                            )}

                                            {lead.probabilityBreakdown.longTimelineDeduction > 0 && (
                                              <div className="flex justify-between items-center py-1 border-b border-dashed border-[#e2e8f0] text-red-500">
                                                <span>Long Sales Cycle Penalty</span>
                                                <span>-{lead.probabilityBreakdown.longTimelineDeduction}</span>
                                              </div>
                                            )}

                                            {lead.probabilityBreakdown.singleChampDeduction > 0 && (
                                              <div className="flex justify-between items-center py-1 border-b border-dashed border-[#e2e8f0] text-red-500">
                                                <span>Single Stakeholder Penalty</span>
                                                <span>-{lead.probabilityBreakdown.singleChampDeduction}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        <div className="pt-4 mt-6 border-t border-[#e2e8f0]">
                                          <div className="flex justify-between items-baseline mb-2">
                                            <span className="text-xs font-semibold text-[#0B1F33]">Capped Dynamic Prob</span>
                                            <span className="text-lg font-bold text-[#2563EB] font-mono">{lead.conversionProbability}%</span>
                                          </div>
                                          <p className="text-[10px] text-[#6b7280] leading-normal italic">
                                            Formula: [Base + Additions - Deductions] bounded strictly between 10% and 98%.
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Right Details block: Actionable Recommendation */}
                                    <div className="lg:col-span-4">
                                      <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm h-full flex flex-col justify-between">
                                        <div>
                                          <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider flex items-center gap-1.5">
                                              <BookOpen className="w-3.5 h-3.5 text-[#2563EB]" /> Advisor strategy (rule-based)
                                            </h4>
                                            <span className="inline-flex px-2 py-0.5 text-[9px] font-semibold bg-[#2563EB]/10 text-[#2563EB] rounded border border-[#2563EB]/20">
                                              ILLUSTRATIVE
                                            </span>
                                          </div>
                                          <div className="mb-4">
                                            <span className="text-xs text-[#6b7280]">Recommended Next Step</span>
                                            <div className="mt-1">
                                              <span className="inline-flex items-center text-sm font-semibold bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd] px-3 py-1 rounded-full">
                                                {lead.recommendedAction}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="text-xs text-[#0B1F33]/90 leading-relaxed space-y-2 mt-4">
                                            <p className="font-semibold text-xs text-[#0B1F33]">{lead.summarySentence}</p>
                                            <p className="text-[#6b7280] font-normal leading-relaxed">{lead.advisorText}</p>
                                          </div>
                                        </div>
                                        <div className="pt-4 mt-6 border-t border-[#e2e8f0] flex flex-wrap items-center justify-between gap-3">
                                          <OwnRowActions own={Boolean(lead.own)} busy={demo.busy}
                                            onEdit={() => { demo.clearError(); setForm({ mode: "edit", lead }); }}
                                            onDelete={() => { demo.clearError(); setForm({ mode: "delete", lead }); }} />
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setNotice(`Action noted for ${lead.company}: "${lead.recommendedAction}". This is a demo, so nothing is sent.`);
                                              window.scrollTo({ top: 0, behavior: "smooth" });
                                            }}
                                            className="text-xs bg-[#2563EB] hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                                          >
                                            <span>Execute Action</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Priority Opportunities Grid - Below Table */}
        <section className="bg-[#f4f6f9] border border-[#e2e8f0] rounded-xl p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
            <div>
              <h3 className="text-base md:text-lg font-semibold text-[#0B1F33] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                Priority Leads This Week
              </h3>
              <p className="text-xs text-[#6b7280] mt-0.5">
                Top 3 Hot-scored qualified pipeline items requiring immediate attention
              </p>
            </div>
            <span className="text-xs font-mono bg-white text-[#6b7280] px-2.5 py-1 rounded-lg border border-[#e2e8f0] self-start sm:self-auto font-medium">
              3 OPPORTUNITIES MATCHED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topOpportunities.map((lead) => (
              <div 
                key={lead.leadId} 
                className="bg-white border border-[#e2e8f0] hover:border-[#2563EB]/30 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#f4f6f9] text-xs font-semibold text-[#6b7280]">
                      #{lead.rank}
                    </span>
                    <span className="text-[10px] font-mono bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-full font-semibold">
                      HOT PIPELINE
                    </span>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-bold text-[#0B1F33] hover:text-[#2563EB] transition-colors">
                      {lead.company}
                    </h4>
                    <p className="text-xs text-[#6b7280] mt-0.5">{lead.industry} • {lead.contact}</p>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#f4f6f9] pt-4">
                    <div>
                      <span className="text-[10px] text-[#6b7280] uppercase tracking-wider font-semibold block">Conversion Prob</span>
                      <span className="text-base font-bold text-[#0B1F33] font-mono">{lead.conversionProbability}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6b7280] uppercase tracking-wider font-semibold block">Budget (GBP)</span>
                      <span className="text-base font-bold text-[#0B1F33] font-mono">{formatGBP(lead.budgetGbp)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#6b7280] mt-4 line-clamp-2 italic leading-relaxed border-t border-[#f4f6f9] pt-3">
                    "{lead.notes}"
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#f4f6f9] flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6b7280] font-medium">Recommended:</span>
                    <span className="font-semibold text-[#0369a1] bg-[#e0f2fe] px-2 py-0.5 rounded border border-[#bae6fd]">
                      {lead.recommendedAction}
                    </span>
                  </div>
                  <button 
                    onClick={() => toggleRow(lead.leadId)}
                    className="w-full text-center text-xs font-semibold bg-[#f4f6f9] hover:bg-[#2563EB]/10 text-[#0B1F33] hover:text-[#2563EB] py-2 rounded-lg border border-[#e2e8f0] transition-colors cursor-pointer"
                  >
                    View Pipeline Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
