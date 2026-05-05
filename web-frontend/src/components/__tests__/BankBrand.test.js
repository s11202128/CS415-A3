import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BankBrand from "../BankBrand.js";

/**
 * Smoke tests for the BankBrand component. Keeps the suite hermetic — no API,
 * no router, no context. Exercises the conditional rendering branches.
 */
describe("BankBrand", () => {
    it("renders the default bank title", () => {
        render(<BankBrand />);
        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
            "Bank of Fiji"
        );
    });

    it("renders the subtitle when provided", () => {
        render(<BankBrand subtitle="Online Banking" />);
        expect(screen.getByText("Online Banking")).toBeInTheDocument();
    });

    it("does NOT render a subtitle paragraph when none is given", () => {
        const { container } = render(<BankBrand />);
        expect(container.querySelector(".brand-block__text p")).toBeNull();
    });

    it("renders the eyebrow label when provided", () => {
        render(<BankBrand eyebrow="WELCOME" />);
        expect(screen.getByText("WELCOME")).toBeInTheDocument();
    });

    it("applies the compact modifier class when compact=true", () => {
        const { container } = render(<BankBrand compact />);
        const root = container.querySelector(".brand-block");
        expect(root?.className).toContain("brand-block--compact");
    });

    it("merges an extra className", () => {
        const { container } = render(<BankBrand className="extra" />);
        const root = container.querySelector(".brand-block");
        expect(root?.className).toContain("extra");
    });
});
