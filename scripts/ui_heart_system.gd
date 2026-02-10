extends Control
class_name HeartSystemUI

# Heart System UI - Shows anatomical heart and blood health bar
# Position: Bottom-left corner

# References
@onready var heart_container: Control = $HeartContainer
@onready var heart_shape: Polygon2D = $HeartContainer/HeartShape
@onready var heart_outline: Line2D = $HeartContainer/HeartOutline
@onready var arteries: Node2D = $HeartContainer/Arteries
@onready var health_bar: ProgressBar = $HealthBar
@onready var health_fill: ColorRect = $HealthBar/HealthFill
@onready var bpm_label: Label = $BPMLabel

# Heart rate system
var current_bpm: float = 80.0
var target_bpm: float = 80.0
var heart_health: float = 100.0
var max_heart_health: float = 100.0

# Animation
var beat_timer: float = 0.0
var beat_scale: float = 1.0
var beat_intensity: float = 0.0

# Colors
var HEART_COLOR: Color = Color(0.85, 0.2, 0.3, 1.0)  # Κόκκινη καρδιά
var BLOOD_COLOR: Color = Color(0.9, 0.1, 0.1, 1.0)  # Σκούρο κόκκινο για blood bar
var DANGER_COLOR: Color = Color(1.0, 0.2, 0.2, 1.0)  # Κίνδυνος

func _ready() -> void:
	add_to_group("heart_ui")
	call_deferred("_setup_ui")

func _setup_ui() -> void:
	_draw_anatomical_heart()
	setup_health_bar()
	update_bpm_display()

func _process(delta: float) -> void:
	# Smooth BPM transition
	current_bpm = lerp(current_bpm, target_bpm, delta * 2.0)
	
	# Calculate beat timing
	var beat_interval = 60.0 / max(current_bpm, 1.0)
	beat_timer += delta
	
	if beat_timer >= beat_interval:
		beat_timer = 0.0
		_beat()
	
	# Animate heart scale (beat effect)
	beat_scale = lerp(beat_scale, 1.0, delta * 8.0)
	_visualize_heart_beat(delta)
	
	# Update UI
	update_bpm_display()
	update_health_bar()

# Draw anatomical heart shape
func _draw_anatomical_heart() -> void:
	# Simplified anatomical heart shape (left side view)
	var heart_points = PackedVector2Array([
		Vector2(30, 60),    # Bottom tip
		Vector2(50, 40),    # Right side
		Vector2(55, 25),    # Upper right
		Vector2(40, 15),    # Top
		Vector2(20, 20),    # Upper left (aorta area)
		Vector2(10, 35),    # Left side
		Vector2(30, 60),    # Back to bottom
	])
	
	heart_shape.polygon = heart_points
	heart_shape.color = HEART_COLOR
	
	# Draw arteries/vessels
	_draw_arteries()

func _draw_arteries() -> void:
	# Aorta (top)
	var aorta = Line2D.new()
	aorta.points = [Vector2(25, 15), Vector2(25, 5), Vector2(40, 0)]
	aorta.width = 4.0
	aorta.default_color = HEART_COLOR
	arteries.add_child(aorta)
	
	# Vena cava (left side)
	var vena_cava = Line2D.new()
	vena_cava.points = [Vector2(12, 35), Vector2(5, 25)]
	vena_cava.width = 3.0
	vena_cava.default_color = Color(0.6, 0.1, 0.2, 1.0)
	arteries.add_child(vena_cava)

func _beat() -> void:
	# Heart beat based on BPM
	beat_scale = 1.15 + (current_bpm / 200.0) * 0.1
	
	# Beat intensity increases with BPM
	beat_intensity = clamp(current_bpm / 180.0, 0.0, 1.0)

func _visualize_heart_beat(delta: float) -> void:
	# Apply scale
	heart_container.scale = Vector2(beat_scale, beat_scale)
	
	# Pulsing glow effect for high BPM
	if current_bpm > 120:
		var glow_strength = (current_bpm - 120.0) / 80.0
		heart_shape.modulate = Color(
			HEART_COLOR.r + glow_strength * 0.1,
			HEART_COLOR.g,
			HEART_COLOR.b,
			1.0
		)

func setup_health_bar() -> void:
	health_bar.min_value = 0.0
	health_bar.max_value = max_heart_health
	health_bar.value = heart_health
	
	# Style the health bar
	health_fill.color = BLOOD_COLOR

func update_health_bar() -> void:
	health_bar.value = heart_health
	
	# Color changes based on health
	if heart_health > 60:
		health_fill.color = BLOOD_COLOR
	elif heart_health > 30:
		health_fill.color = Color(0.8, 0.3, 0.1, 1.0)  # Orange-red
	else:
		health_fill.color = Color(0.5, 0.05, 0.05, 1.0)  # Dark red (critical)

func update_bpm_display() -> void:
	bpm_label.text = "♥ %d BPM" % int(current_bpm)
	
	# Warning color for high BPM
	if current_bpm > 160:
		bpm_label.modulate = Color(1.0, 0.3, 0.3, 1.0)  # Red warning
	elif current_bpm > 120:
		bpm_label.modulate = Color(1.0, 0.8, 0.3, 1.0)  # Yellow caution
	else:
		bpm_label.modulate = Color(0.9, 0.9, 0.9, 1.0)  # White normal

# Public API for game systems
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
	
	update_health_bar()

func heal_heart(amount: float) -> void:
	heart_health += amount
	heart_health = clamp(heart_health, 0.0, max_heart_health)
	update_health_bar()

func get_bpm() -> float:
	return current_bpm

func get_heart_health() -> float:
	return heart_health

func is_critical() -> bool:
	return heart_health < 30.0

func is_dangerous_bpm() -> bool:
	return current_bpm > 160.0

func _on_heart_attack() -> void:
	# Triggered when heart health reaches 0
	print("HEART ATTACK!")
	# Visual feedback
	beat_scale = 0.8
	modulate = Color(1.0, 0.0, 0.0, 1.0)
	await get_tree().create_timer(0.5).timeout
	modulate = Color(1.0, 1.0, 1.0, 1.0)
