export function BrandStyles() {
    return (
        <style>{`
      .lh-root {
        --lh-ink: #15171C;
        --lh-canvas: #F7F6F2;
        --lh-card: #FFFFFF;
        --lh-sidebar: #0E0F13;
        --lh-sidebar-soft: #1B1D24;
        --lh-accent: #FF5A1F;
        --lh-accent-deep: #DE470F;
        --lh-teal: #1F8A6F;
        --lh-amber: #C8860A;
        --lh-red: #C4453A;
        --lh-blue: #1F6FB2;
        --lh-border: #E6E3DC;
        --lh-muted: #6B6F76;
        background: var(--lh-canvas);
        color: var(--lh-ink);
      }
      .lh-root * { box-sizing: border-box; }
      .lh-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
      .lh-scroll::-webkit-scrollbar { width: 7px; height: 7px; }
      .lh-scroll::-webkit-scrollbar-thumb { background: var(--lh-border); border-radius: 4px; }
      @keyframes lh-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      .lh-fade-in { animation: lh-fade-in .16s ease-out; }
      @media (prefers-reduced-motion: reduce) { .lh-fade-in { animation: none; } }
      .lh-focus:focus-visible { outline: 2px solid var(--lh-accent); outline-offset: 2px; }
      .lh-btn { transition: transform .08s ease, background .15s ease, border-color .15s ease; }
      .lh-btn:active { transform: scale(0.97); }
      .lh-row:hover { background: #FBFAF7; }
    `}</style>
    )
}
