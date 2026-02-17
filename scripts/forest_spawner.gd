extends Node3D
class_name ForestSpawner

## Spawns a forest of trees and rocks for testing.
## Uses Kenney Nature Kit assets (CC0 - kenney.nl)

@export var forest_size: float = 80.0  # Area around origin
@export var tree_spacing: float = 6.0
@export var tree_count: int = 80
@export var rock_count: int = 30

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

	# Spawn trees
	for i in tree_count:
		if _tree_packed.is_empty():
			break
		var scene = _tree_packed[rng.randi() % _tree_packed.size()]
		var pos = Vector3(
			rng.randf_range(-half, half),
			0.0,
			rng.randf_range(-half, half)
		)
		_spawn_prop(scene, pos, rng, 1.5)

	# Spawn rocks
	for i in rock_count:
		if _rock_packed.is_empty():
			break
		var scene = _rock_packed[rng.randi() % _rock_packed.size()]
		var pos = Vector3(
			rng.randf_range(-half, half),
			0.0,
			rng.randf_range(-half, half)
		)
		_spawn_prop(scene, pos, rng, 0.8)

func _spawn_prop(scene: PackedScene, pos: Vector3, rng: RandomNumberGenerator, scale_range: float) -> void:
	var instance = scene.instantiate()
	add_child(instance)
	instance.global_position = pos
	instance.rotation.y = rng.randf() * TAU
	var s = rng.randf_range(scale_range * 0.7, scale_range * 1.3)
	instance.scale = Vector3(s, s, s)

	# Add collision so player doesn't walk through (trees/rocks only - scale_range > 1)
	if scale_range > 1.0:
		var body = StaticBody3D.new()
		body.collision_layer = 1
		body.collision_mask = 0
		body.position = pos
		add_child(body)
		var col = CollisionShape3D.new()
		var shape = CylinderShape3D.new()
		shape.height = 5.0 * s
		shape.radius = 1.2 * s
		col.shape = shape
		col.position.y = 2.5 * s
		body.add_child(col)
