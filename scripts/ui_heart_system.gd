extends Control
class_name HeartSystemUI

# Heart System UI - Anatomical heart with blood health bar
# Position: Bottom-left

# References (created in code)
var health_bar: ProgressBar = null
var bpm_label: Label = null
var heartbeat_player: AudioStreamPlayer = null
var heart_3d: Node3D = null
var heart_viewport: SubViewport = null

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
	# Clear any existing children from scene file
	for child in get_children():
		child.queue_free()
	
	_create_ui_elements()
	_setup_heartbeat_sound()
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
	
	# Animate label scale for heartbeat effect
	beat_scale = lerp(beat_scale, 1.0, delta * 8.0)
	if bpm_label:
		bpm_label.scale = Vector2(beat_scale, beat_scale)
	
	# Sync 3D heart animation speed with BPM
	if heart_3d and heart_3d.has_method("set_bpm"):
		heart_3d.set_bpm(current_bpm)
	
	# Update UI
	_update_bpm_display()
	_update_health_bar()

func _create_ui_elements() -> void:
	# Create a panel in the bottom-left corner
	var panel = PanelContainer.new()
	panel.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	panel.offset_left = 10
	panel.offset_top = -180
	panel.offset_right = 190
	panel.offset_bottom = -10
	
	# Dark semi-transparent background
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.0, 0.0, 0.0, 0.5)
	style.set_corner_radius_all(8)
	panel.add_theme_stylebox_override("panel", style)
	add_child(panel)
	
	# VBox for layout
	var vbox = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 4)
	panel.add_child(vbox)
	
	# 3D Heart via SubViewport
	heart_viewport = SubViewport.new()
	heart_viewport.size = Vector2i(160, 100)
	heart_viewport.transparent_bg = true
	heart_viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	heart_viewport.own_world_3d = true  # Isolate from main world
	add_child(heart_viewport)  # Add to tree first
	
	# 3D scene setup inside viewport
	var scene_root = Node3D.new()
	heart_viewport.add_child(scene_root)
	
	# Camera for the heart - pull back to see whole heart
	var cam = Camera3D.new()
	cam.position = Vector3(0, 0, 0.25)
	cam.fov = 50.0
	cam.current = true
	scene_root.add_child(cam)
	
	# Lights
	var light = DirectionalLight3D.new()
	light.rotation_degrees = Vector3(-45, 45, 0)
	light.light_energy = 2.0
	scene_root.add_child(light)
	
	var light2 = DirectionalLight3D.new()
	light2.rotation_degrees = Vector3(-30, -60, 0)
	light2.light_energy = 1.0
	scene_root.add_child(light2)
	
	# Load and add the 3D heart model
	var heart_scene = load("res://scenes/Heart3D.tscn")
	if heart_scene:
		heart_3d = heart_scene.instantiate()
		# FBX has root_scale=0.05, scale down more for UI
		heart_3d.scale = Vector3(0.3, 0.3, 0.3)
		heart_3d.position = Vector3(0, -0.06, 0)  # Move down to center
		scene_root.add_child(heart_3d)
	else:
		print("ERROR: Could not load Heart3D.tscn")
	
	# TextureRect to display the viewport
	var heart_display = TextureRect.new()
	heart_display.custom_minimum_size = Vector2(160, 100)
	heart_display.texture = heart_viewport.get_texture()
	heart_display.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	vbox.add_child(heart_display)
	
	# BPM Label
	bpm_label = Label.new()
	bpm_label.text = "♥ 80 BPM"
	bpm_label.add_theme_font_size_override("font_size", 20)
	bpm_label.add_theme_color_override("font_color", HEART_COLOR)
	bpm_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(bpm_label)
	
	# Health Bar (blood style)
	health_bar = ProgressBar.new()
	health_bar.custom_minimum_size = Vector2(160, 16)
	health_bar.min_value = 0.0
	health_bar.max_value = max_heart_health
	health_bar.value = heart_health
	health_bar.show_percentage = false
	
	# Style the progress bar
	var style_bg = StyleBoxFlat.new()
	style_bg.bg_color = Color(0.15, 0.08, 0.08, 1.0)
	style_bg.set_corner_radius_all(4)
	health_bar.add_theme_stylebox_override("background", style_bg)
	
	var style_fill = StyleBoxFlat.new()
	style_fill.bg_color = BLOOD_COLOR
	style_fill.set_corner_radius_all(4)
	health_bar.add_theme_stylebox_override("fill", style_fill)
	
	vbox.add_child(health_bar)

func _setup_heartbeat_sound() -> void:
	heartbeat_player = AudioStreamPlayer.new()
	heartbeat_player.bus = &"Master"
	var stream = load("res://assets/audio/heartbeat.wav") as AudioStream
	if stream:
		heartbeat_player.stream = stream
		add_child(heartbeat_player)
	else:
		push_warning("Heartbeat sound not found: res://assets/audio/heartbeat.wav")

func _beat() -> void:
	beat_scale = 1.15 + (current_bpm / 200.0) * 0.1
	
	# Sync 3D heart animation with beat
	if heart_3d and heart_3d.has_method("sync_to_beat"):
		heart_3d.sync_to_beat()
	
	if heartbeat_player and heartbeat_player.stream:
		heartbeat_player.play()

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
	if health_bar:
		health_bar.value = heart_health

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
