extends Node3D

func _ready() -> void:
	var anim_player: AnimationPlayer = _find_animation_player(self)
	if anim_player and anim_player.get_animation_list().size() > 0:
		var anims = anim_player.get_animation_list()
		var anim = anims[0]
		var animation = anim_player.get_animation(anim)
		animation.loop_mode = Animation.LOOP_LINEAR
		anim_player.play(anim)
		# Anchor model
		position = Vector3.ZERO
		if has_node("HeartModel"):
			var model = get_node("HeartModel") as Node3D
			model.position = Vector3.ZERO
	else:
		print("Heart3D: No AnimationPlayer/animations found")

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
