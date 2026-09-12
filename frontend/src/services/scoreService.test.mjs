import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

// Run the service with mocked browser/Firebase dependencies: tests never connect
// to an account or database. Vite's DEV constant is substituted for each mode.
function loadService(dev = true, user = null) {
    const constants = readFileSync(new URL('../config/Constants.js', import.meta.url), 'utf8');
    const tiers = runInNewContext(constants.match(/export const RANK_TIERS = (\[[\s\S]*?\n\]);/)[1]);
    const source = readFileSync(new URL('./scoreService.js', import.meta.url), 'utf8')
        .replace(/^import[\s\S]*?from ['"][^'"]+['"];\s*/gm, '')
        .replace(/export /g, '')
        .replaceAll('import.meta.env.DEV', String(dev));
    const writes = [];
    const storageWrites = [];
    const auth = { currentUser: user };
    const window = { dispatchEvent() {} };
    const service = runInNewContext(`${source}\n({getRankData, setCachedRankData, resetCachedRankData, calculateUserRank, addPoints})`, {
        RANK_TIERS: tiers,
        auth, db: {}, window, Event: class {}, console,
        localStorage: { removeItem() {}, setItem: (...args) => storageWrites.push(args) },
        notifications: { show() {} },
        setTimeout: (callback) => { callback(); },
        getLocalDateString: () => '2026-09-11',
        doc: (...args) => args,
        collection: (...args) => args,
        serverTimestamp: () => 'server-time',
        updateDoc: async (ref, data) => writes.push({ kind: 'update', ref, data }),
        setDoc: async (ref, data) => writes.push({ kind: 'set', ref, data }),
        addDoc: async (ref, data) => writes.push({ kind: 'add', ref, data }),
    });
    return { ...service, helpers: window.deltasongDev, writes, storageWrites, tiers };
}

test('large preview scores work signed out without persistent writes', async () => {
    const service = loadService();
    service.helpers.setScore(50000);
    assert.equal(service.getRankData().totalScore, 50000);
    service.helpers.addPoints(100000);
    assert.equal(service.getRankData().totalScore, 150000);
    await service.addPoints(100000, 'dev');
    assert.equal(service.getRankData().totalScore, 250000);
    assert.equal(service.writes.length, 0);
    assert.equal(service.storageWrites.length, 0);
    service.helpers.clearScorePreview();
    assert.equal(service.getRankData().totalScore, 0);
});

test('real gameplay uses the real score and original cap during preview', async () => {
    const service = loadService(true, { uid: 'test-user', isAnonymous: false });
    service.setCachedRankData({ totalScore: 100 });
    service.helpers.setScore(50000);
    await service.addPoints(100000, 'characters');
    const update = service.writes.find(write => write.kind === 'update');
    const audit = service.writes.find(write => write.kind === 'add');
    assert.equal(update.data.totalScore, 600);
    assert.equal(audit.data.pointsDelta, 500);
    assert.equal(update.data.stats.charactersWon, 1);
    assert.equal(service.getRankData().totalScore, 50000);
    service.helpers.clearScorePreview();
    assert.equal(service.getRankData().totalScore, 600);
});

test('cloud refresh preserves preview; clearing it reveals the latest real score', () => {
    const service = loadService();
    service.helpers.setScore(50000);
    service.setCachedRankData({ totalScore: 900 });
    assert.equal(service.getRankData().totalScore, 50000);
    service.helpers.clearScorePreview();
    assert.equal(service.getRankData().totalScore, 900);
    service.helpers.setScore(50000);
    service.resetCachedRankData();
    assert.equal(service.getRankData().totalScore, 0);
});

test('preview rejects invalid scores and overflow without changing state', () => {
    const service = loadService();
    service.helpers.setScore(50000);
    for (const value of [NaN, Infinity, -1, 0.5, '50000', Number.MAX_SAFE_INTEGER + 1]) {
        assert.throws(() => service.helpers.setScore(value), { name: 'RangeError' });
    }
    for (const value of [NaN, Infinity, 0.5, '50000', Number.MAX_SAFE_INTEGER]) {
        assert.throws(() => service.helpers.addPoints(value), { name: 'RangeError' });
    }
    assert.equal(service.getRankData().totalScore, 50000);
    service.helpers.addPoints(-100000);
    assert.equal(service.getRankData().totalScore, 0);
});

test('production exposes no helpers and ignores dev score awards', async () => {
    const service = loadService(false, { uid: 'test-user', isAnonymous: false });
    service.setCachedRankData({ totalScore: 100 });
    assert.equal(service.helpers, undefined);
    await service.addPoints(50000, 'dev');
    assert.equal(service.getRankData().totalScore, 100);
    assert.equal(service.writes.length, 0);
});

test('rank intervals are contiguous and Heaven is the completed final tier', () => {
    const service = loadService();
    for (const [index, tier] of service.tiers.entries()) {
        const rank = service.calculateUserRank(tier.min);
        const next = service.tiers[index + 1];
        assert.equal(rank.grade, tier.grade);
        assert.equal(rank.nextTierMin, next?.min ?? null);
        if (next) {
            assert.equal(tier.max + 1, next.min);
            assert.equal(tier.min + tier.span, next.min);
            assert.equal(service.calculateUserRank(next.min - 1).grade, tier.grade);
            assert.equal(rank.progressValue, 0);
        }
    }
    for (const score of [50000, 100000, Number.MAX_SAFE_INTEGER]) {
        const rank = service.calculateUserRank(score);
        assert.equal(rank.grade, '∞');
        assert.equal(rank.label, 'Heaven');
        assert.equal(rank.progressValue, 100);
        assert.equal(rank.nextTierMin, null);
    }
});
