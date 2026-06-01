export type Role = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  attachments?: Attachment[];
  timestamp: number;
  isStreaming?: boolean;
}

export interface Attachment {
  name: string;
  type: string;
  content: string;
}

export type ModelId =
  | "llmizeoff"      // free — self-hosted llmizeOFF runtime
  | "groq-llama"     // free — Groq cloud (sub-1s, Llama 3.1 8B)
  | "gpt-4o-mini"    // paid — OpenAI
  | "claude-haiku"   // paid — Anthropic
  | "gpt-4o"         // paid — OpenAI
  | "claude-sonnet"; // paid — Anthropic

export interface Model {
  id: ModelId;
  name: string;
  provider: string;
  tier: "free" | "paid";
  description: string;
}

export const MODELS: Model[] = [
  {
    id: "llmizeoff",
    name: "Llama 3.2 1B (llmizeOFF)",
    provider: "llmizeOFF · Self-hosted",
    tier: "free",
    description: "Private local inference — Meta Llama 3.2, no cloud, no data sent anywhere",
  },
  {
    id: "groq-llama",
    name: "Llama 3.1 8B (Groq)",
    provider: "Groq · Free cloud",
    tier: "free",
    description: "Free cloud inference — sub-1-second responses via Groq LPU",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    tier: "paid",
    description: "Capable and fast — great for most tasks",
  },
  {
    id: "claude-haiku",
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    tier: "paid",
    description: "Anthropic's fastest model",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    tier: "paid",
    description: "OpenAI's most capable model",
  },
  {
    id: "claude-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    tier: "paid",
    description: "Anthropic's best model",
  },
];

export interface LicenseState {
  isValid: boolean;
  key: string;
  validatedAt: number;
}

export interface ChatRequest {
  messages: Array<{ role: Role; content: string }>;
  model: ModelId;
  searchEnabled?: boolean;
  searchQuery?: string;
}
