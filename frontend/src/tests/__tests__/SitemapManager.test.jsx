import { render, screen } from "@testing-library/react";
import SitemapManager from "@/components/admin/settings/seo/SitemapManager";

jest.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock("@/services/admin/seoConfigService", () => ({
  updateSEOConfig: jest.fn(),
}));

describe("SitemapManager", () => {
  it("renders provided sitemap entries immediately", () => {
    const config = {
      sitemap: [
        { path: "/courses", include: true, priority: 0.8, freq: "weekly" },
        { path: "/blog", include: false, priority: 0.6, freq: "monthly" },
      ],
      sitemapUpdated: null,
    };

    render(
      <SitemapManager
        config={config}
        update={jest.fn()}
        availablePages={["/courses", "/blog", "/"]}
      />
    );

    expect(screen.getByDisplayValue("/courses")).toBeInTheDocument();
    expect(screen.getByDisplayValue("/blog")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("/")).not.toBeInTheDocument();
  });
});
