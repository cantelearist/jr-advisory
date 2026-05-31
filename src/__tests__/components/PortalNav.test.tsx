import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PortalNav from "@/components/portal/PortalNav";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Mock useAuth
const mockSignOut = vi.fn();
vi.mock("@/components/portal/AuthProvider", () => ({
  useAuth: () => ({
    user: { email: "admin@jamesroman.la", user_metadata: { role: "admin" } },
    profile: { full_name: "James Roman", role: "admin" },
    isAdmin: true,
    signOut: mockSignOut,
  }),
}));

describe("PortalNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the logo image", () => {
    render(<PortalNav />);
    expect(screen.getByAltText("James Roman Advisory")).toBeInTheDocument();
  });

  it("renders 'Client Office' label", () => {
    render(<PortalNav />);
    expect(screen.getByText("Client Office")).toBeInTheDocument();
  });

  it("renders all navigation items", () => {
    render(<PortalNav />);
    expect(screen.getByText("Office")).toBeInTheDocument();
    expect(screen.getByText("Documents")).toBeInTheDocument();
    expect(screen.getByText("Timeline")).toBeInTheDocument();
    expect(screen.getByText("Messages")).toBeInTheDocument();
    expect(screen.getByText("Invoices")).toBeInTheDocument();
  });

  it("renders user display name", () => {
    render(<PortalNav />);
    expect(screen.getByText("James Roman")).toBeInTheDocument();
  });

  it("renders user initial in avatar", () => {
    render(<PortalNav />);
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("shows dropdown on user button click", () => {
    render(<PortalNav />);
    const btn = screen.getByText("James Roman").closest("button")!;
    fireEvent.click(btn);
    expect(screen.getByText("Administrator")).toBeInTheDocument();
    expect(screen.getByText("⚙ Admin Panel")).toBeInTheDocument();
    expect(screen.getByText("Sign Out")).toBeInTheDocument();
  });

  it("shows admin panel link for admin users", () => {
    render(<PortalNav />);
    const btn = screen.getByText("James Roman").closest("button")!;
    fireEvent.click(btn);
    expect(screen.getByText("⚙ Admin Panel")).toBeInTheDocument();
  });

  it("has correct nav link hrefs", () => {
    render(<PortalNav />);
    const officeLink = screen.getByText("Office").closest("a");
    expect(officeLink?.getAttribute("href")).toBe("/portal/dashboard");

    const docsLink = screen.getByText("Documents").closest("a");
    expect(docsLink?.getAttribute("href")).toBe("/portal/documents");
  });

  it("renders main site link in dropdown", () => {
    render(<PortalNav />);
    const btn = screen.getByText("James Roman").closest("button")!;
    fireEvent.click(btn);
    expect(screen.getByText("← Main Site")).toBeInTheDocument();
  });
});
