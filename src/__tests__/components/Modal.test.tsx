import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Modal from "@/components/portal/Modal";

describe("Modal", () => {
  it("renders nothing when open is false", () => {
    const { container } = render(
      <Modal open={false} onClose={vi.fn()} title="Test">
        <p>Content</p>
      </Modal>
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders content when open is true", () => {
    render(
      <Modal open={true} onClose={vi.fn()} title="Test Modal">
        <p>Hello World</p>
      </Modal>
    );
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("renders close button (×)", () => {
    render(
      <Modal open={true} onClose={vi.fn()} title="Test">
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByText("×")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>
    );
    fireEvent.click(screen.getByText("×"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when overlay is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal open={true} onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>
    );
    // The overlay is the first child div
    const overlay = container.firstChild as HTMLElement;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when modal content is clicked", () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>
    );
    fireEvent.click(screen.getByText("Content"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose on Escape key", () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("locks body scroll when open", () => {
    render(
      <Modal open={true} onClose={vi.fn()} title="Test">
        <p>Content</p>
      </Modal>
    );
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("restores body scroll on unmount", () => {
    const { unmount } = render(
      <Modal open={true} onClose={vi.fn()} title="Test">
        <p>Content</p>
      </Modal>
    );
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("applies custom width", () => {
    const { container } = render(
      <Modal open={true} onClose={vi.fn()} title="Test" width={800}>
        <p>Content</p>
      </Modal>
    );
    const overlay = container.firstChild as HTMLElement;
    const inner = overlay.firstChild as HTMLElement;
    expect(inner.style.maxWidth).toBe("800px");
  });
});
