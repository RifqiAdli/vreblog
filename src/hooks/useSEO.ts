import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  publishedAt?: string;
  tags?: string[];
  jsonLd?: Record<string, unknown>;
}

export function useSEO({
  title,
  description,
  image,
  url,
  type = 'website',
  author,
  publishedAt,
  tags,
  jsonLd,
}: SEOProps) {
  useEffect(() => {
    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) ||
               document.querySelector(`meta[name="${property}"]`);
      if (!el) {
        el = document.createElement('meta');
        if (property.startsWith('og:') || property.startsWith('article:')) {
          el.setAttribute('property', property);
        } else {
          el.setAttribute('name', property);
        }
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    if (title) {
      document.title = title;
      setMeta('og:title', title);
      setMeta('twitter:title', title);
    }

    if (description) {
      setMeta('description', description);
      setMeta('og:description', description);
      setMeta('twitter:description', description);
    }

    if (image) {
      setMeta('og:image', image);
      setMeta('twitter:image', image);
      setMeta('twitter:card', 'summary_large_image');
    } else {
      setMeta('twitter:card', 'summary');
    }

    if (url) {
      setMeta('og:url', url);
    }

    setMeta('og:type', type);
    setMeta('og:site_name', 'VreBlog');

    if (author) {
      setMeta('article:author', author);
    }

    if (publishedAt) {
      setMeta('article:published_time', publishedAt);
    }

    if (tags && tags.length > 0) {
      tags.forEach(tag => setMeta('article:tag', tag));
    }

    // JSON-LD structured data
    if (jsonLd) {
      let script = document.querySelector('script[data-seo-jsonld]') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo-jsonld', 'true');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);

      return () => {
        script?.remove();
      };
    }
  }, [title, description, image, url, type, author, publishedAt, tags, jsonLd]);
}
