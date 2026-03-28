/**
 * analytics.ts
 *
 * Universal client-side track() utility.
 * Works with GA4, Meta Pixel, TikTok, Pinterest, X Tag — fires whichever
 * platforms have been initialized on the page (all gracefully no-op if not).
 *
 * Usage:
 *   import { track } from '../utils/analytics';
 *   track('form_submit', { niche: 'plumbing', city: 'Austin' });
 */

export type TrackEventName =
  | 'page_view'
  | 'form_start'
  | 'form_step'
  | 'form_submit'
  | 'lead_magnet_click'
  | 'cta_click'
  | 'survey_complete'
  | string;

export interface TrackPayload {
  niche?: string;
  sub_niche?: string;
  city?: string;
  state?: string;
  [key: string]: string | number | boolean | undefined;
}

export function track(event: TrackEventName, payload: TrackPayload = {}): void {
  const w = (window as unknown) as Record<string, any>;

  // ── GA4 ───────────────────────────────────────────────────────────────────
  if (typeof w['gtag'] === 'function') {
    try {
      (w['gtag'] as Function)('event', event, payload);
    } catch { /* ignore */ }
  }

  // ── Meta Pixel ────────────────────────────────────────────────────────────
  if (typeof w['fbq'] === 'function') {
    try {
      const metaEventMap: Record<string, string> = {
        form_submit: 'Lead',
        survey_complete: 'CompleteRegistration',
        cta_click: 'InitiateCheckout',
        lead_magnet_click: 'ViewContent',
      };
      const metaEvent = metaEventMap[event] ?? 'CustomEvent';
      if (metaEventMap[event]) {
        (w['fbq'] as Function)('track', metaEvent, payload);
      } else {
        (w['fbq'] as Function)('trackCustom', event, payload);
      }
    } catch { /* ignore */ }
  }

  // ── TikTok ────────────────────────────────────────────────────────────────
  if (typeof w['ttq'] === 'object' && w['ttq'] !== null) {
    try {
      const ttq = w['ttq'] as { track: Function };
      const tiktokEventMap: Record<string, string> = {
        form_submit: 'SubmitForm',
        survey_complete: 'CompleteRegistration',
        cta_click: 'ClickButton',
      };
      const tiktokEvent = tiktokEventMap[event] ?? event;
      ttq.track(tiktokEvent, payload);
    } catch { /* ignore */ }
  }

  // ── Pinterest ─────────────────────────────────────────────────────────────
  if (typeof w['pintrk'] === 'function') {
    try {
      const pintrkEventMap: Record<string, string> = {
        form_submit: 'lead',
        cta_click: 'checkout',
      };
      const pintrkEvent = pintrkEventMap[event];
      if (pintrkEvent) {
        (w['pintrk'] as Function)('track', pintrkEvent, payload);
      }
    } catch { /* ignore */ }
  }

  // ── X (Twitter) Tag ───────────────────────────────────────────────────────
  if (typeof w['twq'] === 'function') {
    try {
      (w['twq'] as Function)('event', event === 'form_submit' ? 'tw-form-submit' : event, payload);
    } catch { /* ignore */ }
  }

  // ── Debug logging (dev only) ──────────────────────────────────────────────
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[track]', event, payload);
  }
}
