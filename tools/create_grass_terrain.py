import bpy
import bmesh
import math
import os
import random
from mathutils import Vector, Euler

random.seed(123)

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for block in bpy.data.meshes:
        if block.users == 0:
            bpy.data.meshes.remove(block)
    for block in bpy.data.materials:
        if block.users == 0:
            bpy.data.materials.remove(block)

def make_mat(name, color, roughness=0.85, subsurface=0.0, subsurface_color=None):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    if subsurface > 0:
        bsdf.inputs["Subsurface Weight"].default_value = subsurface
        if subsurface_color:
            bsdf.inputs["Subsurface Radius"].default_value = subsurface_color
    return mat

output_dir = "/home/nem0nxt/tt/athena-saga/assets/models/nature/"
os.makedirs(output_dir, exist_ok=True)


# ========== GRASS PATCH ==========
def create_grass_patch():
    mat_grass_base = make_mat("GrassBase", (0.08, 0.28, 0.04, 1.0), roughness=0.95,
                              subsurface=0.2, subsurface_color=(0.15, 0.4, 0.08))
    mat_grass_mid = make_mat("GrassMid", (0.12, 0.38, 0.06, 1.0), roughness=0.93,
                             subsurface=0.15, subsurface_color=(0.2, 0.5, 0.1))
    mat_grass_tip = make_mat("GrassTip", (0.18, 0.48, 0.1, 1.0), roughness=0.9,
                             subsurface=0.1, subsurface_color=(0.25, 0.55, 0.12))
    mat_dry = make_mat("GrassDry", (0.35, 0.32, 0.15, 1.0), roughness=0.96)
    
    grass_mats = [mat_grass_base, mat_grass_mid, mat_grass_tip, mat_dry]
    
    mesh = bpy.data.meshes.new("GrassPatchMesh")
    obj = bpy.data.objects.new("GrassPatch", mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    
    for m in grass_mats:
        mesh.materials.append(m)
    
    bm = bmesh.new()
    
    for i in range(80):
        x = random.uniform(-1.5, 1.5)
        y = random.uniform(-1.5, 1.5)
        
        blade_height = random.uniform(0.15, 0.55)
        blade_width = random.uniform(0.01, 0.035)
        
        # Curve direction (wind effect)
        curve_x = random.uniform(-0.08, 0.08)
        curve_y = random.uniform(-0.08, 0.08)
        bend = random.uniform(0.05, 0.2)
        
        # Multi-segment blade for natural curve
        segments = 4
        left_verts = []
        right_verts = []
        
        rot_angle = random.uniform(0, math.pi * 2)
        cos_a = math.cos(rot_angle)
        sin_a = math.sin(rot_angle)
        
        for si in range(segments + 1):
            t = si / segments
            z = t * blade_height
            # Blade narrows toward tip
            w = blade_width * (1.0 - t * 0.8)
            # Natural bend
            cx = curve_x * t * t + bend * t * t * t
            cy = curve_y * t * t
            
            # Rotated blade
            bx = x + cos_a * cx - sin_a * cy
            by = y + sin_a * cx + cos_a * cy
            
            lx = bx - sin_a * w
            ly = by + cos_a * w
            rx = bx + sin_a * w
            ry = by - cos_a * w
            
            left_verts.append(bm.verts.new((lx, ly, z)))
            right_verts.append(bm.verts.new((rx, ry, z)))
        
        # Create faces between segments
        for si in range(segments):
            t = si / segments
            # Color: base->mid->tip, occasional dry blade
            if random.random() < 0.15:
                mat_i = 3  # dry
            elif t < 0.3:
                mat_i = 0  # base
            elif t < 0.7:
                mat_i = 1  # mid
            else:
                mat_i = 2  # tip
            
            try:
                f = bm.faces.new([left_verts[si], right_verts[si],
                                  right_verts[si+1], left_verts[si+1]])
                f.material_index = mat_i
            except:
                pass
    
    # Small ground cover flowers (tiny colored dots)
    for _ in range(5):
        fx = random.uniform(-1.2, 1.2)
        fy = random.uniform(-1.2, 1.2)
        fh = random.uniform(0.1, 0.2)
        fw = 0.02
        
        v1 = bm.verts.new((fx - fw, fy, fh))
        v2 = bm.verts.new((fx + fw, fy, fh))
        v3 = bm.verts.new((fx, fy - fw, fh))
        v4 = bm.verts.new((fx, fy + fw, fh))
        try:
            f = bm.faces.new([v1, v3, v2, v4])
            f.material_index = 2
        except:
            pass
    
    bm.to_mesh(mesh)
    bm.free()
    bpy.ops.object.shade_smooth()
    return obj


# ========== TERRAIN ==========
def create_terrain():
    mat_terrain = make_mat("TerrainGround", (0.22, 0.4, 0.12, 1.0), roughness=0.95)
    
    subdivisions = 80
    size = 200
    
    bpy.ops.mesh.primitive_grid_add(
        x_subdivisions=subdivisions, y_subdivisions=subdivisions,
        size=size, location=(0, 0, 0)
    )
    terrain = bpy.context.active_object
    terrain.name = "Terrain"
    
    bm = bmesh.new()
    bm.from_mesh(terrain.data)
    
    for v in bm.verts:
        x, y = v.co.x, v.co.y
        
        h = 3.0 * math.sin(x * 0.03) * math.cos(y * 0.025)
        h += 1.5 * math.sin(x * 0.08 + 1.5) * math.cos(y * 0.06 + 0.7)
        h += 0.5 * math.sin(x * 0.2 + 3.0) * math.cos(y * 0.25 + 2.1)
        h += 0.2 * math.sin(x * 0.5) * math.sin(y * 0.5)
        
        dist_from_center = math.sqrt(x*x + y*y)
        if dist_from_center < 15:
            flatten = 1.0 - max(0, (15 - dist_from_center) / 15)
            h *= flatten
        
        v.co.z = h
    
    bm.to_mesh(terrain.data)
    bm.free()
    
    terrain.data.materials.append(mat_terrain)
    bpy.ops.object.shade_smooth()
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return terrain


# ========== ROCK ==========
def create_rock():
    mat_rock = make_mat("Rock", (0.38, 0.36, 0.33, 1.0), roughness=0.97)
    mat_moss = make_mat("RockMoss", (0.15, 0.3, 0.1, 1.0), roughness=0.95)
    
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=0.8, location=(0, 0, 0.3))
    rock = bpy.context.active_object
    rock.name = "Rock"
    rock.scale = (1.0, 0.8, 0.5)
    
    rock.data.materials.append(mat_rock)
    rock.data.materials.append(mat_moss)
    
    bm = bmesh.new()
    bm.from_mesh(rock.data)
    for v in bm.verts:
        v.co.x *= random.uniform(0.75, 1.25)
        v.co.y *= random.uniform(0.75, 1.25)
        v.co.z *= random.uniform(0.8, 1.2)
        v.co.x += random.uniform(-0.03, 0.03)
        v.co.y += random.uniform(-0.03, 0.03)
    
    # Assign moss to top-facing faces
    for f in bm.faces:
        normal = f.normal
        if normal.z > 0.5:
            f.material_index = 1
        else:
            f.material_index = 0
    
    bm.to_mesh(rock.data)
    bm.free()
    
    bpy.ops.object.shade_smooth()
    
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    bbox = [rock.matrix_world @ Vector(c) for c in rock.bound_box]
    min_z = min(v.z for v in bbox)
    rock.location.z -= min_z
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return rock


# --- Export Grass ---
clear_scene()
create_grass_patch()
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=os.path.join(output_dir, "grass_patch.glb"),
    export_format='GLB', use_selection=True, export_apply=True, export_materials='EXPORT'
)
print("Exported grass_patch.glb")

# --- Export Terrain ---
clear_scene()
create_terrain()
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=os.path.join(output_dir, "terrain.glb"),
    export_format='GLB', use_selection=True, export_apply=True, export_materials='EXPORT'
)
print("Exported terrain.glb")

# --- Export Rock ---
clear_scene()
create_rock()
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=os.path.join(output_dir, "rock.glb"),
    export_format='GLB', use_selection=True, export_apply=True, export_materials='EXPORT'
)
print("Exported rock.glb")
