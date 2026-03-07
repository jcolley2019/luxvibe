import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Navbar } from "@/components/Navbar";
import { MapPin, Calendar, Star, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  destination: string;
  heroImageUrl: string;
  contentHtml: string;
  excerpt: string;
  publishedAt: string;
  hotelIds: string[];
}

interface HotelSummary {
  id: string;
  name: string;
  stars: number;
  city: string;
  country: string;
  images: string[];
  amenities: string[];
  mainImage: string;
}

interface ReviewData {
  data?: {
    reviews?: Array<{ reviewText?: string; text?: string; rating?: number }>;
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function StarRow({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < count ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </span>
  );
}

function HotelImageCarousel({ images, hotelName }: { images: string[]; hotelName: string }) {
  const [idx, setIdx] = useState(0);
  if (!images.length) return (
    <div className="w-full aspect-[16/9] bg-muted rounded-xl flex items-center justify-center text-muted-foreground text-sm">
      No images available
    </div>
  );
  return (
    <div className="relative rounded-xl overflow-hidden aspect-[16/9] group">
      <img
        src={images[idx]}
        alt={`${hotelName} — photo ${idx + 1}`}
        className="w-full h-full object-cover transition-opacity duration-300"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            data-testid={`btn-carousel-prev-${hotelName}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            data-testid={`btn-carousel-next-${hotelName}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FeaturedHotelCard({ hotelId, destination }: { hotelId: string; destination: string }) {
  const { data: hotel, isLoading: hotelLoading } = useQuery<HotelSummary>({
    queryKey: ["/api/blog/hotel-summary", hotelId],
    queryFn: () => fetch(`/api/blog/hotel-summary/${hotelId}`).then(r => r.json()),
  });

  const { data: reviewData } = useQuery<ReviewData>({
    queryKey: ["/api/hotels", hotelId, "reviews"],
    queryFn: () => fetch(`/api/hotels/${hotelId}/reviews`).then(r => r.json()),
    enabled: !!hotel,
  });

  const reviews = reviewData?.data?.reviews?.filter(r => r.reviewText || r.text).slice(0, 2) || [];

  if (hotelLoading) {
    return (
      <div className="rounded-2xl border border-border p-6 animate-pulse space-y-4">
        <div className="aspect-[16/9] bg-muted rounded-xl" />
        <div className="h-5 bg-muted rounded w-2/3" />
        <div className="h-4 bg-muted rounded w-1/3" />
      </div>
    );
  }

  if (!hotel) return null;

  const bookUrl = `https://luxvibe.io/?destination=${encodeURIComponent(hotel.city || destination)}`;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden" data-testid={`card-featured-hotel-${hotelId}`}>
      <HotelImageCarousel images={hotel.images} hotelName={hotel.name} />
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 className="font-bold text-lg text-foreground">{hotel.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <StarRow count={hotel.stars} />
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {hotel.city}{hotel.country ? `, ${hotel.country}` : ""}
              </span>
            </div>
          </div>
        </div>

        {hotel.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {hotel.amenities.map((a) => (
              <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>
            ))}
          </div>
        )}

        {reviews.length > 0 && (
          <div className="space-y-3 mb-5">
            {reviews.map((r, i) => (
              <blockquote key={i} className="border-l-2 border-primary/30 pl-3 text-sm text-muted-foreground italic">
                "{r.reviewText || r.text}"
              </blockquote>
            ))}
          </div>
        )}

        <a
          href={bookUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-testid={`link-book-hotel-${hotelId}`}
        >
          <Button className="w-full bg-[#2463eb] hover:bg-[#1d55d4] text-white gap-2">
            Check availability at Luxvibe <ArrowRight className="w-4 h-4" />
          </Button>
        </a>
      </div>
    </div>
  );
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, isError } = useQuery<BlogPost>({
    queryKey: ["/api/blog/posts", slug],
    queryFn: () => fetch(`/api/blog/posts/${slug}`).then(r => {
      if (!r.ok) throw new Error("Post not found");
      return r.json();
    }),
  });

  const { data: allPosts = [] } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog/posts"],
  });

  const relatedPosts = allPosts.filter(p => p.slug !== slug).slice(0, 3);

  useEffect(() => {
    if (!post) return;
    document.title = `${post.title} — Luxvibe`;

    const setMeta = (name: string, content: string, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        if (prop) el.setAttribute("property", name);
        else el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", post.excerpt);
    setMeta("og:title", post.title, true);
    setMeta("og:description", post.excerpt, true);
    setMeta("og:image", post.heroImageUrl, true);
    setMeta("og:url", `https://luxvibe.io/blog/${post.slug}`, true);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `https://luxvibe.io/blog/${post.slug}`);
  }, [post]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="animate-pulse">
          <div className="w-full h-[50vh] bg-muted" />
          <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
          <Link href="/blog">
            <Button variant="outline">← Back to blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero image */}
      <div className="w-full h-[55vh] relative overflow-hidden">
        <img
          src={post.heroImageUrl}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center gap-3 text-white/80 text-sm mb-3">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {post.destination}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(post.publishedAt)}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">{post.title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-12">
        {/* Back link */}
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to blog
        </Link>

        {/* Body HTML */}
        <div
          className="prose prose-lg dark:prose-invert max-w-none mb-14"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        {/* Featured hotels */}
        {post.hotelIds && post.hotelIds.length > 0 && (
          <section className="mb-14">
            <h2 className="text-2xl font-bold mb-6 text-foreground">
              Featured Hotels in {post.destination}
            </h2>
            <div className="space-y-8">
              {post.hotelIds.map((id) => (
                <FeaturedHotelCard key={id} hotelId={id} destination={post.destination} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className="border-t border-border bg-muted/30 py-14">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-xl font-bold mb-8 text-foreground">More from the journal</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}`} data-testid={`card-related-${p.id}`}>
                  <article className="group rounded-xl overflow-hidden border border-border bg-card hover:shadow-md transition-shadow cursor-pointer">
                    <div className="aspect-[16/9] overflow-hidden">
                      <img
                        src={p.heroImageUrl}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                        <MapPin className="w-3 h-3" /> {p.destination}
                      </p>
                      <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {p.title}
                      </h3>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
