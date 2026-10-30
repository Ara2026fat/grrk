# Service Requests backend (Google Apps Script)

Runs inside a Google Sheet (tabs: Requests, RoutingRules, Representatives).
GitHub only stores the source — it does NOT run from here.

Deploy: Sheet > Extensions > Apps Script > paste `Code.gs` > set the two
tokens > Deploy > New deployment > Web app (Execute as: Me, Access: Anyone).
Put the Web App URL + shared token in `SR_CFG` (request-page/app.js) and
`SR_DEFAULT_CFG` (modules/service-requests.js).

Never commit real tokens: this repo is public. `ADMIN_TOKEN` must stay only
in the Apps Script project and in the admin's device settings.
