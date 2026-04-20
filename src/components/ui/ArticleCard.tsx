import Link from "next/link";
import Image from "next/image";
import { Article } from "@/types";

interface ArticleCardProps {
  article: Article;
  variant?: "default" | "horizontal" | "mini" | "large";
  priority?: boolean;
  hideExcerpt?: boolean;
}

export default function ArticleCard({ article, variant = "default", priority = false, hideExcerpt = false }: ArticleCardProps) {
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

  // default — mobile: Charente Libre style (full-width 16:9, big title, pills, excerpt, separator); desktop: compact aspect-square
  return (
    <Link
      href={"/articles/" + article.slug}
      className="group cursor-pointer block space-y-3 pb-6 border-b border-surface-container md:pb-0 md:border-b-0"
    >
      <div className="overflow-hidden">
        <Image
          src={article.image}
          alt={article.title}
          width={800}
          height={600}
          sizes="(max-width: 768px) 100vw, 400px"
          className="w-full aspect-video md:aspect-square object-cover lg:grayscale lg:group-hover:grayscale-0 transition-all duration-300"
        />
      </div>
      <h4 className="font-headline font-black text-2xl md:text-xl leading-tight tracking-tight group-hover:text-primary transition-colors">
        {article.title}
      </h4>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="bg-primary text-white text-[10px] font-bold uppercase tracking-wider font-headline px-2 py-0.5">
          {article.category}
        </span>
        <span className="bg-surface-container text-slate-700 text-[10px] font-bold uppercase tracking-wider font-headline px-2 py-0.5">
          {article.readTime}
        </span>
      </div>
      {!hideExcerpt && (
        <p className="text-base md:text-sm text-slate-600 leading-relaxed line-clamp-3 md:line-clamp-2">
          {article.excerpt}
        </p>
      )}
    </Link>
  );
}
