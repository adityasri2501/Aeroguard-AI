# Aeroguard AI local prototype backend

## Start

From this project folder, run `start-backend.ps1`. Keep that terminal open, then open:

`http://127.0.0.1:3030`

The app served from that address reads and writes `backend/data/records.json`. Opening `outputs/index.html` directly with `file://` keeps the browser-only mode and does not connect to the backend.

## Included real public data

The local record store is preloaded with 1,306 Indian civil aircraft entries from VT Aircrafts' monthly CSV, compiled from DGCA scheduled/non-scheduled operator permit lists. Current stored snapshot: 31 Aug 2026. Registration, type and operator are public; availability/serviceability is unknown. The dataset is not a defence fleet register and must not be used as an operational status source. It is an independent CC BY 4.0 compilation, not an official DGCA register. Its latest metadata reports two aircraft-count parsing warnings, so verify operator details against the linked source PDFs.

The Fleet tab's refresh button fetches the source's latest CSV and metadata. Its status filter and the overview's interactive chart use only saved aircraft records. The overview chart can group imported records by operator, type, status, maintenance status/priority, parts location/reorder risk, or telemetry sensor. It can poll local saved records at a user-selected interval (15 seconds to 5 minutes); this refreshes the local store view, not aircraft sensors. The India public-data tab has a refresh button that fetches all published financial-year tables from IndiGo's statistics page (reported as DGCA figures), then updates its chart, rows, and overview numbers. This source updates when the publisher posts new figures, not in real time. The record import API persists subsequent CSV imports locally. The OGD connector proxies requests through the local backend so browser CORS is not required; API keys are used for that request only and are not saved.

## Local API

- `GET /api/health` — service state
- `GET /api/records` — locally stored record groups
- `POST /api/records/import` — validated, merged import
- `DELETE /api/records` — clear local record groups
- `GET /api/public/india-civil-fleet` — refresh the public monthly CSV and metadata
- `GET /api/public/india-traffic` — refresh published IndiGo / DGCA-reported monthly statistics
- `POST /api/public/ogd` — fetch a selected OGD India resource

The server binds only to `127.0.0.1`. This is a local prototype backend, not a production or classified-data system. Do not import sensitive defence records into it.
