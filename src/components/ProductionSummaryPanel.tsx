import React, { useState } from 'react';
import { Check, Copy, Users, Film } from 'lucide-react';
import type { CharacterBibleEntry, ProductionPlan, VideoSummary } from '../types/production';
import { formatSecondsToMMSS } from '../utils/time';

interface ProductionSummaryPanelProps {
  plan: ProductionPlan;
  videoUrl: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  currentVideoTime: number;
  onTimeUpdate: (timeSec: number) => void;
  onUpdateSummary: (updated: VideoSummary) => void;
  onUpdateCharacter: (index: number, updated: CharacterBibleEntry) => void;
}

export const ProductionSummaryPanel: React.FC<ProductionSummaryPanelProps> = ({
  plan,
  videoUrl,
  videoRef,
  currentVideoTime,
  onTimeUpdate,
  onUpdateSummary,
  onUpdateCharacter,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500);
    } catch {
      // Ignore clipboard failures
    }
  };

  const { video_summary, characters_bible } = plan;

  return (
    <aside className="space-y-6">
      {/* Synced Video Player */}
      <section className="rounded-xl border border-white/[0.08] bg-[#111723] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Film className="h-3.5 w-3.5 text-slate-400" />
            <span>الشاشة المرجعية</span>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-400" dir="ltr">
            {formatSecondsToMMSS(currentVideoTime)} / {video_summary.total_duration}
          </span>
        </div>

        {videoUrl ? (
          <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-black">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
              className="w-full max-h-[300px] object-contain"
            />
          </div>
        ) : (
          <div className="flex h-44 items-center justify-center rounded-lg border border-white/[0.06] bg-[#0B0F17] text-xs text-slate-500">
            معاينة الفيديو غير متاحة
          </div>
        )}
      </section>

      {/* Video Summary */}
      <section
        id="summary-section"
        className="rounded-xl border border-white/[0.08] bg-[#111723] p-5 space-y-4"
      >
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/[0.07]">
          <h2 className="text-sm font-semibold text-slate-100">ملخص الفيديو</h2>
          <span className="text-xs font-mono tabular-nums text-slate-400" dir="ltr">
            {video_summary.target_aspect_ratio} · {video_summary.total_duration}
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">العنوان المقترح (Title Hook)</label>
            <input
              type="text"
              value={video_summary.title_hook}
              onChange={(e) =>
                onUpdateSummary({ ...video_summary, title_hook: e.target.value })
              }
              className="w-full rounded-lg border border-white/[0.08] bg-[#0B0F17] px-3 py-2 text-sm font-semibold text-slate-100 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-1">
            <span>التصنيف: <strong className="text-slate-200 font-medium">{video_summary.category}</strong></span>
            <span aria-hidden="true">·</span>
            <span>الراوي: <strong className="text-slate-200 font-medium">{video_summary.narrator_profile.language}</strong></span>
            <span aria-hidden="true">·</span>
            <span dir="ltr" className="font-mono text-slate-300">
              {video_summary.narrator_profile.tone} / {video_summary.narrator_profile.pace}
            </span>
          </div>

          <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-400">الأسلوب الفني (Art Style)</span>
              <button
                type="button"
                onClick={() => handleCopy('art_style', video_summary.art_style)}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
              >
                {copiedId === 'art_style' ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400">تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>نسخ</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              dir="ltr"
              rows={2}
              value={video_summary.art_style}
              onChange={(e) =>
                onUpdateSummary({ ...video_summary, art_style: e.target.value })
              }
              className="w-full rounded-lg border border-white/[0.08] bg-[#0B0F17] px-3 py-2 text-xs font-mono text-slate-200 leading-relaxed focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Characters Bible */}
      <section
        id="characters-section"
        className="rounded-xl border border-white/[0.08] bg-[#111723] p-5 space-y-4"
      >
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/[0.07]">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-100">دليل ثبات الشخصيات</h2>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-400">
            {characters_bible.length} شخصيات
          </span>
        </div>

        {characters_bible.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">لم يتم رصد شخصيات رئيسية متكررة في هذا الفيديو.</p>
        ) : (
          <div className="divide-y divide-white/[0.07]">
            {characters_bible.map((char, index) => (
              <div key={char.character_id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs min-w-0">
                    <span className="font-mono font-semibold text-blue-400" dir="ltr">
                      {char.character_id}
                    </span>
                    <span aria-hidden="true" className="text-slate-500">·</span>
                    <span className="font-semibold text-slate-100 truncate">{char.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(char.character_id, char.fixed_visual_description)}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {copiedId === char.character_id ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">نُسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>نسخ الوصف</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  dir="ltr"
                  rows={3}
                  value={char.fixed_visual_description}
                  onChange={(e) =>
                    onUpdateCharacter(index, {
                      ...char,
                      fixed_visual_description: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-white/[0.08] bg-[#0B0F17] px-3 py-2 text-xs font-mono text-slate-300 leading-relaxed focus:border-blue-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </aside>
  );
};
