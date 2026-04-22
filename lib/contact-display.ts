/**
 * Heuristics for how to show session `contact_info` on the share page.
 */
export type ContactInfoKind = "phone" | "handle" | "other";

const btnBase =
  "flex min-h-[44px] flex-1 items-center justify-center rounded-[8px] border border-[#E8E8E4] bg-white px-3 text-sm font-semibold text-[#1A1A18] transition hover:bg-[#F4F4F0]";

export function contactInfoKind(raw: string): ContactInfoKind {
  const t = raw.trim();
  if (!t) {
    return "other";
  }
  if (t.startsWith("@")) {
    return "handle";
  }
  if (t.startsWith("+")) {
    return "phone";
  }
  const noSpace = t.replace(/\s/g, "");
  if (noSpace.length === 0) {
    return "other";
  }
  const digitCount = (t.match(/\d/g) ?? []).length;
  if (digitCount / noSpace.length >= 0.6) {
    return "phone";
  }
  return "other";
}

export function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

export function smsHref(phoneLike: string): string {
  const t = phoneLike.trim();
  if (t.startsWith("+")) {
    return `sms:${encodeURIComponent(t)}`;
  }
  const d = digitsOnly(t);
  return d ? `sms:${d}` : "sms:";
}

export function whatsappHref(phoneLike: string): string {
  const d = digitsOnly(phoneLike);
  return d ? `https://wa.me/${d}` : "#";
}

export { btnBase as contactActionButtonClass };

export const contactWhatsAppButtonClass = `${btnBase} border-l-4 border-l-[#25D366] pl-2`;
