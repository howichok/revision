import type { RevisionQuestionSchema } from "../types";

export const REVISION_QUESTION_SCHEMAS: RevisionQuestionSchema[] = [
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
    concepts: [
      {
        id: "decomposition-breakdown",
        label: "Decomposition into manageable parts",
        weight: 2,
        feedback: "that decomposition splits the problem into smaller parts",
        requiredGroups: [
          { anyOf: ["decomposition", "break down", "split up"] },
          { anyOf: ["smaller parts", "smaller tasks", "manageable pieces", "sub problems"] },
        ],
      },
      {
        id: "abstraction-focus",
        label: "Abstraction focuses on relevant detail",
        weight: 2,
        feedback: "that abstraction focuses on relevant detail",
        requiredGroups: [
          { anyOf: ["abstraction", "abstract"] },
          { anyOf: ["ignore irrelevant detail", "remove unnecessary detail", "focus on relevant detail"] },
        ],
      },
      {
        id: "design-benefit",
        label: "Design or testing becomes easier",
        weight: 2,
        feedback: "the benefit to design, testing, or maintenance",
        requiredGroups: [
          { anyOf: ["easier to design", "easier to test", "easier to maintain", "more manageable"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "abstraction-adds-detail",
        label: "Abstraction adds extra detail",
        penalty: 1,
        explanation: "Abstraction removes irrelevant detail. It does not add extra detail to the model.",
        groups: [{ anyOf: ["abstraction adds detail", "abstraction includes every detail"] }],
      },
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
    concepts: [
      {
        id: "selection-checks-condition",
        label: "Selection checks whether input is valid",
        weight: 2,
        feedback: "that selection is used to test a condition",
        requiredGroups: [
          { anyOf: ["selection", "if statement", "if else"] },
          { anyOf: ["check condition", "test input", "validate input", "is valid"] },
        ],
      },
      {
        id: "iteration-repeats",
        label: "Iteration repeats until valid input is given",
        weight: 2,
        feedback: "that iteration repeats the validation",
        requiredGroups: [
          { anyOf: ["iteration", "loop", "repeat"] },
          { anyOf: ["until valid", "until correct", "keep asking", "repeat input"] },
        ],
      },
      {
        id: "robustness-benefit",
        label: "Validation prevents invalid data",
        weight: 2,
        feedback: "the effect on robustness or data quality",
        requiredGroups: [
          { anyOf: ["prevent invalid data", "stop bad data", "improve robustness", "reduce errors"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "loop-runs-once",
        label: "Iteration only runs once",
        penalty: 1,
        explanation: "Iteration means repeating a block while a condition still applies. It is not the same as a one-off check.",
        groups: [{ anyOf: ["loop runs once", "iteration happens once"] }],
      },
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
    concepts: [
      {
        id: "ai-benefit",
        label: "AI can improve efficiency or automation",
        weight: 2,
        feedback: "a realistic benefit of AI",
        requiredGroups: [
          { anyOf: ["ai", "artificial intelligence"] },
          { anyOf: ["automation", "efficiency", "faster decisions", "decision support", "save time"] },
        ],
      },
      {
        id: "ethical-risk",
        label: "AI introduces an ethical risk",
        weight: 2,
        feedback: "an ethical risk such as bias or privacy",
        requiredGroups: [
          { anyOf: ["bias", "privacy", "accountability", "job loss", "job displacement", "surveillance"] },
        ],
      },
      {
        id: "oversight",
        label: "Responsible oversight is needed",
        weight: 2,
        feedback: "the need for oversight or human review",
        requiredGroups: [
          { anyOf: ["human oversight", "monitoring", "review outputs", "responsible use", "policies"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "ai-no-risk",
        label: "AI has no ethical risk",
        penalty: 1,
        explanation: "AI systems can create ethical issues such as bias, privacy problems, or poor accountability if they are left unchecked.",
        groups: [{ anyOf: ["ai has no risk", "ai is always fair", "ai is unbiased by default"] }],
      },
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
    concepts: [
      {
        id: "lawful-processing",
        label: "Personal data must be processed lawfully",
        weight: 2,
        feedback: "lawful and fair processing of personal data",
        requiredGroups: [
          { anyOf: ["personal data", "customer details", "customer data"] },
          { anyOf: ["lawfully", "fairly", "legal basis", "consent"] },
        ],
      },
      {
        id: "secure-storage",
        label: "Data must be kept secure",
        weight: 2,
        feedback: "secure storage and controlled access",
        requiredGroups: [
          { anyOf: ["secure", "protected", "restricted access", "access control", "encrypted"] },
        ],
      },
      {
        id: "retention-accuracy",
        label: "Data should be accurate and not kept longer than needed",
        weight: 2,
        feedback: "accuracy or retention responsibilities",
        requiredGroups: [
          { anyOf: ["accurate", "up to date", "not kept longer than necessary", "retention", "delete when no longer needed"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "internal-exemption",
        label: "Internal storage is exempt from data protection law",
        penalty: 1,
        explanation: "Data protection responsibilities still apply when a company stores personal data internally or in the cloud.",
        groups: [{ anyOf: ["internal data does not count", "law does not apply inside company"] }],
      },
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
    concepts: [
      {
        id: "correct-usage",
        label: "Training helps staff use the system correctly",
        weight: 2,
        feedback: "that training supports correct system use",
        requiredGroups: [
          { anyOf: ["training", "staff training", "user training"] },
          { anyOf: ["use correctly", "use the system", "understand the system", "learn how to use"] },
        ],
      },
      {
        id: "reduce-errors-resistance",
        label: "Training reduces mistakes or resistance",
        weight: 2,
        feedback: "that training reduces errors or resistance",
        requiredGroups: [
          { anyOf: ["reduce errors", "fewer mistakes", "less resistance", "more confidence", "less disruption"] },
        ],
      },
      {
        id: "adoption-benefit",
        label: "Training improves rollout success",
        weight: 2,
        feedback: "the business benefit from stronger adoption",
        requiredGroups: [
          { anyOf: ["better adoption", "higher productivity", "business continuity", "smoother rollout", "less downtime"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "training-wastes-time",
        label: "Training is unnecessary overhead",
        penalty: 1,
        explanation: "Skipping training usually increases confusion, mistakes, and resistance during a rollout.",
        groups: [{ anyOf: ["training is a waste of time", "users should just figure it out"] }],
      },
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
    concepts: [
      {
        id: "primary-key-unique",
        label: "Primary keys uniquely identify records",
        weight: 2,
        feedback: "the role of a primary key",
        requiredGroups: [
          { anyOf: ["primary key"] },
          { anyOf: ["unique", "uniquely identify", "one record", "single record"] },
        ],
      },
      {
        id: "foreign-key-links",
        label: "Foreign keys connect related tables",
        weight: 2,
        feedback: "the role of a foreign key",
        requiredGroups: [
          { anyOf: ["foreign key"] },
          { anyOf: ["link tables", "connect tables", "relationship", "related tables"] },
        ],
      },
      {
        id: "integrity-benefit",
        label: "Keys support integrity and consistency",
        weight: 2,
        feedback: "the integrity or consistency benefit",
        requiredGroups: [
          { anyOf: ["integrity", "consistency", "avoid duplication", "reduce duplication", "accurate relationships"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "foreign-key-unique",
        label: "A foreign key must be unique like a primary key",
        penalty: 1,
        explanation: "A foreign key links related records. It does not need to be unique in the same way as a primary key.",
        groups: [{ anyOf: ["foreign key is unique", "foreign key uniquely identifies every record"] }],
      },
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
    concepts: [
      {
        id: "virtualization-benefit",
        label: "Virtualization improves hardware usage or isolation",
        weight: 2,
        feedback: "a genuine benefit of virtualization",
        requiredGroups: [
          { anyOf: ["virtualization", "virtual machine", "vm"] },
          { anyOf: ["share hardware", "better resource use", "isolation", "run multiple systems", "testing"] },
        ],
      },
      {
        id: "cloud-scalability",
        label: "Cloud scalability matches resources to demand",
        weight: 2,
        feedback: "how cloud scalability works",
        requiredGroups: [
          { anyOf: ["cloud scalability", "scalability", "scale up", "scale down"] },
          { anyOf: ["demand", "more users", "traffic", "resources", "capacity"] },
        ],
      },
      {
        id: "cost-flexibility",
        label: "The benefit is cost efficiency or flexibility",
        weight: 2,
        feedback: "the practical business benefit",
        requiredGroups: [
          { anyOf: ["cost", "flexibility", "pay for what you use", "efficient", "performance"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "cloud-infinite",
        label: "Cloud capacity is automatically infinite",
        penalty: 1,
        explanation: "Cloud platforms are scalable, but capacity, design, and cost still need to be managed properly.",
        groups: [{ anyOf: ["cloud is infinite", "cloud has unlimited resources for free"] }],
      },
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
    concepts: [
      {
        id: "mfa-extra-factor",
        label: "Multi-factor authentication adds extra identity checks",
        weight: 2,
        feedback: "how multi-factor authentication reduces login risk",
        requiredGroups: [
          { anyOf: ["multi factor authentication", "mfa", "two factor authentication", "2fa"] },
          { anyOf: ["extra factor", "second factor", "second check", "extra check", "proof of identity"] },
        ],
      },
      {
        id: "patching-fixes-vulnerabilities",
        label: "Patching removes known vulnerabilities",
        weight: 2,
        feedback: "how patching closes vulnerabilities",
        requiredGroups: [
          { anyOf: ["patching", "patching fixes", "patches", "update software", "security updates"] },
          { anyOf: ["fix vulnerabilities", "close exploits", "known weakness", "security flaw"] },
        ],
      },
      {
        id: "reduced-risk",
        label: "Together they reduce successful attacks",
        weight: 2,
        feedback: "the overall risk reduction",
        requiredGroups: [
          { anyOf: ["reduce unauthorised access", "reduce attacks", "stop attackers", "lower security risk", "protect accounts", "stolen password is not enough", "cannot exploit"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "mfa-replaces-patching",
        label: "MFA removes the need for patching",
        penalty: 1,
        explanation: "MFA protects authentication, but systems still need patching to close software vulnerabilities.",
        groups: [{ anyOf: ["mfa means patching is unnecessary", "patching is not needed if 2fa is enabled"] }],
      },
    ],
  },
];
