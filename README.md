# Farid Seekh Kabab

A responsive restaurant website for **Farid Seekh Kabab Center**, Jogeshwari West, Mumbai. Built with HTML, CSS, and JavaScript, with animated fire effects, a food showcase, directions and contact links, and installable app support.

## Run locally

No build step or package installation is required. From this folder, run:

```powershell
python -m http.server 8000
```

Open <http://localhost:8000>. Service workers require localhost or HTTPS.

## Project files

```text
index.html             Page content, search metadata, and social previews
css/                   Layout, styling, and animation effects
js/                    Navigation, opening hours, animation, and sound
js/vendor/             Locally hosted Lenis smooth-scroll library
images/                Food photography and social preview image
images/icons/          Browser and installable app icons
manifest.webmanifest   App name, icons, colors, and shortcuts
sw.js                  Offline cache and service worker
```

## Link preview

The page includes Open Graph and Twitter Card metadata in its initial HTML, with `images/og-share.jpg` as the preview image.

Preview text:

> Farid Seekh Kabab Center · Jogeshwari West, Mumbai · Since 1992
>
> Seekh kabab & paratha in Jogeshwari West, Mumbai. Open daily 5 PM – 1 AM. Call 079777 63243.

Live website: <https://farid-seekh-kabab.onrender.com/>. The share image, page URL, canonical URL, and structured-data image use this Render address. If the domain changes, update these URLs in `index.html`.

Deploy the whole folder to a public HTTPS host. The page and share image must be accessible without login. Preview appearance depends on the receiving app, and previously shared links may retain a cached preview. These tags provide a preview card; they do not automatically insert a separate chat message.

## GitHub and Render deployment

Use the GitHub repository `https://github.com/hamzaghojaria/Farid-Seekh-Kabab.git`. For an empty repository, run these commands in PowerShell:

```powershell
cd C:\Users\Hamza\Downloads\Farid-Seekh-Kabab
git init
git add .
git commit -m "Add Farid Seekh Kabab website and sharing metadata"
git branch -M main
git remote add origin https://github.com/hamzaghojaria/Farid-Seekh-Kabab.git
git push -u origin main
```

Initializing Git inside this folder keeps the project separate from any parent repository.

The live website is hosted on Render at <https://farid-seekh-kabab.onrender.com/>. Push changes to the connected GitHub branch and deploy the latest commit in Render (or let automatic deployment run if enabled).

For later updates:

```powershell
git add .
git commit -m "Update restaurant website"
git push
```

## Maintenance

- Update restaurant content and metadata in `index.html`.
- Keep the hours and contact information consistent with the JavaScript and structured data.
- Increment `VERSION` in `sw.js` after changing deployed files so the offline cache refreshes.
- Keep the social image dimensions in the metadata consistent with `images/og-share.jpg`.
