import { create } from 'zustand';
import type { DataSource } from '../types/datasource';
import { dataSourceService } from '../services/datasource/DataSourceService';

interface DataSourceState {
  dataSources: DataSource[];
  isLoading: boolean;
  error: string | null;

  loadSources: (projectId: string) => Promise<void>;
  addURL: (projectId: string, url: string) => Promise<void>;
  addFile: (projectId: string, file: File) => Promise<void>;
  removeSource: (id: string) => Promise<void>;
  toggleActive: (id: string) => Promise<void>;
  updateTags: (id: string, tags: string[]) => void;
  getActiveContext: () => string;
}

export const useDataSourceStore = create<DataSourceState>((set, get) => ({
  dataSources: [],
  isLoading: false,
  error: null,

  loadSources: async (projectId: string) => {
    const sources = await dataSourceService.getProjectSources(projectId);
    set({ dataSources: sources });
  },

  addURL: async (projectId: string, url: string) => {
    set({ isLoading: true, error: null });
    try {
      const ds = await dataSourceService.fetchURL(url);
      ds.projectId = projectId;
      await dataSourceService.saveDataSource(ds);
      set(s => ({ dataSources: [...s.dataSources, ds], isLoading: false }));
    } catch (e) {
      set({ isLoading: false, error: (e as Error).message });
    }
  },

  addFile: async (projectId: string, file: File) => {
    set({ isLoading: true, error: null });
    try {
      const ds = await dataSourceService.parseFile(file);
      ds.projectId = projectId;
      await dataSourceService.saveDataSource(ds);
      set(s => ({ dataSources: [...s.dataSources, ds], isLoading: false }));
    } catch (e) {
      set({ isLoading: false, error: (e as Error).message });
    }
  },

  removeSource: async (id: string) => {
    await dataSourceService.deleteDataSource(id);
    set(s => ({ dataSources: s.dataSources.filter(d => d.id !== id) }));
  },

  toggleActive: async (id: string) => {
    const ds = get().dataSources.find(d => d.id === id);
    if (!ds) return;
    const newActive = !ds.isActive;
    await dataSourceService.toggleActive(id, newActive);
    set(s => ({
      dataSources: s.dataSources.map(d => d.id === id ? { ...d, isActive: newActive } : d),
    }));
  },

  updateTags: (id: string, tags: string[]) => {
    set(s => ({
      dataSources: s.dataSources.map(d => d.id === id ? { ...d, tags } : d),
    }));
  },

  getActiveContext: () => {
    return dataSourceService.buildContextFromSources(get().dataSources);
  },
}));
