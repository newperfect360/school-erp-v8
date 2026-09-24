plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
}

// Firebase stays inactive unless this Android app's own approved configuration is added.
// Never copy the web Firebase configuration or use a service-account key here.
val firebaseConfigured = file("google-services.json").isFile
if (firebaseConfigured) apply(plugin = "com.google.gms.google-services")

android {
    namespace = "com.gbsschool.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.gbsschool.app"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        buildConfigField("boolean", "FIREBASE_CONFIGURED", firebaseConfigured.toString())
        val schoolTenant = providers.gradleProperty("SCHOOL_TENANT_ID").orElse("").get()
        require(schoolTenant.matches(Regex("[A-Za-z0-9_-]*"))) { "Invalid school tenant ID" }
        buildConfigField("String", "SCHOOL_TENANT_ID", "\"$schoolTenant\"")
        val tenantEndpoint = providers.gradleProperty("TENANT_AUTH_URL").orElse("").get()
        require(tenantEndpoint.isBlank() || (tenantEndpoint.startsWith("https://") && !tenantEndpoint.contains('"') && !tenantEndpoint.contains('\\'))) { "Invalid HTTPS tenant endpoint" }
        buildConfigField("String", "TENANT_AUTH_URL", "\"$tenantEndpoint\"")
        vectorDrawables.useSupportLibrary = true
    }

    buildTypes {
        debug {
            versionNameSuffix = "-perfectedu-demo"
            buildConfigField("boolean", "DEV_ADMIN_LOGIN", "true")
        }
        release {
            buildConfigField("boolean", "DEV_ADMIN_LOGIN", "false")
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    testOptions {
        unitTests.isIncludeAndroidResources = true
    }
    packaging {
        resources.excludes += "/META-INF/{AL2.0,LGPL2.1}"
    }
    lint {
        abortOnError = true
        checkReleaseBuilds = true
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.icons)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)

    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.auth)
    implementation(libs.firebase.firestore)
    implementation(libs.firebase.storage)
    implementation(libs.firebase.messaging)

    testImplementation(libs.junit)
    testImplementation(libs.robolectric)
    testImplementation(libs.androidx.test.core)
    testImplementation(platform(libs.androidx.compose.bom))
    testImplementation(libs.androidx.compose.ui.test)
}
