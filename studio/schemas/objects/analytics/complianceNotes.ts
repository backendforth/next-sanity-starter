/**
 * Shared privacy copy for the analytics tracker schemas.
 *
 * An editor picking providers in the Studio cannot see which of them transmits
 * personal data before the visitor answers the banner, which needs an
 * agreement signed outside Sanity, or which one quietly records what visitors
 * type. These strings put that in front of them at the point of the decision.
 *
 * Practical guidance for editors, not legal advice — the lawful basis for each
 * provider belongs to whoever owns privacy for the site.
 */

/** Why "cookie-free" is not the same thing as "consent-free". */
export const COOKIE_FREE_NOTE =
  "Cookie-free means nothing is written to the visitor's device, so the ePrivacy consent rule for cookies does not apply — which is why trackers marked cookie-free load *before* the visitor answers the banner. The provider still receives personal data (at minimum IP address and user agent), and that processing needs its own lawful basis under the GDPR. Confirm that is acceptable for this provider before switching it on.";

/** Obligations that live outside the CMS and are easy to forget. */
export const CONTROLLER_CHECKLIST =
  "Before enabling: name this provider and its purpose in your privacy policy, have a data processing agreement in place, and record the transfer basis if the data leaves the EEA.";
