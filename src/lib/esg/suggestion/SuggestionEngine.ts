import { prisma } from '@/lib/prisma';
import { SuggestionRequest, SuggestionResult, SuggestedEvent } from './types';
import { calculateEventDeltas, computeOrgScore, getCurrentESGBaseline } from '../scoring';

/**
 * Rule-based suggestion engine that generates event plans to meet ESG targets
 * @param req - Suggestion request with focus, targets, and constraints
 * @returns Suggestion result with recommended events and predictions
 */
export async function getSuggestion(req: SuggestionRequest, organizationId?: string): Promise<SuggestionResult> {
  // Load latest organization metric snapshot
  const snapshot = await getLatestSnapshot(req.snapshotId, organizationId);
  if (!snapshot) {
    throw new Error('No organization metric snapshot found');
  }

  // Load event templates
  const templates = await getEventTemplates(req);
  if (templates.length === 0) {
    return createEmptyResult(req);
  }

  // Filter templates based on constraints
  const filteredTemplates = filterTemplates(templates, req);
  
  // Rank templates based on focus
  const rankedTemplates = rankTemplates(filteredTemplates, req, snapshot);
  
  // Greedy selection to meet targets
  const plan = greedySelection(rankedTemplates, req, snapshot);
  
  // Calculate totals and predictions
  const totals = calculateTotals(plan);
  const predictedDelta = calculatePredictedDelta(plan, snapshot);
  const sdgsCovered = getSDGsCovered(plan);
  const meets = checkTargets(req, totals, predictedDelta);
  const warnings = generateWarnings(req, plan, totals, predictedDelta);

  return {
    plan,
    totals,
    predictedDelta,
    sdgsCovered,
    meets,
    warnings,
  };
}

async function getLatestSnapshot(snapshotId?: string, organizationId?: string) {
  if (snapshotId) {
    return await prisma.organizationMetricSnapshot.findUnique({
      where: { id: snapshotId },
    });
  }
  
  // If no snapshot exists, create one from current organization data
  if (organizationId) {
    const baseline = await getCurrentESGBaseline(organizationId);
    
    // Create a snapshot
    const snapshot = await prisma.organizationMetricSnapshot.create({
      data: {
        totalMembers: baseline.totalMembers,
        activeMembers: baseline.activeMembers,
        totalHours: baseline.totalHours,
        verifiedEvents: baseline.verifiedEvents,
        E: baseline.E,
        H: baseline.H,
        Q: baseline.Q,
        V: baseline.V,
        S: baseline.S,
        C: baseline.C,
        G: baseline.G,
        dataQualityScore: 1.0,
      },
    });
    
    return snapshot;
  }
  
  return await prisma.organizationMetricSnapshot.findFirst({
    orderBy: { capturedAt: 'desc' },
  });
}

async function getEventTemplates(req: SuggestionRequest) {
  const where: any = {};
  
  // Filter by SDGs if specified
  if (req.focus.sdgs && req.focus.sdgs.length > 0) {
    where.sdgTags = {
      hasSome: req.focus.sdgs,
    };
  }
  
  // If band is specified but no SDGs, filter by band-appropriate SDGs
  if (req.focus.band && (!req.focus.sdgs || req.focus.sdgs.length === 0)) {
    let bandSDGs: string[] = [];
    switch (req.focus.band) {
      case 'E':
        bandSDGs = ['SDG6', 'SDG7', 'SDG11', 'SDG12', 'SDG13', 'SDG14', 'SDG15'];
        break;
      case 'S':
        bandSDGs = ['SDG1', 'SDG2', 'SDG3', 'SDG4', 'SDG5', 'SDG8', 'SDG10'];
        break;
      case 'G':
        bandSDGs = ['SDG16', 'SDG17'];
        break;
      case 'SEG_overall':
        // For overall, get all SDGs
        bandSDGs = ['SDG1', 'SDG2', 'SDG3', 'SDG4', 'SDG5', 'SDG6', 'SDG7', 'SDG8', 'SDG10', 'SDG11', 'SDG12', 'SDG13', 'SDG14', 'SDG15', 'SDG16', 'SDG17'];
        break;
    }
    
    if (bandSDGs.length > 0) {
      where.sdgTags = {
        hasSome: bandSDGs,
      };
    }
  }
  
  return await prisma.eventTemplate.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

function filterTemplates(templates: any[], req: SuggestionRequest) {
  return templates.filter(template => {
    // Check risk level
    if (req.constraints?.riskAllowed && !req.constraints.riskAllowed.includes(template.riskLevel)) {
      return false;
    }
    
    // Check lead time (always allow for now, can be enhanced later)
    
    // Check weekends only constraint
    if (req.constraints?.weekendsOnly) {
      // For now, assume all templates can be scheduled on weekends
      // In a real implementation, you'd check template scheduling constraints
    }
    
    return true;
  });
}

function rankTemplates(templates: any[], req: SuggestionRequest, snapshot: any) {
  return templates.map(template => {
    let efficiency = 0;
    
    // Calculate efficiency based on focus band
    switch (req.focus.band) {
      case 'E':
        efficiency = template.impact_E_perParticipant + 
                   (template.impact_E_perHourPerParticipant * template.durationHoursDefault);
        // Boost if template has environmental SDGs
        if (template.sdgTags && template.sdgTags.some((sdg: string) => 
          ['SDG6', 'SDG7', 'SDG11', 'SDG12', 'SDG13', 'SDG14', 'SDG15'].includes(sdg))) {
          efficiency += 0.5;
        }
        break;
      case 'S':
        efficiency = template.impact_S_perParticipant + 
                   (template.impact_S_perHourPerParticipant * template.durationHoursDefault);
        // Boost if template has social SDGs
        if (template.sdgTags && template.sdgTags.some((sdg: string) => 
          ['SDG1', 'SDG2', 'SDG3', 'SDG4', 'SDG5', 'SDG8', 'SDG10'].includes(sdg))) {
          efficiency += 0.5;
        }
        break;
      case 'G':
        efficiency = template.gPolicyModifier;
        // Boost if template has governance SDGs
        if (template.sdgTags && template.sdgTags.some((sdg: string) => 
          ['SDG16', 'SDG17'].includes(sdg))) {
          efficiency += 0.5;
        }
        break;
      case 'SEG_overall':
      default:
        // Overall efficiency: sum of all components
        efficiency = (
          template.impact_E_perParticipant + template.impact_E_perHourPerParticipant * template.durationHoursDefault +
          template.impact_H_perParticipant + template.impact_H_perHourPerParticipant * template.durationHoursDefault +
          template.impact_Q_perParticipant + template.impact_Q_perHourPerParticipant * template.durationHoursDefault +
          template.impact_V_perParticipant + template.impact_V_perHourPerParticipant * template.durationHoursDefault +
          template.impact_S_perParticipant + template.impact_S_perHourPerParticipant * template.durationHoursDefault +
          template.impact_C_perParticipant + template.impact_C_perHourPerParticipant * template.durationHoursDefault
        );
        break;
    }
    
    return { ...template, efficiency };
  }).sort((a, b) => b.efficiency - a.efficiency);
}

function greedySelection(templates: any[], req: SuggestionRequest, snapshot: any) {
  const plan: SuggestedEvent[] = [];
  const usedTemplates = new Set<string>();
  const maxEvents = req.constraints?.maxEvents || 10;
  const budget = req.constraints?.budget || Infinity;
  
  let totalHours = 0;
  let totalParticipants = 0;
  let totalCost = 0;
  let totalOrgScoreDelta = 0;
  
  // Target values
  const targetHours = req.targets.hours || Infinity;
  const targetParticipants = req.targets.participants || Infinity;
  const targetOrgScoreDelta = req.targets.orgScoreDelta || Infinity;
  
  for (const template of templates) {
    if (plan.length >= maxEvents || usedTemplates.has(template.id)) {
      continue;
    }
    
    // Calculate optimal participants for this template
    const participants = Math.min(
      template.maxParticipants,
      Math.max(template.minParticipants, 50) // Default to 50 if no specific target
    );
    
    const durationHours = template.durationHoursDefault;
    const eventCost = participants * template.costPerParticipant;
    
    // Check budget constraint
    if (totalCost + eventCost > budget) {
      continue;
    }
    
    // Calculate predicted deltas
    const deltas = calculateEventDeltas(template, participants, durationHours);
    const eventHours = participants * durationHours;
    const eventOrgScoreDelta = computeOrgScore(
      deltas.E, deltas.H, deltas.Q, deltas.V, deltas.S, deltas.C, 
      snapshot.G + deltas.G
    ) - computeOrgScore(
      snapshot.E, snapshot.H, snapshot.Q, snapshot.V, snapshot.S, snapshot.C, snapshot.G
    );
    
    // Check if adding this event would exceed targets
    if (totalHours + eventHours > targetHours && targetHours !== Infinity) {
      continue;
    }
    if (totalParticipants + participants > targetParticipants && targetParticipants !== Infinity) {
      continue;
    }
    if (totalOrgScoreDelta + eventOrgScoreDelta > targetOrgScoreDelta && targetOrgScoreDelta !== Infinity) {
      continue;
    }
    
    // Add event to plan
    const suggestedEvent: SuggestedEvent = {
      templateId: template.id,
      name: template.name,
      sdgs: template.sdgTags,
      participants,
      durationHours,
      predictedDelta: {
        ...deltas,
        overall: eventOrgScoreDelta,
      },
    };
    
    plan.push(suggestedEvent);
    usedTemplates.add(template.id);
    
    // Update running totals
    totalHours += eventHours;
    totalParticipants += participants;
    totalCost += eventCost;
    totalOrgScoreDelta += eventOrgScoreDelta;
    
    // Check if we've met all targets
    if (totalHours >= targetHours && 
        totalParticipants >= targetParticipants && 
        totalOrgScoreDelta >= targetOrgScoreDelta) {
      break;
    }
  }
  
  return plan;
}

function calculateTotals(plan: SuggestedEvent[]) {
  return plan.reduce((totals, event) => ({
    hours: totals.hours + (event.participants * event.durationHours),
    participants: totals.participants + event.participants,
    cost: totals.cost + (event.participants * 25), // Estimated cost per participant
  }), { hours: 0, participants: 0, cost: 0 });
}

function calculatePredictedDelta(plan: SuggestedEvent[], snapshot: any) {
  const totalDelta = plan.reduce((delta, event) => ({
    E: delta.E + event.predictedDelta.E,
    H: delta.H + event.predictedDelta.H,
    Q: delta.Q + event.predictedDelta.Q,
    V: delta.V + event.predictedDelta.V,
    S: delta.S + event.predictedDelta.S,
    C: delta.C + event.predictedDelta.C,
    G: delta.G + event.predictedDelta.G,
  }), { E: 0, H: 0, Q: 0, V: 0, S: 0, C: 0, G: 0 });
  
  // Apply data quality score discount
  const dqs = snapshot.dataQualityScore || 1.0;
  const discountedDelta = {
    E: totalDelta.E * dqs,
    H: totalDelta.H * dqs,
    Q: totalDelta.Q * dqs,
    V: totalDelta.V * dqs,
    S: totalDelta.S * dqs,
    C: totalDelta.C * dqs,
    G: totalDelta.G * dqs,
  };
  
  const newG = snapshot.G + discountedDelta.G;
  const overall = computeOrgScore(
    snapshot.E + discountedDelta.E,
    snapshot.H + discountedDelta.H,
    snapshot.Q + discountedDelta.Q,
    snapshot.V + discountedDelta.V,
    snapshot.S + discountedDelta.S,
    snapshot.C + discountedDelta.C,
    newG
  ) - computeOrgScore(
    snapshot.E, snapshot.H, snapshot.Q, snapshot.V, snapshot.S, snapshot.C, snapshot.G
  );
  
  return {
    ...discountedDelta,
    overall,
  };
}

function getSDGsCovered(plan: SuggestedEvent[]) {
  const sdgs = new Set<string>();
  plan.forEach(event => {
    event.sdgs.forEach(sdg => sdgs.add(sdg));
  });
  return Array.from(sdgs);
}

function checkTargets(req: SuggestionRequest, totals: any, predictedDelta: any) {
  return {
    hours: req.targets.hours ? totals.hours >= req.targets.hours : undefined,
    participants: req.targets.participants ? totals.participants >= req.targets.participants : undefined,
    orgScoreDelta: req.targets.orgScoreDelta ? predictedDelta.overall >= req.targets.orgScoreDelta : undefined,
    deadline: true, // Deadline logic removed as requested
  };
}

function generateWarnings(req: SuggestionRequest, plan: SuggestedEvent[], totals: any, predictedDelta: any) {
  const warnings: string[] = [];
  
  // Check if targets are unreachable
  if (req.targets.hours && totals.hours < req.targets.hours) {
    warnings.push(`Target hours (${req.targets.hours}) not fully achievable. Plan provides ${totals.hours} hours.`);
  }
  
  if (req.targets.participants && totals.participants < req.targets.participants) {
    warnings.push(`Target participants (${req.targets.participants}) not fully achievable. Plan provides ${totals.participants} participants.`);
  }
  
  if (req.targets.orgScoreDelta && predictedDelta.overall < req.targets.orgScoreDelta) {
    warnings.push(`Target score delta (${req.targets.orgScoreDelta}) not fully achievable. Plan provides ${predictedDelta.overall.toFixed(2)} delta.`);
  }
  
  // Deadline logic removed as requested
  
  // Check data quality
  if (plan.length === 0) {
    warnings.push('No suitable events found. Consider relaxing constraints or expanding SDG focus.');
  }
  
  return warnings;
}

function createEmptyResult(req: SuggestionRequest): SuggestionResult {
  return {
    plan: [],
    totals: { hours: 0, participants: 0, cost: 0 },
    predictedDelta: { E: 0, H: 0, Q: 0, V: 0, S: 0, C: 0, G: 0, overall: 0 },
    sdgsCovered: [],
    meets: { deadline: true },
    warnings: ['No event templates available. Please add event templates first.'],
  };
}
