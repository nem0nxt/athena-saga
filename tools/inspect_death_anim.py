import bpy

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

model_path = "/home/nem0nxt/tt/athena-saga/assets/models/Meshy_AI_biped/Meshy_AI_Animation_Death.glb"
bpy.ops.import_scene.gltf(filepath=model_path)

for obj in bpy.data.objects:
    print(f"Object: {obj.name}, Type: {obj.type}")
    if obj.type == 'ARMATURE':
        print(f"  Armature: {obj.data.name}")
        print(f"  Bone count: {len(obj.data.bones)}")
        if obj.animation_data:
            print(f"  Action: {obj.animation_data.action.name if obj.animation_data.action else 'None'}")

for anim in bpy.data.actions:
    print(f"\nAction: {anim.name}")
    print(f"  Frame range: {anim.frame_range}")
    print(f"  FCurve count: {len(anim.fcurves) if hasattr(anim, 'fcurves') else 'N/A'}")

print(f"\nTotal actions: {len(bpy.data.actions)}")
print(f"Total objects: {len(bpy.data.objects)}")
