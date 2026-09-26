"use client";

import { useState } from "react";
import Link from "next/link";
import { toBengaliNumber } from "@/lib/bengali";
import { ArrowUp, ArrowDown, Save, Loader2, ExternalLink } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "@/components/providers/language-provider";
import { Button, buttonVariants, Card, CardHeader, CardTitle, CardBody, Badge, EmptyState } from "@/components/ui";

export interface SeriesWithPieces {
  id: string;
  slug: string;
  titleBn: string;
  descBn: string | null;
  pieces: Array<{
    id: string;
    slug: string;
    titleBn: string;
    kind: "RACHANA" | "BLOG" | "DOCUMENTARY";
    seriesOrder: number | null;
  }>;
}

interface SeriesManagerProps {
  initialSeriesList: SeriesWithPieces[];
}

export function SeriesManager({ initialSeriesList }: SeriesManagerProps) {
  const [seriesList, setSeriesList] = useState(initialSeriesList);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(
    initialSeriesList[0]?.id || null
  );
  const [saving, setSaving] = useState(false);
  const t = useTranslation();

  const activeSeries = seriesList.find((s) => s.id === selectedSeriesId);

  const moveEpisode = (index: number, direction: "up" | "down") => {
    if (!activeSeries) return;
    const episodes = [...activeSeries.pieces];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= episodes.length) return;

    const [moved] = episodes.splice(index, 1);
    episodes.splice(targetIndex, 0, moved);

    // Re-assign seriesOrder 1, 2, 3...
    const updatedEpisodes = episodes.map((ep, i) => ({
      ...ep,
      seriesOrder: i + 1,
    }));

    setSeriesList((prev) =>
      prev.map((s) =>
        s.id === activeSeries.id ? { ...s, pieces: updatedEpisodes } : s
      )
    );
  };

  const saveOrder = async () => {
    if (!activeSeries || saving) return;
    setSaving(true);

    const payload = activeSeries.pieces.map((ep, i) => ({
      pieceId: ep.id,
      seriesOrder: i + 1,
    }));

    try {
      const res = await fetch(`/api/admin/series/${activeSeries.id}/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodeOrders: payload }),
      });

      if (res.ok) {
        toast.success("Series order updated successfully!");
      } else {
        toast.error("Failed to save series order.");
      }
    } catch {
      toast.error("Network error saving series order.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* Series Selector Sidebar */}
      <Card className="h-fit">
        <CardHeader className="py-3">
          <CardTitle className="text-step-1" lang="en">
            Series List
          </CardTitle>
        </CardHeader>
        <CardBody className="space-y-1.5 p-3">
          {seriesList.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSelectedSeriesId(s.id);
              }}
              className={`w-full text-left rounded-card px-3 py-2 font-body text-bengali-base transition ${
                selectedSeriesId === s.id
                  ? "bg-accent text-surface font-medium shadow-card"
                  : "text-content-soft hover:bg-rule/30 hover:text-content"
              }`}
              lang="bn"
            >
              <div className="flex justify-between items-center">
                <span>{s.titleBn}</span>
                <span className="font-mono text-xs opacity-75">
                  ({toBengaliNumber(s.pieces.length)})
                </span>
              </div>
            </button>
          ))}
          {seriesList.length === 0 && (
            <p className="p-3 text-xs text-content-faint">
              {t("admin.series.emptyList")}
            </p>
          )}
        </CardBody>
      </Card>

      {/* Series Episodes Reordering Panel */}
      {activeSeries ? (
        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div>
              <span className="label" lang="en">
                Episode Management
              </span>
              <h2 className="mt-1 font-body text-xl font-medium text-content" lang="bn">
                {activeSeries.titleBn}
              </h2>
              {activeSeries.descBn && (
                <p className="mt-1 font-body text-xs text-content-soft" lang="bn">
                  {activeSeries.descBn}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/series/${activeSeries.slug}`}
                target="_blank"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                View Series <ExternalLink className="h-3.5 w-3.5" />
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={saveOrder}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t("admin.series.saveOrder")}
              </Button>
            </div>
          </CardHeader>

          <CardBody className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="label" lang="en">
                Reorder Episodes ({activeSeries.pieces.length})
              </span>
              <Badge tone="accent">
                {toBengaliNumber(activeSeries.pieces.length)} episodes
              </Badge>
            </div>

            <ul className="divide-y divide-rule rounded-card border border-rule overflow-hidden">
              {activeSeries.pieces.map((piece, index) => (
                <li
                  key={piece.id}
                  className="flex items-center justify-between py-3 px-3 transition hover:bg-rule/20"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-content-faint w-6">
                      #{toBengaliNumber(index + 1)}
                    </span>
                    <span className="font-body text-bengali-base font-medium text-content" lang="bn">
                      {piece.titleBn}
                    </span>
                    <Badge tone="neutral" className="ml-2">
                      {piece.kind}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => moveEpisode(index, "up")}
                      disabled={index === 0}
                      className="h-8 w-8 p-0"
                      title={t("admin.series.moveUp")}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => moveEpisode(index, "down")}
                      disabled={index === activeSeries.pieces.length - 1}
                      className="h-8 w-8 p-0"
                      title={t("admin.series.moveDown")}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}

              {activeSeries.pieces.length === 0 && (
                <li className="py-8 text-center text-sm text-content-faint">
                  {t("admin.series.emptyEpisodes")}
                </li>
              )}
            </ul>
          </CardBody>
        </Card>
      ) : (
        <EmptyState
          title={t("admin.series.selectPrompt")}
          description="Select a series from the left rail to manage and reorder its episodes."
        />
      )}
    </div>
  );
}
