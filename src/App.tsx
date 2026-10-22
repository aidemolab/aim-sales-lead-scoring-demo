import { useState, useMemo, Fragment } from "react";
import { 
  processLeads, 
  LeadCalculated 
} from "./data";
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

export default function App() {
  const allLeads = useMemo(() => processLeads(), []);
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
    <div className="min-h-screen bg-white text-[#1a1d27] selection:bg-[#3b82f6] selection:text-white antialiased pb-16">
      {/* Upper Navigation/Branding Panel */}
      <header className="border-b border-[#e2e8f0] py-6 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center bg-[#3b82f6] text-white p-2 rounded-lg">
                <Target className="w-6 h-6" id="dashboard-logo-icon" />
              </span>
              <h1 className="text-xl md:text-2xl font-semibold text-[#1a1d27] tracking-tight">
                Sales Lead Scoring Dashboard
              </h1>
            </div>
            <p className="text-sm text-[#6b7280] mt-1.5 font-normal">
              AI-powered lead prioritisation and next action recommendations
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-[#f4f6f9] text-[#6b7280] px-3.5 py-1.5 rounded-lg border border-[#e2e8f0] self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>DATA ENGINE: ACTIVE</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-12 mt-8 space-y-8">
        {/* KPI Cards Row */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Total Leads */}
          <div className="bg-[#f4f6f9] border border-[#e2e8f0] rounded-xl p-5 hover:border-[#3b82f6]/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Total Leads</span>
              <Compass className="w-4 h-4 text-[#6b7280]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-bold text-[#1a1d27]">{stats.total}</span>
              <span className="text-xs text-[#6b7280] font-medium">100% Active</span>
            </div>
            <div className="w-full bg-[#e2e8f0] h-[3px] rounded-full mt-4">
              <div className="bg-[#1a1d27] h-full rounded-full" style={{ width: "100%" }} />
            </div>
          </div>

          {/* Hot Leads */}
          <div className="bg-[#f4f6f9] border border-[#e2e8f0] rounded-xl p-5 hover:border-green-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Hot Leads</span>
              <Zap className="w-4 h-4 text-[#166534]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-bold text-[#1a1d27]">{stats.hot}</span>
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
              <span className="text-2xl md:text-3xl font-bold text-[#1a1d27]">{stats.warm}</span>
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
              <span className="text-2xl md:text-3xl font-bold text-[#1a1d27]">{stats.cold}</span>
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
                      ? "bg-[#3b82f6] text-white border-[#3b82f6] shadow-sm"
                      : "bg-white text-[#1a1d27] border-[#e2e8f0] hover:bg-slate-50"
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
              className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-[#e2e8f0] bg-white focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6b7280] hover:text-[#1a1d27]"
              >
                Clear
              </button>
            )}
          </div>
        </section>

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
                        <tr
                          onClick={() => toggleRow(lead.leadId)}
                          className={`group cursor-pointer transition-colors ${
                            isExpanded ? "bg-[#f0f4ff]" : "hover:bg-[#f0f4ff]/40 bg-white"
                          }`}
                        >
                          {/* Rank */}
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#f4f6f9] group-hover:bg-[#3b82f6]/10 text-xs font-semibold text-[#1a1d27]">
                              {lead.rank}
                            </span>
                          </td>

                          {/* Company */}
                          <td className="py-4 px-5">
                            <div>
                              <div className="font-semibold text-sm text-[#1a1d27] group-hover:text-[#3b82f6] transition-colors flex items-center gap-1.5">
                                <span>{lead.company}</span>
                              </div>
                              <div className="text-xs text-[#6b7280] mt-0.5 flex items-center gap-1">
                                <span className="font-medium text-[#1a1d27]/70">{lead.contact}</span>
                                <span>•</span>
                                <span>{lead.leadSource}</span>
                              </div>
                            </div>
                          </td>

                          {/* Industry */}
                          <td className="py-4 px-4 text-xs text-[#1a1d27] font-medium hidden md:table-cell">
                            {lead.industry}
                          </td>

                          {/* Score Badge */}
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getScoreBadgeStyles(lead.scoreCategory)}`}>
                              {lead.scoreCategory}
                            </span>
                          </td>

                          {/* Budget */}
                          <td className="py-4 px-4 text-xs font-mono font-medium text-[#1a1d27]">
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
                                <span className="text-xs font-mono font-semibold text-[#1a1d27]">
                                  {lead.conversionProbability}%
                                </span>
                              </div>
                              <div className="w-full bg-[#e2e8f0] h-[6px] rounded-[3px] overflow-hidden">
                                <div 
                                  className="bg-[#3b82f6] h-full rounded-[3px] transition-all duration-500" 
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
                        </tr>

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
                                          <User className="w-3.5 h-3.5 text-[#3b82f6]" /> Lead Contact & Source
                                        </h4>
                                        <div className="space-y-3">
                                          <div>
                                            <span className="text-xs text-[#6b7280]">Key Contact Name</span>
                                            <p className="text-sm font-semibold text-[#1a1d27] mt-0.5">{lead.contact}</p>
                                          </div>
                                          <div>
                                            <span className="text-xs text-[#6b7280]">Lead Source Channel</span>
                                            <p className="text-sm font-medium text-[#1a1d27] mt-0.5">{lead.leadSource}</p>
                                          </div>
                                          <div>
                                            <span className="text-xs text-[#6b7280]">Decision Makers Engaged</span>
                                            <p className="text-sm font-semibold text-[#1a1d27] mt-0.5 flex items-center gap-1.5">
                                              <Users className="w-4 h-4 text-[#6b7280]" />
                                              {lead.decisionMakers} stakeholders
                                            </p>
                                          </div>
                                          <div>
                                            <span className="text-xs text-[#6b7280]">Pain Point Clarity</span>
                                            <p className="text-sm font-semibold text-[#1a1d27] mt-0.5 flex items-center gap-1.5">
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
                                          <Building className="w-3.5 h-3.5 text-[#3b82f6]" /> Engagement History
                                        </h4>
                                        <div className="space-y-3 text-xs text-[#1a1d27]">
                                          <div className="p-3 bg-[#f4f6f9] rounded-lg border border-[#e2e8f0]">
                                            <p className="font-semibold text-[#6b7280] uppercase text-[9px] tracking-wider">Past Activities</p>
                                            <p className="font-medium text-sm mt-1">{lead.previousEngagement}</p>
                                          </div>
                                          <div className="p-3 bg-[#f4f6f9] rounded-lg border border-[#e2e8f0]">
                                            <p className="font-semibold text-[#6b7280] uppercase text-[9px] tracking-wider">Executive Sales Notes</p>
                                            <p className="font-medium text-xs mt-1 text-[#1a1d27]/90 leading-relaxed">{lead.notes}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Middle Details block: Conversion Prob Mathematical Calculation */}
                                    <div className="lg:col-span-4 space-y-6">
                                      <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm h-full flex flex-col justify-between">
                                        <div>
                                          <h4 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5 text-[#3b82f6]" /> Conversion Probability Logic
                                          </h4>
                                          <div className="space-y-3 font-mono text-xs">
                                            {/* Formula entries */}
                                            <div className="flex justify-between items-center py-1 border-b border-dashed border-[#e2e8f0]">
                                              <span className="text-[#6b7280]">Base (Fit Score)</span>
                                              <span className="font-semibold text-[#1a1d27]">{lead.probabilityBreakdown.base}</span>
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
                                            <span className="text-xs font-semibold text-[#1a1d27]">Capped Dynamic Prob</span>
                                            <span className="text-lg font-bold text-[#3b82f6] font-mono">{lead.conversionProbability}%</span>
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
                                              <BookOpen className="w-3.5 h-3.5 text-[#3b82f6]" /> AI Advisor Strategy
                                            </h4>
                                            <span className="inline-flex px-2 py-0.5 text-[9px] font-semibold bg-[#3b82f6]/10 text-[#3b82f6] rounded border border-[#3b82f6]/20">
                                              ADVISOR ACTIVE
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
                                          <div className="text-xs text-[#1a1d27]/90 leading-relaxed space-y-2 mt-4">
                                            <p className="font-semibold text-xs text-[#1a1d27]">{lead.summarySentence}</p>
                                            <p className="text-[#6b7280] font-normal leading-relaxed">{lead.advisorText}</p>
                                          </div>
                                        </div>
                                        <div className="pt-4 mt-6 border-t border-[#e2e8f0] flex justify-end">
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              alert(`Action initiated for ${lead.company}: "${lead.recommendedAction}"`);
                                            }}
                                            className="text-xs bg-[#3b82f6] hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
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
              <h3 className="text-base md:text-lg font-semibold text-[#1a1d27] flex items-center gap-2">
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
                className="bg-white border border-[#e2e8f0] hover:border-[#3b82f6]/30 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
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
                    <h4 className="text-sm font-bold text-[#1a1d27] hover:text-[#3b82f6] transition-colors">
                      {lead.company}
                    </h4>
                    <p className="text-xs text-[#6b7280] mt-0.5">{lead.industry} • {lead.contact}</p>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#f4f6f9] pt-4">
                    <div>
                      <span className="text-[10px] text-[#6b7280] uppercase tracking-wider font-semibold block">Conversion Prob</span>
                      <span className="text-base font-bold text-[#1a1d27] font-mono">{lead.conversionProbability}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6b7280] uppercase tracking-wider font-semibold block">Budget (GBP)</span>
                      <span className="text-base font-bold text-[#1a1d27] font-mono">{formatGBP(lead.budgetGbp)}</span>
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
                    className="w-full text-center text-xs font-semibold bg-[#f4f6f9] hover:bg-[#3b82f6]/10 text-[#1a1d27] hover:text-[#3b82f6] py-2 rounded-lg border border-[#e2e8f0] transition-colors cursor-pointer"
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
