# Open World System - Athena Saga

## Overview

This document describes the open-world chunk streaming system implemented for Athena Saga. The system divides the world into small, manageable chunks that load and unload based on player position, enabling infinite exploration without memory issues.

## Architecture

### ChunkManager (`scripts/chunk_manager.gd`)

The `ChunkManager` is the central controller for chunk streaming. It:
- Maintains a grid of currently loaded chunks
- Tracks player position and calculates which chunk the player is in
- Loads new chunks as the player moves
- Unloads chunks that are outside the render distance

**Configuration:**
```gdscript
@export var chunk_size: float = 64.0      # Size of each chunk in world units
@export var render_distance: int = 3       # Chunks to load in each direction
@export var chunk_scene: PackedScene       # Reference to terrain_chunk.tscn
@export var player_path: NodePath          # Path to player node
```

**Key Functions:**
- `get_chunk_pos(world_pos: Vector3) -> Vector2i` - Convert world position to chunk coordinates
- `get_chunk_world_pos(chunk_pos: Vector2i) -> Vector3` - Convert chunk coordinates to world position
- `reload_all()` - Force reload all chunks (useful after changes)

### TerrainChunk (`scripts/terrain_chunk.gd`)

Each chunk is a `StaticBody3D` that generates procedural terrain using noise. Features:
- Procedural heightmap terrain generation using FastNoiseLite
- Automatic collision mesh generation
- LOD support (placeholder for future optimization)
- Methods to add buildings and props

**Configuration:**
```gdscript
@export var height_scale: float = 10.0    # Maximum terrain height
@export var noise_scale: float = 0.05     # Noise frequency
@export var material: StandardMaterial3D  # Terrain surface material
```

**Terrain Generation:**
The terrain uses FastNoiseLite with fractal FBM (Fractal Brownian Motion) for natural-looking hills and valleys. Each chunk uses the chunk position as the noise seed to ensure consistent terrain.

## Usage

### Basic Setup

1. Ensure `scenes/terrain_chunk.tscn` exists with the `TerrainChunk` script attached
2. Ensure `scenes/main.tscn` has a `ChunkManager` node configured
3. Run the game - chunks will automatically load around the player

### Customizing Terrain

To change terrain appearance, modify the `TerrainChunk` script:

**Different terrain types:**
```gdscript
# In _create_terrain(), change the material:
material = StandardMaterial3D.new()
material.albedo_color = Color(0.6, 0.4, 0.2)  # Brown earth
material.albedo_texture = load("res://assets/textures/grass.png")
```

**Different noise settings:**
```gdscript
# In _generate_height_map():
noise.frequency = 0.02  # Smoother, rolling hills
noise.fractal_octaves = 8  # More detailed
```

### Adding Buildings

Buildings are added to chunks dynamically. Create interior scenes and add them:

```gdscript
# In TerrainChunk.gd or a game manager:
var house_scene = preload("res://scenes/house.tscn")
var current_chunk = chunk_manager.get_current_chunk()
current_chunk.add_building(house_scene, Vector3(10, 0, 15))
```

### Adding Props

Props like trees, rocks, and decorations:

```gdscript
var tree_scene = preload("res://scenes/tree.tscn")
var current_chunk = chunk_manager.get_current_chunk()
current_chunk.add_prop(tree_scene, Vector3(5, 0, 20), rotation_degrees(45))
```

## Performance Optimization

### Current State
- Basic LOD system (can be expanded)
- Simple collision generation

### Future Improvements
1. **LOD System:** Implement true LOD with distance-based mesh simplification
2. **Mesh Instancing:** Use MultiMeshInstance3D for repeated props (trees, rocks)
3. **Occlusion Culling:** Add occlusion portals for indoor areas
4. **Async Loading:** Use `await` and threading for smoother chunk loading
5. **Pre-loading:** Anticipate player movement and pre-load adjacent chunks

### Configuration Tuning

For better performance:
```gdscript
# In ChunkManager:
chunk_size = 128.0   # Larger chunks = fewer draw calls
render_distance = 2  # Smaller = less memory, more pop-in
```

For higher quality:
```gdscript
chunk_size = 32.0    # Smaller chunks = smoother LOD transitions
render_distance = 5  # More chunks = smoother experience
```

## Interior Spaces (Buildings)

Buildings require special handling for true open-world:

### Approach 1: Separate Interior Scenes
1. Create building scene with interior geometry
2. Use a "door" area that teleports player to interior coordinates
3. Interior has its own smaller chunk system (optional)

### Approach 2: Sub-chunk Interiors
1. Buildings occupy a specific chunk region
2. Interior geometry replaces exterior when player enters
3. Requires chunk refresh on door entry

### Transition Points
```gdscript
func _on_door_entered(building_scene: PackedScene, interior_pos: Vector3):
    # Save exterior position
    exterior_save_pos = player.global_position
    
    # Teleport to interior
    player.global_position = interior_pos
    
    # Load building interior
    var building = building_scene.instantiate()
    add_child(building)
```

## Troubleshooting

### Chunks Not Loading
- Check that `chunk_scene` is assigned in ChunkManager
- Verify player_path points to the correct player node
- Check Output console for error messages

### Player Falls Through Ground
- Ensure collision_layer and collision_mask are correct
- Verify TerrainChunk creates collision (check mesh generation)
- Try increasing `subdivisions` in terrain generation

### Performance Issues
- Reduce `render_distance`
- Increase `chunk_size`
- Disable collision for distant chunks (advanced)

## File Structure

```
athena-saga/
├── scripts/
│   ├── chunk_manager.gd      # Chunk streaming system
│   ├── terrain_chunk.gd      # Individual chunk generation
│   └── player.gd             # Updated for chunk reporting
├── scenes/
│   ├── main.tscn             # Main scene with ChunkManager
│   └── terrain_chunk.tscn    # Terrain chunk scene template
├── assets/
│   ├── models/               # Building/prop models
│   └── textures/             # Terrain textures
└── docs/
    └── OPENWORLD.md          # This documentation
