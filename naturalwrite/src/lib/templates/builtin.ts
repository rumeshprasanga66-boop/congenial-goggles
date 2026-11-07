import type { ContentType } from "@/lib/types";
import type { LengthId, ToneId } from "@/lib/ai/options";

/**
 * Built-in templates.
 *
 * These ship with the app and are defined in code, so there is nothing to fetch
 * and nothing to fabricate. Each one prefills the studio brief: the topic prompt
 * is a starting point for the user to replace, not generated content.
 *
 * Categories are derived from the templates themselves, so a new template cannot
 * introduce a category that has no entries.
 */

export interface BuiltinTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  /** Prefills the brief's requirements field. */
  guidance: string;
  /** A suggested topic; the user is expected to make it their own. */
  topicPrompt: string;
  contentType: ContentType;
  tone: ToneId;
  length: LengthId;
}

export const BUILTIN_TEMPLATES: BuiltinTemplate[] = [
  {
    id: "how-to-guide",
    title: "How-to guide",
    description: "Step-by-step instructions a reader can follow in order.",
    category: "Content marketing",
    guidance:
      "Open by naming the problem and who it affects. Give prerequisites before the steps. Number the steps, one action each. Close with how to tell it worked.",
    topicPrompt: "How to achieve a specific outcome",
    contentType: "blog_post",
    tone: "conversational",
    length: "long",
  },
  {
    id: "listicle",
    title: "Listicle",
    description: "A numbered list where every entry carries its own weight.",
    category: "Content marketing",
    guidance:
      "Each entry needs a specific claim and a reason, not a restatement of the heading. Order the entries so the strongest comes first and the most practical last.",
    topicPrompt: "Things to know about a subject",
    contentType: "blog_post",
    tone: "friendly",
    length: "medium",
  },
  {
    id: "thought-leadership",
    title: "Thought leadership piece",
    description: "A clear point of view, argued rather than asserted.",
    category: "Content marketing",
    guidance:
      "State the position in the first two paragraphs. Anticipate the strongest objection and answer it. Avoid hedging, and avoid predictions presented as fact.",
    topicPrompt: "Why a common practice is holding teams back",
    contentType: "article",
    tone: "authoritative",
    length: "long",
  },
  {
    id: "product-launch",
    title: "Product launch announcement",
    description: "What changed, who it helps and how to start using it.",
    category: "Product",
    guidance:
      "Lead with what the user can now do that they could not before. Describe the change concretely. Include how to get started. Do not invent performance claims or customer numbers.",
    topicPrompt: "Announcing a product or feature",
    contentType: "product",
    tone: "professional",
    length: "short",
  },
  {
    id: "release-notes",
    title: "Release notes",
    description: "A short, factual summary of what shipped.",
    category: "Product",
    guidance:
      "Group by added, changed and fixed. One line per item, describing the user-visible effect. No marketing language and no claims about speed or reliability.",
    topicPrompt: "Release notes for a version",
    contentType: "business",
    tone: "direct",
    length: "short",
  },
  {
    id: "cold-email",
    title: "Cold outreach email",
    description: "A short email that earns a reply.",
    category: "Sales and email",
    guidance:
      "Under 150 words. Open with something specific to the recipient, not a compliment. One clear ask. No fabricated familiarity and no invented mutual connections.",
    topicPrompt: "Outreach email about an offer to a specific audience",
    contentType: "email",
    tone: "direct",
    length: "short",
  },
  {
    id: "welcome-email",
    title: "Welcome email",
    description: "Set expectations and point to the first useful action.",
    category: "Sales and email",
    guidance:
      "Confirm what the reader signed up for, name one thing to do next, and say what will arrive and when. Keep it under 200 words.",
    topicPrompt: "Welcome email for a product or newsletter",
    contentType: "email",
    tone: "friendly",
    length: "short",
  },
  {
    id: "executive-summary",
    title: "Executive summary",
    description: "The decision, the reason and the next step, up front.",
    category: "Business",
    guidance:
      "Lead with the recommendation. Then the reasoning in order of weight, then risks, then what you need. No background before the point.",
    topicPrompt: "Executive summary of a project or decision",
    contentType: "business",
    tone: "professional",
    length: "short",
  },
  {
    id: "meeting-agenda",
    title: "Meeting agenda",
    description: "A timed agenda with a stated outcome.",
    category: "Business",
    guidance:
      "State the decision the meeting must reach. Give each item a duration and an owner. Put the hardest item first, while attention is highest.",
    topicPrompt: "Agenda for a meeting purpose",
    contentType: "business",
    tone: "direct",
    length: "short",
  },
  {
    id: "personal-essay",
    title: "Personal essay",
    description: "A first-person piece built around one idea.",
    category: "Long-form",
    guidance:
      "One idea, developed. Use concrete scenes rather than summary. Do not invent events, names or quotations.",
    topicPrompt: "An essay about an experience or idea",
    contentType: "essay",
    tone: "natural",
    length: "long",
  },
  {
    id: "case-study",
    title: "Case study",
    description: "Situation, what was done, what changed.",
    category: "Long-form",
    guidance:
      "Describe the starting situation precisely, then the actions taken and why, then the outcome. If a figure is unknown, leave it out rather than estimating.",
    topicPrompt: "Case study on work with a client or team",
    contentType: "article",
    tone: "professional",
    length: "long",
  },
  {
    id: "social-thread",
    title: "Social thread",
    description: "A short sequence where each post stands alone.",
    category: "Social",
    guidance:
      "Each post must make sense without the previous one. One idea per post. Open with the most interesting claim, not a greeting.",
    topicPrompt: "A thread about a subject",
    contentType: "social",
    tone: "conversational",
    length: "short",
  },
];

/** Categories in a stable order, derived from the templates that use them. */
export const TEMPLATE_CATEGORIES: string[] = Array.from(
  new Set(BUILTIN_TEMPLATES.map((template) => template.category)),
);

export function getBuiltinTemplate(id: string): BuiltinTemplate | null {
  return BUILTIN_TEMPLATES.find((template) => template.id === id) ?? null;
}

export function templatesInCategory(category: string): BuiltinTemplate[] {
  return BUILTIN_TEMPLATES.filter((template) => template.category === category);
}
