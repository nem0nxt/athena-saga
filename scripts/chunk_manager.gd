extends Node3D
class_name ChunkManager

## ChunkManager - Handles open-world chunk streaming
## Loads/unloads terrain chunks based on player position

# Singleton instance for easy access
static var instance: ChunkManager

# Configuration
@export var chunk_size: float = 50.0
@export var render_distance: int = 2  # Chunks in each direction from player
@export var update_interval: float = 0.5  # Seconds between chunk updates

# World seed for procedural generation
@export var world_seed: int = 12345

# References
var player: Node3D
var chunk_scene: PackedScene

# Chunk storage
var active_chunks: Dictionary = {}  # Vector2i -> TerrainChunk
var chunk_containers: Dictionary = {}  # Vector2i -> Node3D container

# State
var current_chunk: Vector2i = Vector2i.ZERO
var last_update_time: float = 0.0
var is_debug_mode: bool = false

# Signals for other systems
signal chunks_updated(active_chunks: Array)
signal chunk_loaded(chunk_pos: Vector2i)
signal chunk_unloaded(chunk_pos: Vector2i)

func _ready() -> void:
	instance = self
	add_to_group("chunk_manager")
	
	# Load terrain chunk scene or use script directly
	chunk_scene = load("res://scripts/terrain_chunk.gd")
	
	if is_debug_mode:
		print("ChunkManager initialized")
		print("  Chunk size: ", chunk_size)
		print("  Render distance: ", render_distance)

func _exit_tree() -> void:
	instance = null

func _process(delta: float) -> void:
	if not player:
		find_player()
		return
	
	# Update chunks at interval
	var current_time = Time.get_ticks_msec() / 1000.0
	if current_time - last_update_time < update_interval:
		return
	
	last_update_time = current_time
	update_chunks()

func find_player() -> void:
	player = get_tree().get_first_node_in_group("player")
	if not player:
		player = get_node_or_null("../Player")  # Common location
	if not player and is_debug_mode:
		print("Warning: Player not found!")

func set_player_reference(p: Node3D) -> void:
	player = p
	if is_debug_mode:
		print("Player reference set")

func update_chunks() -> void:
	if not player:
		return
	
	# Calculate player's current chunk position
	var player_pos = player.global_position
	var new_chunk = get_chunk_coordinates(player_pos)
	
	# Only update if player moved to a different chunk
	if new_chunk == current_chunk:
		return
	
	current_chunk = new_chunk
	
	if is_debug_mode:
		print("Player entered chunk: ", current_chunk)
	
	load_required_chunks()
	unload_distant_chunks()
	
	# Emit signal with active chunk positions
	var active_positions: Array[Vector2i] = []
	for pos in active_chunks.keys():
		active_positions.append(pos)
	chunks_updated.emit(active_positions)

func get_chunk_coordinates(world_pos: Vector3) -> Vector2i:
	# Convert world position to chunk grid coordinates
	var x = floor(world_pos.x / chunk_size)
	var z = floor(world_pos.z / chunk_size)
	return Vector2i(int(x), int(z))

func get_chunk_world_position(chunk: Vector2i) -> Vector3:
	# Get the world center position for a chunk
	return Vector3(chunk.x * chunk_size, 0, chunk.y * chunk_size)

func load_required_chunks() -> void:
	# Load all chunks within render distance
	for x in range(-render_distance, render_distance + 1):
		for z in range(-render_distance, render_distance + 1):
			var chunk_pos = current_chunk + Vector2i(x, z)
			
			if not active_chunks.has(chunk_pos):
				load_chunk(chunk_pos)

func load_chunk(chunk_pos: Vector2i) -> void:
	if active_chunks.has(chunk_pos):
		return  # Already loaded
	
	# Create chunk container
	var container = Node3D.new()
	container.name = "Chunk_%d_%d" % [chunk_pos.x, chunk_pos.y]
	container.position = get_chunk_world_position(chunk_pos)
	add_child(container)
	chunk_containers[chunk_pos] = container
	
	# Create chunk using script directly (not a scene for simplicity)
	var chunk = StaticBody3D.new()
	chunk.set_script(chunk_scene)
	chunk.name = "TerrainChunk"
	
	# Calculate noise offset based on chunk position for consistent terrain
	var noise_offset = Vector2(chunk_pos.x * chunk_size, chunk_pos.y * chunk_size)
	chunk.initialize(chunk_pos, chunk_size, noise_offset)
	
	container.add_child(chunk)
	active_chunks[chunk_pos] = chunk
	
	chunk_loaded.emit(chunk_pos)
	
	if is_debug_mode:
		print("Loaded chunk: ", chunk_pos)

func unload_distant_chunks() -> void:
	var chunks_to_unload: Array[Vector2i] = []
	
	for chunk_pos in active_chunks.keys():
		var distance = get_chunk_distance(chunk_pos, current_chunk)
		if distance > render_distance:
			chunks_to_unload.append(chunk_pos)
	
	for chunk_pos in chunks_to_unload:
		unload_chunk(chunk_pos)

func unload_chunk(chunk_pos: Vector2i) -> void:
	if not active_chunks.has(chunk_pos):
		return
	
	var chunk = active_chunks[chunk_pos]
	var container = chunk_containers.get(chunk_pos)
	
	if chunk:
		chunk.queue_free()
	
	if container:
		container.queue_free()
	
	active_chunks.erase(chunk_pos)
	chunk_containers.erase(chunk_pos)
	
	chunk_unloaded.emit(chunk_pos)
	
	if is_debug_mode:
		print("Unloaded chunk: ", chunk_pos)

func get_chunk_distance(chunk_a: Vector2i, chunk_b: Vector2i) -> int:
	# Manhattan distance for chunk culling
	return abs(chunk_a.x - chunk_b.x) + abs(chunk_a.y - chunk_b.y)

func get_active_chunks() -> Dictionary:
	return active_chunks

func is_chunk_loaded(chunk_pos: Vector2i) -> bool:
	return active_chunks.has(chunk_pos)

# Public API for external systems
static func get_instance() -> ChunkManager:
	return instance

func get_nearest_chunk_center(world_pos: Vector3) -> Vector3:
	var chunk = get_chunk_coordinates(world_pos)
	return get_chunk_world_position(chunk)

func set_render_distance(distance: int) -> void:
	render_distance = distance
	update_chunks()  # Force immediate update

func set_chunk_size(size: float) -> void:
	chunk_size = size
	# Would need to reload all chunks here

func clear_all_chunks() -> void:
	var chunks = active_chunks.keys()
	for chunk_pos in chunks:
		unload_chunk(chunk_pos)
