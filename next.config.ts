import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
