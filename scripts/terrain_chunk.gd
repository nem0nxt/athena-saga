extends StaticBody3D
class_name TerrainChunk

## TerrainChunk - Procedural terrain chunk for open world
## Generates a simple terrain mesh and handles LOD (basic implementation)

signal chunk_loaded(chunk_position: Vector2i)
signal chunk_unloaded(chunk_position: Vector2i)

# Chunk grid position
var chunk_pos: Vector2i = Vector2i.ZERO

# Configuration
var chunk_size: float = 50.0
var terrain_height: float = 2.0
var noise_offset: Vector2 = Vector2.ZERO

# LOD support (optional)
var use_lod: bool = false
var lod_distance: float = 100.0
var current_lod: int = 0

# Mesh resources
var mesh_instance: MeshInstance3D
var collision_shape: CollisionShape3D

# Materials
var grass_material: StandardMaterial3D

func _ready() -> void:
	setup_materials()
	generate_terrain()
	chunk_loaded.emit(chunk_pos)
	print("Chunk loaded: ", chunk_pos)

func setup_materials() -> void:
	# Create grass material
	grass_material = StandardMaterial3D.new()
	grass_material.albedo_color = Color(0.3, 0.5, 0.25, 1)
	grass_material.roughness = 0.9

func initialize(pos: Vector2i, size: float, seed_offset: Vector2 = Vector2.ZERO) -> void:
	chunk_pos = pos
	chunk_size = size
	noise_offset = seed_offset

func generate_terrain() -> void:
	# Create a simple terrain mesh using SurfaceTool
	var st = SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	st.set_material(grass_material)
	
	var half_size = chunk_size / 2.0
	var segments = 10  # Low poly for now
	
	# Generate vertices
	for z in range(segments + 1):
		for x in range(segments + 1):
			var x_pos = (x / float(segments)) * chunk_size - half_size
			var z_pos = (z / float(segments)) * chunk_size - half_size
			
			# Simple height calculation using noise-like math
			var height = get_height_at(x_pos, z_pos)
			
			# UV coordinates
			st.set_uv(Vector2(x / float(segments), z / float(segments)))
			st.add_vertex(Vector3(x_pos, height, z_pos))
	
	# Generate indices for triangles
	for z in range(segments):
		for x in range(segments):
			var top_left = z * (segments + 1) + x
			var top_right = top_left + 1
			var bottom_left = (z + 1) * (segments + 1) + x
			var bottom_right = bottom_left + 1
			
			# Two triangles per quad
			st.add_index(top_left)
			st.add_index(bottom_left)
			st.add_index(top_right)
			
			st.add_index(top_right)
			st.add_index(bottom_left)
			st.add_index(bottom_right)
	
	st.generate_normals()
	mesh_instance = MeshInstance3D.new()
	mesh_instance.mesh = st.commit()
	add_child(mesh_instance)
	
	# Create collision
	create_collision()

func get_height_at(x: float, z: float) -> float:
	# Simple procedural height using sine waves (noise substitute)
	var height = 0.0
	
	# Large features
	height += sin((x + noise_offset.x) * 0.05) * 2.0
	height += cos((z + noise_offset.y) * 0.05) * 2.0
	
	# Small features
	height += sin((x + noise_offset.x) * 0.1) * 0.5
	height += cos((z + noise_offset.y) * 0.1) * 0.5
	
	return height

func create_collision() -> void:
	# Create collision shape matching the mesh
	collision_shape = CollisionShape3D.new()
	var box_shape = BoxShape3D.new()
	box_shape.size = Vector3(chunk_size, terrain_height, chunk_size)
	collision_shape.shape = box_shape
	collision_shape.position.y = -terrain_height / 2.0
	add_child(collision_shape)

func set_lod(distance: float) -> void:
	# Optional LOD implementation
	if not use_lod:
		return
	
	if distance < lod_distance * 0.5:
		current_lod = 0  # High detail
	elif distance < lod_distance:
		current_lod = 1  # Medium detail
	else:
		current_lod = 2  # Low detail
	
	# Could switch meshes here based on LOD

func _exit_tree() -> void:
	chunk_unloaded.emit(chunk_pos)
	print("Chunk unloaded: ", chunk_pos)

# Public API for chunk management
func get_chunk_position() -> Vector2i:
	return chunk_pos

func get_chunk_size() -> float:
	return chunk_size
