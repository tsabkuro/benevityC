export type KeyClaim = {
  claim: string;
  source_url: string;
};

export type CampaignKitData = {
  title: string;
  location: string;
  event_type: string;
  summary: string;
  key_claims: KeyClaim[];
  confidence_score: number;
  image_url?: string;
  error?: string;
};

const EVENT_TYPE_CONFIG: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  earthquake: { bg: "bg-orange-50",  text: "text-orange-700", border: "border-orange-200", icon: "🌍" },
  flood:      { bg: "bg-blue-50",    text: "text-blue-700",   border: "border-blue-200",   icon: "🌊" },
  hurricane:  { bg: "bg-purple-50",  text: "text-purple-700", border: "border-purple-200", icon: "🌀" },
  wildfire:   { bg: "bg-red-50",     text: "text-red-700",    border: "border-red-200",    icon: "🔥" },
  tsunami:    { bg: "bg-cyan-50",    text: "text-cyan-700",   border: "border-cyan-200",   icon: "🌊" },
  other:      { bg: "bg-neutral-50", text: "text-neutral-700",border: "border-neutral-200",icon: "⚠️" },
};

function ConfidenceBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-yellow-400" : "bg-red-400";
  const label =
    pct >= 75 ? "High confidence" : pct >= 50 ? "Moderate confidence" : "Low confidence";

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Source Confidence
        </span>
        <span className="text-sm font-semibold tabular-nums">{pct}% — {label}</span>
      </div>
      <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function CampaignKit({ kit }: { kit: CampaignKitData }) {
  if (kit.error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex gap-3 items-start">
        <span className="text-red-500 text-lg mt-0.5">⚠</span>
        <div>
          <p className="font-semibold text-red-700 text-sm">Generation failed</p>
          <p className="text-red-600 text-sm mt-0.5">{kit.error}</p>
        </div>
      </div>
    );
  }

  const cfg = EVENT_TYPE_CONFIG[kit.event_type?.toLowerCase()] ?? EVENT_TYPE_CONFIG.other;

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">

      {/* Hero image chosen by Gemini from scraped article images */}
      {kit.image_url && (
        <div className="relative w-full h-56 overflow-hidden">
          <img
            src={kit.image_url}
            alt={kit.title}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      {/* Coloured header band */}
      <div className={`${cfg.bg} ${cfg.border} border-b px-6 py-5`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{cfg.icon}</span>
          <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            {kit.event_type}
          </span>
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {kit.location}
          </span>
        </div>
        <h2 className="text-xl font-bold leading-snug text-neutral-900">{kit.title}</h2>
      </div>

      <div className="px-6 py-5 space-y-6">

        {/* Summary */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Summary
          </p>
          <p className="text-sm leading-relaxed text-neutral-700 whitespace-pre-line">
            {kit.summary}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Key Claims */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Key Claims
          </p>
          <ul className="space-y-3">
            {kit.key_claims.map((kc, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-neutral-100 text-neutral-500
                                 text-xs font-semibold flex items-center justify-center">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-800 leading-snug">{kc.claim}</p>
                  <a
                    href={kc.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600 hover:text-blue-800 hover:underline truncate max-w-full"
                  >
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    {new URL(kc.source_url).hostname}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Confidence */}
        <ConfidenceBar score={kit.confidence_score} />

      </div>
    </div>
  );
}
