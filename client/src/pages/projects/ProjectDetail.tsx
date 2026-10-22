import { useParams } from "react-router-dom";
import { Header } from "../../components/layout/Header";

export const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <Header title="Project Workspace" subtitle={`Project ID: ${id}`} />
      <div className="flex-1 overflow-y-auto p-6">
        {/* Kanban Board Phase 6 me aayega */}
      </div>
    </div>
  );
};
