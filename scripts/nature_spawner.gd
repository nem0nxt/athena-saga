extends Node3D

@export var spawn_radius: float = 80.0
@export var tree_count: int = 60
@export var grass_count: int = 120
@export var rock_count: int = 25
@export var clear_radius: float = 10.0  # Keep area around spawn clear

var oak_scene: PackedScene = preload("res://assets/models/nature/oak_tree.glb")
var pine_scene: PackedScene = preload("res://assets/models/nature/pine_tree.glb")
var birch_scene: PackedScene = preload("res://assets/models/nature/birch_tree.glb")
var grass_scene: PackedScene = preload("res://assets/models/nature/grass_patch.glb")
var rock_scene: PackedScene = preload("res://assets/models/nature/rock.glb")

var tree_scenes: Array = []
var rng := RandomNumberGenerator.new()

func _ready() -> void:
	rng.seed = 12345
	tree_scenes = [oak_scene, pine_scene, birch_scene]
	call_deferred("_spawn_nature")

func _spawn_nature() -> void:
	_spawn_trees()
	_spawn_grass()
	_spawn_rocks()

func _get_random_position() -> Vector3:
	var angle = rng.randf() * TAU
	var dist = rng.randf_range(clear_radius, spawn_radius)
	return Vector3(cos(angle) * dist, 0, sin(angle) * dist)

func _get_terrain_height(x: float, z: float) -> float:
	# Match the terrain generation formula from create_grass_terrain.py
	var h = 3.0 * sin(x * 0.03) * cos(z * 0.025)
	h += 1.5 * sin(x * 0.08 + 1.5) * cos(z * 0.06 + 0.7)
	h += 0.5 * sin(x * 0.2 + 3.0) * cos(z * 0.25 + 2.1)
	h += 0.2 * sin(x * 0.5) * sin(z * 0.5)
	
	var dist_from_center = sqrt(x*x + z*z)
	if dist_from_center < 15:
		var flatten = 1.0 - max(0, (15 - dist_from_center) / 15)
		h *= flatten
	
	return h

func _spawn_trees() -> void:
	var tree_holder = Node3D.new()
	tree_holder.name = "Trees"
	add_child(tree_holder)
	
	for i in range(tree_count):
		var pos = _get_random_position()
		pos.y = _get_terrain_height(pos.x, pos.z)
		
		var tree_scene = tree_scenes[rng.randi() % tree_scenes.size()]
		var tree = tree_scene.instantiate()
		tree.position = pos
		tree.rotation.y = rng.randf() * TAU
		var s = rng.randf_range(0.8, 1.4)
		tree.scale = Vector3(s, s, s)
		tree_holder.add_child(tree)

func _spawn_grass() -> void:
	var grass_holder = Node3D.new()
	grass_holder.name = "Grass"
	add_child(grass_holder)
	
	for i in range(grass_count):
		var angle = rng.randf() * TAU
		var dist = rng.randf_range(2.0, spawn_radius)
		var pos = Vector3(cos(angle) * dist, 0, sin(angle) * dist)
		pos.y = _get_terrain_height(pos.x, pos.z)
		
		var grass = grass_scene.instantiate()
		grass.position = pos
		grass.rotation.y = rng.randf() * TAU
		var s = rng.randf_range(0.7, 1.5)
		grass.scale = Vector3(s, s, s)
		grass_holder.add_child(grass)

func _spawn_rocks() -> void:
	var rock_holder = Node3D.new()
	rock_holder.name = "Rocks"
	add_child(rock_holder)
	
	for i in range(rock_count):
		var pos = _get_random_position()
		pos.y = _get_terrain_height(pos.x, pos.z)
		
		var rock = rock_scene.instantiate()
		rock.position = pos
		rock.rotation.y = rng.randf() * TAU
		rock.rotation.x = rng.randf_range(-0.2, 0.2)
		var s = rng.randf_range(0.5, 2.0)
		rock.scale = Vector3(s, s * rng.randf_range(0.6, 1.0), s)
		rock_holder.add_child(rock)
