import React from "react";
import { render } from "@testing-library/react";

import LinkText from "../LinkText";

describe("LinkText", () => {
  it("renders safely when provided an undefined message", () => {
    expect(() => render(<LinkText text={undefined} />)).not.toThrow();
  });

  it("falls back to an empty string for nullish values", () => {
    const { container } = render(<LinkText text={null} />);

    expect(container.textContent).toBe("");
  });

  it("coerces non-string values into text", () => {
    const { container } = render(<LinkText text={123} />);

    expect(container.textContent).toBe("123");
  });
});
