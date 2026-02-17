# Merge Meshy Animations

This tool merges all Meshy character animation GLBs into a single GLB file with multiple animations.

## Prerequisites

- **Blender** (3.6+ or 4.x recommended)

## How to Run

### Option A: From Blender GUI

1. Open Blender
2. Go to **Scripting** workspace
3. **Open** → `tools/merge_meshy_animations.py`
4. Click **Run Script**

### Option B: From Command Line

```bash
# From project root
blender --background --python tools/merge_meshy_animations.py
```

## Output

Creates: `assets/models/Meshy_AI_biped/Meshy_AI_Character_AllAnimations.glb`

Contains animations:
- **Idle** – Long Breathe and Look Around
- **IdleShort** – Short Breathe and Look Around
- **Walk** – Walking
- **Run** – Running

## After Merging

1. Open the project in Godot
2. Godot will auto-import the new GLB
3. The player will automatically use the merged animations (no scene swapping, smoother transitions)

## Fallback

If the merged GLB doesn't exist yet, the player falls back to the separate animation scenes (MeshyIdle, MeshyWalk, etc.).
