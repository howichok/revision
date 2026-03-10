import type { PublicRevisionQuestion } from "./types";

export const PUBLIC_REVISION_QUESTIONS: PublicRevisionQuestion[] = [
  {
    id: "problem-solving-decomposition-abstraction",
    topicId: "problem-solving",
    subtopicId: "1.1",
    prompt:
      "Explain how decomposition and abstraction help when designing a solution to a complex programming problem.",
    maxScore: 6,
    rubricSummary: [
      "Explain that decomposition breaks a large problem into smaller parts.",
      "Explain that abstraction removes irrelevant detail and focuses on what matters.",
      "Link both techniques to easier design, testing, or maintenance.",
    ],
  },
  {
    id: "intro-programming-validation",
    topicId: "intro-programming",
    subtopicId: "2.6",
    prompt:
      "Explain why selection and iteration are useful in a program that validates user input.",
    maxScore: 6,
    rubricSummary: [
      "Explain that selection checks whether input meets a condition.",
      "Explain that iteration repeats the check until valid input is entered.",
      "Link this to preventing invalid data or improving robustness.",
    ],
  },
  {
    id: "emerging-issues-ai",
    topicId: "emerging-issues",
    subtopicId: "3.2",
    prompt:
      "Explain one benefit and one ethical risk of using AI in an organisation.",
    maxScore: 6,
    rubricSummary: [
      "Explain one realistic benefit such as automation, efficiency, or improved decision support.",
      "Explain one ethical risk such as bias, privacy, accountability, or job displacement.",
      "Show that organisations need oversight or responsible use.",
    ],
  },
  {
    id: "legislation-data-protection",
    topicId: "legislation",
    subtopicId: "4.1",
    prompt:
      "A company stores customer details online. Explain two responsibilities it has under data protection law.",
    maxScore: 6,
    rubricSummary: [
      "Explain that personal data must be processed lawfully and fairly.",
      "Explain that data must be kept secure and access-controlled.",
      "Explain another valid responsibility such as accuracy, retention limits, or limited sharing.",
    ],
  },
  {
    id: "business-change-training",
    topicId: "business",
    subtopicId: "5.3",
    prompt:
      "Explain why staff training matters during a digital change rollout.",
    maxScore: 6,
    rubricSummary: [
      "Explain that training helps staff use the new system correctly.",
      "Explain that training reduces resistance, mistakes, or downtime.",
      "Link training to adoption, productivity, or business continuity.",
    ],
  },
  {
    id: "data-keys-relationships",
    topicId: "data",
    subtopicId: "6.3",
    prompt:
      "Explain why a relational database uses primary keys and foreign keys.",
    maxScore: 6,
    rubricSummary: [
      "Explain that a primary key uniquely identifies each record.",
      "Explain that a foreign key links related tables together.",
      "Link keys to integrity, consistency, or reduced duplication.",
    ],
  },
  {
    id: "digital-environments-virtualization-cloud",
    topicId: "digital-environments",
    subtopicId: "7.4",
    prompt:
      "Explain one benefit of virtualization and one benefit of cloud scalability.",
    maxScore: 6,
    rubricSummary: [
      "Explain that virtualization allows multiple isolated systems to share hardware efficiently.",
      "Explain that cloud scalability allows resources to expand or shrink with demand.",
      "Link each benefit to cost, flexibility, testing, or performance.",
    ],
  },
  {
    id: "security-mfa-patching",
    topicId: "security",
    subtopicId: "8.2",
    prompt:
      "Explain how multi-factor authentication and patching reduce security risk in an organisation.",
    maxScore: 6,
    rubricSummary: [
      "Explain that multi-factor authentication adds an extra proof of identity.",
      "Explain that patching fixes known vulnerabilities.",
      "Link both to reducing unauthorised access or successful attacks.",
    ],
  },
];

export function getPracticeQuestionForTopic(topicId: string): PublicRevisionQuestion | null {
  return PUBLIC_REVISION_QUESTIONS.find((question) => question.topicId === topicId) ?? null;
}
