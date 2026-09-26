/**
 * Package Generator using JSZip
 * Produces compliant Master ZIP and individual Weekly student ZIPs.
 * Enforces strict export blocking when project validation fails.
 */

import JSZip from 'jszip';
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
  ENGINE_VERSION,
} from './renderer';
import { validateProject, ValidationReport } from './validator';
import { normalizeProject } from './normalize';

export interface GeneratedPackageFiles {
  pages: Map<string, string>; // pageId -> html
  weeklyIndexes: Map<number, string>; // week -> html
  gradedChains: Map<number, string>; // week -> html
  startHere: string;
  teacherGuide: string;
  teacherAnswerKey: string;
  fidelityNotes: string;
  csvInventory: string;
  buildManifest: any;
  validationReport: ValidationReport;
}

export function generateAllPackageFiles(rawProject: HotPotProject): GeneratedPackageFiles {
  // Normalize project data structures before rendering
  const project = normalizeProject(rawProject);

  const pages = new Map<string, string>();
  const weeklyIndexes = new Map<number, string>();
  const gradedChains = new Map<number, string>();

  const weeks = Array.from(new Set(project.pages.map(p => p.w))).sort((a, b) => a - b);

  for (const week of weeks) {
    const seq = project.pages.filter(p => p.w === week).sort((a, b) => {
      if (a.d !== b.d) return a.d - b.d;
      return a.e - b.e;
    });

    for (const page of seq) {
      const html = renderHotPotPage(page, seq, project);
      pages.set(page.id, html);
    }

    weeklyIndexes.set(week, renderWeeklyIndex(week, seq, project));
    gradedChains.set(week, renderGradedChain(week, seq, project));
  }

  const startHere = renderStartHere(project);
  const teacherGuide = renderTeacherGuide(project);
  const teacherAnswerKey = renderTeacherAnswerKey(project);
  const fidelityNotes = renderFidelityNotes(project);

  // Generate CSV Inventory
  const csvRows = [
    ['Week', 'Day', 'Exercise', 'Filename', 'Type', 'Scored responses', 'Review items', 'Source file', 'Source location'],
  ];
  for (const p of project.pages) {
    csvRows.push([
      String(p.w),
      String(p.d),
      String(p.e),
      `${p.id}.htm`,
      p.kind,
      String(p.scored ? p.items.length : 0),
      String(p.review?.length || 0),
      p.source?.file || project.title,
      p.source?.locator || `Week ${p.w}, Day ${p.d}, Ex ${p.e}`,
    ]);
  }
  const csvInventory = csvRows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');

  // Validate exact rendered pages
  const validationReport = validateProject(project, pages);

  const buildManifest = {
    project_id: project.id,
    folder_prefix: project.folder_prefix || project.id,
    engine_version: ENGINE_VERSION,
    page_count: project.pages.length,
    scored_pages: validationReport.scored_pages,
    weeks,
    data_validation: validationReport.status,
    html_validation: validationReport.status,
    moodle_ready: validationReport.status === 'passed',
    error_count: validationReport.errors.length,
    warning_count: validationReport.warnings.length,
    static: validationReport,
    timestamp: new Date().toISOString(),
  };

  return {
    pages,
    weeklyIndexes,
    gradedChains,
    startHere,
    teacherGuide,
    teacherAnswerKey,
    fidelityNotes,
    csvInventory,
    buildManifest,
    validationReport,
  };
}

/**
 * Generate a single weekly student ZIP containing ONLY student files
 * (no teacher guides, no answer keys). Blocks export if validation failed.
 */
export async function createWeeklyZip(
  week: number,
  project: HotPotProject,
  packageFiles: GeneratedPackageFiles
): Promise<Blob> {
  if (packageFiles.validationReport.status !== 'passed') {
    throw new Error(
      `Export blocked: Week ${week} contains ${packageFiles.validationReport.errors.length} audit error(s). Please repair issues before packaging.`
    );
  }

  const zip = new JSZip();
  const folderName = `${project.folder_prefix || project.id}-week${week}-html`;
  const seq = project.pages.filter(p => p.w === week);

  const indexHtml = packageFiles.weeklyIndexes.get(week) || '';
  const chainHtml = packageFiles.gradedChains.get(week) || '';

  zip.file('contents.htm', indexHtml);
  zip.file('index.html', indexHtml);
  zip.file('graded-chain.htm', chainHtml);
  zip.file(
    'README.txt',
    `Open contents.htm for self-study. Use scored .htm files in HotPot/TaskChain for Moodle tracking; graded-chain.htm lists them in order. A Moodle File resource does not submit grades.\n`
  );

  for (const p of seq) {
    const html = packageFiles.pages.get(p.id) || '';
    zip.file(`${p.id}.htm`, html);
  }

  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } });
}

/**
 * Generate the Master Teacher ZIP with all weekly subfolders,
 * START-HERE.html, teacher guides, answer keys, CSV inventory, manifest, and authoring source.
 * Blocks export if validation failed.
 */
export async function createMasterZip(
  project: HotPotProject,
  packageFiles: GeneratedPackageFiles
): Promise<Blob> {
  if (packageFiles.validationReport.status !== 'passed') {
    throw new Error(
      `Export blocked: Project failed quality audit with ${packageFiles.validationReport.errors.length} error(s). Please repair issues before packaging.`
    );
  }

  const zip = new JSZip();

  zip.file('START-HERE.html', packageFiles.startHere);
  zip.file('Teacher-Guide.html', packageFiles.teacherGuide);
  zip.file('Teacher-Answer-Key.html', packageFiles.teacherAnswerKey);
  zip.file('source-fidelity-notes.html', packageFiles.fidelityNotes);
  zip.file('exercise-inventory.csv', packageFiles.csvInventory);
  zip.file('build-manifest.json', JSON.stringify(packageFiles.buildManifest, null, 2));
  zip.file('validation-report.json', JSON.stringify(packageFiles.validationReport, null, 2));

  // Authoring folder with editable JSON project
  const authoringFolder = zip.folder('authoring');
  if (authoringFolder) {
    authoringFolder.file('project.json', JSON.stringify(project, null, 2));
  }

  // Subfolders for each week
  const weeks = Array.from(new Set(project.pages.map(p => p.w))).sort((a, b) => a - b);
  for (const week of weeks) {
    const folderName = `${project.folder_prefix || project.id}-week${week}-html`;
    const weekFolder = zip.folder(folderName);
    if (!weekFolder) continue;

    const seq = project.pages.filter(p => p.w === week);
    const indexHtml = packageFiles.weeklyIndexes.get(week) || '';
    const chainHtml = packageFiles.gradedChains.get(week) || '';

    weekFolder.file('contents.htm', indexHtml);
    weekFolder.file('index.html', indexHtml);
    weekFolder.file('graded-chain.htm', chainHtml);
    weekFolder.file(
      'README.txt',
      `Open contents.htm for self-study. Use scored .htm files in HotPot/TaskChain for Moodle tracking; graded-chain.htm lists them in order.\n`
    );

    for (const p of seq) {
      const html = packageFiles.pages.get(p.id) || '';
      weekFolder.file(`${p.id}.htm`, html);
    }
  }

  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } });
}
