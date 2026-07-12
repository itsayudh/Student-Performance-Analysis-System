// src/hooks/usePaginatedList.js
import { useState, useEffect, useCallback } from "react";
import { parseApiError } from "../utils/apiError";

/**
 * Generic list-fetching state machine for ANY paginated endpoint that
 * follows the backend's standard contract:
 *
 *   fetcher({ page, pageSize, search }) → { items, total, page, page_size }
 *
 * Usage:
 *   const list = usePaginatedList(getStudents);
 *   const list = usePaginatedList(getTeachers);
 *
 * This is the "three strikes" refactor from Layer C, done at strike two —
 * justified because the contract is enforced by the backend itself, so
 * every future list endpoint is guaranteed to fit.
 */
export default function usePaginatedList(fetcher, initial = {}) {
  const [page, setPage] = useState(initial.page ?? 1);
  const [pageSize, setPageSize] = useState(initial.pageSize ?? 25);
  const [search, setSearchRaw] = useState(initial.search ?? "");

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadFlag, setReloadFlag] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetcher({ page, pageSize, search })
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setTotal(data.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(parseApiError(err));
        setItems([]);
        setTotal(0);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // fetcher is intentionally excluded from deps — service functions are
    // stable module-level imports, and including an inline-arrow fetcher
    // would cause an infinite refetch loop.
  }, [page, pageSize, search, reloadFlag]); // eslint-disable-line react-hooks/exhaustive-deps

  const setSearch = useCallback((text) => {
    setSearchRaw(text);
    setPage(1);
  }, []);

  const refetch = useCallback(() => setReloadFlag((f) => f + 1), []);

  return {
    items,
    total,
    isLoading,
    error,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    refetch,
  };
}
