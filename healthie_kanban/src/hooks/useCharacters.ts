import { useState, useEffect, useCallback, useRef } from "react";
import type { Character } from "../types";

const GRAPHQL_URL = "https://rickandmortyapi.com/graphql";

const QUERY = `
  query GetCharacters($page: Int, $filter: FilterCharacter) {
    characters(page: $page, filter: $filter) {
      info {
        pages
        next
      }
      results {
        id
        name
        image
        status
      }
    }
  }
`;

interface CharactersResponse {
  data: {
    characters: {
      info: { pages: number; next: number | null };
      results: Character[];
    } | null;
  };
}

async function fetchPage(
  pageNum: number,
  searchTerm: string,
  signal: AbortSignal
): Promise<{ results: Character[]; hasNext: boolean }> {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: QUERY,
      variables: {
        page: pageNum,
        filter: searchTerm ? { name: searchTerm } : null,
      },
    }),
    signal,
  });

  if (res.status === 429) {
    throw new Error("RATE_LIMITED");
  }

  const json: CharactersResponse = await res.json();
  const charData = json.data?.characters;

  if (!charData) {
    return { results: [], hasNext: false };
  }

  return { results: charData.results, hasNext: charData.info.next !== null };
}

export function useCharacters() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Abort controller for cancelling stale requests
  const abortRef = useRef<AbortController | null>(null);
  // Guard against concurrent loadMore calls
  const loadingMoreRef = useRef(false);

  // Initial fetch + search (debounced in useEffect)
  useEffect(() => {
    const timeout = setTimeout(() => {
      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setPage(1);

      fetchPage(1, search, controller.signal)
        .then(({ results, hasNext }) => {
          if (controller.signal.aborted) return;
          setCharacters(results);
          setHasMore(hasNext);
          setError(null);
        })
        .catch((e) => {
          if (controller.signal.aborted) return;
          if (e instanceof Error && e.message === "RATE_LIMITED") {
            setError("Rate limited — wait a moment and try again");
          } else if (e instanceof DOMException && e.name === "AbortError") {
            return;
          } else {
            setError("Failed to fetch characters");
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 500);

    return () => clearTimeout(timeout);
  }, [search]);

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);

    const controller = new AbortController();
    const nextPage = page + 1;

    fetchPage(nextPage, search, controller.signal)
      .then(({ results, hasNext }) => {
        if (controller.signal.aborted) return;
        setCharacters((prev) => [...prev, ...results]);
        setHasMore(hasNext);
        setPage(nextPage);
        setError(null);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof Error && e.message === "RATE_LIMITED") {
          setError("Rate limited — wait a moment");
        }
      })
      .finally(() => {
        loadingMoreRef.current = false;
        if (!controller.signal.aborted) setLoadingMore(false);
      });
  }, [hasMore, page, search]);

  return { characters, loading, loadingMore, error, search, setSearch, loadMore, hasMore };
}
