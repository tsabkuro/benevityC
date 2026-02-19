import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API = "http://localhost:8000/api";

const EVENT_TYPE_LABELS: Record<string, string> = {
  EQ: "earthquake",
  TC: "tropical cyclone",
  FL: "flood",
  WF: "wildfire",
  VO: "volcano",
  DR: "drought",
  TS: "tsunami",
};

function ContentCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-background p-4 ${className}`}>
      {children}
    </div>
  );
}

type DisasterEvent = {
  event_type: string;
  title: string;
  country: string;
  severity: string;
  alert_level: string;
  lat: number;
  lon: number;
  date: string;
  gdacs_url: string;
};

type Article = {
  url: string;
  title: string;
  text: string;
  authors: string[];
  publish_date: string | null;
  source: string;
  summary: string;
};

function EventCard({
  event,
  onScrape,
}: {
  event: DisasterEvent;
  onScrape: (event: DisasterEvent) => void;
}) {
  const label = EVENT_TYPE_LABELS[event.event_type.toUpperCase()] || event.event_type;
  return (
    <ContentCard>
      <div className="space-y-3">
        <div className="text-base space-y-1">
          <div><span className="font-semibold">Event Type:</span> {event.event_type} ({label})</div>
          <div><span className="font-semibold">Title:</span> {event.title}</div>
          <div><span className="font-semibold">Country:</span> {event.country}</div>
          <div><span className="font-semibold">Severity:</span> {event.severity}</div>
          <div><span className="font-semibold">Alert Level:</span> {event.alert_level}</div>
          <div><span className="font-semibold">Lat/Lon:</span> {event.lat}, {event.lon}</div>
          <div><span className="font-semibold">Date:</span> {event.date}</div>
          <div><span className="font-semibold">GDACS URL:</span>{" "}
            <a href={event.gdacs_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
              {event.gdacs_url}
            </a>
          </div>
        </div>
        <Button
          className="h-9 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-700 text-base"
          onClick={() => onScrape(event)}
        >
          Scrape
        </Button>
      </div>
    </ContentCard>
  );
}

function ArticleCard({ article, isNew }: { article: Article; isNew?: boolean }) {
  return (
    <ContentCard className={isNew ? "animate-pop-in" : ""}>
      <div className="text-base space-y-1">
        <div><span className="font-semibold">Title:</span> {article.title}</div>
        <div><span className="font-semibold">URL:</span>{" "}
          <a href={article.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
            {article.url}
          </a>
        </div>
        <div><span className="font-semibold">Author:</span> {article.authors.length > 0 ? article.authors.join(", ") : "Unknown"}</div>
        <div><span className="font-semibold">Published:</span> {article.publish_date || "Unknown"}</div>
        <div className="pt-1">
          <span className="font-semibold">Content:</span>
          <p className="mt-1 text-muted-foreground leading-relaxed whitespace-pre-line">{article.text}</p>
        </div>
      </div>
    </ContentCard>
  );
}

type LogEntry = {
  message: string;
  type: "status" | "progress" | "error" | "done";
};

function ScrapeLog({ logs }: { logs: LogEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (logs.length === 0) return null;

  const lastIndex = logs.length - 1;

  return (
    <div className="rounded-xl border border-neutral-700 bg-neutral-950 text-white p-4 mb-4">
      <div ref={scrollRef} className="max-h-40 overflow-y-auto space-y-1 font-mono text-sm">
        {logs.map((log, i) => (
          <div
            key={i}
            className={
              (log.type === "error"
                ? "text-red-400"
                : log.type === "done"
                  ? "text-green-400"
                  : log.message.startsWith("Scraped:")
                    ? "text-green-400"
                    : log.message.includes("Skipped")
                      ? "text-yellow-400"
                      : log.type === "status"
                        ? "text-blue-400"
                        : "text-neutral-400") +
              (i === lastIndex ? " animate-pop-in" : "")
            }
          >
            {log.message}
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [tab, setTab] = useState<"events" | "scrape">("events");
  const [events, setEvents] = useState<DisasterEvent[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scrapeLogs, setScrapeLogs] = useState<LogEntry[]>([]);
  const [scrapeSource, setScrapeSource] = useState<string | null>(null);

  async function fetchEvents() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/events`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      setEvents(data.events);
    } catch (err) {
      setError("Failed to fetch events: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }

  const runScrape = useCallback(async (q: string, source?: string, eventDate?: string, country?: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError("");
    setArticles([]);
    setScrapeLogs([]);
    setScrapeSource(source || null);

    const body: Record<string, string> = { query: q.trim() };
    if (eventDate) body.event_date = eventDate;
    if (country) body.country = country;

    try {
      const res = await fetch(`${API}/scrape/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader");

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6);
          try {
            const event = JSON.parse(jsonStr);
            if (event.type === "article") {
              setArticles((prev) => [event.article, ...prev]);
              setScrapeLogs((prev) => [
                ...prev,
                { message: "Scraped: " + event.article.title, type: "status" },
              ]);
            } else if (event.type === "done") {
              setScrapeLogs((prev) => [
                ...prev,
                { message: "Done.", type: "done" },
              ]);
            } else if (event.type === "error") {
              setError(event.message);
              setScrapeLogs((prev) => [
                ...prev,
                { message: event.message, type: "error" },
              ]);
            } else {
              setScrapeLogs((prev) => [
                ...prev,
                { message: event.message, type: event.type },
              ]);
            }
          } catch {
            // skip malformed JSON
          }
        }
      }
    } catch {
      setError("Failed to connect to scraper");
    } finally {
      setLoading(false);
    }
  }, []);

  const [scrapeEvent, setScrapeEvent] = useState<DisasterEvent | null>(null);

  function handleEventScrape(event: DisasterEvent) {
    const label = EVENT_TYPE_LABELS[event.event_type.toUpperCase()] || event.event_type;
    const q = label + " " + event.country;
    const params = new URLSearchParams({
      query: q,
      source: event.title,
      country: event.country,
      event_json: JSON.stringify(event),
    });
    if (event.date) params.set("event_date", event.date);
    window.open("?" + params.toString(), "_blank");
  }

  // On mount, check URL params for auto-scrape from a new tab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("query");
    const source = params.get("source");
    const eventDate = params.get("event_date");
    const eventJson = params.get("event_json");
    const country = params.get("country");
    if (q) {
      setTab("scrape");
      setQuery(q);
      if (eventJson) {
        try { setScrapeEvent(JSON.parse(eventJson)); } catch { /* ignore */ }
      }
      runScrape(q, source || undefined, eventDate || undefined, country || undefined);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [runScrape]);

  return (
    <div className="mx-auto max-w-[1280px] px-6 pt-6 pb-12 font-normal">
      <div className="flex justify-center gap-2 mb-8">
        <Button
          className={`h-9 rounded-full px-5 font-normal text-base shadow-none ${
            tab === "events"
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-white text-foreground border border-border hover:bg-muted"
          }`}
          onClick={() => { setTab("events"); setError(""); }}
        >
          Events
        </Button>
        <Button
          className={`h-9 rounded-full px-5 font-normal text-base shadow-none ${
            tab === "scrape"
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-white text-foreground border border-border hover:bg-muted"
          }`}
          onClick={() => { setTab("scrape"); setError(""); }}
        >
          Scrape
        </Button>
      </div>

      <h1 className="text-2xl font-normal mb-1">News Scraper</h1>
      <p className="text-base text-muted-foreground mb-6">
        GDACS disaster events & article scraper
      </p>

      {tab === "events" && (
        <>
          <div className="mb-6">
            <Button
              className="h-9 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-700 text-base"
              onClick={fetchEvents}
              disabled={loading}
            >
              {loading ? "Loading..." : "Fetch GDACS Events"}
            </Button>
          </div>
          {error && (
            <p className="text-base text-red-500 mb-4">{error}</p>
          )}
          {events.length > 0 && (
            <p className="text-base text-muted-foreground mb-4">
              {events.length} events found:
            </p>
          )}
          <div className="flex flex-col gap-3">
            {events.map((e, i) => (
              <EventCard key={i} event={e} onScrape={handleEventScrape} />
            ))}
          </div>
        </>
      )}

      {tab === "scrape" && (
        <>
          {scrapeSource && !scrapeEvent && (
            <p className="text-base text-muted-foreground mb-2">
              Scraping for: <span className="text-foreground">{scrapeSource}</span>
            </p>
          )}
          <div className="flex gap-2 mb-6">
            <Input
              className="h-9 rounded-xl text-base"
              placeholder="Search query (e.g. earthquake Russia)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runScrape(query)}
            />
            <Button
              className="h-9 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-700 text-base"
              onClick={() => runScrape(query)}
              disabled={loading || !query.trim()}
            >
              {loading ? "Scraping..." : "Scrape"}
            </Button>
          </div>
          {scrapeEvent ? (
            <div className="flex gap-6 items-start">
              <div className="flex-1 min-w-0">
                <ScrapeLog logs={scrapeLogs} />
                {error && (
                  <p className="text-base text-red-500 mb-4">{error}</p>
                )}
                {articles.length > 0 && !loading && (
                  <p className="text-base text-muted-foreground mb-4">
                    {articles.length} articles scraped:
                  </p>
                )}
                <div className="flex flex-col gap-3">
                  {articles.map((a, i) => (
                    <ArticleCard key={a.url} article={a} isNew={i === 0} />
                  ))}
                </div>
              </div>
              <div className="w-80 shrink-0 sticky top-6">
                <p className="text-base text-muted-foreground mb-2">Scraping for:</p>
                <ContentCard>
                  <div className="text-base space-y-1">
                    <div><span className="font-semibold">Event Type:</span> {scrapeEvent.event_type} ({EVENT_TYPE_LABELS[scrapeEvent.event_type.toUpperCase()] || scrapeEvent.event_type})</div>
                    <div><span className="font-semibold">Title:</span> {scrapeEvent.title}</div>
                    <div><span className="font-semibold">Country:</span> {scrapeEvent.country}</div>
                    <div><span className="font-semibold">Severity:</span> {scrapeEvent.severity}</div>
                    <div><span className="font-semibold">Alert Level:</span> {scrapeEvent.alert_level}</div>
                    <div><span className="font-semibold">Lat/Lon:</span> {scrapeEvent.lat}, {scrapeEvent.lon}</div>
                    <div><span className="font-semibold">Date:</span> {scrapeEvent.date}</div>
                    <div><span className="font-semibold">GDACS URL:</span>{" "}
                      <a href={scrapeEvent.gdacs_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">
                        {scrapeEvent.gdacs_url}
                      </a>
                    </div>
                  </div>
                </ContentCard>
              </div>
            </div>
          ) : (
            <>
              <ScrapeLog logs={scrapeLogs} />
              {error && (
                <p className="text-base text-red-500 mb-4">{error}</p>
              )}
              {articles.length > 0 && !loading && (
                <p className="text-base text-muted-foreground mb-4">
                  {articles.length} articles scraped:
                </p>
              )}
              <div className="flex flex-col gap-3">
                {articles.map((a, i) => (
                  <ArticleCard key={a.url} article={a} isNew={i === 0} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;
