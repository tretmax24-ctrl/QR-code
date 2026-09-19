# QR Studio

A browser-only QR code generator for text, links, photo URLs, contact cards, Wi-Fi access, and styled messages.

## GitHub Pages deployment

1. Create a new GitHub repository.
2. Put `index.html`, `style.css`, `script.js`, and `.github/workflows/deploy-pages.yml` in the repository root.
3. Push the files to the `main` branch.
4. Open **Settings > Pages** and set the source to **GitHub Actions**.
5. Wait for the workflow to finish. GitHub will show the live Pages URL in the workflow summary.

The workflow deploys the site automatically on every push to `main`.

When opened over HTTPS on GitHub Pages, QR Studio is also installable as a standalone app and caches its local shell for offline use.

## Android APK

The repository includes an Android build workflow. After GitHub Pages finishes deploying, open **Actions > Build QR Studio Android APK > Run workflow**. When it completes, download the `qr-studio-android` artifact. The APK is a Trusted Web Activity that opens the live GitHub Pages app.

## QR behavior

The app opens in **Styled message** mode so a placeholder URL is never generated accidentally. Choose **Text / link** when you want a direct URL or plain text QR.

- Text and links are encoded directly into the QR code.
- Photo QR codes use a public photo URL. A local file upload creates a temporary browser-only `blob:` URL and will not work on another device.
- Contact and Wi-Fi modes create standard scannable payloads.
- Styled messages include a rich editor for per-selection bold, italic, underline, headings, alignment, and text color. They encode a link back to the hosted Pages site, which renders the formatting when scanned.

Because the styled viewer is stored in the URL hash, no server or database is required. Keep styled messages reasonably short so the QR remains easy to scan.
