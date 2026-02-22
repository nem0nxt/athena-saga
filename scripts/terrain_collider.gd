extends StaticBody3D

func _ready() -> void:
	call_deferred("_create_collision")

func _create_collision() -> void:
	# Find the MeshInstance3D inside the imported terrain glb
	var mesh_instance = _find_mesh_instance(self)
	if mesh_instance and mesh_instance.mesh:
		mesh_instance.create_trimesh_collision()
		# The collision is created as a child of mesh_instance as a StaticBody3D
		# We need to reparent the collision shape to ourselves
		for child in mesh_instance.get_children():
			if child is StaticBody3D:
				for sub in child.get_children():
					if sub is CollisionShape3D:
						var shape = sub.shape
						var col = CollisionShape3D.new()
						col.shape = shape
						add_child(col)
				child.queue_free()
				break

func _find_mesh_instance(node: Node) -> MeshInstance3D:
	if node is MeshInstance3D:
		return node
	for child in node.get_children():
		var result = _find_mesh_instance(child)
		if result:
			return result
	return null
