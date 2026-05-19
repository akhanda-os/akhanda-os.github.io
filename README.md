# akhanda-os.github.io

Public website for [akhanda-os](https://github.com/akhanda-os/akhanda-os).

Live at **https://akhanda-os.github.io/**.

## Layout

```
index.html       landing page (hero, domains, comparison, install)
tools.html       full tool inventory, filter + search
download.html    ISO / VM / apt-repo install instructions
404.html         dropped-packet page
assets/
  css/style.css  one stylesheet, no framework
  js/main.js     matrix-rain background + tools filter
  img/           logo + screenshots
data/tools.json  single source of truth for the tools page
.nojekyll        serve files as-is, skip Jekyll
```

## Editing the tools list

The tools page renders entirely from `data/tools.json`. To add or correct an entry,
edit that file:

```json
{
  "name": "tool-name",
  "domain": "iot",
  "desc": "One-line description ending with a period.",
  "url": "https://upstream/repo"
}
```

`domain` must match one of the IDs in the `domains` array
(`core`, `iot`, `automotive`, `ics`, `medical`, `embedded`, `rf`, `firmware`, `forensics`).

No build step. Open `index.html` in a browser to develop locally, or:

```bash
python3 -m http.server 8000
```

## Why a separate repo

The main `akhanda-os/akhanda-os` repo uses its `gh-pages` branch to host the signed
apt archive at `https://akhanda-os.github.io/akhanda-os/`. Mixing a website into the
same branch would collide every release. This repo is the org-root site at
`https://akhanda-os.github.io/`, served from `main`.

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).
