import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EngagementModal from "@/components/portal/admin/EngagementModal";
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
  {
    id: "c2",
    profile_id: null,
    name: "Marcus Chen",
    email: "marcus@email.com",
    phone: null,
    property: "456 Sunset, Beverly Hills",
    area: "Beverly Hills",
    status: "active",
    notes: null,
    created_at: "2025-01-01",
    updated_at: "2025-01-01",
  },
];

const mockEngagement: Engagement = {
  id: "e1",
  client_id: "c1",
  type: "Mold & Water Intrusion",
  phase: "2",
  phase_label: "Independent Assessment",
  start_date: "2025-01-15",
  next_milestone: "Vendor shortlist — May 22",
  property: "1247 PCH, Malibu",
  notes: "Test notes",
  created_at: "2025-01-01",
  updated_at: "2025-01-01",
};

describe("EngagementModal", () => {
  const onClose = vi.fn();
  const onSave = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 'New Engagement' title for create mode", () => {
    render(
      <EngagementModal
        open={true}
        onClose={onClose}
        onSave={onSave}
        clients={mockClients}
      />
    );
    expect(screen.getByText("New Engagement")).toBeInTheDocument();
  });

  it("renders 'Edit Engagement' title for edit mode", () => {
    render(
      <EngagementModal
        open={true}
        onClose={onClose}
        onSave={onSave}
        clients={mockClients}
        engagement={mockEngagement}
      />
    );
    expect(screen.getByText("Edit Engagement")).toBeInTheDocument();
  });

  it("renders client dropdown in create mode", () => {
    render(
      <EngagementModal
        open={true}
        onClose={onClose}
        onSave={onSave}
        clients={mockClients}
      />
    );
    expect(screen.getByText("Client *")).toBeInTheDocument();
    expect(screen.getByText(/Alexandra Whitfield/)).toBeInTheDocument();
    expect(screen.getByText(/Marcus Chen/)).toBeInTheDocument();
  });

  it("renders engagement type dropdown", () => {
    render(
      <EngagementModal
        open={true}
        onClose={onClose}
        onSave={onSave}
        clients={mockClients}
      />
    );
    expect(screen.getByText("Engagement Type *")).toBeInTheDocument();
  });

  it("renders all four phase buttons", () => {
    render(
      <EngagementModal
        open={true}
        onClose={onClose}
        onSave={onSave}
        clients={mockClients}
      />
    );
    expect(screen.getByText("I")).toBeInTheDocument();
    expect(screen.getByText("II")).toBeInTheDocument();
    expect(screen.getByText("III")).toBeInTheDocument();
    expect(screen.getByText("IV")).toBeInTheDocument();
  });

  it("renders Property and Next Milestone fields", () => {
    render(
      <EngagementModal
        open={true}
        onClose={onClose}
        onSave={onSave}
        clients={mockClients}
      />
    );
    expect(screen.getByText("Property")).toBeInTheDocument();
    expect(screen.getByText("Next Milestone")).toBeInTheDocument();
  });

  it("renders Notes textarea", () => {
    render(
      <EngagementModal
        open={true}
        onClose={onClose}
        onSave={onSave}
        clients={mockClients}
      />
    );
    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Internal notes about this engagement...")
    ).toBeInTheDocument();
  });

  it("calls onClose when CANCEL is clicked", () => {
    render(
      <EngagementModal
        open={true}
        onClose={onClose}
        onSave={onSave}
        clients={mockClients}
      />
    );
    fireEvent.click(screen.getByText("CANCEL"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("pre-fills notes in edit mode", () => {
    render(
      <EngagementModal
        open={true}
        onClose={onClose}
        onSave={onSave}
        clients={mockClients}
        engagement={mockEngagement}
      />
    );
    expect(screen.getByDisplayValue("Test notes")).toBeInTheDocument();
  });

  it("calls onSave on submit with valid data", async () => {
    render(
      <EngagementModal
        open={true}
        onClose={onClose}
        onSave={onSave}
        clients={mockClients}
      />
    );
    // Default has first client selected
    fireEvent.click(screen.getByText("CREATE"));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: "c1",
          type: "Mold & Water Intrusion",
          phase: "1",
        })
      );
    });
  });
});
