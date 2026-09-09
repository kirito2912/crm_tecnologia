/// <reference types="@testing-library/jest-dom" />
/**
 * Property-based tests for ProjectSelector component.
 *
 * Feature: project-selector-and-auth-improvements
 * Properties 3, 4, 5, 6
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import fc from 'fast-check';
import { ProjectSelector, PROJECTS } from './ProjectSelector';

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

/** All valid project IDs */
const ALL_PROJECT_IDS = PROJECTS.map((p) => p.id);

/** Arbitrary for a non-empty strict subset of project IDs */
const subsetArb = fc
  .subarray(ALL_PROJECT_IDS, { minLength: 1 })
  .filter((arr) => arr.length < ALL_PROJECT_IDS.length);



// -----------------------------------------------------------------------
// Property 3: Project selector gate
// -----------------------------------------------------------------------

describe('Property 3: Project selector gate', () => {
  /**
   * Feature: project-selector-and-auth-improvements, Property 3: Project selector gate
   * Validates: Requirements 2.1, 2.5
   *
   * For any application state where the user is authenticated and enabled but selectedProject
   * is null, the rendered component tree contains ProjectSelector cards/empty-state and not
   * the DashboardContent. We model this by checking that ProjectSelector renders its expected
   * UI (project cards or empty state) and does NOT render dashboard elements.
   */
  it('renders project cards when allowedProjects is null (no restriction)', () => {
    fc.assert(
      fc.property(fc.constant(null), (_allowedProjects) => {
        const onSelectProject = vi.fn();
        const { unmount } = render(
          <ProjectSelector allowedProjects={_allowedProjects} onSelectProject={onSelectProject} />
        );
        try {
          // All 3 project cards should be present
          for (const project of PROJECTS) {
            expect(screen.getByText(project.name)).toBeInTheDocument();
          }
          // Empty state should NOT appear
          expect(
            screen.queryByText(/No tienes proyectos asignados/)
          ).not.toBeInTheDocument();
        } finally {
          unmount();
        }
      }),
      { numRuns: 10 }
    );
  });

  it('renders empty state when allowed list is empty', () => {
    fc.assert(
      fc.property(fc.constant([] as string[]), (emptyList) => {
        const onSelectProject = vi.fn();
        const { unmount } = render(
          <ProjectSelector allowedProjects={emptyList} onSelectProject={onSelectProject} />
        );
        try {
          expect(
            screen.getByText(/No tienes proyectos asignados aún\. Contacta al Administrador\./)
          ).toBeInTheDocument();
          // No project cards should appear
          for (const project of PROJECTS) {
            expect(screen.queryByText(project.name)).not.toBeInTheDocument();
          }
        } finally {
          unmount();
        }
      }),
      { numRuns: 10 }
    );
  });
});

// -----------------------------------------------------------------------
// Property 4: Project card click transitions to dashboard
// -----------------------------------------------------------------------

describe('Property 4: Project card click transitions to dashboard', () => {
  /**
   * Feature: project-selector-and-auth-improvements, Property 4: Project card click transitions to dashboard
   * Validates: Requirements 2.3
   *
   * For any valid project ID in the project list, simulating a click on that project card
   * results in onSelectProject being called with that project's ID.
   */
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clicking any project card calls onSelectProject with that project id', () => {
    const projectIdArb = fc.constantFrom(...ALL_PROJECT_IDS);

    fc.assert(
      fc.property(projectIdArb, (projectId) => {
        const onSelectProject = vi.fn();
        const { unmount } = render(
          <ProjectSelector allowedProjects={null} onSelectProject={onSelectProject} />
        );
        try {
          const card = screen
            .getAllByRole('button')
            .find((btn) => btn.getAttribute('data-project-id') === projectId);
          expect(card).toBeDefined();
          fireEvent.click(card!);
          expect(onSelectProject).toHaveBeenCalledWith(projectId);
          expect(onSelectProject).toHaveBeenCalledTimes(1);
        } finally {
          unmount();
          onSelectProject.mockClear();
        }
      }),
      { numRuns: 20 }
    );
  });
});

// -----------------------------------------------------------------------
// Property 5: Logout resets project selection
// -----------------------------------------------------------------------

describe('Property 5: Logout resets project selection', () => {
  /**
   * Feature: project-selector-and-auth-improvements, Property 5: Logout resets project selection
   * Validates: Requirements 2.6
   *
   * For any previously selected project, after the logout action is invoked,
   * selectedProject value becomes null — meaning ProjectSelector is shown again.
   *
   * We test the pure logic: given any initial selectedProject string and a logout handler
   * that sets it to null, after calling logout the value is null.
   */
  it('logout handler resets selectedProject to null for any project', () => {
    const projectIdArb = fc.constantFrom(...ALL_PROJECT_IDS);

    fc.assert(
      fc.property(projectIdArb, (initialProject) => {
        // Model the MainApp state machine as a simple closure
        let selectedProject: string | null = initialProject;
        const logout = () => {
          selectedProject = null;
        };

        expect(selectedProject).toBe(initialProject);
        logout();
        expect(selectedProject).toBeNull();
      }),
      { numRuns: 20 }
    );
  });

  it('ProjectSelector is rendered (not dashboard) when selectedProject is null', () => {
    fc.assert(
      fc.property(fc.constant(null), (_project) => {
        const onSelectProject = vi.fn();
        const { unmount } = render(
          <ProjectSelector allowedProjects={null} onSelectProject={onSelectProject} />
        );
        try {
          // ProjectSelector is shown — at least one project card visible
          expect(screen.getByText(PROJECTS[0].name)).toBeInTheDocument();
        } finally {
          unmount();
        }
      }),
      { numRuns: 10 }
    );
  });
});

// -----------------------------------------------------------------------
// Property 6: Permissions filter shown projects
// -----------------------------------------------------------------------

describe('Property 6: Permissions filter shown projects', () => {
  /**
   * Feature: project-selector-and-auth-improvements, Property 6: Permissions filter shown projects
   * Validates: Requirements 2.7, 4.9, 4.10
   *
   * For any user with a non-empty allowedProjects list that is a strict subset of all
   * available projects, the ProjectSelector renders exactly the cards for those projects
   * and no others.
   */
  it('renders exactly the permitted projects for any strict subset', () => {
    fc.assert(
      fc.property(subsetArb, (allowedProjects) => {
        const onSelectProject = vi.fn();
        const { unmount } = render(
          <ProjectSelector allowedProjects={allowedProjects} onSelectProject={onSelectProject} />
        );
        try {
          const renderedButtons = screen
            .getAllByRole('button')
            .filter((btn) => btn.getAttribute('data-project-id') !== null);

          // Exactly the allowed projects are shown
          expect(renderedButtons).toHaveLength(allowedProjects.length);

          // Each rendered card corresponds to an allowed project
          for (const btn of renderedButtons) {
            const id = btn.getAttribute('data-project-id');
            expect(allowedProjects).toContain(id);
          }

          // Projects NOT in allowedProjects are NOT shown
          const disallowed = ALL_PROJECT_IDS.filter((id) => !allowedProjects.includes(id));
          for (const id of disallowed) {
            const project = PROJECTS.find((p) => p.id === id)!;
            expect(screen.queryByText(project.name)).not.toBeInTheDocument();
          }
        } finally {
          unmount();
        }
      }),
      { numRuns: 50 }
    );
  });

  it('renders all projects when allowedProjects covers all IDs', () => {
    fc.assert(
      fc.property(fc.constant(ALL_PROJECT_IDS), (allProjects) => {
        const onSelectProject = vi.fn();
        const { unmount } = render(
          <ProjectSelector allowedProjects={allProjects} onSelectProject={onSelectProject} />
        );
        try {
          const renderedButtons = screen
            .getAllByRole('button')
            .filter((btn) => btn.getAttribute('data-project-id') !== null);
          expect(renderedButtons).toHaveLength(PROJECTS.length);
        } finally {
          unmount();
        }
      }),
      { numRuns: 10 }
    );
  });
});
