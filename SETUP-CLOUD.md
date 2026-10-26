# Turning on cloud saving (Firebase, free)

The app saves on the phone today. These steps get it ready to save to an account once the sign-in screen is designed. About 15 minutes, no credit card.

1. Go to https://console.firebase.google.com and sign in with a Google account.
2. Click **Create a project**, name it `writing-prompt-app`, and turn Google Analytics off.
3. In the project, click the **</>** (Web) icon to add a web app. Name it `writing-prompt-app`. Skip Firebase Hosting.
4. Firebase shows a `firebaseConfig` block. Copy the values into `FIREBASE_CONFIG` in `app/cloud.js`, like this:
   ```js
   const FIREBASE_CONFIG = { apiKey: "...", authDomain: "...", projectId: "...", appId: "..." };
   ```
   (These values are safe to put on GitHub. The security rules below are what protect the data.)
5. Left menu: **Build > Authentication > Get started**. Turn on **Google** and **Email/Password**.
6. Still in Authentication, go to **Settings > Authorized domains** and add `laurenlliu.github.io`.
7. Left menu: **Build > Firestore Database > Create database**. Pick a location near you and start in **production mode**.
8. Open the **Rules** tab, replace everything with the contents of `firestore.rules` from this repo, and click **Publish**.

That's it. Nothing changes in the app until the sign-in screen calls `Cloud.signInWithGoogle()` or `Cloud.signInWithEmail(email, password)`.
