import { z } from "zod";

export const consultationSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().email("Use a valid email address").max(180),
  market: z.string().trim().min(2, "Primary market is required").max(120),
  matter: z.string().trim().min(2, "Matter type is required").max(160),
  message: z.string().trim().min(20, "Brief context should be at least 20 characters").max(2500),
});

export type ConsultationInput = z.infer<typeof consultationSchema>;

export function redactForAudit(input: ConsultationInput) {
  return {
    nameInitials: input.name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .join("")
      .slice(0, 4),
    emailDomain: input.email.split("@")[1] ?? "unknown",
    market: input.market,
    matter: input.matter,
    messageLength: input.message.length,
  };
}
