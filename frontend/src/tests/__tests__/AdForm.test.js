import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdForm from "@/components/ads/AdForm";

jest.mock("next-i18next", () => ({
  useTranslation: () => ({ t: (key) => key, i18n: { dir: () => "ltr" } }),
}));

describe("AdForm", () => {
  it("submits form data when valid", async () => {
    const handleSubmit = jest.fn().mockResolvedValue();
    render(
      <AdForm
        onSubmit={handleSubmit}
        allowBrandingEnabled
        submitLabel="submit"
        tPrefix="adsCreatePage"
      />
    );

    fireEvent.change(screen.getByPlaceholderText("title_placeholder"), {
      target: { value: "Test" },
    });
    fireEvent.change(screen.getByPlaceholderText("description_placeholder"), {
      target: { value: "Desc" },
    });
    fireEvent.change(screen.getByLabelText("start_at *"), {
      target: { value: "2024-01-01" },
    });
    fireEvent.click(
      screen.getByRole("checkbox", { name: "dashboard.adsPage.student" }),
    );
    const file = new File(["hello"], "hello.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("click_to_upload"), {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByRole("button", { name: "submit" }));
    await waitFor(() => expect(handleSubmit).toHaveBeenCalled());
  });
});
