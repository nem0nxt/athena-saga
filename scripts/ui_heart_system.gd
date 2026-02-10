extends Control
class_name HeartSystemUI

# Heart System UI - Anatomical heart with blood health bar
# Position: Bottom-left

# References (created in code)
var heart_shape: Polygon2D = null
var heart_outline: Line2D = null
var arteries_container: Node2D = null
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
	
	if heart_shape:
		heart_shape.scale = Vector2(beat_scale, beat_scale)
	
	# Update UI
	_update_bpm_display()
	_update_health_bar()

func _create_ui_elements() -> void:
	var container = Control.new()
	container.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	container.position = Vector2(20, -150)
	container.size = Vector2(160, 130)
	add_child(container)
	
	# Create anatomical heart (left side view)
	heart_shape = Polygon2D.new()
	var heart_points = PackedVector2Array([
		Vector2(80, 120),   # Bottom tip
		Vector2(110, 90),   # Right side
		Vector2(120, 60),   # Upper right
		Vector2(95, 35),    # Top
		Vector2(65, 45),    # Upper left (aorta area)
		Vector2(50, 70),    # Left side
		Vector2(80, 120),   # Back to bottom
	])
	heart_shape.polygon = heart_points
	heart_shape.color = HEART_COLOR
	container.add_child(heart_shape)
	
	# Create outline
	heart_outline = Line2D.new()
	heart_outline.points = heart_points
	heart_outline.width = 2.0
	heart_outline.default_color = Color(0.4, 0.1, 0.15, 1.0)
	container.add_child(heart_outline)
	
	# Create aorta
	var aorta = Line2D.new()
	aorta.points = [Vector2(75, 35), Vector2(75, 15), Vector2(100, 5)]
	aorta.width = 5.0
	aorta.default_color = HEART_COLOR
	container.add_child(aorta)
	
	# Create vena cava
	var vena_cava = Line2D.new()
	vena_cava.points = [Vector2(55, 70), Vector2(45, 50)]
	vena_cava.width = 4.0
	vena_cava.default_color = Color(0.6, 0.1, 0.2, 1.0)
	container.add_child(vena_cava)
	
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
