"use client";

import { useServerInsertedHTML } from "next/navigation";

/**
 * Tiny blocking inline script — runs synchronously before hydration.
 *
 * 1. Applies the stored theme override (`localStorage["color-scheme"]`) as
 *    `data-theme="light" | "dark"` on <html> **before** the first paint. For
 *    `"system"` or a missing value the attribute stays unset, so the
 *    `@media (prefers-color-scheme: dark)` rule in `variables/colors.css`
 *    takes over — works without JavaScript.
 * 2. Adds `js-enabled` to <html> so CSS can safely start images at opacity:0.
 *
 * Injected via `useServerInsertedHTML` so React 19 does not warn about a
 * `<script>` in the client component tree (the script is only in the SSR HTML).
 */
const bootScript = `(function(){
  try{
    var t=localStorage.getItem('color-scheme');
    if(t==='light'||t==='dark'){
      document.documentElement.setAttribute('data-theme',t);
    }
  }catch(e){}
  document.documentElement.classList.add('js-enabled');
})();`;

export function DocumentBootScript() {
	useServerInsertedHTML(() => (
		// biome-ignore lint/security/noDangerouslySetInnerHtml: controlled inline script, no user input
		<script dangerouslySetInnerHTML={{ __html: bootScript }} />
	));
	return null;
}
