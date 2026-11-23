import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import multer from 'multer';
import { GoogleGenAI, Type } from '@google/genai';
import type { Schema } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const ALLOWED_VIDEO_MIMES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
  'video/mpeg',
  'video/3gpp',
  'video/x-msvideo',
  'video/ogg',
]);

const upload = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: 150 * 1024 * 1024, // 150 MB max
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_VIDEO_MIMES.has(file.mimetype) || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('صيغة الملف غير مدعومة. يرجى رفع ملف فيديو صالح (MP4, MOV, WebM).'));
    }
  },
});

const sceneSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    scene_number: {
      type: Type.INTEGER,
      description: 'رقم المشهد التسلسلي بدءاً من 1',
    },
    start_time: {
      type: Type.STRING,
      description: 'وقت بداية المشهد بصيغة MM:SS',
    },
    end_time: {
      type: Type.STRING,
      description: 'وقت نهاية المشهد بصيغة MM:SS',
    },
    duration_seconds: {
      type: Type.INTEGER,
      description: 'مدة المشهد بالثواني',
    },
    active_characters: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: 'قائمة معرفات الشخصيات الظاهرة في المشهد مثل ["char_1"]',
    },
    narration_script: {
      type: Type.STRING,
      description: 'النص الكامل الذي سيُقرأ بصوت الراوي (TTS) في هذه اللقطة ليكون مشوقاً ومناسباً للمدة الزمنية',
    },
    caption_text: {
      type: Type.STRING,
      description: 'نص قصير جداً يظهر على الشاشة كترجمة/عنوان بارز (3 إلى 7 كلمات كحد أقصى)',
    },
    visual_prompt: {
      type: Type.STRING,
      description:
        'وصف تفصيلي جداً بالإنجليزية لتوليد اللقطة متضمناً ملامح الشخصية الثابتة، تعبير الوجه، الحركة، المكان، زاوية الكاميرا، حركة الكاميرا، والإضاءة والألوان',
    },
    image_to_video_motion: {
      type: Type.STRING,
      description: 'وصف حركة الكاميرا والعناصر فقط بالإنجليزية في حال استخدام تحريك صورة ثابتة',
    },
    sound_design: {
      type: Type.OBJECT,
      properties: {
        sfx: {
          type: Type.STRING,
          description: 'المؤثرات الصوتية المطلوبة في اللقطة',
        },
        ambient_music_mood: {
          type: Type.STRING,
          description: 'طابع الموسيقى الخلفية في هذه اللحظة',
        },
      },
      required: ['sfx', 'ambient_music_mood'],
    },
  },
  required: [
    'scene_number',
    'start_time',
    'end_time',
    'duration_seconds',
    'active_characters',
    'narration_script',
    'caption_text',
    'visual_prompt',
    'image_to_video_motion',
    'sound_design',
  ],
};

const productionPlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    video_summary: {
      type: Type.OBJECT,
      properties: {
        title_hook: {
          type: Type.STRING,
          description: 'عنوان مقترح جذاب وقصير للفيديو الجديد',
        },
        category: {
          type: Type.STRING,
          description: 'تصنيف الفيديو (مثل: رسوم متحركة، كوميديا، دراما، قصة قصيرة، مقتطف فيلم)',
        },
        total_duration: {
          type: Type.STRING,
          description: 'المدة الإجمالية بصيغة MM:SS',
        },
        target_aspect_ratio: {
          type: Type.STRING,
          description: 'نسبة الأبعاد المستهدفة مثل 9:16',
        },
        art_style: {
          type: Type.STRING,
          description: 'الأسلوب الفني العام بالإنجليزية (e.g., 3D stylized animation, cinematic lighting)',
        },
        narrator_profile: {
          type: Type.OBJECT,
          properties: {
            language: {
              type: Type.STRING,
              description: 'لغة التعليق الصوتي (مثال: English أو Arabic)',
            },
            tone: {
              type: Type.STRING,
              description: 'نبرة الصوت (مثال: dramatic, energetic, humorous, suspenseful)',
            },
            pace: {
              type: Type.STRING,
              description: 'سرعة الإلقاء (مثال: fast-paced, engaging)',
            },
          },
          required: ['language', 'tone', 'pace'],
        },
      },
      required: [
        'title_hook',
        'category',
        'total_duration',
        'target_aspect_ratio',
        'art_style',
        'narrator_profile',
      ],
    },
    characters_bible: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          character_id: {
            type: Type.STRING,
            description: 'معرف فريد للشخصية مثل char_1',
          },
          name: {
            type: Type.STRING,
            description: 'اسم أو تعريف مختصر للشخصية',
          },
          fixed_visual_description: {
            type: Type.STRING,
            description:
              'وصف بصري ثابت ومفصل جداً بالإنجليزية (العمر، الشكل، الملابس، الملامح، الألوان) لضمان ثبات الشكل بين اللقطات',
          },
        },
        required: ['character_id', 'name', 'fixed_visual_description'],
      },
    },
    scenes: {
      type: Type.ARRAY,
      items: sceneSchema,
    },
  },
  required: ['video_summary', 'characters_bible', 'scenes'],
};

const DIRECTOR_SYSTEM_INSTRUCTION = `أنت مخرج سينمائي ومهندس إنتاج فيديو بالذكاء الاصطناعي. مهمتك هي تحليل الفيديو المرفق بالكامل من البداية إلى النهاية، وتفكيكه إلى خطة إنتاج متكاملة لإعادة إنشاء فيديو جديد بأسلوب مشابه (للفيديوهات القصيرة / Shorts / Reels) مع الحفاظ على إيقاع القصة وتشويقها.

القواعد الصارمة:
1. التزم بالتوقيت الزمني الدقيق (MM:SS) لكل مشهد بناءً على ما يظهر ويُسمع في الفيديو المرفق، بحيث تغطي المشاهد كامل مدة الفيديو بتسلسل متواصل ودقيق.
2. أخرج النتيجة بصيغة JSON صالحة فقط تطابق المخطط المطلوب تماماً.
3. اجعل وصف المشاهد البصرية (visual_prompt) ووصف حركة الصورة (image_to_video_motion) والأسلوب الفني (art_style) باللغة الإنجليزية وبأقصى قدر من الدقة والتفصيل، لأنها ستُستخدم مباشرة في نماذج توليد الفيديو أو الصور بالذكاء الاصطناعي.
4. حافظ على ثبات وصف الشخصيات (Character Consistency): حدد وصفاً ثابتاً ودقيقاً لكل شخصية رئيسية في حقل "characters_bible" باللغة الإنجليزية، وأعد تضمين تفاصيلها الأساسية (ملابسها، ألوانها، ملامحها المميزة) داخل حقل "visual_prompt" في كل مشهد تظهر فيه.
5. اجعل "caption_text" قصيراً جداً ومناسباً للشاشة (3 إلى 7 كلمات كحد أقصى).
6. اجعل "narration_script" جذاباً ومناسباً زمنياً لمدة المشهد (duration_seconds) ليُقرأ بسلاسة عبر TTS.`;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient = msg.includes('503') || msg.includes('429') || msg.includes('UNAVAILABLE');
      if (!isTransient || attempt === maxAttempts) {
        throw err;
      }
      await sleep(1000 * Math.pow(2, attempt - 1));
    }
  }
  throw lastError;
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('PERMISSION_DENIED') || raw.includes('API_KEY_INVALID') || raw.includes('API key')) {
    return {
      status: 400,
      message: 'مفتاح Gemini API غير صالح أو مفقود. يرجى التحقق من Settings > Secrets في AI Studio.',
    };
  }
  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429')) {
    return {
      status: 429,
      message: 'تم تجاوز حد الاستخدام المسموح لـ Gemini API حالياً. يرجى المحاولة بعد قليل.',
    };
  }
  if (raw.includes('NOT_FOUND') || raw.includes('404')) {
    return {
      status: 404,
      message: 'النموذج المطلوب غير متاح أو تعذر العثور على الملف المرفوع.',
    };
  }
  return {
    status: 500,
    message: raw || 'حدث خطأ غير متوقع أثناء تحليل الفيديو.',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  app.post('/api/analyze-video', (req: Request, res: Response) => {
    upload.single('video')(req, res, async (uploadErr) => {
      if (uploadErr) {
        res.status(400).json({ error: uploadErr.message || 'فشل رفع ملف الفيديو.' });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        if (req.file?.path) {
          fs.promises.unlink(req.file.path).catch(() => {});
        }
        res.status(500).json({
          error: 'لم يتم العثور على GEMINI_API_KEY على الخادم. يرجى ضبطه في لوحة Secrets.',
        });
        return;
      }

      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'يرجى إرفاق ملف فيديو أولاً.' });
        return;
      }

      const targetAspectRatio =
        typeof req.body?.targetAspectRatio === 'string' && req.body.targetAspectRatio.trim()
          ? req.body.targetAspectRatio.trim()
          : '9:16';
      const narrationLanguage =
        typeof req.body?.narrationLanguage === 'string' && req.body.narrationLanguage.trim()
          ? req.body.narrationLanguage.trim()
          : 'auto';
      const directorNotes =
        typeof req.body?.directorNotes === 'string' ? req.body.directorNotes.trim() : '';

      let uploadedFileName: string | undefined;

      try {
        const mimeType = file.mimetype || 'video/mp4';
        const uploaded = await ai.files.upload({
          file: file.path,
          config: {
            mimeType,
            displayName: file.originalname || 'uploaded-video',
          },
        });

        uploadedFileName = uploaded.name;
        if (!uploadedFileName) {
          throw new Error('لم يتمكن الخادم من الحصول على معرف الملف من Gemini.');
        }

        let currentFile = await ai.files.get({ name: uploadedFileName });
        let pollAttempts = 0;
        while (currentFile.state === 'PROCESSING' && pollAttempts < 60) {
          await sleep(2000);
          currentFile = await ai.files.get({ name: uploadedFileName });
          pollAttempts += 1;
        }

        if (currentFile.state === 'FAILED') {
          throw new Error('فشلت معالجة الفيديو داخل Gemini Files API. جرب ملف MP4 قياسياً.');
        }
        if (currentFile.state !== 'ACTIVE' || !currentFile.uri) {
          throw new Error('انتهت مهلة معالجة الفيديو. يرجى تجربة فيديو أقصر.');
        }

        const languageDirective =
          narrationLanguage === 'auto'
            ? 'اختر لغة التعليق الصوتي (narration_script و caption_text و title_hook) بما يتناسب مع لغة الفيديو الأصلية، أو العربية إذا لم يكن هناك حوار واضح.'
            : `اكتب التعليق الصوتي (narration_script) والعناوين (title_hook و caption_text) باللغة: ${narrationLanguage}، واضبط حقل narrator_profile.language على ${narrationLanguage}.`;

        const userPrompt = [
          'قم بتحليل هذا الفيديو بالكامل ثانية بثانية واستخرج خطة الإنتاج الكاملة بالهيكل المطلوب.',
          `نسبة الأبعاد المستهدفة (target_aspect_ratio): ${targetAspectRatio}`,
          languageDirective,
          directorNotes ? `ملاحظات إخراجية إضافية من المستخدم: ${directorNotes}` : '',
        ]
          .filter(Boolean)
          .join('\n');

        const response = await withRetry(() =>
          ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    fileData: {
                      fileUri: currentFile.uri!,
                      mimeType: currentFile.mimeType || mimeType,
                    },
                  },
                  { text: userPrompt },
                ],
              },
            ],
            config: {
              systemInstruction: DIRECTOR_SYSTEM_INSTRUCTION,
              responseMimeType: 'application/json',
              responseSchema: productionPlanSchema,
            },
          }),
        );

        const text = (response.text ?? '').trim();
        if (!text) {
          throw new Error('أعاد النموذج استجابة فارغة. يرجى المحاولة مرة أخرى.');
        }

        const parsed = JSON.parse(text);
        res.json({ plan: parsed });
      } catch (err) {
        const formatted = formatGeminiError(err);
        res.status(formatted.status).json({ error: formatted.message });
      } finally {
        fs.promises.unlink(file.path).catch(() => {});
        if (uploadedFileName) {
          ai.files.delete({ name: uploadedFileName }).catch(() => {});
        }
      }
    });
  });

  app.post('/api/refine-scene', async (req: Request, res: Response) => {
    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: 'GEMINI_API_KEY غير مضبوط على الخادم.' });
      return;
    }

    const { scene, charactersBible, artStyle, instruction } = req.body ?? {};
    if (!scene || typeof instruction !== 'string' || !instruction.trim()) {
      res.status(400).json({ error: 'بيانات المشهد أو تعليمات التعديل مفقودة.' });
      return;
    }

    try {
      const response = await withRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `قم بتحسين وتحديث بيانات المشهد التالي بناءً على طلب المخرج، مع الحفاظ الصارم على وصف الشخصيات في characters_bible والأسلوب الفني العام (${artStyle || ''}) والتوقيت الزمني للمشهد.

دليل الشخصيات (Characters Bible):
${JSON.stringify(charactersBible ?? [], null, 2)}

المشهد الحالي:
${JSON.stringify(scene, null, 2)}

طلب المخرج للتعديل:
${instruction.trim()}`,
                },
              ],
            },
          ],
          config: {
            systemInstruction:
              'أنت مخرج سينمائي ومهندس برومبتات فيديو بالذكاء الاصطناعي. أعد إخراج كائن المشهد المحدث فقط بصيغة JSON صالحة مطابقة لنفس الحقول، مع إبقاء visual_prompt و image_to_video_motion بالإنجليزية وبأقصى دقة وتفصيل.',
            responseMimeType: 'application/json',
            responseSchema: productionPlanSchema.properties!.scenes.items!,
          },
        }),
      );

      const text = (response.text ?? '').trim();
      const updatedScene = JSON.parse(text);
      res.json({ scene: updatedScene });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
