extends Node3D
# Quick character creator for testing

static func create_athena_placeholder() -> Node3D:
	var character = Node3D.new()
	character.name = "AthenaPlaceholder"
	
	# === BODY ===
	var body = MeshInstance3D.new()
	var body_mesh = CapsuleMesh.new()
	body_mesh.height = 1.2
	body_mesh.radius = 0.25
	body.mesh = body_mesh
	body.position.y = 0.8
	
	var body_mat = StandardMaterial3D.new()
	body_mat.albedo_color = Color(0.85, 0.7, 0.5) # Skin tone
	body.material_override = body_mat
	character.add_child(body)
	
	# === ARMOR (Chest) ===
	var armor = MeshInstance3D.new()
	var armor_mesh = BoxMesh.new()
	armor_mesh.size = Vector3(0.6, 0.5, 0.35)
	armor.mesh = armor_mesh
	armor.position.y = 0.9
	
	var armor_mat = StandardMaterial3D.new()
	armor_mat.albedo_color = Color(0.8, 0.6, 0.2) # Bronze
	armor_mat.metallic = 0.6
	armor_mat.roughness = 0.4
	armor.material_override = armor_mat
	character.add_child(armor)
	
	# === SKIRT ===
	var skirt = MeshInstance3D.new()
	var skirt_mesh = CylinderMesh.new()
	skirt_mesh.height = 0.4
	skirt_mesh.top_radius = 0.3
	skirt_mesh.bottom_radius = 0.45
	skirt.mesh = skirt_mesh
	skirt.position.y = 0.4
	
	var skirt_mat = StandardMaterial3D.new()
	skirt_mat.albedo_color = Color(0.2, 0.3, 0.6) # Blue
	skirt.material_override = skirt_mat
	character.add_child(skirt)
	
	# === HEAD ===
	var head = MeshInstance3D.new()
	var head_mesh = SphereMesh.new()
	head_mesh.radial_segments = 16
	head_mesh.rings = 8
	head_mesh.radius = 0.18
	head.mesh = head_mesh
	head.position.y = 1.6
	head.material_override = body_mat
	character.add_child(head)
	
	# === HAIR ===
	var hair = MeshInstance3D.new()
	var hair_mesh = SphereMesh.new()
	hair_mesh.radius = 0.22
	hair.mesh = hair_mesh
	hair.position = Vector3(0, 1.65, -0.05)
	hair.scale = Vector3(1, 1, 1.3)
	
	var hair_mat = StandardMaterial3D.new()
	hair_mat.albedo_color = Color(0.9, 0.8, 0.4) # Blonde
	hair.material_override = hair_mat
	character.add_child(hair)
	
	# === HELMET (Optional Tiara) ===
	var tiara = MeshInstance3D.new()
	var tiara_mesh = TorusMesh.new()
	tiara_mesh.inner_radius = 0.16
	tiara_mesh.outer_radius = 0.2
	tiara.mesh = tiara_mesh
	tiara.position.y = 1.7
	tiara.rotation.x = PI/2
	
	var tiara_mat = StandardMaterial3D.new()
	tiara_mat.albedo_color = Color(1, 0.8, 0.3) # Gold
	tiara_mat.metallic = 0.8
	tiara_mat.roughness = 0.2
	tiara.material_override = tiara_mat
	character.add_child(tiara)
	
	# === SHIELD (Left Hand) ===
	var shield = MeshInstance3D.new()
	var shield_mesh = CylinderMesh.new()
	shield_mesh.height = 0.05
	shield_mesh.top_radius = 0.3
	shield_mesh.bottom_radius = 0.3
	shield.mesh = shield_mesh
	shield.position = Vector3(-0.4, 1.0, 0)
	shield.rotation = Vector3(0, PI/2, PI/2)
	shield.material_override = armor_mat
	character.add_child(shield)
	
	# === SWORD (Right Hand) ===
	var sword = MeshInstance3D.new()
	var sword_mesh = BoxMesh.new()
	sword_mesh.size = Vector3(0.05, 0.8, 0.15)
	sword.mesh = sword_mesh
	sword.position = Vector3(0.4, 1.0, 0)
	sword.rotation.z = -PI/4
	
	var sword_mat = StandardMaterial3D.new()
	sword_mat.albedo_color = Color(0.8, 0.8, 0.9) # Steel
	sword_mat.metallic = 0.9
	sword_mat.roughness = 0.1
	sword.material_override = sword_mat
	character.add_child(sword)
	
	return character

static func create_skeleton_enemy() -> Node3D:
	var skeleton = Node3D.new()
	skeleton.name = "SkeletonEnemy"
	
	# === BONES ===
	var bones = MeshInstance3D.new()
	var bones_mesh = CapsuleMesh.new()
	bones_mesh.height = 1.6
	bones_mesh.radius = 0.2
	bones.mesh = bones_mesh
	bones.position.y = 0.9
	
	var bones_mat = StandardMaterial3D.new()
	bones_mat.albedo_color = Color(0.9, 0.9, 0.8) # Bone white
	bones.material_override = bones_mat
	skeleton.add_child(bones)
	
	# === SKULL ===
	var skull = MeshInstance3D.new()
	var skull_mesh = SphereMesh.new()
	skull_mesh.radius = 0.2
	skull.mesh = skull_mesh
	skull.position.y = 1.8
	skull.material_override = bones_mat
	skeleton.add_child(skull)
	
	# === GLOWING EYES ===
	var eyes = MeshInstance3D.new()
	var eyes_mesh = SphereMesh.new()
	eyes_mesh.radius = 0.05
	eyes.mesh = eyes_mesh
	eyes.position = Vector3(0, 1.8, 0.15)
	
	var eyes_mat = StandardMaterial3D.new()
	eyes_mat.albedo_color = Color(1, 0, 0) # Red
	eyes_mat.emission_enabled = true
	eyes_mat.emission = Color(1, 0, 0)
	eyes_mat.emission_energy = 2.0
	eyes.material_override = eyes_mat
	skeleton.add_child(eyes)
	
	return skeleton