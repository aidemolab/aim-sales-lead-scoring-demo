import { useEffect, useRef, useState } from 'react';

// Slim AIM top bar shared by the demo apps: logo (home), All demos, This service, booking button,
// and one subtle "Interactive demo · sample data" chip with an information note.
const SITE = 'https://aimsmartsolutions.tech';
const SERVICE_PATH = '/services/sales-marketing/';
const NOTE = 'Explore freely — figures are fictional. Your changes are kept for 24 hours.';
const base = import.meta.env.BASE_URL;

function InfoChip() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close); };
  }, [open]);
  return (
    <span ref={ref} className="relative inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 pl-3 pr-1 py-0.5 text-[11px] font-semibold text-[#e2e8f0]" id="demo-chip">
      Interactive demo · sample data
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="demo-chip-note"
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[13px] text-white hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] cursor-pointer" aria-label="About this demo">ⓘ</button>
      {open && (
        <span id="demo-chip-note" role="note" className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg bg-white p-3 text-xs font-normal leading-relaxed text-[#0B1F33] shadow-xl border border-[#e2e8f0]">
          {NOTE}
        </span>
      )}
    </span>
  );
}

/** Top bar shown above every demo. */
export function AimBar() {
  return (
    <div className="bg-[#0B1F33] text-white border-b-2 border-[#F59E0B]" id="aim-bar">
      <nav aria-label="AIM Smart Solutions" className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-2 flex flex-wrap items-center gap-x-1 gap-y-2">
        <a href={`${SITE}/`} className="mr-2 flex items-center rounded-md bg-white px-2 py-1" aria-label="AIM Smart Solutions home">
          <img src={`${base}aim-logo.webp`} alt="AIM Smart Solutions" width={64} height={42} className="h-8 w-auto" />
        </a>
        <a href={`${SITE}/live-demos/`} className="inline-flex min-h-[44px] items-center rounded-md px-3 text-sm font-semibold text-white hover:bg-white/10" data-nav="all-demos">All demos</a>
        <a href={`${SITE}${SERVICE_PATH}`} className="inline-flex min-h-[44px] items-center rounded-md px-3 text-sm font-semibold text-white hover:bg-white/10" data-nav="this-service">This service</a>
        <span className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <InfoChip />
          <a href={`${SITE}/book-appointment/`} className="inline-flex min-h-[44px] items-center rounded-md bg-[#F59E0B] px-3 text-xs sm:text-sm font-bold text-[#0B1F33] hover:bg-[#2563EB] hover:text-white" data-nav="book">Book a Free AI Opportunity Call</a>
        </span>
      </nav>
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
