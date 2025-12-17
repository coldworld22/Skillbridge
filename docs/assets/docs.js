document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector("#docs-search");
  const docItems = Array.from(document.querySelectorAll("[data-doc-item]"));
  const emptyState = document.querySelector("#docs-search-empty");

  if (searchInput && docItems.length) {
    const normalize = (value) =>
      value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const applyFilter = (term) => {
      const normalized = normalize(term.trim());
      let visibleCount = 0;

      docItems.forEach((item) => {
        const haystack = normalize(
          [item.dataset.docItem, item.dataset.docCategory].join(" ")
        );
        const matches = !normalized || haystack.includes(normalized);
        item.style.display = matches ? "" : "none";
        if (matches) visibleCount += 1;
      });

      if (emptyState) {
        emptyState.classList.toggle("is-visible", visibleCount === 0);
      }
    };

    searchInput.addEventListener("input", (event) =>
      applyFilter(event.target.value)
    );
  }

  const navToggle = document.querySelector(".docs-nav-toggle");
  const sidebar = document.querySelector(".docs-sidebar");

  if (navToggle && sidebar) {
    navToggle.addEventListener("click", () => {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", (!expanded).toString());
      sidebar.classList.toggle("is-open", !expanded);
    });
  }

  const navLinks = sidebar
    ? Array.from(sidebar.querySelectorAll("a[href]"))
    : [];
  if (navLinks.length) {
    const currentPath = window.location.pathname
      .split("/")
      .pop()
      .toLowerCase();
    navLinks.forEach((link) => {
      const href = (link.getAttribute("href") || "").toLowerCase();
      if (href === currentPath || (href.endsWith("index.html") && !currentPath)) {
        link.classList.add("active");
      }
    });
  }
});
