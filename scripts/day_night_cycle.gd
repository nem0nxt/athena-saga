extends Node3D

@export var day_duration: float = 120.0  # Full day cycle in seconds (2 minutes default)
@export var start_time: float = 0.25  # 0.0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset

var time_of_day: float = 0.25
var sun: DirectionalLight3D = null
var environment: Environment = null
var sky_material: ProceduralSkyMaterial = null

# Sky colors for different times
const DAWN_SKY_TOP = Color(0.4, 0.3, 0.5)
const DAWN_HORIZON = Color(0.9, 0.5, 0.3)
const DAY_SKY_TOP = Color(0.2, 0.4, 0.8)
const DAY_HORIZON = Color(0.6, 0.7, 0.9)
const DUSK_SKY_TOP = Color(0.3, 0.2, 0.4)
const DUSK_HORIZON = Color(0.9, 0.4, 0.2)
const NIGHT_SKY_TOP = Color(0.02, 0.02, 0.08)
const NIGHT_HORIZON = Color(0.05, 0.05, 0.15)

# Sun colors
const DAWN_SUN = Color(1.0, 0.6, 0.4)
const DAY_SUN = Color(1.0, 0.95, 0.9)
const DUSK_SUN = Color(1.0, 0.5, 0.3)
const NIGHT_SUN = Color(0.2, 0.2, 0.4)

# Ambient light
const DAWN_AMBIENT = Color(0.5, 0.4, 0.4)
const DAY_AMBIENT = Color(0.5, 0.5, 0.6)
const DUSK_AMBIENT = Color(0.4, 0.3, 0.4)
const NIGHT_AMBIENT = Color(0.1, 0.1, 0.2)

func _ready() -> void:
	time_of_day = start_time
	call_deferred("_find_references")

func _find_references() -> void:
	# Find DirectionalLight3D (sun)
	sun = _find_node_of_type(get_tree().root, "DirectionalLight3D")
	
	# Find WorldEnvironment
	var world_env = _find_node_of_type(get_tree().root, "WorldEnvironment")
	if world_env:
		environment = world_env.environment
		if environment and environment.sky:
			sky_material = environment.sky.sky_material as ProceduralSkyMaterial

func _find_node_of_type(node: Node, type_name: String) -> Node:
	if node.get_class() == type_name:
		return node
	for child in node.get_children():
		var result = _find_node_of_type(child, type_name)
		if result:
			return result
	return null

func _process(delta: float) -> void:
	time_of_day += delta / day_duration
	if time_of_day >= 1.0:
		time_of_day -= 1.0
	
	_update_sun_position()
	_update_sky_colors()
	_update_sun_color()
	_update_ambient_light()

func _update_sun_position() -> void:
	if not sun:
		return
	
	# Sun angle: 0.0 = midnight (below horizon), 0.5 = noon (overhead)
	var sun_angle = time_of_day * TAU  # Full rotation
	
	# Sun rotates around X axis (east to west)
	# At time 0.25 (sunrise), sun is at horizon (angle = 0)
	# At time 0.5 (noon), sun is overhead (angle = 90)
	# At time 0.75 (sunset), sun is at horizon (angle = 180)
	var elevation = sin((time_of_day - 0.25) * TAU) * 80.0  # -80 to +80 degrees
	
	sun.rotation_degrees.x = -elevation - 15  # Offset for nice shadows
	sun.rotation_degrees.y = time_of_day * 360.0  # Rotate around

func _update_sky_colors() -> void:
	if not sky_material:
		return
	
	var sky_top: Color
	var sky_horizon: Color
	
	if time_of_day < 0.2:  # Night to dawn
		var t = time_of_day / 0.2
		sky_top = NIGHT_SKY_TOP.lerp(DAWN_SKY_TOP, t)
		sky_horizon = NIGHT_HORIZON.lerp(DAWN_HORIZON, t)
	elif time_of_day < 0.3:  # Dawn to day
		var t = (time_of_day - 0.2) / 0.1
		sky_top = DAWN_SKY_TOP.lerp(DAY_SKY_TOP, t)
		sky_horizon = DAWN_HORIZON.lerp(DAY_HORIZON, t)
	elif time_of_day < 0.7:  # Day
		sky_top = DAY_SKY_TOP
		sky_horizon = DAY_HORIZON
	elif time_of_day < 0.8:  # Day to dusk
		var t = (time_of_day - 0.7) / 0.1
		sky_top = DAY_SKY_TOP.lerp(DUSK_SKY_TOP, t)
		sky_horizon = DAY_HORIZON.lerp(DUSK_HORIZON, t)
	elif time_of_day < 0.9:  # Dusk to night
		var t = (time_of_day - 0.8) / 0.1
		sky_top = DUSK_SKY_TOP.lerp(NIGHT_SKY_TOP, t)
		sky_horizon = DUSK_HORIZON.lerp(NIGHT_HORIZON, t)
	else:  # Night
		sky_top = NIGHT_SKY_TOP
		sky_horizon = NIGHT_HORIZON
	
	sky_material.sky_top_color = sky_top
	sky_material.sky_horizon_color = sky_horizon

func _update_sun_color() -> void:
	if not sun:
		return
	
	var sun_color: Color
	var sun_energy: float
	
	if time_of_day < 0.2:  # Night
		sun_color = NIGHT_SUN
		sun_energy = 0.1
	elif time_of_day < 0.3:  # Dawn
		var t = (time_of_day - 0.2) / 0.1
		sun_color = NIGHT_SUN.lerp(DAWN_SUN, t)
		sun_energy = lerp(0.1, 0.7, t)
	elif time_of_day < 0.4:  # Dawn to day
		var t = (time_of_day - 0.3) / 0.1
		sun_color = DAWN_SUN.lerp(DAY_SUN, t)
		sun_energy = lerp(0.7, 1.0, t)
	elif time_of_day < 0.6:  # Day
		sun_color = DAY_SUN
		sun_energy = 1.0
	elif time_of_day < 0.7:  # Day to dusk
		var t = (time_of_day - 0.6) / 0.1
		sun_color = DAY_SUN.lerp(DUSK_SUN, t)
		sun_energy = lerp(1.0, 0.7, t)
	elif time_of_day < 0.8:  # Dusk
		var t = (time_of_day - 0.7) / 0.1
		sun_color = DUSK_SUN.lerp(NIGHT_SUN, t)
		sun_energy = lerp(0.7, 0.1, t)
	else:  # Night
		sun_color = NIGHT_SUN
		sun_energy = 0.1
	
	sun.light_color = sun_color
	sun.light_energy = sun_energy

func _update_ambient_light() -> void:
	if not environment:
		return
	
	var ambient: Color
	
	if time_of_day < 0.2:  # Night
		ambient = NIGHT_AMBIENT
	elif time_of_day < 0.3:  # Dawn
		var t = (time_of_day - 0.2) / 0.1
		ambient = NIGHT_AMBIENT.lerp(DAWN_AMBIENT, t)
	elif time_of_day < 0.4:  # Dawn to day
		var t = (time_of_day - 0.3) / 0.1
		ambient = DAWN_AMBIENT.lerp(DAY_AMBIENT, t)
	elif time_of_day < 0.6:  # Day
		ambient = DAY_AMBIENT
	elif time_of_day < 0.7:  # Day to dusk
		var t = (time_of_day - 0.6) / 0.1
		ambient = DAY_AMBIENT.lerp(DUSK_AMBIENT, t)
	elif time_of_day < 0.8:  # Dusk to night
		var t = (time_of_day - 0.7) / 0.1
		ambient = DUSK_AMBIENT.lerp(NIGHT_AMBIENT, t)
	else:  # Night
		ambient = NIGHT_AMBIENT
	
	environment.ambient_light_color = ambient

func get_time_string() -> String:
	var hours = int(time_of_day * 24.0)
	var minutes = int((time_of_day * 24.0 - hours) * 60.0)
	return "%02d:%02d" % [hours, minutes]

func is_night() -> bool:
	return time_of_day < 0.25 or time_of_day > 0.75
