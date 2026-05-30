import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DocumentUpload from "@/components/portal/admin/DocumentUpload";
import type { Client, Engagement } from "@/lib/database.types";

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

describe("DocumentUpload", () => {
  const onUploadComplete = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders 'Upload Document' title", () => {
    render(
      <DocumentUpload
        clients={mockClients}
        engagements={mockEngagements}
        onUploadComplete={onUploadComplete}
        onClose={onClose}
      />
    );
    expect(screen.getByText("Upload Document")).toBeInTheDocument();
  });

  it("renders client dropdown", () => {
    render(
      <DocumentUpload
        clients={mockClients}
        engagements={mockEngagements}
        onUploadComplete={onUploadComplete}
        onClose={onClose}
      />
    );
    expect(screen.getByText("Client")).toBeInTheDocument();
    expect(screen.getByText("Select client…")).toBeInTheDocument();
  });

  it("renders category dropdown with all document categories", () => {
    render(
      <DocumentUpload
        clients={mockClients}
        engagements={mockEngagements}
        onUploadComplete={onUploadComplete}
        onClose={onClose}
      />
    );
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("NDA")).toBeInTheDocument();
    expect(screen.getByText("Lab Results")).toBeInTheDocument();
    expect(screen.getByText("Proposals")).toBeInTheDocument();
    expect(screen.getByText("Clearance Letters")).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
  });

  it("renders document name input", () => {
    render(
      <DocumentUpload
        clients={mockClients}
        engagements={mockEngagements}
        onUploadComplete={onUploadComplete}
        onClose={onClose}
      />
    );
    expect(screen.getByText("Document Name")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("e.g. Phase 2 Lab Results — Malibu")
    ).toBeInTheDocument();
  });

  it("renders file dropzone", () => {
    render(
      <DocumentUpload
        clients={mockClients}
        engagements={mockEngagements}
        onUploadComplete={onUploadComplete}
        onClose={onClose}
      />
    );
    expect(screen.getByText("Click to select file")).toBeInTheDocument();
    expect(
      screen.getByText("PDF, Word, Excel, images — max 50MB")
    ).toBeInTheDocument();
  });

  it("disables upload button when fields are empty", () => {
    render(
      <DocumentUpload
        clients={mockClients}
        engagements={mockEngagements}
        onUploadComplete={onUploadComplete}
        onClose={onClose}
      />
    );
    const btn = screen.getByText("Upload to Vault");
    expect(btn).toBeDisabled();
  });

  it("calls onClose when close button is clicked", () => {
    render(
      <DocumentUpload
        clients={mockClients}
        engagements={mockEngagements}
        onUploadComplete={onUploadComplete}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByText("✕"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when overlay is clicked", () => {
    const { container } = render(
      <DocumentUpload
        clients={mockClients}
        engagements={mockEngagements}
        onUploadComplete={onUploadComplete}
        onClose={onClose}
      />
    );
    const overlay = container.querySelector(".doc-upload-overlay") as HTMLElement;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it("shows engagement dropdown after client is selected", () => {
    render(
      <DocumentUpload
        clients={mockClients}
        engagements={mockEngagements}
        onUploadComplete={onUploadComplete}
        onClose={onClose}
      />
    );
    // Select a client
    const clientSelect = screen.getByText("Select client…").closest("select")!;
    fireEvent.change(clientSelect, { target: { value: "c1" } });

    // Now the engagement dropdown should show the engagement
    expect(screen.getByText(/Mold & Water Intrusion/)).toBeInTheDocument();
  });
});
