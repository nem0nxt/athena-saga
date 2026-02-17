extends Node3D

func _ready() -> void:
	var anim_player: AnimationPlayer = _find_animation_player(self)
	if anim_player and anim_player.get_animation_list().size() > 0:
		var anims = anim_player.get_animation_list()
		var anim = anims[0]
		anim_player.play(anim)
		anim_player.get_animation(anim).loop_mode = Animation.LOOP_LINEAR
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
