export function BrandStyles() {
    return (
        <style>{`
      .lh-root {
        --lh-ink: #15181f;
        --lh-canvas: #f7f1e7;
        --lh-card: #fffdf9;
        --lh-sidebar: #11131a;
        --lh-sidebar-soft: #1a1d27;
        --lh-accent: #FF5A1F;
        --lh-accent-deep: #DE470F;
        --lh-teal: #1f8a6f;
        --lh-amber: #C8860A;
        --lh-red: #c4453a;
        --lh-blue: #1f6fb2;
        --lh-border: #e0d7c9;
        --lh-muted: #636a74;
        background: var(--lh-canvas);
        color: var(--lh-ink);
      }
      .lh-root * { box-sizing: border-box; }
      .lh-mono { font-family: var(--font-mono), ui-monospace, monospace; }
      .lh-scroll::-webkit-scrollbar { width: 7px; height: 7px; }
      .lh-scroll::-webkit-scrollbar-thumb { background: #cfbfaa; border-radius: 6px; }
      .lh-scroll::-webkit-scrollbar-track { background: #f4ecdf; }

      @keyframes lh-fade-in {
        from { opacity: 0; transform: translateY(6px) scale(0.996); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      .lh-fade-in { animation: lh-fade-in .22s cubic-bezier(.22,.8,.27,1); }
      @media (prefers-reduced-motion: reduce) { .lh-fade-in { animation: none; } }

      .lh-focus:focus-visible { outline: 2px solid var(--lh-accent); outline-offset: 2px; }

      .lh-btn { transition: transform .14s ease, background .2s ease, border-color .2s ease, box-shadow .2s ease; }
      .lh-btn:hover { box-shadow: 0 6px 14px rgba(17, 20, 26, 0.08); }
      .lh-btn:active { transform: translateY(1px) scale(0.985); }

      .lh-row:hover { background: #fff8ef; }

      .lh-surface {
        background: linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.87));
        backdrop-filter: blur(2px);
      }
    `}</style>
    )
}
