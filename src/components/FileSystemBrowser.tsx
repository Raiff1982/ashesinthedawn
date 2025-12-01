import { useState, useEffect, useRef } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  HardDrive,
  FolderOpen,
  Music,
  Volume2,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import {
  updateDirectoryEntries,
  clearDirectoryEntries,
  type DirectoryEntry,
} from "../lib/projectDirectoryStore";

interface FileNode {
  id: string;
  name: string;
  type: "folder" | "file";
  path: string;
  modified?: string;
  size?: number;
  children?: FileNode[];
}

const FILE_TREE_STORAGE_KEY = "corelogic_file_tree_v1";

const formatSize = (bytes?: number) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes.toFixed(0)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const formatDate = (iso?: string) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
};

const sortNodes = (nodes: FileNode[]): FileNode[] =>
  [...nodes]
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map((node) =>
      node.type === "folder" && node.children
        ? { ...node, children: sortNodes(node.children) }
        : node
    );

const flattenNodes = (nodes: FileNode[], parentPath = ""): DirectoryEntry[] => {
  return nodes.flatMap((node) => {
    const nodePath = node.path || (parentPath ? `${parentPath}/${node.name}` : node.name);
    const entry: DirectoryEntry = {
      id: node.id,
      name: node.name,
      type: node.type,
      path: nodePath,
      size: node.size,
      modified: node.modified,
    };

    if (node.type === "folder" && node.children) {
      return [entry, ...flattenNodes(node.children, nodePath)];
    }

    return [entry];
  });
};

const insertNode = (
  nodes: FileNode[],
  segments: string[],
  file: File,
  parentPath: string
) => {
  const [current, ...rest] = segments;
  const path = parentPath ? `${parentPath}/${current}` : current;

  if (!rest.length) {
    const existingIndex = nodes.findIndex(
      (node) => node.type === "file" && node.path === path
    );

    const fileNode: FileNode = {
      id: `file-${path}`,
      name: current,
      type: "file",
      path,
      size: file.size,
      modified: new Date(file.lastModified).toISOString(),
    };

    if (existingIndex >= 0) {
      nodes[existingIndex] = fileNode;
    } else {
      nodes.push(fileNode);
    }
    return;
  }

  let folder = nodes.find((node) => node.type === "folder" && node.path === path);
  if (!folder) {
    folder = {
      id: `folder-${path}`,
      name: current,
      type: "folder",
      path,
      children: [],
    };
    nodes.push(folder);
  }

  if (!folder.children) folder.children = [];
  insertNode(folder.children, rest, file, path);
};

const buildTreeFromFiles = (files: FileList): FileNode[] => {
  const root: FileNode[] = [];

  Array.from(files).forEach((file) => {
    const relativePath = file.webkitRelativePath || file.name;
    const segments = relativePath.split(/[\\/]/).filter(Boolean);
    if (!segments.length) return;
    insertNode(root, segments, file, "");
  });

  return sortNodes(root);
};

export default function FileSystemBrowser() {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [indexedAt, setIndexedAt] = useState<string | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!fileInputRef.current) return;
    fileInputRef.current.setAttribute("webkitdirectory", "true");
    fileInputRef.current.setAttribute("directory", "true");
    fileInputRef.current.multiple = true;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(FILE_TREE_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed?.tree)) return;
      setFileTree(parsed.tree as FileNode[]);
      setIndexedAt(parsed.indexedAt || null);
      setExpandedFolders(new Set(parsed.expanded || []));
      updateDirectoryEntries(flattenNodes(parsed.tree as FileNode[]));
    } catch (storageError) {
      console.warn("[FileSystemBrowser] Failed to restore tree", storageError);
    }
  }, []);

  const saveTreeToStorage = (tree: FileNode[], expanded: string[]) => {
    if (typeof window === "undefined") return;
    if (!tree.length) {
      window.localStorage.removeItem(FILE_TREE_STORAGE_KEY);
      setIndexedAt(null);
      return;
    }

    const payload = {
      tree,
      indexedAt: new Date().toISOString(),
      expanded,
    };
    window.localStorage.setItem(FILE_TREE_STORAGE_KEY, JSON.stringify(payload));
    setIndexedAt(payload.indexedAt);
  };

  const indexFileList = (files: FileList) => {
    setIsIndexing(true);
    setError(null);

    try {
      const tree = buildTreeFromFiles(files);
      setFileTree(tree);
      const expandedIds = tree
        .filter((node) => node.type === "folder")
        .map((node) => node.id);
      setExpandedFolders(new Set(expandedIds));
      updateDirectoryEntries(flattenNodes(tree));
      saveTreeToStorage(tree, expandedIds);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to index folder";
      setError(message);
    } finally {
      setIsIndexing(false);
    }
  };

  const handleDirectoryInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (!files || !files.length) return;
    indexFileList(files);
    event.target.value = "";
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem(FILE_TREE_STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            window.localStorage.setItem(
              FILE_TREE_STORAGE_KEY,
              JSON.stringify({ ...parsed, expanded: Array.from(next) })
            );
          } catch (storageError) {
            console.warn("[FileSystemBrowser] Failed to persist expansion state", storageError);
          }
        }
      }
      return next;
    });
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith(".wav") || filename.endsWith(".mp3")) {
      return <Volume2 className="w-3 h-3 text-blue-400" />;
    }
    if (filename.endsWith(".cpr") || filename.endsWith(".rpp")) {
      return <Music className="w-3 h-3 text-purple-400" />;
    }
    return <Music className="w-3 h-3 text-gray-400" />;
  };

  const handleClearIndex = () => {
    setFileTree([]);
    setSelectedFile(null);
    setExpandedFolders(new Set());
    setIndexedAt(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(FILE_TREE_STORAGE_KEY);
    }
    clearDirectoryEntries();
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
          {node.type === "file" && (
            <span className="text-xs text-gray-500 w-20 text-right flex-shrink-0">
              {formatSize(node.size)}
            </span>
          )}

          {/* Modified Date - Column 3 (right aligned) */}
          {node.type === "file" && (
            <span className="text-xs text-gray-500 w-28 text-right flex-shrink-0 hidden md:inline">
              {formatDate(node.modified)}
            </span>
          )}
        </div>

        {/* Expanded Children */}
        {node.type === "folder" && expandedFolders.has(node.id) && node.children && (
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
        <div className="flex items-center gap-2 text-xs">
          {error && <span className="text-red-400">{error}</span>}
          {isIndexing && <span className="text-blue-400">Indexing…</span>}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-100 border border-gray-600"
            title="Scan a local folder"
          >
            <RefreshCcw className="w-3 h-3" />
          </button>
          <button
            onClick={handleClearIndex}
            className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-100 border border-gray-600"
            title="Clear indexed folders"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={handleDirectoryInput}
          />
        </div>
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
        {fileTree.length ? (
          <div className="space-y-0">{renderFileTree(fileTree)}</div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2 px-4 text-center">
            <p>No directories indexed yet.</p>
            <p>Click the refresh icon above to scan a folder. Indexed files feed the TopBar project search.</p>
          </div>
        )}
      </div>

      {/* Status Bar - Like REAPER */}
      <div className="px-3 py-1 bg-gray-800 border-t border-gray-700 text-xs text-gray-400 flex-shrink-0 flex items-center justify-between">
        <span>
          📁 Indexed items: {fileTree.length}
          {indexedAt && ` • Updated ${new Date(indexedAt).toLocaleString()}`}
        </span>
        <span className="text-gray-500">Powered by local file indexing</span>
      </div>
    </div>
  );
}
