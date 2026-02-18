import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FileText, MessageSquare, Users, BarChart3,
  Settings, ArrowLeft, LogOut, FolderOpen, Menu, Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/articles", icon: FileText, label: "Articles" },
  { href: "/admin/categories", icon: FolderOpen, label: "Categories" },
  { href: "/admin/comments", icon: MessageSquare, label: "Comments" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/admin/api-keys", icon: Key, label: "API Keys" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const { user, isAdmin, loading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/");
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">V</span>
          </div>
          <span className="font-display text-xl font-bold">Admin</span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border space-y-2">
        <Button variant="ghost" className="w-full justify-start text-sm" asChild>
          <Link to="/" onClick={() => setMobileOpen(false)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Site
          </Link>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive text-sm"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-card border-r border-border z-30">
        <SidebarContent />
      </aside>
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 flex flex-col">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="font-display text-lg font-bold">Admin</span>
          </Link>
        </div>
      </div>
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}
