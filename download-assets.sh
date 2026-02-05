#!/bin/bash

# Athena Saga Asset Downloader
echo "🏛️ Athena Saga - Free Asset Downloader"
echo "======================================"

ASSETS_DIR="assets"
MODELS_DIR="$ASSETS_DIR/models"
TEXTURES_DIR="$ASSETS_DIR/textures"

# Create directories
mkdir -p "$MODELS_DIR" "$TEXTURES_DIR"

# Function to download and extract
download_and_extract() {
    local url="$1"
    local filename="$2"
    local desc="$3"
    
    echo "📦 Downloading: $desc"
    if curl -L -o "$MODELS_DIR/$filename" "$url"; then
        echo "✅ Downloaded: $filename"
        if [[ "$filename" == *.zip ]]; then
            echo "🗂️  Extracting: $filename"
            cd "$MODELS_DIR"
            unzip -q "$filename" -d "${filename%.zip}/"
            rm "$filename"
            cd - > /dev/null
            echo "✅ Extracted to: $MODELS_DIR/${filename%.zip}/"
        fi
    else
        echo "❌ Failed to download: $desc"
    fi
}

echo ""
echo "Available asset packs:"
echo "1) Kenney Character Pack (Low Poly Characters)"
echo "2) Kenney Castle Kit (Medieval Buildings)"
echo "3) Kenney Nature Pack (Trees, Rocks, Terrain)"
echo "4) Basic Weapons Pack"
echo ""

read -p "Which pack to download? (1-4, or 'all'): " choice

case "$choice" in
    1|all)
        download_and_extract \
            "https://github.com/KenneyNL/Starter-Kit-Character/archive/refs/heads/main.zip" \
            "kenney-characters.zip" \
            "Kenney Character Pack"
        ;;
esac

case "$choice" in
    2|all)
        download_and_extract \
            "https://github.com/KenneyNL/Starter-Kit-Castle/archive/refs/heads/main.zip" \
            "kenney-castle.zip" \
            "Kenney Castle Kit"
        ;;
esac

case "$choice" in
    3|all)
        download_and_extract \
            "https://github.com/KenneyNL/Starter-Kit-Nature/archive/refs/heads/main.zip" \
            "kenney-nature.zip" \
            "Kenney Nature Pack"
        ;;
esac

echo ""
echo "🎮 Asset download complete!"
echo "💡 Next steps:"
echo "   1. Open Godot project"
echo "   2. Drag .gltf/.fbx files from assets/models/ to FileSystem"
echo "   3. Create scenes from imported models"
echo "   4. Replace capsule in main scene with your character"
echo ""