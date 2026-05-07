import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAcademyProgressSnapshot,
  countCourseVideos,
  getCourseVideoIds,
} from './course-progress';

test('academy progress requires all real course videos', () => {
  const videoIds = getCourseVideoIds();
  const snapshot = buildAcademyProgressSnapshot(videoIds);

  assert.equal(videoIds.length, countCourseVideos());
  assert.equal(snapshot.completed, true);
  assert.equal(snapshot.completedVideos, snapshot.totalVideos);
  assert.equal(snapshot.completionPercent, 100);
});

test('academy progress ignores duplicate and unknown video ids', () => {
  const firstVideoId = getCourseVideoIds()[0];
  assert.ok(firstVideoId);
  const snapshot = buildAcademyProgressSnapshot([
    firstVideoId,
    firstVideoId,
    'not-a-course-video',
  ]);

  assert.equal(snapshot.started, true);
  assert.equal(snapshot.completed, false);
  assert.equal(snapshot.completedVideos, 1);
});
