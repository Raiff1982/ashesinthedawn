import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { X, FolderOpen, RefreshCcw, DownloadCloud, Loader2 } from 'lucide-react';
import { useDAW } from '../../contexts/DAWContext';
import { supabase } from '../../lib/supabase';
import { loadProjectFromStorage, saveProjectToStorage } from '../../lib/projectStorage';
import type { Project } from '../../types';

interface ProjectListItem {
  id: string;
  name: string;
  updatedAt: string;
  sizeLabel: string;
  trackCount: number;
  source: 'local' | 'cloud';
}

export default function OpenProjectModal() {
  const { showOpenProjectModal, closeOpenProjectModal, loadProject } = useDAW();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items: ProjectListItem[] = [];

      const localProject = loadProjectFromStorage();
      if (localProject) {
        const updatedAt = localProject.updatedAt || localProject.createdAt || new Date().toISOString();
        items.push({
          id: localProject.id,
          name: `${localProject.name} (Local)` ,
          updatedAt,
          sizeLabel: `${localProject.tracks.length} tracks @ ${localProject.sampleRate} Hz`,
          trackCount: localProject.tracks.length,
          source: 'local',
        });
      }

      const { data, error: supabaseError } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (supabaseError) {
        throw supabaseError;
      }

      const cloudItems = (data || []).map((project: any) => ({
        id: project.id,
        name: project.name || 'Untitled Project',
        updatedAt: project.updated_at || project.created_at || new Date().toISOString(),
        sizeLabel: `${project.session_data?.tracks?.length ?? 0} tracks @ ${project.sample_rate || 44100} Hz`,
        trackCount: project.session_data?.tracks?.length ?? 0,
        source: 'cloud' as const,
      }));

      const merged = [...items];
      cloudItems.forEach((item) => {
        if (!merged.find((existing) => existing.id === item.id)) {
          merged.push(item);
        }
      });

      setProjects(merged);
      setSelectedProject((prev) => {
        if (prev && merged.some((item) => item.id === prev)) {
          return prev;
        }
        return merged[0]?.id ?? null;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load projects';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showOpenProjectModal) {
      fetchProjects();
    }
  }, [showOpenProjectModal, fetchProjects]);

  const filteredProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter((project) =>
      project.name.toLowerCase().includes(term)
    );
  }, [projects, searchTerm]);

  const handleOpen = async () => {
    if (selectedProject) {
      await loadProject(selectedProject);
      closeOpenProjectModal();
    }
  };

  const handleLocalFileBrowse = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Project;
      if (parsed?.id && Array.isArray(parsed.tracks)) {
        saveProjectToStorage(parsed);
        await loadProject(parsed.id);
        closeOpenProjectModal();
      } else {
        throw new Error('Invalid project file');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid project file';
      setError(message);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!showOpenProjectModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl p-6 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Open Project</h2>
          <button
            onClick={closeOpenProjectModal}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Search/Filter */}
          <div>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>
              {filteredProjects.length} project{filteredProjects.length === 1 ? '' : 's'} available
              {isLoading && ' • Loading...'}
            </span>
            <div className="flex items-center gap-2">
              {error && <span className="text-red-400">{error}</span>}
              <button
                onClick={fetchProjects}
                className="px-2 py-1 bg-gray-800 border border-gray-700 rounded hover:border-gray-500 flex items-center gap-1"
              >
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
                Refresh
              </button>
            </div>
          </div>

          {/* Recent Projects */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Recent Projects</h3>
            <div className="space-y-2">
              {filteredProjects.length === 0 && !isLoading && (
                <div className="p-3 border border-dashed border-gray-700 rounded text-gray-500 text-sm text-center">
                  No projects found. Save a project or import one from disk.
                </div>
              )}
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project.id)}
                  className={`p-3 border rounded cursor-pointer transition ${
                    selectedProject === project.id
                      ? 'bg-blue-600/20 border-blue-500'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FolderOpen className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-200">{project.name}</p>
                        <p className="text-xs text-gray-500">
                          Updated {project.updatedAt ? new Date(project.updatedAt).toLocaleString() : 'Unknown'} • {project.sizeLabel}
                        </p>
                        <p className="text-[11px] text-gray-500 uppercase tracking-wide">{project.source === 'cloud' ? 'Cloud Sync' : 'Local Storage'}</p>
                      </div>
                    </div>
                    {selectedProject === project.id && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* File Browser */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Or Browse Files</h3>
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition text-sm flex items-center gap-2 justify-center"
              >
                <DownloadCloud className="w-4 h-4" />
                Import Project JSON...
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json,.corelogic,.cls"
                hidden
                onChange={handleLocalFileBrowse}
              />
            </>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={closeOpenProjectModal}
            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition"
          >
            Cancel
          </button>
          <button
            onClick={handleOpen}
            disabled={!selectedProject}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Open
          </button>
        </div>
      </div>
    </div>
  );
}
