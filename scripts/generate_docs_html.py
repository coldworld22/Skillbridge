#!/usr/bin/env python3
"""Generate static HTML files from Markdown documentation."""
from __future__ import annotations

import argparse
import html
import re
from pathlib import Path
from typing import Iterable, List, Tuple

import markdown

ROOT = Path(__file__).resolve().parents[1]
DOCS_DIR = ROOT / "docs"


def find_markdown_files(paths: Iterable[Path] | None = None) -> List[Path]:
    if not paths:
        paths = [DOCS_DIR]
    md_files: List[Path] = []
    for base in paths:
        for path in sorted(base.glob("*.md")):
            md_files.append(path)
    return md_files


def extract_title(markdown_path: Path) -> str:
    for line in markdown_path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if stripped.startswith("#"):
            return stripped.lstrip("# ").strip()
    return markdown_path.stem.replace("-", " ").title()


def build_navigation(md_files: Iterable[Path]) -> List[Tuple[str, str]]:
    entries: List[Tuple[str, str]] = []
    for path in md_files:
        title = extract_title(path)
        if path.name == "index.md" and title.lower() == "installation guide":
            title = "Getting Started"
        entries.append((title, path.with_suffix(".html").name))
    return entries


def convert_markdown(md_path: Path) -> str:
    text = md_path.read_text(encoding="utf-8")
    html_body = markdown.markdown(
        text,
        extensions=[
            "extra",
            "toc",
            "tables",
            "sane_lists",
            "codehilite",
        ],
        output_format="html5",
    )
    return html_body


HREF_MD_DOUBLE = re.compile(r'(href="[^"#]+?)\.md([#"])')
HREF_MD_SINGLE = re.compile(r"(href='[^'#]+?)\.md([#'])")


def replace_md_links(html_content: str) -> str:
    """Ensure references to Markdown files point at generated HTML."""

    def _sub(match: re.Match[str]) -> str:
        return f"{match.group(1)}.html{match.group(2)}"

    content = HREF_MD_DOUBLE.sub(_sub, html_content)
    content = HREF_MD_SINGLE.sub(_sub, content)
    return content


def build_page(title: str, body: str, navigation: Iterable[Tuple[str, str]], *, active: str) -> str:
    nav_items = []
    for nav_title, href in navigation:
        is_active = " class=\"active\"" if href == active else ""
        nav_items.append(f"<li><a href=\"{html.escape(href)}\"{is_active}>{html.escape(nav_title)}</a></li>")
    nav_html = "\n".join(nav_items)
    template = f"""<!DOCTYPE html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>{html.escape(title)} | Skillbridge Documentation</title>
  <style>
    body {{
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0;
      padding: 0;
      background: #f5f7fa;
      color: #1a1d23;
    }}
    header {{
      background: #1f2933;
      color: #fff;
      padding: 1.5rem 2rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }}
    header h1 {{
      margin: 0;
      font-size: 1.75rem;
    }}
    main {{
      display: flex;
      min-height: calc(100vh - 64px);
    }}
    nav {{
      width: 260px;
      background: #f0f4f8;
      border-right: 1px solid #d9e2ec;
      padding: 1.5rem 1rem;
      box-sizing: border-box;
      overflow-y: auto;
    }}
    nav h2 {{
      font-size: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #52606d;
      margin-top: 0;
    }}
    nav ul {{
      list-style: none;
      margin: 0;
      padding: 0;
    }}
    nav li {{
      margin: 0.35rem 0;
    }}
    nav a {{
      display: block;
      padding: 0.35rem 0.5rem;
      border-radius: 6px;
      color: #1f2933;
      text-decoration: none;
      transition: background 0.2s ease, color 0.2s ease;
    }}
    nav a:hover {{
      background: #d9e2ec;
    }}
    nav a.active {{
      background: #3e4c59;
      color: #fff;
      font-weight: 600;
    }}
    article {{
      flex: 1;
      padding: 2rem 3rem;
      box-sizing: border-box;
      max-width: 960px;
    }}
    article h1, article h2, article h3, article h4 {{
      color: #102a43;
    }}
    article pre {{
      background: #243b53;
      color: #f0f4f8;
      padding: 1rem;
      overflow-x: auto;
      border-radius: 6px;
    }}
    article code {{
      background: rgba(15, 23, 42, 0.08);
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
      font-size: 0.95em;
    }}
    article table {{
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
    }}
    article table, article th, article td {{
      border: 1px solid #cbd2d9;
    }}
    article th, article td {{
      padding: 0.75rem;
      text-align: left;
    }}
    article blockquote {{
      border-left: 4px solid #9fb3c8;
      margin: 1.5rem 0;
      padding: 0.5rem 1rem;
      background: #e4ebf5;
      color: #334e68;
    }}
    @media (max-width: 960px) {{
      main {{
        flex-direction: column;
      }}
      nav {{
        width: 100%;
        border-right: none;
        border-bottom: 1px solid #d9e2ec;
      }}
    }}
  </style>
</head>
<body>
  <header>
    <h1>Skillbridge Documentation</h1>
  </header>
  <main>
    <nav>
      <h2>Guides</h2>
      <ul>
        {nav_html}
      </ul>
    </nav>
    <article>
      {body}
    </article>
  </main>
</body>
</html>
"""
    return template


def generate_html(md_files: Iterable[Path], *, dry_run: bool = False) -> None:
    md_files = list(md_files)
    navigation = build_navigation(md_files)
    for md_path in md_files:
        body_html = convert_markdown(md_path)
        body_html = replace_md_links(body_html)
        title = extract_title(md_path)
        html_page = build_page(title, body_html, navigation, active=md_path.with_suffix(".html").name)
        output_path = md_path.with_suffix(".html")
        if dry_run:
            print(f"Would write {output_path.relative_to(ROOT)}")
        else:
            output_path.write_text(html_page, encoding="utf-8")
            print(f"Wrote {output_path.relative_to(ROOT)}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="*", type=Path, help="Specific Markdown files or directories to convert")
    parser.add_argument("--dry-run", action="store_true", help="Only print the files that would be generated")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    md_files = []
    if args.paths:
        for path in args.paths:
            if path.is_dir():
                md_files.extend(find_markdown_files([path]))
            elif path.suffix.lower() == ".md":
                md_files.append(path)
            else:
                raise SystemExit(f"Unsupported path: {path}")
    else:
        md_files = find_markdown_files()

    if not md_files:
        raise SystemExit("No markdown files found to convert")

    generate_html(md_files, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
