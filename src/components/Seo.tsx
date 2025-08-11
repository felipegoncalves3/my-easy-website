import { useEffect } from "react";

interface SeoProps {
  title: string;
  description?: string;
  canonicalUrl?: string;
  jsonLd?: Record<string, any>;
}

export function Seo({ title, description, canonicalUrl, jsonLd }: SeoProps) {
  useEffect(() => {
    document.title = title;

    const ensureMeta = (name: string, content: string) => {
      if (!content) return;
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    const ensureProperty = (property: string, content: string) => {
      if (!content) return;
      let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("property", property);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    const url = canonicalUrl || window.location.href;

    ensureMeta("description", description || "");
    ensureProperty("og:title", title);
    ensureProperty("og:description", description || "");
    ensureProperty("og:type", "website");
    ensureProperty("og:url", url);

    let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkCanonical) {
      linkCanonical = document.createElement("link");
      linkCanonical.setAttribute("rel", "canonical");
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute("href", url);

    // JSON-LD structured data
    const existing = document.getElementById("jsonld-primary");
    if (existing) existing.remove();
    if (jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = "jsonld-primary";
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, canonicalUrl, jsonLd]);

  return null;
}

export default Seo;
