export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categorySlug: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  featured?: boolean;
  tags?: string[];
  content?: string;
}

export interface Race {
  id: string;
  name: string;
  location: string;
  department: string;
  region: string;
  date: string;
  distance: string;
  elevation: string;
  difficulty: "Facile" | "Modéré" | "Difficile" | "Extrême";
  website?: string;
  description?: string;
}

export interface Category {
  slug: string;
  label: string;
  description: string;
}
