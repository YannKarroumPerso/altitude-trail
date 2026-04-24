import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Redirections 301 — évite la cannibalisation SEO sur des pages aux
  // contenus proches et préserve le jus des liens entrants éventuels.
  async redirects() {
    return [
      {
        source: "/trouver-une-course",
        destination: "/courses",
        permanent: true,
      },
      // 301 : corrige les 404 dus a un mismatch filename/frontmatter-slug.
      // Les articles ont ete publies avec un frontmatter slug qui differe du
      // nom de fichier, donc le site les sert aux nouvelles URLs pendant que
      // Google a indexe les anciennes URLs (filename-based).
      {
        source: "/articles/biolite-range-500-headlamp-review",
        destination:
          "/articles/biolite-range-500-74-grammes-et-8-minutes-de-charge-pour-les-nuits-de-trail",
        permanent: true,
      },
      {
        source:
          "/articles/kilian-jornet-quand-son-message-ecolo-sur-l-utmb-vire-au-placement-de-produit",
        destination:
          "/articles/kilian-jornet-nnormal-et-l-utmb-quand-l-ecologie-devient-un-argument-commercial",
        permanent: true,
      },
      {
        source:
          "/articles/the-200-mile-phenomenon-a-data-based-look-at-their-growth-and-demographics",
        destination:
          "/articles/qui-court-vraiment-les-200-miles-de-trail-95-heures-40-ans-et-des-milliers-d",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "cdn.trailrunnermag.com" },
      { protocol: "https", hostname: "s3.amazonaws.com" },
      { protocol: "https", hostname: "ultrarunningworld.co.uk" },
      { protocol: "https", hostname: "www.corsainmontagna.it" },
      { protocol: "https", hostname: "www.ultrarunnermagazine.co.uk" },
      { protocol: "https", hostname: "www.irunfar.com" },
      { protocol: "https", hostname: "passiontrail.fr" },
      { protocol: "https", hostname: "www.lepape-info.com" },
      { protocol: "https", hostname: "www2.u-trail.com" },
      { protocol: "https", hostname: "runactu.com" },
      { protocol: "https", hostname: "ultrarunning.com" },
      { protocol: "https", hostname: "trailrunningspain.com" },
      { protocol: "https", hostname: "www.discoveryalps.it" },
      { protocol: "https", hostname: "marathonhandbook.com" },
    ],
  },
};

export default nextConfig;
