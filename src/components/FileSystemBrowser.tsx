import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, File, Music, Volume2, Gauge } from 'lucide-react';

interface FileNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  path: string;
  modified?: string;
  size?: number;
  isExpanded?: boolean;
  children?: FileNode[];
}

export default function FileSystemBrowser() {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Mock file structure - in production, this would come from a backend API
  useEffect(() => {
    const mockTree: FileNode[] = [
      {
        id: 'projects',
        name: 'My Projects',
        type: 'folder',
        path: 'C:\\Users\\Alan\\Documents\\My Projects',
        children: [
          {
            id: 'proj1',
            name: 'Electronic Mix',
            type: 'folder',
            path: 'C:\\Users\\Alan\\Documents\\My Projects\\Electronic Mix',
            children: [
              { id: 'track1', name: 'synth_01.wav', type: 'file', path: '', size: 2.4, modified: '11/21/2025' },
              { id: 'track2', name: 'bass_01.wav', type: 'file', path: '', size: 1.8, modified: '11/21/2025' },
              { id: 'track3', name: 'drums_01.wav', type: 'file', path: '', size: 3.2, modified: '11/20/2025' },
            ],
          },
          {
            id: 'proj2',
            name: 'Vocal Session',
            type: 'folder',
            path: 'C:\\Users\\Alan\\Documents\\My Projects\\Vocal Session',
            children: [
              { id: 'vocal1', name: 'vocal_take_1.wav', type: 'file', path: '', size: 1.5, modified: '11/19/2025' },
              { id: 'vocal2', name: 'vocal_take_2.wav', type: 'file', path: '', size: 1.6, modified: '11/19/2025' },
            ],
          },
        ],
      },
      {
        id: 'samples',
        name: 'Samples',
        type: 'folder',
        path: 'C:\\Users\\Alan\\Documents\\Samples',
        children: [
          { id: 'sample1', name: 'drum_kit_01.wav', type: 'file', path: '', size: 0.8, modified: '11/15/2025' },
          { id: 'sample2', name: 'fx_reverb.wav', type: 'file', path: '', size: 0.5, modified: '11/10/2025' },
        ],
      },
      {
        id: 'exports',
        name: 'Exports',
        type: 'folder',
        path: 'C:\\Users\\Alan\\Documents\\Exports',
        children: [
          { id: 'exp1', name: 'mix_v1.wav', type: 'file', path: '', size: 50.2, modified: '11/21/2025' },
          { id: 'exp2', name: 'mix_v2.wav', type: 'file', path: '', size: 48.9, modified: '11/20/2025' },
        ],
      },
    ];
    setFileTree(mockTree);
  }, []);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.wav') || filename.endsWith('.mp3')) {
      return <Volume2 className="w-3 h-3 text-blue-400" />;
    }
    if (filename.endsWith('.cpr') || filename.endsWith('.rpp')) {
      return <Music className="w-3 h-3 text-purple-400" />;
    }
    return <File className="w-3 h-3 text-gray-400" />;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes.toFixed(1)} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderFileTree = (nodes: FileNode[], level: number = 0) => {
    return nodes.map((node) => (
      <div key={node.id}>
        {/* File/Folder Row */}
        <div
          className={`flex items-center gap-1 px-2 py-1 hover:bg-gray-700/50 cursor-pointer transition-colors ${
            selectedFile === node.id ? 'bg-blue-900/40 border-l-2 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.id);
            }
            setSelectedFile(node.id);
          }}
        >
          {/* Expand/Collapse Icon */}
          {node.type === 'folder' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(node.id);
              }}
              className="p-0 hover:bg-gray-600 rounded"
            >
              {expandedFolders.has(node.id) ? (
                <ChevronDown className="w-3 h-3 text-gray-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-400" />
              )}
            </button>
          ) : (
            <div className="w-3" />
          )}

          {/* Icon */}
          {node.type === 'folder' ? (
            <Folder className="w-3 h-3 text-yellow-500 flex-shrink-0" />
          ) : (
            getFileIcon(node.name)
          )}

          {/* Name */}
          <span className="text-xs text-gray-300 flex-1 truncate font-medium">{node.name}</span>

          {/* Metadata (Size & Date) */}
          {node.type === 'file' && (
            <div className="flex items-center gap-3 ml-2 text-xs text-gray-500 flex-shrink-0">
              <span className="w-12 text-right">{formatSize((node.size || 0) * 1024)}</span>
              <span className="w-20 text-right hidden sm:inline">{node.modified}</span>
            </div>
          )}
        </div>

        {/* Expanded Children */}
        {node.type === 'folder' && expandedFolders.has(node.id) && node.children && (
          renderFileTree(node.children, level + 1)
        )}
      </div>
    ));
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-950 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="font-semibold text-gray-200 flex items-center gap-2">
          <Folder className="w-3 h-3" />
          File Browser
        </div>
        <input
          type="text"
          placeholder="Search files..."
          className="text-xs px-2 py-0.5 rounded bg-gray-700 border border-gray-600 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 w-40"
        />
      </div>

      {/* Path Bar */}
      <div className="px-3 py-1 bg-gray-800/50 border-b border-gray-700 text-xs text-gray-400 truncate flex-shrink-0">
        📁 C:\Users\Alan\Documents
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="space-y-0">{renderFileTree(fileTree)}</div>
      </div>

      {/* Footer - Selected File Info */}
      {selectedFile && (
        <div className="px-3 py-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Gauge className="w-3 h-3" />
            <span>Selected: {fileTree[0]?.children?.[0]?.name || 'File'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
