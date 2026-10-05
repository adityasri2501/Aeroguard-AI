# Aeroguard AI — Predictive Maintenance & Fleet Availability Prototype

Aeroguard AI is a local web prototype for exploring aircraft fleet records, maintenance work orders, sensor readings, spare-parts inventory, and public aviation data. It is designed around the Indian Air Power predictive-maintenance problem statement.

> **Data boundary:** Public defence aircraft serviceability, maintenance, spares, and telemetry data are not included. The prototype does not invent these values. Import authorized records to use the operational dashboards. Public aviation figures and civil aircraft registrations are context only; they do not describe defence readiness.

## Run locally

1. Open PowerShell in this project folder.
2. Run `start-backend.ps1` and leave the terminal open.
3. Open [http://127.0.0.1:3030](http://127.0.0.1:3030).

The launcher uses the bundled Node.js runtime configured on the development computer. The backend listens on `127.0.0.1:3030` and stores imported records in `backend/data/records.json`. Opening `outputs/index.html` directly runs the browser-only version and will not connect to the backend.

## Deploy to Vercel

The repository includes `vercel.json` and serverless functions under `api/`. Import this project into Vercel with the project root as the **Root Directory**; Vercel serves the static app from `outputs/` and deploys the public-data functions automatically. There is no frontend build step. The public refresh buttons call same-origin functions at `/api/public/...`.

On Vercel, imported aircraft, maintenance, telemetry, and parts records are saved in that user's browser storage. They are not shared between users or devices and are not written to a cloud database. The local development backend continues to use `backend/data/records.json`. Add a database before using the app for shared team records; do not put sensitive defence information in this public demo deployment.

## What is in the prototype

- **Overview:** Fleet, maintenance, sensor-alert, and inventory summaries based on saved records. The interactive chart can group records by operator, aircraft type, serviceability status, maintenance status or priority, parts location or reorder risk, and sensor. Search the chart categories and choose a local-record refresh interval.
- **Fleet:** Search and filter aircraft by status. Load the latest public India civil-aircraft list from the source button. The list includes registration, aircraft type, and operator; serviceability is not published.
- **Maintenance:** View imported work orders, defects, due dates, priorities, and return-to-service fields.
- **Health signals:** View imported telemetry and threshold/outlier screening alerts. These are simple screening rules, not a validated aircraft-failure prediction model.
- **Spare parts:** View uploaded stock and reorder levels; use the reorder-point calculator with values from your own records.
- **Real-flight benchmark:** Explore an openly published NGAFID sensor trace and event annotation. It is a general-aviation example, not an Indian military aircraft record.
- **India public data:** Select a published financial year and refresh IndiGo operating statistics reported as DGCA figures. These are civil-aviation aggregates and update when the publisher posts new figures, not in real time.
- **India data & imports:** Import CSV records or connect a data.gov.in resource using your own resource ID and API key. The API key is used for the request and is not saved.

## CSV import fields

Headers are case-insensitive. The import dialog in the app includes a field guide.

| Record type | Useful columns |
| --- | --- |
| Aircraft | `aircraft_id`, `aircraft_type`, `unit`, `status`, `last_seen` |
| Maintenance | `work_order_id`, `aircraft_id`, `task`, `status`, `priority`, `due_date`, `opened_at`, `return_to_service` |
| Telemetry | `aircraft_id`, `timestamp`, `sensor`, `value`, `unit`, `threshold` |
| Parts | `part_number`, `part_name`, `quantity_on_hand`, `reorder_level`, `location` |

Only import data that you are authorized to use. Do not import classified or sensitive defence records into this local demonstration backend.

## Public data and attribution

- [VT Aircrafts data and method](https://vtaircrafts.in/data) — independent CC BY 4.0 compilation from DGCA operator-permit lists. The seeded snapshot has 1,306 Indian civil-aircraft entries dated 31 August 2026. Its metadata reports two count-parsing warnings; it is not an official DGCA aircraft register.
- [IndiGo operational statistics](https://www.goindigo.in/information/investor-relations/operational-statistics/domestic.html) — monthly scheduled domestic operating statistics reported as DGCA figures.
- [NGAFID LOC-I GATS dataset](https://huggingface.co/datasets/CDuong04/NGAFID-LOCI-GATS-Data) — source for the sample flight trace and event labels included under `outputs/`.
- [Open Government Data India: Monthly Air Traffic Statistics](https://www.data.gov.in/catalog/monthly-air-traffic-statistics) — historical civil aviation traffic data; API availability depends on the individual resource.

## Backend endpoints

- `GET /api/health` — backend status
- `GET /api/records` — saved record groups
- `POST /api/records/import` — validate and merge imported records
- `DELETE /api/records` — clear saved record groups
- `GET /api/public/india-civil-fleet` — fetch public civil-aircraft CSV and source metadata
- `GET /api/public/india-traffic` — fetch published IndiGo/DGCA-reported statistics
- `POST /api/public/ogd` — proxy a data.gov.in resource request

More backend notes are in [`backend/README.md`](backend/README.md).
