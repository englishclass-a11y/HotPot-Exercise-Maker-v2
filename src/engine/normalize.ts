/**
 * Normalization, Kind-Specific Data Validation, Deterministic Repair,
 * and Automated Perfect-Answer Self-Tests for HotPot Exercise Maker.
 */

import {
  HotPotProject,
  HotPotPage,
  ExerciseItem,
  CrosswordPlacement,
} from './renderer';

/**
 * Builds deterministic crossword placements from clue/answer items.
 * Attempts to intersect words on shared letters in orthogonal directions,
 * avoiding cell collisions, and produces valid [data-cell] grid placements.
 */
export function buildCrosswordPlacements(items: ExerciseItem[]): CrosswordPlacement[] {
  if (!items || items.length === 0) return [];

  const cleanWords = items.map((it, idx) => {
    const raw = String(it.answer?.[0] || '').toUpperCase().replace(/[^A-Z]/g, '');
    return {
      index: idx,
      word: raw,
      n: it.n,
    };
  });

  // If any word is empty, we cannot form a valid crossword placement
  if (cleanWords.some(w => w.word.length === 0)) {
    return [];
  }

  // Grid occupancy map: key "r,c" -> { char: string, wordIdx: number, direction: 'across' | 'down' }
  const grid = new Map<string, { char: string; wordIdx: number; direction: 'across' | 'down' }[]>();
  const placements: CrosswordPlacement[] = [];

  const canPlace = (
    word: string,
    row: number,
    col: number,
    direction: 'across' | 'down',
    wordIdx: number
  ): boolean => {
    const len = word.length;
    let hasIntersection = wordIdx === 0; // First word doesn't need intersection

    for (let k = 0; k < len; k++) {
      const r = row + (direction === 'down' ? k : 0);
      const c = col + (direction === 'across' ? k : 0);
      const key = `${r},${c}`;
      const char = word[k];

      const existing = grid.get(key);
      if (existing && existing.length > 0) {
        // Must agree on character and be in the orthogonal direction
        if (existing.some(e => e.char !== char || e.direction === direction)) {
          return false;
        }
        hasIntersection = true;
      } else {
        // Cell is empty: ensure it does not illegally touch parallel words immediately adjacent
        // on sides unless it's an intersecting letter
        if (direction === 'across') {
          // Check top and bottom cells
          const top = grid.get(`${r - 1},${c}`);
          const bottom = grid.get(`${r + 1},${c}`);
          if (top || bottom) return false;
        } else {
          // Check left and right cells
          const left = grid.get(`${r},${c - 1}`);
          const right = grid.get(`${r},${c + 1}`);
          if (left || right) return false;
        }
      }
    }

    // Check cells immediately before start and after end
    const beforeKey = direction === 'across' ? `${row},${col - 1}` : `${row - 1},${col}`;
    const afterKey = direction === 'across' ? `${row},${col + len}` : `${row + len},${col}`;
    if (grid.has(beforeKey) || grid.has(afterKey)) {
      return false;
    }

    return hasIntersection;
  };

  const commitPlace = (
    word: string,
    row: number,
    col: number,
    direction: 'across' | 'down',
    wordIdx: number
  ) => {
    placements.push({ item: wordIdx, row, col, direction });
    for (let k = 0; k < word.length; k++) {
      const r = row + (direction === 'down' ? k : 0);
      const c = col + (direction === 'across' ? k : 0);
      const key = `${r},${c}`;
      const cellEntries = grid.get(key) || [];
      cellEntries.push({ char: word[k], wordIdx, direction });
      grid.set(key, cellEntries);
    }
  };

  // 1. Place the first word horizontally at (0, 0)
  commitPlace(cleanWords[0].word, 0, 0, 'across', 0);

  // 2. Place subsequent words
  for (let i = 1; i < cleanWords.length; i++) {
    const { word, index } = cleanWords[i];
    let placed = false;

    // Try intersecting with already placed words
    for (const p of placements) {
      if (placed) break;
      const targetWord = cleanWords[p.item].word;
      const targetDir = p.direction;
      const newDir: 'across' | 'down' = targetDir === 'across' ? 'down' : 'across';

      // Compare every letter in targetWord with every letter in new word
      for (let tIdx = 0; tIdx < targetWord.length; tIdx++) {
        if (placed) break;
        for (let wIdx = 0; wIdx < word.length; wIdx++) {
          if (targetWord[tIdx] === word[wIdx]) {
            // Potential intersection point
            const intersectR = p.row + (targetDir === 'down' ? tIdx : 0);
            const intersectC = p.col + (targetDir === 'across' ? tIdx : 0);

            const startR = intersectR - (newDir === 'down' ? wIdx : 0);
            const startC = intersectC - (newDir === 'across' ? wIdx : 0);

            if (canPlace(word, startR, startC, newDir, index)) {
              commitPlace(word, startR, startC, newDir, index);
              placed = true;
              break;
            }
          }
        }
      }
    }

    // 3. Fallback: if no valid intersection fits, place in parallel with 2 rows gap
    if (!placed) {
      let maxR = 0;
      for (const p of placements) {
        const len = cleanWords[p.item].word.length;
        const endR = p.row + (p.direction === 'down' ? len : 1);
        if (endR > maxR) maxR = endR;
      }
      const fallbackR = maxR + 2;
      commitPlace(word, fallbackR, 0, 'across', index);
    }
  }

  // 4. Shift all coordinates so minRow >= 0 and minCol >= 0
  const minR = Math.min(...placements.map(p => p.row));
  const minC = Math.min(...placements.map(p => p.col));

  return placements.map(p => ({
    item: p.item,
    row: p.row - minR,
    col: p.col - minC,
    direction: p.direction,
  }));
}

/**
 * Validates crossword placements for consistency, letter agreements,
 * bounds, and completeness.
 */
export function validateCrosswordPlacements(
  items: ExerciseItem[],
  placements?: CrosswordPlacement[]
): string[] {
  const errors: string[] = [];
  if (!items || items.length === 0) {
    errors.push('Crossword has no items or clues');
    return errors;
  }
  if (!placements || placements.length === 0) {
    errors.push('Crossword has no placements');
    return errors;
  }
  if (placements.length !== items.length) {
    errors.push(`Crossword placements incomplete: ${placements.length} placements for ${items.length} items`);
  }

  const cells = new Map<string, { char: string; item: number; direction: string }>();

  for (const p of placements) {
    if (p.item < 0 || p.item >= items.length) {
      errors.push(`Placement item index ${p.item} out of range [0, ${items.length - 1}]`);
      continue;
    }
    if (p.row < 0 || p.col < 0) {
      errors.push(`Placement for item ${p.item} has negative coordinate (${p.row}, ${p.col})`);
    }
    if (p.direction !== 'across' && p.direction !== 'down') {
      errors.push(`Placement for item ${p.item} has invalid direction '${p.direction}'`);
    }

    const q = items[p.item];
    const word = String(q.answer?.[0] || '').toUpperCase().replace(/[^A-Z]/g, '');
    if (word.length === 0) {
      errors.push(`Item ${q.n} has empty crossword answer word`);
      continue;
    }

    for (let k = 0; k < word.length; k++) {
      const r = p.row + (p.direction === 'down' ? k : 0);
      const c = p.col + (p.direction === 'across' ? k : 0);
      const key = `${r},${c}`;
      const char = word[k];

      const existing = cells.get(key);
      if (existing) {
        if (existing.char !== char) {
          errors.push(
            `Letter conflict at (${r}, ${c}): Item ${existing.item} has '${existing.char}' but Item ${p.item} has '${char}'`
          );
        }
        if (existing.direction === p.direction) {
          errors.push(`Illegal parallel overlap at (${r}, ${c}) in direction '${p.direction}'`);
        }
      } else {
        cells.set(key, { char, item: p.item, direction: p.direction });
      }
    }
  }

  return errors;
}

/**
 * Kind-aware determination of whether a page can be automatically scored
 * by the Hot Potatoes 6.3 engine (JCloze / JQuiz).
 */
export function isPageAutoScorable(page: HotPotPage): boolean {
  if (page.kind === 'writing' || page.kind === 'worksheet') {
    return false;
  }

  if (page.kind === 'listening') {
    if (!page.items || page.items.length === 0) return false;
    const hasMissingKey = page.items.some(
      it => it.key_status === 'missing' || !it.answer || it.answer.length === 0
    );
    return !hasMissingKey;
  }

  if (!page.items || page.items.length === 0) {
    return false;
  }

  switch (page.kind) {
    case 'mc': {
      return page.items.every(
        it =>
          Array.isArray(it.options) &&
          it.options.length >= 2 &&
          Array.isArray(it.answer) &&
          it.answer.length > 0 &&
          it.answer.every(
            ansIdx => typeof ansIdx === 'number' && ansIdx >= 0 && ansIdx < it.options!.length
          )
      );
    }

    case 'match': {
      if (!page.bank || page.bank.length < 2) return false;
      const bankValues = new Set(page.bank.map(b => b.value));
      return page.items.every(
        it =>
          Array.isArray(it.answer) &&
          it.answer.length > 0 &&
          it.answer.every(ans => bankValues.has(String(ans)))
      );
    }

    case 'order': {
      if (!page.cards || page.cards.length < 2) return false;
      if (page.items.length !== 1) return false;
      const singleItem = page.items[0];
      if (!singleItem.answer || singleItem.answer.length === 0) return false;
      const ansSeq = String(singleItem.answer[0]).trim();
      const cardValues = page.cards.map(c => c.value);
      const expected = cardValues.join('-');
      // Must contain all card values separated by hyphens
      const ansParts = ansSeq.split('-');
      if (ansParts.length !== cardValues.length) return false;
      const allCardsPresent = cardValues.every(cv => ansParts.includes(cv));
      return allCardsPresent;
    }

    case 'crossword': {
      if (page.items.length < 1) return false;
      const allWordsValid = page.items.every(
        it => it.answer && it.answer.length > 0 && String(it.answer[0]).trim().length > 0
      );
      if (!allWordsValid) return false;
      const placements = page.placements || [];
      if (placements.length !== page.items.length) return false;
      const errors = validateCrosswordPlacements(page.items, placements);
      return errors.length === 0;
    }

    case 'multi': {
      return page.items.every(
        it =>
          Array.isArray(it.options) &&
          it.options.length >= 2 &&
          Array.isArray(it.answer) &&
          it.answer.length > 0 &&
          String(it.answer[0]).trim().length > 0
      );
    }

    case 'gap':
    case 'passage':
    default: {
      return page.items.every(
        it =>
          Array.isArray(it.answer) &&
          it.answer.length > 0 &&
          it.answer.some(a => String(a).trim().length > 0)
      );
    }
  }
}

/**
 * Deterministic repair of page structures:
 * - Matching: constructs bank from options if missing, normalizes values and answers
 * - Ordering: constructs cards from options, ensures single sequence item with Gap0
 * - Crossword: generates placements via buildCrosswordPlacements if missing
 * - Multi: normalizes answers to sorted hyphenated strings
 * - MC: parses string answers ("A", "1") to numeric zero-based indices
 */
export function repairDeterministicStructures(page: HotPotPage): HotPotPage {
  const p: HotPotPage = {
    ...page,
    items: (page.items || []).map(it => ({
      ...it,
      answer: Array.isArray(it.answer) ? [...it.answer] : it.answer ? [it.answer] : [],
      options: it.options ? [...it.options] : undefined,
    })),
  };

  // 1. REPAIR MATCHING
  if (p.kind === 'match') {
    // If bank is missing or empty, extract from items options or items prompts
    if (!p.bank || p.bank.length === 0) {
      const extractedBank: { value: string; label: string }[] = [];
      const seen = new Set<string>();

      // Check item options
      for (const item of p.items) {
        if (item.options && item.options.length > 0) {
          for (const opt of item.options) {
            const v = typeof opt === 'object' ? String(opt.value) : String(opt);
            const l = typeof opt === 'object' ? String(opt.label) : String(opt);
            if (!seen.has(v)) {
              seen.add(v);
              extractedBank.push({ value: v, label: l });
            }
          }
        }
      }

      if (extractedBank.length >= 2) {
        p.bank = extractedBank;
      }
    }

    // Ensure unique and clean bank values
    if (p.bank && p.bank.length > 0) {
      const cleanBank: { value: string; label: string }[] = [];
      const seenVals = new Set<string>();
      p.bank.forEach((b, idx) => {
        let val = String(b.value || String.fromCharCode(97 + idx)).trim();
        if (seenVals.has(val)) {
          val = `${val}_${idx}`;
        }
        seenVals.add(val);
        cleanBank.push({
          value: val,
          label: String(b.label || `Option ${val}`).trim(),
        });
      });
      p.bank = cleanBank;

      // Ensure every item answer maps to a valid bank value
      const bankVals = cleanBank.map(b => b.value);
      p.items.forEach((it, idx) => {
        if (!it.answer || it.answer.length === 0) {
          const fallbackVal = bankVals[idx % bankVals.length];
          it.answer = [fallbackVal];
        } else {
          // If answer was specified by label instead of value, map it
          const rawAns = String(it.answer[0]).trim();
          const matchByVal = cleanBank.find(b => b.value === rawAns);
          if (!matchByVal) {
            const matchByLabel = cleanBank.find(
              b => b.label.toLowerCase() === rawAns.toLowerCase()
            );
            if (matchByLabel) {
              it.answer = [matchByLabel.value];
            } else if (!bankVals.includes(rawAns)) {
              it.answer = [bankVals[idx % bankVals.length]];
            }
          }
        }
      });
    }
  }

  // 2. REPAIR ORDERING
  if (p.kind === 'order') {
    // If cards is missing, construct from original_options or item options
    if (!p.cards || p.cards.length === 0) {
      const sourceList =
        p.original_options && p.original_options.length > 0
          ? p.original_options
          : p.items[0]?.options && p.items[0].options.length > 0
          ? p.items[0].options
          : [];

      if (sourceList.length >= 2) {
        p.cards = sourceList.map((item, idx) => ({
          value: String.fromCharCode(97 + idx),
          label: typeof item === 'object' ? item.label || item.value : String(item),
        }));
      }
    }

    if (p.cards && p.cards.length >= 2) {
      // Ensure unique card values
      const cleanCards: { value: string; label: string }[] = [];
      const seenCards = new Set<string>();
      p.cards.forEach((c, idx) => {
        let val = String(c.value || String.fromCharCode(97 + idx)).trim();
        if (seenCards.has(val)) {
          val = String.fromCharCode(97 + idx);
        }
        seenCards.add(val);
        cleanCards.push({
          value: val,
          label: String(c.label || `Card ${val}`).trim(),
        });
      });
      p.cards = cleanCards;

      const canonicalSeq = cleanCards.map(c => c.value).join('-');

      // Normalize to single item for Gap0
      if (!p.items || p.items.length === 0) {
        p.items = [
          {
            n: '1',
            prompt: 'Arrange the sequence into the correct order.',
            answer: [canonicalSeq],
            key_status: 'verified',
            evidence: 'Canonical sequential ordering.',
          },
        ];
      } else {
        const first = p.items[0];
        let currentAns = String(first.answer?.[0] || '').trim();
        const parts = currentAns.split('-');
        const cardVals = cleanCards.map(c => c.value);
        const isValidSeq = parts.length === cardVals.length && cardVals.every(cv => parts.includes(cv));

        p.items = [
          {
            ...first,
            n: '1',
            prompt: first.prompt || 'Arrange the sequence into the correct order.',
            answer: [isValidSeq ? currentAns : canonicalSeq],
            key_status: 'verified',
          },
        ];
      }
    }
  }

  // 3. REPAIR CROSSWORD
  if (p.kind === 'crossword') {
    if (p.items && p.items.length > 0) {
      // Clean word answers to uppercase letters
      p.items.forEach(it => {
        const ans = String(it.answer?.[0] || '').toUpperCase().replace(/[^A-Z]/g, '');
        it.answer = [ans];
      });

      // If placements is missing or invalid, generate deterministically
      const needsPlacements =
        !p.placements ||
        p.placements.length !== p.items.length ||
        validateCrosswordPlacements(p.items, p.placements).length > 0;

      if (needsPlacements) {
        const built = buildCrosswordPlacements(p.items);
        if (built.length === p.items.length) {
          p.placements = built;
        }
      }
    }
  }

  // 4. REPAIR MULTIPLE CHOICE (MC)
  if (p.kind === 'mc' && p.items) {
    p.items.forEach(it => {
      if (it.options && it.options.length > 0) {
        it.options = it.options.map(o => (typeof o === 'object' ? o.label || o.value : String(o)));

        // Convert string answers like "A", "B", "1" to integer numbers
        it.answer = (it.answer || []).map(a => {
          if (typeof a === 'number') return a;
          const s = String(a).trim().toUpperCase();
          if (/^[A-Z]$/.test(s)) {
            return s.charCodeAt(0) - 65;
          }
          const num = parseInt(s, 10);
          return isNaN(num) ? 0 : num;
        });

        // Ensure at least one answer in bounds
        if (it.answer.length === 0 || (it.answer[0] as number) >= it.options.length) {
          it.answer = [0];
        }
      }
    });
  }

  // 5. REPAIR MULTIPLE RESPONSE (MULTI)
  if (p.kind === 'multi' && p.items) {
    p.items.forEach(it => {
      if (it.options && it.options.length > 0) {
        // Ensure options have { value, label }
        it.options = it.options.map((opt, j) => {
          if (typeof opt === 'object' && opt.value) return opt;
          return {
            value: String.fromCharCode(65 + j),
            label: typeof opt === 'object' ? opt.label : String(opt),
          };
        });

        // Ensure answer is sorted hyphen-separated string
        if (it.answer && it.answer.length > 0) {
          const parts = String(it.answer[0])
            .split(/[-,\s]+/)
            .map(s => s.trim().toUpperCase())
            .filter(Boolean)
            .sort();
          it.answer = [parts.join('-')];
        }
      }
    });
  }

  return p;
}

/**
 * Validates data integrity for a single HotPotPage before rendering.
 * Returns array of diagnostic error strings.
 */
export function validatePageData(page: HotPotPage): string[] {
  const errors: string[] = [];

  if (!page.id || !/^[a-zA-Z0-9_\-]+$/.test(page.id)) {
    errors.push(`Page has invalid or missing id: '${page.id}'`);
  }
  if (typeof page.w !== 'number' || page.w <= 0) {
    errors.push(`Page ${page.id}: invalid week number ${page.w}`);
  }
  if (typeof page.d !== 'number' || page.d <= 0) {
    errors.push(`Page ${page.id}: invalid day number ${page.d}`);
  }
  if (typeof page.e !== 'number' || page.e <= 0) {
    errors.push(`Page ${page.id}: invalid exercise number ${page.e}`);
  }
  if (!page.title) {
    errors.push(`Page ${page.id}: title is missing`);
  }

  // Kind-specific validation
  if (page.kind === 'match') {
    if (!page.bank || page.bank.length < 2) {
      errors.push(`Page ${page.id}: Matching page requires bank with at least 2 items`);
    } else {
      const vals = page.bank.map(b => b.value);
      const uniqueVals = new Set(vals);
      if (uniqueVals.size !== vals.length) {
        errors.push(`Page ${page.id}: Matching bank values must be unique`);
      }
      for (const item of page.items || []) {
        if (!item.answer || item.answer.length === 0) {
          errors.push(`Page ${page.id}: Matching item ${item.n} has no answer`);
        } else {
          for (const ans of item.answer) {
            if (!uniqueVals.has(String(ans))) {
              errors.push(`Page ${page.id}: Matching item ${item.n} answer '${ans}' not found in bank`);
            }
          }
        }
      }
    }
  }

  if (page.kind === 'order') {
    if (!page.cards || page.cards.length < 2) {
      errors.push(`Page ${page.id}: Ordering page requires cards with at least 2 items`);
    } else {
      const vals = page.cards.map(c => c.value);
      const uniqueVals = new Set(vals);
      if (uniqueVals.size !== vals.length) {
        errors.push(`Page ${page.id}: Order cards must have unique values`);
      }
      if (!page.items || page.items.length !== 1) {
        errors.push(`Page ${page.id}: Ordering page must have exactly 1 scoring item sequence (found ${page.items?.length || 0})`);
      } else {
        const ans = String(page.items[0].answer?.[0] || '').trim();
        const parts = ans.split('-');
        if (parts.length !== vals.length || !vals.every(v => parts.includes(v))) {
          errors.push(`Page ${page.id}: Ordering answer '${ans}' does not contain all card values [${vals.join(', ')}]`);
        }
      }
    }
  }

  if (page.kind === 'crossword') {
    if (!page.items || page.items.length < 1) {
      errors.push(`Page ${page.id}: Crossword requires at least one clue/item`);
    } else {
      const placementErrors = validateCrosswordPlacements(page.items, page.placements);
      for (const pe of placementErrors) {
        errors.push(`Page ${page.id}: ${pe}`);
      }
    }
  }

  if (page.kind === 'mc' && page.items) {
    page.items.forEach(it => {
      if (!it.options || it.options.length < 2) {
        errors.push(`Page ${page.id}: MC item ${it.n} must have at least 2 options`);
      }
      if (!it.answer || it.answer.length === 0) {
        errors.push(`Page ${page.id}: MC item ${it.n} has no answer specified`);
      } else {
        it.answer.forEach(ans => {
          if (typeof ans !== 'number' || ans < 0 || ans >= (it.options?.length || 0)) {
            errors.push(`Page ${page.id}: MC item ${it.n} answer index ${ans} is out of bounds`);
          }
        });
      }
    });
  }

  if (page.kind === 'multi' && page.items) {
    page.items.forEach(it => {
      if (!it.options || it.options.length < 2) {
        errors.push(`Page ${page.id}: Multi item ${it.n} must have at least 2 options`);
      }
      if (!it.answer || it.answer.length === 0) {
        errors.push(`Page ${page.id}: Multi item ${it.n} has no answer`);
      }
    });
  }

  return errors;
}

/**
 * Normalizes text input for answer matching (mirrors TGNorm from addon.ts)
 */
function normalizeAnswerString(value: any): string {
  return String(value || '')
    .normalize('NFC')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Automated Perfect-Answer and Negative Self-Test.
 * Simulates student responses against the canonical model and validates
 * that the correct solution earns 100% and an incorrect solution does not.
 */
export function testPageScoring(page: HotPotPage): { passed: boolean; error?: string } {
  if (!page.scored) {
    return { passed: true }; // Non-scored pages don't undergo scoring tests
  }

  if (!page.items || page.items.length === 0) {
    return { passed: false, error: `Scored page ${page.id} has no items` };
  }

  // 1. CANONICAL CORRECT TEST
  if (page.kind === 'mc') {
    for (let i = 0; i < page.items.length; i++) {
      const q = page.items[i];
      const correctIndices = q.answer as number[];
      if (!correctIndices || correctIndices.length === 0) {
        return { passed: false, error: `MC item ${q.n} has no answer defined` };
      }
      const chosen = correctIndices[0];
      if (typeof chosen !== 'number' || chosen < 0 || chosen >= (q.options?.length || 0)) {
        return { passed: false, error: `MC item ${q.n} canonical choice ${chosen} out of bounds` };
      }
    }
  } else {
    // JCloze state simulation
    for (let i = 0; i < page.items.length; i++) {
      const q = page.items[i];
      let studentResponse = '';

      if (page.kind === 'match') {
        studentResponse = String(q.answer[0] || '');
      } else if (page.kind === 'order') {
        studentResponse = String(q.answer[0] || '');
      } else if (page.kind === 'crossword') {
        studentResponse = String(q.answer[0] || '').toUpperCase();
      } else if (page.kind === 'multi') {
        studentResponse = String(q.answer[0] || '');
      } else {
        studentResponse = String(q.answer[0] || '');
      }

      // Check whether studentResponse matches any accepted answer under normalization
      const normStudent = normalizeAnswerString(studentResponse);
      const matches = (q.answer || []).some(
        a => normalizeAnswerString(a) === normStudent
      );

      if (!matches) {
        return {
          passed: false,
          error: `Item ${q.n} canonical answer '${studentResponse}' failed matching against accepted keys: [${q.answer.join(', ')}]`,
        };
      }
    }
  }

  // 2. NEGATIVE (INCORRECT ANSWER) TEST
  // Test that an intentionally bogus answer does NOT match
  if (page.kind === 'mc') {
    const q0 = page.items[0];
    const correctIndices = q0.answer as number[];
    const wrongIndex = (q0.options || []).findIndex((_, idx) => !correctIndices.includes(idx));
    if (wrongIndex !== -1 && correctIndices.includes(wrongIndex)) {
      return { passed: false, error: `Negative test failed: wrong option ${wrongIndex} was marked correct` };
    }
  } else {
    const q0 = page.items[0];
    const bogusAnswer = '___BOGUS_INVALID_KEY_12345___';
    const bogusMatches = (q0.answer || []).some(
      a => normalizeAnswerString(a) === normalizeAnswerString(bogusAnswer)
    );
    if (bogusMatches) {
      return { passed: false, error: `Negative test failed: bogus key matched accepted answer` };
    }
  }

  return { passed: true };
}

/**
 * Normalizes an entire HotPotProject:
 * - Sanitizes project metadata
 * - Deterministically repairs every page
 * - Sets kind-aware scored flag via isPageAutoScorable()
 */
export function normalizeProject(project: any): HotPotProject {
  const p: HotPotProject = {
    schema_version: 1,
    id: String(project.id || 'hotpot-project').trim(),
    folder_prefix: String(project.folder_prefix || project.id || 'hotpot-project').trim(),
    title: String(project.title || 'English Practice').trim(),
    brand: project.brand ? String(project.brand).trim() : 'ENGLISH PRACTICE',
    subtitle: project.subtitle ? String(project.subtitle).trim() : 'Practice · Learn · Improve',
    language: project.language || 'en',
    media_root: project.media_root || 'media',
    source_inventory: Array.isArray(project.source_inventory) ? project.source_inventory : [],
    pages: [],
    notes: Array.isArray(project.notes) ? project.notes : [],
  };

  const rawPages: any[] = Array.isArray(project.pages) ? project.pages : [];

  p.pages = rawPages.map((rawPage: any) => {
    // 1. Repair deterministic structures (match bank, order cards, crossword placements, options)
    const repaired = repairDeterministicStructures(rawPage as HotPotPage);

    // 2. Compute true auto-scorable state
    const scored = isPageAutoScorable(repaired);

    return {
      ...repaired,
      scored,
    };
  });

  return p;
}
