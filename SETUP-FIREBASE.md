# ☁️ Enabling Cloud Sync (one-time, ~10 minutes)

Cloud sync lets your daughter play on any device — laptop, iPad, school
computer — and keep one set of coins, stars, unlocked songs, and uploaded
songs. It uses Google Firebase's free tier (this app's usage is a tiny
fraction of the free limits; no credit card needed).

## 1. Create the Firebase project

1. Go to <https://console.firebase.google.com> and sign in with any Google
   account.
2. Click **Create a project** (or "Add project"), name it `piano-quest`,
   and **turn OFF Google Analytics** when asked (not needed). Create it.

## 2. Create the database

1. In the left sidebar: **Build → Firestore Database → Create database**.
2. Choose **Start in production mode**, pick the default location, **Enable**.
3. Open the **Rules** tab and replace the contents with:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /families/{family}/players/{player} {
         allow read, write: if true;
       }
     }
   }
   ```

   Click **Publish**.

   > These rules mean anyone who knows your family code can read/write that
   > family's saves — the code acts as the password. Pick something not
   > guessable (e.g. `mcmillan-piano-2026`, not `piano`). Nothing sensitive
   > is stored: just coins, stars, song lists, and settings.

## 3. Get the config

1. Click the **gear icon → Project settings** (top of the sidebar).
2. Under "Your apps", click the **`</>`** (Web) icon. Nickname: `piano-quest`.
   Don't tick Firebase Hosting. Click **Register app**.
3. You'll see a `firebaseConfig = { ... }` code block. Copy just the
   object — the part from `{` to `}`.

## 4. Paste it into the app

Open `js/firebase-config.js` in this folder and replace:

```js
window.FIREBASE_CONFIG = null;
```

with:

```js
window.FIREBASE_CONFIG = {
  apiKey: "AIza...",            // ← your values
  authDomain: "piano-quest-xxxxx.firebaseapp.com",
  projectId: "piano-quest-xxxxx",
  storageBucket: "piano-quest-xxxxx.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
```

(Or just tell Claude the config values and it will do this and redeploy.)

## 5. Connect each device

Deploy the updated file (see README), then on every device she plays on:
**⚙️ Settings → Cloud Sync** → enter the same family code + her name →
**Connect**. A ☁️ appears in the top bar when progress is safely synced.

That's it. Whichever device played most recently wins if two were used
offline at the same time.
