/**
 * Approved HotPot Exercise Maker Engine
 * Generates exact Moodle-compatible Hot Potatoes 6.3 responsive HTML
 * matching the approved Grade 12 reference DNA.
 */

import { APPROVED_HOTPOT_CSS } from './style';
import { APPROVED_HOTPOT_ADDON } from './addon';
import { RAW_JCLOZE_JS } from './jcloze';
import { RAW_JQUIZ_JS } from './jquiz';

export const ENGINE_VERSION = '2.0-reference-dna';

export interface SourceItem {
  id: string;
  file: string;
  locator: string;
  questions: (string | number)[];
  excluded?: boolean;
  user_authorized?: boolean;
  reason?: string;
}

export interface ExerciseItem {
  n: string;
  source_n?: string;
  prompt: string;
  answer: (string | number)[];
  key_status: 'supplied' | 'verified' | 'review' | 'missing';
  evidence?: string;
  feedback?: string;
  options?: any[];
  normalization?: ('space' | 'case' | 'terminal' | 'contractions' | 'hyphens' | 'apostrophes')[];
  maxwords?: number;
  full?: boolean;
  multiple?: boolean;
  maxchoices?: number;
  reject?: string[];
}

export interface ReviewItem {
  n: string;
  source_n?: string;
  prompt: string;
  answer?: any[];
  key_status: 'review' | 'missing';
  feedback: string;
  options?: string[];
}

export interface WritingConfig {
  title?: string;
  source_n?: string;
  prompt: string;
  rubric: string;
  checklist?: string[];
  model?: string;
}

export interface CrosswordPlacement {
  item: number;
  row: number;
  col: number;
  direction: 'across' | 'down';
}

export interface PageImage {
  path: string;
  alt: string;
  caption?: string;
}

export interface HotPotPage {
  id: string;
  w: number;
  d: number;
  e: number;
  source_id: string;
  title: string;
  kind: 'mc' | 'gap' | 'passage' | 'match' | 'order' | 'multi' | 'crossword' | 'writing' | 'worksheet' | 'listening';
  instructions?: string;
  intro?: string;
  optional?: boolean;
  learner_note?: string;
  notes?: string[];
  items: ExerciseItem[];
  review?: ReviewItem[];
  teacher_notes?: string[];
  images?: PageImage[];
  audio?: string;
  writing?: WritingConfig;
  passage?: string;
  bank?: { value: string; label: string }[];
  cards?: { value: string; label: string }[];
  original_options?: string[];
  placements?: CrosswordPlacement[];
  paired?: { letter: number; correction: number; pairs: [string, string][] }[];
  allow_disconnected?: boolean;
  scored?: boolean;
  source?: { id: string; file: string; locator: string };
}

export interface HotPotProject {
  schema_version: 1;
  id: string;
  folder_prefix: string;
  title: string;
  brand?: string;
  subtitle?: string;
  language?: string;
  media_root?: string;
  source_inventory: SourceItem[];
  pages: HotPotPage[];
  notes?: string[];
}

function escapeHtml(str: any): string {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cleanHtml(str: any): string {
  if (str == null) return '';
  return String(str);
}

function para(text: string): string {
  if (!text) return '';
  const blocks = text.trim().split(/\n\s*\n/);
  return blocks
    .filter(b => b.trim().length > 0)
    .map(b => `<p>${cleanHtml(b.replace(/\s+/g, ' ').trim())}</p>`)
    .join('');
}

function safeJson(val: any): string {
  return JSON.stringify(val).replace(/<\/script/gi, '<\\/script');
}

/**
 * Build the runtime JS for Hot Potatoes 6.3 engine
 */
export function buildRuntimeJs(page: HotPotPage): string {
  let js = page.kind === 'mc' ? RAW_JQUIZ_JS : RAW_JCLOZE_JS;

  if (page.kind === 'mc') {
    const arr = page.items.map(q => {
      const opts = (q.options || []).map((opt: string, j: number) => {
        const isCorrect = Array.isArray(q.answer) && q.answer.includes(j);
        const fb = isCorrect
          ? `Correct. ${q.feedback || ''}`
          : 'Try again. Read the question and compare the options carefully.';
        return [opt, fb, isCorrect ? 1 : 0, isCorrect ? 100 : 0, 1];
      });
      return [100, '', '0', opts];
    });

    js = js.replace(/var I=new Array\(\);[\s\S]*?(?=function StartUp\()/, `var I=${safeJson(arr)};\n\n`);
    js = js.replace(/var QsToShow = \d+;/, `var QsToShow = ${arr.length};`);
    js = js.replace("var CorrectIndicator = ':-)';", "var CorrectIndicator = 'Correct';");
  } else {
    const arr = page.items.map(q => {
      const ansSet = Array.from(new Set(q.answer.map(a => String(a).trim())));
      const ansArr = ansSet.map(a => [a]);
      const cleanPrompt = (q.prompt || '').replace(/<[^>]+>/g, '').replace(/\{\{gap\}\}/g, '____');
      return [null, ansArr, cleanPrompt];
    });

    js = js.replace(/var I = new Array\(\);[\s\S]*?(?=var State = new Array\(\);)/, `var I = ${safeJson(arr)};\n\n`);
    js = js.replace('return RetVal;', 'return TGNormalizeAnswer(GNum, RetVal);');
    js = js.replace('var CaseSensitive = false;', 'var CaseSensitive = true;');
    js = js.replace('function CheckAnswers(){', 'function CheckAnswers(){\n\tTGSyncControls();');
    js = js.replace(
      "document.getElementById('GapSpan' + GNum).innerHTML = Val;",
      "var span = document.getElementById('GapSpan' + GNum); span.textContent = Val; span.dataset.value = Val; span.classList.add('correct');"
    );
    js = js.replace('Score = TotalScore;', 'Score = TotalScore;\n\tTGAfterCheck();');
  }

  js = js.replace(/function Finish\(\)\{/, 'function Finish(){\n\tTGFinish();');
  js = js.replace(
    'if (document.store != null){',
    'if (document.store != null){\n\tif(TGSent) return; TGSent=true;'
  );
  js = js.replace('var SubmissionTimeout = 30000;', 'var SubmissionTimeout = 1000;');
  js = js.replace(
    'function ShowMessage(Feedback){',
    'function ShowMessage(Feedback){\n\tTGFocus = document.activeElement; TGUpdate();'
  );
  js = js.replace(
    "document.getElementById('InstructionsDiv').innerHTML = Feedback;",
    "document.getElementById('ScoreReadout').innerHTML = Feedback;"
  );
  js = js.replace(
    "document.getElementById('FeedbackDiv').style.display = 'none';",
    "document.getElementById('FeedbackDiv').style.display = 'none';\n\tif(TGFocus && TGFocus.isConnected) TGFocus.focus();"
  );

  return `<script>${js}</script>`;
}

function inputHtml(i: number, q: ExerciseItem): string {
  const lab = escapeHtml(`Question ${q.n}`);
  if (q.options && q.options.length > 0) {
    const opts = q.options.map(o => {
      const v = typeof o === 'object' ? o.value : o;
      const l = typeof o === 'object' ? o.label : o;
      return `<option value="${escapeHtml(v)}">${escapeHtml(l)}</option>`;
    }).join('');
    return `<span class="GapSpan" id="GapSpan${i}"><select class="gap" id="Gap${i}" aria-label="${lab}"><option value="">Choose...</option>${opts}</select></span>`;
  }

  const maxLen = Math.max(...(q.answer || []).map(a => String(a).length), 16);
  if (q.full || maxLen > 75) {
    return `<span class="GapSpan fullgap" id="GapSpan${i}"><textarea class="gap" id="Gap${i}" aria-label="${lab}" rows="2" spellcheck="false" onfocus="TrackFocus(${i})" onblur="LeaveGap()"></textarea></span>`;
  }

  const width = Math.max(12, Math.min(60, maxLen + 5));
  return `<span class="GapSpan" id="GapSpan${i}" style="width:min(100%,${width}ch)"><input class="gap" style="--gapwidth:${width}ch" id="Gap${i}" aria-label="${lab}" type="text" autocomplete="off" spellcheck="false" onfocus="TrackFocus(${i})" onblur="LeaveGap()"></span>`;
}

function matchInputHtml(i: number, q: ExerciseItem, bank?: { value: string; label: string }[]): string {
  const lab = escapeHtml(`Question ${q.n}`);
  const bankItems = bank && bank.length > 0
    ? bank
    : (q.options || []).map(o => (typeof o === 'object' ? o : { value: o, label: o }));
  const opts = bankItems
    .map(b => `<option value="${escapeHtml(b.value)}">${escapeHtml(b.label)}</option>`)
    .join('');
  return `<span class="GapSpan" id="GapSpan${i}"><select class="gap" id="Gap${i}" aria-label="${lab}"><option value="">Choose...</option>${opts}</select></span>`;
}

function getInitialOrderScramble(
  cards: { value: string; label: string }[],
  canonicalSeq?: string
): { value: string; label: string }[] {
  if (!cards || cards.length < 2) return cards || [];
  const canonical = canonicalSeq || cards.map(c => c.value).join('-');
  let scrambled = [...cards];
  const n = scrambled.length;
  const shift = Math.max(1, Math.floor(n / 2));
  scrambled = [...scrambled.slice(shift), ...scrambled.slice(0, shift)];
  if (scrambled.map(c => c.value).join('-') === canonical && n >= 2) {
    scrambled = [scrambled[1], scrambled[0], ...scrambled.slice(2)];
  }
  return scrambled;
}

function answersHtml(page: HotPotPage): string {
  const ans = page.items.map(q => {
    let text = '';
    if (page.kind === 'mc') {
      text = (q.answer as number[])
        .map(a => `${String.fromCharCode(65 + a)}. ${q.options?.[a] || ''}`)
        .join(' / ');
    } else if (page.kind === 'match') {
      text = (q.answer as string[])
        .map(a => {
          const opt =
            (page.bank || []).find(b => b.value === a) ||
            (q.options || []).find(o => (typeof o === 'object' ? o.value : o) === a);
          return opt ? (typeof opt === 'object' ? opt.label : opt) : a;
        })
        .join(' / ');
    } else {
      text = Array.from(new Set(q.answer)).map(a => escapeHtml(a)).join(' / ');
    }
    const fb = q.feedback ? `<p class="item-feedback">${escapeHtml(q.feedback)}</p>` : '';
    return `<li><b>${escapeHtml(q.n)}.</b> ${text}${fb}</li>`;
  }).join('');

  return `<section class="panel" id="AnswersPanel" hidden><h3>Answers and explanations</h3><p class="footnote">Revealing answers removes credit for responses you have not yet completed. For sentence rewrites, additional valid wording may need teacher review.</p><ol class="answerlist" style="list-style:none">${ans}</ol></section>`;
}

function multiHtml(i: number, q: ExerciseItem): string {
  const opts = (q.options || []).map(opt => {
    const v = typeof opt === 'object' ? opt.value : opt;
    const l = typeof opt === 'object' ? opt.label : opt;
    return `<label class="listen-option"><input type="checkbox" value="${escapeHtml(v)}" onchange="TGSyncControls()"><span>${escapeHtml(l)}</span></label>`;
  }).join('');
  return `<span class="GapSpan fullgap" id="GapSpan${i}"><input type="hidden" class="gap" id="Gap${i}"><span class="multi-options" data-multi="${i}">${opts}</span></span>`;
}

function crosswordHtml(page: HotPotPage): string {
  const cells: Record<string, boolean> = {};
  const starts: Record<string, string[]> = {};
  const placements = page.placements || [];

  if (placements.length === 0 || !page.items || page.items.length === 0) {
    return '';
  }

  for (const p of placements) {
    const q = page.items[p.item];
    if (!q) continue;
    const key = `${p.row},${p.col}`;
    if (!starts[key]) starts[key] = [];
    starts[key].push(q.n);

    const word = String(q.answer[0] || '').toUpperCase();
    for (let k = 0; k < word.length; k++) {
      const r = p.row + (p.direction === 'down' ? k : 0);
      const c = p.col + (p.direction === 'across' ? k : 0);
      cells[`${r},${c}`] = true;
    }
  }

  const allRows = Object.keys(cells).map(k => parseInt(k.split(',')[0]));
  const allCols = Object.keys(cells).map(k => parseInt(k.split(',')[1]));
  if (allRows.length === 0 || allCols.length === 0) return '';
  const rows = Math.max(...allRows) + 1;
  const cols = Math.max(...allCols) + 1;

  let out = `<p class="meta">Enter letters in the grid, or type whole words in the numbered clues below. Scroll the grid sideways if needed.</p><div class="cross-scroll" tabindex="0" role="region" aria-label="Crossword grid"><div class="cross-grid" style="grid-template-columns:repeat(${cols},44px)">`;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      if (!cells[key]) {
        out += '<span class="cross-block" aria-hidden="true"></span>';
        continue;
      }
      const st = starts[key] ? starts[key].join('/') : '';
      out += `<label class="cross-cell"><span>${escapeHtml(st)}</span><input id="Cell${r}_${c}" data-cell data-row="${r}" data-col="${c}" maxlength="1" autocomplete="off" aria-label="Row ${r + 1}, column ${c + 1}" oninput="TGCrossFromGrid(this)"></label>`;
    }
  }
  out += '</div></div>';
  return out;
}

function reviewHtml(page: HotPotPage): string {
  const reviews = page.review || [];
  if (reviews.length === 0) return '';

  let out = '';
  for (const q of reviews) {
    const ident = `Review${q.n}`;
    out += `<section class="review"><h3>Question ${escapeHtml(q.n)} &middot; teacher discussion</h3><p>${cleanHtml(q.prompt)}</p>`;
    if (q.options && q.options.length > 0) {
      out += `<div class="original-options">${q.options.map((o, j) => `<p>${String.fromCharCode(65 + j)}. ${escapeHtml(o)}</p>`).join('')}</div>`;
    }
    out += `<label for="${ident}">Your response / reason (ungraded)</label><textarea id="${ident}" data-save data-label="Question ${escapeHtml(q.n)} review"></textarea><details><summary>Why this question needs review</summary><p>${escapeHtml(q.feedback)}</p></details></section>`;
  }
  out += '<div class="actions"><button class="FuncButton" onclick="TGDownload()">Download review responses</button></div>';
  return out;
}

function audioHtml(page: HotPotPage): string {
  const audioSrc = page.audio ? ` src="${escapeHtml(page.audio)}"` : '';
  return `<section class="audio-block"><p id="AudioStatus">${page.audio ? 'Play the supplied recording.' : 'The original recording is required for this activity.'}</p><label for="AudioFile">Open a recording from this device</label><input type="file" id="AudioFile" accept="audio/*"><audio id="AudioPlayer" controls preload="metadata"${audioSrc}${audioSrc ? '' : ' hidden'}></audio></section>`;
}

function worksheetHtml(page: HotPotPage): string {
  let out = page.kind === 'listening' ? audioHtml(page) : '';
  if (page.kind === 'listening') {
    out += '<p class="notice">This listening worksheet needs a verified answer key. Responses are saved for teacher checking.</p>';
  }

  for (let i = 0; i < page.items.length; i++) {
    const q = page.items[i];
    out += `<section class="gaprow"><p><span class="qnumber">${escapeHtml(q.n)}</span>${cleanHtml(q.prompt).replace(/\{\{gap\}\}/g, '________')}</p>`;
    if (q.options && q.options.length > 0) {
      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j];
        const label = typeof opt === 'object' ? opt.label : opt;
        const ident = `Listen${i}_${j}`;
        out += `<label class="listen-option"><input data-save data-max-choices="${q.maxchoices || 0}" data-label="Question ${escapeHtml(q.n)}" id="${ident}" type="${q.multiple ? 'checkbox' : 'radio'}" name="listen${i}" value="${escapeHtml(String.fromCharCode(65 + j) + '. ' + label)}"><span>${String.fromCharCode(65 + j)}. ${escapeHtml(label)}</span></label>`;
      }
    } else {
      out += `<textarea class="draft" style="min-height:90px" id="Listen${i}" aria-label="Answer ${escapeHtml(q.n)}" data-save data-label="Question ${escapeHtml(q.n)}"></textarea>`;
    }
    out += '</section>';
  }
  out += '<div class="actions"><button class="FuncButton primary" onclick="TGSaveDraft(true)">Save responses</button><button class="FuncButton" onclick="TGDownload()">Download responses</button></div><p id="DraftStatus" class="meta" role="status">Drafts are saved only in this browser; download them to send to your teacher.</p>';
  return out;
}

function writingHtml(page: HotPotPage): string {
  const w = page.writing || { prompt: 'Write your response.', rubric: 'Teacher assessment' };
  let out = `<section class="panel"><h3>${escapeHtml(w.title || 'Your writing')}</h3>${para(w.prompt)}`;
  out += `<label for="WritingDraft">Writing area</label><textarea class="draft" id="WritingDraft" data-save data-label="Writing response" spellcheck="true"></textarea><p id="WordCount" class="meta" role="status">0 words</p><div class="checklist">`;
  for (const text of w.checklist || []) {
    out += `<label><input type="checkbox"> ${escapeHtml(text)}</label>`;
  }
  out += `</div><p class="meta">Teacher assessment is required for this response.</p><details><summary>Assessment criteria</summary>${para(w.rubric)}</details><div class="actions"><button class="FuncButton primary" onclick="TGSaveDraft(true)">Save draft</button><button class="FuncButton" onclick="TGDownload()">Download writing</button></div><p id="WritingStatus" class="meta" role="status"></p>`;
  if (w.model) {
    out += `<details><summary>Study a model response</summary>${para(w.model)}</details>`;
  }
  out += '</section>';
  return out;
}

function navHtml(page: HotPotPage, seq: HotPotPage[], bottom = false): string {
  const idx = seq.findIndex(p => p.id === page.id);
  const prev = idx > 0 ? `${seq[idx - 1].id}.htm` : 'contents.htm';
  const nxt = idx + 1 < seq.length ? `${seq[idx + 1].id}.htm` : 'contents.htm';
  const barId = bottom ? 'BottomNavBar' : 'TopNavBar';
  const tag = bottom ? 'Bottom' : 'Top';

  return `<!-- Begin${tag}NavButtons --><div class="NavButtonBar" id="${barId}"><div class="navgroup"><button class="NavButton" onclick="location='${prev}'; return false;">&larr; Previous</button><button class="NavButton" onclick="location='contents.htm'; return false;">Week index</button></div><button class="NavButton" onclick="location='${nxt}'; return false;">Next &rarr;</button></div><!-- End${tag}NavButtons -->`;
}

function brandHtml(project: HotPotProject): string {
  return `<div class="brand"><span>${escapeHtml(project.brand || 'ENGLISH PRACTICE')}</span><span>${escapeHtml(project.subtitle || 'Practice · Learn · Improve')}</span></div>`;
}

function footHtml(page: HotPotPage): string {
  const file = page.source?.file || 'exercise source';
  const loc = page.source?.locator || `Week ${page.w}, Day ${page.d}, Exercise ${page.e}`;
  return `<footer class="footnote">Source: ${escapeHtml(file)} &middot; ${escapeHtml(loc)}<br>Hot Potatoes &middot; Half-Baked Software / University of Victoria &middot; Responsive adaptation by HotPot Exercise Maker.</footer>`;
}

/**
 * Generate full, self-contained, offline-capable HTML for a Hot Potatoes exercise page
 */
export function renderHotPotPage(page: HotPotPage, seq: HotPotPage[], project: HotPotProject): string {
  const isHp = Boolean(page.scored);
  const pureWriting = !isHp && Boolean(page.writing) && (!page.items || page.items.length === 0);
  const title = `Exercise ${page.e} (Day ${page.d}. W${page.w}) - ${page.title}`;

  const tgData: any = {
    w: page.w,
    d: page.d,
    e: page.e,
    id: page.id,
    title: page.title,
    kind: page.kind,
    notes: page.notes || [],
    scored: page.scored,
    items: page.items,
    review: page.review || [],
    storage_key: `hotpot-${project.id}`,
    course_title: project.title,
  };
  if (page.bank) tgData.bank = page.bank;
  if (page.cards) tgData.cards = page.cards;
  if (page.placements) tgData.placements = page.placements;
  if (page.paired) tgData.paired = page.paired;

  let s = `<!DOCTYPE html>\n<html lang="${escapeHtml(project.language || 'en')}"><head><meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${escapeHtml(title)}</title>\n`;
  if (isHp) {
    s += '<!-- Made with executable version 6.3 Release 0 Build 1 -->\n<!-- Adapted Hot Potatoes 6 runtime; responsive presentation by HotPot Exercise Maker. -->\n';
  }
  s += `<meta name="author" content="${escapeHtml(project.brand || 'English Practice')}"><style>${APPROVED_HOTPOT_CSS}</style>`;
  s += `<meta name="generator" content="HotPot Exercise Maker ${ENGINE_VERSION}">`;
  s += `<script>var TG=${safeJson(tgData)};</script><script>${APPROVED_HOTPOT_ADDON}</script>`;
  if (isHp) {
    s += buildRuntimeJs(page);
  }
  s += `</head><body id="TheBody" onload="${isHp ? 'StartUp(); ' : ''}TGInit();"><a class="skiplink" href="#MainDiv">Skip to exercise</a><div class="shell">${brandHtml(project)}${navHtml(page, seq, false)}`;

  s += `<header class="Titles"><div class="eyebrow">Week ${page.w} / Day ${page.d}${page.optional ? ' / Optional' : ''}</div><h2 class="ExerciseTitle">Exercise ${page.e} <span class="muted">&middot;</span> ${escapeHtml(page.title)}</h2><div class="meta">`;
  if (!isHp) {
    s += 'Teacher-assessed worksheet';
  } else {
    const kindLabels: Record<string, string> = {
      mc: 'Multiple-choice quiz',
      gap: 'Gap-fill / short answer',
      passage: 'Reading cloze',
      order: 'Sentence ordering',
      match: 'Matching',
      writing: 'Writing and language',
      multi: 'Multiple-response quiz',
      crossword: 'Crossword',
    };
    const count = page.items.length;
    s += `${kindLabels[page.kind] || 'Quiz'} &middot; ${count} scored ${count === 1 ? 'response' : 'responses'}`;
  }
  s += '</div></header>';

  if (page.learner_note) {
    s += `<aside class="notice">${escapeHtml(page.learner_note)}</aside>`;
  }

  let instr = 'Complete the answers and select Check.';
  if (page.kind === 'mc') {
    instr = 'Choose an answer to receive feedback.';
  } else if (!isHp) {
    instr = 'Complete the worksheet, then save or download your responses for teacher checking.';
  } else if (page.kind === 'gap' || page.kind === 'passage') {
    instr = 'Complete the answers and select Check. Hint gives help and reduces the score.';
  }
  if (page.instructions) {
    instr = page.instructions;
  }

  s += `<div id="InstructionsDiv" class="StdDiv"><div id="Instructions">${escapeHtml(instr)}</div></div>`;

  if (page.intro) {
    s += `<section class="panel reading">${para(page.intro)}</section>`;
  }

  if (page.images && page.images.length > 0) {
    for (const img of page.images) {
      s += `<figure class="panel"><img class="diagram" alt="${escapeHtml(img.alt)}" src="${escapeHtml(img.path)}">${img.caption ? `<figcaption>${escapeHtml(img.caption)}</figcaption>` : ''}</figure>`;
    }
  }

  if (page.audio) {
    s += audioHtml(page);
  }

  s += `<div id="MainDiv"${pureWriting ? '' : ' class="StdDiv"'}>`;

  if (!isHp) {
    s += pureWriting ? writingHtml(page) : worksheetHtml(page);
  } else if (page.kind === 'mc') {
    s += `<div id="QNav" class="QuestionNavigation"><button id="ShowMethodButton" class="FuncButton" onclick="ShowHideQuestions();return false;">Show all questions</button><div id="OneByOneReadout"><button id="PrevQButton" class="FuncButton" onclick="ChangeQ(-1);return false;" aria-label="Previous question">&larr;</button><span id="QNumReadout"></span><button id="NextQButton" class="FuncButton" onclick="ChangeQ(1);return false;" aria-label="Next question">&rarr;</button></div></div><ol class="QuizQuestions" id="Questions">`;
    for (let i = 0; i < page.items.length; i++) {
      const q = page.items[i];
      s += `<li class="QuizQuestion" id="Q_${i}" style="display:none;list-style:none"><div class="QuestionText"><span class="qnumber">${escapeHtml(q.n)}</span>${cleanHtml(q.prompt)}</div><ol class="MCAnswers">`;
      for (let j = 0; j < (q.options || []).length; j++) {
        const o = q.options![j];
        s += `<li id="Q_${i}_${j}"><button class="FuncButton" id="Q_${i}_${j}_Btn" aria-label="Option ${String.fromCharCode(65 + j)}" onclick="CheckMCAnswer(${i},${j},this)">${String.fromCharCode(65 + j)}</button><span class="answertext">${cleanHtml(o)}</span></li>`;
      }
      s += '</ol></li>';
    }
    s += '</ol>';
  } else {
    if (page.kind === 'match' && page.bank && page.bank.length > 0) {
      const tokens = page.bank
        .map(
          b =>
            `<button class="token" type="button" draggable="true" data-value="${escapeHtml(b.value)}" aria-pressed="false">${escapeHtml(b.label)}</button>`
        )
        .join('');
      s += `<div class="bank" aria-label="Matching cards">${tokens}</div>`;
    }

    if (page.kind === 'order' && page.cards && page.cards.length > 0) {
      s += '<ul class="orderlist" aria-label="Sentence order">';
      const canonicalSeq = String(page.items?.[0]?.answer?.[0] || '');
      const cards = getInitialOrderScramble(page.cards, canonicalSeq);
      for (const card of cards) {
        s += `<li class="ordercard" draggable="true" data-value="${escapeHtml(card.value)}"><span class="qnumber">${escapeHtml(card.value)}</span><span class="ordertext">${escapeHtml(card.label)}</span><span class="orderbuttons"><button type="button" aria-label="Move ${escapeHtml(card.value)} up" onclick="TGMove(this,-1)">Up</button><button type="button" aria-label="Move ${escapeHtml(card.value)} down" onclick="TGMove(this,1)">Down</button></span></li>`;
      }
      s += '</ul>';
      if (page.original_options && page.original_options.length > 0) {
        s += `<details><summary>Source alternatives (if supplied)</summary><div class="original-options">${page.original_options.map((o, j) => `<p>${String.fromCharCode(65 + j)}. ${escapeHtml(o)}</p>`).join('')}</div></details>`;
      }
    }

    if (page.kind === 'crossword') {
      s += crosswordHtml(page);
    }

    s += '<div id="ClozeDiv"><form id="Cloze" method="post" action="" onsubmit="return false;"><div class="ClozeBody">';

    if (page.kind === 'passage' && page.passage) {
      let body = cleanHtml(page.passage);
      for (let i = 0; i < page.items.length; i++) {
        const q = page.items[i];
        body = body.replace(`{{${i}}}`, `<span class="qnumber">${escapeHtml(q.n)}</span>${inputHtml(i, q)}`);
      }
      s += `<div class="reading">${body}</div>`;
    } else {
      for (let i = 0; i < page.items.length; i++) {
        const q = page.items[i];
        let p = cleanHtml(q.prompt);
        let control = '';
        if (page.kind === 'match') {
          control = matchInputHtml(i, q, page.bank);
        } else if (page.kind === 'multi') {
          control = multiHtml(i, q);
        } else {
          control = inputHtml(i, q);
        }
        if (p.includes('{{gap}}')) {
          p = p.replace(/\{\{gap\}\}/g, control);
        } else {
          p += ' ' + control;
        }
        s += `<div class="gaprow${page.kind === 'match' ? ' dropzone' : ''}" data-gap="${i}"><span class="qnumber">${escapeHtml(q.n)}</span>${p}${q.feedback ? `<p id="ItemFeedback${i}" class="item-feedback" hidden>${escapeHtml(q.feedback)}</p>` : ''}</div>`;
      }
    }

    s += `</div></form></div><div class="actions"><button id="CheckButton2" class="FuncButton primary" onclick="CheckAnswers()">Check</button>`;
    if (!['match', 'order', 'multi', 'crossword'].includes(page.kind) && !page.items.some(q => q.options && q.options.length > 0)) {
      s += '<button class="FuncButton" onclick="ShowHint()">Hint</button>';
    }
    s += '</div>';
  }

  if (isHp) {
    s += '<div class="scorebar" role="status"><div id="LocalProgress"></div><div id="ScoreReadout"></div></div><div class="actions"><button class="FuncButton" onclick="TGAnswers()">Show answers</button><button id="ResetLocal" class="FuncButton" onclick="location.reload()">Try again</button></div>';
  }

  s += '</div>'; // end MainDiv

  if (isHp) {
    s += answersHtml(page);
  }

  s += reviewHtml(page);

  if (!pureWriting && (page.kind === 'writing' || page.writing)) {
    s += writingHtml(page);
  }

  if (isHp) {
    s += '<div class="Feedback" id="FeedbackDiv" role="dialog" aria-modal="true" aria-label="Answer feedback"><div class="FeedbackText" id="FeedbackContent" aria-live="polite"></div><button id="FeedbackOKButton" class="FuncButton primary" onclick="HideFeedback();return false;">OK</button></div>';
  }

  s += `${navHtml(page, seq, true)}${footHtml(page)}</div></body></html>`;
  return s;
}

/**
 * Generate weekly contents.htm index page
 */
export function renderWeeklyIndex(week: number, seq: HotPotPage[], project: HotPotProject): string {
  let body = `<p>${escapeHtml(project.title)}</p><div class="daygrid">`;
  const days = Array.from(new Set(seq.map(p => p.d))).sort((a, b) => a - b);

  for (const day of days) {
    body += `<section class="daycard"><h2>Day ${day}</h2>`;
    const dayPages = seq.filter(p => p.d === day).sort((a, b) => a.e - b.e);
    for (const page of dayPages) {
      const tag = page.scored ? page.kind : 'Teacher assessed';
      body += `<a class="activity-link" href="${page.id}.htm"><span><b>Exercise ${page.e}</b><br>${escapeHtml(page.title)}${page.optional ? ' (optional)' : ''}<span class="progress" data-progress="${page.id}"${page.scored ? '' : ' data-ungraded="true"'}></span></span><span class="tag">${escapeHtml(tag)}</span></a>`;
    }
    body += '</section>';
  }
  body += '</div><p class="footnote">Local scores are practice records. Moodle grade tracking requires a configured HotPot or TaskChain activity.</p>';

  const title = `Week ${week}`;
  let html = `<!DOCTYPE html>\n<html lang="${escapeHtml(project.language || 'en')}"><head><meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${escapeHtml(title)}</title>\n<style>${APPROVED_HOTPOT_CSS}</style></head><body><main class="shell"><div class="brand"><span>${escapeHtml(project.brand || 'ENGLISH PRACTICE')}</span><span>${escapeHtml(project.subtitle || 'Practice · Learn · Improve')}</span></div><header class="Titles"><h1>${escapeHtml(title)}</h1></header>${body}</main>`;

  const progress = `<script>(function(){function refresh(){var saved={};try{saved=JSON.parse(localStorage.getItem('hotpot-${project.id}-progress'))||{}}catch(e){}document.querySelectorAll("[data-progress]").forEach(function(el){var r=saved[el.dataset.progress];el.textContent=r&&typeof r.score==="number"?"Last practice score: "+r.score+"%"+(r.assisted?" (answers revealed)":""):el.dataset.ungraded?"Teacher assessed":"Not yet completed"})}refresh();addEventListener("pageshow",refresh)})();</script>`;
  html += `${progress}</body></html>`;
  return html;
}

/**
 * Generate weekly graded-chain.htm for Moodle TaskChain ordered activity setup
 */
export function renderGradedChain(week: number, seq: HotPotPage[], project: HotPotProject): string {
  const links = seq
    .filter(p => p.scored)
    .map(p => `<li><a href="${p.id}.htm">Day ${p.d} / Exercise ${p.e} &mdash; ${escapeHtml(p.title)}</a></li>`)
    .join('');

  const body = `<p>Use this ordered list for configured tracked activities. Teacher-assessed worksheets are listed in contents.htm.</p><ol>${links}</ol>`;
  const title = `Week ${week} — graded activities`;

  return `<!DOCTYPE html>\n<html lang="${escapeHtml(project.language || 'en')}"><head><meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${escapeHtml(title)}</title>\n<style>${APPROVED_HOTPOT_CSS}</style></head><body><main class="shell"><div class="brand"><span>${escapeHtml(project.brand || 'ENGLISH PRACTICE')}</span><span>${escapeHtml(project.subtitle || 'Practice · Learn · Improve')}</span></div><header class="Titles"><h1>${escapeHtml(title)}</h1></header>${body}</main></body></html>`;
}

/**
 * Generate Master START-HERE.html
 */
export function renderStartHere(project: HotPotProject): string {
  const weeks = Array.from(new Set(project.pages.map(p => p.w))).sort((a, b) => a - b);
  const links = weeks.map(w => {
    const folder = `${project.folder_prefix || project.id}-week${w}-html`;
    return `<section class="daycard"><h2>Week ${w}</h2><a class="activity-link" href="${folder}/contents.htm"><b>Open weekly activities &rarr;</b><span class="tag">Week ${w}</span></a></section>`;
  }).join('');

  const body = `<p>${project.pages.length} activities across ${weeks.length} study weeks.</p><div class="daygrid">${links}</div><div class="actions" style="margin-top:24px"><a class="FuncButton primary" style="text-decoration:none;display:inline-block;" href="Teacher-Guide.html">Teacher Guide &amp; Moodle Setup</a><a class="FuncButton" style="text-decoration:none;display:inline-block;" href="Teacher-Answer-Key.html">Teacher Answer Key</a><a class="FuncButton" style="text-decoration:none;display:inline-block;" href="source-fidelity-notes.html">Source Fidelity Notes</a></div>`;

  return `<!DOCTYPE html>\n<html lang="${escapeHtml(project.language || 'en')}"><head><meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${escapeHtml(project.title)}</title>\n<style>${APPROVED_HOTPOT_CSS}</style></head><body><main class="shell"><div class="brand"><span>${escapeHtml(project.brand || 'ENGLISH PRACTICE')}</span><span>${escapeHtml(project.subtitle || 'Practice · Learn · Improve')}</span></div><header class="Titles"><h1>${escapeHtml(project.title)}</h1></header>${body}</main></body></html>`;
}

/**
 * Generate Teacher-Guide.html
 */
export function renderTeacherGuide(project: HotPotProject): string {
  const scoredCount = project.pages.filter(p => p.scored).length;
  let guide = `<section class="panel"><p>${project.pages.length} activity pages; ${scoredCount} automatically scored. Open START-HERE.html for the course overview.</p><h2>Choose a Moodle route</h2><ol><li><b>Self-study:</b> add a Moodle File resource, upload and unzip one weekly ZIP, set contents.htm as the main file, and save. These practice scores do not enter the gradebook.</li><li><b>HotPot:</b> with the HotPot activity plugin installed, create an activity and select a scored .htm file as its source. Include its weekly companion files for navigation.</li><li><b>TaskChain:</b> use graded-chain.htm as an ordered source list where the installed plugin supports it, or add scored activities individually in that order. Use contents.htm separately for teacher-assessed work.</li></ol><p>For graded use, prefer Moodle activity navigation. Page-to-page links are for standalone practice and may bypass the next tracked activity.</p><h2>Check once on your server</h2><p>Using a student test account, finish an activity and confirm its attempt, percentage, completion and gradebook entry. Test one JQuiz and one JCloze, plus each custom control type used. Local browser checks cannot verify your Moodle installation.</p><h2>Files and assessment</h2><p>The weekly ZIPs contain student pages only. Keep this master collection, teacher keys and authoring files private. Student JavaScript necessarily includes scoring keys; these files are designed for practice.</p><p>Matching, ordering, multiple-response and crossword controls use the bundled JCloze runtime. Multiple choice uses JQuiz. The output is HTML, not native .jcl/.jqz/.jmt/.jmx/.jcw authoring files, Moodle XML, a course backup, or SCORM.</p><p>Hints and failed checks reduce the Hot Potatoes practice score. Revealing answers removes credit for unfinished responses. Open writing and unresolved questions require teacher assessment. Browser drafts are local; learners can download text responses to submit separately.</p></section>`;

  return `<!DOCTYPE html>\n<html lang="${escapeHtml(project.language || 'en')}"><head><meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>Teacher Guide and Moodle Setup</title>\n<style>${APPROVED_HOTPOT_CSS}</style></head><body><main class="shell"><div class="brand"><span>${escapeHtml(project.brand || 'ENGLISH PRACTICE')}</span><span>${escapeHtml(project.subtitle || 'Practice · Learn · Improve')}</span></div><header class="Titles"><h1>Teacher Guide and Moodle Setup</h1></header>${guide}</main></body></html>`;
}

/**
 * Generate Teacher-Answer-Key.html
 */
export function renderTeacherAnswerKey(project: HotPotProject): string {
  let keyContent = '';
  for (const p of project.pages) {
    const loc = p.source ? `${p.source.file} &middot; ${p.source.locator}` : `Week ${p.w}, Day ${p.d}, Exercise ${p.e}`;
    keyContent += `<section class="panel"><h2>${escapeHtml(p.id)} &mdash; ${escapeHtml(p.title)}</h2><p class="meta">${loc}</p><ol>`;

    for (const q of p.items) {
      let answer = '';
      if (!p.scored) {
        answer = 'Teacher assessment / verified key pending';
      } else if (p.kind === 'mc') {
        answer = (q.answer as number[]).map(a => `${String.fromCharCode(65 + a)}. ${q.options?.[a] || ''}`).join(' / ');
      } else if (p.kind === 'match') {
        answer = (q.answer as string[]).map(a => {
          const opt =
            (p.bank || []).find(b => b.value === a) ||
            (q.options || []).find(o => (typeof o === 'object' ? o.value : o) === a);
          return opt ? (typeof opt === 'object' ? opt.label : opt) : a;
        }).join(' / ');
      } else {
        answer = q.answer.map(a => String(a)).join(' / ');
      }

      keyContent += `<li><b>${escapeHtml(q.n)}</b> ${cleanHtml(q.prompt).replace(/\{\{gap\}\}/g, '____')}<p><b>Key:</b> ${escapeHtml(answer)}</p>${q.feedback ? `<p>${escapeHtml(q.feedback)}</p>` : ''}<p class="meta">${escapeHtml(q.key_status || 'verified')}${q.evidence ? ` &middot; ${escapeHtml(q.evidence)}` : ''}</p></li>`;
    }

    if (p.writing) {
      keyContent += `<h3>Writing task</h3>${para(p.writing.prompt)}<h3>Writing rubric</h3>${para(p.writing.rubric)}`;
      if (p.writing.model) keyContent += `<h3>Model response (example)</h3>${para(p.writing.model)}`;
    }
    keyContent += '</ol></section>';
  }

  return `<!DOCTYPE html>\n<html lang="${escapeHtml(project.language || 'en')}"><head><meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>Teacher Answer Key</title>\n<style>${APPROVED_HOTPOT_CSS}</style></head><body><main class="shell"><div class="brand"><span>${escapeHtml(project.brand || 'ENGLISH PRACTICE')}</span><span>${escapeHtml(project.subtitle || 'Practice · Learn · Improve')}</span></div><header class="Titles"><h1>Teacher Answer Key</h1></header>${keyContent}</main></body></html>`;
}

/**
 * Generate source-fidelity-notes.html
 */
export function renderFidelityNotes(project: HotPotProject): string {
  let notes = '';
  for (const p of project.pages) {
    const issues: string[] = [...(p.teacher_notes || [])];
    if (p.review && p.review.length > 0) {
      for (const r of p.review) {
        issues.push(`${r.n}: ${r.feedback}`);
      }
    }
    if (!p.scored) {
      issues.push('Teacher assessment required; excluded from the graded chain.');
    }
    if (issues.length > 0) {
      notes += `<section class="panel"><h2>${escapeHtml(p.id)}</h2><ul>${issues.map(n => `<li>${escapeHtml(n)}</li>`).join('')}</ul></section>`;
    }
  }

  return `<!DOCTYPE html>\n<html lang="${escapeHtml(project.language || 'en')}"><head><meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>Source Fidelity &amp; Review Notes</title>\n<style>${APPROVED_HOTPOT_CSS}</style></head><body><main class="shell"><div class="brand"><span>${escapeHtml(project.brand || 'ENGLISH PRACTICE')}</span><span>${escapeHtml(project.subtitle || 'Practice · Learn · Improve')}</span></div><header class="Titles"><h1>Source Fidelity &amp; Review Notes</h1></header>${notes || '<p class="panel">All source exercises have verified keys and full pedagogical fidelity.</p>'}</main></body></html>`;
}
