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

export type Difficulty = "Facile" | "Modéré" | "Difficile" | "Extrême";

export interface Race {
  id: string;
  slug: string;
  name: string;
  date: string;
  month: number;
  dateISO: string;
  city: string;
  departmentCode: string;
  departmentName: string;
  region: string;
  distance: number;
  elevation: number;
  difficulty: Difficulty;
  description: string;
  lat: number;
  lng: number;
  website?: string;
}

export interface Category {
  slug: string;
  label: string;
  description: string;
}
