import { describe, it, expect } from "vitest";
import aboutData from "./about.json";
import type { AboutPageData } from "./about.types";
import { resolveIcon } from "../lib/iconMap";

describe("About Data & Schema", () => {
  const data = aboutData as AboutPageData;

  it("has valid hero data", () => {
    expect(data.hero.eyebrow).toBeTruthy();
    expect(data.hero.title).toBeTruthy();
    expect(data.hero.description).toBeTruthy();
    expect(data.hero.ctas.length).toBeGreaterThan(0);
  });

  it("has valid profile data", () => {
    expect(data.profile.name).toBe("Jess Andrey Sundiang");
    expect(data.profile.age).toBe(20);
    expect(data.profile.instrument).toBeTruthy();
  });

  it("has valid mission with resolved icons", () => {
    expect(data.mission.statement).toBeTruthy();
    expect(data.mission.pillars.length).toBe(3);
    for (const pillar of data.mission.pillars) {
      expect(resolveIcon(pillar.icon)).toBeDefined();
    }
  });

  it("has story and timeline entries", () => {
    expect(data.story.paragraphs.length).toBeGreaterThan(0);
    expect(data.timeline.length).toBeGreaterThanOrEqual(5);
  });

  it("has values with resolvable icons", () => {
    expect(data.values.items.length).toBe(3);
    for (const item of data.values.items) {
      expect(resolveIcon(item.icon)).toBeDefined();
    }
  });

  it("has impact stats with resolvable icons", () => {
    expect(data.impact.stats.length).toBe(6);
    for (const stat of data.impact.stats) {
      expect(resolveIcon(stat.icon)).toBeDefined();
    }
  });

  it("has FAQ items", () => {
    expect(data.faq.items.length).toBe(5);
    for (const item of data.faq.items) {
      expect(item.question).toBeTruthy();
      expect(item.answer).toBeTruthy();
    }
  });

  it("has join details with resolvable icons", () => {
    expect(data.join.details.length).toBe(4);
    for (const detail of data.join.details) {
      expect(resolveIcon(detail.icon)).toBeDefined();
    }
  });
});
