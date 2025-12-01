#!/bin/bash
set -e

echo "Setting up mobile development environment..."

# Install Flutter if not present
if [ ! -d "/opt/flutter" ]; then
    echo "Installing Flutter SDK..."
    git clone https://github.com/flutter/flutter.git -b stable /opt/flutter
    /opt/flutter/bin/flutter precache
    /opt/flutter/bin/flutter doctor
fi

# Install Android SDK command-line tools if not present
if [ ! -d "/opt/android-sdk/cmdline-tools" ]; then
    echo "Installing Android SDK command-line tools..."
    mkdir -p /opt/android-sdk/cmdline-tools
    cd /tmp
    wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
    unzip commandlinetools-linux-9477386_latest.zip -d /opt/android-sdk/cmdline-tools
    mv /opt/android-sdk/cmdline-tools/cmdline-tools /opt/android-sdk/cmdline-tools/latest
    rm commandlinetools-linux-9477386_latest.zip
fi

# Accept Android SDK licenses
yes | /opt/android-sdk/cmdline-tools/latest/bin/sdkmanager --licenses || true

# Install essential Android SDK components
echo "Installing Android SDK components..."
/opt/android-sdk/cmdline-tools/latest/bin/sdkmanager \
    "platform-tools" \
    "platforms;android-33" \
    "build-tools;33.0.2" \
    "emulator" \
    "system-images;android-33;google_apis;x86_64"

# Configure Flutter
/opt/flutter/bin/flutter config --android-sdk /opt/android-sdk
/opt/flutter/bin/flutter config --enable-web
/opt/flutter/bin/flutter doctor -v

# Set proper permissions
sudo chown -R vscode:vscode /opt/flutter /opt/android-sdk

echo "Mobile development environment ready!"
echo "Run 'flutter doctor' to verify installation."
