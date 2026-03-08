import type { DataCategory } from "./types";
import { DATA_CATEGORY_SPECIAL_OPTIONS } from "./types";

export function toggleMultiSelect<T>(values: T[], item: T): T[] {
  return values.includes(item)
    ? values.filter((value) => value !== item)
    : [...values, item];
}

export function applyDataCategoryLogic(
  categories: DataCategory[],
  toggled: DataCategory
): DataCategory[] {
  let next = toggleMultiSelect(categories, toggled);

  if (toggled === "NO_PERSONAL_DATA" && next.includes("NO_PERSONAL_DATA")) {
    next = next.filter(
      (category) =>
        category !== "PERSONAL_DATA" &&
        category !== "SPECIAL_PERSONAL" &&
        !DATA_CATEGORY_SPECIAL_OPTIONS.includes(category)
    );
  }

  if (
    toggled !== "NO_PERSONAL_DATA" &&
    (toggled === "PERSONAL_DATA" ||
      toggled === "SPECIAL_PERSONAL" ||
      DATA_CATEGORY_SPECIAL_OPTIONS.includes(toggled)) &&
    next.includes(toggled)
  ) {
    next = next.filter((category) => category !== "NO_PERSONAL_DATA");
  }

  if (DATA_CATEGORY_SPECIAL_OPTIONS.includes(toggled) && next.includes(toggled)) {
    if (!next.includes("PERSONAL_DATA")) {
      next = [...next, "PERSONAL_DATA"];
    }
    if (!next.includes("SPECIAL_PERSONAL")) {
      next = [...next, "SPECIAL_PERSONAL"];
    }
  }

  if (toggled === "SPECIAL_PERSONAL" && next.includes("SPECIAL_PERSONAL")) {
    if (!next.includes("PERSONAL_DATA")) {
      next = [...next, "PERSONAL_DATA"];
    }
  }

  if (toggled === "SPECIAL_PERSONAL" && !next.includes("SPECIAL_PERSONAL")) {
    next = next.filter(
      (category) => !DATA_CATEGORY_SPECIAL_OPTIONS.includes(category)
    );
  }

  if (toggled === "PERSONAL_DATA" && !next.includes("PERSONAL_DATA")) {
    next = next.filter(
      (category) =>
        category !== "SPECIAL_PERSONAL" &&
        !DATA_CATEGORY_SPECIAL_OPTIONS.includes(category)
    );
  }

  return next;
}
