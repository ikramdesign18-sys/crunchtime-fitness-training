import type { TrainerWorkoutVideo } from "@/lib/supabaseApi";

export interface CatalogWorkout {
  id: string;
  title: string;
  category: TrainerWorkoutVideo["category"];
  goal: string;
  duration: number;
  difficulty: TrainerWorkoutVideo["difficulty"];
  calories: number;
  description: string;
  trainerId: string;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  instructions: string | null;
  tips: string | null;
  commonMistakes: string | null;
  exerciseCount: number;
  isPaid: boolean;
  priceCents: number | null;
  accessType: TrainerWorkoutVideo["access_type"];
  stripePriceId: string | null;
  published: boolean;
}

export function workoutVideoToCatalogWorkout(row: TrainerWorkoutVideo): CatalogWorkout {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    goal: row.category,
    duration: row.duration,
    difficulty: row.difficulty,
    calories: row.calories,
    description: row.description,
    trainerId: row.trainer_id,
    thumbnailUrl: row.thumbnail_url,
    videoUrl: row.video_url,
    instructions: row.instructions,
    tips: row.tips,
    commonMistakes: row.common_mistakes,
    exerciseCount: Math.max(0, Number(row.exercises) || 0),
    isPaid: !!row.is_paid,
    priceCents: row.price_cents,
    accessType: row.access_type,
    stripePriceId: row.stripe_price_id,
    published: row.published,
  };
}
