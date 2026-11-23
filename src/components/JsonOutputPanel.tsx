import React, { useMemo, useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import type { ProductionPlan } from '../types/production';

interface JsonOutputPanelProps {
  plan: ProductionPlan;
}

export const JsonOutputPanel: React.FC<JsonOutputPanelProps> = ({ plan }) => {
  const [copied, setCopied] = useState(false);

  const formattedJson = useMemo(() => JSON.stringify(plan, null, 2), [plan]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  const handleDownload = () => {
    const blob = new Blob([formattedJson], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeTitle = plan.video_summary.title_hook
      .replace(/[^\w\u0600-\u06FF-]+/g, '_')
      .slice(0, 40) || 'production_plan';
    a.href = url;
    a.download = `${safeTitle}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-xl border border-white/[0.08] bg-[#111723] overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-3.5">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold text-slate-100">خطة الإنتاج بصيغة JSON الصالحة (Valid JSON)</h2>
          <p className="text-xs text-slate-400">
            يتحدث تلقائياً مع أي تعديلات تجريها في عرض الإنتاج التفاعلي.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-[#0B0F17] px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-white/[0.22] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">تم نسخ JSON</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>نسخ JSON</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>تحميل ملف .json</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-[#090D14] p-5" dir="ltr">
        <pre className="text-xs font-mono leading-relaxed text-slate-200 whitespace-pre">
          <code>{formattedJson}</code>
        </pre>
      </div>
    </section>
  );
};
