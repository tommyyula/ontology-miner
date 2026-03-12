import { create } from 'zustand';
import { db } from '../services/persistence/db';
import { generateId } from '../lib/id';
import { MiningPhase } from '../types/mining';
import type { MiningProject } from '../types/project';

interface ProjectState {
  projects: MiningProject[];
  loading: boolean;

  loadProjects: () => Promise<void>;
  createProject: (name: string, description: string) => Promise<string>;
  deleteProject: (id: string) => Promise<void>;
  renameProject: (id: string, name: string) => Promise<void>;
  updateProject: (id: string, updates: Partial<MiningProject>) => Promise<void>;
  getProject: (id: string) => Promise<MiningProject | undefined>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  loading: false,

  loadProjects: async () => {
    set({ loading: true });
    const projects = await db.projects.orderBy('updatedAt').reverse().toArray();
    set({ projects, loading: false });
  },

  createProject: async (name: string, description: string) => {
    const id = generateId();
    const now = Date.now();
    const project: MiningProject = {
      id,
      name,
      description,
      createdAt: now,
      updatedAt: now,
      currentPhase: MiningPhase.DOMAIN_INPUT,
      currentStepId: null,
      settings: {
        llmProvider: 'mock',
        llmModel: 'mock',
        language: 'zh',
        maxCQCount: 10,
        maxDepth: 10,
      },
    };
    await db.projects.put(project);
    await get().loadProjects();
    return id;
  },

  deleteProject: async (id: string) => {
    await db.transaction('rw', [db.projects, db.steps, db.concepts, db.relations, db.workflows], async () => {
      await db.projects.delete(id);
      await db.steps.where('projectId').equals(id).delete();
      await db.concepts.where('projectId').equals(id).delete();
      await db.relations.where('projectId').equals(id).delete();
      await db.workflows.where('projectId').equals(id).delete();
    });
    await get().loadProjects();
  },

  renameProject: async (id: string, name: string) => {
    await db.projects.update(id, { name, updatedAt: Date.now() });
    await get().loadProjects();
  },

  updateProject: async (id: string, updates: Partial<MiningProject>) => {
    await db.projects.update(id, { ...updates, updatedAt: Date.now() });
    await get().loadProjects();
  },

  getProject: async (id: string) => {
    return db.projects.get(id);
  },
}));
