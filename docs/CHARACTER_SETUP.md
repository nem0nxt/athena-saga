# Character Model Setup Guide

## Option 1: Mixamo (Recommended) 🎭

1. **Create Adobe Account** (free)
   - Go to: https://www.mixamo.com
   - Sign up/login

2. **Choose Character**
   - Browse Characters → Filter: Female
   - Good options:
     - "Maria" (warrior look)
     - "Pearl" (athletic)
     - "Kaya" (adventurer)
   
3. **Download Settings**
   - Format: **FBX for Unity (.fbx)**
   - Pose: **T-pose**
   - ✅ With Skin

4. **Download Animations**
   - Search & download these:
     - "Idle" (standing loop)
     - "Running" 
     - "Jump"
     - "Sword And Shield Slash" (attack)
     - "Getting Hit"
   - Settings: **Without Skin**, **30 FPS**

## Option 2: Ready-to-Use Pack 📦

Download this CC0 character pack:
```bash
cd ~/.openclaw/workspace/athena-saga
mkdir -p assets/models/characters
cd assets/models/characters

# Quaternius Ultimate Characters Pack (CC0)
curl -L -o "quaternius-characters.zip" \
  "https://drive.google.com/uc?export=download&id=1lJlYR4gL3r7IEvL7azIe7pNkO5mLQWxR"
  
unzip quaternius-characters.zip
```

## Godot Import Steps 🎮

1. **Copy to Project**
   ```
   assets/models/characters/
   ├── athena.fbx          (character model)
   ├── idle.fbx            (animation)
   ├── running.fbx         (animation)
   ├── jump.fbx            (animation)
   └── attack.fbx          (animation)
   ```

2. **Import Settings**
   - Double-click .fbx in Godot
   - Meshes → Generate → Tangents: Yes
   - Animation → Import: Yes (for main model)
   - Click "Reimport"

3. **Create Character Scene**
   - Right-click athena.fbx → "New Inherited Scene"
   - Save as: `scenes/Player.tscn`

4. **Setup in Code**
   - Replace capsule mesh with character scene
   - Connect AnimationPlayer
   - Map animations to actions

## Quick Test Character 🏃‍♀️

For immediate testing, here's a simple colored character:
```gdscript
# In player.gd, add this to _ready():
func setup_simple_character():
    # Remove capsule mesh
    $MeshPivot/Body.queue_free()
    
    # Create simple character
    var char = MeshInstance3D.new()
    var box_mesh = BoxMesh.new()
    box_mesh.size = Vector3(0.6, 1.6, 0.3)
    char.mesh = box_mesh
    
    # Gold/bronze material
    var mat = StandardMaterial3D.new()
    mat.albedo_color = Color(0.8, 0.6, 0.3)
    mat.metallic = 0.3
    mat.roughness = 0.6
    char.material_override = mat
    
    $MeshPivot.add_child(char)
    char.position.y = 0.9
```

## Athena Visual Target 🛡️

- **Hair**: Blonde, flowing
- **Armor**: Greek-style bronze/gold
- **Accessories**: Helmet, shield, spear
- **Style**: Athletic warrior, not overly sexualized

## Resources

- **Mixamo**: https://www.mixamo.com
- **Quaternius**: https://quaternius.com/packs/ultimatecharacters.html
- **OpenGameArt**: Search "female warrior 3d"
- **Sketchfab**: Filter free downloads, "greek warrior"