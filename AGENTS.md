
- Marketing/bulk email (e.g. the Premium offer) goes through the Resend connector from a separate subdomain, never through the app-email helper — protects app-email deliverability.
- AI homework entry goes through the `homework-assistant` edge function (server-held key, strict JSON card); the browser only does free speech-to-text and image downscaling — keeps AI keys and prompts server-side and costs low.
- Child password-free sign-in goes through the `child-login-link` edge function (single-use hashed token → magic-link token hash verified on /koppla) — no child passwords to share.
- The weekly parent digest is sent by `send-weekly-digest` via the Resend connector from hej.laxhjalp.app with its own opt-out (`digest_preferences`), never via the app-email helper — it is a recurring list send.
