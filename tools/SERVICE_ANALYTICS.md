# Service website analytics

The ten service families `qr-scanner`, `seukscan`, `ongle`, `cleaner`,
`attachment`, `mongle`, `nonogram`, `sudoku`, `sagak`, and `meowbro` use the
existing H1Soft GA4 tag. Both `/ko/service/…` and `/service/en/…` routes belong
to the same service, including `/attachment/play/`. Skinping is excluded.
Metrics is excluded from tracking.

Visitors must opt in. The existing choice applies across this hostname; the
settings button allows withdrawal. `js/analytics.js` guards duplicate loads,
removes URL queries/fragments from page/referrer fields, and disables advertising
personalization. The detailed visitor notice lives at `/analytics-privacy/`.

After adding or rebuilding service HTML, run from the repository root:

```sh
node tools/service-analytics.mjs --write
node tools/service-analytics.mjs
node --test tests/service-analytics.test.mjs
```

The coverage workflow checks every tracked HTML document under these service
paths. The Cleaner templates and Nonogram layout also include the loader so
regeneration preserves it. App exports from other repositories must run the
coverage command before publishing. Redirect stubs are not separate visits.

H1 Metrics reads the existing GA4 property using server-side hostname and path
filters. Each service has its own row, app icon and original-site link. Users
are aggregated by GA4 across all of the service's pages, not summed per page.
The displayed active-user metric is a daily average, not period unique users.
The official website row is the overall total and is not added to service rows
again in summary cards/charts. New tracking cannot reconstruct earlier visits.
