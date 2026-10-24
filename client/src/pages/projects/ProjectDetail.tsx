import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DragDropContext } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import { Users, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Header } from "../../components/layout/Header";
import { KanbanColumn } from "../../components/kanban/KanbanColumn";
import { ProjectMembersModal } from "../../components/projects/ProjectMembersModal";
import { apiClient } from "../../api/axios";
import { joinProjectRoom, leaveProjectRoom } from "../../lib/socket";
import type { ApiResponse, Project, Task, TaskStatus } from "../../types";
import { TaskDetailDrawer } from "../../components/kanban/TaskDetailDrawer";

const COLUMNS: { status: TaskStatus; title: string; colorDot: string }[] = [
  { status: "TODO", title: "To Do", colorDot: "bg-zinc-500" },
  { status: "IN_PROGRESS", title: "In Progress", colorDot: "bg-amber-400" },
  { status: "DONE", title: "Done", colorDot: "bg-emerald-400" },
  { status: "CANCELLED", title: "Cancelled", colorDot: "bg-rose-500" },
];

export const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const queryClient = useQueryClient();

  // Socket: Join project room for live updates
  useEffect(() => {
    if (id) {
      joinProjectRoom(id);
      return () => leaveProjectRoom(id);
    }
  }, [id]);

  // 1. Fetch Project Details
  const {
    data: project,
    isLoading: isProjectLoading,
    isError: isProjectError,
  } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Project>>(`/projects/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  // 2. Fetch Project Tasks
  const { data: tasks = [], isLoading: isTasksLoading } = useQuery({
    queryKey: ["tasks", id],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Task[]>>(
        `/tasks?projectId=${id}`,
      );
      return res.data.data;
    },
    enabled: !!id,
  });

  // Drag & Drop Handler with Optimistic Update
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;
    const movedTaskId = draggableId;

    // Previous tasks snapshot for rollback if API fails
    const previousTasks = queryClient.getQueryData<Task[]>(["tasks", id]) || [];

    // Filter destination column tasks
    const destColumnTasks = previousTasks
      .filter((t) => t.status === newStatus && t.id !== movedTaskId)
      .sort((a, b) => a.order - b.order);

    // Calculate new order
    let newOrder = 0;
    if (destColumnTasks.length === 0) {
      newOrder = 1000;
    } else if (destination.index === 0) {
      newOrder = destColumnTasks[0].order / 2;
    } else if (destination.index >= destColumnTasks.length) {
      newOrder = destColumnTasks[destColumnTasks.length - 1].order + 1000;
    } else {
      const prevOrder = destColumnTasks[destination.index - 1].order;
      const nextOrder = destColumnTasks[destination.index].order;
      newOrder = (prevOrder + nextOrder) / 2;
    }

    // 1. Optimistic Update in Cache
    queryClient.setQueryData<Task[]>(["tasks", id], (oldTasks = []) =>
      oldTasks.map((t) =>
        t.id === movedTaskId ? { ...t, status: newStatus, order: newOrder } : t,
      ),
    );

    // 2. Sync to Backend
    try {
      await apiClient.patch(`/tasks/${movedTaskId}`, {
        status: newStatus,
        order: newOrder,
      });
    } catch (err: any) {
      // Rollback on failure
      queryClient.setQueryData(["tasks", id], previousTasks);
      toast.error("Failed to update task position");
    }
  };

  if (isProjectLoading || isTasksLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#09090b]">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (isProjectError || !project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#09090b] text-center p-6">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
        <h3 className="text-base font-semibold text-zinc-100">
          Project not found
        </h3>
        <p className="text-xs text-zinc-500 mt-1">
          This project may have been deleted or you do not have permission to
          view it.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#09090b]">
      {/* Top Header */}
      <Header
        title={project.name}
        subtitle={project.description || "Kanban Workspace"}
        actions={
          <button
            onClick={() => setIsMembersModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] text-zinc-200 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Members ({project.members?.length || 1})</span>
          </button>
        }
      />

      {/* Kanban Board Canvas */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex items-start gap-4 h-full">
            {COLUMNS.map((col) => {
              const columnTasks = tasks
                .filter((task) => task.status === col.status)
                .sort((a, b) => a.order - b.order);

              return (
                <KanbanColumn
                  key={col.status}
                  status={col.status}
                  title={col.title}
                  colorDot={col.colorDot}
                  tasks={columnTasks}
                  projectId={project.id}
                  onTaskClick={(task) => setSelectedTask(task)}
                />
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Project Members Modal */}
      {isMembersModalOpen && (
        <ProjectMembersModal
          isOpen={isMembersModalOpen}
          onClose={() => setIsMembersModalOpen(false)}
          project={project}
        />
      )}

      {/* Task Details & Comments Drawer */}
      {selectedTask && (
        <TaskDetailDrawer
          task={tasks.find((t) => t.id === selectedTask.id) || selectedTask}
          project={project}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};
