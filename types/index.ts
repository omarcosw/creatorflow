
import { LucideIcon } from 'lucide-react';

export enum AgentId {
  EXECUTIVE_PRODUCER = 'executive_producer',
  PROD_EXECUTIVE_AGENT = 'prod_executive_agent',
  SCRIPT_GENERATOR = 'script_generator',
  COST_CALCULATOR = 'cost_calculator',
  BUDGET_PRICING = 'budget_pricing',
  BUDGET_SHEET = 'budget_sheet',
  SHOT_LIST = 'shot_list', // New Agent ID
  
  LIGHTING_ASSISTANT = 'lighting_assistant',
  LIGHTING_GENERATOR = 'lighting_generator',
  LIGHTING_STYLES = 'lighting_styles',
  
  EDITING_WORKFLOW = 'editing_workflow',
  EDITING_SHORTCUTS = 'editing_shortcuts',
  EDITING_IDEA = 'editing_idea',
  EDITING_TECHNIQUES = 'editing_techniques',

  SFX_ASSISTANT = 'sfx_assistant',
  SFX_SCENE_DESCRIBER = 'sfx_scene_describer',
  SFX_LIBRARY = 'sfx_library',
  SFX_PACK_CREATOR = 'sfx_pack_creator',

  STORYBOARD_GENERATOR = 'storyboard_generator',
  MEDIA_ASSISTANT = 'media_assistant',
  
  IMAGE_GENERATOR = 'image_generator',
  VIDEO_PROMPTS = 'video_prompts',
  YOUTUBE_SEO = 'youtube_seo',
  INSTAGRAM_CAPTIONS = 'instagram_captions',
}

export interface ShotItem {
  id: string;
  scene: string;
  description: string;
  isCompleted: boolean;
}

export interface ShotList {
  id: string;
  title: string;
  items: ShotItem[];
  createdAt: number;
}

export interface InstagramProfile {
  id: string;
  name: string;
  niche: string;
  audience: string;
  tone: string;
  goal: string;
  hashtags: string;
  createdAt: number;
}

export interface BrandKit {
  id: string;
  name: string;
  tone: 'Formal' | 'Criativo';
  color: string; // Hex code
  logo?: string; // Base64 Data URI
  footerText: string;
  createdAt: number;
}

export interface PresetDetails {
  steps: string[];
  usage: string;
  pros: string[];
  cons: string[];
  visualGuides?: { title: string; url: string }[];
  techniques?: StylePreset[];
}

export interface StylePreset {
  id: string;
  title: string;
  description: string;
  prompt: string;
  thumbnail?: string;
  gifUrl?: string;
  audioUrl?: string;
  details?: PresetDetails;
}

export interface AgentConfig {
  id: AgentId;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  systemInstruction: string;
  placeholder: string;
  initialMessage?: string;
  stylePresets?: StylePreset[];
  isLocked?: boolean;
  externalUrl?: string;
}

export interface Feedback {
  rating: 'good' | 'bad';
  comment?: string;
  timestamp: number;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  image?: string;
  audio?: string; // Base64 audio data
  timestamp: number;
  feedback?: Feedback;
}

export interface ChatSession {
  id: string;
  agentId: AgentId;
  profileId?: string;
  brandKitId?: string; // Track which brand kit was used
  title: string;
  messages: Message[];
  createdAt: number;
  lastUpdated: number;
}
