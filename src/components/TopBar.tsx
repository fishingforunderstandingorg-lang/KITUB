import React from 'react';

interface TopBarProps {
  hasPlan: boolean;
  activeView: 'studio' | 'json';
  onSelectView: (view: 'studio' | 'json') => void;
  onNavigateSection: (sectionId: string) => void;
  onPrimaryAction: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  hasPlan,
  activeView,
  onSelectView,
  onNavigateSection,
  onPrimaryAction,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#0B0F17]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-8 px-6 py-3.5">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0"
        >
          مُخرج الإنتاج
        </a>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          {hasPlan ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onSelectView('studio');
                  onNavigateSection('summary-section');
                }}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeView === 'studio'
                    ? 'text-slate-100 hover:text-white'
                    : 'hover:text-slate-200'
                }`}
              >
                ملخص الفيديو
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectView('studio');
                  onNavigateSection('characters-section');
                }}
                className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                دليل الشخصيات
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectView('studio');
                  onNavigateSection('scenes-section');
                }}
                className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                الخط الزمني
              </button>
              <button
                type="button"
                onClick={() => onSelectView('json')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeView === 'json'
                    ? 'text-blue-400 underline underline-offset-8'
                    : 'hover:text-slate-100'
                }`}
              >
                كود JSON
              </button>
            </>
          ) : (
            <>
              <a
                href="#upload-studio"
                className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
              >
                رفع الفيديو
              </a>
              <a
                href="#director-settings"
                className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
              >
                إعدادات الإخراج
              </a>
              <a
                href="#schema-guide"
                className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
              >
                هيكل الإنتاج
              </a>
              <a
                href="#workflow-steps"
                className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
              >
                آلية العمل
              </a>
            </>
          )}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onPrimaryAction}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {hasPlan ? 'تحليل فيديو جديد' : 'اختيار ملف فيديو'}
          </button>
        </div>
      </div>
    </header>
  );
};
