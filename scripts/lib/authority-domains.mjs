// Whitelist stricte de domaines d'autorité pour les liens sortants des
// articles. Claude ne DOIT proposer que des URLs dont le domaine est dans
// cette liste. Toute URL hors whitelist sera rejetée en post-check.
//
// Classement par catégorie éditoriale pour pouvoir filtrer rapidement.

export const AUTHORITY_DOMAINS = {
  // Sciences et physiologie du sport
  science: [
    "pubmed.ncbi.nlm.nih.gov",
    "www.ncbi.nlm.nih.gov",
    "bjsm.bmj.com",
    "journals.lww.com",
    "www.nature.com",
    "www.sciencedirect.com",
    "pmc.ncbi.nlm.nih.gov",
    "link.springer.com",
    "www.thelancet.com",
  ],
  // Organismes officiels sport et santé FR
  orgFR: [
    "www.insep.fr",
    "www.athle.fr",
    "www.ffathletisme.org",
    "www.anses.fr",
    "www.inserm.fr",
    "www.santepubliquefrance.fr",
    "www.lenutritionniste-du-sport.com",
  ],
  // Courses et circuits trail officiels
  trailOfficial: [
    "utmbmontblanc.com",
    "www.utmb.world",
    "www.tordesgeants.it",
    "www.hardrock100.com",
    "www.wser.org",
    "ultra-trail-mt-fuji.com",
    "www.transgrancanaria.net",
    "www.lavaredoultratrail.com",
  ],
  // Médias trail de référence (pour citations, pas plagiat)
  mediaTrail: [
    "www.irunfar.com",
    "www.trailrunnermag.com",
    "ultrarunning.com",
    "www.lepape-info.com",
    "www2.u-trail.com",
    "passiontrail.fr",
    "runactu.com",
    "marathonhandbook.com",
  ],
  // Fédérations internationales
  federations: [
    "www.itra.run",
    "worldathletics.org",
    "www.iau-ultramarathon.org",
  ],
};

// Liste plate pour validation rapide
export const ALLOWED_AUTHORITY_HOSTS = new Set(
  Object.values(AUTHORITY_DOMAINS).flat()
);

// Description textuelle pour injecter dans le prompt Claude
export function authorityDomainsListForPrompt() {
  const lines = [];
  lines.push("Sciences sport/physiologie : " + AUTHORITY_DOMAINS.science.join(", "));
  lines.push("Organismes officiels France : " + AUTHORITY_DOMAINS.orgFR.join(", "));
  lines.push("Courses et circuits : " + AUTHORITY_DOMAINS.trailOfficial.join(", "));
  lines.push("Médias trail établis : " + AUTHORITY_DOMAINS.mediaTrail.join(", "));
  lines.push("Fédérations : " + AUTHORITY_DOMAINS.federations.join(", "));
  return lines.join("\n");
}

export function isAllowedHost(urlOrHost) {
  try {
    const u = urlOrHost.startsWith("http") ? new URL(urlOrHost) : new URL("https://" + urlOrHost);
    const host = u.hostname.replace(/^www\./, "www.");
    // Match strict ou avec www. retiré
    return ALLOWED_AUTHORITY_HOSTS.has(u.hostname) ||
      ALLOWED_AUTHORITY_HOSTS.has(u.hostname.replace(/^www\./, ""));
  } catch {
    return false;
  }
}

// Valide qu'une URL répond (HEAD request, timeout 5s) avant commit.
// Évite de publier des liens morts dès le départ.
export async function urlIsAlive(url, timeoutMs = 5000) {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "AltitudeTrailBot/1.0" },
    });
    clearTimeout(t);
    // Certains serveurs refusent HEAD : fallback sur GET range 0-0
    if (res.status === 405 || res.status === 403) {
      const controller2 = new AbortController();
      const t2 = setTimeout(() => controller2.abort(), timeoutMs);
      const res2 = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller2.signal,
        headers: { Range: "bytes=0-0", "User-Agent": "AltitudeTrailBot/1.0" },
      });
      clearTimeout(t2);
      return res2.ok || res2.status === 206;
    }
    return res.ok;
  } catch {
    return false;
  }
}
