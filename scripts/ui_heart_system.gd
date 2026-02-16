extends Control
class_name HeartSystemUI

# Heart System UI - Anatomical heart with blood health bar
# Position: Bottom-left

# References (created in code)
var heart_3d: Node3D = null
var heart_viewport: SubViewport = null
var heart_root: Node3D = null
var health_bar: ProgressBar = null
var health_fill: ColorRect = null
var bpm_label: Label = null

# Heart rate system
var current_bpm: float = 80.0
var target_bpm: float = 80.0
var heart_health: float = 100.0
var max_heart_health: float = 100.0

# Animation
var beat_timer: float = 0.0
var beat_scale: float = 1.0

# Colors
var HEART_COLOR: Color = Color(0.85, 0.2, 0.3, 1.0)
var BLOOD_COLOR: Color = Color(0.9, 0.1, 0.1, 1.0)

func _ready() -> void:
	add_to_group("heart_ui")
	call_deferred("_setup_ui")

func _setup_ui() -> void:
	_create_ui_elements()
	_update_bpm_display()

func _process(delta: float) -> void:
	# Smooth BPM transition
	current_bpm = lerp(current_bpm, target_bpm, delta * 2.0)
	
	# Calculate beat timing
	var beat_interval = 60.0 / max(current_bpm, 1.0)
	beat_timer += delta
	
	if beat_timer >= beat_interval:
		beat_timer = 0.0
		_beat()
	
	# Animate heart scale
	beat_scale = lerp(beat_scale, 1.0, delta * 8.0)
	
	if heart_root:
		heart_root.scale = Vector3(beat_scale, beat_scale, beat_scale)
	
	# Update UI
	_update_bpm_display()
	_update_health_bar()

func _create_ui_elements() -> void:
	var container = Control.new()
	container.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	container.position = Vector2(20, -150)
	container.size = Vector2(160, 130)
	add_child(container)
	
	# 3D animated heart via SubViewport
	var vp_container = SubViewportContainer.new()
	vp_container.size = Vector2(160, 130)
	vp_container.stretch = true
	container.add_child(vp_container)

	heart_viewport = SubViewport.new()
	heart_viewport.size = Vector2i(160, 130)
	heart_viewport.transparent_bg = true
	heart_viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	vp_container.add_child(heart_viewport)

	# Scene root for 3D
	heart_root = Node3D.new()
	heart_viewport.add_child(heart_root)

	# Camera
	var cam = Camera3D.new()
	cam.position = Vector3(0, 0.0, 3.0)
	cam.fov = 35.0
	heart_root.add_child(cam)
	# Defer look_at until nodes are in tree
	cam.call_deferred("look_at", Vector3(0, 0, 0), Vector3.UP)

	# Light
	var light = DirectionalLight3D.new()
	light.position = Vector3(1.5, 2.0, 2.0)
	heart_root.add_child(light)
	light.call_deferred("look_at", Vector3(0, 0, 0), Vector3.UP)

	# Heart model
	var heart_scene = preload("res://scenes/Heart3D.tscn")
	heart_3d = heart_scene.instantiate()
	if heart_3d:
		heart_root.add_child(heart_3d)
		# Adjust scale/orientation for UI
		heart_3d.scale = Vector3(0.2, 0.2, 0.2)
		heart_3d.rotation = Vector3(0.0, 0.3, 0.0)
	
	# BPM Label
	bpm_label = Label.new()
	bpm_label.text = "♥ 80 BPM"
	bpm_label.position = Vector2(0, -55)
	bpm_label.add_theme_font_size_override("font_size", 20)
	container.add_child(bpm_label)
	
	# Health Bar (blood style)
	health_bar = ProgressBar.new()
	health_bar.position = Vector2(0, -35)
	health_bar.size = Vector2(160, 15)
	health_bar.min_value = 0.0
	health_bar.max_value = max_heart_health
	health_bar.value = heart_health
	health_bar.show_percentage = false
	
	health_fill = ColorRect.new()
	health_fill.color = BLOOD_COLOR
	health_fill.set_anchors_preset(Control.PRESET_FULL_RECT)
	health_bar.add_child(health_fill)
	
	container.add_child(health_bar)

func _beat() -> void:
	beat_scale = 1.15 + (current_bpm / 200.0) * 0.1

func _update_bpm_display() -> void:
	if bpm_label:
		bpm_label.text = "♥ %d BPM" % int(current_bpm)
		
		if current_bpm > 160:
			bpm_label.modulate = Color(1.0, 0.3, 0.3, 1.0)
		elif current_bpm > 120:
			bpm_label.modulate = Color(1.0, 0.8, 0.3, 1.0)
		else:
			bpm_label.modulate = Color(0.9, 0.9, 0.9, 1.0)

func _update_health_bar() -> void:
	if health_bar and health_fill:
		health_bar.value = heart_health
		
		if heart_health > 60:
			health_fill.color = BLOOD_COLOR
		elif heart_health > 30:
			health_fill.color = Color(0.8, 0.3, 0.1, 1.0)
		else:
			health_fill.color = Color(0.5, 0.05, 0.05, 1.0)

# Public API
func set_bpm(new_bpm: float) -> void:
	target_bpm = clamp(new_bpm, 40.0, 200.0)

func add_bpm(amount: float) -> void:
	target_bpm += amount
	target_bpm = clamp(target_bpm, 40.0, 200.0)

func reduce_bpm(amount: float) -> void:
	target_bpm -= amount
	target_bpm = clamp(target_bpm, 40.0, 200.0)

func take_heart_damage(amount: float) -> void:
	heart_health -= amount
	if heart_health <= 0:
		heart_health = 0
		_on_heart_attack()

func heal_heart(amount: float) -> void:
	heart_health += amount
	heart_health = clamp(heart_health, 0.0, max_heart_health)

func is_dangerous_bpm() -> bool:
	return current_bpm > 160.0

func is_critical() -> bool:
	return heart_health < 30.0

func _on_heart_attack() -> void:
	print("HEART ATTACK!")
