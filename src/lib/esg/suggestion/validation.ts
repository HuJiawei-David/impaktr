import { z } from 'zod';

export const BandSchema = z.enum(['E', 'S', 'G', 'SEG_overall']);

export const SuggestionFocusSchema = z.object({
  band: BandSchema.optional(),
  sdgs: z.array(z.string()).optional(),
});

export const SuggestionTargetsSchema = z.object({
  hours: z.number().min(0).optional(),
  participants: z.number().min(0).optional(),
  orgScoreDelta: z.number().optional(),
});

export const SuggestionConstraintsSchema = z.object({
  budget: z.number().min(0).optional(),
  maxEvents: z.number().min(1).optional(),
  riskAllowed: z.array(z.enum(['low', 'medium', 'high'])).optional(),
  weekendsOnly: z.boolean().optional(),
});

export const SuggestionRequestSchema = z.object({
  focus: SuggestionFocusSchema,
  targets: SuggestionTargetsSchema,
  constraints: SuggestionConstraintsSchema.optional(),
  snapshotId: z.string().optional(),
});

export type SuggestionRequestInput = z.infer<typeof SuggestionRequestSchema>;
