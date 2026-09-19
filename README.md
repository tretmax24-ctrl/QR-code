# QR Studio

A browser-only QR code generator for text, links, photo URLs, contact cards, Wi-Fi access, and styled messages.

## GitHub Pages deployment

1. Create a new GitHub repository.
2. Put `index.html`, `style.css`, `script.js`, and `.github/workflows/deploy-pages.yml` in the repository root.
3. Push the files to the `main` branch.
4. Open **Settings > Pages** and set the source to **GitHub Actions**.
5. Wait for the workflow to finish. GitHub will show the live Pages URL in the workflow summary.

The workflow deploys the site automatically on every push to `main`.

## QR behavior

- Text and links are encoded directly into the QR code.
- Photo QR codes use a public photo URL. A local file upload creates a temporary browser-only `blob:` URL and will not work on another device.
- Contact and Wi-Fi modes create standard scannable payloads.
- Styled messages include a rich editor for per-selection bold, italic, underline, headings, alignment, and text color. They encode a link back to the hosted Pages site, which renders the formatting when scanned.

Because the styled viewer is stored in the URL hash, no server or database is required. Keep styled messages reasonably short so the QR remains easy to scan.
