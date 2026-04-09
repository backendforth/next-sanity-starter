import { ModuleStack } from "@/src/components/modules/ModuleStack";
import { getHome } from "@/sanity/getHome";
import { pickLocalizedString } from "@/sanity/localizedString";

export default async function Home() {
  const home = await getHome();

  if (!home) {
    return (
      <div className="flex flex-col flex-1 bg-bgColor">
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-16 sm:px-8">
          <p className="text-textMuted">
            Home singleton is not in the dataset yet. Create it in Sanity Studio
            (document id <code className="rounded bg-codeBg px-1 py-0.5 text-sm text-codeText">home</code>
            ).
          </p>
        </main>
      </div>
    );
  }

  const heading = pickLocalizedString(home.title) ?? "Home";
  const modules = home.modules ?? [];

  return (
    <div className="flex flex-col flex-1 bg-bgColor">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-16 sm:px-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-headingColor">
            {heading}
          </h1>
          <p className="text-sm text-textMuted">/</p>
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
            No modules on the home page yet. Add modules in Sanity Studio.
          </p>
        )}
      </main>
    </div>
  );
}
