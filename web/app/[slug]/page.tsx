import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { client } from "@/sanity/client";
import { ModuleStack } from "@/components/modules/ModuleStack";
import type { StackModule } from "@/sanity/types/modules";
import {
  pickLocalizedString,
  type IntlStringEntry,
} from "@/sanity/localizedString";
import { pageBySlugQuery, pageSlugsQuery } from "@/sanity/queries";

type PageSeo = {
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
} | null;

type PageModule = StackModule;

type PageDocument = {
  _id: string;
  title?: IntlStringEntry[] | null;
  slug?: { current?: string | null } | null;
  modules?: PageModule[] | null;
  seo?: PageSeo;
};

async function getPage(slug: string): Promise<PageDocument | null> {
  return client.fetch<PageDocument | null>(pageBySlugQuery, { slug });
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const rows = await client.fetch<Array<{ slug: string }>>(pageSlugsQuery);
  return rows
    .map((row) => row.slug)
    .filter((s): s is string => typeof s === "string" && s.length > 0)
    .map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getPage(slug);
  if (!doc) {
    return { title: "Not found" };
  }

  const heading = pickLocalizedString(doc.title);
  const metaTitle = doc.seo?.title?.trim() || heading || slug;
  const description = doc.seo?.description?.trim() || undefined;
  const ogImage = doc.seo?.imageUrl || undefined;

  return {
    title: metaTitle,
    description,
    openGraph: {
      title: metaTitle,
      description,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const doc = await getPage(slug);

  if (!doc) {
    notFound();
  }

  const heading = pickLocalizedString(doc.title) ?? slug;
  const modules = doc.modules ?? [];

  return (
    <div className="flex flex-col flex-1 bg-surfaceMuted font-sans dark:bg-bgColor">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-16 sm:px-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-headingColor">
            {heading}
          </h1>
          <p className="text-sm text-textMuted">
            /{doc.slug?.current ?? slug}
          </p>
        </header>

        {modules.length > 0 ? (
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-textMuted">
              Modules
            </h2>
            <ModuleStack modules={modules} />
          </section>
        ) : (
          <p className="text-textMuted">
            No modules on this page yet. Add modules in Sanity Studio.
          </p>
        )}
      </main>
    </div>
  );
}
