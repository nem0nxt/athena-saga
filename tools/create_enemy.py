import bpy
import bmesh
import math
import os
from mathutils import Vector

# Clear scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Remove orphan data
for block in bpy.data.meshes:
    if block.users == 0:
        bpy.data.meshes.remove(block)
for block in bpy.data.materials:
    if block.users == 0:
        bpy.data.materials.remove(block)

# --- Materials ---
def make_mat(name, base_color, roughness=0.8, metallic=0.0, emission_color=None, emission_strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = base_color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission_color:
        bsdf.inputs["Emission Color"].default_value = emission_color
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat

mat_body = make_mat("EnemyBody", (0.15, 0.22, 0.12, 1.0), roughness=0.9)
mat_belly = make_mat("EnemyBelly", (0.25, 0.18, 0.12, 1.0), roughness=0.85)
mat_eyes = make_mat("EnemyEyes", (0.9, 0.1, 0.05, 1.0), roughness=0.3, emission_color=(1.0, 0.15, 0.05, 1.0), emission_strength=3.0)
mat_horns = make_mat("EnemyHorns", (0.35, 0.28, 0.18, 1.0), roughness=0.6, metallic=0.1)
mat_claws = make_mat("EnemyClaws", (0.2, 0.15, 0.1, 1.0), roughness=0.5, metallic=0.2)
mat_teeth = make_mat("EnemyTeeth", (0.85, 0.82, 0.7, 1.0), roughness=0.4)

# --- Body (torso) ---
bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=0.55, location=(0, 0, 1.0))
body = bpy.context.active_object
body.name = "Body"
body.scale = (1.0, 0.85, 1.1)
bpy.ops.object.shade_smooth()
body.data.materials.append(mat_body)

# Sculpt-like deformation on body for muscular look
bm = bmesh.new()
bm.from_mesh(body.data)
for v in bm.verts:
    if v.co.z > 0.3:
        v.co.x *= 1.15
        v.co.y *= 1.1
    if v.co.z < -0.2:
        v.co.x *= 0.85
bm.to_mesh(body.data)
bm.free()

# --- Belly ---
bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=0.38, location=(0, -0.12, 0.85))
belly = bpy.context.active_object
belly.name = "Belly"
belly.scale = (0.9, 0.75, 0.85)
bpy.ops.object.shade_smooth()
belly.data.materials.append(mat_belly)

# --- Head ---
bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=14, radius=0.32, location=(0, 0, 1.7))
head = bpy.context.active_object
head.name = "Head"
head.scale = (1.1, 1.0, 0.95)
bpy.ops.object.shade_smooth()
head.data.materials.append(mat_body)

# Deform head for menacing look
bm = bmesh.new()
bm.from_mesh(head.data)
for v in bm.verts:
    # Wider jaw area
    if v.co.z < 0.0:
        v.co.x *= 1.2
        v.co.z *= 1.1
    # Pronounced brow
    if v.co.z > 0.15 and v.co.y < -0.1:
        v.co.y -= 0.06
        v.co.z += 0.04
bm.to_mesh(head.data)
bm.free()

# --- Eyes (glowing red) ---
for side in [-1, 1]:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.06, location=(side * 0.13, -0.26, 1.75))
    eye = bpy.context.active_object
    eye.name = f"Eye_{'L' if side == -1 else 'R'}"
    eye.scale = (1.3, 0.7, 0.9)
    bpy.ops.object.shade_smooth()
    eye.data.materials.append(mat_eyes)

# --- Horns ---
for side in [-1, 1]:
    bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=0.07, radius2=0.01, depth=0.4, location=(side * 0.2, -0.05, 2.0))
    horn = bpy.context.active_object
    horn.name = f"Horn_{'L' if side == -1 else 'R'}"
    horn.rotation_euler = (math.radians(-30), math.radians(side * 25), 0)
    bpy.ops.object.shade_smooth()
    horn.data.materials.append(mat_horns)

# --- Mouth / Jaw ---
bpy.ops.mesh.primitive_cube_add(size=0.2, location=(0, -0.28, 1.6))
jaw = bpy.context.active_object
jaw.name = "Jaw"
jaw.scale = (1.4, 0.5, 0.4)
bpy.ops.object.shade_smooth()
jaw.data.materials.append(mat_body)

# Teeth
for i in range(5):
    x_pos = -0.1 + i * 0.05
    bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.015, radius2=0.003, depth=0.05, location=(x_pos, -0.32, 1.56))
    tooth = bpy.context.active_object
    tooth.name = f"Tooth_{i}"
    tooth.rotation_euler = (math.radians(180), 0, 0)
    bpy.ops.object.shade_smooth()
    tooth.data.materials.append(mat_teeth)

# --- Arms ---
for side in [-1, 1]:
    # Upper arm
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.12, depth=0.5, location=(side * 0.65, 0, 1.2))
    upper_arm = bpy.context.active_object
    upper_arm.name = f"UpperArm_{'L' if side == -1 else 'R'}"
    upper_arm.rotation_euler = (0, 0, math.radians(side * 25))
    upper_arm.scale = (1.0, 0.9, 1.0)
    bpy.ops.object.shade_smooth()
    upper_arm.data.materials.append(mat_body)
    
    # Forearm
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.1, depth=0.45, location=(side * 0.85, 0, 0.78))
    forearm = bpy.context.active_object
    forearm.name = f"Forearm_{'L' if side == -1 else 'R'}"
    forearm.rotation_euler = (0, 0, math.radians(side * 10))
    bpy.ops.object.shade_smooth()
    forearm.data.materials.append(mat_body)
    
    # Shoulder pad (bony protrusion)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=8, radius=0.14, location=(side * 0.55, 0, 1.4))
    shoulder = bpy.context.active_object
    shoulder.name = f"Shoulder_{'L' if side == -1 else 'R'}"
    shoulder.scale = (1.2, 0.9, 0.8)
    bpy.ops.object.shade_smooth()
    shoulder.data.materials.append(mat_body)
    
    # Claws (3 per hand)
    for claw_i in range(3):
        angle = math.radians(-20 + claw_i * 20)
        cx = side * 0.9 + math.sin(angle) * 0.06 * side
        cz = 0.5 + claw_i * 0.02
        bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.025, radius2=0.005, depth=0.12, location=(cx, -0.04, cz))
        claw = bpy.context.active_object
        claw.name = f"Claw_{'L' if side == -1 else 'R'}_{claw_i}"
        claw.rotation_euler = (math.radians(70), 0, math.radians(side * 10))
        bpy.ops.object.shade_smooth()
        claw.data.materials.append(mat_claws)

# --- Legs ---
for side in [-1, 1]:
    # Thigh
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.14, depth=0.45, location=(side * 0.25, 0, 0.45))
    thigh = bpy.context.active_object
    thigh.name = f"Thigh_{'L' if side == -1 else 'R'}"
    thigh.scale = (1.1, 0.95, 1.0)
    bpy.ops.object.shade_smooth()
    thigh.data.materials.append(mat_body)
    
    # Shin
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.1, depth=0.4, location=(side * 0.25, 0.02, 0.1))
    shin = bpy.context.active_object
    shin.name = f"Shin_{'L' if side == -1 else 'R'}"
    bpy.ops.object.shade_smooth()
    shin.data.materials.append(mat_body)
    
    # Foot
    bpy.ops.mesh.primitive_cube_add(size=0.15, location=(side * 0.25, -0.08, -0.08))
    foot = bpy.context.active_object
    foot.name = f"Foot_{'L' if side == -1 else 'R'}"
    foot.scale = (1.0, 1.8, 0.5)
    bpy.ops.object.shade_smooth()
    foot.data.materials.append(mat_body)
    
    # Toe claws
    for tc in range(2):
        bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.02, radius2=0.005, depth=0.08, location=(side * 0.25 + (tc - 0.5) * 0.06, -0.2, -0.1))
        toe_claw = bpy.context.active_object
        toe_claw.name = f"ToeClaw_{'L' if side == -1 else 'R'}_{tc}"
        toe_claw.rotation_euler = (math.radians(80), 0, 0)
        bpy.ops.object.shade_smooth()
        toe_claw.data.materials.append(mat_claws)

# --- Tail ---
segments = 8
for i in range(segments):
    t = i / (segments - 1)
    radius = 0.08 * (1.0 - t * 0.7)
    z = 0.7 - i * 0.05
    y = 0.15 + i * 0.12
    bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=6, radius=radius, location=(0, y, z))
    seg = bpy.context.active_object
    seg.name = f"Tail_{i}"
    seg.scale = (0.8, 1.2, 0.8)
    bpy.ops.object.shade_smooth()
    seg.data.materials.append(mat_body)

# Tail spike
bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.04, radius2=0.005, depth=0.15, location=(0, 0.15 + segments * 0.12, 0.7 - segments * 0.05))
tail_spike = bpy.context.active_object
tail_spike.name = "TailSpike"
tail_spike.rotation_euler = (math.radians(75), 0, 0)
bpy.ops.object.shade_smooth()
tail_spike.data.materials.append(mat_claws)

# --- Spinal ridges ---
for i in range(6):
    z = 1.5 - i * 0.12
    bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.04, radius2=0.008, depth=0.12, location=(0, 0.18, z))
    spine = bpy.context.active_object
    spine.name = f"Spine_{i}"
    spine.rotation_euler = (math.radians(-60), 0, 0)
    bpy.ops.object.shade_smooth()
    spine.data.materials.append(mat_horns)

# --- Join all into one object ---
bpy.ops.object.select_all(action='SELECT')
bpy.context.view_layer.objects.active = body
bpy.ops.object.join()

# Rename final object
enemy = bpy.context.active_object
enemy.name = "EnemyCreature"

# Set origin to base of model
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
# Move so feet are at Z=0
bbox = [enemy.matrix_world @ Vector(corner) for corner in enemy.bound_box]
min_z = min(v.z for v in bbox)
enemy.location.z -= min_z

# Apply transforms
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# --- Export ---
output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "models", "enemy_creature.glb")
os.makedirs(os.path.dirname(output_path), exist_ok=True)

bpy.ops.export_scene.gltf(
    filepath=output_path,
    export_format='GLB',
    use_selection=True,
    export_apply=True,
    export_materials='EXPORT',
)

print(f"Exported enemy creature to: {output_path}")
