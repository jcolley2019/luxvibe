import { useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Calendar as CalendarIcon, MapPin, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function SearchHero() {
  const [, setLocation] = useLocation();
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState<{ from: Date; to?: Date } | undefined>();
  const [guests, setGuests] = useState("2");

  const handleSearch = () => {
    if (!destination || !date?.from || !date?.to) return;
    
    const params = new URLSearchParams({
      destination,
      checkIn: format(date.from, "yyyy-MM-dd"),
      checkOut: format(date.to, "yyyy-MM-dd"),
      guests,
    });
    
    setLocation(`/?${params.toString()}`);
  };

  return (
    <div className="relative w-full min-h-[600px] flex items-center justify-center bg-slate-900 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        {/* luxury hotel resort pool at sunset */}
        <img 
          src="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=2049&auto=format&fit=crop"
          alt="Luxury Resort"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30" />
      </div>

      <div className="relative z-10 container mx-auto px-4 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-xl">
            Find Your Next <span className="text-primary-foreground italic">Escape</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-12 font-medium">
            Discover extraordinary hotels, resorts, and vacation rentals for your perfect getaway.
          </p>
        </motion.div>

        {/* Search Box */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-4xl bg-background/95 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-white/20 flex flex-col md:flex-row gap-2"
        >
          <div className="flex-1 relative group">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Where are you going?" 
              className="pl-10 h-14 bg-transparent border-transparent focus-visible:ring-0 text-lg"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>

          <div className="w-px bg-border my-2 hidden md:block" />

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"ghost"}
                className={cn(
                  "flex-1 h-14 justify-start text-left font-normal text-lg hover:bg-muted/50",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-5 w-5 text-muted-foreground" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd")} - {format(date.to, "LLL dd")}
                    </>
                  ) : (
                    format(date.from, "LLL dd")
                  )
                ) : (
                  <span>Check-in - Check-out</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>

          <div className="w-px bg-border my-2 hidden md:block" />

          <div className="w-full md:w-[150px] relative group">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
            <Input 
              type="number"
              min="1"
              max="10"
              placeholder="Guests" 
              className="pl-10 h-14 bg-transparent border-transparent focus-visible:ring-0 text-lg"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
            />
          </div>

          <Button 
            size="lg" 
            className="h-14 px-8 text-lg font-semibold rounded-xl shadow-lg shadow-primary/20"
            onClick={handleSearch}
          >
            <Search className="w-5 h-5 mr-2" />
            Search
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
