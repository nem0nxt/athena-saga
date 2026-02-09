extends Node3D
class_name ChunkManager

## Chunk Manager - Open World Streaming System
## Divides the world into chunks and loads/unloads based on player position

# Configuration
@export var chunk_size: float = 64.0
@export var render_distance: int = 3  # chunks in each direction from player
@export var chunk_scene: PackedScene  # Reference to TerrainChunk scene
@export var player_path: NodePath = @"../Player"

# State
var chunks: Dictionary = {}  # Vector2i -> Chunk instance
var current_chunk_pos: Vector2i = Vector2i.ZERO
var player: Node3D

signal chunk_loaded(chunk_pos: Vector2i, chunk_node: Node3D)
signal chunk_unloaded(chunk_pos: Vector2i)

func _ready() -> void:
	if player_path:
		player = get_node(player_path)
	
	# Create a default terrain chunk scene if not assigned
	if not chunk_scene:
		chunk_scene = load("res://scenes/terrain_chunk.tscn")
	
	print("[ChunkManager] Initialized with chunk_size=%.1f, render_distance=%d" % [chunk_size, render_distance])
	_update_chunks()

func _process(_delta: float) -> void:
	if not player:
		return
	
	_update_chunks()

func _update_chunks() -> void:
	# Calculate current chunk position
	var world_pos = player.global_position
	var new_chunk_pos = get_chunk_pos(world_pos)
	
	if new_chunk_pos == current_chunk_pos:
		return
	
	current_chunk_pos = new_chunk_pos
	_recalculate_visible_chunks()

func _recalculate_visible_chunks() -> void:
	var active_chunks: Dictionary = {}
	
	# Calculate which chunks should be visible
	for x in range(-render_distance, render_distance + 1):
		for z in range(-render_distance, render_distance + 1):
			var chunk_offset = Vector2i(x, z)
			var chunk_pos = current_chunk_pos + chunk_offset
			active_chunks[chunk_pos] = true
	
	# Unload chunks that are no longer visible
	var chunks_to_remove: Array[Vector2i] = []
	for pos in chunks:
		if not pos in active_chunks:
			chunks_to_remove.append(pos)
	
	for pos in chunks_to_remove:
		var chunk = chunks[pos]
		chunks.erase(pos)
		chunk.queue_free()
		chunk_unloaded.emit(pos)
		print("[ChunkManager] Unloaded chunk %s" % str(pos))
	
	# Load new chunks
	var chunks_to_load: Array[Vector2i] = []
	for pos in active_chunks:
		if not pos in chunks:
			chunks_to_load.append(pos)
	
	for pos in chunks_to_load:
		_load_chunk(pos)

func _load_chunk(chunk_pos: Vector2i) -> void:
	if not chunk_scene:
		print("[ChunkManager] ERROR: No chunk scene assigned!")
		return
	
	var chunk = chunk_scene.instantiate()
	add_child(chunk)
	chunk.set_chunk_position(chunk_pos, chunk_size)
	chunks[chunk_pos] = chunk
	chunk_loaded.emit(chunk_pos, chunk)
	print("[ChunkManager] Loaded chunk %s" % str(chunk_pos))

func get_chunk_pos(world_pos: Vector3) -> Vector2i:
	return Vector2i(
		int(floor(world_pos.x / chunk_size)),
		int(floor(world_pos.z / chunk_size))
	)

func get_chunk_world_pos(chunk_pos: Vector2i) -> Vector3:
	return Vector3(
		chunk_pos.x * chunk_size,
		0,
		chunk_pos.y * chunk_size
	)

## Force reload all chunks (useful when changing terrain)
func reload_all() -> void:
	var active_chunks = chunks.duplicate()
	for pos in active_chunks:
		if chunks.has(pos):
			var chunk = chunks[pos]
			chunks.erase(pos)
			chunk.queue_free()
	current_chunk_pos = Vector2i(999999, 999999)  # Force update
	_update_chunks()

## Get all currently loaded chunks
func get_loaded_chunks() -> Array[Vector2i]:
	return chunks.keys()
