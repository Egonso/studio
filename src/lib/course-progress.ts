import { courseData } from '@/lib/course-data';

export interface AcademyProgressSnapshot {
  completedVideos: number;
  totalVideos: number;
  completionPercent: number;
  started: boolean;
  completed: boolean;
}

export function countCourseVideos(): number {
  return courseData.reduce(
    (sum, module) =>
      sum + module.videos.filter((video) => !video.isDirectDownload).length,
    0,
  );
}

export function buildAcademyProgressSnapshot(
  completedVideoIds: string[],
): AcademyProgressSnapshot {
  const totalVideos = countCourseVideos();
  const completedVideos = Math.min(completedVideoIds.length, totalVideos);
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
