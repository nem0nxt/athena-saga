# Open World Chunk System Documentation

This document describes the chunk streaming system implemented for Athena Saga.

## Overview

The chunk system divides the game world into a grid of terrain tiles (chunks) that are loaded and unloaded dynamically based on the player's position. This allows for an effectively infinite open world while maintaining good performance.

## How It Works

### Chunk Grid System

```
World Position → Chunk Coordinates → Load/Unload Decision

Example:
- Player at (75, 120) world position
- Chunk size = 50
- Chunk coordinates = floor(75/50), floor(120/50) = (1, 2)
```

### Loading Logic

1. **ChunkManager** monitors player position every 0.5 seconds
2. Calculates current chunk coordinates from player position
3. Loads all chunks within `render_distance` of current chunk
4. Unloads chunks that are beyond `render_distance`
5. Uses **Manhattan distance** for chunk culling (faster than Euclidean)

### Chunk Structure

Each chunk contains:
- **Terrain mesh**: Procedurally generated with height variations
- **Collision**: Simple box collider for physics
- **StaticBody3D**: For physics interactions

## Configuration Parameters

Edit `scripts/chunk_manager.gd` to configure:

```gdscript
@export var chunk_size: float = 50.0      # Size of each chunk in world units
@export var render_distance: int = 2      # Chunks to load in each direction (2 = 5x5 grid)
@export var update_interval: float = 0.5  # Seconds between chunk position checks
@export var world_seed: int = 12345       # Seed for procedural terrain generation
@export var is_debug_mode: bool = false   # Enable debug logging
```

### Performance Tuning

| Setting | Effect |
|---------|--------|
| `render_distance = 1` | 3x3 grid, lowest memory |
| `render_distance = 2` | 5x5 grid, balanced (default) |
| `render_distance = 3` | 7x7 grid, higher memory |
| `update_interval = 0.1` | Faster updates, more CPU |
| `update_interval = 1.0` | Slower updates, less CPU |
| `chunk_size = 100` | Larger chunks, fewer draw calls |
| `chunk_size = 25` | Smaller chunks, more draw calls |

## Adding Buildings and Interiors

### Method 1: Chunk-Based Placement (Recommended for Open World)

Buildings should be placed within specific chunks:

```gdscript
# In TerrainChunk.gd or a building manager
func place_building_at(chunk_pos: Vector2i, building_scene: PackedScene) -> void:
    var building = building_scene.instantiate()
    var chunk_center = chunk_manager.get_chunk_world_position(chunk_pos)
    building.position = chunk_center + Vector3(0, 0, 0)  # Offset as needed
    add_child(building)
```

**Requirements for building chunks:**
- Mark chunk as "building chunk" in metadata
- Keep building chunks always loaded (render_distance = 0 won't work)
- Use larger render_distance in building areas

### Method 2: Fixed Interior Scenes (Recommended for Dens/Caves)

For interiors (houses, caves, dungeons):

1. **Create separate interior scenes** (e.g., `res://scenes/interiors/House.tscn`)
2. **Teleport player** to interior scene when entering doorway
3. **Use scene transitions** (not chunk streaming) for interiors

```gdscript
# Entry point script
func _on_door_entered():
    # Save world position
    var exit_position = global_position
    
    # Switch to interior scene
    get_tree().change_scene_to_file("res://scenes/interiors/House.tscn")
    
    # Position player at interior entrance
    player.global_position = Vector3(0, 1, 5)
```

### Method 3: Mixed Approach

Use chunk streaming for exterior terrain and fixed scenes for buildings:

- **Exterior**: Chunk-based streaming
- **Building interiors**: Separate scenes loaded on demand
- **Building exteriors**: Can use chunk system with decoration pass

## API Reference

### ChunkManager

```gdscript
# Get singleton instance
var cm = ChunkManager.get_instance()

# Convert world position to chunk coordinates
var chunk_pos = cm.get_chunk_coordinates(player.global_position)

# Get chunk world center position
var chunk_center = cm.get_chunk_world_position(chunk_pos)

# Check if chunk is loaded
var is_loaded = cm.is_chunk_loaded(chunk_pos)

# Get all active chunks
var active = cm.get_active_chunks()

# Change settings at runtime
cm.set_render_distance(3)
```

### TerrainChunk

```gdscript
# Access chunk properties
var chunk = active_chunks[chunk_pos]
var pos = chunk.get_chunk_position()
var size = chunk.get_chunk_size()
```

## Future Improvements

1. **LOD System**: Implement multi-resolution meshes based on distance
2. **Async Loading**: Use `await` for smooth chunk transitions
3. **Preloading**: Load adjacent chunks before player arrives
4. **Terrain Noise**: Use FastNoiseLite for better terrain generation
5. **Chunk Persistence**: Save/load chunk state for multiplayer
6. **Streaming Groups**: Different groups for terrain, buildings, props

## Debug Mode

Enable debug logging in `chunk_manager.gd`:

```gdscript
@export var is_debug_mode: bool = true
```

This will log:
- Chunk load/unload events
- Player chunk transitions
- Active chunk count

## Troubleshooting

### Chunks not loading
- Check `chunk_manager` reference in player
- Ensure player is in "player" group
- Verify `is_debug_mode` for errors

### Performance issues
- Reduce `render_distance`
- Increase `update_interval`
- Use larger `chunk_size`

### Player falls through terrain
- Check collision shapes are generated
- Verify `chunk_size` matches terrain generation
