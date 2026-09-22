import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTENT_PIECE_STAGES, CONTENT_PIECE_STAGE_LABELS, type ContentPieceStage } from "@/lib/production/types";

export type PieceCardData = {
  id: string;
  title: string;
  channel: { id: string; name: string } | null;
  assignee: { id: string; name: string } | null;
};

const STAGE_ITEMS = Object.fromEntries(CONTENT_PIECE_STAGES.map((s) => [s, CONTENT_PIECE_STAGE_LABELS[s]]));

export function PieceCard({
  piece,
  currentStage,
  dragging,
  canDelete,
  onDelete,
  onChangeStage,
}: {
  piece: PieceCardData;
  currentStage?: ContentPieceStage;
  dragging?: boolean;
  canDelete?: boolean;
  onDelete?: () => void;
  onChangeStage?: (pieceId: string, toStage: ContentPieceStage) => void;
}) {
  return (
    <div
      className={cn(
        "group flex flex-col gap-2 rounded-lg border border-border bg-card p-3 text-sm shadow-sm transition-shadow hover:shadow-md",
        dragging && "opacity-60 shadow-lg"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="leading-snug font-medium">{piece.title}</p>
        {canDelete && onDelete && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Xoá "${piece.title}"`}
            className="opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        {piece.channel ? (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{piece.channel.name}</span>
        ) : (
          <span />
        )}
        {piece.assignee && (
          <Avatar size="sm">
            <AvatarFallback>{piece.assignee.name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
      </div>
      {currentStage && onChangeStage && (
        <div onPointerDown={(e) => e.stopPropagation()}>
          <Select items={STAGE_ITEMS} value={currentStage} onValueChange={(v) => v && onChangeStage(piece.id, v as ContentPieceStage)}>
            <SelectTrigger size="sm" className="w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTENT_PIECE_STAGES.map((s) => (
                <SelectItem key={s} value={s}>
                  {CONTENT_PIECE_STAGE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
