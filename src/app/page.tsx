import { ChatInterface } from "@/components/ChatInterface";

export const metadata = {
  title: "Nayab — Live Demo of llmizeOFF",
  description: "Try llmizeOFF live. A self-hosted LLM runtime. 4 free prompts, no sign-up.",
};

export default function HomePage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <ChatInterface />
    </div>
  );
}
