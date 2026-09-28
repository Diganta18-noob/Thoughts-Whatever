# Letter signup and delivery

The signup API stores an unconfirmed subscriber and sends an email with a 48-hour confirmation link through the existing SMTP settings. The reader must press the button on `/letter/confirm`; email scanners cannot confirm by fetching the link. If SMTP is unavailable, signup shows a retryable error rather than a false success. Re-entering an unconfirmed address sends a new link, subject to rate limits.

Only confirmed, active subscribers appear in the admin CSV export. The admin page displays pending addresses separately. Existing records created before this confirmation flow remain pending until readers resubmit their address and confirm.

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `AUTH_SECRET` in production. The site does not automatically compose or send the monthly editorial letter; the publisher sends it using the confirmed subscriber export. This change fixes signup acknowledgement and consent, not monthly campaign automation.
