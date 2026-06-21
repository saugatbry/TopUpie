"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export type WatchHistory = {
  id: string;
  current: number;
  timestamp: number;
  episodeId: string;
  episodeNumber: number;
  created: string;
};

export type Bookmark = {
  id: string;
  animeId: string;
  thumbnail: string;
  animeTitle: string;
  status: string;
  created: string;
  expand?: {
    watchHistory: WatchHistory[];
  };
};

const BOOKMARKS_KEY = "topupie_bookmarks";

function getBookmarks(): Bookmark[] {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveBookmarks(bookmarks: Bookmark[]) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

type Props = {
  animeID?: string;
  status?: string;
  page?: number;
  per_page?: number;
  populate?: boolean;
};

function useBookMarks({
  animeID,
  status,
  page = 1,
  per_page = 20,
  populate = true,
}: Props) {
  const [bookmarks, setBookmarks] = useState<Bookmark[] | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!populate) return;
    setIsLoading(true);
    try {
      let items = getBookmarks();
      if (animeID) items = items.filter((b) => b.animeId === animeID);
      if (status) items = items.filter((b) => b.status === status);
      items.sort((a, b) => (b.created || "").localeCompare(a.created || ""));
      const total = items.length;
      const start = (page - 1) * per_page;
      const paged = items.slice(start, start + per_page);
      setBookmarks(paged.length > 0 ? paged : null);
      setTotalPages(Math.ceil(total / per_page) || 1);
    } catch {
      setBookmarks(null);
    }
    setIsLoading(false);
  }, [animeID, status, page, per_page, populate]);

  const createOrUpdateBookMark = useCallback(
    async (
      animeId: string,
      animeTitle: string,
      animeThumbnail: string,
      newStatus: string,
      showToast = true,
    ): Promise<string | null> => {
      try {
        const items = getBookmarks();
        const existing = items.find((b) => b.animeId === animeId);

        if (existing) {
          if (existing.status === newStatus) {
            if (showToast) toast.error("Already in this status", { style: { background: "red" } });
            return existing.id;
          }
          existing.status = newStatus;
          saveBookmarks(items);
          if (showToast) toast.success("Status updated", { style: { background: "green" } });
          return existing.id;
        } else {
          const newBookmark: Bookmark = {
            id: uid(),
            animeId,
            thumbnail: animeThumbnail,
            animeTitle,
            status: newStatus,
            created: new Date().toISOString(),
          };
          items.push(newBookmark);
          saveBookmarks(items);
          if (showToast) toast.success("Added to list", { style: { background: "green" } });
          return newBookmark.id;
        }
      } catch {
        return null;
      }
    },
    [],
  );

  const syncWatchProgress = useCallback(
    async (
      bookmarkId: string | null,
      watchedRecordId: string | null,
      episodeData: { episodeId: string; episodeNumber: number; current: number; duration: number },
    ): Promise<string | null> => {
      try {
        const items = getBookmarks();
        const bm = items.find((b) => b.id === bookmarkId);
        if (!bm) return watchedRecordId;

        const history = bm.expand?.watchHistory || [];
        const existingIdx = history.findIndex((h) => h.id === watchedRecordId);

        const entry: WatchHistory = {
          id: watchedRecordId || uid(),
          current: Math.round(episodeData.current),
          timestamp: Math.round(episodeData.duration),
          episodeId: episodeData.episodeId,
          episodeNumber: episodeData.episodeNumber,
          created: new Date().toISOString(),
        };

        if (existingIdx >= 0) {
          history[existingIdx] = entry;
        } else {
          history.push(entry);
        }

        if (!bm.expand) bm.expand = { watchHistory: [] };
        bm.expand.watchHistory = history;
        saveBookmarks(items);
        return entry.id;
      } catch {
        return watchedRecordId;
      }
    },
    [],
  );

  return { bookmarks, syncWatchProgress, createOrUpdateBookMark, totalPages, isLoading };
}

export default useBookMarks;
