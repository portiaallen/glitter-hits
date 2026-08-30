export const FEEDBACK_CATEGORIES = [
  { value: "bug", label: "Bug" },
  { value: "suggestion", label: "Suggestion" },
  { value: "feature", label: "New Feature" },
  { value: "theme", label: "Theme Idea" },
  { value: "website", label: "Website Issue" },
  { value: "love", label: "Something I Love" },
  { value: "other", label: "Other" },
  { value: "contact", label: "General contact" },
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]["value"];

export const FEEDBACK_REWARD_HITS = 50;
