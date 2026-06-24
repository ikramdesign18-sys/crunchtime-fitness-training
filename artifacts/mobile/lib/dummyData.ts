export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
  tips: string;
  commonMistakes: string;
}

export interface Workout {
  id: string;
  title: string;
  category: string;
  goal: string;
  duration: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  calories: number;
  description: string;
  exercises: Exercise[];
}

export interface Meal {
  name: string;
  calories: number;
  ingredients: string[];
  preparation: string;
}

export interface MealPlan {
  id: string;
  title: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  description: string;
  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
    snacks: Meal;
  };
}

export interface ProgressEntry {
  date: string;
  weight: number;
  bmi: number;
  workoutsCompleted: number;
  caloriesBurned: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  type: "user" | "trainer";
}

export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  sessionType: string;
  date: string;
  time: string;
  note: string;
  status: "pending" | "accepted" | "declined";
}

export interface VideoSubmission {
  id: string;
  clientId: string;
  clientName: string;
  exerciseName: string;
  submittedAt: string;
  status: "submitted" | "reviewed" | "feedback_received";
  note: string;
  feedback?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  goal: string;
  lastActive: string;
  bmi: number;
  progressStatus: "On Track" | "Needs Attention" | "Excellent";
}

export interface AppNotification {
  id: string;
  type: "workout" | "meal" | "booking" | "message" | "video";
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export const WORKOUTS: Workout[] = [
  {
    id: "w1",
    title: "Power Strength",
    category: "Strength",
    goal: "Build Muscle",
    duration: 55,
    difficulty: "Intermediate",
    calories: 480,
    description: "A compound-movement focused program targeting major muscle groups for maximum strength gains.",
    exercises: [
      { id: "e1", name: "Barbell Back Squat", sets: 4, reps: 6, restSeconds: 120, tips: "Keep chest up and knees tracking over toes.", commonMistakes: "Caving knees inward and rounding lower back." },
      { id: "e2", name: "Bench Press", sets: 4, reps: 8, restSeconds: 90, tips: "Retract scapulae and keep feet flat.", commonMistakes: "Bouncing bar off chest and flaring elbows excessively." },
      { id: "e3", name: "Deadlift", sets: 3, reps: 5, restSeconds: 150, tips: "Keep bar close to your body throughout the lift.", commonMistakes: "Rounding the lower back under load." },
      { id: "e4", name: "Pull-Ups", sets: 3, reps: 8, restSeconds: 90, tips: "Full range of motion — start from dead hang.", commonMistakes: "Using momentum instead of lat engagement." },
      { id: "e5", name: "Overhead Press", sets: 3, reps: 10, restSeconds: 90, tips: "Brace your core and squeeze glutes at top.", commonMistakes: "Hyperextending the lower back." },
    ],
  },
  {
    id: "w2",
    title: "HIIT Cardio Blast",
    category: "Cardio",
    goal: "Burn Fat",
    duration: 30,
    difficulty: "Advanced",
    calories: 520,
    description: "High-intensity intervals designed to maximize calorie burn and improve cardiovascular conditioning.",
    exercises: [
      { id: "e6", name: "Burpees", sets: 4, reps: 15, restSeconds: 30, tips: "Maintain a fast pace while keeping form tight.", commonMistakes: "Sagging hips during the push-up phase." },
      { id: "e7", name: "Jump Squats", sets: 4, reps: 20, restSeconds: 30, tips: "Land softly with knees slightly bent.", commonMistakes: "Landing with locked knees causing joint stress." },
      { id: "e8", name: "Mountain Climbers", sets: 4, reps: 30, restSeconds: 30, tips: "Keep hips level and core braced.", commonMistakes: "Letting hips rise or rock side to side." },
      { id: "e9", name: "High Knees", sets: 4, reps: 40, restSeconds: 30, tips: "Drive knees up to hip height with each stride.", commonMistakes: "Looking down instead of keeping head forward." },
    ],
  },
  {
    id: "w3",
    title: "Full Body Burn",
    category: "Full Body",
    goal: "General Fitness",
    duration: 45,
    difficulty: "Intermediate",
    calories: 400,
    description: "A balanced full-body routine hitting all major muscle groups in a single efficient session.",
    exercises: [
      { id: "e10", name: "Goblet Squat", sets: 3, reps: 12, restSeconds: 60, tips: "Hold dumbbell at chest level and push knees out.", commonMistakes: "Letting heels rise off the ground." },
      { id: "e11", name: "Push-Ups", sets: 3, reps: 15, restSeconds: 60, tips: "Keep body in a straight line from head to heels.", commonMistakes: "Flaring elbows at 90 degrees from body." },
      { id: "e12", name: "Dumbbell Row", sets: 3, reps: 12, restSeconds: 60, tips: "Pull elbow toward hip, not shoulder.", commonMistakes: "Rotating torso instead of isolating the back." },
      { id: "e13", name: "Lunges", sets: 3, reps: 10, restSeconds: 60, tips: "Step far enough that knee doesn't pass your toes.", commonMistakes: "Leaning too far forward at the torso." },
      { id: "e14", name: "Plank", sets: 3, reps: 1, restSeconds: 60, tips: "Hold 45 seconds, breathe steadily.", commonMistakes: "Letting hips sag or pike up." },
    ],
  },
  {
    id: "w4",
    title: "Weight Loss Circuit",
    category: "Weight Loss",
    goal: "Lose Weight",
    duration: 40,
    difficulty: "Beginner",
    calories: 380,
    description: "A steady-state circuit keeping heart rate elevated to maximize fat oxidation.",
    exercises: [
      { id: "e15", name: "Bodyweight Squat", sets: 3, reps: 20, restSeconds: 45, tips: "Go to at least parallel depth for full activation.", commonMistakes: "Leaning excessively forward." },
      { id: "e16", name: "Step-Ups", sets: 3, reps: 15, restSeconds: 45, tips: "Drive through the heel of the elevated foot.", commonMistakes: "Using the lower leg to push rather than the raised leg." },
      { id: "e17", name: "Tricep Dips", sets: 3, reps: 12, restSeconds: 45, tips: "Keep elbows pointing back, not flaring out.", commonMistakes: "Dipping too low and stressing the shoulder joint." },
      { id: "e18", name: "Bicycle Crunches", sets: 3, reps: 20, restSeconds: 45, tips: "Rotate shoulders, not just elbows.", commonMistakes: "Pulling on the neck with hands." },
    ],
  },
  {
    id: "w5",
    title: "Muscle Builder Pro",
    category: "Muscle Gain",
    goal: "Gain Muscle",
    duration: 60,
    difficulty: "Advanced",
    calories: 500,
    description: "Hypertrophy-focused program with progressive overload principles for serious muscle building.",
    exercises: [
      { id: "e19", name: "Incline Dumbbell Press", sets: 4, reps: 10, restSeconds: 90, tips: "Control the eccentric phase for 2-3 seconds.", commonMistakes: "Rushing the lowering phase." },
      { id: "e20", name: "Cable Rows", sets: 4, reps: 12, restSeconds: 90, tips: "Squeeze shoulder blades together at peak contraction.", commonMistakes: "Using too much body swing." },
      { id: "e21", name: "Leg Press", sets: 4, reps: 12, restSeconds: 90, tips: "Feet shoulder-width, press through full range.", commonMistakes: "Locking knees at top of movement." },
      { id: "e22", name: "Lateral Raises", sets: 3, reps: 15, restSeconds: 60, tips: "Lead with elbows, slight forward lean.", commonMistakes: "Shrugging shoulders during the raise." },
      { id: "e23", name: "Barbell Curl", sets: 3, reps: 12, restSeconds: 60, tips: "Keep elbows pinned at sides throughout.", commonMistakes: "Swinging the body to complete reps." },
    ],
  },
  {
    id: "w6",
    title: "Athlete Performance",
    category: "Athlete",
    goal: "Improve Performance",
    duration: 70,
    difficulty: "Advanced",
    calories: 650,
    description: "Sport-specific conditioning designed for athletes who need explosive power and endurance.",
    exercises: [
      { id: "e24", name: "Box Jumps", sets: 5, reps: 5, restSeconds: 90, tips: "Land in a soft athletic squat, step down don't jump.", commonMistakes: "Landing with stiff legs or losing balance on landing." },
      { id: "e25", name: "Power Clean", sets: 4, reps: 4, restSeconds: 120, tips: "Drive hips explosively before pulling with arms.", commonMistakes: "Pulling too early with the arms before full hip extension." },
      { id: "e26", name: "Sprint Intervals", sets: 6, reps: 1, restSeconds: 90, tips: "Max effort for 30 seconds, full rest between.", commonMistakes: "Not resting long enough to maintain sprint quality." },
      { id: "e27", name: "Agility Ladder Drills", sets: 3, reps: 5, restSeconds: 60, tips: "Stay on balls of feet, quick precise foot placement.", commonMistakes: "Looking down at feet instead of ahead." },
    ],
  },
  {
    id: "w7",
    title: "Beginner Basics",
    category: "Beginner",
    goal: "General Fitness",
    duration: 35,
    difficulty: "Beginner",
    calories: 250,
    description: "Perfect for those just starting their fitness journey. Learn fundamentals safely.",
    exercises: [
      { id: "e28", name: "Wall Push-Ups", sets: 3, reps: 12, restSeconds: 60, tips: "Keep body in a straight diagonal line.", commonMistakes: "Bending at the hips instead of a straight plank position." },
      { id: "e29", name: "Chair Squats", sets: 3, reps: 10, restSeconds: 60, tips: "Sit back as if sitting in a chair, stand fully.", commonMistakes: "Using arms to push off the chair." },
      { id: "e30", name: "Marching in Place", sets: 3, reps: 30, restSeconds: 45, tips: "Drive knees up and pump arms actively.", commonMistakes: "Shuffling feet instead of lifting knees." },
      { id: "e31", name: "Glute Bridge", sets: 3, reps: 15, restSeconds: 45, tips: "Squeeze glutes at top and hold 2 seconds.", commonMistakes: "Driving through the lower back instead of the glutes." },
    ],
  },
  {
    id: "w8",
    title: "Home Workout",
    category: "Home",
    goal: "General Fitness",
    duration: 30,
    difficulty: "Intermediate",
    calories: 300,
    description: "No equipment needed — a complete workout you can do anywhere with just your bodyweight.",
    exercises: [
      { id: "e32", name: "Decline Push-Ups", sets: 3, reps: 12, restSeconds: 60, tips: "Elevate feet on a chair for added intensity.", commonMistakes: "Letting hips sag during movement." },
      { id: "e33", name: "Jump Lunges", sets: 3, reps: 10, restSeconds: 60, tips: "Switch legs in mid-air, land softly.", commonMistakes: "Landing with front knee past your toes." },
      { id: "e34", name: "Superman Hold", sets: 3, reps: 12, restSeconds: 45, tips: "Lift arms and legs simultaneously, squeeze at top.", commonMistakes: "Only lifting legs and forgetting to raise arms." },
      { id: "e35", name: "Hollow Body Hold", sets: 3, reps: 1, restSeconds: 60, tips: "Press lower back into floor, hold 30 seconds.", commonMistakes: "Letting lower back arch off the floor." },
    ],
  },
];

export const MEAL_PLANS: MealPlan[] = [
  {
    id: "m1",
    title: "Weight Loss Plan",
    category: "Weight Loss",
    calories: 1800,
    protein: 150,
    carbs: 180,
    fat: 55,
    description: "A calorie-controlled plan focused on lean proteins and fiber-rich carbs to support fat loss.",
    meals: {
      breakfast: {
        name: "Greek Yogurt Parfait",
        calories: 350,
        ingredients: ["1 cup non-fat Greek yogurt", "1/2 cup mixed berries", "1/4 cup granola", "1 tbsp honey", "1 tsp chia seeds"],
        preparation: "Layer yogurt in a glass, top with berries, granola, drizzle honey and sprinkle chia seeds. Serve immediately.",
      },
      lunch: {
        name: "Grilled Chicken Salad",
        calories: 450,
        ingredients: ["6oz grilled chicken breast", "2 cups mixed greens", "1/2 cup cherry tomatoes", "1/4 cucumber sliced", "2 tbsp olive oil vinaigrette", "1/4 avocado"],
        preparation: "Grill chicken with herbs, slice and place over mixed greens. Add vegetables, top with avocado and dressing.",
      },
      dinner: {
        name: "Baked Salmon & Veggies",
        calories: 520,
        ingredients: ["6oz salmon fillet", "1 cup broccoli florets", "1 cup asparagus", "1 tbsp olive oil", "Lemon, garlic, herbs"],
        preparation: "Season salmon and vegetables with olive oil, lemon, and garlic. Bake at 400°F for 18-20 minutes.",
      },
      snacks: {
        name: "Apple & Almond Butter",
        calories: 200,
        ingredients: ["1 medium apple", "2 tbsp almond butter"],
        preparation: "Slice apple and serve with almond butter for dipping.",
      },
    },
  },
  {
    id: "m2",
    title: "Muscle Gain Plan",
    category: "Muscle Gain",
    calories: 3000,
    protein: 220,
    carbs: 320,
    fat: 80,
    description: "High-protein, calorie-dense meals designed to fuel muscle synthesis and recovery.",
    meals: {
      breakfast: {
        name: "Power Oatmeal Bowl",
        calories: 680,
        ingredients: ["1.5 cups rolled oats", "1 scoop protein powder", "2 whole eggs + 3 egg whites", "1 banana", "2 tbsp peanut butter", "1 cup whole milk"],
        preparation: "Cook oats in milk, mix in protein powder. Scramble eggs separately. Serve oats topped with banana, peanut butter.",
      },
      lunch: {
        name: "Beef Rice Bowl",
        calories: 780,
        ingredients: ["8oz lean ground beef", "1.5 cups white rice", "1 cup broccoli", "2 tbsp soy sauce", "1 tbsp sesame oil", "Garlic, ginger"],
        preparation: "Brown beef with garlic and ginger, steam rice and broccoli, combine and season with soy sauce and sesame oil.",
      },
      dinner: {
        name: "Chicken Pasta Primavera",
        calories: 850,
        ingredients: ["8oz chicken breast", "2 cups whole wheat pasta", "Mixed vegetables", "2 tbsp olive oil", "Parmesan cheese", "Italian herbs"],
        preparation: "Cook pasta, sauté chicken and vegetables in olive oil with herbs, toss together and top with parmesan.",
      },
      snacks: {
        name: "Protein Shake & Banana",
        calories: 420,
        ingredients: ["2 scoops whey protein", "1.5 cups whole milk", "1 banana", "1 tbsp peanut butter"],
        preparation: "Blend all ingredients until smooth. Consume within 30 minutes post-workout.",
      },
    },
  },
  {
    id: "m3",
    title: "Athlete Performance",
    category: "Athlete",
    calories: 3500,
    protein: 200,
    carbs: 450,
    fat: 90,
    description: "Carbohydrate-rich performance nutrition for high-output athletes needing sustained energy.",
    meals: {
      breakfast: {
        name: "Athlete Breakfast Stack",
        calories: 750,
        ingredients: ["3 whole eggs", "4 egg whites", "3 slices whole grain toast", "1 avocado", "1 cup orange juice", "1 cup berries"],
        preparation: "Scramble eggs, toast bread, mash avocado on toast, serve with fresh OJ and berries on the side.",
      },
      lunch: {
        name: "Turkey Sweet Potato Bowl",
        calories: 900,
        ingredients: ["8oz ground turkey", "2 large sweet potatoes", "1 cup black beans", "Salsa, sour cream", "Cumin, chili powder", "Fresh cilantro"],
        preparation: "Bake sweet potatoes until tender, brown turkey with spices, serve in halved potatoes topped with beans and salsa.",
      },
      dinner: {
        name: "Salmon Quinoa Power Bowl",
        calories: 950,
        ingredients: ["8oz wild salmon", "1.5 cups quinoa", "Edamame, cucumber, avocado", "Sesame ginger dressing", "Nori strips"],
        preparation: "Cook quinoa, grill or bake salmon, assemble bowl with vegetables and toppings, drizzle with dressing.",
      },
      snacks: {
        name: "Energy Trail Mix & Greek Yogurt",
        calories: 500,
        ingredients: ["1/2 cup trail mix (nuts, seeds, dried fruit)", "1 cup Greek yogurt", "1 tbsp honey"],
        preparation: "Mix trail mix into yogurt with honey. Consume 90 minutes before training for optimal energy.",
      },
    },
  },
  {
    id: "m4",
    title: "Balanced Lifestyle",
    category: "Balanced",
    calories: 2200,
    protein: 140,
    carbs: 250,
    fat: 70,
    description: "Flexible, sustainable nutrition for everyday health — balanced macros with whole foods.",
    meals: {
      breakfast: {
        name: "Avocado Toast & Eggs",
        calories: 480,
        ingredients: ["2 slices sourdough bread", "1 ripe avocado", "2 poached eggs", "Red pepper flakes", "Everything bagel seasoning", "Fresh lemon juice"],
        preparation: "Toast bread, mash avocado with lemon and seasoning, top with poached eggs and red pepper flakes.",
      },
      lunch: {
        name: "Mediterranean Wrap",
        calories: 550,
        ingredients: ["1 whole wheat wrap", "4oz grilled chicken", "Hummus", "Cucumber, tomato, olives", "Feta cheese", "Fresh herbs"],
        preparation: "Spread hummus on wrap, layer chicken and vegetables, sprinkle feta, roll tightly and slice diagonally.",
      },
      dinner: {
        name: "Stir-Fry Tofu & Vegetables",
        calories: 520,
        ingredients: ["8oz firm tofu", "Assorted bell peppers, snap peas, bok choy", "Brown rice", "Soy sauce, oyster sauce", "Garlic, ginger, sesame oil"],
        preparation: "Press and cube tofu, stir-fry in sesame oil until golden, add vegetables and sauce, serve over brown rice.",
      },
      snacks: {
        name: "Hummus & Veggie Plate",
        calories: 220,
        ingredients: ["1/2 cup hummus", "Carrot sticks", "Celery", "Bell pepper strips", "Cucumber rounds"],
        preparation: "Arrange fresh vegetables on a plate alongside hummus for dipping.",
      },
    },
  },
];

export const PROGRESS_DATA: ProgressEntry[] = [
  { date: "2025-05-05", weight: 82.5, bmi: 25.4, workoutsCompleted: 3, caloriesBurned: 1200 },
  { date: "2025-05-12", weight: 81.8, bmi: 25.2, workoutsCompleted: 4, caloriesBurned: 1600 },
  { date: "2025-05-19", weight: 81.2, bmi: 25.0, workoutsCompleted: 4, caloriesBurned: 1580 },
  { date: "2025-05-26", weight: 80.5, bmi: 24.8, workoutsCompleted: 5, caloriesBurned: 1900 },
  { date: "2025-06-02", weight: 79.8, bmi: 24.5, workoutsCompleted: 5, caloriesBurned: 2000 },
  { date: "2025-06-09", weight: 79.1, bmi: 24.3, workoutsCompleted: 6, caloriesBurned: 2200 },
  { date: "2025-06-16", weight: 78.5, bmi: 24.1, workoutsCompleted: 5, caloriesBurned: 1950 },
  { date: "2025-06-23", weight: 78.0, bmi: 24.0, workoutsCompleted: 6, caloriesBurned: 2300 },
];

export const CHAT_MESSAGES: ChatMessage[] = [
  { id: "cm1", senderId: "t1", senderName: "Coach Marcus", text: "Hey Alex! How are you feeling after yesterday's strength session?", timestamp: "2025-06-23T09:00:00Z", type: "trainer" },
  { id: "cm2", senderId: "u1", senderName: "Alex", text: "Legs are a bit sore but I feel great overall! The deadlifts hit different this time.", timestamp: "2025-06-23T09:15:00Z", type: "user" },
  { id: "cm3", senderId: "t1", senderName: "Coach Marcus", text: "That soreness means you pushed the right limits. Make sure you're getting enough protein today.", timestamp: "2025-06-23T09:20:00Z", type: "trainer" },
  { id: "cm4", senderId: "u1", senderName: "Alex", text: "Will do! Should I still do the cardio session today or rest?", timestamp: "2025-06-23T09:25:00Z", type: "user" },
  { id: "cm5", senderId: "t1", senderName: "Coach Marcus", text: "Light 20-min walk is fine. Save the HIIT for tomorrow when your legs recover.", timestamp: "2025-06-23T09:30:00Z", type: "trainer" },
  { id: "cm6", senderId: "u1", senderName: "Alex", text: "Perfect. Also, I submitted a squat form video for your review.", timestamp: "2025-06-23T10:00:00Z", type: "user" },
  { id: "cm7", senderId: "t1", senderName: "Coach Marcus", text: "I'll check it out this afternoon and send you detailed feedback.", timestamp: "2025-06-23T10:05:00Z", type: "trainer" },
  { id: "cm8", senderId: "u1", senderName: "Alex", text: "Thanks Coach! One question — should I add weight to the bench press next week?", timestamp: "2025-06-23T14:00:00Z", type: "user" },
  { id: "cm9", senderId: "t1", senderName: "Coach Marcus", text: "Yes, add 5 lbs. Your form has been solid. Watched your last set on video — excellent chest-to-bar contact.", timestamp: "2025-06-23T14:30:00Z", type: "trainer" },
  { id: "cm10", senderId: "u1", senderName: "Alex", text: "That's great to hear. I'll book a session this week to go over the new program too.", timestamp: "2025-06-23T15:00:00Z", type: "user" },
  { id: "cm11", senderId: "t1", senderName: "Coach Marcus", text: "Sounds good! I have Thursday afternoon slots open.", timestamp: "2025-06-23T15:10:00Z", type: "trainer" },
  { id: "cm12", senderId: "u1", senderName: "Alex", text: "Thursday works. Booking it now!", timestamp: "2025-06-23T15:15:00Z", type: "user" },
];

export const BOOKINGS: Booking[] = [
  { id: "b1", clientId: "u1", clientName: "Alex Johnson", sessionType: "Personal Training Session", date: "Jun 26, 2025", time: "10:00 AM", note: "Want to review deadlift form and increase weight safely.", status: "accepted" },
  { id: "b2", clientId: "c2", clientName: "Sarah Chen", sessionType: "Workout Review", date: "Jun 27, 2025", time: "2:00 PM", note: "Need feedback on my weekly program structure.", status: "pending" },
  { id: "b3", clientId: "c3", clientName: "Marcus Williams", sessionType: "Meal Plan Review", date: "Jun 28, 2025", time: "11:00 AM", note: "Not seeing enough weight gain despite eating more.", status: "pending" },
  { id: "b4", clientId: "c4", clientName: "Priya Patel", sessionType: "Fitness Consultation", date: "Jun 25, 2025", time: "3:00 PM", note: "First consultation — new to fitness training.", status: "declined" },
  { id: "b5", clientId: "c5", clientName: "Jordan Lee", sessionType: "Video Call Session", date: "Jun 29, 2025", time: "9:00 AM", note: "Check-in for athlete performance program adjustments.", status: "accepted" },
];

export const VIDEO_SUBMISSIONS: VideoSubmission[] = [
  { id: "v1", clientId: "u1", clientName: "Alex Johnson", exerciseName: "Barbell Squat", submittedAt: "2025-06-22T16:00:00Z", status: "feedback_received", note: "Working on going lower. Not sure if my knees are caving.", feedback: "Great improvement since last week! Your depth is now at parallel. Minor knee cave on the right side at heavy loads — cue yourself to 'push the knees out' as you descend. Reduce weight by 10% and focus on this cue for 2 weeks." },
  { id: "v2", clientId: "c2", clientName: "Sarah Chen", exerciseName: "Pull-Ups", submittedAt: "2025-06-23T09:30:00Z", status: "reviewed", note: "Trying to improve my full range pull-ups.", feedback: "Solid attempt! Start from a dead hang each rep. Your kipping is minimal which is great. Work on the controlled lowering phase." },
  { id: "v3", clientId: "c3", clientName: "Marcus Williams", exerciseName: "Deadlift", submittedAt: "2025-06-23T11:00:00Z", status: "submitted", note: "First time doing conventional deadlift. Please check form." },
  { id: "v4", clientId: "c5", clientName: "Jordan Lee", exerciseName: "Box Jumps", submittedAt: "2025-06-21T14:00:00Z", status: "feedback_received", note: "Working on explosive power for basketball season.", feedback: "Explosive! Good arm drive. Focus on the landing — absorb impact by bending knees immediately. Step down after each rep, don't jump down." },
];

export const CLIENTS: Client[] = [
  { id: "u1", name: "Alex Johnson", email: "user@test.com", goal: "Lose Weight", lastActive: "Today", bmi: 24.0, progressStatus: "On Track" },
  { id: "c2", name: "Sarah Chen", email: "sarah@example.com", goal: "Gain Muscle", lastActive: "Yesterday", bmi: 21.5, progressStatus: "Excellent" },
  { id: "c3", name: "Marcus Williams", email: "marcus@example.com", goal: "Improve Strength", lastActive: "2 days ago", bmi: 27.2, progressStatus: "Needs Attention" },
  { id: "c4", name: "Priya Patel", email: "priya@example.com", goal: "General Fitness", lastActive: "Today", bmi: 22.8, progressStatus: "On Track" },
  { id: "c5", name: "Jordan Lee", email: "jordan@example.com", goal: "Athlete Training", lastActive: "Yesterday", bmi: 23.5, progressStatus: "Excellent" },
  { id: "c6", name: "Taylor Brooks", email: "taylor@example.com", goal: "Improve Conditioning", lastActive: "3 days ago", bmi: 25.8, progressStatus: "Needs Attention" },
];

export const NOTIFICATIONS: AppNotification[] = [
  { id: "n1", type: "message", title: "New message from Coach Marcus", body: "Great work on your last session! Check your feedback.", time: "10m ago", read: false },
  { id: "n2", type: "booking", title: "Session Confirmed", body: "Your Personal Training session on Jun 26 at 10:00 AM is confirmed.", time: "1h ago", read: false },
  { id: "n3", type: "video", title: "Video Feedback Ready", body: "Coach Marcus reviewed your Barbell Squat video. Tap to view feedback.", time: "2h ago", read: false },
  { id: "n4", type: "workout", title: "Workout Reminder", body: "Time for your Full Body Burn session! You're on a 6-day streak.", time: "Yesterday", read: true },
  { id: "n5", type: "meal", title: "Meal Plan Updated", body: "Your Muscle Gain meal plan has been updated for this week.", time: "Yesterday", read: true },
  { id: "n6", type: "workout", title: "Weekly Summary", body: "You completed 6 workouts this week — new personal record!", time: "2 days ago", read: true },
];
