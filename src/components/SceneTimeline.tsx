import React, { useMemo, useState } from 'react';
import { Check, Copy, Play, Search, Sparkles, Loader2, Volume2 } from 'lucide-react';
import type { CharacterBibleEntry, SceneBreakdown } from '../types/production';
import { parseTimeToSeconds } from '../utils/time';

interface SceneTimelineProps {
  scenes: SceneBreakdown[];
  charactersBible: CharacterBibleEntry[];
  artStyle: string;
  currentVideoTime: number;
  onSeekToScene: (startTime: string) => void;
  onUpdateScene: (sceneIndex: number, updated: SceneBreakdown) => void;
}

export const SceneTimeline: React.FC<SceneTimelineProps> = ({
  scenes,
  charactersBible,
  artStyle,
  currentVideoTime,
  onSeekToScene,
  onUpdateScene,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [refiningSceneIdx, setRefiningSceneIdx] = useState<number | null>(null);
  const [refineInstruction, setRefineInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 1500);
    } catch {
      // Ignore clipboard failures
    }
  };

  const filteredScenes = useMemo(() => {
    return scenes
      .map((scene, originalIndex) => ({ scene, originalIndex }))
      .filter(({ scene }) => {
        if (selectedCharacter !== 'all' && !scene.active_characters.includes(selectedCharacter)) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const haystack = [
            scene.narration_script,
            scene.caption_text,
            scene.visual_prompt,
            scene.image_to_video_motion,
            scene.sound_design.sfx,
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(q);
        }
        return true;
      });
  }, [scenes, selectedCharacter, searchQuery]);

  const handleSubmitRefine = async (originalIndex: number, scene: SceneBreakdown) => {
    if (!refineInstruction.trim() || isRefining) return;
    setIsRefining(true);
    setRefineError(null);
    try {
      const response = await fetch('/api/refine-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene,
          charactersBible,
          artStyle,
          instruction: refineInstruction.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'تعذر تحديث المشهد.');
      }
      if (data.scene) {
        onUpdateScene(originalIndex, data.scene);
        setRefiningSceneIdx(null);
        setRefineInstruction('');
      }
    } catch (err) {
      setRefineError(err instanceof Error ? err.message : 'حدث خطأ أثناء تعديل المشهد.');
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <section id="scenes-section" className="space-y-5">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#111723] p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في النصوص أو أوصاف اللقطات..."
            className="w-full rounded-lg border border-white/[0.08] bg-[#0B0F17] py-2 pr-9 pl-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#0B0F17] p-1 border border-white/[0.06]">
          <button
            type="button"
            onClick={() => setSelectedCharacter('all')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedCharacter === 'all'
                ? 'bg-[#1D2638] text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            كل المشاهد ({scenes.length})
          </button>
          {charactersBible.map((char) => (
            <button
              key={char.character_id}
              type="button"
              onClick={() => setSelectedCharacter(char.character_id)}
              className={`rounded-md px-3 py-1.5 text-xs font-mono font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCharacter === char.character_id
                  ? 'bg-[#1D2638] text-blue-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {char.character_id}
            </button>
          ))}
        </div>
      </div>

      {/* Empty Search State */}
      {filteredScenes.length === 0 ? (
        <div className="rounded-xl border border-white/[0.08] bg-[#111723] p-10 text-center space-y-2">
          <p className="text-sm font-medium text-slate-200">لا توجد مشاهد مطابقة للفلتر الحالي</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCharacter('all');
            }}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 cursor-pointer"
          >
            إعادة ضبط البحث والفلاتر
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredScenes.map(({ scene, originalIndex }) => {
            const startSec = parseTimeToSeconds(scene.start_time);
            const endSec = parseTimeToSeconds(scene.end_time);
            const isPlayingThisScene =
              currentVideoTime >= startSec && currentVideoTime < endSec && endSec > startSec;
            const isRefineOpen = refiningSceneIdx === originalIndex;

            return (
              <article
                key={`${scene.scene_number}-${originalIndex}`}
                className={`rounded-xl border bg-[#111723] p-5 transition-colors space-y-4 ${
                  isPlayingThisScene ? 'border-blue-500/70' : 'border-white/[0.08]'
                }`}
              >
                {/* Scene Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-white/[0.07]">
                  <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    <span className="font-semibold text-sm text-slate-100 tabular-nums">
                      المشهد {String(scene.scene_number).padStart(2, '0')}
                    </span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="font-mono tabular-nums text-blue-400" dir="ltr">
                      {scene.start_time} – {scene.end_time}
                    </span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="font-mono tabular-nums text-slate-400">
                      {scene.duration_seconds} ثوانٍ
                    </span>
                    {scene.active_characters.length > 0 && (
                      <>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="font-mono text-slate-300" dir="ltr">
                          {scene.active_characters.join(', ')}
                        </span>
                      </>
                    )}
                    {isPlayingThisScene && (
                      <>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="text-blue-400 font-medium">قيد التشغيل</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSeekToScene(scene.start_time)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-[#0B0F17] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-white/[0.22] hover:bg-[#161E2E] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Play className="h-3 w-3" />
                      <span>تشغيل اللقطة</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRefineError(null);
                        setRefineInstruction('');
                        setRefiningSceneIdx(isRefineOpen ? null : originalIndex);
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isRefineOpen
                          ? 'border-blue-500/60 bg-blue-500/15 text-blue-300'
                          : 'border-white/[0.1] bg-[#0B0F17] text-slate-300 hover:border-white/[0.22]'
                      }`}
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>تحسين المشهد</span>
                    </button>
                  </div>
                </div>

                {/* Inline AI Scene Refiner */}
                {isRefineOpen && (
                  <div className="rounded-lg border border-blue-500/30 bg-[#0B0F17] p-3.5 space-y-2.5">
                    <label className="block text-xs font-medium text-slate-200">
                      تعديل هذا المشهد عبر المخرج الذكي (مع الحفاظ على ثبات الشخصيات والتوقيت):
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={refineInstruction}
                        onChange={(e) => setRefineInstruction(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSubmitRefine(originalIndex, scene);
                          }
                        }}
                        placeholder="مثال: اجعل زاوية الكاميرا منخفضة وزد التوتر في تعليق الراوي..."
                        className="flex-1 rounded-lg border border-white/[0.1] bg-[#111723] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={!refineInstruction.trim() || isRefining}
                        onClick={() => handleSubmitRefine(originalIndex, scene)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {isRefining ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>جاري التحديث...</span>
                          </>
                        ) : (
                          <span>تطبيق التعديل</span>
                        )}
                      </button>
                    </div>
                    {refineError && (
                      <p className="text-xs text-red-400">{refineError}</p>
                    )}
                  </div>
                )}

                {/* Caption & Narration Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-4 space-y-1.5">
                    <label className="block text-xs text-slate-400">
                      العنوان على الشاشة (Caption)
                    </label>
                    <input
                      type="text"
                      value={scene.caption_text}
                      onChange={(e) =>
                        onUpdateScene(originalIndex, {
                          ...scene,
                          caption_text: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-white/[0.08] bg-[#0B0F17] px-3 py-2 text-xs font-semibold text-slate-100 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-8 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs text-slate-400">نص الراوي الصوتي (TTS Script)</label>
                      <button
                        type="button"
                        onClick={() => handleCopy(`narr-${originalIndex}`, scene.narration_script)}
                        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {copiedKey === `narr-${originalIndex}` ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">نُسخ</span>
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
                      rows={2}
                      value={scene.narration_script}
                      onChange={(e) =>
                        onUpdateScene(originalIndex, {
                          ...scene,
                          narration_script: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-white/[0.08] bg-[#0B0F17] px-3 py-2 text-sm text-slate-100 leading-relaxed focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Visual Prompt (LTR) */}
                <div className="pt-3 border-t border-white/[0.06] space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400">
                      وصف التوليد البصري الدقيق (Visual Prompt)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(`vp-${originalIndex}`, scene.visual_prompt)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 cursor-pointer whitespace-nowrap"
                    >
                      {copiedKey === `vp-${originalIndex}` ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">تم نسخ البرومبت</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>نسخ Visual Prompt</span>
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    dir="ltr"
                    rows={3}
                    value={scene.visual_prompt}
                    onChange={(e) =>
                      onUpdateScene(originalIndex, {
                        ...scene,
                        visual_prompt: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-white/[0.08] bg-[#0B0F17] px-3.5 py-2.5 text-xs font-mono text-slate-200 leading-relaxed focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Image-to-Video Motion & Sound Design */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-3 border-t border-white/[0.06]">
                  <div className="md:col-span-6 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-400">
                        حركة الصورة الثابتة (Image-to-Video Motion)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(`i2v-${originalIndex}`, scene.image_to_video_motion)
                        }
                        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {copiedKey === `i2v-${originalIndex}` ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">نُسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>نسخ</span>
                          </>
                        )}
                      </button>
                    </div>
                    <input
                      dir="ltr"
                      type="text"
                      value={scene.image_to_video_motion}
                      onChange={(e) =>
                        onUpdateScene(originalIndex, {
                          ...scene,
                          image_to_video_motion: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-white/[0.08] bg-[#0B0F17] px-3 py-2 text-xs font-mono text-slate-300 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-6 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Volume2 className="h-3.5 w-3.5" />
                      <span>تصميم الصوت (SFX & Ambient Mood)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={scene.sound_design.sfx}
                        onChange={(e) =>
                          onUpdateScene(originalIndex, {
                            ...scene,
                            sound_design: {
                              ...scene.sound_design,
                              sfx: e.target.value,
                            },
                          })
                        }
                        placeholder="المؤثرات الصوتية"
                        className="w-full rounded-lg border border-white/[0.08] bg-[#0B0F17] px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={scene.sound_design.ambient_music_mood}
                        onChange={(e) =>
                          onUpdateScene(originalIndex, {
                            ...scene,
                            sound_design: {
                              ...scene.sound_design,
                              ambient_music_mood: e.target.value,
                            },
                          })
                        }
                        placeholder="طابع الموسيقى"
                        className="w-full rounded-lg border border-white/[0.08] bg-[#0B0F17] px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
