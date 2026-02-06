# Samantha Character Setup

## Model Info
- **Source**: RepeatLoader (itch.io)
- **LODs**: 5 levels (using LOD3 for balance)
- **Animations**: Walk, Run, Idle, Strafe, Twerk (via Mixamo)
- **Format**: FBX with textures

## Import Process

1. **In Godot Project:**
   - The FBX is at: `assets/models/samantha.fbx`
   - Double-click to import
   - Import settings:
     - Animation → Import Animations: ✅
     - Meshes → Ensure Tangents: ✅
   - Click "Reimport"

2. **Create Character Scene:**
   - Right-click `samantha.fbx` → "New Inherited Scene"
   - Save as: `scenes/SamanthaCharacter.tscn`
   - Open the scene

3. **Setup in Scene:**
   - Find the AnimationPlayer node
   - Check available animations (idle, walk, run, etc.)
   - Note the root node name (usually "RootNode" or similar)

4. **Replace Player Mesh:**
   - Open `scenes/main.tscn`
   - Select Player → MeshPivot
   - Delete/hide current children
   - Instance SamanthaCharacter as child

## Animation Mapping

In `player.gd`, update animation names to match:
```gdscript
# Example (adjust to actual animation names)
idle → "mixamo.com|idle"  
run → "mixamo.com|run"
walk → "mixamo.com|walk"
```