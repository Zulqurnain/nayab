/**
 * Layer 1: Chat page — moved from / to /chat
 */
import { ChatInterface } from "@/components/ChatInterface";

export const metadata = {
  title: "Nayab Chat — AI Assistant",
  description: "Chat with Nayab, a fast private AI assistant powered by offLLama.",
};

export default function ChatPage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <ChatInterface />
    </div>
  );
}
