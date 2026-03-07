import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { MapPin, Calendar, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  destination: string;
  heroImageUrl: string;
  excerpt: string;
  publishedAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function BlogCard({ post }: { post: BlogPost }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <Link href={`/blog/${post.slug}`} data-testid={`card-blog-${post.id}`}>
      <article className="group rounded-2xl overflow-hidden border border-border bg-card hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
        <div className="overflow-hidden aspect-[16/10] relative bg-gradient-to-br from-[#1e3a5f] to-[#2463eb]">
          <img
            src={post.heroImageUrl}
            alt={post.title}
            loading="eager"
            onLoad={() => setLoaded(true)}
            className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
        </div>
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
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
          </div>
          <h2 className="text-base font-bold text-foreground mb-2 leading-snug group-hover:text-primary transition-colors">
            {post.title}
          </h2>
          <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{post.excerpt}</p>
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
      <section className="bg-[#1e3a5f] text-white py-16 px-4 text-center">
        <p className="text-sm font-semibold tracking-[3px] uppercase text-blue-300 mb-3">The Luxvibe Journal</p>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Travel Inspiration</h1>
        <p className="text-blue-100 text-lg max-w-xl mx-auto">
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
