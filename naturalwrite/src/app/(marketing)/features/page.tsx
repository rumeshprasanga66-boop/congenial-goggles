import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Brain,
  FileText,
  LayoutTemplate,
  PenLine,
  Search,
  Sparkles,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import { Section, SectionHeading } from "@/components/marketing/section";
import { buttonStyles } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Features",
  description:
    "A writing studio, inline editing, brainstorming, research and a document library — the NaturalWrite workspace explained.",
};

const pillars = [
  {
    icon: PenLine,
    title: "AI Writing Studio",
    body: "Give a topic, target audience, purpose, tone and length. NaturalWrite identifies what is missing, proposes an outline, then drafts the piece in editable sections instead of one unwieldy block.",
    points: [
      "Nine writing modes from natural to academic",
      "Short, medium, long or a custom word count",
      "Section-by-section regeneration",
    ],
  },
  {
    icon: Sparkles,
    title: "Rewrite & Improve",
    body: "Paste text or open a document, pick an improvement, and compare the original against the revision side by side before anything changes.",
    points: [
      "Improve, simplify, expand or shorten",
      "Change tone or fix grammar",
      "Accept or reject every suggestion",
    ],
  },
  {
    icon: Brain,
    title: "Brainstorm",
    body: "Generate blog topics, headlines, outlines, content calendars and research questions, then turn the one you like into a document.",
    points: [
      "Ideas grouped by purpose",
      "Outline generation",
      "One-click handoff to the studio",
    ],
  },
  {
    icon: Search,
    title: "Research Assistant",
    body: "Ask a research question and get findings with their sources attached. Source-backed claims stay separate from suggestions, and citations are never invented.",
    points: [
      "Source titles and links preserved",
      "Clear separation of fact and suggestion",
      "Add findings straight to a document",
    ],
  },
  {
    icon: Users,
    title: "Brand Voice",
    body: "Save tone, audience, preferred vocabulary, words to avoid and sample text so drafts start closer to how you actually write.",
    points: [
      "Multiple reusable profiles",
      "Applies to generation and rewriting",
      "Editable at any time",
    ],
  },
  {
    icon: FileText,
    title: "Document library",
    body: "Everything you write is saved to your account with search, filters, favourites and trash, so work is never stranded in a browser tab.",
    points: [
      "List and grid views",
      "Autosave with word and character counts",
      "Favourites and recoverable trash",
    ],
  },
];

const workflow = [
  {
    step: "1",
    title: "Describe the brief",
    body: "Topic, audience, purpose, tone and length. The studio asks for what it still needs before it starts.",
  },
  {
    step: "2",
    title: "Review the outline",
    body: "See the structure first and change it while edits are still cheap.",
  },
  {
    step: "3",
    title: "Draft in sections",
    body: "Long pieces are written in manageable parts so quality stays even throughout.",
  },
  {
    step: "4",
    title: "Refine inline",
    body: "Select any passage to improve, simplify or retone it, accepting only the changes you want.",
  },
];

const resources = [
  {
    icon: BarChart3,
    title: "Usage you can see",
    body: "Every generation is logged with its model, token counts and estimated cost, so spend is never a mystery.",
  },
  {
    icon: Star,
    title: "Organised by what matters",
    body: "Favourites and filters keep current work in reach and old work out of the way.",
  },
  {
    icon: Trash2,
    title: "Nothing disappears by accident",
    body: "Deleted documents wait in the trash until you choose to remove them permanently.",
  },
  {
    icon: LayoutTemplate,
    title: "Templates that carry structure",
    body: "Start from a proven shape for articles, emails and business documents rather than a blank page.",
  },
];

export default function FeaturesPage() {
  return (
    <>
      <Section className="pb-10 pt-16 sm:pt-20">
        <SectionHeading
          eyebrow="Features"
          title="Everything you need to get from a rough idea to a finished draft"
          description="NaturalWrite is a workspace, not a chat window. Each part handles a stage of the job and hands off cleanly to the next."
        />
      </Section>

      <Section className="pt-0">
        <div className="grid gap-4 lg:grid-cols-2">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="rounded-card border border-line bg-surface p-6 shadow-card"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-control border border-line bg-subtle text-brand">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <h2 className="text-sm font-semibold text-ink">
                    {pillar.title}
                  </h2>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {pillar.body}
                </p>
                <ul className="mt-4 space-y-2 border-t border-line pt-4">
                  {pillar.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-2 text-xs text-muted"
                    >
                      <span
                        className="mt-1.5 size-1 shrink-0 rounded-full bg-brand"
                        aria-hidden="true"
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Section>

      <Section id="workflow" className="border-t border-line bg-subtle">
        <SectionHeading
          eyebrow="Writing workflow"
          title="Four steps, each one yours to change"
          description="The point is not to remove you from the writing. It is to remove the blank page."
        />
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {workflow.map((item) => (
            <li
              key={item.step}
              className="rounded-card border border-line bg-surface p-5 shadow-card"
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-ink">
                {item.step}
              </span>
              <h3 className="mt-4 text-sm font-semibold text-ink">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="resources">
        <SectionHeading
          eyebrow="Resources"
          title="The parts that keep a workspace usable over time"
          description="Good writing tools are judged on the second week, not the first demo."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {resources.map((resource) => {
            const Icon = resource.icon;
            return (
              <div
                key={resource.title}
                className="flex gap-4 rounded-card border border-line bg-surface p-5 shadow-card"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-control border border-line bg-subtle text-brand">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    {resource.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {resource.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section className="border-t border-line bg-subtle">
        <div className="rounded-card border border-line bg-surface px-6 py-12 text-center shadow-card sm:px-12">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-ink">
            See the workspace for yourself
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-base text-muted">
            Create an account and start a document. Features ship in phases, and
            anything not yet built says so plainly rather than pretending to work.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className={buttonStyles({ variant: "primary", size: "lg" })}
            >
              Start writing for free
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/pricing"
              className={buttonStyles({ variant: "secondary", size: "lg" })}
            >
              Compare plans
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
