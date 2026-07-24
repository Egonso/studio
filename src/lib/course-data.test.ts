import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { resolve } from "node:path";

import { courseData } from "./course-data";

const EXPECTED_UPDATED_VIDEOS = [
    "video-0-1",
    "video-0-5",
    "video-2-2",
    "video-2-3",
    "video-2-4",
    "video-2-5",
    "video-2-6",
    "video-2-7",
    "video-2-8",
    "video-2-9",
];

test("course legal updates are complete, localised and officially sourced", () => {
    const updatedVideos = courseData
        .flatMap((module) => module.videos)
        .filter((video) => video.legalUpdate);

    assert.deepEqual(
        updatedVideos.map((video) => video.id),
        EXPECTED_UPDATED_VIDEOS,
    );

    for (const video of updatedVideos) {
        const update = video.legalUpdate;
        assert.ok(update);
        assert.equal(update.checkedAt, "2026-07-24");
        assert.ok(update.status.de.length > 0);
        assert.ok(update.status.en.length > 0);
        assert.ok(update.points.length > 0);
        assert.ok(update.sources.length > 0);

        for (const point of update.points) {
            assert.ok(point.de.length > 0);
            assert.ok(point.en.length > 0);
        }

        for (const source of update.sources) {
            const urls = source.localizedUrl
                ? [source.localizedUrl.de, source.localizedUrl.en]
                : [source.url];
            for (const url of urls) {
                const hostname = new URL(url).hostname;
                assert.ok(
                    hostname === "eur-lex.europa.eu"
                    || hostname === "ai-act-service-desk.ec.europa.eu"
                    || hostname === "digital-strategy.ec.europa.eu",
                    `${video.id} uses a non-official source: ${url}`,
                );
            }
            assert.ok(source.label.de.length > 0);
            assert.ok(source.label.en.length > 0);
        }
    }
});

test("course legal updates preserve the key application-date boundaries", () => {
    const videos = courseData.flatMap((module) => module.videos);
    const getUpdate = (videoId: string) => {
        const update = videos.find((video) => video.id === videoId)?.legalUpdate;
        assert.ok(update, `${videoId} must have a legal update`);
        return update;
    };

    assert.equal(
        videos.find((video) => video.id === "video-2-1")?.legalUpdate,
        undefined,
    );

    for (const videoId of ["video-0-1", "video-2-2", "video-2-3", "video-2-9"]) {
        const status = getUpdate(videoId).status;
        assert.match(status.de, /27\. Juli 2026/);
        assert.match(status.en, /27 July 2026/);
    }

    for (const videoId of ["video-2-5", "video-2-7"]) {
        const status = getUpdate(videoId).status;
        assert.match(status.de, /2\. August 2026/);
        assert.match(status.en, /2 August 2026/);
    }

    const prohibitedPractices = getUpdate("video-2-3");
    assert.match(
        prohibitedPractices.points.map((point) => point.de).join(" "),
        /2\. Dezember 2026/,
    );
    assert.match(
        prohibitedPractices.points.map((point) => point.en).join(" "),
        /2 December 2026/,
    );

    const omnibusSource = getUpdate("video-2-9").sources.find(
        (source) => source.localizedUrl,
    );
    assert.ok(omnibusSource?.localizedUrl);
    assert.match(omnibusSource.localizedUrl.de, /\/deu$/);
    assert.match(omnibusSource.localizedUrl.en, /\/eng$/);
});

test("course page renders the dated update after the description and before resources", () => {
    const pageSource = readFileSync(
        resolve(process.cwd(), "src/app/[locale]/kurs/page.tsx"),
        "utf8",
    );
    const descriptionIndex = pageSource.indexOf("selectedItem.data.description");
    const legalUpdateIndex = pageSource.indexOf(
        "selectedItem.data.legalUpdate ?",
    );
    const resourcesIndex = pageSource.indexOf(
        "selectedItem.data.resources?.length",
    );

    assert.ok(descriptionIndex >= 0);
    assert.ok(legalUpdateIndex > descriptionIndex);
    assert.ok(resourcesIndex > legalUpdateIndex);
    assert.match(pageSource, /Aktualisierung zum Video/);
    assert.doesNotMatch(pageSource, /Korrekturen und Ergänzungen zum Video/);
});
