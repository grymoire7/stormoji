const test = require('node:test');
const assert = require('node:assert/strict');

const {
    hashCode,
    seededRandom,
    shuffleArray,
    getDefaultEmojis,
    selectDailyEmojis,
    formatDateKey,
    findStoryForDate,
    getDraftForToday,
    upsertStory,
    pruneStoriesOlderThan,
    escapeCSV,
    parseCSV,
    parseHistoryCSV,
    mergeImportedStories,
    describeImportSuccess,
    resolveThemeAttribute,
    APP_VERSION
} = require('./app.js');
const { version: packageVersion } = require('./package.json');

test('hashCode is deterministic for the same string', () => {
    assert.equal(hashCode('2026-7-11'), hashCode('2026-7-11'));
});

test('formatDateKey pads single-digit month and day', () => {
    assert.equal(formatDateKey(new Date(2026, 0, 5)), '2026-01-05');
    assert.equal(formatDateKey(new Date(2026, 11, 25)), '2026-12-25');
});

test('formatDateKey uses local fields, not UTC', () => {
    // The Date constructor's plain (non-UTC) form interprets its arguments
    // as local time, and getFullYear/getMonth/getDate read them back as
    // local fields too - so this holds regardless of the host's timezone.
    // formatDateKey must key off those local fields, not the UTC-shifted
    // equivalents, so the puzzle flips at the visitor's own midnight.
    const justAfterLocalMidnight = new Date(2026, 0, 5, 0, 30);
    assert.equal(formatDateKey(justAfterLocalMidnight), '2026-01-05');
});

test('findStoryForDate returns the story matching the date key', () => {
    const stories = [
        { dateKey: '2026-07-10', story: 'yesterday' },
        { dateKey: '2026-07-11', story: 'today' }
    ];
    assert.equal(findStoryForDate(stories, '2026-07-11').story, 'today');
});

test('findStoryForDate returns undefined when today has no saved story', () => {
    // Regression guard: a story saved for a previous day must never be
    // treated as today's story once the date rolls over.
    const stories = [{ dateKey: '2026-07-10', story: 'yesterday' }];
    assert.equal(findStoryForDate(stories, '2026-07-11'), undefined);
});

test('getDraftForToday returns the draft story when its dateKey matches today', () => {
    const draft = { dateKey: '2026-07-11', story: 'in-progress writing' };
    assert.equal(getDraftForToday(draft, '2026-07-11'), 'in-progress writing');
});

test('getDraftForToday returns the empty string when the draft is explicitly empty', () => {
    // An explicitly-saved empty draft (user deleted everything they typed)
    // must be distinguishable from "no draft at all" - both are falsy-ish,
    // but only null means "ignore me."
    const draft = { dateKey: '2026-07-11', story: '' };
    assert.equal(getDraftForToday(draft, '2026-07-11'), '');
});

test('getDraftForToday returns null when the draft is for a different day', () => {
    const draft = { dateKey: '2026-07-10', story: 'yesterday leftovers' };
    assert.equal(getDraftForToday(draft, '2026-07-11'), null);
});

test('getDraftForToday returns null when there is no draft', () => {
    assert.equal(getDraftForToday(null, '2026-07-11'), null);
});

test('seededRandom is deterministic for the same seed', () => {
    assert.equal(seededRandom('2026-7-11'), seededRandom('2026-7-11'));
});

test('seededRandom returns a value in [0, 1)', () => {
    const value = seededRandom('any-seed');
    assert.ok(value >= 0 && value < 1);
});

test('shuffleArray is deterministic for the same seed', () => {
    const input = ['a', 'b', 'c', 'd', 'e'];
    assert.deepEqual(shuffleArray(input, 'seed'), shuffleArray(input, 'seed'));
});

test('shuffleArray returns a permutation without mutating the input', () => {
    const input = ['a', 'b', 'c', 'd'];
    const result = shuffleArray(input, 'seed');
    assert.deepEqual(input, ['a', 'b', 'c', 'd']);
    assert.deepEqual([...result].sort(), [...input].sort());
});

test('selectDailyEmojis is deterministic for the same categories and seed', () => {
    const categories = {
        smileys: [{ emoji: '😀', name: 'Grin' }],
        animals: [{ emoji: '🐻', name: 'Bear' }],
        food: [{ emoji: '🍔', name: 'Burger' }],
        activity: [{ emoji: '⚽', name: 'Ball' }],
        objects: [{ emoji: '📱', name: 'Phone' }]
    };
    const first = selectDailyEmojis(categories, '2026-7-11');
    const second = selectDailyEmojis(categories, '2026-7-11');
    assert.deepEqual(first, second);
    assert.equal(first.length, 4);
});

test('selectDailyEmojis falls back to defaults with fewer than 4 categories', () => {
    const categories = { smileys: [{ emoji: '😀', name: 'Grin' }] };
    assert.deepEqual(selectDailyEmojis(categories, 'seed'), getDefaultEmojis());
});

test('upsertStory replaces the existing entry for the same date', () => {
    const stories = [{ dateKey: '2026-07-11', date: 'July 11, 2026', story: 'first draft' }];
    const updated = upsertStory(stories, { dateKey: '2026-07-11', date: 'July 11, 2026', story: 'final draft' });
    assert.equal(updated.length, 1);
    assert.equal(updated[0].story, 'final draft');
});

test('upsertStory appends a new entry for a different date', () => {
    const stories = [{ dateKey: '2026-07-10', date: 'July 10, 2026', story: 'yesterday' }];
    const updated = upsertStory(stories, { dateKey: '2026-07-11', date: 'July 11, 2026', story: 'today' });
    assert.equal(updated.length, 2);
});

test('upsertStory sorts stories newest first', () => {
    const stories = [{ dateKey: '2026-07-01', date: 'July 1, 2026', story: 'old' }];
    const updated = upsertStory(stories, { dateKey: '2026-07-11', date: 'July 11, 2026', story: 'new' });
    assert.equal(updated[0].story, 'new');
});

test('pruneStoriesOlderThan keeps stories within the retention window', () => {
    const reference = new Date(2026, 6, 11); // July 11, 2026
    const stories = [
        { date: 'July 11, 2026' },
        { date: 'February 1, 2026' } // ~5 months back, kept
    ];
    assert.equal(pruneStoriesOlderThan(stories, reference, 6).length, 2);
});

test('pruneStoriesOlderThan removes stories past the retention window', () => {
    const reference = new Date(2026, 6, 11); // July 11, 2026
    const stories = [
        { date: 'July 11, 2026' },
        { date: 'December 1, 2025' } // more than 6 months back
    ];
    const kept = pruneStoriesOlderThan(stories, reference, 6);
    assert.equal(kept.length, 1);
    assert.equal(kept[0].date, 'July 11, 2026');
});

test('escapeCSV quotes fields containing commas, quotes, or newlines', () => {
    assert.equal(escapeCSV('plain'), '"plain"');
    assert.equal(escapeCSV('a,b'), '"a,b"');
    assert.equal(escapeCSV('say "hi"'), '"say ""hi"""');
    assert.equal(escapeCSV('line1\nline2'), '"line1\nline2"');
});

test('escapeCSV handles null and undefined', () => {
    assert.equal(escapeCSV(null), '""');
    assert.equal(escapeCSV(undefined), '""');
});

test('parseCSV parses quoted fields into rows of strings', () => {
    assert.deepEqual(parseCSV('"a","b"\n"c","d"\n'), [['a', 'b'], ['c', 'd']]);
});

test('parseCSV round-trips escapeCSV output for commas, quotes, and newlines', () => {
    const fields = ['plain', 'a,b', 'say "hi"', 'line1\nline2', ''];
    const csv = fields.map(escapeCSV).join(',') + '\n';
    assert.deepEqual(parseCSV(csv), [fields]);
});

test('parseCSV handles CRLF line endings and a missing trailing newline', () => {
    assert.deepEqual(parseCSV('"a","b"\r\n"c","d"'), [['a', 'b'], ['c', 'd']]);
});

test('parseCSV strips a leading UTF-8 BOM', () => {
    assert.deepEqual(parseCSV('\uFEFF"a","b"\n'), [['a', 'b']]);
});

test('parseCSV preserves emoji, including multi-codepoint sequences', () => {
    assert.deepEqual(parseCSV('"🏹 🚘 🎧 👩\u200d🔧"\n'), [['🏹 🚘 🎧 👩\u200d🔧']]);
});

const HISTORY_HEADER = '"Date Key","Date","Emojis","Story"\n';
const validRow = (dateKey = '2026-07-11', story = 'Once upon a time') =>
    `"${dateKey}","July 11, 2026","😀 🐻 🍔 ⚽","${story}"\n`;

test('parseHistoryCSV returns stories from a valid export', () => {
    const result = parseHistoryCSV(HISTORY_HEADER + validRow('2026-07-11') + validRow('2026-07-10', 'Another'));
    assert.equal(result.ok, true);
    assert.deepEqual(result.stories, [
        { dateKey: '2026-07-11', date: 'July 11, 2026', emojis: '😀 🐻 🍔 ⚽', story: 'Once upon a time' },
        { dateKey: '2026-07-10', date: 'July 11, 2026', emojis: '😀 🐻 🍔 ⚽', story: 'Another' }
    ]);
});

test('parseHistoryCSV round-trips what exportHistoryToCSV would write', () => {
    const original = { dateKey: '2026-07-11', date: 'July 11, 2026', emojis: '😀 🐻 🍔 ⚽', story: 'He said, "hi"\nthen left.' };
    const csv = HISTORY_HEADER + [original.dateKey, original.date, original.emojis, original.story].map(escapeCSV).join(',') + '\n';
    assert.deepEqual(parseHistoryCSV(csv).stories, [original]);
});

for (const column of ['Date Key', 'Date', 'Emojis', 'Story']) {
    test(`parseHistoryCSV fails and names the column when "${column}" is missing`, () => {
        const columns = ['Date Key', 'Date', 'Emojis', 'Story'].filter(c => c !== column);
        const csv = columns.map(escapeCSV).join(',') + '\n' + columns.map(() => '"x"').join(',') + '\n';
        const result = parseHistoryCSV(csv);
        assert.equal(result.ok, false);
        assert.match(result.error, new RegExp(`Missing required column.*${column}`));
    });
}

test('parseHistoryCSV lists every missing column', () => {
    const result = parseHistoryCSV('"Date Key","Date"\n"2026-07-11","July 11, 2026"\n');
    assert.equal(result.ok, false);
    assert.match(result.error, /Emojis/);
    assert.match(result.error, /Story/);
});

test('parseHistoryCSV finds columns by header name, in any order, ignoring extras', () => {
    const csv = '"Story","Extra","Emojis","Date","Date Key"\n"s","x","e","July 11, 2026","2026-07-11"\n';
    assert.deepEqual(parseHistoryCSV(csv).stories, [
        { dateKey: '2026-07-11', date: 'July 11, 2026', emojis: 'e', story: 's' }
    ]);
});

test('parseHistoryCSV fails on an empty file', () => {
    const result = parseHistoryCSV('');
    assert.equal(result.ok, false);
    assert.match(result.error, /empty/i);
});

test('parseHistoryCSV fails on a header with no stories', () => {
    const result = parseHistoryCSV(HISTORY_HEADER);
    assert.equal(result.ok, false);
    assert.match(result.error, /no stories/i);
});

test('parseHistoryCSV ignores blank lines', () => {
    const result = parseHistoryCSV(HISTORY_HEADER + validRow() + '\n\n');
    assert.equal(result.ok, true);
    assert.equal(result.stories.length, 1);
});

test('parseHistoryCSV rejects an invalid Date Key and names the row', () => {
    // Row 1 is the header, so the second data row is row 3
    const result = parseHistoryCSV(HISTORY_HEADER + validRow('2026-07-11') + validRow('2025-13-40'));
    assert.equal(result.ok, false);
    assert.match(result.error, /Row 3/);
    assert.match(result.error, /2025-13-40/);
    assert.match(result.error, /YYYY-MM-DD/);
});

test('parseHistoryCSV rejects a well-formatted but impossible date', () => {
    const result = parseHistoryCSV(HISTORY_HEADER + validRow('2026-02-30'));
    assert.equal(result.ok, false);
    assert.match(result.error, /Row 2/);
});

for (const [column, index] of [['Date', 1], ['Emojis', 2], ['Story', 3]]) {
    test(`parseHistoryCSV rejects an empty ${column} and names the row`, () => {
        const fields = ['2026-07-11', 'July 11, 2026', '😀 🐻 🍔 ⚽', 'Once upon a time'];
        fields[index] = '  ';
        const result = parseHistoryCSV(HISTORY_HEADER + fields.map(escapeCSV).join(',') + '\n');
        assert.equal(result.ok, false);
        assert.match(result.error, /Row 2/);
        assert.match(result.error, new RegExp(`${column} is empty`));
    });
}

test('parseHistoryCSV rejects a row with too few fields', () => {
    const result = parseHistoryCSV(HISTORY_HEADER + '"2026-07-11","July 11, 2026"\n');
    assert.equal(result.ok, false);
    assert.match(result.error, /Row 2/);
});

test('parseHistoryCSV is all-or-nothing: one bad row means no stories', () => {
    const result = parseHistoryCSV(HISTORY_HEADER + validRow('2026-07-11') + validRow('nope'));
    assert.equal(result.ok, false);
    assert.equal(result.stories, undefined);
});

test('parseHistoryCSV does not drop rows older than six months', () => {
    const result = parseHistoryCSV(HISTORY_HEADER + validRow('2019-01-01'));
    assert.equal(result.ok, true);
    assert.equal(result.stories[0].dateKey, '2019-01-01');
});

const entry = (dateKey, story = 'story') => ({ dateKey, date: dateKey, emojis: '😀 🐻 🍔 ⚽', story });

test('mergeImportedStories adds imported stories and keeps newest first', () => {
    const { stories, added, skipped } = mergeImportedStories(
        [entry('2026-07-11')],
        [entry('2026-07-12'), entry('2026-07-09')]
    );
    assert.deepEqual(stories.map(s => s.dateKey), ['2026-07-12', '2026-07-11', '2026-07-09']);
    assert.equal(added, 2);
    assert.equal(skipped, 0);
});

test('mergeImportedStories keeps the existing story when a date is in both', () => {
    const { stories, added, skipped } = mergeImportedStories(
        [entry('2026-07-11', 'browser B version')],
        [entry('2026-07-11', 'browser A version'), entry('2026-07-10')]
    );
    assert.equal(stories.find(s => s.dateKey === '2026-07-11').story, 'browser B version');
    assert.equal(stories.length, 2);
    assert.equal(added, 1);
    assert.equal(skipped, 1);
});

test('mergeImportedStories into an empty history imports everything', () => {
    const { stories, added } = mergeImportedStories([], [entry('2026-07-11'), entry('2026-07-10')]);
    assert.equal(stories.length, 2);
    assert.equal(added, 2);
});

test('mergeImportedStories keeps stories older than six months', () => {
    const { stories } = mergeImportedStories([entry('2026-07-11')], [entry('2019-01-01')]);
    assert.ok(stories.some(s => s.dateKey === '2019-01-01'));
});

test('mergeImportedStories collapses duplicate dates within the import (first wins)', () => {
    const { stories, added, skipped } = mergeImportedStories([], [entry('2026-07-11', 'first'), entry('2026-07-11', 'second')]);
    assert.equal(stories.length, 1);
    assert.equal(stories[0].story, 'first');
    assert.equal(added, 1);
    assert.equal(skipped, 1);
});

test('mergeImportedStories does not mutate its inputs', () => {
    const existing = [entry('2026-07-11')];
    const imported = [entry('2026-07-10')];
    mergeImportedStories(existing, imported);
    assert.equal(existing.length, 1);
    assert.equal(imported.length, 1);
});

test('describeImportSuccess reports the count and points to history', () => {
    assert.deepEqual(describeImportSuccess(42, 0), [
        'Imported 42 stories.',
        'View history to see the imported entries.'
    ]);
});

test('describeImportSuccess uses the singular for one story', () => {
    assert.equal(describeImportSuccess(1, 0)[0], 'Imported 1 story.');
});

test('describeImportSuccess mentions stories skipped because the browser already had that day', () => {
    const lines = describeImportSuccess(3, 2);
    assert.equal(lines[0], 'Imported 3 stories.');
    assert.match(lines[1], /2 .*already/);
    assert.equal(lines[lines.length - 1], 'View history to see the imported entries.');
    assert.match(describeImportSuccess(3, 1)[1], /1 story/);
});

test('describeImportSuccess explains when nothing new was imported', () => {
    const lines = describeImportSuccess(0, 5);
    assert.match(lines[0], /No new stories/);
    assert.match(lines[0], /5/);
    assert.ok(!lines.some(line => /View history/.test(line)));
});

test('resolveThemeAttribute forces the explicit choice for "light" or "dark"', () => {
    assert.equal(resolveThemeAttribute('light'), 'light');
    assert.equal(resolveThemeAttribute('dark'), 'dark');
});

test('resolveThemeAttribute returns null for "system", missing, or invalid values', () => {
    // null means "no override" - the caller removes the data-theme
    // attribute entirely, letting the prefers-color-scheme media query
    // decide instead.
    assert.equal(resolveThemeAttribute('system'), null);
    assert.equal(resolveThemeAttribute(null), null);
    assert.equal(resolveThemeAttribute(undefined), null);
    assert.equal(resolveThemeAttribute('bogus'), null);
});

test('APP_VERSION matches package.json version', () => {
    assert.equal(APP_VERSION, packageVersion);
});
