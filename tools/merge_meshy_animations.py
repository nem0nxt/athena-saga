"""
Blender script to merge all Meshy animation GLBs into a single GLB file.
Run from Blender: Scripting workspace -> Open this file -> Run Script
Or from command line: blender --background --python tools/merge_meshy_animations.py

Requires: Edit the ASSETS_DIR path below to match your project, or run from project root.
"""

import bpy
import os
import sys

# Paths - adjust if needed
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
ASSETS_DIR = os.path.join(PROJECT_ROOT, "assets", "models", "Meshy_AI_biped")
OUTPUT_PATH = os.path.join(ASSETS_DIR, "Meshy_AI_Character_AllAnimations.glb")

# Animation files and their export names
ANIM_FILES = [
    ("Meshy_AI_Animation_Long_Breathe_and_Look_Around_withSkin.glb", "Idle"),
    ("Meshy_AI_Animation_Short_Breathe_and_Look_Around_withSkin.glb", "IdleShort"),
    ("Meshy_AI_Animation_Walking_withSkin.glb", "Walk"),
    ("Meshy_AI_Animation_Running_withSkin.glb", "Run"),
]


def get_armatures():
    return [obj for obj in bpy.data.objects if obj.type == "ARMATURE"]


def get_meshes_for_armature(armature):
    """Find meshes that use this armature (Armature modifier)."""
    meshes = []
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        for mod in obj.modifiers:
            if mod.type == "ARMATURE" and mod.object == armature:
                meshes.append(obj)
                break
    return meshes


def main():
    # Clear scene
    bpy.ops.wm.read_factory_settings(use_empty=True)

    base_armature = None
    base_meshes = []

    for i, (filename, anim_name) in enumerate(ANIM_FILES):
        filepath = os.path.join(ASSETS_DIR, filename)
        if not os.path.exists(filepath):
            print(f"ERROR: File not found: {filepath}")
            continue

        # Import GLB
        bpy.ops.import_scene.gltf(filepath=filepath)

        armatures = get_armatures()
        if not armatures:
            print(f"ERROR: No armature in {filename}")
            continue

        # Most recently imported armature is last in list (or we get the one not yet processed)
        current_armature = armatures[-1]

        if base_armature is None:
            # First import - this is our base
            base_armature = current_armature
            base_meshes = get_meshes_for_armature(base_armature)

            # Rename the first action and push to NLA (direct API - works in Blender 5 headless)
            if base_armature.animation_data and base_armature.animation_data.action:
                action = base_armature.animation_data.action
                action.name = anim_name
                track = base_armature.animation_data.nla_tracks.new()
                track.name = anim_name
                track.strips.new(action.name, int(action.frame_range[0]), action)
                base_armature.animation_data.action = None
            print(f"Imported base: {anim_name}")
        else:
            # Subsequent import - copy action to base, then delete duplicate
            if current_armature.animation_data and current_armature.animation_data.action:
                src_action = current_armature.animation_data.action
                # Copy action (fcurves use bone names, so it works on base armature)
                new_action = src_action.copy()
                new_action.name = anim_name

                # Delete the duplicate armature and its mesh
                dup_meshes = get_meshes_for_armature(current_armature)
                for m in dup_meshes:
                    bpy.data.objects.remove(m, do_unlink=True)
                bpy.data.objects.remove(current_armature, do_unlink=True)

                # Assign to base armature and push to NLA (direct API - works in Blender 5 headless)
                base_armature.animation_data_create()
                base_armature.animation_data.action = new_action
                track = base_armature.animation_data.nla_tracks.new()
                track.name = anim_name
                track.strips.new(new_action.name, int(new_action.frame_range[0]), new_action)
                base_armature.animation_data.action = None
                print(f"Added animation: {anim_name}")
            else:
                # No action - just delete duplicate
                dup_meshes = get_meshes_for_armature(current_armature)
                for m in dup_meshes:
                    bpy.data.objects.remove(m, do_unlink=True)
                bpy.data.objects.remove(current_armature, do_unlink=True)

    if base_armature is None:
        print("ERROR: No armature found. Check file paths.")
        return

    # Select base armature and its meshes for export
    bpy.ops.object.select_all(action="DESELECT")
    base_armature.select_set(True)
    for m in base_meshes:
        m.select_set(True)

    # Export as GLB
    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_PATH,
        use_selection=True,
        export_animations=True,
        export_animation_mode="NLA_TRACKS",
        export_force_sampling=False,
    )
    print(f"Exported: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
