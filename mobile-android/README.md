# Android Native App Scaffold

This folder contains an Android MVVM scaffold that connects to the existing backend.

## Principles
- Reuse existing backend and MySQL database
- No local mobile database
- API-only data access through /api endpoints
- ViewModel handles UI state and error mapping

## Included Files
- API layer (Retrofit):
  - app/src/main/java/com/bof/mobile/data/remote/ApiService.kt
  - app/src/main/java/com/bof/mobile/data/remote/NetworkModule.kt
- Repository layer:
  - app/src/main/java/com/bof/mobile/data/repository/AuthRepository.kt
  - app/src/main/java/com/bof/mobile/data/repository/DashboardRepository.kt
  - app/src/main/java/com/bof/mobile/data/repository/AccountRepository.kt
  - app/src/main/java/com/bof/mobile/data/repository/TransferRepository.kt
- Model layer:
  - app/src/main/java/com/bof/mobile/model/AuthModels.kt
  - app/src/main/java/com/bof/mobile/model/DashboardModels.kt
  - app/src/main/java/com/bof/mobile/model/AccountModels.kt
  - app/src/main/java/com/bof/mobile/model/TransferModels.kt
  - app/src/main/java/com/bof/mobile/model/ApiResult.kt
- ViewModel layer:
  - app/src/main/java/com/bof/mobile/viewmodel/AuthViewModel.kt
  - app/src/main/java/com/bof/mobile/viewmodel/DashboardViewModel.kt
  - app/src/main/java/com/bof/mobile/viewmodel/AccountsViewModel.kt
  - app/src/main/java/com/bof/mobile/viewmodel/TransferViewModel.kt
- View layer:
  - app/src/main/java/com/bof/mobile/ui/AppRoot.kt
  - app/src/main/java/com/bof/mobile/ui/auth/LoginScreen.kt
  - app/src/main/java/com/bof/mobile/ui/auth/RegisterScreen.kt
  - app/src/main/java/com/bof/mobile/ui/dashboard/DashboardScreen.kt
  - app/src/main/java/com/bof/mobile/ui/accounts/AccountsScreen.kt
  - app/src/main/java/com/bof/mobile/ui/transfers/TransferScreen.kt

## Emulator URL
Use http://10.0.2.2:4000/api/ to access local backend from Android emulator.

## Android Studio Setup (Windows)
1. Open Android Studio (Hedgehog or newer recommended).
2. Click **Open** and select this folder: `mobile-android`.
3. Let Gradle Sync finish.
4. Confirm SDK location in `local.properties`:
  - `sdk.dir=C:/Users/LENOVO/AppData/Local/Android/Sdk`
5. Confirm JDK in Android Studio:
  - **File > Settings > Build, Execution, Deployment > Build Tools > Gradle**
  - Use **Gradle JDK 21**.
6. Confirm API base URL (pick one):
  - Emulator: `http://10.0.2.2:4000/api/`
  - LAN device: `http://<your-computer-ip>:4000/api/`
  - Set in `local.properties` as `MOBILE_API_BASE_URL=...`
7. Select the `app` run configuration and run on an emulator/device.

## Quick Validation Commands
From `mobile-android`:
- Unit tests: `./gradlew :app:testDebugUnitTest --console=plain`
- Build debug APK: `./gradlew :app:assembleDebug`

The project is currently configured with:
- `compileSdk = 34`
- `targetSdk = 34`
- `minSdk = 24`
- Kotlin + Jetpack Compose + Retrofit

## Next Steps
1. Wire AppRoot into Android Activity and Gradle module structure
2. Persist token/session securely (EncryptedSharedPreferences/DataStore)
3. Add statements and bill payment screens
4. Add dependency injection (Hilt) and unit tests
5. Add form masking, input validation, and accessibility polish
