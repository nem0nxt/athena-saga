import bpy
import bmesh
import math
import os
import random
from mathutils import Vector, Matrix, Euler

random.seed(42)

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


def grow_branch(bm, origin, direction, length, radius, depth, max_depth, mat_bark_idx, mat_leaf_idx):
    """Recursively grow branches with natural tapering and splitting."""
    if depth > max_depth or length < 0.05:
        return
    
    segments = 5
    verts_rings = []
    current_pos = origin.copy()
    current_dir = direction.normalized()
    
    for i in range(segments + 1):
        t = i / segments
        r = radius * (1.0 - t * 0.7)
        
        # Curve direction with gravity and randomness
        gravity_influence = 0.02 * depth
        current_dir.z -= gravity_influence
        current_dir.x += random.uniform(-0.1, 0.1) * depth
        current_dir.y += random.uniform(-0.1, 0.1) * depth
        current_dir = current_dir.normalized()
        
        # Create ring of vertices
        ring = []
        sides = max(4, 8 - depth)
        for j in range(sides):
            angle = j * 2 * math.pi / sides
            # Create perpendicular vectors
            if abs(current_dir.z) < 0.9:
                perp1 = current_dir.cross(Vector((0, 0, 1))).normalized()
            else:
                perp1 = current_dir.cross(Vector((1, 0, 0))).normalized()
            perp2 = current_dir.cross(perp1).normalized()
            
            offset = (perp1 * math.cos(angle) + perp2 * math.sin(angle)) * r
            v = bm.verts.new(current_pos + offset)
            ring.append(v)
        verts_rings.append(ring)
        
        current_pos += current_dir * (length / segments)
    
    # Create faces between rings
    for i in range(len(verts_rings) - 1):
        ring1 = verts_rings[i]
        ring2 = verts_rings[i + 1]
        sides = len(ring1)
        for j in range(sides):
            j_next = (j + 1) % sides
            try:
                f = bm.faces.new([ring1[j], ring1[j_next], ring2[j_next], ring2[j]])
                f.material_index = mat_bark_idx
            except:
                pass
    
    tip = current_pos
    
    # Add leaf clusters at branch tips
    if depth >= max_depth - 1:
        for _ in range(random.randint(2, 4)):
            leaf_offset = Vector((
                random.uniform(-0.3, 0.3),
                random.uniform(-0.3, 0.3),
                random.uniform(-0.1, 0.3)
            ))
            leaf_pos = tip + leaf_offset
            leaf_size = random.uniform(0.3, 0.8) * (1.0 / (depth * 0.5 + 1))
            _add_leaf_cluster(bm, leaf_pos, leaf_size, mat_leaf_idx)
    
    # Spawn child branches
    if depth < max_depth:
        num_children = random.randint(1, 3) if depth < 2 else random.randint(1, 2)
        for _ in range(num_children):
            child_angle = random.uniform(20, 60)
            child_twist = random.uniform(0, 360)
            
            child_dir = current_dir.copy()
            rot_x = Matrix.Rotation(math.radians(child_angle), 3, 'X')
            rot_z = Matrix.Rotation(math.radians(child_twist), 3, 'Z')
            child_dir = rot_z @ rot_x @ child_dir
            
            child_length = length * random.uniform(0.5, 0.75)
            child_radius = radius * random.uniform(0.4, 0.65)
            
            grow_branch(bm, tip, child_dir, child_length, child_radius,
                       depth + 1, max_depth, mat_bark_idx, mat_leaf_idx)


def _add_leaf_cluster(bm, center, size, mat_idx):
    """Add a cluster of flat leaf quads."""
    num_leaves = random.randint(4, 8)
    for _ in range(num_leaves):
        offset = Vector((
            random.uniform(-size, size),
            random.uniform(-size, size),
            random.uniform(-size * 0.5, size * 0.5)
        ))
        pos = center + offset
        leaf_w = random.uniform(0.08, 0.15) * size * 3
        leaf_h = random.uniform(0.1, 0.2) * size * 3
        
        # Random orientation
        rx = random.uniform(-0.5, 0.5)
        ry = random.uniform(-0.5, 0.5)
        rz = random.uniform(0, math.pi * 2)
        rot = Euler((rx, ry, rz)).to_matrix()
        
        v1 = bm.verts.new(pos + rot @ Vector((-leaf_w, 0, 0)))
        v2 = bm.verts.new(pos + rot @ Vector((leaf_w, 0, 0)))
        v3 = bm.verts.new(pos + rot @ Vector((leaf_w, 0, leaf_h)))
        v4 = bm.verts.new(pos + rot @ Vector((-leaf_w, 0, leaf_h)))
        try:
            f = bm.faces.new([v1, v2, v3, v4])
            f.material_index = mat_idx
        except:
            pass


def create_oak_tree():
    mat_bark = make_mat("OakBark", (0.18, 0.1, 0.05, 1.0), roughness=0.98)
    mat_leaves = make_mat("OakLeaves", (0.12, 0.35, 0.08, 1.0), roughness=0.92,
                          subsurface=0.3, subsurface_color=(0.2, 0.5, 0.1))
    mat_leaves_light = make_mat("OakLeavesLight", (0.2, 0.45, 0.12, 1.0), roughness=0.9,
                                subsurface=0.2, subsurface_color=(0.3, 0.6, 0.15))
    
    mesh = bpy.data.meshes.new("OakTreeMesh")
    obj = bpy.data.objects.new("OakTree", mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    
    mesh.materials.append(mat_bark)       # 0
    mesh.materials.append(mat_leaves)     # 1
    mesh.materials.append(mat_leaves_light)  # 2
    
    bm = bmesh.new()
    
    # Main trunk
    grow_branch(bm, Vector((0, 0, 0)), Vector((0, 0, 1)),
                length=3.5, radius=0.25, depth=0, max_depth=4,
                mat_bark_idx=0, mat_leaf_idx=1)
    
    # Extra branches from lower trunk
    for i in range(3):
        angle = i * 2.1 + random.uniform(-0.3, 0.3)
        branch_start = Vector((0, 0, 1.5 + random.uniform(0, 1.0)))
        branch_dir = Vector((math.cos(angle) * 0.6, math.sin(angle) * 0.6, 0.8))
        grow_branch(bm, branch_start, branch_dir,
                    length=2.0, radius=0.1, depth=1, max_depth=4,
                    mat_bark_idx=0, mat_leaf_idx=2)
    
    bm.to_mesh(mesh)
    bm.free()
    
    bpy.ops.object.shade_smooth()
    
    # Set origin and ground level
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    bbox = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    min_z = min(v.z for v in bbox)
    obj.location.z -= min_z
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return obj


def create_pine_tree():
    mat_bark = make_mat("PineBark", (0.22, 0.12, 0.06, 1.0), roughness=0.97)
    mat_needles = make_mat("PineNeedles", (0.06, 0.22, 0.06, 1.0), roughness=0.95,
                           subsurface=0.15, subsurface_color=(0.1, 0.3, 0.05))
    mat_needles_tip = make_mat("PineNeedlesTip", (0.1, 0.3, 0.08, 1.0), roughness=0.93)
    
    mesh = bpy.data.meshes.new("PineTreeMesh")
    obj = bpy.data.objects.new("PineTree", mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    
    mesh.materials.append(mat_bark)       # 0
    mesh.materials.append(mat_needles)    # 1
    mesh.materials.append(mat_needles_tip)  # 2
    
    bm = bmesh.new()
    
    # Tall straight trunk
    trunk_height = 7.0
    trunk_segments = 12
    trunk_rings = []
    for i in range(trunk_segments + 1):
        t = i / trunk_segments
        z = t * trunk_height
        r = 0.15 * (1.0 - t * 0.6)
        ring = []
        for j in range(8):
            angle = j * 2 * math.pi / 8
            x = math.cos(angle) * r + random.uniform(-0.01, 0.01)
            y = math.sin(angle) * r + random.uniform(-0.01, 0.01)
            v = bm.verts.new((x, y, z))
            ring.append(v)
        trunk_rings.append(ring)
    
    for i in range(len(trunk_rings) - 1):
        for j in range(8):
            j_next = (j + 1) % 8
            try:
                f = bm.faces.new([trunk_rings[i][j], trunk_rings[i][j_next],
                                  trunk_rings[i+1][j_next], trunk_rings[i+1][j]])
                f.material_index = 0
            except:
                pass
    
    # Layered conical foliage with drooping branch tips
    layers = 7
    for li in range(layers):
        t = li / (layers - 1)
        base_z = 2.0 + t * 5.0
        base_radius = 2.0 * (1.0 - t * 0.8) + 0.2
        
        branches_in_layer = random.randint(6, 10)
        for bi in range(branches_in_layer):
            angle = bi * 2 * math.pi / branches_in_layer + random.uniform(-0.2, 0.2)
            
            # Branch extends outward and slightly down
            branch_len = base_radius * random.uniform(0.7, 1.1)
            segments = 4
            
            for si in range(segments):
                st = si / segments
                st_next = (si + 1) / segments
                
                r1 = branch_len * st
                r2 = branch_len * st_next
                droop1 = -st * st * 0.3
                droop2 = -st_next * st_next * 0.3
                
                # Create needle quad
                w = 0.15 * (1.0 - st * 0.5)
                
                x1 = math.cos(angle) * r1
                y1 = math.sin(angle) * r1
                z1 = base_z + droop1
                
                x2 = math.cos(angle) * r2
                y2 = math.sin(angle) * r2
                z2 = base_z + droop2
                
                perp_x = -math.sin(angle) * w
                perp_y = math.cos(angle) * w
                
                v1 = bm.verts.new((x1 + perp_x, y1 + perp_y, z1))
                v2 = bm.verts.new((x1 - perp_x, y1 - perp_y, z1))
                v3 = bm.verts.new((x2 - perp_x, y2 - perp_y, z2))
                v4 = bm.verts.new((x2 + perp_x, y2 + perp_y, z2))
                try:
                    f = bm.faces.new([v1, v2, v3, v4])
                    f.material_index = 2 if t > 0.7 else 1
                except:
                    pass
    
    bm.to_mesh(mesh)
    bm.free()
    bpy.ops.object.shade_smooth()
    
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    bbox = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    min_z = min(v.z for v in bbox)
    obj.location.z -= min_z
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return obj


def create_birch_tree():
    mat_bark = make_mat("BirchBark", (0.88, 0.85, 0.78, 1.0), roughness=0.75)
    mat_bark_dark = make_mat("BirchBarkDark", (0.2, 0.18, 0.15, 1.0), roughness=0.85)
    mat_leaves = make_mat("BirchLeaves", (0.25, 0.5, 0.12, 1.0), roughness=0.88,
                          subsurface=0.25, subsurface_color=(0.3, 0.6, 0.15))
    
    mesh = bpy.data.meshes.new("BirchTreeMesh")
    obj = bpy.data.objects.new("BirchTree", mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    
    mesh.materials.append(mat_bark)       # 0
    mesh.materials.append(mat_bark_dark)  # 1
    mesh.materials.append(mat_leaves)     # 2
    
    bm = bmesh.new()
    
    # Slender trunk with slight curve
    trunk_height = 6.0
    segments = 16
    trunk_rings = []
    curve_x = 0
    for i in range(segments + 1):
        t = i / segments
        z = t * trunk_height
        r = 0.08 * (1.0 - t * 0.5)
        curve_x += random.uniform(-0.02, 0.02)
        
        ring = []
        for j in range(6):
            angle = j * 2 * math.pi / 6
            x = math.cos(angle) * r + curve_x
            y = math.sin(angle) * r
            v = bm.verts.new((x, y, z))
            ring.append(v)
        trunk_rings.append(ring)
    
    for i in range(len(trunk_rings) - 1):
        for j in range(6):
            j_next = (j + 1) % 6
            try:
                f = bm.faces.new([trunk_rings[i][j], trunk_rings[i][j_next],
                                  trunk_rings[i+1][j_next], trunk_rings[i+1][j]])
                f.material_index = 0 if random.random() > 0.3 else 1
            except:
                pass
    
    # Delicate hanging leaf clusters
    for i in range(12):
        angle = i * math.pi / 6 + random.uniform(-0.3, 0.3)
        dist = random.uniform(0.5, 1.5)
        z = random.uniform(3.5, 6.5)
        x = math.cos(angle) * dist + curve_x
        y = math.sin(angle) * dist
        
        # Hanging leaf strand
        strand_length = random.uniform(0.5, 1.2)
        strand_segments = random.randint(3, 5)
        for si in range(strand_segments):
            st = si / strand_segments
            sz = z - st * strand_length
            leaf_w = random.uniform(0.05, 0.12)
            leaf_h = random.uniform(0.08, 0.15)
            
            lx = x + random.uniform(-0.15, 0.15)
            ly = y + random.uniform(-0.15, 0.15)
            
            rx = random.uniform(-0.3, 0.3)
            ry = random.uniform(-0.3, 0.3)
            rz = random.uniform(0, math.pi * 2)
            rot = Euler((rx, ry, rz)).to_matrix()
            
            pos = Vector((lx, ly, sz))
            v1 = bm.verts.new(pos + rot @ Vector((-leaf_w, 0, 0)))
            v2 = bm.verts.new(pos + rot @ Vector((leaf_w, 0, 0)))
            v3 = bm.verts.new(pos + rot @ Vector((leaf_w, 0, leaf_h)))
            v4 = bm.verts.new(pos + rot @ Vector((-leaf_w, 0, leaf_h)))
            try:
                f = bm.faces.new([v1, v2, v3, v4])
                f.material_index = 2
            except:
                pass
    
    # Top canopy
    for _ in range(6):
        cx = curve_x + random.uniform(-0.4, 0.4)
        cy = random.uniform(-0.4, 0.4)
        cz = random.uniform(5.0, 6.5)
        _add_leaf_cluster(bm, Vector((cx, cy, cz)), random.uniform(0.4, 0.7), 2)
    
    bm.to_mesh(mesh)
    bm.free()
    bpy.ops.object.shade_smooth()
    
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    bbox = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    min_z = min(v.z for v in bbox)
    obj.location.z -= min_z
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return obj


output_dir = "/home/nem0nxt/tt/athena-saga/assets/models/nature/"
os.makedirs(output_dir, exist_ok=True)

# --- Oak ---
clear_scene()
create_oak_tree()
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=os.path.join(output_dir, "oak_tree.glb"),
    export_format='GLB', use_selection=True, export_apply=True, export_materials='EXPORT'
)
print("Exported oak_tree.glb")

# --- Pine ---
clear_scene()
create_pine_tree()
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=os.path.join(output_dir, "pine_tree.glb"),
    export_format='GLB', use_selection=True, export_apply=True, export_materials='EXPORT'
)
print("Exported pine_tree.glb")

# --- Birch ---
clear_scene()
create_birch_tree()
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=os.path.join(output_dir, "birch_tree.glb"),
    export_format='GLB', use_selection=True, export_apply=True, export_materials='EXPORT'
)
print("Exported birch_tree.glb")
