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

# Samantha Animation Mapping (match actual animation names)
const ANIM_IDLE = "combat_idle"
const ANIM_WALK = "combat_walk"
const ANIM_RUN = "combat_run"
const ANIM_STRAFE_LEFT = "Strafe_Left"
const ANIM_STRAFE_RIGHT = "Strafe_Right"
const ANIM_JUMP_START = "Jump_Start"
const ANIM_JUMP_LOOP = "Jump_Loop"
const ANIM_JUMP_END = "Jump_End"
const ANIM_ATTACK = "attack"
const ANIM_TAKE_DAMAGE = "Take_Damage"
const ANIM_DEATH = "Death"

# Chunk Manager integration
var chunk_manager = null
var last_chunk_reported: Vector2i = Vector2i(999999, 999999)

# Get the gravity from the project settings
var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")

func _ready() -> void:
	Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)
	setup_character_model()
	connect_to_chunk_manager()

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
	
	if Input.is_action_just_pressed("jump") and is_on_floor():
		velocity.y = JUMP_VELOCITY
	
	var input_dir := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var direction := (camera_pivot.global_transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
	direction.y = 0
	
	if direction:
		velocity.x = lerp(velocity.x, direction.x * SPEED, ACCELERATION * delta)
		velocity.z = lerp(velocity.z, direction.z * SPEED, ACCELERATION * delta)
		
		var target_angle := atan2(direction.x, direction.z)
		mesh.rotation.y = lerp_angle(mesh.rotation.y, target_angle, 10 * delta)
		
		if is_on_floor() and not is_attacking:
			if direction.length() > 0.5:
				var forward_dir = Vector3(0, 0, -1)
				var forward_dot = abs(direction.dot(forward_dir))
				if forward_dot > 0.7:
					play_animation(ANIM_RUN)
				else:
					if direction.x > 0:
						play_animation(ANIM_STRAFE_RIGHT)
					else:
						play_animation(ANIM_STRAFE_LEFT)
			else:
				play_animation(ANIM_IDLE)
	else:
		velocity.x = lerp(velocity.x, 0.0, FRICTION * delta)
		velocity.z = lerp(velocity.z, 0.0, FRICTION * delta)
	
	if not is_on_floor() and not is_attacking:
		if velocity.y > 0:
			play_animation(ANIM_JUMP_START)
		else:
			play_animation(ANIM_JUMP_LOOP)
	
	move_and_slide()
	report_position_to_chunk_manager()

func report_position_to_chunk_manager() -> void:
	if not chunk_manager:
		connect_to_chunk_manager()
		return
	
	var current_chunk = chunk_manager.get_chunk_coordinates(global_position)
	
	if current_chunk != last_chunk_reported:
		last_chunk_reported = current_chunk

func connect_to_chunk_manager() -> void:
	var chunk_manager_node = get_tree().get_first_node_in_group("chunk_manager")
	
	if chunk_manager_node:
		chunk_manager = chunk_manager_node
		add_to_group("player")
	elif ChunkManager.get_instance():
		chunk_manager = ChunkManager.get_instance()
		add_to_group("player")
	else:
		chunk_manager = get_node_or_null("../ChunkManager")
		if chunk_manager:
			add_to_group("player")

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
	if health <= 0:
		await get_tree().create_timer(0.5).timeout
		die()

func die() -> void:
	play_animation(ANIM_DEATH)

func play_animation(anim_name: String) -> void:
	if not animation_player:
		return
	
	if animation_player.has_animation(anim_name):
		if animation_player.current_animation != anim_name:
			animation_player.play(anim_name)

func setup_character_model() -> void:
	var default_body = $MeshPivot.get_child(0) if $MeshPivot.get_child_count() > 0 else null
	if default_body:
		default_body.visible = false
	
	var samantha_scene = preload("res://scenes/SamanthaCharacter.tscn")
	var samantha = samantha_scene.instantiate()
	$MeshPivot.add_child(samantha)
	
	animation_player = _find_animation_player(samantha)

func _find_animation_player(node: Node) -> AnimationPlayer:
	if node is AnimationPlayer:
		return node
	
	for child in node.get_children():
		var result = _find_animation_player(child)
		if result:
			return result
	
	return null
