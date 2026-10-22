import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { CreateProjectModal } from "../projects/CreateProjectModal";

export const AppLayout = () => {
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090b]">
      {/* Left Sidebar */}
      <Sidebar onOpenCreateProject={() => setIsCreateProjectOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet
          context={{ openCreateProject: () => setIsCreateProjectOpen(true) }}
        />
      </div>

      {/* Global Create Project Modal */}
      {isCreateProjectOpen && (
        <CreateProjectModal
          isOpen={isCreateProjectOpen}
          onClose={() => setIsCreateProjectOpen(false)}
        />
      )}
    </div>
  );
};
