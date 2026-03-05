# escope
escope is a minimalist Cloudflare Worker, KV-powered, that mints short-lived redirect links ("scopes"). Every scope is owned by the IP address that created it, auto-expires after a configurable time, and can be revoked early. Think of it as Bit.ly, but private. 

**The source code here exists just for transparency and auditing purposes; running your own instance is not recommended or supported.** Nevertheless, self-hosting wouldn't be that hard. Whatever.

## Why?
To be honest, I had a lot of difficulty finding pin-perfect download URLs for software in VMs. Creating escope enabled me to simply put in the raw resource URL (like https://downloads.vivaldi.com/stable/Vivaldi.7.8.3925.76.x64.exe) and make a scope, expiring in 5 minutes, and quickly load it up in the VM. That's really it...

## Layout
| what | why |
| --- | --- |
| `index.ts` | Entry point |
| `api.ts` | Implements the `/back/*` API for... everything |
| `handlers/redirect.ts` | Resolves incoming slugs |
| `storage.ts` | Cloudflare KV helpers (slug gen, ownership, cleanup) |
| `rate_limit.ts` | A tight system with cooldowns, per-day limits, temporary/permanent blocking logic |
| `public/*` | Self-explanatory |

## What escope does/has
- Ephemeral links: from 1 to 4320 minutes (3 days)
- Multiple slug modes: alphanumeric, letters-only, numbers-only, random words, or icons
- Abuse protection: 5s cooldowns, daily quotas, escalating temp/permanent blocks

## ...and what it does not do
- Show ads
- Handle accounts
- Sell data (who tf is buying data from something like this)

## Using escope
- Visit `escp.lol` and paste a destination URL into the form
- Pick an expiration window (1 minute to 3 days) and, optionally, a slug style
- Click **create** to mint a scope, and you immediately get a short link you can copy or share
- The home screen shows every non-expired scope you've made from that device/IP with countdown timers; you can destroy any of them individually or all at once, if you have more than 3
- Once a scope expires (or you delete it), it is gone forever

## License
[MIT](LICENSE)

