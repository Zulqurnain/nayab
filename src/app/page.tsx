import { ChatInterface } from "@/components/ChatInterface";

export const metadata = {
  title: "Nayab — Private AI Chat powered by offLLama",
  description: "Fast, private AI chat powered by offLLama. Free tier runs on your own server. Upgrade for GPT-4o and Claude Sonnet.",
};

export default function HomePage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <ChatInterface />
    </div>
  );
}
