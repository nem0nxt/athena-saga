import bpy
import sys
import json

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

model_path = "/home/nem0nxt/tt/athena-saga/assets/models/Meshy_AI_biped/Meshy_AI_Character_output.glb"
bpy.ops.import_scene.gltf(filepath=model_path)

for obj in bpy.data.objects:
    print(f"Object: {obj.name}, Type: {obj.type}")
    if obj.type == 'ARMATURE':
        print(f"  Armature: {obj.data.name}")
        for bone in obj.data.bones:
            parent_name = bone.parent.name if bone.parent else "None"
            print(f"  Bone: {bone.name}, Parent: {parent_name}, Head: {bone.head_local}, Tail: {bone.tail_local}")

for anim in bpy.data.actions:
    print(f"\nAction: {anim.name}")
    print(f"  Frame range: {anim.frame_range}")
    for fc in anim.fcurves:
        print(f"  FCurve: {fc.data_path} [{fc.array_index}]")
