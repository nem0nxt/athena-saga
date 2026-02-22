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
var is_dead: bool = false

# Heart Rate System
var heart_ui: Control = null
var base_bpm: float = 60.0
var _running_time: float = 0.0  # Track continuous running time
const EXHAUSTION_THRESHOLD: float = 60.0  # 1 minute before exponential increase

# Heart Attack System
var is_heart_attack: bool = false
var heart_attack_timer: float = 0.0
const HEART_ATTACK_DURATION: float = 5.0  # How long the heart attack lasts
const HEART_ATTACK_BPM_THRESHOLD: float = 240.0  # BPM that triggers heart attack
var heart_attack_damage_timer: float = 0.0
var speed_modifier: float = 1.0  # Multiplier for movement speed

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
const ANIM_DEATH = "Death"

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

	# Defer heart UI lookup to ensure it's initialized
	call_deferred("_setup_heart_ui")

func _setup_heart_ui() -> void:
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
	# The collision capsule center is at y=0.9, radius 0.4, so bottom is at y=0
	# Adjust based on character model origin
	$MeshPivot.position.y = -0.1
	

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
	
	if event is InputEventKey and event.pressed and event.keycode == KEY_K and not is_dead:
		print("DEBUG: Triggering death via K key")
		health = 0
		die()

func _physics_process(delta: float) -> void:
	if is_dead:
		if not is_on_floor():
			velocity.y -= gravity * delta
			move_and_slide()
		return
	
	# Respawn if fallen off world
	if global_position.y < -50.0:
		global_position = _spawn_pos
		velocity = Vector3.ZERO
		return

	if not is_on_floor():
		velocity.y -= gravity * delta

	if Input.is_action_just_pressed("jump") and is_on_floor():
		velocity.y = JUMP_VELOCITY
		_on_running(delta)

	var input_dir := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var raw_dir := camera_pivot.global_transform.basis * Vector3(input_dir.x, 0, input_dir.y)
	raw_dir.y = 0
	var direction := raw_dir.normalized() if raw_dir.length() > 0.001 else Vector3.ZERO

	if direction:
		_idle_time = 0.0
		var effective_speed = SPEED * speed_modifier
		velocity.x = lerp(velocity.x, direction.x * effective_speed, ACCELERATION * delta)
		velocity.z = lerp(velocity.z, direction.z * effective_speed, ACCELERATION * delta)

		var target_angle := atan2(direction.x, direction.z)
		mesh.rotation.y = lerp_angle(mesh.rotation.y, target_angle, 10 * delta)

		if is_on_floor() and not is_attacking:
			if input_dir.length() > 0.6:
				_switch_anim(ANIM_RUN)
				_on_running(delta)
			else:
				_switch_anim(ANIM_WALK)
				_on_running(delta)
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

	_check_heart_attack(delta)
	move_and_slide()

func _on_running(delta: float) -> void:
	_running_time += delta
	if heart_ui:
		var velocity_factor = velocity.length() / SPEED
		var target_bpm = base_bpm + (40.0 * velocity_factor)
		
		# After threshold, heart rate increases exponentially
		if _running_time > EXHAUSTION_THRESHOLD:
			var overtime = _running_time - EXHAUSTION_THRESHOLD
			# Exponential factor: doubles every ~7 seconds of overtime
			var exhaustion_factor = pow(1.1, overtime)
			var extra_bpm = 30.0 * (exhaustion_factor - 1.0)
			target_bpm += extra_bpm
			# Cap at dangerous levels
			target_bpm = minf(target_bpm, 250.0)
		
		heart_ui.set_bpm(target_bpm)

func _on_idle(delta: float) -> void:
	# Reset running time when idle (resting) at 0.2x speed
	_running_time = maxf(0.0, _running_time - delta * 0.25)
	if heart_ui:
		# Gradually return to base BPM
		var recovery_bpm = base_bpm
		# If still exhausted, BPM stays elevated
		if _running_time > EXHAUSTION_THRESHOLD:
			var overtime = _running_time - EXHAUSTION_THRESHOLD
			var exhaustion_factor = pow(1.1, overtime)
			recovery_bpm += 30.0 * (exhaustion_factor - 1.0)
			recovery_bpm = minf(recovery_bpm, 250.0)
		heart_ui.set_bpm(recovery_bpm)

func _check_heart_attack(delta: float) -> void:
	if not heart_ui:
		return
	
	var current_bpm = heart_ui.current_bpm
	
	# Trigger heart attack when BPM exceeds threshold
	if current_bpm >= HEART_ATTACK_BPM_THRESHOLD and not is_heart_attack:
		_start_heart_attack()
	
	# Process ongoing heart attack
	if is_heart_attack:
		heart_attack_timer += delta
		heart_attack_damage_timer += delta
		
		# Apply damage every 0.5 seconds during heart attack
		if heart_attack_damage_timer >= 0.5:
			heart_attack_damage_timer = 0.0
			health -= 5.0
			heart_ui.take_heart_damage(5.0)
			if health <= 0:
				die()
		
		# Slow movement during heart attack (30% speed)
		speed_modifier = 0.3
		
		# Screen shake/pulse effect via camera
		var shake_intensity = 0.05 * (1.0 - heart_attack_timer / HEART_ATTACK_DURATION)
		camera.position.x = randf_range(-shake_intensity, shake_intensity)
		camera.position.y = randf_range(-shake_intensity, shake_intensity)
		
		# End heart attack after duration
		if heart_attack_timer >= HEART_ATTACK_DURATION:
			_end_heart_attack()
	else:
		# Gradually restore speed when not in heart attack
		speed_modifier = lerp(speed_modifier, 1.0, delta * 2.0)

func _start_heart_attack() -> void:
	is_heart_attack = true
	heart_attack_timer = 0.0
	heart_attack_damage_timer = 0.0
	# Force running time down to help recovery
	_running_time = EXHAUSTION_THRESHOLD * 0.5
	# Activate UI effect
	if heart_ui and heart_ui.has_method("set_heart_attack_active"):
		heart_ui.set_heart_attack_active(true)
	print("HEART ATTACK!")

func _end_heart_attack() -> void:
	is_heart_attack = false
	heart_attack_timer = 0.0
	speed_modifier = 0.5  # Still slow after heart attack, recovers gradually
	camera.position = Vector3.ZERO  # Reset camera position
	# Deactivate UI effect
	if heart_ui and heart_ui.has_method("set_heart_attack_active"):
		heart_ui.set_heart_attack_active(false)

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
	if is_dead:
		return
	is_dead = true
	velocity = Vector3.ZERO
	print("DIE called - health: ", health)
	
	# Keep current animation visible but freeze it
	if animation_player:
		animation_player.pause()
	
	# Stop the heart
	if heart_ui and heart_ui.has_method("stop_heart"):
		heart_ui.stop_heart()
	
	# Run death as coroutine
	_run_death_anim()

func _run_death_anim() -> void:
	var pivot = $MeshPivot
	var start_pos = pivot.position
	print("Death anim start - pivot pos: ", start_pos, " rot: ", pivot.rotation)
	
	# Phase 1: Stagger back (0.7s)
	var t1 = create_tween()
	t1.tween_property(pivot, "rotation", Vector3(deg_to_rad(-12), 0, deg_to_rad(5)), 0.35)
	t1.tween_property(pivot, "rotation", Vector3(deg_to_rad(-5), 0, deg_to_rad(-3)), 0.35)
	await t1.finished
	print("Phase 1 done")
	
	# Phase 2: Knees buckle, drop + lean forward (0.6s)
	var t2 = create_tween().set_parallel(true)
	t2.tween_property(pivot, "position:y", start_pos.y - 0.5, 0.6).set_ease(Tween.EASE_IN)
	t2.tween_property(pivot, "rotation:x", deg_to_rad(30), 0.6).set_ease(Tween.EASE_IN)
	t2.tween_property(pivot, "rotation:z", deg_to_rad(6), 0.6)
	await t2.finished
	print("Phase 2 done")
	
	# Phase 3: Slam face-first into ground (0.4s)
	var t3 = create_tween().set_parallel(true)
	t3.tween_property(pivot, "rotation:x", deg_to_rad(90), 0.4).set_ease(Tween.EASE_IN).set_trans(Tween.TRANS_QUAD)
	t3.tween_property(pivot, "position:y", start_pos.y - 0.9, 0.4).set_ease(Tween.EASE_IN).set_trans(Tween.TRANS_QUAD)
	t3.tween_property(pivot, "rotation:z", deg_to_rad(2), 0.4)
	await t3.finished
	print("Phase 3 done - character should be on ground")

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
