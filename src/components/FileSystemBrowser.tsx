import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, HardDrive, FolderOpen, Music, Volume2 } from 'lucide-react';

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
    return <Music className="w-3 h-3 text-gray-400" />;
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
        {/* File/Folder Row - REAPER Style */}
        <div
          className={`flex items-center gap-0 px-2 py-1 border-l-2 transition-all ${
            selectedFile === node.id 
              ? 'bg-blue-900/50 border-blue-500 text-blue-100' 
              : 'hover:bg-gray-800/50 border-transparent hover:border-gray-600 text-gray-300'
          }`}
          style={{ paddingLeft: `${8 + level * 14}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.id);
            }
            setSelectedFile(node.id);
          }}
        >
          {/* Expand/Collapse - Compact */}
          {node.type === 'folder' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(node.id);
              }}
              className="p-0 w-4 h-4 flex items-center justify-center hover:bg-gray-700 rounded transition"
            >
              {expandedFolders.has(node.id) ? (
                <ChevronDown className="w-3 h-3 text-gray-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-400" />
              )}
            </button>
          )}
          {node.type === 'file' && <div className="w-4" />}

          {/* Icon */}
          <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 mx-1">
            {node.type === 'folder' ? (
              expandedFolders.has(node.id) ? (
                <FolderOpen className="w-3 h-3 text-yellow-500" />
              ) : (
                <Folder className="w-3 h-3 text-yellow-500" />
              )
            ) : (
              getFileIcon(node.name)
            )}
          </div>

          {/* Name - Column 1 */}
          <span className="text-xs font-medium flex-1 truncate min-w-40">
            {node.name}
          </span>

          {/* Size - Column 2 (right aligned) */}
          {node.type === 'file' && (
            <span className="text-xs text-gray-500 w-16 text-right flex-shrink-0">
              {formatSize((node.size || 0) * 1024)}
            </span>
          )}

          {/* Modified Date - Column 3 (right aligned) */}
          {node.type === 'file' && (
            <span className="text-xs text-gray-500 w-24 text-right flex-shrink-0 hidden md:inline">
              {node.modified}
            </span>
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
    <div className="w-full h-full flex flex-col bg-gray-950 text-xs border-t border-gray-700">
      {/* Header Bar - Like REAPER */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 border-b border-gray-700 flex-shrink-0 gap-2">
        <div className="font-semibold text-gray-200 flex items-center gap-1.5 whitespace-nowrap">
          <HardDrive className="w-3.5 h-3.5" />
          Project Directory
        </div>
        <input
          type="text"
          placeholder="Search..."
          id="file-search"
          name="file-search"
          autoComplete="off"
          className="text-xs px-2 py-0.5 rounded bg-gray-700 border border-gray-600 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 w-32 flex-shrink-0"
        />
      </div>

      {/* Column Headers - Like REAPER */}
      <div className="flex items-center gap-0 px-2 py-1 bg-gray-900 border-b border-gray-700 flex-shrink-0 text-gray-500 text-xs font-semibold">
        <div className="w-4 h-4" />
        <div className="w-4 h-4 mx-1" />
        <span className="flex-1 min-w-40">Name</span>
        <span className="w-16 text-right">Size</span>
        <span className="w-24 text-right hidden md:inline">Modified</span>
      </div>

      {/* File Tree Container */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="space-y-0">{renderFileTree(fileTree)}</div>
      </div>

      {/* Status Bar - Like REAPER */}
      <div className="px-3 py-1 bg-gray-800 border-t border-gray-700 text-xs text-gray-400 flex-shrink-0 flex items-center justify-between">
        <span>📁 C:\Users\Alan\Documents\GitHub\ashesinthedawn</span>
        <span className="text-gray-500">{fileTree.length} items</span>
      </div>
    </div>
  );
}
