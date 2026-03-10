import type { GlossaryTerm } from "./types";

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: "term-sdlc",
    term: "Software development lifecycle",
    aliases: ["SDLC"],
    definition:
      "A structured sequence of stages used to research, plan, design, build, test, deploy, and maintain software.",
    curriculumPointIds: ["dsd-1.1"],
    legacyTopicIds: ["problem-solving", "business", "intro-programming"],
  },
  {
    id: "term-acceptance-criteria",
    term: "Acceptance criteria",
    definition:
      "Specific conditions a solution must meet before a user or client can accept it as fit for purpose.",
    curriculumPointIds: ["dsd-1.1", "dsd-1.4"],
    legacyTopicIds: ["problem-solving", "business"],
  },
  {
    id: "term-agile",
    term: "Agile",
    definition:
      "An iterative development approach that delivers value in increments and adapts requirements over time.",
    curriculumPointIds: ["dsd-1.3"],
    legacyTopicIds: ["business", "problem-solving"],
  },
  {
    id: "term-secure-by-design",
    term: "Secure by design",
    definition:
      "Designing a solution so security requirements are built in early rather than patched on later.",
    curriculumPointIds: ["dsd-1.4", "dsd-2.2"],
    legacyTopicIds: ["security", "legislation"],
  },
  {
    id: "term-kpi",
    term: "KPI",
    aliases: ["key performance indicator"],
    definition:
      "A measurable indicator used to judge how well a solution is meeting performance or business goals.",
    curriculumPointIds: ["dsd-1.1", "dsd-1.4"],
    legacyTopicIds: ["business"],
  },
  {
    id: "term-triangulation",
    term: "Triangulation",
    definition:
      "Checking information against multiple sources to improve confidence that it is reliable.",
    curriculumPointIds: ["dsd-3.1"],
    legacyTopicIds: ["business", "data"],
  },
  {
    id: "term-wireframe",
    term: "Wireframe",
    definition:
      "A simplified design representation that shows layout, structure, and user flow before full visual build.",
    curriculumPointIds: ["dsd-4.3"],
    legacyTopicIds: ["business", "intro-programming"],
  },
  {
    id: "term-erd",
    term: "Entity relationship diagram",
    aliases: ["ERD"],
    definition:
      "A data-model diagram used to show entities, attributes, and relationships in a database design.",
    curriculumPointIds: ["dsd-1.1", "dsd-4.1", "dsd-4.3"],
    legacyTopicIds: ["data"],
  },
  {
    id: "term-version-control",
    term: "Version control",
    definition:
      "A system for tracking changes to code and coordinating development work across versions and contributors.",
    curriculumPointIds: ["dsd-1.1", "dsd-4.2", "dsd-5.2", "dsd-6.1"],
    legacyTopicIds: ["intro-programming", "business"],
  },
  {
    id: "term-api",
    term: "API",
    aliases: ["application programming interface"],
    definition:
      "A defined interface that allows software systems to request or exchange data and functionality.",
    curriculumPointIds: ["dsd-6.1", "dsd-6.3"],
    legacyTopicIds: ["data", "digital-environments", "intro-programming"],
  },
  {
    id: "term-cicd",
    term: "CI/CD",
    definition:
      "Continuous integration and continuous deployment: a pipeline approach for building, testing, and releasing software changes regularly.",
    curriculumPointIds: ["dsd-6.1"],
    legacyTopicIds: ["intro-programming", "business"],
  },
  {
    id: "term-accessibility",
    term: "Accessibility",
    definition:
      "Designing software so a wide range of users can perceive, navigate, and use it effectively.",
    curriculumPointIds: ["dsd-1.4", "dsd-4.3", "dsd-6.2"],
    legacyTopicIds: ["emerging-issues", "business", "legislation"],
  },
  {
    id: "term-vulnerability-scanning",
    term: "Vulnerability scanning",
    definition:
      "A security testing activity that checks a system for known weaknesses that could be exploited.",
    curriculumPointIds: ["dsd-7.1"],
    legacyTopicIds: ["security"],
  },
  {
    id: "term-regression-testing",
    term: "Regression testing",
    definition:
      "Re-running tests after a change to check that existing functionality still works as expected.",
    curriculumPointIds: ["dsd-7.3", "dsd-8.2"],
    legacyTopicIds: ["intro-programming", "security"],
  },
  {
    id: "term-business-continuity",
    term: "Business continuity",
    definition:
      "Planning and preparation that keeps critical services running when disruption or incidents occur.",
    curriculumPointIds: ["dsd-2.2"],
    legacyTopicIds: ["business", "security"],
  },
  {
    id: "term-zero-day",
    term: "Zero day",
    definition:
      "A newly discovered vulnerability that is exploited before a fix is available.",
    curriculumPointIds: ["dsd-8.1"],
    legacyTopicIds: ["security"],
  },
];
