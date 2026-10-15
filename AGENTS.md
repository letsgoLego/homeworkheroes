
- Marketing/bulk email (e.g. the Premium offer) goes through the Resend connector from a separate subdomain, never through the app-email helper — protects app-email deliverability.
- AI homework entry goes through the `homework-assistant` edge function (server-held key, strict JSON card); the browser only does free speech-to-text and image downscaling — keeps AI keys and prompts server-side and costs low.
