import Link from "next/link";
import JsonLd from "@/components/ui/JsonLd";
import { absoluteUrl, buildBreadcrumbJsonLd } from "@/lib/seo";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = buildBreadcrumbJsonLd(
    items.map((i) => ({ label: i.label, url: i.href ? absoluteUrl(i.href) : undefined }))
  );
  return (
    <>
      <JsonLd data={jsonLd} />
      <nav
        aria-label="Fil d'Ariane"
        className="flex items-center gap-2 text-xs text-slate-500 mb-4 font-headline uppercase tracking-wide"
      >
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <span key={i} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-primary transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-on-surface truncate max-w-xs" : ""}>
                  {item.label}
                </span>
              )}
              {!isLast && <span aria-hidden="true">/</span>}
            </span>
          );
        })}
      </nav>
    </>
  );
}
