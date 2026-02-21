import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { SearchHero } from "@/components/SearchHero";
import { Features } from "@/components/Features";
import { HotelCard } from "@/components/HotelCard";
import { useSearchHotels } from "@/hooks/use-hotels";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  const destination = searchParams.get("destination");
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const guests = searchParams.get("guests") || "2";

  const isSearchActive = !!(destination && checkIn && checkOut);

  const { data: hotels, isLoading, error } = useSearchHotels({
    destination: destination || "",
    checkIn: checkIn || "",
    checkOut: checkOut || "",
    guests,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <SearchHero />
      
      {isSearchActive ? (
        <section className="py-16 container mx-auto px-4 flex-1">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold font-heading">
              Stays in <span className="text-primary capitalize">{destination}</span>
            </h2>
            <span className="text-muted-foreground">
              {hotels?.length || 0} results found
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-2">{(error as Error).message || "Something went wrong fetching hotels."}</p>
              <p className="text-sm text-muted-foreground">Try adding the country, e.g. "Paris, France" or "Tokyo, Japan".</p>
            </div>
          ) : hotels?.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border">
              <h3 className="text-lg font-semibold mb-2">No hotels found</h3>
              <p className="text-muted-foreground">Try adjusting your dates or destination.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {hotels?.map((hotel) => (
                <HotelCard 
                  key={hotel.id} 
                  hotel={hotel} 
                  checkIn={checkIn || undefined}
                  checkOut={checkOut || undefined}
                  guests={guests}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <Features />
      )}

      <footer className="bg-slate-900 text-slate-400 py-12 mt-auto">
        <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-heading font-bold text-xl mb-4">Luxvibe</h3>
            <p className="text-sm">Premium hotel booking experience for the modern traveler.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>About Us</li>
              <li>Careers</li>
              <li>Press</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>Help Center</li>
              <li>Terms of Service</li>
              <li>Privacy Policy</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Newsletter</h4>
            <p className="text-sm mb-4">Subscribe for exclusive deals.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="Email" className="bg-slate-800 border-none rounded px-3 py-2 text-sm w-full" />
              <button className="bg-primary text-white px-3 py-2 rounded text-sm font-medium">Join</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
