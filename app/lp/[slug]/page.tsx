import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedLandingPageBySlugGlobal } from "@/services/marketing/landing-pages";
import { PublicLeadForm } from "@/components/marketing/public-lead-form";
import { TrackVisit } from "@/components/marketing/track-visit";
import { submitLandingFormAction } from "./actions";
import type { FormFieldDef } from "@/services/marketing/landing-pages";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedLandingPageBySlugGlobal(slug);
  return { title: page ? `${page.headline} — VIMOVE OS` : "Không tìm thấy trang" };
}

export default async function PublicLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPublishedLandingPageBySlugGlobal(slug);
  if (!page) notFound();

  const form = page.forms[0];

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-muted/30 px-4 py-16">
      <TrackVisit landingPageId={page.id} />
      <div className="grid w-full max-w-4xl gap-10 md:grid-cols-2 md:items-center">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium text-primary">VIMOVE</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{page.headline}</h1>
          {page.body && <p className="text-muted-foreground">{page.body}</p>}
        </div>
        {form ? (
          <PublicLeadForm
            formId={form.id}
            fields={form.fields as unknown as FormFieldDef[]}
            ctaLabel={page.ctaLabel || "Gửi đăng ký"}
            onSubmit={submitLandingFormAction}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Trang chưa có form đăng ký.</p>
        )}
      </div>
    </main>
  );
}
