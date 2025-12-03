import { useState, useCallback, useEffect } from 'react';
import { getFileMetadataPaginated } from '../lib/database/fileService';

export interface FileMetadata {
  id: string;
  filename: string;
  created_at: string;
}

export interface UsePaginatedFilesReturn {
  files: FileMetadata[];
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  total?: number;
  loading: boolean;
  error: string | null;
  goToPage: (page: number) => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  setPageSize: (size: number) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for paginated file browsing with metadata
 * Optimized for large file lists with efficient pagination
 */
export function usePaginatedFiles(
  initialPageSize: number = 10
): UsePaginatedFilesReturn {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch files for current page
  const fetchPage = useCallback(
    async (page: number, limit: number) => {
      try {
        setLoading(true);
        setError(null);
        const result = await getFileMetadataPaginated(limit, page);

        setFiles(result.data);
        setHasMore(result.hasMore);
        setTotal(result.total);
        setCurrentPage(page);

        console.log(
          `[usePaginatedFiles] Loaded page ${page}, ${result.data.length} files`
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
        setFiles([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load initial page on mount
  useEffect(() => {
    fetchPage(0, pageSize);
  }, [pageSize, fetchPage]);

  const goToPage = useCallback(
    async (page: number) => {
      if (page < 0) return;
      await fetchPage(page, pageSize);
    },
    [pageSize, fetchPage]
  );

  const nextPage = useCallback(async () => {
    if (hasMore) {
      await goToPage(currentPage + 1);
    }
  }, [currentPage, hasMore, goToPage]);

  const prevPage = useCallback(async () => {
    if (currentPage > 0) {
      await goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  const setPageSize = useCallback(
    async (newSize: number) => {
      if (newSize > 0 && Number.isInteger(newSize)) {
        setPageSizeState(newSize);
        await fetchPage(0, newSize);
      }
    },
    [fetchPage]
  );

  const refresh = useCallback(async () => {
    await fetchPage(currentPage, pageSize);
  }, [currentPage, pageSize, fetchPage]);

  return {
    files,
    currentPage,
    pageSize,
    hasMore,
    total,
    loading,
    error,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    refresh,
  };
}
