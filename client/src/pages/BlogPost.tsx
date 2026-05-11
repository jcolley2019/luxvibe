import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Navbar } from "@/components/Navbar";
import { MapPin, Calendar, Star, ChevronLeft, ChevronRight, ArrowRight, Clock, Users } from "lucide-react";
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
  seoTitle?: string;
  seoDescription?: string;
  ogImageUrl?: string;
  tags?: string[];
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

function readingTime(html: string) {
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const DESTINATION_FALLBACKS: Record<string, string> = {
  Nashville:    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80",
  London:       "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=80",
  Dubai:        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80",
  "Las Vegas":  "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=1200&q=80",
};
const GENERIC_FALLBACK = "https://images.unsplash.com/photo-1566140967404-b8b3932483f5?w=1200&q=80";
function fallbackFor(destination: string) {
  return DESTINATION_FALLBACKS[destination] ?? GENERIC_FALLBACK;
}

const GALLERY_IMAGES: Record<string, string[]> = {
  "best-luxury-hotels-boise-2026": [
    "https://cdn.5280.com/2019/10/Boise_Visitors-bureau-960x720.jpg",
    "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/14/10/2e/09/boise.jpg?w=1400&h=-1&s=1",
    "https://cdn.5280.com/2019/07/Boise-River-Rafters-Greenbelt_Convention-Visitors_bureau.jpg",
    "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/20/1a/49/23/caption.jpg?w=1400&h=-1&s=1",
    "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/08/fc/7c/1a/idaho-state-capitol-building.jpg?w=1200&h=-1&s=1",
    "https://cdn.5280.com/2019/07/Bogus-Basin-Boarder_Convention-Visitors-Bureau.jpg",
  ],
};

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

function SocialShareBar({ url, title, image }: { url: string; title: string; image: string }) {
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedImage = encodeURIComponent(image);

  return (
    <div className="flex items-center gap-3 py-5 border-y border-border mb-10" data-testid="social-share-bar">
      <span className="text-sm font-medium text-muted-foreground mr-1">Share:</span>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="share-twitter"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        X / Twitter
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="share-facebook"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        Facebook
      </a>
      <a
        href={`https://pinterest.com/pin/create/button/?url=${encoded}&media=${encodedImage}&description=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="share-pinterest"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
        </svg>
        Pinterest
      </a>
    </div>
  );
}

function FaqSection({ destination }: { destination: string }) {
  const faqs = [
    {
      q: `Is ${destination} expensive for hotels?`,
      a: `${destination} offers a wide range of accommodation options to suit different budgets. Luxury properties and five-star resorts typically command premium rates, especially in central or beachfront locations. Booking in advance and travelling in the shoulder season can yield significant savings, while boutique hotels and design-led properties often provide excellent value without sacrificing quality.`,
    },
    {
      q: `What is the best area to stay in ${destination}?`,
      a: `The ideal neighbourhood in ${destination} depends on your priorities. Staying centrally puts you within easy reach of landmarks, restaurants, and transport links. Beachfront or waterfront zones are popular for leisure travellers seeking relaxation, while quieter residential areas can offer a more authentic local experience. Consider proximity to the attractions most important to your trip when choosing your base.`,
    },
    {
      q: `When is the best time to visit ${destination}?`,
      a: `The best time to visit ${destination} varies by traveller preference. The peak season typically brings the best weather but also higher prices and larger crowds. Shoulder seasons offer a sweet spot — pleasant conditions with fewer visitors and more competitive hotel rates. If you prefer a quieter atmosphere, the off-peak months can be surprisingly rewarding, though it's worth checking local events and weather patterns before you book.`,
    },
  ];

  return (
    <section className="mb-14" data-testid="faq-section">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Frequently Asked Questions</h2>
      <div className="space-y-5">
        {faqs.map((faq, i) => (
          <div key={i} className="rounded-xl border border-border bg-muted/30 p-5">
            <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

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

  const relatedPosts = allPosts.filter(p => p.slug !== slug).slice(0, 2);

  // Derive gallery data (safe to use before early returns since it's just a lookup)
  const galleryImages = GALLERY_IMAGES[slug ?? ""] ?? [];
  const hasGallery = galleryImages.length > 1;

  useEffect(() => {
    if (!post) return;
    setImageSrc(post.heroImageUrl || fallbackFor(post.destination));
    setImageLoaded(false);
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

    setMeta("description", post.seoDescription || post.excerpt);
    setMeta("og:title", post.seoTitle || post.title, true);
    setMeta("og:description", post.seoDescription || post.excerpt, true);
    setMeta("og:image", post.ogImageUrl || post.heroImageUrl, true);
    setMeta("og:url", `https://luxvibe.io/blog/${post.slug}`, true);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `https://luxvibe.io/blog/${post.slug}`);
  }, [post]);

  // Auto-advance gallery — must be before early returns (Rules of Hooks)
  useEffect(() => {
    if (!hasGallery || isPaused) return;
    const t = setInterval(() => setGalleryIdx(i => (i + 1) % galleryImages.length), 15000);
    return () => clearInterval(t);
  }, [hasGallery, isPaused, galleryImages.length]);

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

  const postUrl = `https://luxvibe.io/blog/${post.slug}`;
  const mins = readingTime(post.contentHtml);
  const heroSrc = hasGallery ? galleryImages[galleryIdx] : (imageSrc ?? fallbackFor(post.destination));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero image / gallery carousel */}
      <div
        className="w-full h-[280px] md:h-[60vh] relative overflow-hidden bg-gradient-to-br from-[#1e3a5f] to-[#2463eb]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Slide images */}
        {hasGallery ? (
          galleryImages.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={`${post.destination} — photo ${i + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === galleryIdx ? "opacity-100" : "opacity-0"}`}
            />
          ))
        ) : (
          <img
            src={heroSrc}
            alt={post.title}
            loading="eager"
            onLoad={() => setImageLoaded(true)}
            onError={() => { setImageSrc(fallbackFor(post.destination)); setImageLoaded(true); }}
            className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

        {/* Prev / Next arrows */}
        {hasGallery && (
          <>
            <button
              onClick={() => { setGalleryIdx(i => (i - 1 + galleryImages.length) % galleryImages.length); setIsPaused(true); }}
              className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-2 md:p-2.5 backdrop-blur-sm transition-all z-10"
              data-testid="btn-gallery-prev"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button
              onClick={() => { setGalleryIdx(i => (i + 1) % galleryImages.length); setIsPaused(true); }}
              className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-2 md:p-2.5 backdrop-blur-sm transition-all z-10"
              data-testid="btn-gallery-next"
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {hasGallery && (
          <div className="absolute bottom-16 md:bottom-24 left-0 right-0 flex justify-center gap-1.5 z-10">
            {galleryImages.map((_, i) => (
              <button
                key={i}
                onClick={() => { setGalleryIdx(i); setIsPaused(true); }}
                className={`rounded-full transition-all duration-300 ${i === galleryIdx ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/50 hover:bg-white/75"}`}
                data-testid={`btn-gallery-dot-${i}`}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Photo count badge */}
        {hasGallery && (
          <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full z-10">
            {galleryIdx + 1} / {galleryImages.length}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-12 max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center gap-2 md:gap-3 text-white/80 text-xs md:text-sm mb-2 md:mb-3">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4" />
              {post.destination}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
              {formatDate(post.publishedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
              {mins} min read
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">{post.title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-12">
        {/* Back link */}
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to blog
        </Link>

        {/* Author byline */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8" data-testid="author-byline">
          <Users className="w-4 h-4" />
          <span>By the Luxvibe Team</span>
        </div>

        {/* Social share bar */}
        <SocialShareBar url={postUrl} title={post.title} image={post.heroImageUrl} />

        {/* Body HTML */}
        <div
          className="prose prose-base md:prose-lg dark:prose-invert max-w-full overflow-x-hidden prose-img:w-full prose-img:h-auto prose-img:rounded-xl mb-10"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        {/* Booking CTA buttons */}
        {post.hotelIds && post.hotelIds.length > 0 && (
          <div className="mb-14 p-6 rounded-2xl bg-gradient-to-br from-[#1e3a5f]/5 to-[#2463eb]/5 border border-[#2463eb]/20">
            <h3 className="text-lg font-bold text-foreground mb-1">Ready to book your stay?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Search live rates and availability for hotels in {post.destination} on Luxvibe.
            </p>
            <div className="flex flex-wrap gap-3">
              {post.hotelIds.map((id) => (
                <a
                  key={id}
                  href={`/?destination=${encodeURIComponent(post.destination)}`}
                  data-testid={`cta-book-${id}`}
                  className="bg-[#2463eb] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1e3a5f] transition-colors text-sm"
                >
                  Book This Hotel
                </a>
              ))}
            </div>
          </div>
        )}

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

        {/* FAQ */}
        <FaqSection destination={post.destination} />
      </div>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className="border-t border-border bg-muted/30 py-14">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-xl font-bold mb-8 text-foreground">More from the journal</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {relatedPosts.map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}`} data-testid={`card-related-${p.id}`}>
                  <article className="group rounded-xl overflow-hidden border border-border bg-card hover:shadow-md transition-shadow cursor-pointer">
                    <div className="aspect-[16/9] overflow-hidden bg-gradient-to-br from-[#1e3a5f] to-[#2463eb]">
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
                      <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-2">
                        {p.title}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                        Read more <ArrowRight className="w-3 h-3" />
                      </span>
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
