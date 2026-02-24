import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Menu, CalendarDays } from "lucide-react";

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [location] = useLocation();

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          {/* Logo Icon */}
          <span
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
            className="text-2xl font-semibold tracking-[0.18em] text-foreground uppercase"
          >
            Luxvibe
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/' ? 'text-primary' : 'text-muted-foreground'}`}>
            Explore
          </Link>
          <Link href="/about" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            About
          </Link>
          <Link href="/support" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Support
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={user?.profileImageUrl ?? undefined} alt={user?.firstName || "User"} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {(user?.firstName?.[0] || "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user?.firstName && <p className="font-medium">{user.firstName} {user.lastName}</p>}
                    {user?.email && <p className="w-[200px] truncate text-xs text-muted-foreground">{user.email}</p>}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/my-bookings" className="cursor-pointer">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    My Bookings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleLogin}>Sign In</Button>
              <Button onClick={handleLogin} className="shadow-lg shadow-primary/20 hover:shadow-primary/30">Get Started</Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
