import type { Trace } from "@/types";
import raw from "./traces-database.json";

// Le JSON est importé séparément — TypeScript refuse d'inférer l'union
// type de 4500+ objets literaux. Généré par scripts/import-traces.mjs.
export const traces: Trace[] = raw as Trace[];
