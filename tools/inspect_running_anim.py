import bpy

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

model_path = "/home/nem0nxt/tt/athena-saga/assets/models/Meshy_AI_biped/Meshy_AI_Animation_Running_withSkin.glb"
bpy.ops.import_scene.gltf(filepath=model_path)

for obj in bpy.data.objects:
    print(f"Object: {obj.name}, Type: {obj.type}")
    if obj.type == 'ARMATURE':
        if obj.animation_data and obj.animation_data.action:
            act = obj.animation_data.action
            print(f"  Action: {act.name}, frame range: {act.frame_range}")
            for fc in act.fcurves if hasattr(act, 'fcurves') else []:
                kf_values = [kp.co[1] for kp in fc.keyframe_points]
                print(f"    {fc.data_path}[{fc.array_index}]: {len(fc.keyframe_points)} keys, range: {min(kf_values):.4f} to {max(kf_values):.4f}")

# Also check death
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

model_path2 = "/home/nem0nxt/tt/athena-saga/assets/models/Meshy_AI_biped/Meshy_AI_Animation_Death.glb"
bpy.ops.import_scene.gltf(filepath=model_path2)

print("\n--- DEATH ANIMATION ---")
for obj in bpy.data.objects:
    print(f"Object: {obj.name}, Type: {obj.type}")
    if obj.type == 'ARMATURE':
        if obj.animation_data and obj.animation_data.action:
            act = obj.animation_data.action
            print(f"  Action: {act.name}, frame range: {act.frame_range}")
            for fc in act.fcurves if hasattr(act, 'fcurves') else []:
                kf_values = [kp.co[1] for kp in fc.keyframe_points]
                print(f"    {fc.data_path}[{fc.array_index}]: {len(fc.keyframe_points)} keys, range: {min(kf_values):.4f} to {max(kf_values):.4f}")
        else:
            print("  NO animation data or action!")
