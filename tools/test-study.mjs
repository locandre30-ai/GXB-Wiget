import assert from 'node:assert/strict';
import test from 'node:test';
import { cleanVideo, youtubeId } from '../arena/study-store.mjs';
import { exportBook, importBook, newProfile, validateBook } from '../arena/store.mjs';

test('YouTube links are canonicalized by exact host, scheme and video ID', () => {
  const id = 'Abcd_ef-123';
  for (const url of ['https://youtu.be/' + id, 'https://www.youtube.com/watch?v=' + id + '&t=30', 'https://www.youtube.com/shorts/' + id]) {
    assert.equal(youtubeId(url), id);
  }
  for (const url of ['https://youtube.com.example.com/watch?v=' + id, 'http://youtube.com/watch?v=' + id,
    'https://www.youtube.com@evil.test/watch?v=' + id, 'https://www.youtube.com/channel/' + id, 'https://youtu.be/not-valid']) {
    assert.equal(youtubeId(url), null);
  }
});

test('study state round-trips per profile without changing Gold or Bitcoin journey keys', () => {
  const one = newProfile('One', 'beginner'), two = newProfile('Two', 'beginner');
  one.state.journey = { market: 'bitcoin', completed: { bitcoin: { version: 1 } }, skills: { gold: [1, 2] } };
  const video = cleanVideo({ id: 'example', url: 'https://youtu.be/Abcd_ef-123', title: 'Fixture', educator: 'Test',
    category: 'Trading psychology', duration: '6 min', lesson: 'Define risk', practice: 'Entries' });
  one.study.videos.push(video);
  one.study.entries['video:example'] = { saved: true, watched: true, note: 'Study execution.' };
  one.study.entries['archive:inflation-2022'] = { saved: true, note: 'Compare the timing.' };
  one.study.entries['reflection:gxb-1'] = { saved: true };
  one.study.recent = ['video:example', 'archive:inflation-2022'];
  const initial = validateBook({ version: 1, active: 'one', profiles: { one, two }, imports: [] });
  const blank = { version: 1, active: null, profiles: {}, imports: [] };
  const restored = importBook(blank, exportBook(initial));
  assert.deepEqual(restored, initial);
  assert.equal(restored.profiles.one.state.journey.completed.bitcoin.version, 1);
  assert.deepEqual(restored.profiles.one.state.journey.skills.gold, [1, 2]);
  assert.deepEqual(restored.profiles.two.study.entries, {});
  assert.equal(restored.profiles.two.study.videos.length, 0);
});

test('approved YouTube embed code is treated as input data', () => {
  assert.equal(youtubeId('<iframe title="YouTube" src="https://www.youtube-nocookie.com/embed/Abcd_ef-123"></iframe>'), 'Abcd_ef-123');
  assert.equal(youtubeId('<iframe src="https://youtube.com.evil.example/embed/Abcd_ef-123"></iframe>'), null);
  assert.equal(youtubeId('<script src="https://www.youtube.com/embed/Abcd_ef-123"></script>'), null);
});
