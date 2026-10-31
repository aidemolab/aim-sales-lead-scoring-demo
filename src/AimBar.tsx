// The AIM navigation bar (logo, back to the service, All services, Book a call) comes from the
// shared script in index.html. Below it, this app shows only a slim "Interactive demo" note.
const SITE = 'https://aimsmartsolutions.tech';
const LABEL = 'Interactive demo · sample data';
const NOTE = 'Explore freely — figures are fictional. Your changes are kept for 24 hours.';

/** Slim note under the AIM bar: demo label and the 24-hour notice. */
export function AimBar() {
  return (
    <div className="bg-[#F8FAFC] text-[#0B1F33] border-b border-[#e2e8f0]" id="demo-strip">
      <p className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="rounded-full bg-[#0B1F33] px-3 py-0.5 font-semibold text-white" id="demo-chip">{LABEL}</span>
        <span>{NOTE}</span>
      </p>
    </div>
  );
}

/** Note repeated at the bottom of the page. */
export function AimFooter() {
  return (
    <footer className="border-t border-[#e2e8f0] bg-[#F8FAFC] text-[#0B1F33] text-sm px-4 py-6 text-center" id="aim-footer">
      <p className="max-w-3xl mx-auto">Sample data is fictional. A demonstration by <a className="font-semibold text-[#2563EB] underline underline-offset-2" href={`${SITE}/`}>AIM Smart Solutions</a> · <a className="underline underline-offset-2" href={`${SITE}/privacy/`}>Privacy</a></p>
    </footer>
  );
}
