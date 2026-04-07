"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface Props {
  hourlyVisits: number[];
}

export function AnalyticsCharts({ hourlyVisits }: Props) {
  const maxHourly = Math.max(...hourlyVisits, 1);
  const peakHour = hourlyVisits.indexOf(Math.max(...hourlyVisits));

  const hasAnyVisits = hourlyVisits.some((v) => v > 0);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" />
          시간대별 방문
          {hasAnyVisits && (
            <span className="text-xs font-normal text-muted-foreground ml-auto">
              피크: {peakHour}시 ({hourlyVisits[peakHour]}명)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasAnyVisits ? (
          <p className="text-sm text-muted-foreground text-center py-4">아직 방문 데이터가 없습니다.</p>
        ) : (
          <div className="space-y-1">
            <div className="flex items-end gap-0.5 h-24">
              {hourlyVisits.map((count, hour) => (
                <div key={hour} className="flex-1 flex flex-col items-center gap-0.5 group">
                  <div
                    className={`w-full rounded-t-sm transition-colors ${
                      hour === peakHour ? "bg-indigo-500" : "bg-indigo-200 group-hover:bg-indigo-400"
                    }`}
                    style={{ height: `${(count / maxHourly) * 100}%`, minHeight: count > 0 ? 2 : 0 }}
                  />
                </div>
              ))}
            </div>
            {/* X축 레이블 — 6시간 단위 */}
            <div className="flex">
              {[0, 6, 12, 18, 23].map((h) => (
                <div
                  key={h}
                  className="text-[10px] text-muted-foreground"
                  style={{ marginLeft: h === 0 ? 0 : `${((h) / 24) * 100 - 2}%` }}
                >
                  {h}시
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
