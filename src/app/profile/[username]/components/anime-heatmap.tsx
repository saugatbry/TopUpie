import React, { useEffect, useState } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import { useAuthStore } from "@/store/auth-store";
import { Tooltip } from "react-tooltip";
import styles from "../heatmap.module.css";

type HeatmapValue = {
  date: string;
  count: number;
};

function getWatchHistoryFromStorage() {
  try {
    const raw = localStorage.getItem("topupie_bookmarks");
    if (!raw) return [];
    const bookmarks = JSON.parse(raw);
    const histories: { created: string }[] = [];
    for (const bm of bookmarks) {
      const wh = bm.expand?.watchHistory || [];
      for (const entry of wh) {
        if (entry.created) histories.push({ created: entry.created });
      }
    }
    return histories;
  } catch {
    return [];
  }
}

function AnimeHeatmap() {
  const { auth } = useAuthStore();
  const [heatmapData, setHeatmapData] = useState<HeatmapValue[]>([]);
  const [totalContributionCount, setTotalContributionCount] = useState(0);

  const startDate = new Date(new Date().setMonth(0, 1));
  const endDate = new Date(new Date().setMonth(11, 31));

  useEffect(() => {
    if (!auth?.id) return;
    try {
      const watched = getWatchHistoryFromStorage();
      const dailyCounts: Record<string, number> = {};
      let total = 0;
      for (const w of watched) {
        const dateStr = w.created.substring(0, 10);
        dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
        total++;
      }
      setHeatmapData(
        Object.entries(dailyCounts).map(([date, count]) => ({ date, count })),
      );
      setTotalContributionCount(total);
    } catch {
      setHeatmapData([]);
      setTotalContributionCount(0);
    }
  }, [auth?.id]);

  const getClassForValue = (value: HeatmapValue | null): string => {
    if (!value || value.count === 0) return styles.colorEmpty;
    if (value.count >= 10) return styles.colorScale4;
    if (value.count >= 5) return styles.colorScale3;
    if (value.count >= 2) return styles.colorScale2;
    return styles.colorScale1;
  };

  return (
    <>
      <p className="text-lg font-bold mb-4">
        Watched {totalContributionCount} episodes in the last year
      </p>
      <CalendarHeatmap
        weekdayLabels={["", "M", "", "W", "", "F", ""]}
        showWeekdayLabels
        showOutOfRangeDays
        startDate={startDate}
        endDate={endDate}
        classForValue={(value) => getClassForValue(value as HeatmapValue)}
        values={heatmapData}
        gutterSize={2}
        tooltipDataAttrs={(value: any) => {
          const v = value as HeatmapValue | null;
          if (!v?.date) {
            return { "data-tip": "No episodes watched" } as any;
          }
          const d = new Date(v.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          return { "data-tip": `Watched ${v.count} episodes on ${d}` } as any;
        }}
      />
      <Tooltip id="heatmap-tooltip" />
    </>
  );
}

export default AnimeHeatmap;
