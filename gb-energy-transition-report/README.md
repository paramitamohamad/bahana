# Who Will Demand a Fast and Just Energy Transition?

The web edition of the Green Barometer Wave 1 report by LabNarasi by Bahana. It is a static site with no build step and no external services, so it runs on GitHub Pages as it is.

Source: Google Doc "GB Basic - Report v0.3", tab **V0.7**.

## What is in this folder

| Path | What it does |
| --- | --- |
| `index.html` | The whole report: text, tables, notes and appendix. |
| `assets/css/style.css` | Bahana Design System styles (cyan + monochrome, Source Sans Pro), light and dark themes. |
| `assets/js/report.js` | Contents menu and highlighting of the current section, reading progress bar, contents drawer on phones, copy-link buttons on headings, "Copy citation", footnote pop-ups, appendix expand/collapse, back-to-top button, theme switch. |
| `assets/js/figures.js` | Shows each figure and opens it in a zoom viewer (scroll or pinch to zoom, drag to move, Esc to close). |
| `assets/js/figures-data.js` | List of figure image files and their sizes. |
| `assets/img/` | Figure images, `fig01.png` to `fig25.png`. |
| `assets/fonts/` | Source Sans Pro (SIL Open Font License), self-hosted as WOFF2. |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are. |

## Publish on GitHub Pages

1. Create a new repository on GitHub, for example `gb-energy-transition-report`. Choose **Private** while the report is a draft. Note that GitHub Pages for private repositories needs a paid GitHub plan (Pro, Team or Enterprise), and even then the published site is public unless your organization uses Enterprise Cloud with private Pages.
2. Upload the contents of this folder to the repository root: **Add file → Upload files**, drag everything in (keep the `assets` folder structure), then **Commit changes**.
3. Go to **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`. Click **Save**.
4. After a minute or two, the site appears at `https://<organization>.github.io/<repository>/`.
5. To use a LabNarasi address (for example `report.labnarasi.id`), add it under **Settings → Pages → Custom domain**, then add a CNAME record at your DNS provider pointing to `<organization>.github.io`.

## Before the public release

- **Remove the draft banner and the no-index tag.** In `index.html`, delete the `<div class="draft-note">…</div>` line and the `<meta name="robots" content="noindex, nofollow">` line.
- **Fill in the citation link.** Replace `[insert LabNarasi link]` in the "Cite this report" box with the final URL.
- **Check the report text against the final Google Doc version.** This page was converted from V0.7. Later edits in the doc do not flow through automatically.

## Updating the text

Edit `index.html` directly. Each section is a `<section class="chapter">`. Each appendix part is a `<details class="appx">` block. Section links in the contents menu use the `id` of each heading, so keep the `id` values when you edit headings.
