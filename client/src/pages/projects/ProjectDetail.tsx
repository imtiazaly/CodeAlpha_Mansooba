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
import { getSocket, joinProjectRoom, leaveProjectRoom } from "../../lib/socket";
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
  const [activeTab, setActiveTab] = useState<TaskStatus | "ALL">("TODO");

  const queryClient = useQueryClient();

  // Socket: Join project room for live updates
  useEffect(() => {
    if (!id) return;

    joinProjectRoom(id);
    const socket = getSocket();

    if (socket) {
      // Live Task Events
      const handleTaskCreated = () => {
        queryClient.invalidateQueries({ queryKey: ["tasks", id] });
      };
      const handleTaskUpdated = () => {
        queryClient.invalidateQueries({ queryKey: ["tasks", id] });
      };
      const handleTaskDeleted = () => {
        queryClient.invalidateQueries({ queryKey: ["tasks", id] });
      };

      // Live Comments Events
      const handleCommentCreated = (data: { taskId: string }) => {
        queryClient.invalidateQueries({ queryKey: ["comments", data.taskId] });
        queryClient.invalidateQueries({ queryKey: ["tasks", id] });
      };
      const handleCommentDeleted = (data: { taskId: string }) => {
        queryClient.invalidateQueries({ queryKey: ["comments", data.taskId] });
        queryClient.invalidateQueries({ queryKey: ["tasks", id] });
      };

      // Live Members Events
      const handleMemberChange = () => {
        queryClient.invalidateQueries({ queryKey: ["project", id] });
      };

      socket.on("task:created", handleTaskCreated);
      socket.on("task:updated", handleTaskUpdated);
      socket.on("task:deleted", handleTaskDeleted);
      socket.on("comment:created", handleCommentCreated);
      socket.on("comment:deleted", handleCommentDeleted);
      socket.on("member:added", handleMemberChange);
      socket.on("member:removed", handleMemberChange);

      return () => {
        leaveProjectRoom(id);
        socket.off("task:created", handleTaskCreated);
        socket.off("task:updated", handleTaskUpdated);
        socket.off("task:deleted", handleTaskDeleted);
        socket.off("comment:created", handleCommentCreated);
        socket.off("comment:deleted", handleCommentDeleted);
        socket.off("member:added", handleMemberChange);
        socket.off("member:removed", handleMemberChange);
      };
    }

    return () => leaveProjectRoom(id);
  }, [id, queryClient]);

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
        `/tasks?projectId=${id}&limit=500`,
      );
      return res.data.data || [];
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
            className="flex items-center gap-1.5 bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] text-zinc-200 text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Project Members"
          >
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Members</span>
            <span className="text-[10px] text-zinc-400 font-mono">
              ({project.members?.length || 1})
            </span>
          </button>
        }
      />

      {/* ── Mobile / Tablet Column Selector (< 1024px) ── */}
      <div className="lg:hidden flex items-center gap-1.5 px-3 py-2 border-b border-[#27272a] bg-[#0c0c0e] overflow-x-auto no-scrollbar shrink-0">
        {COLUMNS.map((col) => {
          const count = tasks.filter((t) => t.status === col.status).length;
          const isActive = activeTab === col.status;
          return (
            <button
              key={col.status}
              onClick={() => setActiveTab(col.status)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-[#18181b] border border-[#27272a] text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white" : col.colorDot}`}
              />
              <span>{col.title}</span>
              <span
                className={`text-[10px] font-mono ${isActive ? "text-indigo-200" : "text-zinc-500"}`}
              >
                ({count})
              </span>
            </button>
          );
        })}

        {/* View all columns option */}
        <button
          onClick={() => setActiveTab("ALL")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
            activeTab === "ALL"
              ? "bg-indigo-600 text-white"
              : "bg-[#18181b] border border-[#27272a] text-zinc-400 hover:text-zinc-200"
          }`}
        >
          All Board
        </button>
      </div>

      {/* ── Kanban Canvas ── */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-3 sm:p-5">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div
            className={`flex items-start gap-3 lg:gap-4 h-full w-full ${
              activeTab === "ALL"
                ? "min-w-max lg:min-w-0"
                : "max-w-2xl mx-auto lg:max-w-none"
            }`}
          >
            {COLUMNS.map((col) => {
              // Mobile par sirf active tab dikhega (ya sab agar ALL ho). Desktop par hamesha sabhi dikhenge.
              const isVisibleOnMobile =
                activeTab === "ALL" || activeTab === col.status;
              const columnTasks = tasks
                .filter((task) => task.status === col.status)
                .sort((a, b) => a.order - b.order);

              return (
                <div
                  key={col.status}
                  className={`h-full flex flex-col ${
                    isVisibleOnMobile ? "flex" : "hidden lg:flex"
                  } ${
                    activeTab === "ALL"
                      ? "w-70 sm:w-[320px] lg:w-auto lg:flex-1 shrink-0 lg:shrink"
                      : "w-full lg:w-auto lg:flex-1 shrink-0 lg:shrink"
                  }`}
                >
                  <KanbanColumn
                    status={col.status}
                    title={col.title}
                    colorDot={col.colorDot}
                    tasks={columnTasks}
                    projectId={project.id}
                    onTaskClick={(task) => setSelectedTask(task)}
                  />
                </div>
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
