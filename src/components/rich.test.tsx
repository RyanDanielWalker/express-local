import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Rich } from "./Rich";

describe("rich text", () => {
  it("drops the chip when the copy is only code", () => {
    expect(renderToStaticMarkup(<Rich text="`string | number`" />)).toBe(
      '<span><code class="solo">string | number</code></span>',
    );
  });

  it("keeps the chip when code sits among words", () => {
    const html = renderToStaticMarkup(
      <Rich text="Return early if `user` is `null`" />,
    );
    expect(html).toContain("<code>user</code>");
    expect(html).toContain("<code>null</code>");
    expect(html).not.toContain("solo");
  });
});
