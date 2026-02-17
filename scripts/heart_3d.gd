extends Node3D

var anim_player: AnimationPlayer = null
var anim_name: String = ""

func _ready() -> void:
	anim_player = _find_animation_player(self)
	if anim_player and anim_player.get_animation_list().size() > 0:
		var anims = anim_player.get_animation_list()
		anim_name = anims[0]
		var animation = anim_player.get_animation(anim_name)
		animation.loop_mode = Animation.LOOP_LINEAR
		anim_player.play(anim_name)
		# Anchor model
		position = Vector3.ZERO
		if has_node("HeartModel"):
			var model = get_node("HeartModel") as Node3D
			model.position = Vector3.ZERO
	else:
		print("Heart3D: No AnimationPlayer/animations found")

func set_bpm(bpm: float) -> void:
	if not anim_player:
		return
	# Base BPM 60 => speed 1.0 (faster overall)
	var speed = clamp(bpm / 60.0, 0.6, 3.0)
	anim_player.speed_scale = speed

func _process(_delta: float) -> void:
	# Prevent root motion drift
	position = Vector3.ZERO
	if has_node("HeartModel"):
		(get_node("HeartModel") as Node3D).position = Vector3.ZERO

func _find_animation_player(node: Node) -> AnimationPlayer:
	if node is AnimationPlayer:
		return node
	for child in node.get_children():
		var result = _find_animation_player(child)
		if result:
			return result
	return null
