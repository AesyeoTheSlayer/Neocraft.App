# ZephyrCraft website

A project and testing hub for ZephyrCraft (formerly NeoCraft), an independent Rust-based Minecraft client designed for modern browsers with WebAssembly.

The homepage contains the project premise, testing status, and the complete 43-release roadmap from Alpha 1.1.2_01 through Beta 1.8.1. Dedicated pages provide alpha-testing access and guidance, accounts, community forums, issue reporting, project background, development updates, newsletter signup, contact options, and the privacy policy. Former detail-page URLs redirect to the matching section of the homepage.

## Current roadmap

- Alpha 1.1.2_01 is playable and in public testing.
- Selected historical Java Edition versions through Beta 1.8.1 are listed as non-final development targets.
- Additional versions after Beta 1.8.1 are being considered.
- Testing requires owning Minecraft: Java Edition and supplying compatible Alpha resources locally; ZephyrCraft does not distribute Minecraft game files.

The entire roadmap—including its versions, order, release plans, and account requirements—can change at any time.

The playable Alpha 1.1.2_01 build is publicly available as unfinished test software. Opening it requires acknowledging a clear test-build warning, and the client page prominently asks players to find and report bugs. No finished public-release date is currently announced.

## Publishing updates

- Add the newest post as a standalone `update-*.html` page.
- Add its summary to the top of `updates.html`.
- Add it as the first item in `updates.xml` and refresh the feed's `lastBuildDate`.

The email form on `signup.html` submits to the configured Buttondown embed-subscribe endpoint and is enabled by `assets/js/newsletter.js` after the page loads.

Buttondown's subscription confirmation redirect URL should be set to `https://neocraft.app/confirmed.html` so confirmed subscribers return to the branded ZephyrCraft confirmation page.

## Accounts, forums, and issue reports

The public client is deployed from `client-build/` with the rest of the GitHub Pages site and does not require an account or tester approval. The account system is reserved for community features.

The frontend account, forum, and issue-tracker interfaces are complete. Until Supabase is connected, the forums display clearly labeled preview discussions and the writing forms keep unfinished drafts locally without pretending to publish them.

Run `supabase/setup.sql` in a Supabase project and follow `supabase/SETUP.md` to activate community accounts, forum posting and replies, moderation roles, and private issue tracking. The issue form can also use a Formspree form URL as a signed-out fallback by setting its `data-formspree-endpoint` value in `report.html`.
