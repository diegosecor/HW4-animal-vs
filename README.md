# Animal VS · Frontend

## Portfolio Description

Animal VS is a full-stack educational web app that compares reference body masses for more than 60 animals. The frontend provides searchable animal selection, comparison results, popular matchups, and live species cards powered by iNaturalist data.

**Code:** https://github.com/diegosecor/HW4-animal-vs

**Live site:** https://diegosecor.github.io/HW4-animal-vs/

The frontend communicates with the deployed backend on Render.

## Overview

This static HTML, CSS, and JavaScript page compares animals by rounded educational reference mass. It offers a custom type-ahead menu backed by a curated catalog of more than 60 animals, including domestic animals, wildlife, birds, reptiles, marine animals, and invertebrates.

For example, typing `dog` offers **Domestic Dog — 30 kg**; typing `tiger`, `whale`, or `turtle` returns the corresponding mass-reference entries.

## Backend Communication

`app.js` calls these endpoints:

- **`GET /api/animals/search?q=...`** as a visitor types, to retrieve matching catalog animals with their reference masses.
- **`GET /api/compare?first=...&second=...`** after two suggestions are selected, to receive the body-mass comparison and live iNaturalist species cards.
- **`GET /api/popular-comparisons?limit=5`** on page load and after successful comparisons, to show the most searched matchups.

The autocomplete supports mouse selection or arrow keys, Enter, and Escape. It prevents free text from being used as an invalid comparison.

## Testing Locally

1. Start the backend:

   ```powershell
   cd ../backend
   python app.py
   ```

2. Confirm `API_BASE` in `app.js` is `http://127.0.0.1:5000`.
3. Open `index.html` in a browser.
4. Search and select two different catalog animals, then choose **Compare Animals**.

## Publishing to GitHub Pages

1. Deploy the backend to Render and copy its HTTPS URL.
2. Replace `http://127.0.0.1:5000` in `app.js` with that URL, without a trailing slash.
3. Push this frontend folder to its public GitHub repository.
4. Enable GitHub Pages from the `main` branch and repository root.

No API keys or secrets are included in the frontend. The backend handles the comparison store and iNaturalist requests.

## Comparison Scope

Mass values are rounded reference examples for educational visualization. They vary between individuals and do not represent strength, population size, abundance, or conservation status. iNaturalist provides species information, images, and observation data; it is not the source of the reference masses.

## Visual Design

The interface uses an original dramatic nature-documentary palette: deep canopy greens, parchment neutrals, lichen highlights, and a clay accent. It does not reproduce any external show, broadcaster, logo, or brand identity.
