import { ChevronRight } from "lucide-react";
import { MessageCircle } from "lucide-react";
import type { ConversationPreview } from "@/types";

interface ConversationListProps {
  conversations: ConversationPreview[];
  activeConversationId?: string | null;
  loading: boolean;
  onSelect: (conversationId: string) => void;
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}

function truncateMessage(message: string, maxLength: number = 50): string {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + '...';
}

export function ConversationList({ conversations, activeConversationId, loading, onSelect }: ConversationListProps) {
  return (
    <div className="h-full rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-6 flex items-center justify-between px-2">
        <div>
          <h3 className="text-lg font-semibold">Conversations</h3>
          <p className="text-sm text-slate-600">Select a conversation to begin chatting.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 px-2">
          <div className="h-20 rounded-3xl bg-slate-100" />
          <div className="h-20 rounded-3xl bg-slate-100" />
          <div className="h-20 rounded-3xl bg-slate-100" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
          No conversations yet. Start a chat from an order or vendor page.
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conversation) => (
            <button
              key={conversation.otherUserId}
              onClick={() => onSelect(conversation.otherUserId)}
              className={`flex w-full items-center justify-between gap-4 rounded-3xl border px-4 py-4 text-left transition hover:border-slate-300 ${
                activeConversationId === conversation.otherUserId
                  ? "border-slate-300 bg-slate-50"
                  : "border-transparent bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700">
                  <div className="relative">
                  {conversation.avatarUrl ? (
                    <img src={conversation.avatarUrl} alt={conversation.displayName} className="h-12 w-12 rounded-2xl object-cover" />
                  ) : (
                    conversation.displayName
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                  )}
                    {/* Online indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-900">{conversation.displayName}</p>
                    <span className="flex-shrink-0 text-xs text-slate-500">{formatTime(conversation.lastMessageAt)}</span>
                  </div>
                  <p className="truncate text-sm text-slate-600">{truncateMessage(conversation.lastMessage)}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {conversation.unreadCount > 0 && (
                  <span className="rounded-full bg-blue-500 px-2.5 py-1 text-xs font-semibold text-white">
                    {conversation.unreadCount}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
