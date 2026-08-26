import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import ProjectTable from "../components/ProjectTable";
import HoursAnalyticsCard from "../components/HoursAnalyticsCard";
import { projectsApi } from "../services/api";
import { AlertCircle } from "lucide-react";

export default function ManagerProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      const data = await projectsApi.listProjects();
      setProjects(data);
    } catch (err) {
      console.error("Failed to load projects:", err);
      setPageError(
        err.response?.data?.detail || "Failed to fetch project catalog.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreateProject = async (projectData) => {
    await projectsApi.createProject(projectData);
    await loadProjects();
  };

  const handleUpdateProject = async (id, projectData) => {
    await projectsApi.updateProject(id, projectData);
    await loadProjects();
  };

  const handleDeleteProject = async (id) => {
    await projectsApi.deleteProject(id);
    await loadProjects();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {pageError && (
          <div
            role="alert"
            className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start text-xs text-red-700"
          >
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-red-500 mt-0.5" />
            <span>{pageError}</span>
          </div>
        )}

        {/* Projects Section */}
        <section>
          <ProjectTable
            projects={projects}
            loading={loading}
            onCreateProject={handleCreateProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
          />
        </section>

        {/* Analytics Section */}
        <section>
          <HoursAnalyticsCard />
        </section>
      </main>
    </div>
  );
}
