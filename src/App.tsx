import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { PageLoader } from "@/components/common/LoadingSpinner";
import NotFound from "./pages/NotFound";

// Lazy load pages
const Home = lazy(() => import("./pages/Home"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const Categories = lazy(() => import("./pages/Categories"));
const Category = lazy(() => import("./pages/Category"));
const Search = lazy(() => import("./pages/Search"));
const Bookmarks = lazy(() => import("./pages/Bookmarks"));
const ApiDashboard = lazy(() => import("./pages/ApiDashboard"));
const ApiDocs = lazy(() => import("./pages/ApiDocs"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminArticles = lazy(() => import("./pages/admin/Articles"));
const AdminCreateArticle = lazy(() => import("./pages/admin/CreateArticle"));
const AdminEditArticle = lazy(() => import("./pages/admin/EditArticle"));
const AdminComments = lazy(() => import("./pages/admin/Comments"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminCategories = lazy(() => import("./pages/admin/Categories"));
const AdminApiKeys = lazy(() => import("./pages/admin/ApiKeys"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/article/:slug" element={<ArticleDetail />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/category/:slug" element={<Category />} />
                <Route path="/search" element={<Search />} />
                <Route path="/bookmarks" element={<Bookmarks />} />
                <Route path="/api" element={<ApiDashboard />} />
                <Route path="/api/docs" element={<ApiDocs />} />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/articles" element={<AdminArticles />} />
                <Route path="/admin/articles/new" element={<AdminCreateArticle />} />
                <Route path="/admin/articles/:id/edit" element={<AdminEditArticle />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route path="/admin/comments" element={<AdminComments />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/api-keys" element={<AdminApiKeys />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
