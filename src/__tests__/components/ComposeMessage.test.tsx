import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ComposeMessage from "@/components/portal/admin/ComposeMessage";
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

describe("ComposeMessage", () => {
  const onClose = vi.fn();
  const onSent = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch for send
    global.fetch = vi.fn();
  });

  it("renders 'New Message' title", () => {
    render(
      <ComposeMessage
        clients={mockClients}
        engagements={mockEngagements}
        onClose={onClose}
        onSent={onSent}
      />
    );
    expect(screen.getByText("New Message")).toBeInTheDocument();
  });

  it("renders To, Subject, and Message fields", () => {
    render(
      <ComposeMessage
        clients={mockClients}
        engagements={mockEngagements}
        onClose={onClose}
        onSent={onSent}
      />
    );
    expect(screen.getByText("To")).toBeInTheDocument();
    expect(screen.getByText("Subject")).toBeInTheDocument();
    expect(screen.getByText("Message")).toBeInTheDocument();
  });

  it("renders client options in dropdown", () => {
    render(
      <ComposeMessage
        clients={mockClients}
        engagements={mockEngagements}
        onClose={onClose}
        onSent={onSent}
      />
    );
    expect(screen.getByText("Alexandra Whitfield")).toBeInTheDocument();
  });

  it("pre-selects client when preselectedClientId is provided", () => {
    render(
      <ComposeMessage
        clients={mockClients}
        engagements={mockEngagements}
        preselectedClientId="c1"
        onClose={onClose}
        onSent={onSent}
      />
    );
    const select = screen.getByDisplayValue("Alexandra Whitfield");
    expect(select).toBeInTheDocument();
  });

  it("calls onClose when Cancel button is clicked", () => {
    render(
      <ComposeMessage
        clients={mockClients}
        engagements={mockEngagements}
        onClose={onClose}
        onSent={onSent}
      />
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when overlay is clicked", () => {
    const { container } = render(
      <ComposeMessage
        clients={mockClients}
        engagements={mockEngagements}
        onClose={onClose}
        onSent={onSent}
      />
    );
    // Click the outer overlay div
    const overlay = container.firstChild as HTMLElement;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it("renders close button", () => {
    render(
      <ComposeMessage
        clients={mockClients}
        engagements={mockEngagements}
        onClose={onClose}
        onSent={onSent}
      />
    );
    expect(screen.getByText("✕")).toBeInTheDocument();
  });

  it("shows error when submitting empty fields", async () => {
    render(
      <ComposeMessage
        clients={mockClients}
        engagements={mockEngagements}
        onClose={onClose}
        onSent={onSent}
      />
    );
    fireEvent.click(screen.getByText("Send Message"));
    await waitFor(() => {
      expect(screen.getByText("Please fill in all fields")).toBeInTheDocument();
    });
  });

  it("calls fetch on valid submit", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(
      <ComposeMessage
        clients={mockClients}
        engagements={mockEngagements}
        preselectedClientId="c1"
        onClose={onClose}
        onSent={onSent}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Message subject..."), {
      target: { value: "Test Subject" },
    });
    fireEvent.change(screen.getByPlaceholderText("Type your message..."), {
      target: { value: "Test body content" },
    });
    fireEvent.click(screen.getByText("Send Message"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/messages/send",
        expect.objectContaining({ method: "POST" })
      );
    });
  });
});
