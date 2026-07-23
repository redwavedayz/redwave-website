# RedWave DayZ Website

This is a free static website that can be hosted on GitHub Pages, Cloudflare Pages, or Netlify.

## Files

- `index.html` — Website content
- `styles.css` — Design and mobile styling
- `script.js` — Mobile menu and copy-IP button

## Before Publishing

Open `index.html` in Notepad or another editor and replace:

1. `134.255.251.181:2302` with your actual DayZ connection IP and game port.
2. `2303` with your Steam query port if different.
3. `https://discord.gg/YOUR-INVITE` with your real Discord invite.
4. The sample server rules with your actual rules.
5. Any feature descriptions that need updating.

## Test It

Double-click `index.html`. It should open in your web browser.

## Free GitHub Pages Hosting

1. Create a free GitHub account.
2. Create a new public repository named `redwave-dayz`.
3. Upload `index.html`, `styles.css`, and `script.js`.
4. Open the repository's **Settings**.
5. Select **Pages**.
6. Under **Build and deployment**, choose **Deploy from a branch**.
7. Select the `main` branch and `/root` folder.
8. Save.

Your site will appear at an address similar to:

`https://YOUR-GITHUB-NAME.github.io/redwave-dayz/`

## Custom Domain

A custom domain is optional. Hosting remains free. You can later connect a domain such as `redwavedayz.com` through GitHub Pages or Cloudflare.

## Live Server Status

This starter site shows a manual online status. A truly live player count usually needs one of these:

- BattleMetrics server widget/API
- Game server query proxy
- Custom backend hosted separately

Static websites cannot safely query every DayZ server directly from a browser because of browser networking restrictions.


## Important for Version 3

Extract the ZIP into a new folder before opening it. Do not open `index.html` from inside the ZIP.

If an older version was already open:
- Close the old tab.
- Open the new `index.html`.
- Press `Ctrl + F5` to force-refresh the page.

This version uses cache-busting links (`styles.css?v=3` and `script.js?v=3`).
