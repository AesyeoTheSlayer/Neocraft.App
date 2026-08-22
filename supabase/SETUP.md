# ZephyrCraft account setup

The website side is already built. These are the only external setup steps.

## 1. Create the free project

Create a project at <https://supabase.com/dashboard>. Save the database password somewhere private; it never goes into the website.

## 2. Create the account, forum, and issue tables

Open **SQL Editor**, choose **New query**, paste everything from `setup.sql`, and press **Run** once.

That single script creates community accounts, forum categories, discussions, replies, issue tracking, moderation roles, and security rules. The public client does not depend on Supabase.

## 3. Configure account links

Open **Authentication → URL Configuration**.

- Site URL: `https://neocraft.app`
- Add redirect URL: `https://neocraft.app/auth-callback.html`
- Add password-recovery redirect URL: `https://neocraft.app/auth-callback.html?mode=recovery`
- While testing locally, also add: `http://127.0.0.1:8765/auth-callback.html`
- For local password recovery, also add: `http://127.0.0.1:8765/auth-callback.html?mode=recovery`

Leave email confirmation enabled.

If you customize Supabase's confirmation or recovery email templates, keep the standard `{{ .ConfirmationURL }}` link or build the link with `{{ .RedirectTo }}`. Otherwise Supabase may send people to the Site URL instead of the ZephyrCraft callback page.

## 4. Connect account email delivery

Supabase's built-in test mailer only sends to members of your Supabase organization, so public accounts need custom email delivery. The easiest free option is Resend:

1. Create an account at <https://resend.com>.
2. Add a sending subdomain such as `auth.neocraft.app`.
3. Copy the DNS records Resend gives you into GoDaddy and wait for verification.
4. In Resend, open **Integrations**, choose **Supabase**, and connect the new project.
5. Use a sender such as `ZephyrCraft Accounts <accounts@auth.neocraft.app>`.

Resend's Supabase integration configures the SMTP connection for you. Do not send Codex the SMTP password or Resend API key.

## 5. Send Codex the two public values

Open **Project Settings → API** and copy:

1. Project URL, which looks like `https://abcdefgh.supabase.co`
2. Publishable key, which starts with `sb_publishable_`

The publishable key is designed to be present in a website. Never copy or send the `service_role` or secret key.

Codex will put those two values into `assets/js/neocraft-config.js` and test the live account flow.

## Forum moderation

Every account starts with the `member` role. To give a trusted account moderation access, open **Table Editor → profiles** and change `role` to `moderator`. Use `admin` only for project owners.

Moderators can edit or remove forum content and review issue reports. The public website does not expose account email addresses in forum posts.

## Final smoke test before launch

1. Create a brand-new account with an email address you can access.
2. Confirm the email, sign in, request a password reset, and set a new password.
3. Start a forum discussion, reply to it, and confirm both appear while signed out.
4. Submit an issue, confirm it appears in the account dashboard, and verify another normal account cannot read it.
5. Give a separate test account the `moderator` role and confirm it can review issues without exposing account emails in forum pages.
