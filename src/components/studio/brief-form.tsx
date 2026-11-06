"use client";

import { useId } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label, Select, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import {
  CONTENT_TYPES,
  LENGTHS,
  MAX_CUSTOM_WORDS,
  MIN_CUSTOM_WORDS,
  TONES,
  type LengthId,
  type ToneId,
} from "@/lib/ai/options";
import type { ContentType } from "@/lib/types";
import type { StudioBrief } from "./types";

/**
 * The brief step. Every field maps to something the prompt builders read, so
 * there are no decorative controls here.
 */
export function BriefForm({
  brief,
  brandVoices = [],
  onChange,
  onSubmit,
  submitting,
  disabled,
  errors,
}: {
  brief: StudioBrief;
  /** Saved voices offered as a choice. Empty means no voices exist yet. */
  brandVoices?: Array<{ id: string; name: string }>;
  onChange: (next: StudioBrief) => void;
  onSubmit: () => void;
  submitting: boolean;
  disabled?: boolean;
  errors: string[];
}) {
  const topicId = useId();
  const brandVoiceId = useId();
  const typeId = useId();
  const toneId = useId();
  const audienceId = useId();
  const lengthId = useId();
  const customWordsId = useId();
  const requirementsId = useId();

  const topicMissing = !brief.topic.trim();
  const showTopicError = errors.some((error) => /topic/i.test(error));

  function update<K extends keyof StudioBrief>(key: K, value: StudioBrief[K]) {
    onChange({ ...brief, [key]: value });
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div>
        <Label htmlFor={topicId}>
          What are you writing about?
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        </Label>
        <Textarea
          id={topicId}
          value={brief.topic}
          onChange={(event) => update("topic", event.target.value)}
          rows={3}
          maxLength={500}
          disabled={disabled}
          placeholder="For example: how small engineering teams ship faster with short feedback loops"
          className={cn("mt-1.5", showTopicError && "border-danger")}
          aria-invalid={showTopicError || undefined}
          aria-describedby={`${topicId}-hint`}
          required
        />
        <FieldHint id={`${topicId}-hint`}>
          Be specific. A sentence or two of context gives far better results than a
          single keyword.
        </FieldHint>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor={typeId}>Format</Label>
          <Select
            id={typeId}
            value={brief.contentType}
            onChange={(event) => update("contentType", event.target.value as ContentType)}
            disabled={disabled}
            className="mt-1.5"
          >
            {CONTENT_TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </Select>
          <FieldHint>
            {CONTENT_TYPES.find((type) => type.id === brief.contentType)?.description}
          </FieldHint>
        </div>

        <div>
          <Label htmlFor={toneId}>Tone</Label>
          <Select
            id={toneId}
            value={brief.tone}
            onChange={(event) => update("tone", event.target.value as ToneId)}
            disabled={disabled}
            className="mt-1.5"
          >
            {TONES.map((tone) => (
              <option key={tone.id} value={tone.id}>
                {tone.label}
              </option>
            ))}
          </Select>
          <FieldHint>
            {TONES.find((tone) => tone.id === brief.tone)?.description}
          </FieldHint>
        </div>
      </div>

      <div>
        <Label htmlFor={audienceId}>Who is it for?</Label>
        <Input
          id={audienceId}
          value={brief.audience}
          onChange={(event) => update("audience", event.target.value)}
          maxLength={300}
          disabled={disabled}
          placeholder="Optional, for example: engineering managers at growing startups"
          className="mt-1.5"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor={lengthId}>Length</Label>
          <Select
            id={lengthId}
            value={brief.length}
            onChange={(event) => update("length", event.target.value as LengthId)}
            disabled={disabled}
            className="mt-1.5"
          >
            {LENGTHS.map((length) => (
              <option key={length.id} value={length.id}>
                {length.label}
                {length.id !== "custom" ? ` — ${length.description}` : ""}
              </option>
            ))}
          </Select>
        </div>

        {brief.length === "custom" && (
          <div>
            <Label htmlFor={customWordsId}>Word count</Label>
            <Input
              id={customWordsId}
              type="number"
              min={MIN_CUSTOM_WORDS}
              max={MAX_CUSTOM_WORDS}
              step={50}
              value={brief.customWords}
              onChange={(event) =>
                update("customWords", Number(event.target.value) || MIN_CUSTOM_WORDS)
              }
              disabled={disabled}
              className="mt-1.5"
            />
            <FieldHint>
              Between {MIN_CUSTOM_WORDS} and {MAX_CUSTOM_WORDS.toLocaleString("en-US")} words.
            </FieldHint>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor={brandVoiceId}>Brand voice</Label>
        <Select
          id={brandVoiceId}
          value={brief.brandVoiceId}
          onChange={(event) => update("brandVoiceId", event.target.value)}
          disabled={disabled}
          className="mt-1.5"
        >
          <option value="">None</option>
          {brandVoices.map((voice) => (
            <option key={voice.id} value={voice.id}>
              {voice.name}
            </option>
          ))}
        </Select>
        <FieldHint>
          {brandVoices.length === 0
            ? "Save a brand voice in Brand Voice and it will be offered here."
            : "Applied to the outline and every section written from it."}
        </FieldHint>
      </div>

      <div>
        <Label htmlFor={requirementsId}>Anything else it must cover?</Label>
        <Textarea
          id={requirementsId}
          value={brief.requirements}
          onChange={(event) => update("requirements", event.target.value)}
          rows={3}
          maxLength={2000}
          disabled={disabled}
          placeholder="Optional. Points to include, things to avoid, sources to draw on."
          className="mt-1.5"
        />
      </div>

      {errors.length > 0 && (
        <div
          role="alert"
          className="rounded-control border border-danger/25 bg-danger/5 px-3 py-2.5"
        >
          <ul className="space-y-1 text-xs text-danger">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <Button type="submit" disabled={submitting || disabled || topicMissing}>
          <Sparkles className="size-4" aria-hidden="true" />
          {submitting ? "Planning the outline…" : "Plan the outline"}
        </Button>
        <p className="text-xs text-muted">
          You will see and edit the outline before any prose is written.
        </p>
      </div>
    </form>
  );
}
