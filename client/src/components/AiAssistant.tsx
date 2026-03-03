import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Sparkles, X, Send, ArrowRight, Loader2, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SemanticHotel } from "@shared/routes";

type ConciergeHotel = SemanticHotel & { vibeQuery?: string };

type Message = {
  role: "user" | "assistant";
  content: string;
  hotels?: ConciergeHotel[];
  vibeQuery?: string;
  loading?: boolean;
};

const SUGGESTED_PROMPTS = [
  "Beachfront resort in Bali",
  "Luxury hotel in Paris",
  "Family-friendly in Orlando",
  "Romantic getaway in Santorini",
  "Ski resort in the Alps",
  "Boutique hotel in Tokyo",
];

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const historyForApi = () =>
    messages
      .filter((m) => !m.loading && m.content)
      .map((m) => ({ role: m.role, content: m.content }));

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    const userMsg: Message = { role: "user", content: query };
    const loadingMsg: Message = { role: "assistant", content: "", loading: true };
    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput("");

    try {
      const res = await fetch("/api/ai-concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query, history: historyForApi() }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data: { text: string; hotels: ConciergeHotel[]; vibeQuery: string } = await res.json();

      setMessages((prev) => {
        const updated = prev.filter((m) => !m.loading);
        return [
          ...updated,
          {
            role: "assistant",
            content: data.text,
            hotels: data.hotels?.length > 0 ? data.hotels : undefined,
            vibeQuery: data.vibeQuery || undefined,
          },
        ];
      });
    } catch {
      setMessages((prev) => {
        const updated = prev.filter((m) => !m.loading);
        return [
          ...updated,
          {
            role: "assistant",
            content: "Something went wrong. Please try again.",
          },
        ];
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(input);
  };

  const handleViewHotel = (hotelId: string) => {
    navigate(`/hotel/${hotelId}`);
    setOpen(false);
  };

  const handleVibeSearch = (vibeQuery: string) => {
    const today = new Date();
    const checkIn = new Date(today);
    checkIn.setDate(checkIn.getDate() + 7);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 3);
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    navigate(`/?aiSearch=${encodeURIComponent(vibeQuery)}&checkIn=${fmt(checkIn)}&checkOut=${fmt(checkOut)}&adults=2&children=0`);
    setOpen(false);
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-[400px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-8rem)] bg-background border border-border rounded-2xl shadow-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-primary/5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <div>
                <span className="font-semibold text-sm text-foreground">Luxe</span>
                <span className="text-xs text-muted-foreground ml-1.5">AI Concierge</span>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setOpen(false)}
              data-testid="button-ai-close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: "thin" }}>
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Hi, I'm Luxe!
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    I can help you discover hotels by vibe, answer travel questions, or tell you about Luxvibe.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Try asking
                  </p>
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSearch(prompt)}
                      className="w-full text-left px-3 py-2.5 rounded-lg border border-border text-sm text-foreground hover:border-primary/50 hover:bg-muted/50 transition-all"
                      data-testid={`button-prompt-${prompt.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground px-3 py-2 rounded-2xl rounded-br-md max-w-[80%] text-sm">
                      {msg.content}
                    </div>
                  </div>
                ) : msg.loading ? (
                  <div className="flex justify-start">
                    <div className="bg-muted px-3 py-2 rounded-2xl rounded-bl-md max-w-[80%] text-sm flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Searching...
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-start">
                      <div className="bg-muted px-3 py-2 rounded-2xl rounded-bl-md max-w-[85%] text-sm text-foreground whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                    {msg.hotels && msg.hotels.length > 0 && (
                      <div className="space-y-2 pl-1">
                        {msg.hotels.map((hotel) => (
                          <MiniHotelCard
                            key={hotel.id}
                            hotel={hotel}
                            onView={() => handleViewHotel(hotel.id)}
                          />
                        ))}
                        {msg.vibeQuery && (
                          <button
                            onClick={() => handleVibeSearch(msg.vibeQuery!)}
                            className="w-full mt-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-primary/40 bg-primary/5 text-primary text-xs font-medium hover:bg-primary/10 transition-colors"
                            data-testid="button-vibe-full-search"
                          >
                            <Search className="w-3.5 h-3.5" />
                            Explore all results on Luxvibe
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 px-3 py-3 border-t border-border"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about hotels, destinations, travel..."
              className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              data-testid="input-ai-query"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim()}
              data-testid="button-ai-send"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-50">
        <div className="relative">
          <Button
            onClick={() => setOpen((o) => !o)}
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
            className="rounded-full shadow-lg h-12 w-12 p-0"
            data-testid="button-ai-concierge"
          >
            {open ? (
              <X className="w-5 h-5" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </Button>
          {tooltipVisible && !open && (
            <div className="absolute bottom-14 right-0 bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg pointer-events-none">
              AI Concierge · Luxe
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function MiniHotelCard({
  hotel,
  onView,
}: {
  hotel: ConciergeHotel;
  onView: () => void;
}) {
  const tags = [
    ...(hotel.semanticTags?.slice(0, 2) || []),
    ...(hotel.persona ? [hotel.persona] : []),
    ...(hotel.style ? [hotel.style] : []),
  ].slice(0, 3);

  return (
    <div
      className="flex gap-3 p-2.5 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-muted/20 transition-colors cursor-pointer"
      onClick={onView}
      data-testid={`card-ai-hotel-${hotel.id}`}
    >
      {hotel.photo ? (
        <img
          src={hotel.photo}
          alt={hotel.name}
          className="w-16 h-16 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-muted shrink-0 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground line-clamp-1">
          {hotel.name}
        </p>
        {(hotel.city || hotel.country) && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {[hotel.city, hotel.country].filter(Boolean).join(", ")}
          </p>
        )}
        {tags.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="shrink-0 self-center"
        onClick={(e) => {
          e.stopPropagation();
          onView();
        }}
        data-testid={`button-view-hotel-${hotel.id}`}
      >
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
