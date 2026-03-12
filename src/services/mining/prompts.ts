import type { CompetencyQuestion, ExpandedCQ } from '../../types/cq';
import type { OntologyConcept, OntologyRelation } from '../../types/ontology';
import type { Workflow } from '../../types/workflow';

export const CQ_GENERATION_SYSTEM = `You are an expert ontology engineer specializing in Competency Questions (CQ) methodology. Your task is to generate Competency Questions that will drive ontology construction for a given domain.

Each CQ should:
1. Be answerable by the ontology being built
2. Help identify core concepts, relationships, and constraints
3. Cover different aspects: scope, foundation, relationships, processes, constraints

Categorize each CQ as one of:
- scoping: Defines boundaries of the domain
- foundational: Identifies core entities and their attributes
- relationship: Discovers connections between entities
- process: Uncovers business processes and workflows
- constraint: Reveals rules and limitations`;

export function cqGenerationUser(domain: string, count: number, language: string): string {
  return `Domain Description:
${domain}

Generate exactly ${count} Competency Questions for building an ontology of this domain.

Respond in ${language === 'zh' ? 'Chinese' : language === 'en' ? 'English' : 'the same language as the domain description'}.

Return JSON:
{
  "cqs": [
    {
      "text": "question text",
      "category": "scoping|foundational|relationship|process|constraint",
      "importance": "high|medium|low",
      "relatedConcepts": ["concept1", "concept2"]
    }
  ]
}`;
}

export const CQ_EXPANSION_SYSTEM = `You are an expert knowledge engineer. Your task is to expand Competency Questions into detailed domain knowledge that can be used to extract ontology elements.

For each CQ, provide:
1. A detailed expansion (200-500 words) explaining the domain knowledge needed to answer it
2. 3-5 sub-questions that break down the main question
3. Key concepts (nouns) that should become ontology classes
4. Key relationships (verbs/prepositions) between concepts`;

export function cqExpansionUser(domain: string, cqs: CompetencyQuestion[]): string {
  return `Domain: ${domain}

Competency Questions to expand:
${cqs.map((cq, i) => `${i + 1}. [${cq.category}] ${cq.text}`).join('\n')}

For each CQ, respond in JSON:
{
  "expansions": [
    {
      "cqIndex": 0,
      "expansion": "detailed expansion text...",
      "subQuestions": ["sub-q1", "sub-q2"],
      "extractedConcepts": ["Concept1", "Concept2"],
      "extractedRelations": ["Concept1 --contains--> Concept2"]
    }
  ]
}`;
}

export const ONTOLOGY_EXTRACTION_SYSTEM = `You are an expert ontology engineer. Extract a top-level ontology from the confirmed domain knowledge.

Follow these principles:
1. Identify distinct concepts (classes) - avoid duplicates and synonyms
2. Assign each concept to an ontology layer:
   - upper: Very general concepts (Agent, Event, Process, Location, Resource)
   - domain: Domain-specific concepts (the core entities of this particular domain)
3. Define properties for each concept (name, type, description)
4. Identify relationships between concepts with cardinality
5. Keep the top-level ontology to 8-20 concepts

Use Palantir Foundry's Ontology principles:
- Each concept = Object Type (with properties)
- Each relationship = Link Type (with cardinality)`;

export function ontologyExtractionUser(domain: string, expansions: ExpandedCQ[]): string {
  return `Domain: ${domain}

Confirmed knowledge from expanded CQs:
${expansions.map((e, i) => `
--- CQ ${i + 1}: ${e.originalText} ---
${e.expansion}
Concepts: ${e.extractedConcepts.join(', ')}
Relations: ${e.extractedRelations.join(', ')}
User notes: ${e.userNotes || 'none'}
`).join('\n')}

Extract the top-level ontology. Return JSON:
{
  "concepts": [
    {
      "name": "ConceptName",
      "description": "what this concept represents",
      "aliases": ["alternative names"],
      "ontologyLayer": "upper|domain",
      "properties": [
        { "name": "propName", "description": "desc", "dataType": "string|number|boolean|date|datetime|enum|reference|list|object", "isRequired": true, "exampleValues": ["example"] }
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
      "relationType": "is_a|has_a|part_of|depends_on|triggers|produces|consumes|associated_with|custom"
    }
  ]
}`;
}

export const ONTOLOGY_DRILL_DOWN_SYSTEM = `You are an expert ontology engineer performing iterative ontology refinement.

Given a parent concept and its context, generate:
1. Sub-concepts (more specific types or components)
2. Additional properties for the parent concept
3. Relationships between the new sub-concepts and existing concepts

Guidelines:
- Each sub-concept should be meaningfully distinct
- If fewer than 2 sub-concepts make sense, suggest stopping the drill-down
- Assign sub-concepts to appropriate ontology layers (domain/task/application)`;

export function ontologyDrillDownUser(
  concept: OntologyConcept,
  existingConcepts: OntologyConcept[],
  domain: string,
  depth: number,
): string {
  return `Domain: ${domain}
Current depth: ${depth}

Concept to drill down into:
- Name: ${concept.name}
- Description: ${concept.description}
- Layer: ${concept.ontologyLayer}
- Current properties: ${concept.properties.map(p => p.name).join(', ')}

Existing concepts in the ontology:
${existingConcepts.map(c => `- ${c.name} (${c.ontologyLayer})`).join('\n')}

Generate sub-concepts and relationships. Return JSON:
{
  "shouldContinue": true,
  "stopReason": null,
  "subConcepts": [
    { "name": "Name", "description": "...", "ontologyLayer": "domain|task|application", "properties": [...] }
  ],
  "newRelations": [
    { "name": "relation", "sourceConcept": "...", "targetConcept": "...", "cardinality": "...", "relationType": "..." }
  ],
  "additionalParentProperties": [
    { "name": "prop", "description": "...", "dataType": "...", "isRequired": false }
  ]
}`;
}

export const WORKFLOW_EXTRACTION_SYSTEM = `You are a business process analyst. Given an ontology of concepts and relationships, identify the key business workflows in this domain.

For each workflow:
1. Name it clearly
2. List steps in order
3. For each step, identify: actor (who), inputs, outputs, conditions
4. Map steps to ontology concepts`;

export function workflowExtractionUser(
  domain: string,
  concepts: OntologyConcept[],
  relations: OntologyRelation[],
): string {
  return `Domain: ${domain}

Ontology concepts:
${concepts.map(c => `- ${c.name}: ${c.description} [${c.ontologyLayer}]`).join('\n')}

Relationships:
${relations.map(r => `- ${r.name}: ${r.sourceConceptId} → ${r.targetConceptId} (${r.cardinality})`).join('\n')}

Identify business workflows. Return JSON:
{
  "workflows": [
    {
      "name": "Workflow Name",
      "description": "...",
      "steps": [
        { "name": "Step", "description": "...", "order": 1, "actorConcept": "ConceptName", "inputConcepts": ["C1"], "outputConcepts": ["C2"], "conditions": "...", "rules": "..." }
      ],
      "involvedConcepts": ["C1", "C2"]
    }
  ]
}`;
}

export const RELATION_INFERENCE_SYSTEM = `You are an ontology relationship analyst. Given an ontology and its workflows, infer additional relationships that haven't been explicitly stated but can be derived from the workflow analysis.

Focus on:
1. Data flow relationships
2. Dependency relationships
3. Temporal relationships
4. Aggregation relationships

For each inferred relationship, explain WHY it should exist.`;

export function relationInferenceUser(
  concepts: OntologyConcept[],
  existingRelations: OntologyRelation[],
  workflows: Workflow[],
): string {
  return `Concepts:
${concepts.map(c => `- ${c.name}: ${c.description}`).join('\n')}

Existing relationships:
${existingRelations.map(r => `- ${r.name}: ${r.sourceConceptId} → ${r.targetConceptId} (${r.cardinality})`).join('\n')}

Workflows:
${workflows.map(w => `
${w.name}:
${w.steps.map(s => `  ${s.order}. ${s.name} [actor: ${s.actorConceptId || 'system'}]`).join('\n')}
`).join('\n')}

Infer additional relationships. Return JSON:
{
  "inferredRelations": [
    { "name": "relation", "sourceConcept": "...", "targetConcept": "...", "cardinality": "...", "relationType": "...", "reasoning": "why" }
  ]
}`;
}

export const COMPLETENESS_CHECK_SYSTEM = `You are an ontology quality auditor. Review the ontology for completeness and consistency issues.`;

export function completenessCheckUser(
  concepts: OntologyConcept[],
  relations: OntologyRelation[],
  workflows: Workflow[],
): string {
  return `Review this ontology:

Concepts (${concepts.length}):
${concepts.map(c => `- ${c.name} (${c.ontologyLayer}, ${c.properties.length} props, depth ${c.depth})`).join('\n')}

Relations (${relations.length}):
${relations.map(r => `- ${r.name}: ${r.sourceConceptId} → ${r.targetConceptId}`).join('\n')}

Workflows (${workflows.length}):
${workflows.map(w => `- ${w.name}: ${w.steps.length} steps`).join('\n')}

Identify issues:
{
  "issues": [
    { "type": "orphan_concept|missing_property|missing_relation|inconsistency|incomplete_workflow", "severity": "high|medium|low", "description": "what's wrong", "suggestion": "how to fix", "affectedElements": ["names"] }
  ]
}`;
}
