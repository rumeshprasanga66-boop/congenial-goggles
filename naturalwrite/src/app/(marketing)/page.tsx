import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Check,
  FileText,
  LayoutTemplate,
  PenLine,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { Section, SectionHeading } from "@/components/marketing/section";
import { buttonStyles } from "@/components/ui/button";

const features = [
  {
    icon: PenLine,
    title: "A real writing studio",
    description:
      "Give a topic, audience, tone and length. NaturalWrite plans an outline, then drafts in sections you can edit and regenerate.",
  },
  {
    icon: Sparkles,
    title: "Inline improvement",
    description:
      "Select any passage and ask for it to be shortened, simplified or made more natural. You accept or reject each change.",
  },
  {
    icon: Brain,
    title: "Brainstorming that leads somewhere",
    description:
      "Generate angles, headlines and outlines, then send the one you like straight into a new document.",
  },
  {
    icon: Search,
    title: "Research with real sources",
    description:
      "When a search provider is configured, findings arrive with source titles and links. Claims are separated from suggestions.",
  },
  {
    icon: Users,
    title: "A consistent brand voice",
    description:
      "Save your preferred tone, audience, vocabulary and samples so every draft starts closer to your voice.",
  },
  {
    icon: FileText,
    title: "Documents you can find again",
    description:
      "Autosave, favourites, search, filters and trash. Your work lives in your account, not in a browser tab.",
  },
];

const workflow = [
  {
    step: "1",
    title: "Describe the brief",
    body: "Topic, audience, purpose, tone and length. The more you give it, the less generic the result.",
  },
  {
    step: "2",
    title: "Review the outline",
    body: "See the structure before a single paragraph is written, and adjust it while it is still cheap to change.",
  },
  {
    step: "3",
    title: "Draft section by section",
    body: "Long pieces are written in manageable parts rather than one enormous, uneven response.",
  },
  {
    step: "4",
    title: "Edit and refine",
    body: "Rewrite, tighten and adjust tone inline, then export or keep working in the editor.",
  },
];

const useCases = [
  "Bloggers and content creators",
  "Freelancers and consultants",
  "Marketing teams",
  "Business owners",
  "Students and researchers",
  "Professionals writing reports",
];

export default function HomePage() {
  return (
    <>
      <Section className="pb-12 pt-16 sm:pb-16 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-10">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-subtle px-3 py-1 text-2xs font-medium text-muted">
              <Sparkles className="size-3 text-brand" aria-hidden="true" />
              Built for writing that sounds like a person
            </span>
            <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
              Your ideas deserve better writing.
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted sm:text-lg">
              Create thoughtful articles, clear business content and natural
              writing with an AI workspace built around your ideas.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className={buttonStyles({ variant: "primary", size: "lg" })}
              >
                Start writing for free
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/features"
                className={buttonStyles({ variant: "secondary", size: "lg" })}
              >
                Explore features
              </Link>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
              {[
                "No credit card to start",
                "Your documents stay private",
                "Export your work any time",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-1.5 text-xs text-muted"
                >
                  <Check className="size-3.5 text-positive" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <DashboardPreview />
        </div>
      </Section>

      <Section className="border-t border-line bg-subtle">
        <SectionHeading
          eyebrow="Why NaturalWrite"
          title="Built for the draft, not just the first sentence"
          description="Most tools stop at a paragraph. NaturalWrite is organised around the whole job: planning, drafting, editing and keeping your work."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-card border border-line bg-surface p-5 shadow-card"
              >
                <span className="flex size-9 items-center justify-center rounded-control border border-line bg-subtle text-brand">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-ink">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section id="workflow">
        <SectionHeading
          eyebrow="How it works"
          title="A workflow that respects how writing actually goes"
          description="Four steps, each one editable, so the finished piece is yours rather than something you have to rewrite from scratch."
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

      <Section id="use-cases" className="border-t border-line bg-subtle">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Use cases"
              title="Useful whether you write for work or for yourself"
              description="The workspace adapts to the format rather than forcing everything into a chat box."
            />
            <ul className="mt-7 grid gap-2.5 sm:grid-cols-2">
              {useCases.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted">
                  <Check className="size-4 shrink-0 text-brand" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: FileText, label: "Articles & long-form" },
              { icon: PenLine, label: "Emails & business documents" },
              { icon: LayoutTemplate, label: "Blog posts & social content" },
              { icon: ShieldCheck, label: "Essays & research-assisted writing" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-card border border-line bg-surface p-5 shadow-card"
                >
                  <Icon className="size-4 text-brand" aria-hidden="true" />
                  <p className="mt-3 text-sm font-medium text-ink">
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      <Section>
        <div className="rounded-card border border-line bg-surface px-6 py-12 text-center shadow-card sm:px-12">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Start with the idea. Leave with a draft.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-base text-muted">
            Create a free account and open the workspace. You can build the first
            document before you decide anything about a paid plan.
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
              See pricing
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
