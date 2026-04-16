# OSSFlix Mobile App

Android-first React Native client for Reelscape.

## Scope

- Connect to a Reelscape server by URL
- Discover profiles by email or unclaimed profile lookup
- Sign in with the new mobile bearer-token auth flow
- Browse Home, Movies, TV Shows, Search, and My List
- Open title details, play content, resume progress, switch audio tracks, and enable subtitles

## Setup

```bash
cd OSSFlix-Mobile-App
npm install
npx expo run:android
```

The server must include the mobile auth endpoints added in `OSSFlix`.

## Notes

- The app assumes the server exposes `/api/mobile/server-info`.
- Streaming requests send `Authorization: Bearer <token>` headers.
- `react-native-video` is used for Android playback and receives stream/subtitle URLs directly from the server.
