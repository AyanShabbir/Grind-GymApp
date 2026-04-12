export const WORKOUT_PLAN = {
  Monday: {
    name: "Push A",
    focus: "Chest Focus",
    muscles: "Chest · Shoulders · Triceps",
    type: "push",
    exercises: [
      { id: "pa1", name: "Barbell Bench Press", sets: 4, reps: "6–8", notes: "3 sec down, pause, explode up", type: "compound" },
      { id: "pa2", name: "Incline Dumbbell Press", sets: 3, reps: "10–12", notes: "Upper chest emphasis", type: "compound" },
      { id: "pa3", name: "Cable Fly", sets: 3, reps: "12–15", notes: "Full stretch at bottom, squeeze at top", type: "isolation" },
      { id: "pa4", name: "Dumbbell Shoulder Press", sets: 3, reps: "8–10", notes: "Controlled, no flaring elbows", type: "compound" },
      { id: "pa5", name: "Lateral Raises", sets: 3, reps: "12–15", notes: "Slow and controlled — no swinging", type: "isolation" },
      { id: "pa6", name: "Tricep Rope Pushdown", sets: 3, reps: "12–15", notes: "Squeeze at bottom", type: "isolation" },
      { id: "pa7", name: "Overhead Dumbbell Tricep Extension", sets: 3, reps: "12–15", notes: "Full stretch at top", type: "isolation" },
    ],
    cardio: "10 min treadmill walk after"
  },
  Tuesday: {
    name: "Pull A",
    focus: "Back Focus",
    muscles: "Back · Biceps · Abs",
    type: "pull",
    exercises: [
      { id: "pua1", name: "Lat Pulldown", sets: 4, reps: "8–10", notes: "Pull to upper chest, full stretch at top", type: "compound" },
      { id: "pua2", name: "Cable Row", sets: 4, reps: "8–10", notes: "Chest up, elbows back, squeeze", type: "compound" },
      { id: "pua3", name: "1-Arm Dumbbell Row", sets: 3, reps: "10–12", notes: "Full range of motion", type: "compound" },
      { id: "pua4", name: "Rear Delt Fly (Pec Deck)", sets: 3, reps: "12–15", notes: "Light weight, full contraction", type: "isolation" },
      { id: "pua5", name: "EZ Bar Curl", sets: 3, reps: "10–12", notes: "No swinging, full squeeze at top", type: "isolation" },
      { id: "pua6", name: "Hammer Curls", sets: 3, reps: "10–12", notes: "Targets brachialis — adds arm thickness", type: "isolation" },
      { id: "pua7", name: "Hanging Leg Raises", sets: 3, reps: "15", notes: "", type: "core" },
      { id: "pua8", name: "Cable Crunch", sets: 3, reps: "15", notes: "", type: "core" },
    ],
    cardio: "10 min treadmill walk after"
  },
  Wednesday: {
    name: "Legs A",
    focus: "Quad Focus",
    muscles: "Quads · Hamstrings · Glutes · Calves",
    type: "legs",
    exercises: [
      { id: "la1", name: "Barbell Squat", sets: 4, reps: "6–8", notes: "King of all exercises — full depth", type: "compound" },
      { id: "la2", name: "Leg Press", sets: 3, reps: "10–12", notes: "Feet shoulder width, full range", type: "compound" },
      { id: "la3", name: "Romanian Deadlift (RDL)", sets: 3, reps: "10–12", notes: "Feel the hamstring stretch — slow and controlled", type: "compound" },
      { id: "la4", name: "Hip Thrust", sets: 3, reps: "10–12", notes: "Squeeze glutes hard at the top", type: "compound" },
      { id: "la5", name: "Calf Raises", sets: 4, reps: "15–20", notes: "Pause at top and bottom", type: "isolation" },
      { id: "la6", name: "Plank", sets: 3, reps: "45 sec", notes: "", type: "core" },
      { id: "la7", name: "Bicycle Crunches", sets: 3, reps: "20", notes: "", type: "core" },
    ],
    cardio: "10 min bicycle warmup only"
  },
  Thursday: {
    name: "Push B",
    focus: "Shoulder Focus",
    muscles: "Chest · Shoulders · Triceps",
    type: "push",
    exercises: [
      { id: "pb1", name: "Dumbbell Chest Press (Flat)", sets: 4, reps: "8–10", notes: "Greater range of motion than barbell", type: "compound" },
      { id: "pb2", name: "Chest Dips", sets: 3, reps: "10–12", notes: "Lean forward slightly for chest emphasis", type: "compound" },
      { id: "pb3", name: "Pectoral Fly Machine", sets: 3, reps: "12–15", notes: "Constant tension throughout", type: "isolation" },
      { id: "pb4", name: "Upright Barbell Row", sets: 3, reps: "10–12", notes: "Lighter / higher reps — protect shoulders", type: "compound" },
      { id: "pb5", name: "Lateral Raises", sets: 3, reps: "12–15", notes: "Drop set on last set", type: "isolation" },
      { id: "pb6", name: "Skull Crushers (EZ Bar)", sets: 3, reps: "10–12", notes: "Control the weight, don't rush", type: "isolation" },
    ],
    cardio: "10 min treadmill walk after"
  },
  Friday: {
    name: "Pull B",
    focus: "Width & Thickness",
    muscles: "Back · Biceps · Abs",
    type: "pull",
    exercises: [
      { id: "pub1", name: "Wide Grip Lat Pulldown", sets: 4, reps: "8–10", notes: "Wider grip = more lat width", type: "compound" },
      { id: "pub2", name: "Wide Cable Row", sets: 4, reps: "10–12", notes: "Elbows out — more upper back activation", type: "compound" },
      { id: "pub3", name: "Seated Cable Pulldown (Close Grip)", sets: 3, reps: "10–12", notes: "Pull to lower chest", type: "compound" },
      { id: "pub4", name: "Rear Delt Fly (Dumbbells)", sets: 3, reps: "12–15", notes: "Bent over, slow and controlled", type: "isolation" },
      { id: "pub5", name: "Incline Dumbbell Curl", sets: 3, reps: "10–12", notes: "Greater stretch = more growth", type: "isolation" },
      { id: "pub6", name: "Concentration Curl", sets: 2, reps: "12–15", notes: "Peak contraction focus", type: "isolation" },
      { id: "pub7", name: "Russian Twists", sets: 3, reps: "20", notes: "", type: "core" },
      { id: "pub8", name: "Mountain Climbers", sets: 3, reps: "30 sec", notes: "", type: "core" },
    ],
    cardio: "10 min treadmill walk after"
  },
  Saturday: {
    name: "Legs B",
    focus: "Hamstring Focus",
    muscles: "Hamstrings · Quads · Glutes · Calves",
    type: "legs",
    exercises: [
      { id: "lb1", name: "Romanian Deadlift (RDL)", sets: 4, reps: "8–10", notes: "Heavier than Legs A — push the weight", type: "compound" },
      { id: "lb2", name: "Leg Curl Machine", sets: 3, reps: "10–12", notes: "Slow down phase — 3 seconds", type: "isolation" },
      { id: "lb3", name: "Walking Lunges", sets: 3, reps: "12/leg", notes: "Long stride for glute activation", type: "compound" },
      { id: "lb4", name: "Leg Press", sets: 3, reps: "10–12", notes: "Higher foot placement = more hamstring", type: "compound" },
      { id: "lb5", name: "Hip Thrust", sets: 3, reps: "10–12", notes: "Add weight from Legs A", type: "compound" },
      { id: "lb6", name: "Calf Raises", sets: 4, reps: "15–20", notes: "", type: "isolation" },
      { id: "lb7", name: "Plank", sets: 3, reps: "45 sec", notes: "", type: "core" },
      { id: "lb8", name: "Hanging Leg Raises", sets: 3, reps: "15", notes: "", type: "core" },
    ],
    cardio: "10 min bicycle warmup only"
  },
  Sunday: {
    name: "Rest",
    focus: "Recovery",
    muscles: "Full body rest",
    type: "rest",
    exercises: [],
    cardio: "Optional"
  }
};

export const MEAL_PLAN = [
  {
    time: "Morning",
    name: "Breakfast",
    calories: 380,
    icon: "🌅",
    items: ["Tea", "4 Boiled Eggs", "2 Brown Bread slices"],
    protein: 32,
    note: "Non-negotiable. Always 4 eggs."
  },
  {
    time: "Lunch — Pick One",
    name: "Flexible Lunch",
    icon: "🏢",
    items: ["Tuna Subway (best — 35-40g)", "Oikos Greek Yogurt (30g)", "Protein Shake (30g)", "Peanuts/Cashews (10-15g)"],
    protein: 35,
    calories: 500,
    note: "Tuna Subway whenever possible."
  },
  {
    time: "After Work · Pre Gym",
    name: "Pre-Gym Fuel",
    icon: "⚡",
    items: ["PB on Brown Bread", "Tea", "+2 Eggs if light lunch"],
    protein: 18,
    calories: 280,
    note: "Add 2 eggs if lunch was yogurt or shake."
  },
  {
    time: "Post Gym",
    name: "Protein Shake",
    icon: "💪",
    items: ["Whey in water — 1 serving"],
    protein: 30,
    calories: 150,
    note: "Within 30–45 mins after gym."
  },
  {
    time: "Dinner",
    name: "Whatever cooked",
    icon: "🍽️",
    items: ["Less rice", "Limit heavy gravies"],
    protein: 40,
    calories: 650,
    note: "Bigger portion of meat/daal."
  },
  {
    time: "Dessert",
    name: "Fruit Chaat",
    icon: "🍓",
    items: ["Seasonal fruits", "No added sugar"],
    protein: 2,
    calories: 120,
    note: "Replaces ice cream permanently."
  }
];