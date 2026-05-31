import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ClientModal from "@/components/portal/admin/ClientModal";
import type { Client } from "@/lib/database.types";

const mockClient: Client = {
  id: "c1",
  profile_id: null,
  name: "Alexandra Whitfield",
  email: "alex@proton.me",
  phone: "+1 (310) 555-0142",
  property: "1247 PCH, Malibu",
  area: "Malibu",
  status: "active",
  notes: null,
  created_at: "2025-01-01",
  updated_at: "2025-01-01",
};

describe("ClientModal", () => {
  const onClose = vi.fn();
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onDelete = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when open is false", () => {
    const { container } = render(
      <ClientModal open={false} onClose={onClose} onSave={onSave} />
    );
    expect(container.querySelector(".display")).toBeNull();
  });

  it("renders 'New Client' title when no client provided", () => {
    render(
      <ClientModal open={true} onClose={onClose} onSave={onSave} />
    );
    expect(screen.getByText("New Client")).toBeInTheDocument();
  });

  it("renders 'Edit Client' title when client is provided", () => {
    render(
      <ClientModal
        open={true}
        onClose={onClose}
        onSave={onSave}
        client={mockClient}
      />
    );
    expect(screen.getByText("Edit Client")).toBeInTheDocument();
  });

  it("pre-fills form with client data in edit mode", () => {
    render(
      <ClientModal
        open={true}
        onClose={onClose}
        onSave={onSave}
        client={mockClient}
      />
    );
    expect(screen.getByDisplayValue("Alexandra Whitfield")).toBeInTheDocument();
    expect(screen.getByDisplayValue("alex@proton.me")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1247 PCH, Malibu")).toBeInTheDocument();
  });

  it("renders all required field labels", () => {
    render(
      <ClientModal open={true} onClose={onClose} onSave={onSave} />
    );
    expect(screen.getByText("Full Name *")).toBeInTheDocument();
    expect(screen.getByText("Email *")).toBeInTheDocument();
    expect(screen.getByText("Phone")).toBeInTheDocument();
    expect(screen.getByText("Property Address *")).toBeInTheDocument();
    expect(screen.getByText("Area")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("renders area dropdown with service areas", () => {
    render(
      <ClientModal open={true} onClose={onClose} onSave={onSave} />
    );
    expect(screen.getByText("Malibu")).toBeInTheDocument();
    expect(screen.getByText("Beverly Hills")).toBeInTheDocument();
    expect(screen.getByText("Bel Air")).toBeInTheDocument();
  });

  it("renders status dropdown with all statuses", () => {
    render(
      <ClientModal open={true} onClose={onClose} onSave={onSave} />
    );
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Archived")).toBeInTheDocument();
  });

  it("disables CREATE button when required fields are empty", () => {
    render(
      <ClientModal open={true} onClose={onClose} onSave={onSave} />
    );
    const createBtn = screen.getByText("CREATE");
    expect(createBtn).toBeDisabled();
  });

  it("enables CREATE button when required fields are filled", () => {
    render(
      <ClientModal open={true} onClose={onClose} onSave={onSave} />
    );
    fireEvent.change(screen.getByPlaceholderText("Alexandra Whitfield"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText("client@proton.me"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("1247 Pacific Coast Highway, Malibu"),
      { target: { value: "123 Main St" } }
    );
    const createBtn = screen.getByText("CREATE");
    expect(createBtn).not.toBeDisabled();
  });

  it("calls onSave with form data on submit", async () => {
    render(
      <ClientModal open={true} onClose={onClose} onSave={onSave} />
    );
    fireEvent.change(screen.getByPlaceholderText("Alexandra Whitfield"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText("client@proton.me"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("1247 Pacific Coast Highway, Malibu"),
      { target: { value: "123 Main St" } }
    );
    fireEvent.click(screen.getByText("CREATE"));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test User",
          email: "test@test.com",
          property: "123 Main St",
        })
      );
    });
  });

  it("calls onClose when CANCEL is clicked", () => {
    render(
      <ClientModal open={true} onClose={onClose} onSave={onSave} />
    );
    fireEvent.click(screen.getByText("CANCEL"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows DELETE button only in edit mode with onDelete", () => {
    render(
      <ClientModal
        open={true}
        onClose={onClose}
        onSave={onSave}
        onDelete={onDelete}
        client={mockClient}
      />
    );
    expect(screen.getByText("DELETE")).toBeInTheDocument();
  });

  it("requires double-click to confirm delete", () => {
    render(
      <ClientModal
        open={true}
        onClose={onClose}
        onSave={onSave}
        onDelete={onDelete}
        client={mockClient}
      />
    );
    fireEvent.click(screen.getByText("DELETE"));
    expect(screen.getByText("CONFIRM DELETE")).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("does not show DELETE in create mode", () => {
    render(
      <ClientModal open={true} onClose={onClose} onSave={onSave} />
    );
    expect(screen.queryByText("DELETE")).not.toBeInTheDocument();
  });
});
