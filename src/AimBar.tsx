const SITE = "https://aimsmartsolutions.tech/";
const base = import.meta.env.BASE_URL;

/** Pill used for the "Illustrative data" and "Not investment advice" labels. */
function Pill({ children, tone }: { children: string; tone: "amber" | "navy" }) {
  const cls = tone === "amber"
    ? "bg-[#FEF3C7] text-[#78350F] border-[#FCD34D]"
    : "bg-[#0B1F33] text-white border-white/40";
  return <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border ${cls}`}>{children}</span>;
}

/** AIM Smart Solutions bar shown at the top of every demo. */
export function AimBar() {
  return (
    <div className="bg-[#0B1F33] text-white border-b-4 border-[#F59E0B]" id="aim-bar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        <a href={SITE} className="flex items-center" aria-label="AIM Smart Solutions home">
          <span className="bg-white rounded-md px-2 py-1 flex"><img src={`${base}aim-logo.webp`} alt="AIM Smart Solutions" width={64} height={42} className="h-9 w-auto" /></span>
        </a>
        <a href={SITE} className="text-sm font-semibold text-white hover:text-[#F59E0B] underline underline-offset-4 decoration-[#2563EB]">&larr; Back to aimsmartsolutions.tech</a>
        <span className="ml-auto flex flex-wrap items-center gap-2">
          <Pill tone="amber">Illustrative data</Pill>
          
        </span>
      </div>
      <p className="bg-[#2563EB] text-white text-xs sm:text-sm px-4 sm:px-6 md:px-8 py-2 text-center">All figures in this demo are fictional demonstration data.</p>
    </div>
  );
}

/** Note repeated at the bottom of the page. */
export function AimFooter() {
  return (
    <footer className="border-t border-[#e2e8f0] bg-[#F8FAFC] text-[#0B1F33] text-sm px-4 py-6 text-center" id="aim-footer">
      <p className="max-w-3xl mx-auto">All figures in this demo are fictional demonstration data. A demonstration by <a className="font-semibold text-[#2563EB] underline underline-offset-2" href={SITE}>AIM Smart Solutions</a>.</p>
    </footer>
  );
}
