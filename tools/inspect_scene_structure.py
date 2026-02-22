import bpy

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

model_path = "/home/nem0nxt/tt/athena-saga/assets/models/Meshy_AI_biped/Meshy_AI_Animation_Long_Breathe_and_Look_Around_withSkin.glb"
bpy.ops.import_scene.gltf(filepath=model_path)

def print_hierarchy(obj, indent=0):
    print("  " * indent + f"{obj.name} [{obj.type}]")
    for child in obj.children:
        print_hierarchy(child, indent + 1)

for obj in bpy.context.scene.objects:
    if obj.parent is None:
        print_hierarchy(obj)
