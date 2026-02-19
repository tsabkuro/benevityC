import { useState } from "react";

// Types matching campaignkits.json
interface KeyClaim {
  claim: string;
  source_url: string;
}

export interface Campaign {
  id: string;
  title: string;
  summary: string;
  location: string;
  event_type: string;
  key_claims: KeyClaim[];
  confidence_score: number;
  // Optional hero image URL (if not provided, a simple gradient will be used)
  hero_image?: string;
}

interface CampaignCardProps {
  campaign: Campaign;
}

// Colour palette
const COLORS = {
  purple: "#6C3AED",
  green: "#16A34A",
  red: "#E8503A",
  blue: "#3B82F6",
  darkGrey: "#1F2937",
  medGrey: "#6B7280",
  white: "#FFFFFF",
};

// Map disaster types to an emoji icon + accent color for the tag
const EVENT_TYPE_META: Record<string, { icon: string; color: string }> = {
  Flood: { icon: "🌊", color: "#3B82F6" },
  Earthquake: { icon: "🪨", color: "#E8503A" },
  Wildfire: { icon: "🔥", color: "#E8503A" },
  Drought: { icon: "☀️", color: "#D97706" },
  Cyclone: { icon: "🌀", color: "#6C3AED" },
  Conflict: { icon: "⚠️", color: "#E8503A" },
};

function getEventMeta(type: string) {
  return EVENT_TYPE_META[type] ?? { icon: "🚨", color: COLORS.medGrey };
}

function HeroImage({ eventType, imageUrl }: { eventType: string; imageUrl?: string }) {
  const meta = getEventMeta(eventType);
  // Default stub hero image (from the user's provided URL)
  const defaultHero = "https://cdn.cookielaw.org/logos/f2660c9a-abcb-4c03-b41f-49f0ccedd385/407ab338-5453-4fc1-9242-5b40766859b9/1da4e8d2-7371-44db-8b60-9e8065641f69/Benevity_Logo_Lg.png";
  const src = imageUrl ?? defaultHero;

  return (
    <div style={{ width: "100%", height: 180, position: "relative", overflow: "hidden", borderRadius: "12px 12px 0 0" }}>
      <img
        src={src}
        alt={`${eventType} hero`}
        loading="lazy"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        onError={(e) => {
          // If image fails, hide it to reveal a simple gradient fallback done with CSS background
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />

      {/* Gradient fallback (visible when image fails or intentionally hidden) */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `linear-gradient(135deg, ${meta.color}22 0%, ${meta.color}44 100%)` }} />

      {/* Small overlay with event icon and label */}
      <div style={{ position: "absolute", left: 12, top: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 28 }}>{meta.icon}</span>
        {/*<span style={{ fontSize: 11, fontWeight: 700, color: COLORS.white, textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>Hero image</span>*/}
      </div>
    </div>
  );
}

function DisasterTag({ type }: { type: string }) {
  const meta = getEventMeta(type);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px",
        borderRadius: 20,
        border: `1.5px solid ${meta.color}`,
        background: `${meta.color}12`,
        color: meta.color,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {meta.icon} {type}
    </span>
  );
}

function LocationPin({ location }: { location: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: COLORS.medGrey, fontSize: 13 }}>
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={COLORS.medGrey} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
      {location}
    </span>
  );
}

function KeyClaimsSection({ claims }: { claims: KeyClaim[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? claims : claims.slice(0, 2);

  return (
    <div style={{ marginTop: 16 }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: COLORS.medGrey, marginBottom: 8 }}>
        Key Claims
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {visible.map((kc, i) => (
          <li key={i} style={{ background: "#F9FAFB", borderLeft: `3px solid ${COLORS.purple}`, borderRadius: "0 8px 8px 0", padding: "8px 12px" }}>
            <p style={{ margin: 0, fontSize: 13, color: COLORS.darkGrey, lineHeight: 1.5 }}>{kc.claim}</p>
            <a href={kc.source_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 4, fontSize: 11, color: COLORS.blue, textDecoration: "none", wordBreak: "break-all" }}>
              🔗 Source
            </a>
          </li>
        ))}
      </ul>
      {claims.length > 2 && (
        <button onClick={() => setExpanded((s) => !s)} style={{ marginTop: 8, background: "none", border: "none", cursor: "pointer", color: COLORS.purple, fontSize: 13, fontWeight: 600, padding: 0 }}>
          {expanded ? "Show less ▲" : `Show ${claims.length - 2} more ▼`}
        </button>
      )}
    </div>
  );
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const { title, location, event_type, summary, key_claims, confidence_score } = campaign;

  // detect role from localStorage
  let storedRole: string | null = null;
  try {
    if (typeof window !== "undefined") storedRole = localStorage.getItem("role");
  } catch {
    storedRole = null;
  }
  const isDonor = storedRole === "donor";

  // donors start collapsed and can open fullscreen overlay; admins show full inline card
  const [expanded, setExpanded] = useState<boolean>(!isDonor);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const confidenceColor = confidence_score >= 80 ? COLORS.green : confidence_score >= 50 ? "#D97706" : COLORS.red;

  return (
    <div style={{ position: "relative" }}>
      {/* compact card */}
      <div style={{ background: COLORS.white, borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", overflow: "hidden", width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", transition: "transform 0.15s" }}>
        {/* Hero (use campaign's hero_image if provided) */}
        <HeroImage eventType={event_type} imageUrl={campaign.hero_image} />

        <div style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <DisasterTag type={event_type} />
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: `${COLORS.green}12`, border: `1.5px solid ${COLORS.green}`, color: COLORS.green, fontSize: 12, fontWeight: 600 }}>✓ Vetted</span>
            <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: confidenceColor }}>{confidence_score}% confidence</span>
          </div>

          <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: COLORS.darkGrey }}>{title}</h3>
          <LocationPin location={location} />

          <p style={{ marginTop: 12, fontSize: 13.5, color: COLORS.medGrey, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: expanded ? 4 : 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{summary}</p>

          {!expanded && isDonor ? (
            <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
              <button onClick={() => { setExpanded(true); setIsFullscreen(true); }} style={{ padding: "10px 18px", background: COLORS.purple, color: COLORS.white, border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
                View details
              </button>
            </div>
          ) : (
            <>
              <KeyClaimsSection claims={key_claims} />

              <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                <button style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: COLORS.green, color: COLORS.white, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Donate Now</button>
                {!isDonor && (
                  <button style={{ padding: "10px 14px", borderRadius: 8, border: `1.5px solid ${COLORS.red}`, background: "transparent", color: COLORS.red, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Report as Falsy</button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Fullscreen overlay - per-card; multiple cards may open independently */}
      {isFullscreen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ width: "100%", maxWidth: 980, height: "90vh", background: COLORS.white, borderRadius: 12, boxShadow: "0 18px 60px rgba(16,24,40,0.4)", overflow: "auto", position: "relative", padding: 24, display: "flex", flexDirection: "column" }}>
            <button aria-label="Close details" onClick={() => { setIsFullscreen(false); setExpanded(false); }} style={{ position: "absolute", top: 12, right: 12, padding: "8px 10px", borderRadius: 8, border: "none", background: "#F3F4F6", cursor: "pointer", fontWeight: 700 }}>
              Close
            </button>

            <div style={{ marginBottom: 18 }}>
              <HeroImage eventType={event_type} imageUrl={campaign.hero_image} />
            </div>

            <div style={{ padding: "0 6px 24px", flex: "1 1 auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                <DisasterTag type={event_type} />
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 20, background: `${COLORS.green}12`, border: `1.5px solid ${COLORS.green}`, color: COLORS.green, fontSize: 13, fontWeight: 700 }}>✓ Vetted</span>
                <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: confidenceColor }}>{confidence_score}% confidence</span>
              </div>

              <h2 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: COLORS.darkGrey }}>{title}</h2>
              <div style={{ marginBottom: 12 }}><LocationPin location={location} /></div>

              <div style={{ color: COLORS.medGrey, lineHeight: 1.8, marginBottom: 18 }}>{summary}</div>

              <KeyClaimsSection claims={key_claims} />

              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <button style={{ flex: 1, padding: "14px 0", borderRadius: 10, border: "none", background: COLORS.green, color: COLORS.white, fontWeight: 800, fontSize: 16, cursor: "pointer" }}>Donate Now</button>
                {!isDonor && (
                  <button style={{ padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${COLORS.red}`, background: "transparent", color: COLORS.red, fontWeight: 700, cursor: "pointer" }}>Report as Falsy</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CampaignCard;
