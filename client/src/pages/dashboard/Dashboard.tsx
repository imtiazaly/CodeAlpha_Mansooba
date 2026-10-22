import { Header } from "../../components/layout/Header";

export const Dashboard = () => {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <Header
        title="Projects Dashboard"
        subtitle="Manage your team workspaces"
      />
      <div className="flex-1 overflow-y-auto p-6">
        {/* Projects Grid Phase 5 me aayega */}
      </div>
    </div>
  );
};
