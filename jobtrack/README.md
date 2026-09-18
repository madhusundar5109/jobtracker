# JobTrack — synced across phone and laptop

A Job Application & Career Outreach Tracker. Data lives in Supabase (Postgres),
so anything you change on your phone shows up on your laptop within a second
or two, and vice versa. The app itself is a PWA — install it to your home
screen / desktop, and it still opens and works offline (writes just need a
connection to save).

## 1. Create your Supabase project

1. Go to https://supabase.com, sign in, and click **New project**.
2. Pick a name, a database password (save it somewhere), and a region close to you.
3. Once it's ready, open **SQL Editor** → **New query**, paste the contents of
   `supabase/schema.sql` from this project, and run it. This creates all 8
   tables (jobs, applications, outreach, contacts, interviews, resumes,
   companies, templates), locks each row to its owner, and turns on Realtime
   sync.
4. Go to **Settings → API**. You'll need the **Project URL** and the
   **anon public** key in the next step.
5. (Optional but recommended) Go to **Authentication → Providers → Email**
   and turn **off** "Confirm email" if you want to sign in immediately after
   signing up, since this is just for personal use.

## 2. Configure the app

```bash
cp .env.example .env
```

Edit `.env` and paste in your Project URL and anon key:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## 3. Run it locally

```bash
npm install
npm run dev
```

Open the printed `localhost` URL, sign up with an email + password (this is
your own account — Supabase's row-level security means only you can ever see
your rows), and start using it.

## 4. Deploy it so your phone can reach it

Any static host works since this is a pure client-side app. The fastest path:

**Vercel**
```bash
npm i -g vercel
vercel
```
When prompted, add the two `VITE_SUPABASE_*` env vars in the Vercel project
settings (Settings → Environment Variables), then redeploy.

**Netlify** works the same way — `netlify deploy`, set the env vars, done.

**Your own AWS (S3 + CloudFront)** — since this is just a static build:
```bash
npm run build
aws s3 sync dist/ s3://your-bucket --delete
```
then serve the bucket through a CloudFront distribution (set the default root
object to `index.html` and add a custom error response routing 404s back to
`index.html`, since this is a single-page app).

## 5. Install it on your phone and laptop

Once it's deployed to a URL:

- **Android**: open the URL in Chrome → menu → **Add to Home screen**.
- **iPhone**: open the URL in Safari → Share → **Add to Home Screen**.
- **Laptop (Chrome/Edge)**: click the install icon in the address bar, or
  menu → **Install JobTrack**.

Sign in with the same account on both, and they'll stay in sync automatically.

## Notes

- **Storage limits**: Supabase's free tier includes 500MB of database space,
  which is enormous for this kind of data (thousands of applications' worth
  of text). You won't need to think about it for personal use.
- **Offline**: the app shell (UI, code, icons) is cached by a service worker,
  so it opens instantly even with no signal. Reads show your last-synced
  data; new writes queue up in the browser tab and send once you're back
  online (Supabase's client retries automatically on reconnect within the
  same tab session).
- **Icons**: `public/icon-192.png` and `public/icon-512.png` are simple
  placeholders — swap them for your own artwork any time; the manifest
  already points at those filenames.
- **Multiple people**: if you ever want to share this with someone else,
  each person just signs up for their own account — RLS keeps every user's
  data completely separate automatically.
