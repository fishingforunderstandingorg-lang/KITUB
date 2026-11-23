import React, { useRef, useState } from 'react';
import { Upload, Film, AlertCircle, Loader2, X } from 'lucide-react';
import type { NarrationLanguagePref, TargetAspectRatio } from '../types/production';
import { formatBytes, formatSecondsToMMSS } from '../utils/time';

interface VideoUploadWorkspaceProps {
  selectedFile: File | null;
  videoPreviewUrl: string | null;
  aspectRatio: TargetAspectRatio;
  narrationLanguage: NarrationLanguagePref;
  directorNotes: string;
  isAnalyzing: boolean;
  analysisStage: string;
  errorMessage: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSelectFile: (file: File | null) => void;
  onAspectRatioChange: (ratio: TargetAspectRatio) => void;
  onNarrationLanguageChange: (lang: NarrationLanguagePref) => void;
  onDirectorNotesChange: (notes: string) => void;
  onAnalyze: () => void;
  onClearError: () => void;
}

export const VideoUploadWorkspace: React.FC<VideoUploadWorkspaceProps> = ({
  selectedFile,
  videoPreviewUrl,
  aspectRatio,
  narrationLanguage,
  directorNotes,
  isAnalyzing,
  analysisStage,
  errorMessage,
  fileInputRef,
  onSelectFile,
  onAspectRatioChange,
  onNarrationLanguageChange,
  onDirectorNotesChange,
  onAnalyze,
  onClearError,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [videoMeta, setVideoMeta] = useState<{ duration: number; width: number; height: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleFileChange = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setVideoMeta(null);
    onClearError();
    onSelectFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isAnalyzing) return;
    handleFileChange(e.dataTransfer.files);
  };

  const handleLoadedMetadata = () => {
    const el = videoRef.current;
    if (!el) return;
    setVideoMeta({
      duration: el.duration,
      width: el.videoWidth,
      height: el.videoHeight,
    });
  };

  return (
    <div id="top" className="mx-auto max-w-[1400px] px-6 py-10 space-y-12">
      <section className="max-w-3xl space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-50 leading-tight [text-wrap:balance]">
          تفكيك الفيديو وتحويله إلى خطة إنتاج سينمائية بصيغة JSON
        </h1>
        <p className="text-base text-slate-400 leading-relaxed max-w-2xl">
          ارفع أي فيديو قصير أو ريلز لتحليله ثانية بثانية واستخراج دليل ثبات الشخصيات، نصوص الراوي،
          أوصاف التوليد البصرية بالإنجليزية، وتصميم الصوت وفق هيكل إنتاج جاهز للتنفيذ.
        </p>
      </section>

      <section
        id="upload-studio"
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
      >
        {/* Video Dropzone & Preview */}
        <div className="lg:col-span-7 flex flex-col rounded-xl border border-white/[0.08] bg-[#111723] p-6">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
            <h2 className="text-sm font-semibold text-slate-200">01. ملف الفيديو المرجعي</h2>
            {selectedFile && !isAnalyzing && (
              <button
                type="button"
                onClick={() => {
                  setVideoMeta(null);
                  onSelectFile(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>إزالة الملف</span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/*"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files)}
          />

          {!selectedFile || !videoPreviewUrl ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`mt-5 flex-1 min-h-[340px] flex flex-col items-center justify-center rounded-lg border border-dashed transition-colors p-8 text-center cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-500 ${
                isDragging
                  ? 'border-blue-500 bg-blue-500/[0.06]'
                  : 'border-white/[0.14] bg-[#0B0F17]/60 hover:border-white/[0.28]'
              }`}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-white/[0.1] bg-[#161E2E] text-slate-200">
                <Upload className="h-5 w-5" />
              </div>
              <p className="text-base font-medium text-slate-100">
                اسحب ملف الفيديو وأفلته هنا، أو انقر للاختيار
              </p>
              <p className="mt-2 text-xs text-slate-400 font-mono tabular-nums" dir="ltr">
                MP4 · MOV · WebM · MKV · Max 150 MB
              </p>
            </div>
          ) : (
            <div className="mt-5 flex-1 flex flex-col justify-between gap-4">
              <div className="relative flex items-center justify-center overflow-hidden rounded-lg border border-white/[0.08] bg-black min-h-[320px] max-h-[420px]">
                <video
                  ref={videoRef}
                  src={videoPreviewUrl}
                  controls
                  onLoadedMetadata={handleLoadedMetadata}
                  className="max-h-[420px] w-full object-contain"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <Film className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate max-w-[240px] text-slate-200 font-medium" dir="ltr">
                    {selectedFile.name}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums" dir="ltr">
                    {formatBytes(selectedFile.size)}
                  </span>
                  {videoMeta && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums" dir="ltr">
                        {formatSecondsToMMSS(videoMeta.duration)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums" dir="ltr">
                        {videoMeta.width}×{videoMeta.height}
                      </span>
                    </>
                  )}
                </div>

                {!isAnalyzing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    استبدال الفيديو
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Director Configuration Panel */}
        <div
          id="director-settings"
          className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-white/[0.08] bg-[#111723] p-6"
        >
          <div className="space-y-6">
            <div className="pb-4 border-b border-white/[0.07]">
              <h2 className="text-sm font-semibold text-slate-200">02. معايير الإخراج والتحليل</h2>
            </div>

            <div className="space-y-2.5">
              <label className="block text-xs font-medium text-slate-300">
                نسبة الأبعاد المستهدفة (Aspect Ratio)
              </label>
              <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-[#0B0F17] p-1 border border-white/[0.06]">
                {(['9:16', '16:9', '1:1'] as TargetAspectRatio[]).map((ratio) => {
                  const active = aspectRatio === ratio;
                  const label =
                    ratio === '9:16'
                      ? '9:16 عمودي'
                      : ratio === '16:9'
                        ? '16:9 أفقي'
                        : '1:1 مربع';
                  return (
                    <button
                      key={ratio}
                      type="button"
                      disabled={isAnalyzing}
                      onClick={() => onAspectRatioChange(ratio)}
                      className={`rounded-md px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-[#1D2638] text-white border border-white/[0.1]'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="block text-xs font-medium text-slate-300">
                لغة التعليق الصوتي والترجمة (Narration)
              </label>
              <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-[#0B0F17] p-1 border border-white/[0.06]">
                {(
                  [
                    { value: 'auto', label: 'تلقائي' },
                    { value: 'Arabic', label: 'العربية' },
                    { value: 'English', label: 'English' },
                  ] as const
                ).map((item) => {
                  const active = narrationLanguage === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      disabled={isAnalyzing}
                      onClick={() => onNarrationLanguageChange(item.value)}
                      className={`rounded-md px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-[#1D2638] text-white border border-white/[0.1]'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              <label htmlFor="director-notes" className="block text-xs font-medium text-slate-300">
                توجيهات إخراجية إضافية (اختياري)
              </label>
              <textarea
                id="director-notes"
                rows={4}
                disabled={isAnalyzing}
                value={directorNotes}
                onChange={(e) => onDirectorNotesChange(e.target.value)}
                placeholder="مثال: حافظ على إيقاع سريع ومشوق بأسلوب Pixar مع تركيز عالٍ على تعابير الوجه..."
                className="w-full rounded-lg border border-white/[0.08] bg-[#0B0F17] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-white/[0.07] space-y-4">
            {errorMessage && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/[0.08] p-3 text-xs text-red-200"
              >
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{errorMessage}</div>
              </div>
            )}

            <button
              type="button"
              disabled={!selectedFile || isAnalyzing}
              onClick={onAnalyze}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{analysisStage || 'جاري التحليل السينمائي...'}</span>
                </>
              ) : (
                <span>بدء التحليل واستخراج خطة الإنتاج</span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Schema Guide & Workflow */}
      <section id="schema-guide" className="border-t border-white/[0.07] pt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8" id="workflow-steps">
          <div className="space-y-2">
            <p className="text-xs font-mono text-slate-400 tabular-nums">01 · التوقيت والملخص</p>
            <h3 className="text-base font-semibold text-slate-100">ملخص الفيديو وهوية السرد</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              تحديد العنوان الجذاب، التصنيف، المدة الإجمالية بصيغة MM:SS، الأسلوب الفني بالإنجليزية، ونبرة وإيقاع الراوي.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-mono text-slate-400 tabular-nums">02 · ثبات الشخصيات</p>
            <h3 className="text-base font-semibold text-slate-100">دليل الشخصيات (Characters Bible)</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              وصف بصري ثابت ومفصل بالإنجليزية لكل شخصية مع إعادة حقنه في كل مشهد لضمان عدم تغير الملامح أو الملابس.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-mono text-slate-400 tabular-nums">03 · اللقطات و JSON</p>
            <h3 className="text-base font-semibold text-slate-100">تفكيك المشاهد وتصدير JSON</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              تقسيم دقيق بالثواني يشمل نص الراوي، العنوان البارز، برومبت التوليد، حركة الكاميرا، والمؤثرات الصوتية.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
