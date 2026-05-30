import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import InvoiceModal from "@/components/portal/admin/InvoiceModal";
import type { Client, Engagement, Invoice } from "@/lib/database.types";

const mockClients: Client[] = [
  {
    id: "c1",
    profile_id: null,
    name: "Alexandra Whitfield",
    email: "alex@proton.me",
    phone: null,
    property: "1247 PCH, Malibu",
    area: "Malibu",
    status: "active",
    notes: null,
    created_at: "2025-01-01",
    updated_at: "2025-01-01",
  },
];

const mockEngagements: Engagement[] = [
  {
    id: "e1",
    client_id: "c1",
    type: "Mold & Water Intrusion",
    phase: "2",
    phase_label: "Independent Assessment",
    start_date: "2025-01-15",
    next_milestone: null,
    property: "1247 PCH, Malibu",
    notes: null,
    created_at: "2025-01-01",
    updated_at: "2025-01-01",
  },
];

const mockInvoice: Invoice = {
  id: "inv1",
  client_id: "c1",
  engagement_id: "e1",
  invoice_number: "JRA-2025-101",
  description: "Phase I — Consultation",
  amount: 4500,
  status: "sent",
  due_date: "2025-06-15",
  paid_date: null,
  pdf_path: null,
  notes: "Net 30",
  stripe_session_id: null,
  stripe_payment_id: null,
  created_at: "2025-01-01",
  updated_at: "2025-01-01",
};

describe("InvoiceModal", () => {
  const onClose = vi.fn();
  const onSave = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 'New Invoice' title for create mode", () => {
    render(
      <InvoiceModal
        open={true}
        onClose={onClose}
        onSave={onSave}
        clients={mockClients}
        engagements={mockEngagements}
      />
    );
    expect(screen.getByText("New Invoice")).toBeInTheDocument();
  });

  it("renders 'Edit Invoice' title for edit mode", () => {
    render(
      <InvoiceModal
        open={true}
        onClose={onClose}
        onSave={onSave}
        clients={mockClients}
        engagements={mockEngagements}
        invoice={mockInvoice}
      />
    );
    expect(screen.getByText("Edit Invoice")).toBeInTheDocument();
  });

  it("renders all required field labels", () => {
    render(
      <InvoiceModal
        open={true}
        onClose={onClose}
        onSave={onSave}
        clients={mockClients}
        engagements={mockEngagements}
      />
    );
    expect(screen.getByText("Client *")).toBeInTheDocument();
    expect(screen.getByText("Engagement")).toBeInTheDocument();
    expect(screen.getByText("Invoice Number")).toBeInTheDocument();
    expect(screen.getByText("Amount ($) *")).toBeInTheDocument();
    expect(screen.getByText("Description *")).toBeInTheDocument();
    expect(screen.getByText("Due Date")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("renders status dropdown with all invoice statuses", () => {
    render(
      <InvoiceModal
        open={true}
        onClose={onClose}
        onSave={onSave}
        clients={mockClients}
        engagements={mockEngagements}
      />
    );
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("Sent")).toBeInTheDocument();
    expect(screen.getByText("Paid")).toBeInTheDocument();
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });

  it("pre-fills form in edit mode", () => {
    render(
      <InvoiceModal
        open={true}
        onClose={onClose}
        onSave={onSave}
        clients={mockClients}
        engagements={mockEngagements}
        invoice={mockInvoice}
      />
    );
    expect(screen.getByDisplayValue("JRA-2025-101")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Phase I — Consultation")).toBeInTheDocument();
    expect(screen.getByDisplayValue("4500")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Net 30")).toBeInTheDocument();
  });

  it("disables CREATE when required fields are empty", () => {
    render(
      <InvoiceModal
        open={true}
        onClose={onClose}
        onSave={onSave}
        clients={mockClients}
        engagements={mockEngagements}
      />
    );
    const btn = screen.getByText("CREATE");
    // Amount is 0 and description is empty, so should be disabled
    expect(btn).toBeDisabled();
  });

  it("calls onClose when CANCEL is clicked", () => {
    render(
      <InvoiceModal
        open={true}
        onClose={onClose}
        onSave={onSave}
        clients={mockClients}
        engagements={mockEngagements}
      />
    );
    fireEvent.click(screen.getByText("CANCEL"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("auto-generates invoice number in create mode", () => {
    render(
      <InvoiceModal
        open={true}
        onClose={onClose}
        onSave={onSave}
        clients={mockClients}
        engagements={mockEngagements}
      />
    );
    const invoiceInput = screen.getByDisplayValue(/JRA-/);
    expect(invoiceInput).toBeInTheDocument();
  });

  it("calls onSave on submit with valid data", async () => {
    render(
      <InvoiceModal
        open={true}
        onClose={onClose}
        onSave={onSave}
        clients={mockClients}
        engagements={mockEngagements}
        invoice={mockInvoice}
      />
    );
    fireEvent.click(screen.getByText("UPDATE"));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: "c1",
          amount: 4500,
          description: "Phase I — Consultation",
        })
      );
    });
  });
});
