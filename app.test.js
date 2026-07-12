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
    upsertStory,
    pruneStoriesOlderThan,
    escapeCSV
} = require('./app.js');

test('hashCode is deterministic for the same string', () => {
    assert.equal(hashCode('2026-7-11'), hashCode('2026-7-11'));
});

test('formatDateKey pads single-digit month and day', () => {
    assert.equal(formatDateKey(new Date(Date.UTC(2026, 0, 5))), '2026-01-05');
    assert.equal(formatDateKey(new Date(Date.UTC(2026, 11, 25))), '2026-12-25');
});

test('formatDateKey uses UTC fields, not local time', () => {
    // 30 minutes past midnight UTC: local time in negative-offset zones
    // (e.g. US) would still read as the previous day if formatDateKey used
    // local getters instead of UTC ones - it must not.
    const justAfterUtcMidnight = new Date(Date.UTC(2026, 0, 5, 0, 30));
    assert.equal(formatDateKey(justAfterUtcMidnight), '2026-01-05');
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
