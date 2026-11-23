import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Code2, LayoutList } from 'lucide-react';
import { TopBar } from './components/TopBar';
import { VideoUploadWorkspace } from './components/VideoUploadWorkspace';
import { ProductionSummaryPanel } from './components/ProductionSummaryPanel';
import { SceneTimeline } from './components/SceneTimeline';
import { JsonOutputPanel } from './components/JsonOutputPanel';
import type {
  CharacterBibleEntry,
  NarrationLanguagePref,
  ProductionPlan,
  SceneBreakdown,
  TargetAspectRatio,
  VideoSummary,
} from './types/production';
import { parseTimeToSeconds } from './utils/time';

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<TargetAspectRatio>('9:16');
  const [narrationLanguage, setNarrationLanguage] = useState<NarrationLanguagePref>('auto');
  const [directorNotes, setDirectorNotes] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [plan, setPlan] = useState<ProductionPlan | null>(null);
  const [activeView, setActiveView] = useState<'studio' | 'json'>('studio');
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [copiedQuickJson, setCopiedQuickJson] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setVideoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setVideoPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  const handleAnalyze = async () => {
    if (!selectedFile || isAnalyzing) return;

    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisStage('جاري رفع الفيديو ومعالجة الإطارات والصوت...');

    const stageTimer = window.setTimeout(() => {
      setAnalysisStage('جاري استخراج الشخصيات وتفكيك المشاهد بصيغة JSON...');
    }, 6000);

    try {
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('targetAspectRatio', aspectRatio);
      formData.append('narrationLanguage', narrationLanguage);
      formData.append('directorNotes', directorNotes);

      const response = await fetch('/api/analyze-video', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'فشل تحليل الفيديو. يرجى التحقق من الملف والمحاولة مجدداً.');
      }

      if (!data?.plan) {
        throw new Error('لم يتم استلام خطة إنتاج صالحة من الخادم.');
      }

      setPlan(data.plan as ProductionPlan);
      setActiveView('studio');
      setCurrentVideoTime(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء تحليل الفيديو.',
      );
    } finally {
      window.clearTimeout(stageTimer);
      setIsAnalyzing(false);
      setAnalysisStage('');
    }
  };

  const handleResetToUpload = () => {
    setPlan(null);
    setErrorMessage(null);
    setCurrentVideoTime(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateSection = (sectionId: string) => {
    window.setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const handleSeekToScene = (startTime: string) => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    const sec = parseTimeToSeconds(startTime);
    videoEl.currentTime = sec;
    videoEl.play().catch(() => {});
  };

  const handleUpdateSummary = (updated: VideoSummary) => {
    setPlan((prev) => (prev ? { ...prev, video_summary: updated } : prev));
  };

  const handleUpdateCharacter = (index: number, updated: CharacterBibleEntry) => {
    setPlan((prev) => {
      if (!prev) return prev;
      const nextChars = [...prev.characters_bible];
      nextChars[index] = updated;
      return { ...prev, characters_bible: nextChars };
    });
  };

  const handleUpdateScene = (index: number, updated: SceneBreakdown) => {
    setPlan((prev) => {
      if (!prev) return prev;
      const nextScenes = [...prev.scenes];
      nextScenes[index] = updated;
      return { ...prev, scenes: nextScenes };
    });
  };

  const handleQuickCopyJson = async () => {
    if (!plan) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
      setCopiedQuickJson(true);
      setTimeout(() => setCopiedQuickJson(false), 1500);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F17] text-slate-100">
      <TopBar
        hasPlan={Boolean(plan)}
        activeView={activeView}
        onSelectView={setActiveView}
        onNavigateSection={handleNavigateSection}
        onPrimaryAction={() => {
          if (plan) {
            handleResetToUpload();
          } else {
            fileInputRef.current?.click();
          }
        }}
      />

      <main className="flex-1">
        {!plan ? (
          <VideoUploadWorkspace
            selectedFile={selectedFile}
            videoPreviewUrl={videoPreviewUrl}
            aspectRatio={aspectRatio}
            narrationLanguage={narrationLanguage}
            directorNotes={directorNotes}
            isAnalyzing={isAnalyzing}
            analysisStage={analysisStage}
            errorMessage={errorMessage}
            fileInputRef={fileInputRef}
            onSelectFile={setSelectedFile}
            onAspectRatioChange={setAspectRatio}
            onNarrationLanguageChange={setNarrationLanguage}
            onDirectorNotesChange={setDirectorNotes}
            onAnalyze={handleAnalyze}
            onClearError={() => setErrorMessage(null)}
          />
        ) : (
          <div id="top" className="mx-auto max-w-[1400px] px-6 py-8 space-y-6">
            {/* Workspace Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
              <div className="space-y-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-50 truncate">
                  {plan.video_summary.title_hook}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span>{plan.video_summary.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums" dir="ltr">
                    {plan.video_summary.total_duration}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{plan.scenes.length} مشاهد</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{plan.characters_bible.length} شخصيات</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums" dir="ltr">
                    {plan.video_summary.target_aspect_ratio}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 rounded-lg bg-[#111723] p-1 border border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setActiveView('studio')}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activeView === 'studio'
                        ? 'bg-[#1D2638] text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <LayoutList className="h-3.5 w-3.5" />
                    <span>الإنتاج التفاعلي</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('json')}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activeView === 'json'
                        ? 'bg-[#1D2638] text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Code2 className="h-3.5 w-3.5" />
                    <span>JSON الصالح</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleQuickCopyJson}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-[#111723] px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-white/[0.22] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copiedQuickJson ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">نُسخ JSON</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>نسخ JSON الكامل</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {activeView === 'studio' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-4 lg:sticky lg:top-20">
                  <ProductionSummaryPanel
                    plan={plan}
                    videoUrl={videoPreviewUrl}
                    videoRef={videoRef}
                    currentVideoTime={currentVideoTime}
                    onTimeUpdate={setCurrentVideoTime}
                    onUpdateSummary={handleUpdateSummary}
                    onUpdateCharacter={handleUpdateCharacter}
                  />
                </div>
                <div className="lg:col-span-8">
                  <SceneTimeline
                    scenes={plan.scenes}
                    charactersBible={plan.characters_bible}
                    artStyle={plan.video_summary.art_style}
                    currentVideoTime={currentVideoTime}
                    onSeekToScene={handleSeekToScene}
                    onUpdateScene={handleUpdateScene}
                  />
                </div>
              </div>
            ) : (
              <JsonOutputPanel plan={plan} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
