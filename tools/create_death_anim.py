import bpy
import math
import os

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
for block in bpy.data.actions:
    bpy.data.actions.remove(block)

model_path = "/home/nem0nxt/tt/athena-saga/assets/models/Meshy_AI_biped/Meshy_AI_Character_output.glb"
bpy.ops.import_scene.gltf(filepath=model_path)

armature = None
for obj in bpy.data.objects:
    if obj.type == 'ARMATURE':
        armature = obj
        break

if not armature:
    print("ERROR: No armature found!")
    raise SystemExit(1)

bpy.context.view_layer.objects.active = armature
armature.select_set(True)
bpy.ops.object.mode_set(mode='POSE')

fps = 24
total_frames = 72  # 3 seconds at 24fps
bpy.context.scene.frame_start = 0
bpy.context.scene.frame_end = total_frames
bpy.context.scene.render.fps = fps

action = bpy.data.actions.new(name="Death")
if armature.animation_data is None:
    armature.animation_data_create()
armature.animation_data.action = action

bone_map = {}
for pb in armature.pose.bones:
    bone_map[pb.name] = pb


def set_key(bone_name, frame, loc=None, rot=None):
    """Set keyframe for a bone. rot is (x, y, z) in degrees, converted to quaternion."""
    if bone_name not in bone_map:
        return
    pb = bone_map[bone_name]
    bpy.context.scene.frame_set(frame)

    if loc is not None:
        pb.location = loc
        pb.keyframe_insert(data_path="location", frame=frame)

    if rot is not None:
        from mathutils import Euler, Quaternion
        euler = Euler((math.radians(rot[0]), math.radians(rot[1]), math.radians(rot[2])), 'XYZ')
        pb.rotation_quaternion = euler.to_quaternion()
        pb.keyframe_insert(data_path="rotation_quaternion", frame=frame)


# Frame 0: Standing pose (neutral)
for bone_name in bone_map:
    pb = bone_map[bone_name]
    pb.location = (0, 0, 0)
    pb.rotation_quaternion = (1, 0, 0, 0)
    pb.keyframe_insert(data_path="location", frame=0)
    pb.keyframe_insert(data_path="rotation_quaternion", frame=0)

# Phase 1 (frames 0-18): Clutch chest, stagger back
# Hips drop slightly and lean back
set_key("Hips", 6, rot=(-3, 0, 0))
set_key("Hips", 12, loc=(0, 0, -2), rot=(-5, 2, 0))
set_key("Hips", 18, loc=(0, 0, -5), rot=(-8, -3, 0))

# Spine curls forward as if in pain
set_key("Spine", 6, rot=(5, 0, 0))
set_key("Spine", 12, rot=(10, 0, 2))
set_key("Spine", 18, rot=(15, 0, -2))

set_key("Spine01", 6, rot=(3, 0, 0))
set_key("Spine01", 12, rot=(8, 0, 0))
set_key("Spine01", 18, rot=(12, 0, 0))

set_key("Spine02", 6, rot=(2, 0, 0))
set_key("Spine02", 12, rot=(5, 0, 0))
set_key("Spine02", 18, rot=(8, 0, 0))

# Left arm clutches chest
set_key("LeftShoulder", 12, rot=(10, 0, 20))
set_key("LeftArm", 6, rot=(20, 0, -30))
set_key("LeftArm", 12, rot=(40, 20, -50))
set_key("LeftArm", 18, rot=(45, 25, -55))
set_key("LeftForeArm", 6, rot=(-30, 0, 0))
set_key("LeftForeArm", 12, rot=(-80, 0, 0))
set_key("LeftForeArm", 18, rot=(-90, 0, 0))

# Right arm reaches out then drops
set_key("RightShoulder", 12, rot=(5, 0, -10))
set_key("RightArm", 6, rot=(10, 0, 15))
set_key("RightArm", 12, rot=(25, -10, 30))
set_key("RightArm", 18, rot=(15, -5, 20))
set_key("RightForeArm", 6, rot=(-10, 0, 0))
set_key("RightForeArm", 12, rot=(-40, 0, 0))
set_key("RightForeArm", 18, rot=(-30, 0, 0))

# Head tilts back in pain
set_key("Head", 6, rot=(-8, 0, 0))
set_key("Head", 12, rot=(-15, 5, 0))
set_key("Head", 18, rot=(-10, -5, 5))

set_key("neck", 6, rot=(-5, 0, 0))
set_key("neck", 12, rot=(-10, 3, 0))
set_key("neck", 18, rot=(-5, -3, 3))

# Stagger legs
set_key("LeftUpLeg", 12, rot=(5, 0, -3))
set_key("LeftLeg", 12, rot=(-8, 0, 0))
set_key("RightUpLeg", 12, rot=(-3, 0, 3))
set_key("RightLeg", 12, rot=(-5, 0, 0))

# Phase 2 (frames 18-36): Knees buckle, start to fall
set_key("Hips", 24, loc=(0, 0, -15), rot=(-5, 0, 3))
set_key("Hips", 30, loc=(0, 0, -30), rot=(5, 0, 5))
set_key("Hips", 36, loc=(0, 0, -45), rot=(15, 0, 3))

# Knees bend as character collapses
set_key("LeftUpLeg", 24, rot=(25, 0, -5))
set_key("LeftUpLeg", 30, rot=(50, 0, -5))
set_key("LeftUpLeg", 36, rot=(70, 0, -3))
set_key("LeftLeg", 24, rot=(-30, 0, 0))
set_key("LeftLeg", 30, rot=(-70, 0, 0))
set_key("LeftLeg", 36, rot=(-100, 0, 0))

set_key("RightUpLeg", 24, rot=(20, 0, 5))
set_key("RightUpLeg", 30, rot=(45, 0, 5))
set_key("RightUpLeg", 36, rot=(65, 0, 3))
set_key("RightLeg", 24, rot=(-25, 0, 0))
set_key("RightLeg", 30, rot=(-65, 0, 0))
set_key("RightLeg", 36, rot=(-95, 0, 0))

# Spine continues to curl
set_key("Spine", 24, rot=(20, 0, 0))
set_key("Spine", 30, rot=(30, 2, 0))
set_key("Spine", 36, rot=(35, 3, 0))

set_key("Spine01", 24, rot=(15, 0, 0))
set_key("Spine01", 30, rot=(20, 0, 0))
set_key("Spine01", 36, rot=(25, 0, 0))

set_key("Spine02", 24, rot=(10, 0, 0))
set_key("Spine02", 30, rot=(12, 0, 0))
set_key("Spine02", 36, rot=(15, 0, 0))

# Arms go limp
set_key("LeftArm", 24, rot=(30, 15, -40))
set_key("LeftArm", 30, rot=(15, 5, -20))
set_key("LeftArm", 36, rot=(5, 0, -10))
set_key("LeftForeArm", 24, rot=(-70, 0, 0))
set_key("LeftForeArm", 30, rot=(-40, 0, 0))
set_key("LeftForeArm", 36, rot=(-20, 0, 0))

set_key("RightArm", 24, rot=(10, -3, 15))
set_key("RightArm", 30, rot=(5, 0, 10))
set_key("RightArm", 36, rot=(0, 0, 5))
set_key("RightForeArm", 24, rot=(-20, 0, 0))
set_key("RightForeArm", 30, rot=(-10, 0, 0))
set_key("RightForeArm", 36, rot=(-5, 0, 0))

# Head drops forward
set_key("Head", 24, rot=(5, 0, 3))
set_key("Head", 30, rot=(15, 0, 5))
set_key("Head", 36, rot=(25, -3, 5))

set_key("neck", 24, rot=(5, 0, 2))
set_key("neck", 30, rot=(10, 0, 3))
set_key("neck", 36, rot=(15, -2, 3))

# Phase 3 (frames 36-54): Fall forward to the ground
set_key("Hips", 42, loc=(0, 5, -55), rot=(30, 0, 5))
set_key("Hips", 48, loc=(0, 12, -60), rot=(55, 0, 3))
set_key("Hips", 54, loc=(0, 18, -63), rot=(75, 0, 2))

# Legs straighten out behind
set_key("LeftUpLeg", 42, rot=(50, 0, -3))
set_key("LeftUpLeg", 48, rot=(30, 0, -2))
set_key("LeftUpLeg", 54, rot=(10, 0, -2))
set_key("LeftLeg", 42, rot=(-60, 0, 0))
set_key("LeftLeg", 48, rot=(-30, 0, 0))
set_key("LeftLeg", 54, rot=(-10, 0, 0))

set_key("RightUpLeg", 42, rot=(45, 0, 3))
set_key("RightUpLeg", 48, rot=(25, 0, 2))
set_key("RightUpLeg", 54, rot=(8, 0, 2))
set_key("RightLeg", 42, rot=(-55, 0, 0))
set_key("RightLeg", 48, rot=(-25, 0, 0))
set_key("RightLeg", 54, rot=(-8, 0, 0))

# Spine keeps curling as they fall face down
set_key("Spine", 42, rot=(25, 2, 0))
set_key("Spine", 48, rot=(15, 0, 0))
set_key("Spine", 54, rot=(5, 0, 0))

set_key("Spine01", 42, rot=(15, 0, 0))
set_key("Spine01", 48, rot=(8, 0, 0))
set_key("Spine01", 54, rot=(3, 0, 0))

# Arms splay out
set_key("LeftArm", 42, rot=(0, 0, -40))
set_key("LeftArm", 48, rot=(-10, 0, -60))
set_key("LeftArm", 54, rot=(-15, 0, -70))
set_key("LeftForeArm", 42, rot=(-15, 0, 0))
set_key("LeftForeArm", 48, rot=(-10, 0, 0))
set_key("LeftForeArm", 54, rot=(-5, 0, 0))

set_key("RightArm", 42, rot=(0, 0, 40))
set_key("RightArm", 48, rot=(-10, 0, 60))
set_key("RightArm", 54, rot=(-15, 0, 70))
set_key("RightForeArm", 42, rot=(-15, 0, 0))
set_key("RightForeArm", 48, rot=(-10, 0, 0))
set_key("RightForeArm", 54, rot=(-5, 0, 0))

# Head rests
set_key("Head", 42, rot=(20, -2, 5))
set_key("Head", 48, rot=(10, 0, 3))
set_key("Head", 54, rot=(5, 0, 0))

set_key("neck", 42, rot=(10, 0, 2))
set_key("neck", 48, rot=(5, 0, 0))
set_key("neck", 54, rot=(3, 0, 0))

# Phase 4 (frames 54-72): Settle into final resting pose
set_key("Hips", 60, loc=(0, 20, -64), rot=(82, 0, 1))
set_key("Hips", 72, loc=(0, 22, -65), rot=(85, 0, 0))

set_key("LeftUpLeg", 60, rot=(5, 0, -3))
set_key("LeftUpLeg", 72, rot=(3, 0, -5))
set_key("LeftLeg", 60, rot=(-5, 0, 0))
set_key("LeftLeg", 72, rot=(-3, 0, 0))

set_key("RightUpLeg", 60, rot=(3, 0, 3))
set_key("RightUpLeg", 72, rot=(2, 0, 5))
set_key("RightLeg", 60, rot=(-3, 0, 0))
set_key("RightLeg", 72, rot=(-2, 0, 0))

set_key("Spine", 60, rot=(3, 0, 0))
set_key("Spine", 72, rot=(2, 0, 0))
set_key("Spine01", 60, rot=(2, 0, 0))
set_key("Spine01", 72, rot=(1, 0, 0))
set_key("Spine02", 60, rot=(2, 0, 0))
set_key("Spine02", 72, rot=(1, 0, 0))

set_key("LeftArm", 60, rot=(-18, 0, -75))
set_key("LeftArm", 72, rot=(-20, 0, -80))
set_key("LeftForeArm", 60, rot=(-3, 0, 0))
set_key("LeftForeArm", 72, rot=(-2, 0, 0))

set_key("RightArm", 60, rot=(-18, 0, 75))
set_key("RightArm", 72, rot=(-20, 0, 80))
set_key("RightForeArm", 60, rot=(-3, 0, 0))
set_key("RightForeArm", 72, rot=(-2, 0, 0))

set_key("Head", 60, rot=(3, 0, -5))
set_key("Head", 72, rot=(2, 0, -8))
set_key("neck", 60, rot=(2, 0, -3))
set_key("neck", 72, rot=(1, 0, -5))

# Feet relax
set_key("LeftFoot", 36, rot=(-10, 0, 0))
set_key("LeftFoot", 54, rot=(5, 0, -5))
set_key("LeftFoot", 72, rot=(10, 0, -8))

set_key("RightFoot", 36, rot=(-8, 0, 0))
set_key("RightFoot", 54, rot=(5, 0, 5))
set_key("RightFoot", 72, rot=(10, 0, 8))

bpy.ops.object.mode_set(mode='OBJECT')

# Remove the original base pose action so only Death remains
for act in list(bpy.data.actions):
    if act.name != "Death":
        bpy.data.actions.remove(act)

# Make sure Death action is assigned
armature.animation_data.action = bpy.data.actions["Death"]

# Set the animation to NOT loop (important for death)
action.use_frame_range = True
action.frame_start = 0
action.frame_end = total_frames

# Export
output_path = "/home/nem0nxt/tt/athena-saga/assets/models/Meshy_AI_biped/Meshy_AI_Animation_Death.glb"

bpy.ops.export_scene.gltf(
    filepath=output_path,
    export_format='GLB',
    export_apply=True,
    export_materials='EXPORT',
    export_animations=True,
    export_skins=True,
)

print(f"Exported death animation to: {output_path}")
