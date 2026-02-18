import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sun, Moon, Menu, X, Search, User, LogOut, LayoutDashboard, Bookmark, Home, Grid3X3, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useState, useRef, useCallback } from "react";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, profile, isAdmin, signOut } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [themeAnimating, setThemeAnimating] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleThemeToggle = () => {
    setThemeAnimating(true);
    toggleTheme();
    setTimeout(() => setThemeAnimating(false), 500);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full glass-effect">
        <div className="container flex h-14 md:h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <span className="text-primary-foreground font-bold text-lg">V</span>
            </div>
            <span className="font-display text-xl font-bold hidden sm:block">VreBlog</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: "/", label: "Home" },
              { href: "/categories", label: "Categories" },
            ].map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-1.5">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2 animate-fade-in">
                <Input
                  type="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-36 sm:w-56 h-9 rounded-xl"
                  autoFocus
                />
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => setSearchOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setSearchOpen(true)}>
                <Search className="h-4 w-4" />
              </Button>
            )}

            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl relative overflow-hidden" onClick={handleThemeToggle}>
              <Sun className={`h-4 w-4 absolute transition-all duration-500 ${theme === "dark" ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"}`} />
              <Moon className={`h-4 w-4 absolute transition-all duration-500 ${theme === "light" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`} />
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">{profile?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">{profile?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{profile?.full_name || profile?.username}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/bookmarks" className="flex items-center gap-2 cursor-pointer">
                      <Bookmark className="h-4 w-4" /> Bookmarks
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                        <LayoutDashboard className="h-4 w-4" /> Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex rounded-xl" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button size="sm" className="rounded-xl" asChild>
                  <Link to="/auth?mode=register">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation - app-like */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-effect border-t safe-area-bottom">
        <div className="flex items-center justify-around h-14 px-2">
          {[
            { href: "/", icon: Home, label: "Home" },
            { href: "/categories", icon: Grid3X3, label: "Categories" },
            { href: "/search", icon: Search, label: "Search" },
            { href: user ? "/bookmarks" : "/auth", icon: Bookmark, label: "Saved" },
            { href: user ? "/profile" : "/auth", icon: User, label: "Profile" },
          ].map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
