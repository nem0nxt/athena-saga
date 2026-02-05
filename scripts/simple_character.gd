extends Node3D
# Simple humanoid character

static func create_simple_athena() -> Node3D:
	var character = Node3D.new()
	character.name = "SimpleAthena"
	
	# === HEAD ===
	var head = MeshInstance3D.new()
	var head_mesh = SphereMesh.new()
	head_mesh.radius = 0.15
	head_mesh.height = 0.3
	head.mesh = head_mesh
	head.position = Vector3(0, 1.65, 0)
	
	var skin_mat = StandardMaterial3D.new()
	skin_mat.albedo_color = Color(1.0, 0.85, 0.7) # Skin
	head.material_override = skin_mat
	character.add_child(head)
	
	# === HAIR (simple block) ===
	var hair = MeshInstance3D.new()
	var hair_mesh = BoxMesh.new()
	hair_mesh.size = Vector3(0.35, 0.25, 0.3)
	hair.mesh = hair_mesh
	hair.position = Vector3(0, 1.7, -0.05)
	
	var hair_mat = StandardMaterial3D.new()
	hair_mat.albedo_color = Color(0.95, 0.85, 0.45) # Blonde
	hair.material_override = hair_mat
	character.add_child(hair)
	
	# === TORSO ===
	var torso = MeshInstance3D.new()
	var torso_mesh = BoxMesh.new()
	torso_mesh.size = Vector3(0.35, 0.5, 0.2)
	torso.mesh = torso_mesh
	torso.position = Vector3(0, 1.25, 0)
	
	var armor_mat = StandardMaterial3D.new()
	armor_mat.albedo_color = Color(0.8, 0.6, 0.3) # Bronze armor
	armor_mat.metallic = 0.5
	torso.material_override = armor_mat
	character.add_child(torso)
	
	# === ARMS ===
	# Left arm
	var left_arm = MeshInstance3D.new()
	var arm_mesh = BoxMesh.new()
	arm_mesh.size = Vector3(0.1, 0.4, 0.1)
	left_arm.mesh = arm_mesh
	left_arm.position = Vector3(-0.25, 1.15, 0)
	left_arm.rotation.z = deg_to_rad(15)
	left_arm.material_override = skin_mat
	character.add_child(left_arm)
	
	# Right arm
	var right_arm = MeshInstance3D.new()
	right_arm.mesh = arm_mesh
	right_arm.position = Vector3(0.25, 1.15, 0)
	right_arm.rotation.z = deg_to_rad(-15)
	right_arm.material_override = skin_mat
	character.add_child(right_arm)
	
	# === LEGS ===
	# Left leg
	var left_leg = MeshInstance3D.new()
	var leg_mesh = BoxMesh.new()
	leg_mesh.size = Vector3(0.12, 0.6, 0.12)
	left_leg.mesh = leg_mesh
	left_leg.position = Vector3(-0.1, 0.7, 0)
	left_leg.material_override = skin_mat
	character.add_child(left_leg)
	
	# Right leg
	var right_leg = MeshInstance3D.new()
	right_leg.mesh = leg_mesh
	right_leg.position = Vector3(0.1, 0.7, 0)
	right_leg.material_override = skin_mat
	character.add_child(right_leg)
	
	# === SKIRT (simple) ===
	var skirt = MeshInstance3D.new()
	var skirt_mesh = CylinderMesh.new()
	skirt_mesh.height = 0.25
	skirt_mesh.top_radius = 0.18
	skirt_mesh.bottom_radius = 0.22
	skirt.mesh = skirt_mesh
	skirt.position = Vector3(0, 0.9, 0)
	
	var skirt_mat = StandardMaterial3D.new()
	skirt_mat.albedo_color = Color(0.2, 0.3, 0.7) # Blue
	skirt.material_override = skirt_mat
	character.add_child(skirt)
	
	# === SWORD (simple stick) ===
	var sword = MeshInstance3D.new()
	var sword_mesh = BoxMesh.new()
	sword_mesh.size = Vector3(0.05, 0.6, 0.02)
	sword.mesh = sword_mesh
	sword.position = Vector3(0.3, 1.0, 0)
	sword.rotation.z = deg_to_rad(-30)
	
	var metal_mat = StandardMaterial3D.new()
	metal_mat.albedo_color = Color(0.8, 0.8, 0.8)
	metal_mat.metallic = 0.8
	sword.material_override = metal_mat
	character.add_child(sword)
	
	return character