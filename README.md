# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Production PWA connection

The app uses [the Wikalino backend](https://wikalino-backend.onrender.com) for student uploads and class rankings. The [backend repository](https://github.com/Makemaks/wikalino-backend) is deployed separately.

Production exports load the committed `.env.production`, which contains only public client settings. Local `.env.local` files and shell environment variables can override those values; remove old localhost overrides before exporting for deployment. Supabase secret keys and dashboard passwords belong only on the backend.

Build the deployable PWA, including its offline assets, with:

```bash
npm ci
npm run build:pwa
```

Deploy the resulting `dist` directory to the existing PWA host. Students keep their work on the device; when the app is open and a connection is available, it uploads the latest save under their class code. Browser background execution while the app is closed is not guaranteed. Render Free can take about a minute to wake after inactivity; pending uploads retry automatically.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
