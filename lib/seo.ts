import type { Metadata } from "next";

export function buildMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    }
  };
}

export function articleJsonLd({
  headline,
  description,
  datePublished,
  authorName
}: {
  headline: string;
  description: string;
  datePublished: string;
  authorName: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    datePublished,
    author: { "@type": "Person", name: authorName }
  };
}
