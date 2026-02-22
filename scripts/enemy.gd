extends CharacterBody3D

@export var move_speed: float = 3.0
@export var chase_speed: float = 5.0
@export var detection_range: float = 15.0
@export var attack_range: float = 2.0
@export var attack_damage: float = 10.0
@export var attack_cooldown: float = 1.5
@export var health: float = 80.0

var max_health: float = 80.0
var player: CharacterBody3D = null
var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")
var attack_timer: float = 0.0
var is_dead: bool = false

# Wander
var wander_target: Vector3 = Vector3.ZERO
var wander_timer: float = 0.0
const WANDER_INTERVAL: float = 3.0

enum State { IDLE, WANDER, CHASE, ATTACK, DEAD }
var current_state: State = State.IDLE

func _ready() -> void:
	add_to_group("enemies")
	call_deferred("_find_player")
	_pick_wander_target()

func _find_player() -> void:
	player = get_tree().get_first_node_in_group("player") as CharacterBody3D
	if not player:
		var players = get_tree().get_nodes_in_group("player")
		if players.size() > 0:
			player = players[0]

func _physics_process(delta: float) -> void:
	if is_dead:
		return
	
	if not is_on_floor():
		velocity.y -= gravity * delta
	
	attack_timer -= delta
	
	_update_state()
	_process_state(delta)
	
	move_and_slide()

func _update_state() -> void:
	if is_dead:
		current_state = State.DEAD
		return
	
	if not player:
		_find_player()
	
	if player:
		var dist = global_position.distance_to(player.global_position)
		if dist <= attack_range:
			current_state = State.ATTACK
		elif dist <= detection_range:
			current_state = State.CHASE
		else:
			current_state = State.WANDER
	else:
		current_state = State.WANDER

func _process_state(delta: float) -> void:
	match current_state:
		State.IDLE:
			velocity.x = lerp(velocity.x, 0.0, 8.0 * delta)
			velocity.z = lerp(velocity.z, 0.0, 8.0 * delta)
		
		State.WANDER:
			wander_timer += delta
			if wander_timer >= WANDER_INTERVAL:
				_pick_wander_target()
				wander_timer = 0.0
			
			var dir = (wander_target - global_position)
			dir.y = 0
			if dir.length() > 0.5:
				dir = dir.normalized()
				velocity.x = lerp(velocity.x, dir.x * move_speed, 5.0 * delta)
				velocity.z = lerp(velocity.z, dir.z * move_speed, 5.0 * delta)
				_face_direction(dir, delta)
			else:
				velocity.x = lerp(velocity.x, 0.0, 8.0 * delta)
				velocity.z = lerp(velocity.z, 0.0, 8.0 * delta)
		
		State.CHASE:
			var dir = (player.global_position - global_position)
			dir.y = 0
			dir = dir.normalized()
			velocity.x = lerp(velocity.x, dir.x * chase_speed, 5.0 * delta)
			velocity.z = lerp(velocity.z, dir.z * chase_speed, 5.0 * delta)
			_face_direction(dir, delta)
		
		State.ATTACK:
			velocity.x = lerp(velocity.x, 0.0, 10.0 * delta)
			velocity.z = lerp(velocity.z, 0.0, 10.0 * delta)
			
			if player:
				var dir = (player.global_position - global_position)
				dir.y = 0
				_face_direction(dir.normalized(), delta)
			
			if attack_timer <= 0.0:
				_do_attack()
				attack_timer = attack_cooldown
		
		State.DEAD:
			velocity.x = lerp(velocity.x, 0.0, 8.0 * delta)
			velocity.z = lerp(velocity.z, 0.0, 8.0 * delta)

func _face_direction(dir: Vector3, delta: float) -> void:
	if dir.length() < 0.001:
		return
	var target_angle = atan2(dir.x, dir.z)
	rotation.y = lerp_angle(rotation.y, target_angle, 8.0 * delta)

func _pick_wander_target() -> void:
	var offset = Vector3(randf_range(-8, 8), 0, randf_range(-8, 8))
	wander_target = global_position + offset

func _do_attack() -> void:
	if player and player.has_method("take_damage"):
		player.take_damage(attack_damage)

func take_damage(amount: float) -> void:
	if is_dead:
		return
	health -= amount
	if health <= 0:
		health = 0
		_die()

func _die() -> void:
	is_dead = true
	current_state = State.DEAD
	# Tilt over
	var tween = create_tween()
	tween.tween_property(self, "rotation:x", deg_to_rad(90), 0.5)
	tween.tween_callback(queue_free).set_delay(3.0)
