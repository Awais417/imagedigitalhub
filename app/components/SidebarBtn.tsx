'use client';

/** Fires a custom event that SidebarNav listens for to open the drawer. */
export function SidebarBtn() {
  return (
    <button
      aria-label="Open categories"
      onClick={() => window.dispatchEvent(new Event('open-sidebar'))}
      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150 active:scale-90 hover:bg-white/30 cursor-pointer"
      style={{ background: 'rgba(255,255,255,0.15)' }}
    >
      <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
        <rect x="0" y="0"   width="18" height="2.4" rx="1.2" fill="white" />
        <rect x="2" y="5.8" width="14" height="2.4" rx="1.2" fill="white" opacity="0.75" />
        <rect x="0" y="11.6" width="18" height="2.4" rx="1.2" fill="white" />
      </svg>
    </button>
  );
}
