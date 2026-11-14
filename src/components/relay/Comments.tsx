import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { timeAgo, type CommentItem, type CommentTarget } from "@/lib/relay";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function CommentList({ comments }: { comments: CommentItem[] }) {
  if (comments.length === 0) {
    return (
      <p className="text-[11.5px] leading-5 text-muted-foreground">
        No notes yet. Add context the next person will need.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {comments.map((comment) => (
        <li key={comment.id} className="flex gap-2.5">
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-white/80 text-[10px] font-semibold text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            {comment.authorName.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-baseline gap-x-2 text-[11px]">
              <span className="font-semibold text-[oklch(0.36_0.03_240)]">
                {comment.authorName}
              </span>
              <span className="text-muted-foreground">
                {timeAgo(comment.createdAt)}
              </span>
            </p>
            <p className="mt-0.5 text-[11.5px] leading-5 text-[oklch(0.42_0.03_240)]">
              {comment.body}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Composer({
  onSend,
  busy,
}: {
  onSend: (body: string) => Promise<void>;
  busy?: boolean;
}) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!body.trim() || sending || busy) return;
    setSending(true);
    try {
      await onSend(body);
      setBody("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not post the note.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3">
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={2}
        maxLength={600}
        aria-label="Add a note to the discussion"
        placeholder="Add a note for the team…"
        className="w-full resize-none rounded-xl border border-white/90 bg-white/60 px-3 py-2.5 text-[11.5px] leading-5 outline-none transition placeholder:text-muted-foreground/75 focus:border-[oklch(0.82_0.05_212)] focus:bg-white/80 focus:ring-2 focus:ring-[oklch(0.74_0.06_212)]/25"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[10px] text-muted-foreground">
          Visible to the whole team
        </span>
        <Button
          type="submit"
          size="sm"
          variant="outline"
          className="h-8 border-white/90 bg-white/75 text-[11px]"
          disabled={sending || busy || body.trim().length === 0}
        >
          {sending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Send className="size-3" />
          )}
          Post note
        </Button>
      </div>
    </form>
  );
}

/** Controlled discussion, used inside the approval cards. */
export function Discussion({
  comments,
  onSend,
  busy,
}: {
  comments: CommentItem[];
  onSend: (body: string) => Promise<void>;
  busy?: boolean;
}) {
  return (
    <div>
      <CommentList comments={comments} />
      <Composer onSend={onSend} busy={busy} />
    </div>
  );
}

/** Self-contained thread for catalog entries. */
export function CommentThread({
  targetType,
  targetId,
}: {
  targetType: CommentTarget;
  targetId: string;
}) {
  const comments = useQuery(api.comments.list, { targetType, targetId });
  const addComment = useMutation(api.comments.add);

  return (
    <section className="glass rounded-[1.35rem] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[10.5px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          <MessageSquare className="size-3.5 text-primary" />
          Discussion
        </h2>
        <span className="text-[10.5px] text-muted-foreground">
          {comments?.length ?? 0} note{comments?.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className={cn("mt-3", comments === undefined && "opacity-60")}>
        {comments === undefined ? (
          <p className="text-[11.5px] text-muted-foreground">Loading notes…</p>
        ) : (
          <CommentList comments={comments} />
        )}
      </div>
      <Composer
        onSend={async (body) => {
          await addComment({ targetType, targetId, body });
        }}
      />
    </section>
  );
}
