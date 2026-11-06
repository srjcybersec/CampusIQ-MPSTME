import { CampusVoiceItem } from "@/lib/types/campus-voice";

/**
 * Curated campus voices for public launch.
 * Add, edit, or remove entries here — shown alongside live student posts.
 */
export const CURATED_CAMPUS_VOICES: CampusVoiceItem[] = [
  {
    id: "cv-1",
    category: "gratitude-notes",
    content:
      "Shout-out to the library staff on the 6th floor — always patient when we need extra study hours during exam week. You make MPSTME feel like home.",
    likes: 24,
    createdAt: "2026-03-10T09:00:00.000Z",
    isCurated: true,
  },
  {
    id: "cv-2",
    category: "campus-truths",
    content:
      "The best hack for long lab sessions: pack snacks, charge your laptop the night before, and sit near the window in CL block. Game changer.",
    likes: 18,
    createdAt: "2026-03-08T14:30:00.000Z",
    isCurated: true,
  },
  {
    id: "cv-3",
    category: "campus-truths",
    content:
      "Anyone else forming a study group for Data Structures? The assignment is tough but solving it together in the common area after 5 PM actually works.",
    likes: 31,
    createdAt: "2026-03-07T11:15:00.000Z",
    isCurated: true,
  },
  {
    id: "cv-4",
    category: "things-unsaid",
    content:
      "To every junior nervous about presentations: nobody remembers your stumbles — they remember that you showed up and tried. You'll be fine.",
    likes: 42,
    createdAt: "2026-03-05T16:45:00.000Z",
    isCurated: true,
  },
  {
    id: "cv-5",
    category: "guilty-pleasures",
    content:
      "No shame in admitting it: canteen vada pav after a 3-hour lab hits different. No regrets, only carbohydrates.",
    likes: 56,
    createdAt: "2026-03-04T12:00:00.000Z",
    isCurated: true,
  },
  {
    id: "cv-6",
    category: "unsent-messages",
    content:
      "To the team that stayed back to help set up Tech Fest — your effort didn't go unnoticed. Campus events run on people like you.",
    likes: 19,
    createdAt: "2026-03-02T18:20:00.000Z",
    isCurated: true,
  },
  {
    id: "cv-7",
    category: "gratitude-notes",
    content:
      "Grateful for professors who stay five extra minutes after class to clear doubts. Those minutes have saved more grades than all-nighters.",
    likes: 37,
    createdAt: "2026-02-28T10:00:00.000Z",
    isCurated: true,
  },
  {
    id: "cv-8",
    category: "campus-truths",
    content:
      "Pro tip for new students: download your timetable on CampusIQ early, sync it to Google Calendar, and actually show up to the optional electives briefing. Future you will thank present you.",
    likes: 29,
    createdAt: "2026-02-25T08:30:00.000Z",
    isCurated: true,
  },
  {
    id: "cv-9",
    category: "things-unsaid",
    content:
      "It's okay to take a mental health day and skip one non-critical class when you're burnt out. Rest is part of doing well, not the opposite of it.",
    likes: 48,
    createdAt: "2026-02-22T15:10:00.000Z",
    isCurated: true,
  },
  {
    id: "cv-10",
    category: "guilty-pleasures",
    content:
      "Sitting in the back row of a guest lecture just to hear the Q&A session while finishing pending assignments. Multitasking royalty.",
    likes: 22,
    createdAt: "2026-02-20T13:40:00.000Z",
    isCurated: true,
  },
];

export function getCuratedCampusVoices(category?: string): CampusVoiceItem[] {
  const sorted = [...CURATED_CAMPUS_VOICES].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  if (!category || category === "all") return sorted;
  return sorted.filter((v) => v.category === category);
}
