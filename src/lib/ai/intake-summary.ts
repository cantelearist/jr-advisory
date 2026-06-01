import { redactSensitiveText, hashPromptBoundary } from "./redaction";
import type { ConsultationInput } from "@/lib/intake";

export type IntakeSummaryDraft = {
  scopeTags: string[];
  jurisdiction: string;
  riskSignals: string[];
  advisorNote: string;
  promptHash: string;
};

export function draftLocalIntakeSummary(input: ConsultationInput): IntakeSummaryDraft {
  const text = `${input.market} ${input.matter} ${input.message}`.toLowerCase();
  const scopeTags = [
    text.includes("structural") ? "structural-inspection" : null,
    text.includes("remediation") || text.includes("asbestos") || text.includes("mold")
      ? "hazardous-materials"
      : null,
    text.includes("purchase") || text.includes("close") ? "transaction-diligence" : null,
  ].filter(Boolean) as string[];

  return {
    scopeTags: scopeTags.length ? scopeTags : ["advisor-review"],
    jurisdiction: input.market,
    riskSignals: text.includes("urgent") ? ["time-sensitive"] : ["standard-screening"],
    advisorNote: redactSensitiveText(input.message).slice(0, 500),
    promptHash: hashPromptBoundary(`${input.market}:${input.matter}:${input.message.length}`),
  };
}
