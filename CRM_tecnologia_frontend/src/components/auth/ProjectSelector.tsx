import React from 'react';
import { Database, Cloud, Brain } from 'lucide-react';

export interface Project {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
}

export const PROJECTS: Project[] = [
  {
    id: 'bigdata',
    name: 'BIG DATA',
    icon: Database,
    description: 'Análisis masivo de datos, pipelines de ingesta y procesamiento distribuido.',
  },
  {
    id: 'cloud-aws',
    name: 'TECNOLOGÍA CLOUD CON AWS',
    icon: Cloud,
    description: 'Infraestructura cloud, servicios administrados y arquitecturas escalables en AWS.',
  },
  {
    id: 'azure-ai',
    name: 'AI-900T00 CONCEPTOS BÁSICOS DE IA EN MICROSOFT AZURE',
    icon: Brain,
    description: 'Fundamentos de inteligencia artificial y servicios cognitivos en Microsoft Azure.',
  },
];

interface ProjectSelectorProps {
  allowedProjects: string[] | null;
  onSelectProject: (projectId: string) => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  allowedProjects,
  onSelectProject,
}) => {
  // When allowedProjects is non-null, filter to only those IDs
  const visibleProjects =
    allowedProjects === null
      ? PROJECTS
      : PROJECTS.filter((p) => allowedProjects.includes(p.id));

  return (
    <div className="project-selector-wrapper">
      {/* Header */}
      <div className="project-selector-header">
        <div className="brand-logo-icon" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="14" width="5.5" height="14" rx="2.75" fill="#4f5bc9" opacity="0.85" />
            <rect x="13.25" y="6" width="5.5" height="22" rx="2.75" fill="#4f5bc9" />
            <rect x="22.5" y="10" width="5.5" height="18" rx="2.75" fill="#7e87e8" />
          </svg>
        </div>
        <div>
          <h1 className="project-selector-title">DataTech Analytics</h1>
          <p className="project-selector-subtitle">Selecciona el proyecto en el que vas a trabajar hoy</p>
        </div>
      </div>

      {/* Cards grid or empty state */}
      {visibleProjects.length === 0 ? (
        <div className="project-selector-empty">
          <p>No tienes proyectos asignados aún. Contacta al Administrador.</p>
        </div>
      ) : (
        <div className="project-cards-grid">
          {visibleProjects.map((project) => {
            const Icon = project.icon;
            return (
              <button
                key={project.id}
                className="project-card"
                onClick={() => onSelectProject(project.id)}
                data-project-id={project.id}
              >
                <div className="project-card-icon">
                  <Icon size={32} strokeWidth={1.5} />
                </div>
                <h2 className="project-card-name">{project.name}</h2>
                <p className="project-card-desc">{project.description}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectSelector;
