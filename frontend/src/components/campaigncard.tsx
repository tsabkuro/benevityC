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
    Flood:    { icon: "🌊", color: "#3B82F6" },
    Earthquake: { icon: "🪨", color: "#E8503A" },
    Wildfire:   { icon: "🔥", color: "#E8503A" },
    Drought:    { icon: "☀️", color: "#D97706" },
    Cyclone:    { icon: "🌀", color: "#6C3AED" },
    Conflict:   { icon: "⚠️", color: "#E8503A" },
};

function getEventMeta(type: string) {
    return EVENT_TYPE_META[type] ?? { icon: "🚨", color: COLORS.medGrey };
}

// Stub hero image — replace with real images later
function HeroImage({ eventType }: { eventType: string }) {
    const meta = getEventMeta(eventType);
    return (
        <div
            style={{
                width: "100%",
                height: "180px",
                background: `linear-gradient(135deg, ${meta.color}22 0%, ${meta.color}44 100%)`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "12px 12px 0 0",
                borderBottom: `3px solid ${meta.color}33`,
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Decorative circles */}
            <div style={{
                position: "absolute", top: -30, right: -30,
                width: 120, height: 120, borderRadius: "50%",
                background: `${meta.color}18`,
            }} />
            <div style={{
                position: "absolute", bottom: -20, left: -20,
                width: 80, height: 80, borderRadius: "50%",
                background: `${meta.color}18`,
            }} />
            <span style={{ fontSize: 48, lineHeight: 1 }}>{meta.icon}</span>
            <span style={{
                marginTop: 8,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: meta.color,
                opacity: 0.7,
            }}>
                Hero image placeholder
            </span>
        </div>
    );
}

function DisasterTag({ type }: { type: string }) {
    const meta = getEventMeta(type);
    return (
        <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 10px",
            borderRadius: 20,
            border: `1.5px solid ${meta.color}`,
            background: `${meta.color}12`,
            color: meta.color,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.04em",
        }}>
            {meta.icon} {type}
        </span>
    );
}

function LocationPin({ location }: { location: string }) {
    return (
        <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            color: COLORS.medGrey,
            fontSize: 13,
        }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                 stroke={COLORS.medGrey} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
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
            <p style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: COLORS.medGrey,
                marginBottom: 8,
            }}>
                Key Claims
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {visible.map((kc, i) => (
                    <li key={i} style={{
                        background: "#F9FAFB",
                        borderLeft: `3px solid ${COLORS.purple}`,
                        borderRadius: "0 8px 8px 0",
                        padding: "8px 12px",
                    }}>
                        <p style={{ margin: 0, fontSize: 13, color: COLORS.darkGrey, lineHeight: 1.5 }}>
                            {kc.claim}
                        </p>
                        <a
                            href={kc.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: "inline-block",
                                marginTop: 4,
                                fontSize: 11,
                                color: COLORS.blue,
                                textDecoration: "none",
                                wordBreak: "break-all",
                            }}
                            onMouseOver={e => (e.currentTarget.style.textDecoration = "underline")}
                            onMouseOut={e => (e.currentTarget.style.textDecoration = "none")}
                        >
                            🔗 Source
                        </a>
                    </li>
                ))}
            </ul>
            {claims.length > 2 && (
                <button
                    onClick={() => setExpanded(x => !x)}
                    style={{
                        marginTop: 8,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: COLORS.purple,
                        fontSize: 13,
                        fontWeight: 600,
                        padding: 0,
                    }}
                >
                    {expanded ? "Show less ▲" : `Show ${claims.length - 2} more ▼`}
                </button>
            )}
        </div>
    );
}

export function CampaignCard({ campaign }: CampaignCardProps) {
    const { title, location, event_type, summary, key_claims, confidence_score } = campaign;

    // Detect role (admin/donor) from localStorage; default to "admin" behavior
    let storedRole: string | null = null;
    try {
        if (typeof window !== "undefined") storedRole = localStorage.getItem("role");
    } catch {
        storedRole = null;
    }

    const isDonor = storedRole === "donor";

    // Collapsed for donors by default: they see a compact preview and can click to view details
    const [expanded, setExpanded] = useState<boolean>(!isDonor);

    const confidenceColor =
        confidence_score >= 80 ? COLORS.green :
            confidence_score >= 50 ? "#D97706" :
                COLORS.red;

    return (
        <div style={{
            background: COLORS.white,
            borderRadius: 14,
            boxShadow: "0 2px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)",
            overflow: "hidden",
            width: "100%",
            maxWidth: 420,
            display: "flex",
            flexDirection: "column",
            transition: "box-shadow 0.2s, transform 0.2s",
        }}
             onMouseOver={e => {
                 (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 28px rgba(108,58,237,0.14), 0 2px 8px rgba(0,0,0,0.08)";
                 (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
             }}
             onMouseOut={e => {
                 (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)";
                 (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
             }}
        >
            {/* Hero */}
            <HeroImage eventType={event_type} />

            {/* Body */}
            <div style={{ padding: "18px 20px 20px" }}>
                {/* Tags row */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                    <DisasterTag type={event_type} />
                    {/* Vetted badge */}
                    <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "3px 10px", borderRadius: 20,
                        background: `${COLORS.green}12`,
                        border: `1.5px solid ${COLORS.green}`,
                        color: COLORS.green,
                        fontSize: 12, fontWeight: 600,
                    }}>
                        ✓ Vetted
                    </span>
                    {/* Confidence */}
                    <span style={{
                        marginLeft: "auto",
                        fontSize: 12,
                        fontWeight: 700,
                        color: confidenceColor,
                    }}>
                        {confidence_score}% confidence
                    </span>
                </div>

                {/* Title */}
                <h2 style={{
                    margin: "0 0 6px",
                    fontSize: 17,
                    fontWeight: 700,
                    color: COLORS.darkGrey,
                    lineHeight: 1.35,
                }}>
                    {title}
                </h2>

                {/* Location */}
                <LocationPin location={location} />

                {/* Summary: render a short excerpt for donors (2 lines) and full summary when expanded */}
                <p style={{
                    marginTop: 12,
                    fontSize: 13.5,
                    color: COLORS.medGrey,
                    lineHeight: 1.6,
                    display: "-webkit-box",
                    WebkitLineClamp: expanded ? 4 : 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                }}>
                    {summary}
                </p>

                {/* If not expanded (donor initial state) prompt to view details */}
                {!expanded && isDonor ? (
                    <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
                        <button
                            onClick={() => setExpanded(true)}
                            style={{
                                padding: "10px 18px",
                                background: COLORS.purple,
                                color: COLORS.white,
                                border: "none",
                                borderRadius: 8,
                                cursor: "pointer",
                                fontWeight: 700,
                            }}
                        >
                            View details
                        </button>
                    </div>
                ) : (
                    // Expanded/full view
                    <>
                        {/* Key Claims */}
                        <KeyClaimsSection claims={key_claims} />

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                            <button style={{
                                flex: 1,
                                padding: "10px 0",
                                borderRadius: 8,
                                border: "none",
                                background: COLORS.green,
                                color: COLORS.white,
                                fontWeight: 700,
                                fontSize: 14,
                                cursor: "pointer",
                                letterSpacing: "0.02em",
                            }}>
                                Donate Now
                            </button>
                            {/* Report button only for non-donor roles */}
                            {!isDonor && (
                                <button style={{
                                    padding: "10px 14px",
                                    borderRadius: 8,
                                    border: `1.5px solid ${COLORS.red}`,
                                    background: "transparent",
                                    color: COLORS.red,
                                    fontWeight: 600,
                                    fontSize: 13,
                                    cursor: "pointer",
                                }}>
                                    Report as Falsy
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default CampaignCard;