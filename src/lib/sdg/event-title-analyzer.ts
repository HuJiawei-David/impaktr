/**
 * Event Title Analyzer
 * Analyzes event titles to recommend relevant SDGs
 */

import { SDG_DATA, getSDGKeywords } from './sdg-keywords';

export interface KeywordMatch {
  keyword: string;
  type: 'primary' | 'secondary' | 'activity';
  position: number;
}

export interface SDGMatch {
  sdgNumber: number;
  score: number;
  confidence: number;
  matches: KeywordMatch[];
  reasoning: string;
}

/**
 * Normalize text for analysis
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract words and phrases from text
 */
function extractPhrases(text: string): string[] {
  const normalized = normalizeText(text);
  const words = normalized.split(' ');
  const phrases: string[] = [];

  // Single words
  phrases.push(...words);

  // Two-word phrases
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(`${words[i]} ${words[i + 1]}`);
  }

  // Three-word phrases
  for (let i = 0; i < words.length - 2; i++) {
    phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }

  return phrases;
}

/**
 * Calculate keyword match score
 */
function calculateKeywordScore(
  keyword: string,
  phrase: string,
  type: 'primary' | 'secondary' | 'activity'
): number {
  const exactMatch = phrase === keyword;
  const containsMatch = phrase.includes(keyword) || keyword.includes(phrase);
  const wordsMatch = phrase.split(' ').some(word => keyword.split(' ').includes(word));

  let baseScore = 0;
  if (exactMatch) {
    baseScore = 1.0;
  } else if (containsMatch) {
    baseScore = 0.7;
  } else if (wordsMatch) {
    baseScore = 0.4;
  }

  // Weight by keyword type
  const typeWeights = {
    primary: 1.0,
    secondary: 0.7,
    activity: 0.9
  };

  return baseScore * typeWeights[type];
}

/**
 * Detect activity patterns in title
 */
function detectActivityPatterns(title: string): { sdgs: number[]; reasoning: string[] } {
  const normalized = normalizeText(title);
  const detectedSDGs: Set<number> = new Set();
  const reasoning: string[] = [];

  // Activity verbs and their associated SDGs
  const activityPatterns: Array<{ pattern: RegExp; sdgs: number[]; reason: string }> = [
    // SDG 1: No Poverty
    {
      pattern: /\b(poverty|poor|fundrais|donat|charit|relief|support|aid)\b.*\b(alleviat|reduc|fight|help|assist|relief)\b/i,
      sdgs: [1],
      reason: 'Poverty alleviation activity detected'
    },
    {
      pattern: /\b(homeless|shelter|food bank|welfare|financial)\b.*\b(support|assistance|program|drive)\b/i,
      sdgs: [1],
      reason: 'Support for disadvantaged groups detected'
    },
    
    // SDG 2: Zero Hunger
    {
      pattern: /\b(food|meal|hunger|feeding|nutrition)\b.*\b(drive|donation|distribution|bank|kitchen|program)\b/i,
      sdgs: [2],
      reason: 'Food-related charity activity detected'
    },
    {
      pattern: /\b(garden|farm|agricult|plant|grow|harvest)\b.*\b(community|urban|vegetables|crops)\b/i,
      sdgs: [2],
      reason: 'Agricultural/gardening activity detected'
    },
    
    // SDG 3: Good Health
    {
      pattern: /\b(health|medical|wellness|fitness|mental)\b.*\b(camp|screening|checkup|program|fair|workshop)\b/i,
      sdgs: [3],
      reason: 'Health program activity detected'
    },
    {
      pattern: /\b(blood|donat|vaccin|immuniz|first aid|CPR)\b/i,
      sdgs: [3],
      reason: 'Healthcare activity detected'
    },
    {
      pattern: /\b(yoga|meditation|stress|mindfulness|exercise|fitness)\b/i,
      sdgs: [3],
      reason: 'Wellness activity detected'
    },
    
    // SDG 4: Quality Education
    {
      pattern: /\b(teach|tutor|mentor|educat|training|workshop|learn|school|literacy)\b/i,
      sdgs: [4],
      reason: 'Educational activity detected'
    },
    {
      pattern: /\b(STEM|coding|programming|math|science|reading|writing)\b.*\b(workshop|class|program|bootcamp)\b/i,
      sdgs: [4],
      reason: 'Educational workshop detected'
    },
    {
      pattern: /\b(coder|coding|programming|developer|software|computer|tech|IT|digital)\b/i,
      sdgs: [4, 9],
      reason: 'Programming/technology activity detected'
    },
    
    // SDG 5: Gender Equality
    {
      pattern: /\b(women|girls|gender|female)\b.*\b(empower|equality|rights|leadership|support)\b/i,
      sdgs: [5],
      reason: 'Gender equality focus detected'
    },
    {
      pattern: /\b(women|girls)\b.*\b(education|mentorship|entrepreneurship|training)\b/i,
      sdgs: [5],
      reason: 'Women/girls empowerment program detected'
    },
    
    // SDG 6: Clean Water and Sanitation
    {
      pattern: /\b(water|sanitation|hygiene|WASH|toilet|well)\b.*\b(clean|access|improve|build|install|project)\b/i,
      sdgs: [6],
      reason: 'Water/sanitation project detected'
    },
    {
      pattern: /\b(river|stream|lake|water)\b.*\b(clean|cleanup|restoration|protection)\b/i,
      sdgs: [6],
      reason: 'Water body cleanup detected'
    },
    
    // SDG 7: Clean Energy
    {
      pattern: /\b(solar|renewable|wind|energy|clean energy)\b.*\b(install|project|initiative|workshop|training)\b/i,
      sdgs: [7],
      reason: 'Clean energy project detected'
    },
    {
      pattern: /\b(LED|energy saving|energy efficiency|power)\b/i,
      sdgs: [7],
      reason: 'Energy efficiency activity detected'
    },
    
    // SDG 8: Decent Work
    {
      pattern: /\b(job|career|employment|work|skill|vocational)\b.*\b(training|workshop|fair|counseling|development)\b/i,
      sdgs: [8],
      reason: 'Job training/employment activity detected'
    },
    {
      pattern: /\b(entrepreneurship|business|startup|enterprise)\b.*\b(training|mentorship|program|support)\b/i,
      sdgs: [8],
      reason: 'Entrepreneurship program detected'
    },
    
    // SDG 9: Innovation and Infrastructure
    {
      pattern: /\b(tech|technology|digital|coding|programming|innovation|AI|data)\b.*\b(workshop|bootcamp|training|hackathon)\b/i,
      sdgs: [9],
      reason: 'Technology/innovation activity detected'
    },
    {
      pattern: /\b(infrastructure|construction|engineering|development)\b.*\b(project|initiative|program)\b/i,
      sdgs: [9],
      reason: 'Infrastructure development detected'
    },
    {
      pattern: /\b(coder|programming|software|developer|tech|IT|digital|innovation|AI|machine learning)\b/i,
      sdgs: [9],
      reason: 'Technology innovation activity detected'
    },
    
    // SDG 10: Reduced Inequalities
    {
      pattern: /\b(inclusion|diversity|equality|accessibility|disability|refugee|immigrant|minority)\b.*\b(program|support|workshop|awareness)\b/i,
      sdgs: [10],
      reason: 'Inclusion/diversity program detected'
    },
    {
      pattern: /\b(discrimination|inequality|marginalized|vulnerable)\b.*\b(fight|reduce|combat|address|support)\b/i,
      sdgs: [10],
      reason: 'Anti-discrimination activity detected'
    },
    
    // SDG 11: Sustainable Cities
    {
      pattern: /\b(community|neighborhood|city|urban|street|park)\b.*\b(clean|cleanup|beautification|improvement|restoration)\b/i,
      sdgs: [11],
      reason: 'Community improvement activity detected'
    },
    {
      pattern: /\b(cycling|bike|pedestrian|public space|green space|urban garden)\b.*\b(campaign|initiative|project|program)\b/i,
      sdgs: [11],
      reason: 'Sustainable urban activity detected'
    },
    
    // SDG 12: Responsible Consumption
    {
      pattern: /\b(recycle|recycling|waste|compost|upcycle|zero waste)\b.*\b(program|drive|workshop|campaign)\b/i,
      sdgs: [12],
      reason: 'Recycling/waste management activity detected'
    },
    {
      pattern: /\b(plastic|single-use|reusable|sustainable)\b.*\b(free|reduction|alternative|swap)\b/i,
      sdgs: [12],
      reason: 'Sustainable consumption activity detected'
    },
    
    // SDG 13: Climate Action
    {
      pattern: /\b(climate|carbon|emission|greenhouse)\b.*\b(action|reduction|awareness|campaign|mitigation)\b/i,
      sdgs: [13],
      reason: 'Climate action activity detected'
    },
    {
      pattern: /\b(tree|forest|reforest|afforest)\b.*\b(plant|planting|restoration|conservation)\b/i,
      sdgs: [13, 15],
      reason: 'Tree planting/reforestation activity detected'
    },
    
    // SDG 14: Life Below Water
    {
      pattern: /\b(beach|ocean|sea|coastal|marine)\b.*\b(clean|cleanup|conservation|protection|restoration)\b/i,
      sdgs: [14],
      reason: 'Ocean/coastal cleanup activity detected'
    },
    {
      pattern: /\b(coral|reef|mangrove|marine life|turtle|whale)\b.*\b(restoration|conservation|protection|monitoring)\b/i,
      sdgs: [14],
      reason: 'Marine conservation activity detected'
    },
    
    // SDG 15: Life on Land
    {
      pattern: /\b(wildlife|biodiversity|nature|forest|habitat)\b.*\b(conservation|protection|restoration|monitoring)\b/i,
      sdgs: [15],
      reason: 'Wildlife/nature conservation detected'
    },
    {
      pattern: /\b(bird|animal|species|ecosystem)\b.*\b(watching|monitoring|survey|protection|rescue)\b/i,
      sdgs: [15],
      reason: 'Wildlife activity detected'
    },
    
    // SDG 16: Peace and Justice
    {
      pattern: /\b(peace|justice|rights|legal|law|governance)\b.*\b(building|education|awareness|aid|advocacy)\b/i,
      sdgs: [16],
      reason: 'Peace/justice activity detected'
    },
    {
      pattern: /\b(human rights|civic|democracy|voting|election)\b.*\b(education|awareness|campaign|training)\b/i,
      sdgs: [16],
      reason: 'Civic engagement activity detected'
    },
    
    // SDG 17: Partnerships
    {
      pattern: /\b(partnership|collaboration|network|coalition|alliance)\b.*\b(building|forum|event|workshop|summit)\b/i,
      sdgs: [17],
      reason: 'Partnership building activity detected'
    },
    {
      pattern: /\b(SDG|sustainable development|capacity building|knowledge sharing)\b.*\b(workshop|conference|forum|initiative)\b/i,
      sdgs: [17],
      reason: 'SDG partnership activity detected'
    }
  ];

  for (const pattern of activityPatterns) {
    if (pattern.pattern.test(normalized)) {
      pattern.sdgs.forEach(sdg => detectedSDGs.add(sdg));
      reasoning.push(pattern.reason);
    }
  }

  return {
    sdgs: Array.from(detectedSDGs),
    reasoning
  };
}

/**
 * Analyze event title and description to return SDG matches
 */
export function analyzeEventTitle(title: string, description?: string): SDGMatch[] {
  if (!title || title.trim().length === 0) {
    return [];
  }

  // Combine title and description for analysis
  const fullText = description ? `${title} ${description}` : title;
  const phrases = extractPhrases(fullText);
  const sdgScores = new Map<number, { score: number; matches: KeywordMatch[] }>();

  // Keyword matching
  for (const [sdgNum, sdgData] of Object.entries(SDG_DATA)) {
    const sdgNumber = Number(sdgNum);
    let totalScore = 0;
    const matches: KeywordMatch[] = [];

    // Check primary keywords
    for (const keyword of sdgData.keywords.primary) {
      for (let i = 0; i < phrases.length; i++) {
        const phrase = phrases[i];
        const score = calculateKeywordScore(keyword, phrase, 'primary');
        
        if (score > 0) {
          totalScore += score;
          matches.push({
            keyword,
            type: 'primary',
            position: fullText.toLowerCase().indexOf(phrase)
          });
        }
      }
    }

    // Check secondary keywords
    for (const keyword of sdgData.keywords.secondary) {
      for (const phrase of phrases) {
        const score = calculateKeywordScore(keyword, phrase, 'secondary');
        
        if (score > 0) {
          totalScore += score * 0.7;
          matches.push({
            keyword,
            type: 'secondary',
            position: fullText.toLowerCase().indexOf(phrase)
          });
        }
      }
    }

    // Check activity keywords
    for (const keyword of sdgData.keywords.activities) {
      for (const phrase of phrases) {
        const score = calculateKeywordScore(keyword, phrase, 'activity');
        
        if (score > 0) {
          totalScore += score * 0.9;
          matches.push({
            keyword,
            type: 'activity',
            position: fullText.toLowerCase().indexOf(phrase)
          });
        }
      }
    }

    if (totalScore > 0) {
      sdgScores.set(sdgNumber, { score: totalScore, matches });
    }
  }

  // Activity pattern detection on full text
  const { sdgs: patternSDGs, reasoning: patternReasons } = detectActivityPatterns(fullText);
  for (const sdgNum of patternSDGs) {
    const existing = sdgScores.get(sdgNum);
    if (existing) {
      existing.score += 0.5; // Boost score for pattern match
    } else {
      sdgScores.set(sdgNum, {
        score: 0.5,
        matches: [{
          keyword: 'activity pattern',
          type: 'activity',
          position: 0
        }]
      });
    }
  }

  // Convert to SDGMatch array
  const results: SDGMatch[] = [];
  
  for (const [sdgNumber, data] of sdgScores.entries()) {
    // Calculate confidence (0-1 scale)
    const normalizedScore = Math.min(data.score / 3, 1); // Normalize to 0-1
    const confidence = normalizedScore;

    // Generate reasoning
    const matchTypes = {
      primary: data.matches.filter(m => m.type === 'primary').length,
      secondary: data.matches.filter(m => m.type === 'secondary').length,
      activity: data.matches.filter(m => m.type === 'activity').length
    };

    let reasoning = '';
    const reasonParts: string[] = [];

    if (matchTypes.primary > 0) {
      reasonParts.push(`${matchTypes.primary} primary keyword${matchTypes.primary > 1 ? 's' : ''} matched`);
    }
    if (matchTypes.secondary > 0) {
      reasonParts.push(`${matchTypes.secondary} secondary keyword${matchTypes.secondary > 1 ? 's' : ''} matched`);
    }
    if (matchTypes.activity > 0) {
      reasonParts.push(`${matchTypes.activity} activity keyword${matchTypes.activity > 1 ? 's' : ''} matched`);
    }

    reasoning = reasonParts.join(', ');

    // Add pattern reasoning if available
    const patternIndex = patternSDGs.indexOf(sdgNumber);
    if (patternIndex !== -1 && patternReasons[patternIndex]) {
      reasoning += `. ${patternReasons[patternIndex]}`;
    }

    // Add description context if available
    if (description && description.trim().length > 0) {
      reasoning += '. Analysis includes event description for better context';
    }

    results.push({
      sdgNumber,
      score: data.score,
      confidence,
      matches: data.matches.slice(0, 5), // Limit to top 5 matches
      reasoning
    });
  }

  // Sort by score (descending)
  results.sort((a, b) => b.score - a.score);

  return results;
}

/**
 * Get top N SDG recommendations from analysis
 */
export function getTopRecommendations(
  matches: SDGMatch[],
  minConfidence: number = 0.3,
  maxResults: number = 5
): SDGMatch[] {
  return matches
    .filter(match => match.confidence >= minConfidence)
    .slice(0, maxResults);
}

/**
 * Analyze multiple titles and aggregate results
 */
export function analyzeBatch(titles: string[]): Map<number, SDGMatch> {
  const aggregated = new Map<number, SDGMatch>();

  for (const title of titles) {
    const matches = analyzeEventTitle(title);
    
    for (const match of matches) {
      const existing = aggregated.get(match.sdgNumber);
      
      if (!existing) {
        aggregated.set(match.sdgNumber, { ...match });
      } else {
        // Average the scores and confidence
        existing.score = (existing.score + match.score) / 2;
        existing.confidence = (existing.confidence + match.confidence) / 2;
        existing.matches.push(...match.matches);
      }
    }
  }

  return aggregated;
}

