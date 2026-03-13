import type { ExpandedCQ } from '../../types/cq';
import type { OntologyConcept, OntologyRelation } from '../../types/ontology';
import type { Workflow } from '../../types/workflow';

export const CQ_GENERATION_V2_SYSTEM = `You are an expert ontology engineer specializing in Competency Questions (CQ) methodology.

Generate questions covering ALL of these 7 categories:
1. scoping: Domain boundaries and scope definition
2. foundational: Core entities, their attributes and definitions
3. relationship: Connections, dependencies between entities
4. process: Business processes, workflows, procedures
5. constraint: Rules, limitations, validation rules
6. temporal: Time-related aspects, lifecycle, state transitions
7. quality: Metrics, KPIs, quality measures, quantities

Each CQ should be specific and answerable by a well-designed ontology.`;

export function cqGenerationV2User(domain: string, count: number, language: string, dataSourceContext: string): string {
  return `Domain Description:
${domain}

${dataSourceContext ? `## Reference Data Sources\n${dataSourceContext}\n` : ''}

Generate exactly ${count} Competency Questions. Ensure broad coverage across all 7 categories.

Respond in ${language === 'zh' ? 'Chinese' : language === 'en' ? 'English' : 'the same language as the domain description'}.

Return JSON:
{
  "cqs": [
    {
      "text": "question text",
      "category": "scoping|foundational|relationship|process|constraint|temporal|quality",
      "importance": "high|medium|low",
      "relevanceScore": 0.95,
      "relatedConcepts": ["concept1", "concept2"],
      "dependsOnCQs": [],
      "expectedAnswerComplexity": "simple|moderate|complex"
    }
  ]
}`;
}

export const ONTOLOGY_EXTRACTION_V2_SYSTEM = `You are an expert ontology engineer. Extract a comprehensive ontology from the confirmed domain knowledge.

IMPORTANT v2 enhancements:
1. Extract 10-20 concepts (more than before)
2. Each concept MUST have at least 3 properties with FULL detail
3. Properties must include: name, description, dataType, isRequired, constraints, exampleValues (2+)
4. Supported data types: string, number, boolean, date, datetime, enum, reference, list, object, money, percentage, duration, geo
5. Use ALL 17 relationship types: is_a, has_a, part_of, depends_on, triggers, produces, consumes, associated_with, inherits_from, composed_of, aggregates, specializes, generalizes, precedes, follows, constrains, enables
6. Assign a confidence score (0-1) to each concept and relationship
7. Provide evidence/reasoning for each relationship`;

export function ontologyExtractionV2User(domain: string, expansions: ExpandedCQ[], dataSourceContext: string): string {
  return `Domain: ${domain}

${dataSourceContext ? `## Reference Data Sources\n${dataSourceContext}\n` : ''}

Confirmed knowledge from expanded CQs:
${expansions.map((e, i) => `
--- CQ ${i + 1}: ${e.originalText} ---
${e.expansion}
Concepts: ${e.extractedConcepts.join(', ')}
Relations: ${e.extractedRelations.join(', ')}
User notes: ${e.userNotes || 'none'}
`).join('\n')}

Extract a comprehensive ontology with 10-20 concepts. Each concept must have detailed properties.

Return JSON:
{
  "concepts": [
    {
      "name": "ConceptName",
      "description": "detailed description",
      "aliases": ["alternative names"],
      "ontologyLayer": "upper|domain|task|application",
      "confidence": 0.95,
      "properties": [
        {
          "name": "propertyName",
          "description": "what this property represents",
          "dataType": "string|number|boolean|date|datetime|enum|reference|list|object|money|percentage|duration|geo",
          "isRequired": true,
          "constraints": "e.g., 'max length 100', 'positive integer'",
          "exampleValues": ["example1", "example2"]
        }
      ]
    }
  ],
  "relations": [
    {
      "name": "relationship name",
      "description": "what this relationship represents",
      "sourceConcept": "ConceptA",
      "targetConcept": "ConceptB",
      "cardinality": "1:1|1:N|N:1|N:M",
      "relationType": "is_a|has_a|part_of|depends_on|triggers|produces|consumes|associated_with|inherits_from|composed_of|aggregates|specializes|generalizes|precedes|follows|constrains|enables",
      "confidence": 0.9,
      "evidence": "reasoning for this relationship",
      "inferenceType": "direct|indirect|inherited|composed"
    }
  ]
}`;
}

export const DEBATE_CHALLENGER_SYSTEM = `You are a critical ontology reviewer. Your role is to rigorously examine ontology extraction results and identify issues.

Your review should cover:
1. Missing Concepts: Important domain concepts not captured?
2. Incorrect Relationships: Any inaccurate or misleading relationships?
3. Incomplete Properties: Do concepts lack essential properties?
4. Layer Misassignment: Concepts assigned to the wrong ontology layer?
5. Naming Issues: Inconsistent names, duplicates, or unclear terms?
6. Structural Problems: Orphan concepts, circular hierarchies, or redundant paths?

For each issue, provide: target, issue description, severity, suggestion, and evidence.
Be thorough but fair.`;

export function debateChallengerUser(proposerResult: string, context: string): string {
  return `## Domain Context
${context}

## Proposer's Result
${proposerResult}

## Your Task
Review the ontology extraction result. Identify issues and provide structured feedback.

Return JSON:
{
  "agreements": ["Well-captured aspect 1 and why"],
  "challenges": [
    {
      "target": "specific concept or relationship",
      "issue": "clear description of the problem",
      "severity": "critical|major|minor",
      "suggestion": "concrete improvement suggestion",
      "evidence": "reasoning or evidence"
    }
  ],
  "additions": ["Missing concept/relationship that should be added"]
}`;
}

export const DEBATE_DEFENDER_SYSTEM = `You are an ontology engineer defending your work. For each challenge:
1. If valid: ACCEPT and modify your result
2. If partially valid: MODIFY with a compromise
3. If invalid: REJECT with clear reasoning

Be intellectually honest — the goal is the best possible ontology.`;

export function debateDefenderUser(originalResult: string, challenges: string, context: string): string {
  return `## Domain Context
${context}

## Your Original Result
${originalResult}

## Challenger's Feedback
${challenges}

## Your Task
Respond to each challenge and provide your updated result.

Return JSON:
{
  "responses": [
    {
      "challengeTarget": "the item challenged",
      "decision": "accept|reject|modify",
      "reasoning": "why",
      "modification": "if modify, what changed"
    }
  ],
  "updatedResult": {
    "concepts": [...],
    "relations": [...]
  }
}`;
}

export const DEBATE_JUDGE_SYSTEM = `You are a senior ontology engineer serving as final arbiter. Review the complete debate history, make final decisions on disputed items, and produce the definitive ontology result.

Prioritize domain accuracy over completeness — fewer correct items beats many questionable ones.`;

export function debateJudgeUser(debateHistory: string, context: string): string {
  return `## Domain Context
${context}

## Complete Debate History
${debateHistory}

## Your Task
Make final decisions on all disputed items and produce the definitive result.

Return JSON:
{
  "verdicts": [
    {
      "item": "concept or relationship name",
      "consensusType": "unanimous|debated|unresolved",
      "finalDecision": "what the final result should be",
      "reasoning": "why you decided this way",
      "confidence": 0.95
    }
  ],
  "finalResult": {
    "concepts": [...],
    "relations": [...]
  }
}`;
}

export const VALIDATION_GENERATION_SYSTEM = `You are an expert in ontology validation. Generate validation questions from the ontology to verify correctness with domain experts.

Generate 4 types of questions:
1. boolean: True/false about relationships
2. multiple_choice: Choose the best relationship description
3. ranking: Rank concepts by importance
4. open_ended: What's missing in workflows`;

export function validationGenerationUser(
  concepts: OntologyConcept[],
  relations: OntologyRelation[],
  workflows: Workflow[],
  maxQuestions: number,
  language: string,
): string {
  return `## Ontology to Validate
Concepts (${concepts.length}):
${concepts.map(c => `- ${c.name}: ${c.description}`).join('\n')}

Relations (${relations.length}):
${relations.map(r => `- ${r.name} (${r.sourceConceptId} → ${r.targetConceptId})`).join('\n')}

Workflows (${workflows.length}):
${workflows.map(w => `- ${w.name}: ${w.steps.map(s => s.name).join(' → ')}`).join('\n')}

Generate up to ${maxQuestions} validation questions in ${language === 'zh' ? 'Chinese' : 'English'}.

Return JSON:
{
  "questions": [
    {
      "questionType": "boolean|multiple_choice|ranking|open_ended",
      "text": "question text",
      "context": "optional context",
      "difficulty": "easy|medium|hard",
      "domains": ["domain tags"],
      "options": [{"id": "a", "text": "option text"}],
      "rankingItems": [{"id": "1", "text": "item text"}]
    }
  ]
}`;
}
