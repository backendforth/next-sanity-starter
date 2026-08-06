/**
 * Shared privacy notes for the analytics tracker schemas.
 *
 * Deliberately terse: name the risk an editor cannot see from the CMS — what
 * loads before consent, what leaves the EEA, what has to be signed elsewhere —
 * and stop there. Not legal advice.
 */

/** Cookie-free removes the ePrivacy cookie trigger, not the GDPR basis for what is still sent. */
export const COOKIE_FREE_NOTE =
  "Loads before consent. The provider still receives IP and user agent.";

/** Obligations that live outside the CMS. */
export const CONTROLLER_CHECKLIST =
  "Needs: privacy policy entry, DPA, transfer basis if data leaves the EEA.";
