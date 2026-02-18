extends Node3D
class_name ForestSpawner

## Spawns a forest of trees and rocks for testing.
## Uses Kenney Nature Kit assets (CC0 - kenney.nl)

@export var forest_size: float = 80.0  # Area around origin
@export var tree_spacing: float = 6.0
@export var tree_count: int = 80
@export var rock_count: int = 30
@export var enable_rock_collision: bool = true
@export var terrain_ray_height: float = 50.0

# Kenney tree models (FBX - Godot imports as scenes)
const TREE_SCENES := [
	"res://assets/forest/kenney/tree_default.fbx",
	"res://assets/forest/kenney/tree_oak.fbx",
	"res://assets/forest/kenney/tree_pineDefaultA.fbx",
	"res://assets/forest/kenney/tree_cone.fbx",
	"res://assets/forest/kenney/tree_fat.fbx",
	"res://assets/forest/kenney/tree_pineRoundA.fbx",
]

const ROCK_SCENES := [
	"res://assets/forest/kenney/rock_smallA.fbx",
	"res://assets/forest/kenney/rock_smallB.fbx",
	"res://assets/forest/kenney/rock_largeA.fbx",
]

var _tree_packed: Array[PackedScene] = []
var _rock_packed: Array[PackedScene] = []

func _snap_to_terrain(pos: Vector3) -> Vector3:
	# Raycast down to find terrain height
	var from = pos + Vector3.UP * terrain_ray_height
	var to = pos + Vector3.DOWN * terrain_ray_height
	var space_state = get_world_3d().direct_space_state
	var query = PhysicsRayQueryParameters3D.create(from, to)
	query.collision_mask = 1
	var hit = space_state.intersect_ray(query)
	if hit and hit.has("position"):
		var hp: Vector3 = hit.position
		return Vector3(pos.x, hp.y, pos.z)
	return pos

func _ready() -> void:
	_load_scenes()
	_spawn_forest()

func _load_scenes() -> void:
	for path in TREE_SCENES:
		if ResourceLoader.exists(path):
			var scene = load(path) as PackedScene
			if scene:
				_tree_packed.append(scene)
	for path in ROCK_SCENES:
		if ResourceLoader.exists(path):
			var scene = load(path) as PackedScene
			if scene:
				_rock_packed.append(scene)
	if _tree_packed.is_empty():
		push_warning("ForestSpawner: No tree assets found. Check assets/forest/kenney/")

func _spawn_forest() -> void:
	var rng = RandomNumberGenerator.new()
	rng.seed = 42  # Consistent forest each run

	var half = forest_size / 2.0

	var tree_positions: Array[Vector3] = []
	var max_attempts := tree_count * 6
	var attempts := 0

	# Spawn trees with spacing
	var spawned := 0
	while spawned < tree_count and attempts < max_attempts:
		attempts += 1
		if _tree_packed.is_empty():
			break
		var pos = Vector3(
			rng.randf_range(-half, half),
			0.0,
			rng.randf_range(-half, half)
		)
		var ok := true
		for p in tree_positions:
			if p.distance_to(pos) < tree_spacing:
				ok = false
				break
		if not ok:
			continue
		var scene = _tree_packed[rng.randi() % _tree_packed.size()]
		var final_pos = _snap_to_terrain(pos)
		_spawn_prop(scene, final_pos, rng, 1.5, true)
		tree_positions.append(final_pos)
		spawned += 1

	# Spawn rocks (no spacing, but snap to terrain)
	for i in rock_count:
		if _rock_packed.is_empty():
			break
		var scene = _rock_packed[rng.randi() % _rock_packed.size()]
		var pos = Vector3(
			rng.randf_range(-half, half),
			0.0,
			rng.randf_range(-half, half)
		)
		var final_pos = _snap_to_terrain(pos)
		_spawn_prop(scene, final_pos, rng, 0.8, enable_rock_collision)

func _spawn_prop(scene: PackedScene, pos: Vector3, rng: RandomNumberGenerator, scale_range: float, make_collision: bool) -> void:
	var instance = scene.instantiate()
	add_child(instance)
	instance.global_position = pos
	instance.rotation.y = rng.randf() * TAU
	var s = rng.randf_range(scale_range * 0.7, scale_range * 1.3)
	instance.scale = Vector3(s, s, s)

	# Add collision so player doesn't walk through
	if make_collision:
		var body = StaticBody3D.new()
		body.collision_layer = 1
		body.collision_mask = 0
		body.position = pos
		add_child(body)
		var col = CollisionShape3D.new()
		var shape = CylinderShape3D.new()
		shape.height = 5.0 * s
		shape.radius = 1.2 * s if scale_range > 1.0 else 0.8 * s
		col.shape = shape
		col.position.y = 2.5 * s
		body.add_child(col)
