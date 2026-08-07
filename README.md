# NeoCraft website

A compact coming-soon site for NeoCraft: a full Minecraft rewrite in Rust and WebAssembly.

The homepage contains the project premise, current status, and the complete 43-release roadmap from Alpha 1.1.2_01 through Beta 1.8.1. The former detail-page URLs redirect to the matching section of the homepage.

## Current roadmap

- Alpha 1.1.2_01 is in development.
- Every historical client release through Beta 1.8.1 is planned, in order.
- Additional versions after Beta 1.8.1 are being considered.
- All listed releases require a Microsoft account that owns Minecraft: Java Edition.

The entire roadmap—including its versions, order, release plans, and account requirements—can change at any time.

No public build or release date is currently announced.

## Publishing updates

- Add the newest post as a standalone `update-*.html` page.
- Add its summary to the top of `updates.html`.
- Add it as the first item in `updates.xml` and refresh the feed's `lastBuildDate`.

The email form on `signup.html` becomes active when its `data-newsletter-endpoint` is set to the embed-subscribe address from the chosen newsletter service.

After deployment, set Buttondown's subscription confirmation redirect URL to `https://aesyeotheslayer.github.io/Neocraft.App/confirmed.html` so confirmed subscribers return to the branded NeoCraft confirmation page.
