extends CharacterBody3D

# Movement
const SPEED = 7.0
const JUMP_VELOCITY = 5.5
const ACCELERATION = 15.0
const FRICTION = 10.0

# Camera
@export var mouse_sensitivity: float = 0.002
@onready var camera_pivot: Node3D = $CameraPivot
@onready var camera: Camera3D = $CameraPivot/SpringArm3D/Camera3D
@onready var spring_arm: SpringArm3D = $CameraPivot/SpringArm3D
@onready var mesh: Node3D = $MeshPivot

var animation_player: AnimationPlayer = null

# Combat
var health: float = 100.0
var max_health: float = 100.0
var is_attacking: bool = false

# Heart Rate System
var heart_ui: Control = null
var base_bpm: float = 80.0

# Animation: preloaded scene instances keyed by state
var _anim_instances: Dictionary = {}
var _current_anim_state: String = ""

const SCENE_MESHY_IDLE = preload("res://scenes/MeshyIdle.tscn")
const SCENE_MESHY_IDLE_SHORT = preload("res://scenes/MeshyShortBreathe.tscn")
const SCENE_MESHY_WALK = preload("res://scenes/MeshyWalk.tscn")
const SCENE_MESHY_RUN = preload("res://scenes/MeshyRun.tscn")

const ANIM_IDLE = "Idle"
const ANIM_IDLE_SHORT = "IdleShort"
const ANIM_WALK = "Walk"
const ANIM_RUN = "Run"
const ANIM_ATTACK = "Idle"
const ANIM_TAKE_DAMAGE = "Idle"
const ANIM_DEATH = "Idle"

const IDLE_SHORT_TO_LONG_TIME: float = 2.0
var _idle_time: float = 0.0

var _spawn_pos: Vector3
var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")


func _ready() -> void:
	add_to_group("player")
	Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)
	_spawn_pos = global_position
	
	# Configure CharacterBody3D for better ground detection
	floor_snap_length = 0.5
	floor_max_angle = deg_to_rad(50)

	_setup_anim_instances()

	heart_ui = get_tree().get_first_node_in_group("heart_ui")
	if heart_ui:
		heart_ui.set_bpm(base_bpm)
		heart_ui.take_heart_damage(0)

func _setup_anim_instances() -> void:
	var body = $MeshPivot.get_node_or_null("Body")
	if body:
		body.visible = false

	var merged = $MeshPivot.get_node_or_null("MeshyMerged")
	if merged:
		merged.queue_free()

	var scene_map := {
		ANIM_IDLE: SCENE_MESHY_IDLE,
		ANIM_IDLE_SHORT: SCENE_MESHY_IDLE_SHORT,
		ANIM_WALK: SCENE_MESHY_WALK,
		ANIM_RUN: SCENE_MESHY_RUN,
	}

	for state_name in scene_map:
		var scene: PackedScene = scene_map[state_name]
		var instance = scene.instantiate()
		instance.visible = false
		$MeshPivot.add_child(instance)
		
		# Disable any collision on the character mesh to prevent blocking player movement
		_disable_collisions_recursive(instance)

		var ap = _find_animation_player(instance)
		var anim_name := ""
		if ap:
			var anims = ap.get_animation_list()
			if anims.size() > 0:
				anim_name = anims[0]
				var anim = ap.get_animation(anim_name)
				if anim:
					anim.loop_mode = Animation.LOOP_LINEAR
		_anim_instances[state_name] = {
			"node": instance,
			"ap": ap,
			"anim": anim_name,
		}

	# Start with idle animation
	_switch_anim(ANIM_IDLE_SHORT)
	
	# Position mesh pivot so character feet touch the ground
	# The collision capsule bottom is at y=0 (center at 0.9, half-height 0.9)
	# Character model origin appears to be above feet, so lower it
	$MeshPivot.position.y = -1.0
	

func _find_node_of_type(node: Node, type_name: String) -> Node:
	if node.get_class() == type_name:
		return node
	for child in node.get_children():
		var result = _find_node_of_type(child, type_name)
		if result:
			return result
	return null

func _switch_anim(state: String) -> void:
	if state == _current_anim_state:
		return
	if not _anim_instances.has(state):
		state = ANIM_IDLE

	_current_anim_state = state

	for key in _anim_instances:
		var entry: Dictionary = _anim_instances[key]
		var is_active: bool = (key == state)
		entry.node.visible = is_active
		var ap: AnimationPlayer = entry.ap
		if not ap:
			continue
		if is_active and entry.anim != "":
			ap.play(entry.anim)
			animation_player = ap
		else:
			ap.stop()

func _input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.get_mouse_mode() == Input.MOUSE_MODE_CAPTURED:
		camera_pivot.rotate_y(-event.relative.x * mouse_sensitivity)
		spring_arm.rotate_x(-event.relative.y * mouse_sensitivity)
		spring_arm.rotation.x = clamp(spring_arm.rotation.x, -PI/3, PI/4)

	if event.is_action_pressed("ui_cancel"):
		if Input.get_mouse_mode() == Input.MOUSE_MODE_CAPTURED:
			Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)
		else:
			Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)

	if event.is_action_pressed("attack") and not is_attacking:
		attack()


func _physics_process(delta: float) -> void:
	# Respawn if fallen off world
	if global_position.y < -50.0:
		global_position = _spawn_pos
		velocity = Vector3.ZERO
		return

	if not is_on_floor():
		velocity.y -= gravity * delta

	if Input.is_action_just_pressed("jump") and is_on_floor():
		velocity.y = JUMP_VELOCITY
		_on_running()

	var input_dir := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var raw_dir := camera_pivot.global_transform.basis * Vector3(input_dir.x, 0, input_dir.y)
	raw_dir.y = 0
	var direction := raw_dir.normalized() if raw_dir.length() > 0.001 else Vector3.ZERO

	if direction:
		_idle_time = 0.0
		velocity.x = lerp(velocity.x, direction.x * SPEED, ACCELERATION * delta)
		velocity.z = lerp(velocity.z, direction.z * SPEED, ACCELERATION * delta)

		var target_angle := atan2(direction.x, direction.z)
		mesh.rotation.y = lerp_angle(mesh.rotation.y, target_angle, 10 * delta)

		if is_on_floor() and not is_attacking:
			if input_dir.length() > 0.6:
				_switch_anim(ANIM_RUN)
				_on_running()
			else:
				_switch_anim(ANIM_WALK)
				_on_running()
	else:
		velocity.x = lerp(velocity.x, 0.0, FRICTION * delta)
		velocity.z = lerp(velocity.z, 0.0, FRICTION * delta)
		_idle_time += delta
		var idle_state = ANIM_IDLE_SHORT if _idle_time < IDLE_SHORT_TO_LONG_TIME else ANIM_IDLE
		if is_on_floor() and not is_attacking:
			_switch_anim(idle_state)
		_on_idle(delta)

	if not is_on_floor() and not is_attacking:
		_idle_time = 0.0
		_switch_anim(ANIM_IDLE_SHORT)

	_check_heart_attack()
	move_and_slide()

func _on_running() -> void:
	if heart_ui:
		var speed_modifier = velocity.length() / SPEED
		var target_bpm = base_bpm + (40.0 * speed_modifier)
		heart_ui.set_bpm(target_bpm)

func _on_idle(delta: float) -> void:
	if heart_ui:
		heart_ui.reduce_bpm(30.0 * delta)

func _check_heart_attack() -> void:
	if heart_ui and heart_ui.is_dangerous_bpm():
		pass

func attack() -> void:
	is_attacking = true
	_switch_anim(ANIM_ATTACK)

	await get_tree().create_timer(0.2).timeout
	if not is_instance_valid(self):
		return
	check_attack_hit()

	await get_tree().create_timer(0.3).timeout
	if is_instance_valid(self):
		is_attacking = false

func check_attack_hit() -> void:
	var w3d = get_world_3d()
	if not w3d:
		return
	var space_state: PhysicsDirectSpaceState3D = w3d.direct_space_state
	var attack_origin := global_position + Vector3.UP * 1.0 + mesh.global_transform.basis.z * -1.0
	var attack_end := attack_origin + mesh.global_transform.basis.z * -2.0

	var query := PhysicsRayQueryParameters3D.create(attack_origin, attack_end)
	query.collision_mask = 4
	var result: Dictionary = space_state.intersect_ray(query)

	if result and result.has("collider"):
		var enemy = result["collider"]
		if enemy and enemy.has_method("take_damage"):
			enemy.take_damage(25.0)

func take_damage(amount: float) -> void:
	health -= amount
	_switch_anim(ANIM_TAKE_DAMAGE)

	if heart_ui:
		heart_ui.add_bpm(20.0)

	if health <= 0:
		await get_tree().create_timer(0.5).timeout
		if is_instance_valid(self):
			die()

func die() -> void:
	_switch_anim(ANIM_DEATH)

func _find_animation_player(node: Node) -> AnimationPlayer:
	if node is AnimationPlayer:
		return node
	for child in node.get_children():
		var result = _find_animation_player(child)
		if result:
			return result
	return null

func _disable_collisions_recursive(node: Node) -> void:
	# Disable collision shapes in character meshes so they don't block player movement
	if node is CollisionShape3D or node is CollisionPolygon3D:
		node.disabled = true
	if node is StaticBody3D or node is RigidBody3D or node is CharacterBody3D:
		node.collision_layer = 0
		node.collision_mask = 0
	for child in node.get_children():
		_disable_collisions_recursive(child)
