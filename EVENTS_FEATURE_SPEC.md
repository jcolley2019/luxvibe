# Luxvibe Events Travel Planner — Feature Spec

## Vision

A live events travel planner built into Luxvibe that lets users browse upcoming concerts, sports games, comedy shows, and festivals — then plan flights, hotels, and tickets in one seamless flow. No other travel platform does this natively.

## User Flow

```
1. Browse events     →  search by city, artist/team, date, category
2. Pick an event     →  event detail: venue, date, ticket prices, lineup
3. "Plan This Trip"  →  origin city + dates auto-fill from event
4. Side-by-side      →  flights to event city + hotels near venue + ticket link
5. Book              →  flights (LiteAPI), hotel (LiteAPI), tickets (Ticketmaster affiliate)
```

## Event Categories

| Category    | Examples                                          | Ticketmaster Segment  |
|-------------|---------------------------------------------------|-----------------------|
| Music       | Taylor Swift, Beyoncé, Coachella, Lollapalooza    | Music                 |
| Sports      | NFL, NBA, MLB, NHL, MLS, college sports, UFC/MMA  | Sports                |
| Comedy      | Dave Chappelle, Kevin Hart, touring comedians     | Arts & Theatre        |
| Festivals   | Food festivals, cultural events, EDM fests        | Miscellaneous / Music |
| Family      | Disney On Ice, Cirque du Soleil, kids shows       | Family                |
| Theater     | Broadway tours, opera, ballet                     | Arts & Theatre        |

## Pages (Hidden Until Launch)

- `/events` — Main browse page (category filters, search, results grid)
- `/events/:id` — Event detail + trip planner

## APIs

### Ticketmaster Discovery API (primary)
- **Free tier**: 5,000 calls/day — more than sufficient at launch
- **Sign up**: https://developer.ticketmaster.com/
- **Env var**: `TICKETMASTER_API_KEY`
- **Covers**: Music, Sports, Comedy, Festivals, Theater, Family in US + international
- **Bonus**: Affiliate links generate 3-5% commission on ticket sales

### LiteAPI (existing — no new setup needed)
- Flights: already integrated
- Hotels: already integrated, `distanceFromCenter` filter for "near venue" sorting

### ESPN Unofficial API (optional — no key needed)
- `https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/teams/{teamId}/schedule`
- Use for direct team schedule browsing (team selector → season view)

## Server Routes

| Method | Path              | Description                             |
|--------|-------------------|-----------------------------------------|
| GET    | /api/events       | Search events (keyword, city, category, dates) |
| GET    | /api/events/:id   | Get single event details                |

## Revenue Model

| Stream              | Source                   | Approx Rate        |
|---------------------|--------------------------|-------------------|
| Hotel bookings      | LiteAPI commission       | Existing           |
| Flight bookings     | LiteAPI commission       | Existing           |
| Ticket affiliate    | Ticketmaster / SeatGeek  | 3–5% per sale      |
| Future: packages    | Bundled hotel+flight+ticket markup | TBD     |

## Luxe AI Integration

On the Events page, Luxe becomes a "sports & events travel concierge":
> *"Find me a weekend trip to see the Cowboys play at home"*
> *"I want to see Beyoncé somewhere I've never been this summer"*
> *"Plan a Coachella trip from New York"*

Luxe searches events by keyword, picks the best match, then auto-populates the trip planner.

## Phase Roadmap

| Phase | Milestone                             | Status      |
|-------|---------------------------------------|-------------|
| 1     | Events browse + detail pages          | ✅ Built     |
| 2     | Trip planner (hotel search pre-fill)  | ✅ Built     |
| 3     | Flights integration (pre-fill city)   | Pending flights approval |
| 4     | Ticket affiliate links live           | Ready — needs TM key |
| 5     | Team selector (follow your team)      | Planned      |
| 6     | Luxe AI event recommendations         | Planned      |
| 7     | Price alerts for event trips          | Planned      |

## Launch Checklist

- [ ] Add `TICKETMASTER_API_KEY` to environment secrets (get free key at developer.ticketmaster.com)
- [ ] Test event search and detail pages
- [ ] Add `/events` link to Navbar (under a "Experiences" or "Events" tab)
- [ ] Flip flights approval — enable flight pre-fill in trip planner
- [ ] Submit for Ticketmaster affiliate program

## Key Differentiators vs Competitors

1. **Starts from the event, not the destination** — unique in the OTA space
2. **Near-venue hotel sorting** — using existing `distanceFromCenter` logic
3. **All three in one flow** — flights + hotel + tickets without leaving Luxvibe
4. **AI-powered** — Luxe can discover events you didn't know you wanted
5. **Covers all live entertainment** — not just sports, not just music
