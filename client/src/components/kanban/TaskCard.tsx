import { Draggable } from "@hello-pangea/dnd";
import { Calendar, MessageSquare } from "lucide-react";
import type { Task, Priority } from "../../types";

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: (task: Task) => void;
}

// Priority-based subtle background, border & pill styling
const priorityConfig: Record<
  Priority,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    cardBg: string;
    cardBorder: string;
    hoverBorder: string;
  }
> = {
  URGENT: {
    label: "Urgent",
    bg: "bg-rose-500/15",
    text: "text-rose-400",
    border: "border-rose-500/30",
    cardBg: "bg-gradient-to-b from-[#1c1013] to-[#160d0f]",
    cardBorder: "border-rose-900/40",
    hoverBorder: "hover:border-rose-700/60",
  },
  HIGH: {
    label: "High",
    bg: "bg-orange-500/15",
    text: "text-orange-400",
    border: "border-orange-500/30",
    cardBg: "bg-gradient-to-b from-[#1a120c] to-[#140e0a]",
    cardBorder: "border-orange-900/40",
    hoverBorder: "hover:border-orange-700/60",
  },
  MEDIUM: {
    label: "Med",
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/30",
    cardBg: "bg-gradient-to-b from-[#17140e] to-[#12100b]",
    cardBorder: "border-amber-900/35",
    hoverBorder: "hover:border-amber-700/50",
  },
  LOW: {
    label: "Low",
    bg: "bg-zinc-800/80",
    text: "text-zinc-400",
    border: "border-zinc-700/60",
    cardBg: "bg-[#141416]",
    cardBorder: "border-[#27272a]",
    hoverBorder: "hover:border-zinc-600",
  },
};

export const TaskCard = ({ task, index, onClick }: TaskCardProps) => {
  const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          className={`group border rounded-lg p-3 select-none transition-all cursor-pointer ${
            snapshot.isDragging
              ? "border-indigo-500 shadow-xl shadow-black/70 rotate-1 bg-[#202025]"
              : `${priority.cardBg} ${priority.cardBorder} ${priority.hoverBorder} hover:brightness-110`
          }`}
        >
          {/* Top Row: Priority Badge & Due Date */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span
              className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${priority.bg} ${priority.text} ${priority.border}`}
            >
              {priority.label}
            </span>

            {task.dueDate && (
              <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                <Calendar className="w-3 h-3 text-zinc-500" />
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="text-xs font-medium text-zinc-200 line-clamp-2 leading-snug group-hover:text-zinc-100 transition-colors">
            {task.title}
          </h4>

          {/* Description snippet if exists */}
          {task.description && (
            <p className="text-[11px] text-zinc-500 mt-1 line-clamp-1">
              {task.description}
            </p>
          )}

          {/* Footer: Comments Count & Assignee Avatar */}
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5 text-[11px] text-zinc-500">
            <div className="flex items-center gap-1">
              {(task._count?.comments || 0) > 0 ? (
                <span className="flex items-center gap-1 text-zinc-400 hover:text-zinc-300">
                  <MessageSquare className="w-3 h-3" />
                  <span>{task._count?.comments}</span>
                </span>
              ) : (
                <span className="text-[10px] text-zinc-600 font-mono">
                  #{task.id.slice(0, 4)}
                </span>
              )}
            </div>

            {/* Assignee Circle */}
            {task.assignee ? (
              <div
                className="w-5 h-5 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-[9px] font-semibold text-indigo-300"
                title={`Assigned to ${task.assignee.name}`}
              >
                {task.assignee.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <span className="text-[10px] text-zinc-600 italic">
                Unassigned
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};