import type { QuestionMetadata } from "./types";

export const QUESTION_METADATA: QuestionMetadata[] = [
  {
    id: "paper2-2023-q2a-ui-end-users",
    sourceId: "paper2-2023",
    title: "Design the UI around end-user characteristics",
    sourceLabel: "Paper 2 2023",
    year: 2023,
    paper: "Paper 2",
    marks: 4,
    questionType: "medium-open",
    summary:
      "Explain two ways a user interface for doctors' surgeries should take the characteristics of the end users into account.",
    expectation:
      "The answer should link user characteristics such as age, pace, expertise, accuracy needs, or accessibility to concrete UI choices.",
    curriculumPointIds: ["dsd-4.3", "dsd-6.2"],
    legacyTopicIds: ["business", "intro-programming"],
    practicePrompt:
      "Explain two UI design choices that would help busy medical staff use a prescribing system accurately.",
    markSchemeConceptIds: ["ms-general-linked-explanation"],
  },
  {
    id: "paper2-2023-q2b-cia-patient-records",
    sourceId: "paper2-2023",
    title: "Apply confidentiality and integrity to patient records",
    sourceLabel: "Paper 2 2023",
    year: 2023,
    paper: "Paper 2",
    marks: 4,
    questionType: "medium-open",
    summary:
      "Describe how confidentiality and integrity of patient records apply in a new digital system.",
    expectation:
      "A strong answer explains what must be protected, who should access it, and how accuracy and unauthorised change are controlled.",
    curriculumPointIds: ["dsd-1.4", "dsd-2.2", "dsd-6.1"],
    legacyTopicIds: ["security", "legislation"],
    practicePrompt:
      "Explain how confidentiality and integrity should shape the design of a healthcare records system.",
    markSchemeConceptIds: [
      "ms-paper2-2023-q2b-healthcare-cia",
      "ms-general-linked-explanation",
    ],
    evaluationProfile: {
      depthExpectation: "developed",
      strongAnswerGuidance:
        "A strong answer explains what must be protected, who should access it, how unauthorised access is controlled, how record accuracy and change control are maintained, and why this matters in a healthcare setting.",
      slots: [
        {
          id: "confidentiality-core",
          label: "Confidentiality protects sensitive patient information",
          weight: 2,
          minimumGroups: 2,
          groups: [
            { anyOf: ["confidentiality", "confidential", "privacy"] },
            {
              anyOf: [
                "patient data",
                "patient record",
                "medical record",
                "sensitive personal information",
                "healthcare record",
              ],
            },
            {
              anyOf: [
                "unauthorised access",
                "unauthorised viewing",
                "only the right people",
                "only authorised staff",
                "restricted access",
                "people who need it",
              ],
            },
          ],
          missingFeedback:
            "State clearly that confidentiality means protecting sensitive patient data from unauthorised access.",
        },
        {
          id: "integrity-core",
          label: "Integrity keeps records accurate and prevents improper change",
          weight: 2,
          minimumGroups: 2,
          groups: [
            { anyOf: ["integrity", "accurate records", "data stays accurate"] },
            {
              anyOf: [
                "accurate",
                "correct",
                "complete",
                "reliable",
                "up to date",
              ],
            },
            {
              anyOf: [
                "not changed improperly",
                "not tampered with",
                "prevent improper change",
                "prevent unauthorised change",
                "changed incorrectly",
              ],
            },
          ],
          missingFeedback:
            "Explain that integrity means keeping records correct and preventing incorrect or unauthorised changes.",
        },
        {
          id: "access-control-measures",
          label: "Authorised access is controlled through design measures",
          weight: 2,
          minimumGroups: 2,
          groups: [
            {
              anyOf: [
                "role based access",
                "role-based access",
                "access control",
                "permissions",
                "user accounts",
                "login",
              ],
            },
            {
              anyOf: [
                "strong password",
                "password policy",
                "authentication",
                "encryption",
                "two factor",
                "2fa",
              ],
            },
            {
              anyOf: [
                "doctor",
                "nurse",
                "administrator",
                "authorised staff",
                "relevant staff",
                "staff who need it",
              ],
            },
          ],
          missingFeedback:
            "Add who should have access and at least one concrete control such as role-based access, authentication, or encryption.",
        },
        {
          id: "change-control-measures",
          label: "Validation and traceability help maintain integrity",
          weight: 2,
          minimumGroups: 1,
          groups: [
            {
              anyOf: [
                "validation",
                "validation check",
                "input validation",
                "controlled editing",
              ],
            },
            {
              anyOf: [
                "audit trail",
                "audit log",
                "track who changed what",
                "who changed what and when",
                "change history",
              ],
            },
            {
              anyOf: ["backup", "backups", "restore", "recovery copy"],
            },
          ],
          missingFeedback:
            "Explain how the system keeps records trustworthy, for example with validation, audit trails, or backups.",
        },
        {
          id: "healthcare-consequence",
          label: "Healthcare consequences are explained",
          weight: 1,
          minimumGroups: 1,
          groups: [
            {
              anyOf: [
                "unsafe treatment",
                "wrong dosage",
                "allergy",
                "diagnosis changed",
                "patient harm",
              ],
            },
            {
              anyOf: [
                "privacy breach",
                "break the law",
                "legal issue",
                "trust in the record",
                "patient trust",
                "safeguard privacy",
              ],
            },
          ],
          missingFeedback:
            "Link the controls to a healthcare outcome, such as privacy harm, unsafe treatment, or accountability.",
        },
      ],
    },
  },
  {
    id: "paper2-2023-q3-quality-service",
    sourceId: "paper2-2023",
    title: "Meet user needs and provide quality service",
    sourceLabel: "Paper 2 2023",
    year: 2023,
    paper: "Paper 2",
    marks: 3,
    questionType: "short-open",
    summary:
      "Explain one way to ensure a digital system provides a quality service that meets user needs.",
    expectation:
      "Good answers connect one design or support decision directly to user satisfaction, reliability, usability, or outcome quality.",
    curriculumPointIds: ["dsd-1.4", "dsd-4.3", "dsd-6.2"],
    legacyTopicIds: ["business"],
    practicePrompt:
      "Explain one practical way a team can make sure a digital service stays useful for its users.",
    markSchemeConceptIds: ["ms-general-linked-explanation"],
  },
  {
    id: "paper2-2023-q4c-firewall",
    sourceId: "paper2-2023",
    title: "Describe how a firewall improves security",
    sourceLabel: "Paper 2 2023",
    year: 2023,
    paper: "Paper 2",
    marks: 3,
    questionType: "short-open",
    summary:
      "Describe how a firewall is used to improve security in an organisation.",
    expectation:
      "The answer should explain traffic filtering or blocking and link that control to risk reduction.",
    curriculumPointIds: ["dsd-2.2", "dsd-6.1", "dsd-7.1"],
    legacyTopicIds: ["security", "digital-environments"],
    practicePrompt:
      "Describe how a firewall reduces the chance of unauthorised access or malicious traffic.",
    markSchemeConceptIds: ["ms-general-linked-explanation"],
  },
  {
    id: "paper2-2023-q5-change-drivers",
    sourceId: "paper2-2023",
    title: "Unforeseen factors that trigger change",
    sourceLabel: "Paper 2 2023",
    year: 2023,
    paper: "Paper 2",
    marks: 4,
    questionType: "medium-open",
    summary:
      "Describe two unforeseen factors that could trigger change in an organisation.",
    expectation:
      "Better answers identify a realistic change trigger and explain why it forces the organisation or system to adapt.",
    curriculumPointIds: ["dsd-8.1", "dsd-8.2"],
    legacyTopicIds: ["business"],
    practicePrompt:
      "Describe two unexpected events that could force a live software product or organisation to change.",
    markSchemeConceptIds: ["ms-aut22-q6-business-risks", "ms-general-linked-explanation"],
  },
  {
    id: "paper2-2023-q7-data-access-permissions",
    sourceId: "paper2-2023",
    title: "Evaluate the impact of data access permissions",
    sourceLabel: "Paper 2 2023",
    year: 2023,
    paper: "Paper 2",
    marks: 9,
    questionType: "extended-response",
    summary:
      "Evaluate the impact of data access permissions on an organisation.",
    expectation:
      "High-scoring answers balance the benefits of restricting and controlling access against operational costs, efficiency, and user needs.",
    curriculumPointIds: ["dsd-1.4", "dsd-2.2", "dsd-6.1", "dsd-8.1"],
    legacyTopicIds: ["security", "data", "business"],
    practicePrompt:
      "Evaluate how data access permissions can help and hinder an organisation.",
    markSchemeConceptIds: ["ms-general-linked-explanation"],
  },
  {
    id: "paper2-2023-q8a-virtual-environments",
    sourceId: "paper2-2023",
    title: "Benefits of virtual environments in development",
    sourceLabel: "Paper 2 2023",
    year: 2023,
    paper: "Paper 2",
    marks: 4,
    questionType: "medium-open",
    summary:
      "Explain two benefits of using virtual environments to develop a multiplatform game.",
    expectation:
      "The answer should focus on emulation, isolation, testing flexibility, or host security and link each point back to development work.",
    curriculumPointIds: ["dsd-4.3", "dsd-6.4"],
    legacyTopicIds: ["digital-environments", "security"],
    practicePrompt:
      "Explain two ways virtual environments help a team develop software for multiple platforms.",
    markSchemeConceptIds: ["ms-aut22-q4-virtual-environment-benefits"],
  },
  {
    id: "paper2-2023-q8b-human-error",
    sourceId: "paper2-2023",
    title: "Human error and development time",
    sourceLabel: "Paper 2 2023",
    year: 2023,
    paper: "Paper 2",
    marks: 4,
    questionType: "medium-open",
    summary:
      "Explain two ways human error could increase the development time of a software project.",
    expectation:
      "A strong answer connects the mistake to rework, communication failure, testing delay, or wasted effort.",
    curriculumPointIds: ["dsd-1.2", "dsd-5.1", "dsd-8.2"],
    legacyTopicIds: ["business", "intro-programming"],
    practicePrompt:
      "Explain two ways mistakes made by people can slow down software delivery.",
    markSchemeConceptIds: ["ms-general-linked-explanation"],
  },
  {
    id: "aut22-q2b-remote-working-risks",
    sourceId: "core-paper2-autumn-2022",
    title: "Remote working cyber threats",
    sourceLabel: "Autumn 2022 Paper 2",
    year: 2022,
    paper: "Paper 2",
    marks: 4,
    questionType: "medium-open",
    summary:
      "Identify and explain security threats that become relevant when staff work remotely.",
    expectation:
      "Answers should pair a specific threat with a clear explanation of how it affects systems, users, or data.",
    curriculumPointIds: ["dsd-2.2", "dsd-7.1", "dsd-8.1"],
    legacyTopicIds: ["security"],
    practicePrompt:
      "Explain two cyber threats that become more serious when staff work remotely.",
    markSchemeConceptIds: ["ms-aut22-q2b-remote-working-threats", "ms-general-linked-explanation"],
  },
  {
    id: "aut22-q4-virtual-environments",
    sourceId: "core-paper2-autumn-2022",
    title: "Use virtual environments to test safely",
    sourceLabel: "Autumn 2022 Paper 2",
    year: 2022,
    paper: "Paper 2",
    marks: 4,
    questionType: "medium-open",
    summary:
      "Explain how virtual environments support effective and safe development or testing.",
    expectation:
      "Answers should reference isolation, emulation, or security and link them to the scenario.",
    curriculumPointIds: ["dsd-4.3", "dsd-6.4"],
    legacyTopicIds: ["digital-environments", "security"],
    practicePrompt:
      "Explain how a virtual environment makes development safer or more flexible.",
    markSchemeConceptIds: ["ms-aut22-q4-virtual-environment-benefits", "ms-general-linked-explanation"],
  },
  {
    id: "aut22-q6-business-risk",
    sourceId: "core-paper2-autumn-2022",
    title: "Assess risks to a digital business service",
    sourceLabel: "Autumn 2022 Paper 2",
    year: 2022,
    paper: "Paper 2",
    marks: 3,
    questionType: "short-open",
    summary:
      "Identify a realistic business risk and explain the impact on the organisation.",
    expectation:
      "The answer should name a risk and show the business consequence rather than stopping at a label.",
    curriculumPointIds: ["dsd-2.2", "dsd-8.1"],
    legacyTopicIds: ["business", "security"],
    practicePrompt:
      "Identify one major risk to an organisation's digital service and explain the likely impact.",
    markSchemeConceptIds: ["ms-aut22-q6-business-risks", "ms-general-linked-explanation"],
  },
  {
    id: "aut22-q7-data-tools",
    sourceId: "core-paper2-autumn-2022",
    title: "Compare data warehouses, lakes, mining, and reporting",
    sourceLabel: "Autumn 2022 Paper 2",
    year: 2022,
    paper: "Paper 2",
    marks: 9,
    questionType: "extended-response",
    summary:
      "Evaluate different data storage and analysis approaches in terms of structure, storage, processing, and decision support.",
    expectation:
      "Higher marks come from comparing the tools directly and weighing trade-offs rather than listing definitions.",
    curriculumPointIds: ["dsd-1.5", "dsd-3.2", "dsd-6.3"],
    legacyTopicIds: ["data", "business"],
    practicePrompt:
      "Evaluate the difference between a data warehouse, a data lake, data mining, and reporting.",
    markSchemeConceptIds: ["ms-aut22-q7-data-tools"],
  },
  {
    id: "qb-decomposition-abstraction",
    sourceId: "paper1-q-and-a",
    title: "Question bank: decomposition, pattern recognition, and abstraction",
    sourceLabel: "Paper 1 Q&A",
    paper: "Paper 1",
    questionType: "question-bank-section",
    summary:
      "Legacy practice bank section covering decomposition, pattern recognition, and abstraction from the older core structure.",
    expectation:
      "Useful for short-answer practice on computational thinking terms, examples, and applied problem solving.",
    curriculumPointIds: ["dsd-1.1", "dsd-4.1", "dsd-4.3"],
    legacyTopicIds: ["problem-solving"],
    practicePrompt:
      "Explain how decomposition, pattern recognition, and abstraction work together when solving a problem.",
    markSchemeConceptIds: [],
  },
  {
    id: "qb-validation-and-data-types",
    sourceId: "paper1-q-and-a",
    title: "Question bank: data validation and data types",
    sourceLabel: "Paper 1 Q&A",
    paper: "Paper 1",
    questionType: "question-bank-section",
    summary:
      "Legacy question-bank coverage for validation, data types, and related programming basics.",
    expectation:
      "Good for retrieval practice around correct typing, validation checks, and basic program logic.",
    curriculumPointIds: ["dsd-1.4", "dsd-6.1", "dsd-7.3"],
    legacyTopicIds: ["intro-programming", "data"],
    practicePrompt:
      "Explain why data validation and correct data typing matter in a software solution.",
    markSchemeConceptIds: [],
  },
];
