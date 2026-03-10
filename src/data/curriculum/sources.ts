import type { ContentSource } from "./types";

export const CONTENT_SOURCES: ContentSource[] = [
  {
    id: "dsd-spec-2025",
    title: "T Level Technical Qualification in Digital Software Development Specification",
    kind: "specification",
    classification: "primary",
    filePath: "docs/raw/spec/digital-dsd-specification.pdf",
    year: 2025,
    notes:
      "Canonical curriculum source for Digital Software Development. Content area structure and scope should be taken from here first.",
  },
  {
    id: "dsd-spec-2025-copy",
    title: "Digital Software Development Specification Copy",
    kind: "specification",
    classification: "duplicate",
    filePath: "docs/raw/exams/digital-dsd-specification-1.pdf",
    year: 2025,
    duplicateOfId: "dsd-spec-2025",
    notes:
      "Duplicate copy of the 2025 Digital Software Development specification kept in the exams folder.",
  },
  {
    id: "dpdd-core-book-2023",
    title: "Digital Production, Design and Development T Level: Core",
    kind: "textbook",
    classification: "legacy",
    filePath: "docs/raw/core-book/Digital Production, Design and Development T Level_ Core.pdf",
    year: 2023,
    caution:
      "This is aligned to the older Digital Production, Design and Development core structure, not the 2025 DSD occupational specification.",
    notes:
      "Useful for legacy numbered topic detail, terminology, explanations, and practice prompts where it aligns conceptually with the current app topics.",
  },
  {
    id: "paper1-q-and-a",
    title: "Paper 1 Q and A",
    kind: "question-bank",
    classification: "legacy",
    filePath: "docs/raw/exams/Paper 1 Q and A.pdf",
    notes:
      "Compiled question bank aligned to older core topics such as variables, validation, decomposition, abstraction, flowcharts, and sorting/searching.",
    caution:
      "Use as an enrichment source for practice coverage and common question patterns, not as the canonical curriculum structure.",
  },
  {
    id: "core-paper2-autumn-2022",
    title: "Core Paper 2 Autumn 2022",
    kind: "past-paper",
    classification: "legacy",
    filePath: "docs/raw/exams/core-paper-2- autumn-22.pdf",
    year: 2022,
    notes:
      "Older Digital Production, Design and Development paper covering business context, data, digital environments, and security.",
    caution:
      "Question coverage is valuable, but topic naming and scope must be mapped carefully to the 2025 DSD structure.",
  },
  {
    id: "core-paper2-november-2021",
    title: "Core Paper 2 November 2021",
    kind: "past-paper",
    classification: "legacy",
    filePath: "docs/raw/exams/core-paper-2- november 21.pdf",
    year: 2021,
    notes:
      "Legacy paper used for exam-style phrasing and topic coverage patterns.",
    caution:
      "Keep as enrichment only because it follows the older DPDD core assessment model.",
  },
  {
    id: "paper2-2023",
    title: "Paper 2 2023",
    kind: "past-paper",
    classification: "legacy",
    filePath: "docs/raw/exams/Paper 2 2023.pdf",
    year: 2023,
    notes:
      "Recent legacy paper with strong usable prompts around UI design, security, change, and virtual environments.",
    caution:
      "Still maps to the older core exam rather than the 2025 DSD occupational content areas.",
  },
  {
    id: "mark-scheme-autumn-2022",
    title: "Core Paper 2 Mark Scheme Autumn 2022",
    kind: "mark-scheme",
    classification: "legacy",
    filePath: "docs/raw/exams/core-paper-2-mark-scheme-autumn-2022.pdf",
    year: 2022,
    notes:
      "Useful source for concept targets, accepted answers, and evaluation patterns that can support answer-checking heuristics.",
    caution:
      "Mark-scheme concepts should enrich mappings and scoring logic, not override the canonical DSD structure.",
  },
  {
    id: "mark-scheme-summer-2022",
    title: "Mark Scheme Summer 2022",
    kind: "mark-scheme",
    classification: "legacy",
    filePath: "docs/raw/exams/mark scheme - summer 22.pdf",
    year: 2022,
    notes:
      "Additional legacy mark-scheme coverage for data, business, and security answer expectations.",
    caution:
      "Use carefully because the exam belongs to the older core model.",
  },
  {
    id: "mark-scheme-autumn-2021",
    title: "Paper 2 Mark Scheme Autumn 2021",
    kind: "mark-scheme",
    classification: "legacy",
    filePath: "docs/raw/exams/paper 2 mark scheme - autumn 21.pdf",
    year: 2021,
    notes:
      "Extra evidence for recurring concept targets and common explanation patterns in legacy paper 2 responses.",
    caution:
      "Should be used for concept enrichment only.",
  },
];
