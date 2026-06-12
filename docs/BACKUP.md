# Harvest insurance — backing up the live Replit deployment

The production PromptAtrium currently lives on Replit. Its data exists in
exactly two places, both tied to the Replit account:

1. **The PostgreSQL database** (users, prompts, collections, everything)
2. **The object-storage bucket** (every uploaded image/avatar)

Until the v2 backfill transplants this data, these backups are the only
insurance. **Cadence: weekly, or before/after any session that adds
content you care about.** Keep at least the last 3 dumps, in at least one
place that is not Replit (local disk + a cloud drive).

## 1. Database dump (run in the Replit workspace Shell)

`DATABASE_URL` is already set inside the workspace:

```bash
pg_dump "$DATABASE_URL" --no-owner --no-privileges -Fc \
  -f "promptatrium-$(date +%Y%m%d).dump"
```

Then download the file (Files pane → ⋮ → Download), or push it somewhere
off-Replit. A `.dump` of this DB should be small (tens of MB at most).

**Restore test (do this once, soon, against any scratch Postgres):**

```bash
pg_restore -d "$SCRATCH_DATABASE_URL" --no-owner promptatrium-YYYYMMDD.dump
```

A backup that has never been restored is a hope, not a backup.

## 2. Object storage export (run in the Replit workspace Shell)

The bucket is only reachable with Replit's sidecar credentials, so this
must run *inside* the workspace. Save as `backup-objects.mjs` in the
workspace root and run `node backup-objects.mjs`:

```js
import { Storage } from "@google-cloud/storage";
import fs from "node:fs";
import path from "node:path";

const SIDECAR = "http://127.0.0.1:1106";
const storage = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${SIDECAR}/token`,
    type: "external_account",
    credential_source: {
      url: `${SIDECAR}/credential`,
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

// Bucket id from .replit ([objectStorage] defaultBucketID)
const BUCKET = "replit-objstore-0787b323-84b9-43bc-9908-9e19c8088441";
const OUT = "./object-backup";

const [files] = await storage.bucket(BUCKET).getFiles();
console.log(`${files.length} objects to download`);
let done = 0;
for (const f of files) {
  const dest = path.join(OUT, f.name);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await f.download({ destination: dest });
  if (++done % 50 === 0) console.log(`${done}/${files.length}`);
}
console.log(`Done: ${done} objects in ${OUT}`);
```

Zip the `object-backup/` folder and download it. If it is too large to
download comfortably, copy it to your own GCS bucket instead (the new
bucket you create per `docs/SETUP.md`) using the same client with
`storage.bucket(BUCKET).file(name).copy(...)` — ask Claude to extend the
script when that day comes.

## 3. When the new orchard is ready

The v2 backfill (Phase 1) imports a database dump and the object files
into the new system, mapping prompts → assets and images → results. At
that point Replit becomes a tree we can let go of on our own schedule —
not one we can be forced off of.
