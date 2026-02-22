import bpy

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

model_path = "/home/nem0nxt/tt/athena-saga/assets/models/Meshy_AI_biped/Meshy_AI_Animation_Death.glb"
bpy.ops.import_scene.gltf(filepath=model_path)

armature = None
for obj in bpy.data.objects:
    if obj.type == 'ARMATURE':
        armature = obj
        break

if not armature:
    print("ERROR: No armature!")
    raise SystemExit(1)

# Check all actions
for act in bpy.data.actions:
    print(f"Action: {act.name}")
    print(f"  Frame range: {act.frame_range}")
    
    # Blender 5.0 uses layers/strips instead of fcurves directly on Action
    if hasattr(act, 'layers'):
        print(f"  Layers: {len(act.layers)}")
        for li, layer in enumerate(act.layers):
            print(f"    Layer {li}: {layer.name if hasattr(layer, 'name') else 'unnamed'}")
            if hasattr(layer, 'strips'):
                for si, strip in enumerate(layer.strips):
                    print(f"      Strip {si}: type={strip.type if hasattr(strip, 'type') else 'unknown'}")
                    if hasattr(strip, 'channelbags'):
                        for cb in strip.channelbags:
                            print(f"        Channelbag: {len(cb.fcurves)} fcurves")
                            for fc in cb.fcurves:
                                print(f"          {fc.data_path}[{fc.array_index}]: {len(fc.keyframe_points)} keys")
    
    # Try legacy fcurves
    if hasattr(act, 'fcurves'):
        print(f"  Legacy fcurves: {len(act.fcurves)}")

# Test: set frame and check bone positions
bpy.context.view_layer.objects.active = armature
armature.select_set(True)

if armature.animation_data:
    death_action = None
    for act in bpy.data.actions:
        if act.name == "Death":
            death_action = act
            break
    
    if death_action:
        armature.animation_data.action = death_action
        
        # Check at different frames
        for frame in [0, 18, 36, 54, 72]:
            bpy.context.scene.frame_set(frame)
            bpy.context.view_layer.update()
            hips = armature.pose.bones.get("Hips")
            head = armature.pose.bones.get("Head")
            if hips:
                print(f"  Frame {frame}: Hips loc={hips.location[:]} rot={hips.rotation_quaternion[:]}")
            if head:
                print(f"  Frame {frame}: Head rot={head.rotation_quaternion[:]}")
