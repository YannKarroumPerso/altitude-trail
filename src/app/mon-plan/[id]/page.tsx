import type { Metadata } from "next";
import Breadcrumb from "@/components/ui/Breadcrumb";
import MonPlanClient from "@/components/entrainement/MonPlanClient";

export const metadata: Metadata = {
  title: "Ton plan d'entraînement",
  robots: { index: false, follow: false }, // pages utilisateur privees, pas d indexation
};

export default async function MonPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const breadcrumb = [
    { label: "Accueil", href: "/" },
    { label: "Entraînement", href: "/categories/entrainement" },
    { label: "Mon plan" },
  ];
  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-12">
      <div className="border-b-2 border-navy pb-6 mb-10 no-print">
        <Breadcrumb items={breadcrumb} />
        <h1 className="font-headline text-4xl md:text-5xl font-black uppercase tracking-tighter">
          Ton plan d&apos;entra&icirc;nement
        </h1>
      </div>
      <MonPlanClient planId={id} />
    </div>
  );
}
