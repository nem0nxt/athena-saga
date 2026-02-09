extends StaticBody3D
class_name TerrainChunk

## Terrain Chunk - Procedural Terrain Generation
## Generates simple terrain mesh for open world chunks

# Chunk configuration
var chunk_pos: Vector2i = Vector2i.ZERO
var chunk_size: float = 64.0

# Terrain settings
@export var height_scale: float = 10.0
@export var noise_scale: float = 0.05
@export var material: StandardMaterial3D

# Mesh resources
var mesh_instance: MeshInstance3D
var collision_shape: CollisionShape3D

# LOD support (simple version)
enum LODLevel { HIGH, MEDIUM, LOW }
var current_lod: LODLevel = LODLevel.HIGH

func _ready() -> void:
	_create_terrain()
	_create_collision()

func set_chunk_position(pos: Vector2i, size: float) -> void:
	chunk_pos = pos
	chunk_size = size
	global_position = Vector3(pos.x * size, 0, pos.y * size)

func _create_terrain() -> void:
	mesh_instance = MeshInstance3D.new()
	add_child(mesh_instance)
	
	# Create material if not assigned
	if not material:
		material = StandardMaterial3D.new()
		material.albedo_color = Color(0.3, 0.5, 0.25)  # Green grass color
		material.roughness = 0.9
	
	mesh_instance.material_override = material
	
	# Generate procedural terrain mesh
	var surface_tool = SurfaceTool.new()
	surface_tool.begin(Mesh.PRIMITIVE_TRIANGLES)
	
	# Simple flat terrain with slight variation
	var subdivisions = 16
	var step = chunk_size / subdivisions
	var height_map = _generate_height_map(subdivisions + 1)
	
	for z in range(subdivisions):
		for x in range(subdivisions):
			_add_quad(surface_tool, x, z, step, height_map)
	
	mesh_instance.mesh = surface_tool.commit()

func _generate_height_map(size: int) -> Array:
	var height_map: Array = []
	var noise = FastNoiseLite.new()
	noise.seed = chunk_pos.x * 1000 + chunk_pos.y
	noise.frequency = noise_scale
	noise.fractal_type = FastNoiseLite.FRACTAL_FBM
	
	for z in range(size):
		var row: Array = []
		for x in range(size):
			# Get world position for noise
			var world_x = chunk_pos.x * chunk_size + x * (chunk_size / size)
			var world_z = chunk_pos.y * chunk_size + z * (chunk_size / size)
			
			var height = noise.get_noise_2d(world_x, world_z) * height_scale
			row.append(height)
		height_map.append(row)
	
	return height_map

func _add_quad(st: SurfaceTool, x: int, z: int, step: float, height_map: Array) -> void:
	var size = height_map.size()
	
	# Get heights for the 4 corners
	var h00 = _get_height(height_map, x, z, size)
	var h10 = _get_height(height_map, x + 1, z, size)
	var h01 = _get_height(height_map, x, z + 1, size)
	var h11 = _get_height(height_map, x + 1, z + 1, size)
	
	# World positions
	var v00 = Vector3(x * step, h00, z * step)
	var v10 = Vector3((x + 1) * step, h10, z * step)
	var v01 = Vector3(x * step, h01, (z + 1) * step)
	var v11 = Vector3((x + 1) * step, h11, (z + 1) * step)
	
	# UV coordinates
	var uv00 = Vector2(float(x) / size, float(z) / size)
	var uv10 = Vector2(float(x + 1) / size, float(z) / size)
	var uv01 = Vector2(float(x) / size, float(z + 1) / size)
	var uv11 = Vector2(float(x + 1) / size, float(z + 1) / size)
	
	# First triangle
	st.set_normal(Vector3.UP)
	st.set_uv(uv00)
	st.add_vertex(v00)
	st.set_normal(Vector3.UP)
	st.set_uv(uv10)
	st.add_vertex(v10)
	st.set_normal(Vector3.UP)
	st.set_uv(uv01)
	st.add_vertex(v01)
	
	# Second triangle
	st.set_normal(Vector3.UP)
	st.set_uv(uv10)
	st.add_vertex(v10)
	st.set_normal(Vector3.UP)
	st.set_uv(uv11)
	st.add_vertex(v11)
	st.set_normal(Vector3.UP)
	st.set_uv(uv01)
	st.add_vertex(v01)

func _get_height(height_map: Array, x: int, z: int, size: int) -> float:
	x = clamp(x, 0, size - 1)
	z = clamp(z, 0, size - 1)
	return height_map[z][x]

func _create_collision() -> void:
	collision_shape = CollisionShape3D.new()
	add_child(collision_shape)
	
	# Use the generated mesh for collision
	if mesh_instance and mesh_instance.mesh:
		var shape = mesh_instance.mesh.create_trimesh_shape()
		collision_shape.shape = shape

func set_lod(level: LODLevel) -> void:
	if level == current_lod:
		return
	
	current_lod = level
	
	# Adjust detail based on LOD
	match level:
		LODLevel.HIGH:
			_create_terrain()  # Full detail
		LODLevel.MEDIUM:
			_create_terrain()  # Same for now
		LODLevel.LOW:
			_create_terrain()  # Could be simplified

## Add a building/interior to this chunk
func add_building(building_scene: PackedScene, local_pos: Vector3) -> void:
	var building = building_scene.instantiate()
	add_child(building)
	building.global_position = global_position + local_pos
	print("[TerrainChunk] Added building at %s" % str(global_position + local_pos))

## Add a prop/object to this chunk
func add_prop(prop_scene: PackedScene, local_pos: Vector3, rotation: float = 0.0) -> void:
	var prop = prop_scene.instantiate()
	add_child(prop)
	prop.global_position = global_position + local_pos
	prop.rotation.y = rotation
