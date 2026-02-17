extends Node3D

func _ready() -> void:
	var anim_player: AnimationPlayer = _find_animation_player(self)
	if anim_player and anim_player.get_animation_list().size() > 0:
		var anims = anim_player.get_animation_list()
		var anim = anims[0]
		var animation = anim_player.get_animation(anim)
		animation.loop_mode = Animation.LOOP_LINEAR
		# Ensure we lock the root transform during animation
		animation.loop_wrap = true
		anim_player.play(anim)
		# Freeze animation transform impact and keep model anchored
		position = Vector3(0, 0, 0)
		if has_node("HeartModel"):
			var model = get_node("HeartModel") as Node3D
			model.position = Vector3(0, 0, 0)
			model.scale = Vector3(0.12, 0.12, 0.12)
	else:
		print("Heart3D: No AnimationPlayer/animations found")

func _find_animation_player(node: Node) -> AnimationPlayer:
	if node is AnimationPlayer:
		return node
	for child in node.get_children():
		var result = _find_animation_player(child)
		if result:
			return result
	return null
