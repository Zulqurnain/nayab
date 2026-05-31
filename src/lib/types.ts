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
  content: string; // extracted text content (never raw binary)
}

export type ModelId =
  | "offllama"       // free — self-hosted
  | "gpt-4o-mini"   // paid — OpenAI
  | "claude-haiku"  // paid — Anthropic
  | "gpt-4o"        // paid — OpenAI
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
    id: "offllama",
    name: "Qwen 2.5 (offLLama)",
    provider: "Self-hosted",
    tier: "free",
    description: "Fast local model — free, private, no cloud",
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
