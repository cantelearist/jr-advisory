"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SubmitState =
  | { status: "idle"; message: "" }
  | { status: "submitting"; message: "Submitting secure request..." }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function ConsultationForm() {
  const [state, setState] = useState<SubmitState>({ status: "idle", message: "" });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "submitting", message: "Submitting secure request..." });

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch("/api/consultations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as { message?: string; errors?: Record<string, string[]> };

    if (!response.ok) {
      setState({
        status: "error",
        message:
          result.message ??
          Object.values(result.errors ?? {})[0]?.[0] ??
          "The request could not be submitted.",
      });
      return;
    }

    form.reset();
    setState({
      status: "success",
      message: result.message ?? "Request received. The advisory team will review it privately.",
    });
  }

  const isSubmitting = state.status === "submitting";

  return (
    <Card className="rounded-md shadow-none">
      <CardHeader>
        <CardTitle>Consultation request</CardTitle>
        <CardDescription>
          Submissions are validated locally and prepared for secure advisor review.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={onSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" autoComplete="name" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="market">Primary market</Label>
              <Input id="market" name="market" placeholder="Malibu, Bel Air, Beverly Hills..." required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="matter">Matter type</Label>
              <Input id="matter" name="matter" placeholder="Remediation, structural, diligence..." required />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="message">Brief context</Label>
            <Textarea id="message" name="message" rows={5} required />
          </div>
          <Button type="submit" size="lg" className="justify-self-start" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
            Submit request
            {isSubmitting ? null : <ArrowRight data-icon="inline-end" />}
          </Button>
          {state.status !== "idle" ? (
            <p
              className="flex items-start gap-2 text-sm text-muted-foreground"
              role={state.status === "error" ? "alert" : "status"}
            >
              {state.status === "success" ? <CheckCircle2 className="mt-0.5 text-primary" aria-hidden /> : null}
              <span>{state.message}</span>
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
