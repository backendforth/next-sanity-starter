import { getHome } from "@/src/sanity/getHome";
import { pickLocalizedString } from "@/src/sanity/localizedString";
import { moduleLabel } from "@/src/sanity/moduleLabel";

export default async function Home() {
  const home = await getHome();

  if (!home) {
    return (
      <div className="flex flex-col flex-1 bg-zinc-50 font-sans dark:bg-black">
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-16 sm:px-8">
          <p className="text-zinc-600 dark:text-zinc-400">
            Home singleton is not in the dataset yet. Create it in Sanity Studio
            (document id <code className="rounded bg-zinc-200 px-1 py-0.5 text-sm dark:bg-zinc-800">home</code>
            ).
          </p>
        </main>
      </div>
    );
  }

  const heading = pickLocalizedString(home.title) ?? "Home";
  const modules = home.modules ?? [];

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-16 sm:px-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {heading}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">/</p>
        </header>

        {modules.length > 0 ? (
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Modules
            </h2>
            <ol className="list-decimal space-y-2 pl-5 text-zinc-700 dark:text-zinc-300">
              {modules.map((mod) => (
                <li key={mod._key ?? mod._type}>
                  {moduleLabel(mod._type)}
                </li>
              ))}
            </ol>
          </section>
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400">
            No modules on the home page yet. Add modules in Sanity Studio.
          </p>
        )}
      </main>
    </div>
  );
}
