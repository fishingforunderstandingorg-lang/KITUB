export interface NarratorProfile {
  language: string;
  tone: string;
  pace: string;
}

export interface VideoSummary {
  title_hook: string;
  category: string;
  total_duration: string;
  target_aspect_ratio: string;
  art_style: string;
  narrator_profile: NarratorProfile;
}

export interface CharacterBibleEntry {
  character_id: string;
  name: string;
  fixed_visual_description: string;
}

export interface SoundDesign {
  sfx: string;
  ambient_music_mood: string;
}

export interface SceneBreakdown {
  scene_number: number;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  active_characters: string[];
  narration_script: string;
  caption_text: string;
  visual_prompt: string;
  image_to_video_motion: string;
  sound_design: SoundDesign;
}

export interface ProductionPlan {
  video_summary: VideoSummary;
  characters_bible: CharacterBibleEntry[];
  scenes: SceneBreakdown[];
}

export type TargetAspectRatio = '9:16' | '16:9' | '1:1';
export type NarrationLanguagePref = 'auto' | 'Arabic' | 'English';
