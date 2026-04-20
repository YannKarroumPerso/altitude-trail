import Link from "next/link";
import Image from "next/image";
import { Article } from "@/types";

interface ArticleCardProps {
  article: Article;
  variant?: "default" | "horizontal" | "mini" | "large";
  priority?: boolean;
}

export default function ArticleCard({ article, variant = "default", priority = false }: ArticleCardProps) {
  if (variant === "large") {
    return (
      <Link href={"/articles/" + article.slug} className="group cursor-pointer block">
        <div className="overflow-hidden">
          <Image src={article.image} alt={article.title} width={900} height={562}
            priority={priority} loading={priority ? "eager" : "lazy"} sizes="(max-width: 1024px) 100vw, 900px"
            className="w-full aspect-[16/10] object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 tracking-tighter uppercase font-headline">À LA UNE</span>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">PAR {article.author} — {article.date}</span>
          </div>
          <h2 className="font-headline text-3xl lg:text-5xl font-black leading-none tracking-tighter group-hover:text-primary transition-colors">
            {article.title}
          </h2>
          <p className="text-slate-600 leading-relaxed text-lg italic border-l-4 border-primary pl-4">{article.excerpt}</p>
        </div>
      </Link>
    );
  }

  if (variant === "horizontal") {
    return (
      <Link href={"/articles/" + article.slug} className="flex gap-3 group cursor-pointer">
        <Image src={article.image} alt={article.title} width={64} height={64}
          className="w-16 h-16 object-cover rounded-sm shrink-0" />
        <div className="space-y-1">
          <h5 className="text-xs font-bold leading-tight group-hover:text-primary transition-colors">{article.title}</h5>
          <span className="text-[10px] text-primary font-bold uppercase">{article.category}</span>
        </div>
      </Link>
    );
  }

  // default
  return (
    <Link href={"/articles/" + article.slug} className="space-y-3 group cursor-pointer block">
      <div className="overflow-hidden">
        <Image src={article.image} alt={article.title} width={400} height={400}
          className="w-full aspect-square object-cover lg:grayscale lg:group-hover:grayscale-0 transition-all duration-300" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-primary font-bold uppercase tracking-wider font-headline">{article.category}</span>
        <span className="text-[10px] text-slate-400">· {article.readTime}</span>
      </div>
      <h4 className="font-headline font-bold text-xl leading-tight group-hover:text-primary transition-colors">{article.title}</h4>
      <p className="text-sm text-slate-500 line-clamp-2">{article.excerpt}</p>
    </Link>
  );
}
