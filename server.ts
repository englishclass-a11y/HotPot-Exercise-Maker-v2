import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize GoogleGenAI SDK on server side
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Parse DOCX buffer using mammoth
app.post('/api/parse-docx', async (req: Request, res: Response) => {
  try {
    const { base64Data, filename } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'base64Data is required' });
    }
    const buffer = Buffer.from(base64Data, 'base64');
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    res.json({ success: true, text, filename, warnings: result.messages });
  } catch (error: any) {
    console.error('Error parsing DOCX:', error);
    res.status(500).json({ error: error.message || 'Failed to parse DOCX file' });
  }
});

// Parse PDF buffer using Gemini document/vision capabilities
app.post('/api/parse-pdf', async (req: Request, res: Response) => {
  try {
    const { base64Data, filename } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'base64Data is required' });
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: base64Data,
              },
            },
            {
              text: `Please transcribe and extract all text, headings, exercises, questions, multiple-choice options, matching tables, crossword grids, and word banks from this PDF document with exact pedagogical fidelity. Preserve question numbering and structure.`,
            },
          ],
        },
      ],
    });

    const text = response.text || '';
    res.json({ success: true, text, filename });
  } catch (error: any) {
    console.error('Error parsing PDF:', error);
    res.status(500).json({ error: error.message || 'Failed to parse PDF document with Gemini' });
  }
});

// Strict Project Response Schema for @google/genai structured outputs
const projectResponseSchema = {
  type: Type.OBJECT,
  properties: {
    schema_version: { type: Type.INTEGER },
    id: { type: Type.STRING },
    folder_prefix: { type: Type.STRING },
    title: { type: Type.STRING },
    brand: { type: Type.STRING },
    subtitle: { type: Type.STRING },
    source_inventory: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          file: { type: Type.STRING },
          locator: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['id', 'file', 'locator', 'questions'],
      },
    },
    pages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          w: { type: Type.INTEGER },
          d: { type: Type.INTEGER },
          e: { type: Type.INTEGER },
          source_id: { type: Type.STRING },
          title: { type: Type.STRING },
          kind: { type: Type.STRING },
          instructions: { type: Type.STRING },
          intro: { type: Type.STRING },
          learner_note: { type: Type.STRING },
          passage: { type: Type.STRING },
          bank: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                value: { type: Type.STRING },
                label: { type: Type.STRING },
              },
              required: ['value', 'label'],
            },
          },
          cards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                value: { type: Type.STRING },
                label: { type: Type.STRING },
              },
              required: ['value', 'label'],
            },
          },
          placements: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                item: { type: Type.INTEGER },
                row: { type: Type.INTEGER },
                col: { type: Type.INTEGER },
                direction: { type: Type.STRING },
              },
              required: ['item', 'row', 'col', 'direction'],
            },
          },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                n: { type: Type.STRING },
                source_n: { type: Type.STRING },
                prompt: { type: Type.STRING },
                answer: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                key_status: { type: Type.STRING },
                evidence: { type: Type.STRING },
                feedback: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['n', 'prompt', 'answer'],
            },
          },
          writing: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              prompt: { type: Type.STRING },
              rubric: { type: Type.STRING },
              checklist: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              model: { type: Type.STRING },
            },
          },
        },
        required: ['id', 'w', 'd', 'e', 'source_id', 'title', 'kind', 'items'],
      },
    },
    notes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ['schema_version', 'id', 'folder_prefix', 'title', 'source_inventory', 'pages'],
};

// Strict Page Response Schema for targeted exercise repair
const pageResponseSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    w: { type: Type.INTEGER },
    d: { type: Type.INTEGER },
    e: { type: Type.INTEGER },
    source_id: { type: Type.STRING },
    title: { type: Type.STRING },
    kind: { type: Type.STRING },
    instructions: { type: Type.STRING },
    intro: { type: Type.STRING },
    learner_note: { type: Type.STRING },
    passage: { type: Type.STRING },
    bank: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          value: { type: Type.STRING },
          label: { type: Type.STRING },
        },
        required: ['value', 'label'],
      },
    },
    cards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          value: { type: Type.STRING },
          label: { type: Type.STRING },
        },
        required: ['value', 'label'],
      },
    },
    placements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.INTEGER },
          row: { type: Type.INTEGER },
          col: { type: Type.INTEGER },
          direction: { type: Type.STRING },
        },
        required: ['item', 'row', 'col', 'direction'],
      },
    },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          n: { type: Type.STRING },
          source_n: { type: Type.STRING },
          prompt: { type: Type.STRING },
          answer: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          key_status: { type: Type.STRING },
          evidence: { type: Type.STRING },
          feedback: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['n', 'prompt', 'answer'],
      },
    },
    writing: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        prompt: { type: Type.STRING },
        rubric: { type: Type.STRING },
        checklist: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        model: { type: Type.STRING },
      },
    },
  },
  required: ['id', 'w', 'd', 'e', 'source_id', 'title', 'kind', 'items'],
};

// AI Parse and Solve endpoint using gemini-3.8-flash with structured output schema
app.post('/api/ai/parse-and-solve', async (req: Request, res: Response) => {
  try {
    const { files, courseTitle, gradeLevel, startWeek } = req.body;
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'At least one file or exercise text is required' });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are a qualified senior lecturer of the English language and guru in TESOL, ranked in the Top 1% globally.
Your task is to parse English practice source documents into a fully validated HotPot Exercise Maker project schema.
Requirements:
1. Generate complete, verified keys and answer explanations based on standard British/American English grammar, syntax, and semantics. Never invent exercises or drop questions.
2. Invariants for supported exercise kinds:
   - "match": The "bank" array is MANDATORY and must contain at least 2 items with unique values (e.g. [{value: "a", label: "..."}]). Every item in "items" must have answer: ["a"] matching a valid bank value.
   - "order": The "cards" array is MANDATORY and must contain at least 2 cards with unique values (e.g. [{value: "a", label: "..."}]). There must be exactly 1 item in "items" with answer: ["a-b-c-d"] referencing every card value in the canonical sequence.
   - "crossword": Vocabulary crossword with "items" (clues). Clue answers must be UPPERCASE alphabetic words without spaces. Placements array contains [{item: 0, row: 0, col: 0, direction: "across"}].
   - "multi": Multiple-response question. Provide "options" strings, and item answer as sorted hyphen-separated string of option letters (e.g. ["A-C"]).
   - "mc": Multiple choice. Provide "options" strings, and answer array of zero-based index strings (e.g. ["0"] for A, ["1"] for B).
   - "gap": Gap-fill / sentence rewrite. Prompt contains {{gap}} where blank appears, answer array contains accepted strings.
   - "passage": Reading cloze. Passage contains {{0}}, {{1}}, etc. Items array contains accepted words.
   - "writing": Open writing task. Writing object has title, prompt, rubric, checklist, model.
   - "listening": If listening audio transcript is present, extract verified keys. If absent, set key_status: "missing" with answer: [].
3. Week numbers must start at ${startWeek || 19} (or as indicated in source). Page IDs must strictly be "w{w}day{d}ex{e}".
4. schema_version must be 1.`;

    const userParts: any[] = [
      {
        text: `Course Title: ${courseTitle || 'English Language Practice'}\nTarget Grade: ${gradeLevel || 12}\nBase Start Week: ${startWeek || 19}\n\nPlease parse the following source documents into the requested HotPot Exercise Maker project schema:`,
      },
    ];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const assignedWeek = f.assignedWeek || (startWeek || 19) + i;
      userParts.push({
        text: `\n--- SOURCE DOCUMENT ${i + 1}: ${f.filename || `File ${i + 1}`} (Assigned Week: ${assignedWeek}) ---`,
      });

      if (f.base64Data && (f.mimeType === 'application/pdf' || (f.filename && f.filename.endsWith('.pdf')))) {
        userParts.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: f.base64Data,
          },
        });
      } else if (f.content) {
        userParts.push({
          text: f.content,
        });
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: userParts }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: projectResponseSchema,
        temperature: 0.1,
      },
    });

    const responseText = response.text || '{}';
    const parsedData = JSON.parse(responseText);
    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error generating HotPot project with Gemini:', error);
    res.status(500).json({ error: error.message || 'Failed to generate exercises with Gemini' });
  }
});

// Targeted AI Exercise Repair endpoint
app.post('/api/ai/repair-exercise', async (req: Request, res: Response) => {
  try {
    const { page, errors, sourceContext, expectedKind } = req.body;
    if (!page) {
      return res.status(400).json({ error: 'Exercise page data is required' });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are a TESOL guru and HotPot exercise technician.
Your job is to repair a specific exercise page that failed structural audit.
Specific guidelines:
- If kind is 'match': ensure 'bank' has at least 2 entries with unique values and every item's answer matches a bank value.
- If kind is 'order': ensure 'cards' has at least 2 cards and items has exactly 1 sequence item with answer: ["a-b-c-d"] referencing every card value.
- If kind is 'crossword': ensure clue answers are UPPERCASE letters and placements are valid without character conflicts.
- Retain existing correct prompt text, evidence, and pedagogical notes. Repair only the missing or invalid structural fields.`;

    const promptText = `Please repair this ${expectedKind || page.kind} page to resolve the following audit errors:
AUDIT ERRORS:
${(errors || []).join('\n')}

PAGE DATA TO REPAIR:
${JSON.stringify(page, null, 2)}

${sourceContext ? `SOURCE CONTEXT:\n${sourceContext}` : ''}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: pageResponseSchema,
        temperature: 0.1,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, page: parsed });
  } catch (error: any) {
    console.error('Error repairing exercise with Gemini:', error);
    res.status(500).json({ error: error.message || 'Failed to repair exercise' });
  }
});

// Mount Vite or serve static files
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`HotPot Exercise Maker server running at http://0.0.0.0:${port}`);
  });
}

startServer();
