import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { MapPin, Calendar, ArrowRight, Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  destination: string;
  heroImageUrl: string;
  contentHtml: string;
  excerpt: string;
  publishedAt: string;
  tags?: string[];
}

const DESTINATION_FALLBACKS: Record<string, string> = {
  Nashville: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1200&q=80",
  London:    "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=80",
  Dubai:     "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80",
  "Las Vegas": "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=1200&q=80",
};
const GENERIC_FALLBACK = "https://images.unsplash.com/photo-1566140967404-b8b3932483f5?w=1200&q=80";

function fallbackFor(destination: string) {
  return DESTINATION_FALLBACKS[destination] ?? GENERIC_FALLBACK;
}

function readingTime(html: string) {
  if (!html) return 1;
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function BlogCard({ post }: { post: BlogPost }) {
  const [loaded, setLoaded] = useState(false);
  const [src, setSrc] = useState(post.heroImageUrl || fallbackFor(post.destination));
  const mins = readingTime(post.contentHtml);
  return (
    <Link href={`/blog/${post.slug}`} data-testid={`card-blog-${post.id}`}>
      <article className="group rounded-2xl overflow-hidden border border-border bg-card hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
        <div className="overflow-hidden aspect-[16/10] relative bg-gradient-to-br from-[#1e3a5f] to-[#2463eb]">
          <img
            src={src}
            alt={post.title}
            loading="eager"
            onLoad={() => setLoaded(true)}
            onError={() => { setSrc(fallbackFor(post.destination)); setLoaded(true); }}
            className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
        </div>
        <div className="p-5 flex flex-col flex-1">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {post.destination}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(post.publishedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {mins} min read
            </span>
          </div>
          <h2 className="text-base font-bold text-foreground mb-2 leading-snug group-hover:text-primary transition-colors">
            {post.title}
          </h2>
          <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{post.excerpt}</p>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3" data-testid={`tags-${post.id}`}>
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#2463eb]/10 text-[#2463eb] dark:bg-[#2463eb]/20 dark:text-blue-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary">
            Read more <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function BlogIndex() {
  const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog/posts"],
  });

  useEffect(() => {
    document.title = "Travel Blog — Luxvibe";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Discover travel inspiration, hotel guides, and destination tips from the Luxvibe team.");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="bg-[#1e3a5f] text-white py-10 md:py-16 px-4 text-center">
        <p className="text-xs md:text-sm font-semibold tracking-[3px] uppercase text-blue-300 mb-3">The Luxvibe Journal</p>
        <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">Travel Inspiration</h1>
        <p className="text-blue-100 text-base md:text-lg max-w-xl mx-auto">
          Hotel guides, destination tips, and travel stories from around the world.
        </p>
      </section>

      {/* Posts grid */}
      <main className="max-w-6xl mx-auto px-4 py-14">
        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-border animate-pulse">
                <div className="bg-muted aspect-[16/10] w-full" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && posts.length === 0 && (
          <div className="text-center py-24 text-muted-foreground">
            <p className="text-xl">No posts yet — check back soon.</p>
          </div>
        )}

        {!isLoading && posts.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
