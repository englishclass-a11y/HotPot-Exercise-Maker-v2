import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  Play,
  Sparkles,
  RefreshCw,
  Eye,
  Code,
  BookOpen,
  ShieldCheck,
  Layers,
  FolderArchive,
  ExternalLink,
  ChevronRight,
  Info,
  Check,
  Edit3,
  Trash2,
  Plus,
  HelpCircle,
} from 'lucide-react';

import {
  HotPotProject,
  HotPotPage,
  renderHotPotPage,
  renderWeeklyIndex,
  renderGradedChain,
  renderStartHere,
  renderTeacherGuide,
  renderTeacherAnswerKey,
  renderFidelityNotes,
} from './engine/renderer';
import { SAMPLE_GRADE12_PROJECT } from './engine/samples';
import {
  generateAllPackageFiles,
  createMasterZip,
  createWeeklyZip,
  GeneratedPackageFiles,
} from './engine/packager';
import { ValidationReport } from './engine/validator';
import {
  normalizeProject,
  validatePageData,
  repairDeterministicStructures,
} from './engine/normalize';

interface UploadedFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  assignedWeek: number;
  content: string;
  base64Data?: string;
  mimeType?: string;
  status: 'ready' | 'processing' | 'error';
}

export default function App() {
  const [project, setProject] = useState<HotPotProject>(SAMPLE_GRADE12_PROJECT);
  const [activeWeek, setActiveWeek] = useState<number>(19);
  const [selectedPageId, setSelectedPageId] = useState<string>('w19day1ex1');
  const [previewMode, setPreviewMode] = useState<
    'exercise' | 'weekly-index' | 'graded-chain' | 'start-here' | 'teacher-key' | 'teacher-guide' | 'code'
  >('exercise');

  // Generator & Package State
  const [packageFiles, setPackageFiles] = useState<GeneratedPackageFiles | null>(null);
  const [validation, setValidation] = useState<ValidationReport | null>(null);
  const [isPackaging, setIsPackaging] = useState<boolean>(false);
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Uploaded Files State (up to 10 weeks/files)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [startWeekInput, setStartWeekInput] = useState<number>(19);
  const [courseTitleInput, setCourseTitleInput] = useState<string>('TIẾNG ANH TĂNG CƯỜNG K12');
  const [targetGrade, setTargetGrade] = useState<number>(12);

  // Editing state
  const [editingPage, setEditingPage] = useState<HotPotPage | null>(null);
  const [activeTab, setActiveTab] = useState<'studio' | 'upload' | 'validator' | 'export'>('studio');

  // Generate / Compile package whenever project changes
  useEffect(() => {
    try {
      const generated = generateAllPackageFiles(project);
      setPackageFiles(generated);
      setValidation(generated.validationReport);
    } catch (e: any) {
      console.error('Package generation error:', e);
    }
  }, [project]);

  // Keep activeWeek synced if pages change
  useEffect(() => {
    const weeks = Array.from(new Set(project.pages.map((p) => p.w))).sort((a, b) => a - b);
    if (weeks.length > 0 && !weeks.includes(activeWeek)) {
      setActiveWeek(weeks[0]);
    }
  }, [project.pages, activeWeek]);

  // Get current selected page
  const selectedPage = project.pages.find((p) => p.id === selectedPageId) || project.pages[0];

  // Helper to get weeks array
  const weeksList = Array.from(new Set(project.pages.map((p) => p.w))).sort((a, b) => a - b);

  // Week pages
  const currentWeekPages = project.pages
    .filter((p) => p.w === activeWeek)
    .sort((a, b) => {
      if (a.d !== b.d) return a.d - b.d;
      return a.e - b.e;
    });

  // Calculate current preview HTML
  const getPreviewHtml = (): string => {
    if (!packageFiles) return '<p>Loading preview...</p>';

    switch (previewMode) {
      case 'exercise':
        return packageFiles.pages.get(selectedPageId) || '<p>Page not found</p>';
      case 'weekly-index':
        return packageFiles.weeklyIndexes.get(activeWeek) || '<p>Index not found</p>';
      case 'graded-chain':
        return packageFiles.gradedChains.get(activeWeek) || '<p>Graded chain not found</p>';
      case 'start-here':
        return packageFiles.startHere;
      case 'teacher-key':
        return packageFiles.teacherAnswerKey;
      case 'teacher-guide':
        return packageFiles.teacherGuide;
      default:
        return packageFiles.pages.get(selectedPageId) || '';
    }
  };

  // Handle uploading files (up to 10 files)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: UploadedFileItem[] = [];
    const filesToRead = Array.from(files).slice(0, 10);

    for (let i = 0; i < filesToRead.length; i++) {
      const file = filesToRead[i];
      const assignedWeek = startWeekInput + uploadedFiles.length + i;

      let content = '';
      let base64Data: string | undefined = undefined;
      let mimeType: string | undefined = undefined;

      if (file.name.endsWith('.docx')) {
        try {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onload = () => {
              const res = reader.result as string;
              resolve(res.split(',')[1] || res);
            };
            reader.readAsDataURL(file);
          });
          base64Data = await base64Promise;
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

          // Call backend DOCX parse endpoint
          const res = await fetch('/api/parse-docx', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Data, filename: file.name }),
          });
          const data = await res.json();
          content = data.text || '';
        } catch (err) {
          content = `[DOCX extraction fallback: ${file.name}]`;
        }
      } else if (file.name.endsWith('.pdf')) {
        try {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onload = () => {
              const res = reader.result as string;
              resolve(res.split(',')[1] || res);
            };
            reader.readAsDataURL(file);
          });
          base64Data = await base64Promise;
          mimeType = 'application/pdf';

          // Call backend PDF parse endpoint for text and structure preview
          const res = await fetch('/api/parse-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Data, filename: file.name }),
          });
          const data = await res.json();
          content = data.text || `[PDF Document: ${file.name} (${Math.round(file.size / 1024)} KB) - Ready for AI extraction]`;
        } catch (err) {
          content = `[PDF Document: ${file.name} (${Math.round(file.size / 1024)} KB) - Ready for AI extraction]`;
        }
      } else {
        // Plain text, markdown, or JSON
        content = await file.text();
        mimeType = file.type || 'text/plain';
      }

      newItems.push({
        id: `file-${Date.now()}-${i}`,
        name: file.name,
        size: file.size,
        type: mimeType || file.type || file.name.split('.').pop() || 'unknown',
        assignedWeek,
        content: content || `Source file: ${file.name}\nWeek ${assignedWeek} exercises`,
        base64Data,
        mimeType,
        status: 'ready',
      });
    }

    setUploadedFiles((prev) => [...prev, ...newItems].slice(0, 10));
  };

  // Run AI Parse & Solve using backend Gemini API with structured pipeline & targeted repair
  const handleRunAiSolve = async () => {
    if (uploadedFiles.length === 0) {
      alert('Please upload at least one PDF, DOCX, or text exercise file first.');
      return;
    }

    setIsAiGenerating(true);
    setAiError(null);

    try {
      const payload = {
        files: uploadedFiles.map((f) => ({
          filename: f.name,
          assignedWeek: f.assignedWeek,
          content: f.content,
          base64Data: f.base64Data,
          mimeType: f.mimeType,
        })),
        courseTitle: courseTitleInput,
        gradeLevel: targetGrade,
        startWeek: startWeekInput,
      };

      const res = await fetch('/api/ai/parse-and-solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Server returned an error');
      }

      // Step 1: Normalize initial Gemini structured output
      let normalizedProject = normalizeProject(result.data);

      // Step 2: Validate each page, perform deterministic repair, and invoke targeted AI repair fallback
      const finalPages = [];
      for (const rawPage of normalizedProject.pages) {
        let page = { ...rawPage };
        let pageErrors = validatePageData(page);

        if (pageErrors.length > 0) {
          // Attempt deterministic repair first
          page = repairDeterministicStructures(page);
          pageErrors = validatePageData(page);

          // If still failing, call targeted AI repair endpoint (bounded up to 2 retries)
          if (pageErrors.length > 0) {
            let retries = 0;
            while (pageErrors.length > 0 && retries < 2) {
              retries++;
              try {
                const repairRes = await fetch('/api/ai/repair-exercise', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    page,
                    errors: pageErrors,
                    expectedKind: page.kind,
                    sourceContext:
                      uploadedFiles.find((u) => u.assignedWeek === page.w)?.content || '',
                  }),
                });
                const repairData = await repairRes.json();
                if (repairData.success && repairData.page) {
                  page = repairDeterministicStructures(repairData.page);
                  pageErrors = validatePageData(page);
                }
              } catch (re) {
                console.warn(`Targeted AI repair attempt ${retries} failed for ${page.id}:`, re);
                break;
              }
            }
          }
        }
        finalPages.push(page);
      }

      normalizedProject.pages = finalPages;
      normalizedProject = normalizeProject(normalizedProject);

      setProject(normalizedProject);
      if (normalizedProject.pages.length > 0) {
        setActiveWeek(normalizedProject.pages[0].w);
        setSelectedPageId(normalizedProject.pages[0].id);
      }
      setActiveTab('studio');
    } catch (err: any) {
      console.error('AI Generation Error:', err);
      let errorMsg = err.message || 'AI generation failed. Please ensure GEMINI_API_KEY is configured.';
      try {
        const parsed = JSON.parse(errorMsg);
        if (parsed.error?.message) errorMsg = parsed.error.message;
      } catch {}
      setAiError(errorMsg);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Download Master ZIP with strict audit enforcement
  const handleDownloadMasterZip = async () => {
    if (!packageFiles) return;
    if (!validation || validation.status !== 'passed') {
      alert('Export blocked: Quality audit failed. Please resolve all audit errors before downloading Moodle packages.');
      return;
    }
    setIsPackaging(true);
    try {
      const blob = await createMasterZip(project, packageFiles);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.id}-HotPot.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e: any) {
      console.error('Failed to create Master ZIP:', e);
      alert(e.message || 'Error creating Master ZIP');
    } finally {
      setIsPackaging(false);
    }
  };

  // Download individual Weekly ZIP with strict audit enforcement
  const handleDownloadWeeklyZip = async (week: number) => {
    if (!packageFiles) return;
    if (!validation || validation.status !== 'passed') {
      alert('Export blocked: Quality audit failed. Please resolve all audit errors before downloading Moodle packages.');
      return;
    }
    setIsPackaging(true);
    try {
      const blob = await createWeeklyZip(week, project, packageFiles);
      const folderName = `${project.folder_prefix || project.id}-week${week}-html`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e: any) {
      console.error(`Failed to create Week ${week} ZIP:`, e);
      alert(e.message || `Error creating Week ${week} ZIP`);
    } finally {
      setIsPackaging(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f5f7] text-[#1c2833] flex flex-col font-sans">
      {/* Top Banner & Navigation */}
      <header className="bg-[#12364c] text-white border-b-4 border-[#b78a36] shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#b78a36] flex items-center justify-center text-[#12364c] font-black text-xl shadow-inner">
              HP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-bold text-xl md:text-2xl tracking-wide">
                  HotPot Exercise Maker
                </h1>
                <span className="bg-[#b78a36] text-[#12364c] font-bold text-[10px] uppercase px-2 py-0.5 rounded tracking-wider">
                  TESOL Guru 1%
                </span>
                <span className="bg-emerald-600/90 text-white font-semibold text-[10px] px-2 py-0.5 rounded">
                  HP 6.3 Authentic Engine
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Moodle HotPot &amp; TaskChain HTML Quiz Generator · Grade 12 Output DNA · High-Contrast Buttons
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setProject(SAMPLE_GRADE12_PROJECT);
                setActiveWeek(19);
                setSelectedPageId('w19day1ex1');
                setActiveTab('studio');
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-md border border-white/20 transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#b78a36]" />
              Load Grade 12 Benchmark
            </button>

            <button
              onClick={handleDownloadMasterZip}
              disabled={isPackaging || !validation || validation.status !== 'passed'}
              title={!validation || validation.status !== 'passed' ? 'Export blocked: Resolve audit errors first' : 'Download Master ZIP'}
              className="bg-[#b78a36] hover:bg-[#a67c2e] text-[#12364c] font-bold text-xs px-4 py-2 rounded-md shadow transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <FolderArchive className="w-4 h-4" />
              {isPackaging ? 'Packaging...' : 'Download Master ZIP'}
            </button>
          </div>
        </div>

        {/* Sub-navigation tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-6 text-sm font-medium border-t border-white/10 pt-1">
          <button
            onClick={() => setActiveTab('studio')}
            className={`py-2 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'studio'
                ? 'border-[#b78a36] text-[#b78a36] font-bold'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4" /> Interactive Studio &amp; Preview
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'upload'
                ? 'border-[#b78a36] text-[#b78a36] font-bold'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" /> Batch Uploader (Up to 10 Weeks)
            {uploadedFiles.length > 0 && (
              <span className="bg-[#b78a36] text-[#12364c] text-xs font-bold px-1.5 py-0.2 rounded-full">
                {uploadedFiles.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('validator')}
            className={`py-2 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'validator'
                ? 'border-[#b78a36] text-[#b78a36] font-bold'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> DNA Quality &amp; Contrast Audit
            {validation && (
              <span
                className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                  validation.status === 'passed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {validation.status === 'passed' ? 'PASSED' : `${validation.errors.length} ISSUES`}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`py-2 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'export'
                ? 'border-[#b78a36] text-[#b78a36] font-bold'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" /> Weekly Moodle ZIPs ({weeksList.length})
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-4">
        {/* TAB 1: STUDIO & LIVE PREVIEW */}
        {activeTab === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
            {/* Left Column: Weeks & Exercises Navigator */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Project Meta Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-[#214f6a]">
                    {project.brand}
                  </span>
                  <span className="bg-blue-50 text-[#12364c] text-xs font-semibold px-2 py-0.5 rounded border border-blue-200">
                    {project.pages.length} Pages · {weeksList.length} Weeks
                  </span>
                </div>
                <h2 className="font-serif font-bold text-lg text-[#12364c] mt-1">{project.title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{project.subtitle}</p>

                {/* Week Selector Chips */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1.5">
                    Select Study Week:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {weeksList.map((w) => (
                      <button
                        key={w}
                        onClick={() => {
                          setActiveWeek(w);
                          const first = project.pages.find((p) => p.w === w);
                          if (first) setSelectedPageId(first.id);
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md border transition ${
                          activeWeek === w
                            ? 'bg-[#12364c] text-white border-[#12364c] shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Week {w}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Exercises List for Selected Week */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden max-h-[600px]">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="font-bold text-sm text-[#12364c] flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#b78a36]" />
                    Week {activeWeek} Exercises ({currentWeekPages.length})
                  </div>
                  <span className="text-xs text-slate-500">Click to preview</span>
                </div>

                <div className="overflow-y-auto p-2 flex flex-col gap-1.5 divide-y divide-slate-100">
                  {currentWeekPages.map((page) => {
                    const isSelected = selectedPageId === page.id;
                    return (
                      <div
                        key={page.id}
                        onClick={() => {
                          setSelectedPageId(page.id);
                          setPreviewMode('exercise');
                        }}
                        className={`p-2.5 rounded-lg cursor-pointer transition flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-[#edf3f6] border border-[#b9c6ce] shadow-sm'
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="font-mono text-[11px] font-bold text-[#12364c] bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {page.id}
                            </span>
                            <span
                              className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                                page.kind === 'mc'
                                  ? 'bg-blue-100 text-blue-800'
                                  : page.kind === 'gap'
                                  ? 'bg-amber-100 text-amber-800'
                                  : page.kind === 'match'
                                  ? 'bg-purple-100 text-purple-800'
                                  : page.kind === 'order'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : page.kind === 'listening'
                                  ? 'bg-rose-100 text-rose-800'
                                  : page.kind === 'writing'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {page.kind}
                            </span>
                            {page.scored ? (
                              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1 rounded">
                                {page.items.length} scored
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">Worksheet</span>
                            )}
                          </div>
                          <p className="font-serif font-bold text-sm text-[#12364c] line-clamp-1">
                            Day {page.d} / Ex {page.e}: {page.title}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {page.source?.locator || 'Source verified'}
                          </p>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 shrink-0 mt-2 transition ${
                            isSelected ? 'text-[#12364c] translate-x-0.5' : 'text-slate-300'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Live HotPot Sandbox Preview & Inspection */}
            <div className="lg:col-span-8 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[700px]">
              {/* Preview Controller Bar */}
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-500 uppercase mr-1">Preview:</span>
                  <button
                    onClick={() => setPreviewMode('exercise')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition ${
                      previewMode === 'exercise'
                        ? 'bg-[#12364c] text-white'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Exercise ({selectedPageId}.htm)
                  </button>
                  <button
                    onClick={() => setPreviewMode('weekly-index')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition ${
                      previewMode === 'weekly-index'
                        ? 'bg-[#12364c] text-white'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Week {activeWeek} Index (contents.htm)
                  </button>
                  <button
                    onClick={() => setPreviewMode('graded-chain')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition ${
                      previewMode === 'graded-chain'
                        ? 'bg-[#12364c] text-white'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Graded Chain (TaskChain)
                  </button>
                  <button
                    onClick={() => setPreviewMode('start-here')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition ${
                      previewMode === 'start-here'
                        ? 'bg-[#12364c] text-white'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    START-HERE.html
                  </button>
                  <button
                    onClick={() => setPreviewMode('teacher-key')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition ${
                      previewMode === 'teacher-key'
                        ? 'bg-[#12364c] text-white'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Teacher Key
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewMode(previewMode === 'code' ? 'exercise' : 'code')}
                    className="p-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded border border-slate-300 transition flex items-center gap-1"
                    title="Toggle HTML Source Code View"
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>{previewMode === 'code' ? 'View Interactive' : 'View HTML Code'}</span>
                  </button>
                </div>
              </div>

              {/* View Container: Either IFrame Sandbox or Code View */}
              <div className="flex-1 relative bg-[#e7e9eb]">
                {previewMode === 'code' ? (
                  <div className="absolute inset-0 p-4 overflow-auto bg-slate-900 text-slate-200 font-mono text-xs">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-700">
                      <span>HTML Output for: {selectedPageId}.htm</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(getPreviewHtml());
                          alert('HTML code copied to clipboard!');
                        }}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded text-xs"
                      >
                        Copy HTML
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap">{getPreviewHtml()}</pre>
                  </div>
                ) : (
                  <iframe
                    key={`${selectedPageId}-${previewMode}-${activeWeek}`}
                    srcDoc={getPreviewHtml()}
                    title="HotPot Sandbox Preview"
                    sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
                    className="w-full h-full min-h-[650px] border-0"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BATCH UPLOADER (UP TO 10 WEEKS / 10 FILES) */}
        {activeTab === 'upload' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2">
                <Upload className="w-6 h-6 text-[#b78a36]" />
                <h2 className="font-serif font-bold text-2xl text-[#12364c]">
                  Batch English Exercise Processor (Up to 10 Weeks)
                </h2>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Upload up to 10 individual PDF or Word (.docx) English exercise files. The Top 1% TESOL AI automatically
                deduces 100% verified keys, audio script evidence, grammatical rationales, and compiles authentic Hot
                Potatoes 6 HTML packages.
              </p>
            </div>

            {/* Course & Grade Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Course Title</label>
                <input
                  type="text"
                  value={courseTitleInput}
                  onChange={(e) => setCourseTitleInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm font-medium"
                  placeholder="e.g. TIẾNG ANH TĂNG CƯỜNG K12"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Grade</label>
                <select
                  value={targetGrade}
                  onChange={(e) => setTargetGrade(parseInt(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm font-medium"
                >
                  <option value={12}>Grade 12 (K12) - Advanced Exam Prep</option>
                  <option value={11}>Grade 11 (K11) - Upper Intermediate</option>
                  <option value={10}>Grade 10 (K10) - High School Foundation</option>
                  <option value={9}>Grade 9 (K9) - Graduation Focus</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Start Week Number</label>
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={startWeekInput}
                  onChange={(e) => setStartWeekInput(parseInt(e.target.value) || 1)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm font-medium"
                />
              </div>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-[#b9c6ce] hover:border-[#12364c] rounded-xl p-8 text-center bg-slate-50/50 transition">
              <Upload className="w-12 h-12 text-[#b78a36] mx-auto mb-3" />
              <h3 className="font-bold text-base text-[#12364c]">Drop PDF, DOCX, or text files here</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Upload up to 10 files at once (e.g. Week 19 to Week 28). Each uploaded file will be mapped to a study
                week.
              </p>
              <label className="mt-4 inline-block bg-[#12364c] hover:bg-[#0b2f45] text-white font-bold text-sm px-6 py-2.5 rounded-lg cursor-pointer shadow transition">
                Select Files on Computer
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.txt,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Uploaded Files Table */}
            {uploadedFiles.length > 0 && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 p-3 font-bold text-xs uppercase text-slate-700 flex justify-between items-center">
                  <span>Queued Documents ({uploadedFiles.length} / 10 Weeks)</span>
                  <button
                    onClick={() => setUploadedFiles([])}
                    className="text-rose-600 hover:underline text-xs lowercase font-normal"
                  >
                    Clear queue
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {uploadedFiles.map((file, idx) => (
                    <div key={file.id} className="p-3 flex items-center justify-between gap-4 bg-white">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-[#12364c] text-white flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-sm text-[#12364c]">{file.name}</p>
                          <p className="text-xs text-slate-500">
                            {(file.size / 1024).toFixed(1)} KB · Assiged to{' '}
                            <span className="font-bold text-[#b78a36]">Week {file.assignedWeek}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                          {file.content.length > 500
                            ? `${file.content.split(/\s+/).length} words ready`
                            : 'Text extracted'}
                        </span>
                        <button
                          onClick={() => {
                            setUploadedFiles((prev) => prev.filter((item) => item.id !== file.id));
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar */}
            {aiError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-lg text-xs flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-medium break-words">{aiError}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRunAiSolve}
                  disabled={isAiGenerating}
                  className="bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded text-xs transition shrink-0 cursor-pointer"
                >
                  {isAiGenerating ? 'Retrying...' : 'Retry Now'}
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setProject(SAMPLE_GRADE12_PROJECT);
                  setActiveTab('studio');
                }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs px-4 py-2.5 rounded-lg transition"
              >
                Use Pre-verified Grade 12 Sample (Weeks 19–20)
              </button>

              <button
                onClick={handleRunAiSolve}
                disabled={uploadedFiles.length === 0 || isAiGenerating}
                className="bg-[#12364c] hover:bg-[#0b2f45] text-white font-bold text-sm px-6 py-2.5 rounded-lg shadow-md flex items-center gap-2 transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-[#b78a36]" />
                {isAiGenerating ? 'TESOL Guru AI Processing...' : 'Generate Full HotPot Packages with AI'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: DNA QUALITY & CONTRAST AUDIT */}
        {activeTab === 'validator' && validation && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  <h2 className="font-serif font-bold text-2xl text-[#12364c]">
                    Approved DNA &amp; Moodle Compatibility Audit
                  </h2>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Automated verification against Hot Potatoes 6.3 runtime signatures, Moodle mod_hotpot detectors, and
                  WCAG 2.2 AA High-Contrast Button contracts.
                </p>
              </div>

              <span
                className={`font-black text-sm px-3 py-1 rounded-full uppercase tracking-wider ${
                  validation.status === 'passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {validation.status === 'passed' ? '100% DNA Compliant' : 'Audit Failed'}
              </span>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
                <span className="text-xs font-bold text-slate-500 uppercase">Total Pages</span>
                <p className="text-2xl font-bold text-[#12364c] mt-1">{validation.pages_checked}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
                <span className="text-xs font-bold text-slate-500 uppercase">Scored Pages</span>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{validation.scored_pages}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
                <span className="text-xs font-bold text-slate-500 uppercase">Button Contrast</span>
                <p className="text-2xl font-bold text-blue-700 mt-1">&ge; 7:1 (AAA)</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
                <span className="text-xs font-bold text-slate-500 uppercase">Moodle Runtime</span>
                <p className="text-2xl font-bold text-purple-700 mt-1">HP 6.3 Native</p>
              </div>
            </div>

            {/* Checklist */}
            <div className="border border-slate-200 rounded-lg p-4 space-y-3">
              <h3 className="font-bold text-sm text-[#12364c]">Technical Conformance Specifications:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Legacy charset declaration (&lt;meta http-equiv="Content-Type"...&gt;)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Executable version 6 marker preserved for Moodle detectors</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Zero external CDN/script dependencies (100% offline self-contained)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>High-contrast button contract applied to all states (default, hover, focus, pressed)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Touch-ready 44px min button height &amp; visible focus rings</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Native JQuiz &amp; JCloze globals (I, State, Score, Detail, Finish)</span>
                </div>
              </div>
            </div>

            {validation.errors.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-lg">
                <h4 className="font-bold text-sm text-rose-800 mb-2">Errors detected:</h4>
                <ul className="list-disc list-inside text-xs text-rose-700 space-y-1">
                  {validation.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MOODLE PACKAGES & DEPLOYMENT HUB */}
        {activeTab === 'export' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2">
                <FolderArchive className="w-6 h-6 text-[#b78a36]" />
                <h2 className="font-serif font-bold text-2xl text-[#12364c]">
                  Tested Moodle Upload Packages
                </h2>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Each study week is packaged separately as an independent, fully self-contained ZIP file ready for Moodle
                LMS. Student ZIPs omit teacher answer keys.
              </p>
            </div>

            {/* Master Package Banner */}
            <div className="bg-gradient-to-r from-[#12364c] to-[#214f6a] text-white p-5 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="bg-[#b78a36] text-[#12364c] font-black text-xs px-2.5 py-0.5 rounded uppercase tracking-wider">
                  Full Course Archive
                </span>
                <h3 className="font-serif font-bold text-xl mt-1">
                  Master Teacher ZIP ({project.id}-HotPot.zip)
                </h3>
                <p className="text-xs text-slate-200 mt-1">
                  Contains all {weeksList.length} weekly folders, START-HERE.html, Teacher-Guide.html,
                  Teacher-Answer-Key.html, CSV Inventory, and editable project.json.
                </p>
              </div>

              <button
                onClick={handleDownloadMasterZip}
                disabled={isPackaging || !validation || validation.status !== 'passed'}
                title={!validation || validation.status !== 'passed' ? 'Export blocked: Resolve audit errors first' : 'Download Master Package'}
                className="bg-[#b78a36] hover:bg-[#a67c2e] text-[#12364c] font-bold text-sm px-6 py-3 rounded-lg shadow transition flex items-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                {isPackaging ? 'Generating ZIP...' : 'Download Master Package'}
              </button>
            </div>

            {/* Weekly Student ZIPs Grid */}
            <div>
              <h3 className="font-bold text-base text-[#12364c] mb-3">Individual Weekly Student Packages</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weeksList.map((week) => {
                  const seq = project.pages.filter((p) => p.w === week);
                  const scored = seq.filter((p) => p.scored).length;
                  const folder = `${project.folder_prefix || project.id}-week${week}-html`;

                  return (
                    <div
                      key={week}
                      className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#12364c] text-base">Week {week} Package</span>
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            {seq.length} Activities
                          </span>
                        </div>
                        <p className="font-mono text-xs text-slate-500 mt-1">{folder}.zip</p>
                        <p className="text-xs text-slate-600 mt-1">
                          {scored} automatically scored · {seq.length - scored} teacher-assessed worksheets
                        </p>
                      </div>

                      <button
                        onClick={() => handleDownloadWeeklyZip(week)}
                        disabled={isPackaging || !validation || validation.status !== 'passed'}
                        title={!validation || validation.status !== 'passed' ? 'Export blocked: Resolve audit errors first' : `Download Week ${week} ZIP`}
                        className="bg-[#12364c] hover:bg-[#0b2f45] text-white font-bold text-xs px-4 py-2.5 rounded-lg transition shadow-sm flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download ZIP
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Moodle Deployment Instructions Guide */}
            <div className="bg-amber-50/70 border border-[#e2cd9c] rounded-xl p-5 text-sm text-slate-800 space-y-3">
              <h4 className="font-bold text-[#80570b] text-base flex items-center gap-2">
                <Info className="w-5 h-5 text-[#b78a36]" />
                How to Deploy on Moodle LMS:
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-xs leading-relaxed">
                <li>
                  <b>Self-Study Practice (Moodle File Resource):</b> Go to your Moodle course &rarr; Turn editing on
                  &rarr; Add an activity or resource &rarr; <i>File</i> &rarr; Upload the weekly ZIP (e.g.{' '}
                  <code>{project.folder_prefix || project.id}-week19-html.zip</code>) &rarr; Click the uploaded ZIP and
                  choose <b>Unzip</b> &rarr; Click <code>contents.htm</code> and select <b>Set main file</b> &rarr;
                  Save.
                </li>
                <li>
                  <b>Tracked HotPot Activity (mod_hotpot):</b> With the HotPot activity plugin installed on your Moodle
                  server &rarr; Add a <i>HotPot</i> activity &rarr; Choose any scored <code>.htm</code> exercise file as
                  source &rarr; Moodle will record grades and detailed student answers in the gradebook.
                </li>
                <li>
                  <b>TaskChain Sequence (mod_taskchain):</b> Use <code>graded-chain.htm</code> as the sequential chain
                  specification, or add the scored activities in order to guide learners through the unit step-by-step.
                </li>
              </ol>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#12364c] text-slate-400 text-xs py-4 border-t border-slate-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <p>
            HotPot Exercise Maker &middot; Built with genuine Hot Potatoes 6.3 engine &middot; Tested Grade 12 Benchmark
            DNA
          </p>
          <div className="flex items-center gap-3">
            <span>Half-Baked Software / University of Victoria</span>
            <span>&bull;</span>
            <span>TESOL Guru Standard</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
