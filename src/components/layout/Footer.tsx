import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    const { error } = await supabase
      .from('subscribers')
      .insert({ email });

    if (error) {
      if (error.code === '23505') {
        toast.error("You're already subscribed!");
      } else {
        toast.error("Failed to subscribe. Please try again.");
      }
    } else {
      toast.success("Successfully subscribed to our newsletter!");
      setEmail("");
    }
    setLoading(false);
  };

  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <span className="font-display text-xl font-bold">VreBlog</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Discover amazing articles, share your thoughts, and connect with a community of readers and writers.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Linkedin className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link></li>
              <li><Link to="/categories" className="text-muted-foreground hover:text-foreground transition-colors">Categories</Link></li>
              <li><Link to="/api" className="text-muted-foreground hover:text-foreground transition-colors">API</Link></li>
              <li><Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="font-semibold">Categories</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/category/technology" className="text-muted-foreground hover:text-foreground transition-colors">Technology</Link></li>
              <li><Link to="/category/lifestyle" className="text-muted-foreground hover:text-foreground transition-colors">Lifestyle</Link></li>
              <li><Link to="/category/business" className="text-muted-foreground hover:text-foreground transition-colors">Business</Link></li>
              <li><Link to="/category/design" className="text-muted-foreground hover:text-foreground transition-colors">Design</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="font-semibold">Subscribe to Newsletter</h3>
            <p className="text-sm text-muted-foreground">Get the latest articles delivered to your inbox.</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                required
              />
              <Button type="submit" size="icon" disabled={loading}>
                <Mail className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} VreBlog. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-destructive fill-destructive" /> from Vredeburg Studio
          </p>
        </div>
      </div>
    </footer>
  );
}