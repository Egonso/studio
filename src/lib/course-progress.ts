import { courseData } from '@/lib/course-data';

export interface AcademyProgressSnapshot {
  completedVideos: number;
  totalVideos: number;
  completionPercent: number;
  started: boolean;
  completed: boolean;
}

export function countCourseVideos(): number {
  return getCourseVideoIds().length;
}

export function getCourseVideoIds(): string[] {
  return courseData.flatMap((module) =>
    module.videos
      .filter((video) => !video.isDirectDownload)
      .map((video) => video.id),
  );
}

export function buildAcademyProgressSnapshot(
  completedVideoIds: string[],
): AcademyProgressSnapshot {
  const courseVideoIds = getCourseVideoIds();
  const validCourseVideoIds = new Set(courseVideoIds);
  const completedVideos = new Set(
    completedVideoIds.filter((videoId) => validCourseVideoIds.has(videoId)),
  ).size;
  const totalVideos = courseVideoIds.length;
  const completionPercent =
    totalVideos === 0 ? 0 : Math.round((completedVideos / totalVideos) * 100);

  return {
    completedVideos,
    totalVideos,
    completionPercent,
    started: completedVideos > 0,
    completed: totalVideos > 0 && completedVideos >= totalVideos,
  };
}
