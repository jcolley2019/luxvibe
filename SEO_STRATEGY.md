# Luxvibe SEO & LLM SEO Strategy
*Last updated: May 11, 2026*

---

## Current Status: ✅ Strong Foundation

### Already In Place
| Item | Status | Notes |
|---|---|---|
| `robots.txt` | ✅ Done | Allows all major AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Bingbot, etc.) |
| `llms.txt` | ✅ Done | AI-era sitemap at `luxvibe.io/llms.txt` |
| `llms-full.txt` | ✅ Done | Full product description for AI models at `luxvibe.io/llms-full.txt` |
| Sitemap | ✅ Fixed | `luxvibe.io/sitemap.xml` — was returning 500, now working |
| Global JSON-LD schemas | ✅ Done | WebSite (with SearchAction), Organization, TravelAgency in `index.html` |
| OG / Twitter cards | ✅ Done | On all pages |
| Dynamic page titles | ✅ Done | Home (search), HotelDetails, BlogPost, all other pages |
| Organization `sameAs` | ✅ Added | Twitter/X, Instagram, LinkedIn |

### Added May 11, 2026
| Item | File | What It Does |
|---|---|---|
| **LodgingBusiness schema** | `HotelDetails.tsx` | Each hotel page now has hotel name, address, star rating, review score + count, price, and image in JSON-LD — enables rich results in Google (stars, price badges) |
| **Dynamic canonical tags** | `HotelDetails.tsx` | Each hotel page now correctly reports `luxvibe.io/hotel/{id}` as its canonical (was incorrectly reporting `luxvibe.io/`) |
| **BlogPosting schema** | `BlogPost.tsx` | Every blog post has Article structured data — enables AI tools (Perplexity, ChatGPT) to cite posts with author, date, and topic |
| **Error Boundary** | `App.tsx` | Catches frontend crashes, shows friendly error page instead of blank screen |
| **Accessibility fixes** | Multiple files | ARIA labels, touch targets, canonical management cleanup |

---

## Your Action Plan

### This Week (one-time setup)
- [ ] **Submit sitemap to Google Search Console**
  1. Go to [search.google.com/search-console](https://search.google.com/search-console)
  2. Add property → URL prefix → `https://luxvibe.io`
  3. Verify ownership (HTML tag method is easiest)
  4. Go to Sitemaps → Submit → `https://luxvibe.io/sitemap.xml`
  5. **This is the single highest-leverage action you can take.**

- [ ] **Verify social media handles match**
  - Currently configured: `@luxvibe` on Twitter/X, `@luxvibe` on Instagram, `luxvibe` on LinkedIn
  - If any are different, update the `sameAs` array in `client/index.html` (Organization schema, around line 89)

- [ ] **Set up Google Analytics / GA4** (if not already done)
  - Lets you track which pages get traffic, where users drop off, etc.

### Ongoing (content is your biggest lever)
- [ ] **Publish 1–2 blog posts per week** targeting specific destinations
  - Format: `"Best Luxury Hotels in [City] 2026"` — these match how people prompt AI tools
  - Format: `"Is [Famous Hotel] Worth It?"` — comparison/review format gets cited by AI
  - Cover the destinations you're strongest on: Paris, Dubai, Bali, New York, Maldives
  
- [ ] **Each blog post should include:**
  - A clear destination name in the title
  - Specific hotel names, prices, and ratings
  - A FAQ section at the bottom (3–5 questions people actually ask)
  - A call to action linking to the search results for that destination

### Medium Term (1–3 months)
- [ ] **Get backlinks** — even 5–10 quality links make a major early difference
  - Post in travel subreddits (r/travel, r/solotravel, r/luxurytravel) when you have a great post
  - Reach out to travel bloggers and offer to be featured
  - Submit Luxvibe to travel tool directories
  
- [ ] **Monitor Google Search Console** — after 4–6 weeks you'll see:
  - Which pages are indexed
  - Which queries you're ranking for
  - Click-through rates and impressions
  - Any crawl errors

---

## How LLM SEO (GEO) Works

Traditional SEO targets Google's algorithm. **LLM SEO targets AI tools** like ChatGPT, Perplexity, Claude, and Google AI Overviews.

**How AI tools decide what to cite:**
1. They crawl and index the web (Perplexity does this live; ChatGPT uses periodic training)
2. They prefer content that is **specific, factual, and authoritative**
3. Your `llms.txt` tells them what Luxvibe is and what it does
4. Your **blog posts** are the primary vehicle — when someone asks "best luxury hotels in Cancún," a detailed, well-structured post on that topic is what gets cited
5. **Structured data** (the schemas we added) helps AI tools understand the entities on your pages

**Timeline expectations:**
- Google rich results from hotel schema: 2–4 weeks after next crawl
- Google indexing blog posts: 1–2 weeks after publish
- ChatGPT/Perplexity citations: 1–3 months (depends on their crawl cycles)
- Meaningful organic traffic: 3–6 months of consistent publishing

---

## Key Files Reference

| File | Purpose |
|---|---|
| `client/index.html` | Global SEO: title, meta description, OG tags, all JSON-LD schemas |
| `client/public/robots.txt` | Crawler permissions (including all AI bots) |
| `client/public/llms.txt` | AI model description (short version) |
| `client/public/llms-full.txt` | AI model description (full product details) |
| `client/public/sitemap.xml` | Static sitemap fallback (dynamic version served by server) |
| `server/routes.ts` | Dynamic sitemap route (`/sitemap.xml`) — includes blog posts |
| `client/src/pages/HotelDetails.tsx` | Hotel page SEO: LodgingBusiness schema, dynamic canonical, dynamic title |
| `client/src/pages/BlogPost.tsx` | Blog SEO: BlogPosting schema, OG tags, canonical, dynamic title |
| `client/src/pages/Home.tsx` | Home page SEO: dynamic title based on search state |
| `client/src/pages/About.tsx` | About page SEO: FAQPage schema |

---

## Quick Wins Still Available

1. **Submit to Google Search Console** — free, immediate, highest impact
2. **Write 3 more blog posts** — cover Paris, Dubai, and Maldives (high search volume luxury destinations)
3. **Share Luxvibe on social media** — every social share = potential backlink + brand signal
4. **Verify Google My Business** — if Luxvibe has a physical presence, register it; if not, skip

---

*This file lives at the root of the project. To update it, just open `SEO_STRATEGY.md`.*
