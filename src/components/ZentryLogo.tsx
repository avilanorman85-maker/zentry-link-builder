import logo from "@/assets/zentry-logo.png";

export function ZentryLogo({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src={logo}
      alt="Zentry Link"
      width={size}
      height={size}
      className={className}
      style={{ filter: "drop-shadow(0 0 12px rgba(167,139,250,0.5))" }}
    />
  );
}

export function ZentryWordmark({ size = 36 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <ZentryLogo size={size} />
      <div className="leading-tight">
        <div className="font-display font-bold text-foreground text-lg">Zentry Link</div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Zentry Company</div>
      </div>
    </div>
  );
}
