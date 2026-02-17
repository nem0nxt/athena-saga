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
@onready var animation_player: AnimationPlayer = $AnimationPlayer

# Combat
var health: float = 100.0
var max_health: float = 100.0
var is_attacking: bool = false

# Heart Rate System
var heart_ui: Control = null
var base_bpm: float = 80.0

# Animation fallback name
var _fallback_anim: String = ""
var _current_anim_state: String = ""

# Merged GLB (all animations in one file) - use when available
var _merged_scene: PackedScene = null
var _use_merged: bool = false

# Fallback: separate animated GLB scenes (used if merged GLB doesn't exist yet)
const SCENE_MESHY_IDLE = preload("res://scenes/MeshyIdle.tscn")
const SCENE_MESHY_IDLE_SHORT = preload("res://scenes/MeshyShortBreathe.tscn")
const SCENE_MESHY_WALK = preload("res://scenes/MeshyWalk.tscn")
const SCENE_MESHY_RUN = preload("res://scenes/MeshyRun.tscn")

# Animation states
const ANIM_IDLE = "Idle"
const ANIM_IDLE_SHORT = "IdleShort"
const ANIM_WALK = "Walk"
const ANIM_RUN = "Run"
const ANIM_STRAFE_LEFT = "Walk"
const ANIM_STRAFE_RIGHT = "Walk"
const ANIM_JUMP_START = "Idle"
const ANIM_JUMP_LOOP = "Idle"
const ANIM_ATTACK = "Idle"
const ANIM_TAKE_DAMAGE = "Idle"
const ANIM_DEATH = "Idle"

# Idle transition: Short Breathe when just stopped, Long Breathe when idle for a bit
const IDLE_SHORT_TO_LONG_TIME: float = 2.0
var _idle_time: float = 0.0

# Get the gravity from the project settings
var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")

func _ready() -> void:
	add_to_group("player")
	Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)

	# Try to load merged GLB (run tools/merge_meshy_animations.py first)
	_merged_scene = load("res://scenes/MeshyMerged.tscn") as PackedScene
	_use_merged = _merged_scene != null
	if _use_merged:
		print("Using merged Meshy animations (single GLB)")
	else:
		print("Using separate Meshy animation scenes (run tools/merge_meshy_animations.py to merge)")

	setup_character_model()

	# Find Heart UI
	heart_ui = get_tree().get_first_node_in_group("heart_ui")
	if heart_ui:
		heart_ui.set_bpm(base_bpm)
		heart_ui.take_heart_damage(0)

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
	if not is_on_floor():
		velocity.y -= gravity * delta

	# Ensure movement animations keep looping when keys are held
	if animation_player and not animation_player.is_playing() and not is_attacking:
		play_animation(_current_anim_state)

	if Input.is_action_just_pressed("jump") and is_on_floor():
		velocity.y = JUMP_VELOCITY
		_on_running()

	var input_dir := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var direction := (camera_pivot.global_transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
	direction.y = 0

	if direction:
		_idle_time = 0.0
		velocity.x = lerp(velocity.x, direction.x * SPEED, ACCELERATION * delta)
		velocity.z = lerp(velocity.z, direction.z * SPEED, ACCELERATION * delta)

		var target_angle := atan2(direction.x, direction.z)
		mesh.rotation.y = lerp_angle(mesh.rotation.y, target_angle, 10 * delta)

		if is_on_floor() and not is_attacking:
			if direction.length() > 0.5:
				_switch_character_state(ANIM_RUN)
				_on_running()
			else:
				_switch_character_state(ANIM_WALK)
				_on_running()
	else:
		velocity.x = lerp(velocity.x, 0.0, FRICTION * delta)
		velocity.z = lerp(velocity.z, 0.0, FRICTION * delta)
		_idle_time += delta
		var idle_state = ANIM_IDLE_SHORT if _idle_time < IDLE_SHORT_TO_LONG_TIME else ANIM_IDLE
		_switch_character_state(idle_state)
		_on_idle(delta)

	if not is_on_floor() and not is_attacking:
		_idle_time = 0.0
		_switch_character_state(ANIM_IDLE_SHORT)

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
	play_animation(ANIM_ATTACK)

	await get_tree().create_timer(0.2).timeout
	check_attack_hit()

	await get_tree().create_timer(0.3).timeout
	is_attacking = false

func check_attack_hit() -> void:
	var space_state := get_world_3d().direct_space_state
	var attack_origin := global_position + Vector3.UP * 1.0 + mesh.global_transform.basis.z * -1.0
	var attack_end := attack_origin + mesh.global_transform.basis.z * -2.0

	var query := PhysicsRayQueryParameters3D.create(attack_origin, attack_end)
	query.collision_mask = 4
	var result := space_state.intersect_ray(query)

	if result:
		var enemy = result.collider
		if enemy.has_method("take_damage"):
			enemy.take_damage(25.0)

func take_damage(amount: float) -> void:
	health -= amount
	play_animation(ANIM_TAKE_DAMAGE)

	if heart_ui:
		heart_ui.add_bpm(20.0)

	if health <= 0:
		await get_tree().create_timer(0.5).timeout
		die()

func die() -> void:
	play_animation(ANIM_DEATH)

func play_animation(anim_name: String) -> void:
	if not animation_player:
		return

	if animation_player.current_animation == anim_name:
		return

	if animation_player.has_animation(anim_name):
		var anim = animation_player.get_animation(anim_name)
		if anim:
			anim.loop_mode = Animation.LOOP_LINEAR
		animation_player.play(anim_name)
	else:
		var fallback := ANIM_IDLE
		if animation_player.has_animation(ANIM_IDLE):
			fallback = ANIM_IDLE
		elif animation_player.has_animation(ANIM_IDLE_SHORT):
			fallback = ANIM_IDLE_SHORT
		elif _fallback_anim != "":
			fallback = _fallback_anim
		else:
			return
		var anim = animation_player.get_animation(fallback)
		if anim:
			anim.loop_mode = Animation.LOOP_LINEAR
		animation_player.play(fallback)

func _switch_character_state(state: String, force: bool = false) -> void:
	if not force and _current_anim_state == state:
		return

	_current_anim_state = state

	if _use_merged:
		# Single GLB: just play the animation, no scene swapping
		play_animation(state)
	else:
		# Fallback: swap scenes (old behavior)
		_switch_character_state_legacy(state)

func _switch_character_state_legacy(state: String) -> void:
	for child in $MeshPivot.get_children():
		child.queue_free()

	var scene: PackedScene = SCENE_MESHY_IDLE
	if state == ANIM_RUN:
		scene = SCENE_MESHY_RUN
	elif state == ANIM_WALK:
		scene = SCENE_MESHY_WALK
	elif state == ANIM_IDLE_SHORT:
		scene = SCENE_MESHY_IDLE_SHORT
	else:
		scene = SCENE_MESHY_IDLE

	var instance = scene.instantiate()
	$MeshPivot.add_child(instance)

	var anim_player = instance.get_node_or_null("AnimationPlayer")
	if not anim_player:
		anim_player = _find_animation_player(instance)

	if anim_player and anim_player.get_animation_list().size() > 0:
		animation_player = anim_player
		var anims = animation_player.get_animation_list()
		_fallback_anim = anims[0]
		var anim = animation_player.get_animation(_fallback_anim)
		if anim:
			anim.loop_mode = Animation.LOOP_LINEAR
		animation_player.play(_fallback_anim)
	else:
		print("ERROR: No AnimationPlayer with animations!")

func setup_character_model() -> void:
	var default_body = $MeshPivot.get_child(0) if $MeshPivot.get_child_count() > 0 else null
	if default_body:
		default_body.visible = false

	if _use_merged:
		# Instantiate merged character once
		var instance = _merged_scene.instantiate()
		$MeshPivot.add_child(instance)

		var anim_player = instance.get_node_or_null("AnimationPlayer")
		if not anim_player:
			anim_player = _find_animation_player(instance)

		if anim_player and anim_player.get_animation_list().size() > 0:
			animation_player = anim_player
			var anims = animation_player.get_animation_list()
			_fallback_anim = anims[0]
			_switch_character_state(ANIM_IDLE, true)
		else:
			print("ERROR: Merged Meshy has no AnimationPlayer. Check animation names: Idle, IdleShort, Walk, Run")
	else:
		_switch_character_state_legacy(ANIM_IDLE)

func _find_animation_player(node: Node) -> AnimationPlayer:
	if node is AnimationPlayer:
		return node

	for child in node.get_children():
		var result = _find_animation_player(child)
		if result:
			return result

	return null
