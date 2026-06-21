"use client";

import Container from "@/components/container";
import { proxyScheduleService as scheduleService } from "@/services/client-proxy";
import { ROUTES } from "@/constants/routes";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimeCardGridSkeleton } from "@/components/anime-card-skeleton";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [activeDay, setActiveDay] = useState(DAYS[new Date().getDay()]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    scheduleService.getSchedules()
      .then((res) => {
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setSchedules(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const grouped: Record<string, any[]> = {};
  for (const s of schedules) {
    const day = s.airingDay || s.day || "Unknown";
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(s);
  }

  const currentItems = grouped[activeDay] || [];

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold mb-2">Anime Schedule</h1>
      <p className="text-gray-400 mb-8">Weekly anime airing schedule</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              day === activeDay
                ? "bg-[#e9376b] text-white"
                : "bg-secondary text-gray-300 hover:bg-slate-700"
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {loading ? (
        <AnimeCardGridSkeleton count={10} />
      ) : currentItems.length === 0 ? (
        <p className="text-gray-500">No anime scheduled for {activeDay}.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {currentItems.map((item: any, idx: number) => (
            <Link
              key={idx}
              href={`${ROUTES.ANIME_DETAILS}/${item.slug?.split("/")[0] || item.slug || item.id}`}
              className="flex items-center gap-4 rounded-xl bg-secondary p-4 hover:bg-slate-700 transition-colors"
            >
              <span className="text-sm text-gray-400 w-16 shrink-0">
                {item.time || item.airingTime || ""}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium line-clamp-1">
                  {item.title || item.name || "Unknown"}
                </p>
                <p className="text-xs text-gray-400">
                  {item.episode || item.episodeNumber
                    ? `Episode ${item.episode || item.episodeNumber}`
                    : ""}
                  {item.type ? ` \u2022 ${item.type}` : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
