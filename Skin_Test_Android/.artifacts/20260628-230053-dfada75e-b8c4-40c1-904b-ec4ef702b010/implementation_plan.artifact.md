# Fix Gradle Plugin Compatibility Issue

The project is using Gradle 9.3.0, which has removed the `Project.convention` property. This property was heavily used by older versions of the Ktor and Shadow plugins. The error message indicates that `io.ktor.plugin` version 2.3.8 depends on a version of the Shadow plugin that is incompatible with Gradle 8.2+ (and certainly Gradle 9).

## Proposed Changes

### Backend

#### [build.gradle.kts](file:///D:/Zantry/Skin_Test_Android/backend/build.gradle.kts)

- Update `io.ktor.plugin` to version `3.1.1` (which is compatible with Ktor 3.x and newer Gradle versions).
- Update Ktor version to `3.1.1` to match the plugin and benefit from Gradle 9 compatibility.
- Ensure Kotlin version is also up to date (1.9.22 is likely fine, but we'll monitor).

```diff
 plugins {
-    kotlin("jvm") version "1.9.22"
-    kotlin("plugin.serialization") version "1.9.22"
-    id("io.ktor.plugin") version "2.3.8"
+    kotlin("jvm") version "2.1.10"
+    kotlin("plugin.serialization") version "2.1.10"
+    id("io.ktor.plugin") version "3.1.1"
     application
 }
...
-val ktorVersion = "2.3.8"
+val ktorVersion = "3.1.1"
```

> [!NOTE]
> Ktor 3.0+ introduced some breaking changes in packages (e.g., `io.ktor.server.plugins.cors.routing` might move). I will fix these during the execution phase if they arise.

## Verification Plan

### Automated Tests
- Run `./gradlew build` in the `backend` directory.

### Manual Verification
- Start the backend using the "Backend" run configuration in Android Studio.
- Verify the server starts without errors and logs "Listening on http://0.0.0.0:8080".
