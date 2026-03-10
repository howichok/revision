import type { CurriculumArea, CurriculumPoint } from "./types";

function point(
  areaId: string,
  areaCode: string,
  code: string,
  title: string,
  summary: string,
  relatedTerms: string[],
  relatedConcepts: string[],
  markSchemeIdeas: string[],
  practicePrompts: string[]
): CurriculumPoint {
  return {
    id: `dsd-${code}`,
    code,
    title,
    summary,
    areaId,
    areaCode,
    relatedTerms,
    relatedConcepts,
    markSchemeIdeas,
    practicePrompts,
  };
}

export const DSD_CURRICULUM_AREAS: CurriculumArea[] = [
  {
    id: "dsd-ca1",
    code: "1",
    title: "Analyse a problem and define requirements aligned to user needs",
    summary:
      "The official starting point for DSD 2025: software lifecycle thinking, requirements, team roles, methodologies, and early planning decisions.",
    officialSourceId: "dsd-spec-2025",
    points: [
      point(
        "dsd-ca1",
        "1",
        "1.1",
        "Apply software development lifecycle stages to digital projects",
        "Understand the full lifecycle from research and planning through design, development, testing, deployment, and maintenance, then apply the right stage activities to a project brief.",
        ["software development lifecycle", "requirements", "acceptance criteria", "KPI", "prototype"],
        ["research and familiarisation", "planning and requirement analysis", "user analysis", "design", "development and testing", "deployment", "maintenance"],
        ["Explain why a lifecycle stage matters in context.", "Link planning choices to user value, cost, risk, or scope."],
        ["Explain how the lifecycle would shape a software project for a named client.", "Describe what must happen during planning before development begins."]
      ),
      point(
        "dsd-ca1",
        "1",
        "1.2",
        "Understand digital team roles and responsibilities",
        "Know how product owners, scrum masters, technical leads, project managers, analysts, designers, developers, operations, security, and testers contribute across the lifecycle.",
        ["product owner", "scrum master", "technical lead", "systems analyst", "UX/UI designer", "operations engineer"],
        ["team accountability", "role boundaries", "project planning", "quality assurance", "security responsibility"],
        ["Credit accurate responsibility statements.", "Reward answers that match the right role to a project stage or outcome."],
        ["Compare the roles of a product owner and a project manager.", "Explain why testers and security engineers should be involved early."]
      ),
      point(
        "dsd-ca1",
        "1",
        "1.3",
        "Select appropriate project methodologies",
        "Compare Agile, Scaled Agile, Waterfall, RAD, Lean, and user-centred design so methodology choices can be justified against project size, speed, documentation, risk, and user involvement.",
        ["Agile", "Waterfall", "RAD", "Lean", "user-centred design", "sprint", "epic", "story"],
        ["incremental delivery", "documentation trade-offs", "iteration", "fit for purpose methods", "UCD stages"],
        ["Use paired advantages and disadvantages rather than naming a method only.", "Strong answers justify why one method fits the scenario better than another."],
        ["Explain when Waterfall would still be a better choice than Agile.", "Describe how UCD changes design decisions in an iterative project."]
      ),
      point(
        "dsd-ca1",
        "1",
        "1.4",
        "Define functional and non-functional requirements",
        "Specify inputs, processing, logic, data, deployment context, accessibility, scalability, security, performance metrics, and user acceptance criteria for a proposed solution.",
        ["functional requirement", "non-functional requirement", "secure by design", "accessibility", "scalability", "spike testing"],
        ["user input and output definition", "security requirements", "performance constraints", "acceptance criteria", "KPIs"],
        ["Reward answers that distinguish what the system does from how well it must do it.", "Credit measurable acceptance criteria and secure-by-design reasoning."],
        ["Write one functional and one non-functional requirement for an online booking system.", "Explain why secure-by-design changes requirement decisions early."]
      ),
      point(
        "dsd-ca1",
        "1",
        "1.5",
        "Investigate emerging technologies and their impact",
        "Study how AI, IoT, biometrics, robotics, cloud services, data lakes, warehousing, communications changes, and similar technologies affect software development and industry choices.",
        ["AI", "IoT", "biometrics", "robotics", "cloud services", "data lake", "data warehouse", "5G"],
        ["technology impact analysis", "opportunity versus risk", "industry application", "future-proofing"],
        ["Better responses connect an emerging technology to software design or business impact.", "Credit balanced discussion of benefit and limitation."],
        ["Explain one software development opportunity and one risk created by AI.", "Describe how cloud platforms change what a software team can deliver."]
      ),
      point(
        "dsd-ca1",
        "1",
        "1.6",
        "Identify personal training needs during software development",
        "Recognise knowledge or skill gaps, then choose realistic ways to close them through coaching, self-study, on-the-job learning, forums, or structured training.",
        ["skills gap", "self-study", "coaching", "professional forum", "upskilling"],
        ["project readiness", "continuous learning", "capability planning", "team support"],
        ["Reward realistic ways to close a skill gap, not just identifying the gap.", "Credit answers that link training to project quality or delivery risk."],
        ["Explain how a developer should respond when a project needs unfamiliar technology.", "Describe two ways to close a knowledge gap before delivery risk grows."]
      ),
    ],
  },
  {
    id: "dsd-ca2",
    code: "2",
    title: "Apply ethical principles and manage risks in line with legal and regulatory requirements",
    summary:
      "The official legal, ethical, and risk-management strand for DSD 2025, covering standards, compliance, privacy, and mitigation.",
    officialSourceId: "dsd-spec-2025",
    points: [
      point(
        "dsd-ca2",
        "2",
        "2.1",
        "Investigate legal, regulatory, and ethical requirements",
        "Apply software-relevant legal and regulatory requirements such as intellectual property, consumer protection, privacy, copyright, equality, licensing, and development standards.",
        ["intellectual property", "consumer protection", "data protection", "copyright", "W3C", "ISO/IEC/IEEE 90003"],
        ["compliance in context", "professional practice", "licensing", "standards and codes of conduct"],
        ["Strong responses link the regulation to a practical software decision.", "Reward answers that combine legal and ethical implications."],
        ["Explain two legal checks a team should make before releasing a new app.", "Describe how accessibility standards affect software design choices."]
      ),
      point(
        "dsd-ca2",
        "2",
        "2.2",
        "Identify, assess, and mitigate software development risks",
        "Identify risks around security, compatibility, performance, requirements, user engagement, continuity, and compliance, then justify mitigation and contingency decisions.",
        ["risk assessment", "mitigation", "contingency planning", "CIA triad", "business continuity", "disaster recovery"],
        ["likelihood versus severity", "risk monitoring", "security policy", "confidentiality integrity availability", "reward versus risk decisions"],
        ["Credit risk statements only when the impact or mitigation is clear.", "High-mark answers weigh risk against business reward and justify the decision."],
        ["Explain how a team should evaluate the risk of exposing customer data through a new feature.", "Compare mitigation and contingency planning in a software project."]
      ),
    ],
  },
  {
    id: "dsd-ca3",
    code: "3",
    title: "Discover, evaluate, and apply reliable sources of knowledge",
    summary:
      "The evidence and research strand: how developers find trustworthy information and collect qualitative and quantitative feedback.",
    officialSourceId: "dsd-spec-2025",
    points: [
      point(
        "dsd-ca3",
        "3",
        "3.1",
        "Evaluate the reliability of different sources of knowledge",
        "Use search, repositories, wikis, blogs, papers, forums, comments, and peers responsibly by checking reputation, evidence, bias, triangulation, and currency.",
        ["triangulation", "source credibility", "bias", "currency", "code repository"],
        ["research reliability", "cross-referencing", "technical evidence", "author credibility"],
        ["Reward evidence-led evaluation, not just naming a source type.", "Credit answers that compare multiple sources before trusting one."],
        ["Explain how a developer can decide whether a tutorial is reliable enough to follow.", "Describe why recency and triangulation matter when using technical guidance."]
      ),
      point(
        "dsd-ca3",
        "3",
        "3.2",
        "Select techniques to gather qualitative and quantitative feedback",
        "Use interviews, surveys, observation, focus groups, usage data, mentoring, and other techniques to understand how well a software solution performs for users.",
        ["qualitative data", "quantitative data", "survey", "interview", "focus group", "observation"],
        ["user research", "feedback collection", "performance evidence", "evaluation methods"],
        ["Strong answers justify why a data-gathering method fits the audience or question.", "Reward distinctions between measurable data and descriptive feedback."],
        ["Choose a suitable feedback method for testing a school-facing app and justify it.", "Explain the difference between qualitative and quantitative evaluation evidence."]
      ),
    ],
  },
  {
    id: "dsd-ca4",
    code: "4",
    title: "Design",
    summary:
      "The core design strand for DSD 2025: design approaches, platform selection, UX/UI, data design, and architecture decisions.",
    officialSourceId: "dsd-spec-2025",
    points: [
      point(
        "dsd-ca4",
        "4",
        "4.1",
        "Understand common software design approaches",
        "Select suitable design approaches such as top-down, OOP, data modelling, test-driven development, behaviour-driven development, and functional design within larger methodologies.",
        ["top-down design", "OOP", "TDD", "BDD", "functional design", "ERD", "UML"],
        ["divide and conquer", "design patterns", "data model design", "behaviour specification", "reusable code"],
        ["Credit answers that explain why a design approach fits the problem.", "High-quality answers identify trade-offs, not just features."],
        ["Explain when OOP would be more suitable than function-oriented design.", "Describe how TDD changes the order in which code is written."]
      ),
      point(
        "dsd-ca4",
        "4",
        "4.2",
        "Select platforms for source code and content management",
        "Understand coding, repository, branching, build, test, and deployment platforms, including open-source versus proprietary trade-offs and common workflow models such as gitFlow.",
        ["repository", "branching", "build pipeline", "open source", "proprietary", "gitFlow", "GitHub Flow"],
        ["workflow management", "platform choice", "budget and security trade-offs", "collaborative development"],
        ["Reward answers that connect platform choice to target audience, budget, performance, or staff skill.", "Credit workflow reasoning, not platform name-dropping."],
        ["Explain why a team might choose GitHub Flow over a heavier branching model.", "Describe two factors that should guide a repository platform choice."]
      ),
      point(
        "dsd-ca4",
        "4",
        "4.3",
        "Design a software solution",
        "Apply UX and UI principles, create program and database designs, choose assets carefully, understand target platforms, and identify data and network integration points.",
        ["UX", "UI", "wireframe", "style guide", "ERD", "normalisation", "metadata", "network integration"],
        ["accessibility", "visual hierarchy", "database design", "asset selection", "local versus remote processing", "external integrations"],
        ["Strong answers explain design choices in relation to users, platform limits, and data needs.", "Reward database and network design thinking when the scenario needs it."],
        ["Explain how UX principles should affect the design of a patient-facing dashboard.", "Describe why a system boundary matters when deciding what runs locally or remotely."]
      ),
    ],
  },
  {
    id: "dsd-ca5",
    code: "5",
    title: "Create solutions in a social and collaborative environment",
    summary:
      "The teamwork and collaboration strand: why teams collaborate, which tools they use, and when solo work is more appropriate.",
    officialSourceId: "dsd-spec-2025",
    points: [
      point(
        "dsd-ca5",
        "5",
        "5.1",
        "Understand the reasons for using collaborative techniques",
        "Use team working, code reviews, pair programming, walkthroughs, and inspections to reduce delivery time, share knowledge, and improve quality when collaboration is justified.",
        ["pair programming", "walkthrough", "inspection", "code review", "team working"],
        ["knowledge sharing", "quality improvement", "development speed", "collaboration boundaries"],
        ["Reward answers that explain a concrete collaboration benefit such as defect reduction or better knowledge transfer.", "Credit when students recognise that some tasks are better done independently."],
        ["Explain how code reviews improve quality in a software team.", "Describe one case where independent work would be more efficient than group collaboration."]
      ),
      point(
        "dsd-ca5",
        "5",
        "5.2",
        "Select technologies for collaborative software development",
        "Choose communication, documentation, code collaboration, version control, resource management, and IDE tools that support joint delivery work.",
        ["version control", "collaboration hub", "cloud storage", "IDE", "source control", "documentation"],
        ["shared knowledge bases", "communication channels", "resource synchronisation", "team tooling"],
        ["Credit answers that match a technology to a team need or workflow stage.", "Strong responses justify tool choice against speed, traceability, or reliability."],
        ["Explain why version control is essential in a collaborative project.", "Describe how shared documentation tools reduce delivery risk."]
      ),
    ],
  },
  {
    id: "dsd-ca6",
    code: "6",
    title: "Implement a solution using at least two appropriate languages",
    summary:
      "The implementation strand: selecting languages, building front and back ends, connecting data, shaping UI, and deploying working software.",
    officialSourceId: "dsd-spec-2025",
    points: [
      point(
        "dsd-ca6",
        "6",
        "6.1",
        "Select languages, tools, APIs, and pipelines for implementation",
        "Use at least two suitable languages and the right modules, APIs, libraries, security features, packaging, and CI/CD pipeline stages to build a usable front-end and back-end solution.",
        ["Python", "JavaScript", "SQL", "API", "CI/CD", "cookies", "stateful", "stateless", "containerisation"],
        ["front-end and back-end implementation", "file and data handling", "security features", "build automation", "deployment automation"],
        ["Reward answers that connect implementation choices to the problem context.", "Credit understanding of CI/CD stages and secure access control."],
        ["Explain why a project might need both SQL and JavaScript.", "Describe how CI/CD helps a team deliver software more safely."]
      ),
      point(
        "dsd-ca6",
        "6",
        "6.2",
        "Select interface features and UX techniques",
        "Choose interface features such as feedback, media, interaction patterns, data visualisation, layout, typography, colour, focus states, and accessibility fit for the target users and devices.",
        ["data visualisation", "hover control", "input focus", "contrast", "responsive layout", "accessibility"],
        ["user interface features", "device-aware decisions", "brand consistency", "available bandwidth", "input method support"],
        ["Credit answers that tie UI decisions to real user needs or accessibility.", "Strong responses explain trade-offs such as rich media versus bandwidth."],
        ["Explain two UI decisions that would help older users complete a medical task safely.", "Describe why contrast and focus states matter in an accessible interface."]
      ),
      point(
        "dsd-ca6",
        "6",
        "6.3",
        "Connect code to data sources",
        "Work with databases, APIs, JDBC, ODBC, credentials, endpoints, CRUD actions, and other connections so software can read, store, update, and delete data safely.",
        ["database", "endpoint", "JDBC", "ODBC", "API key", "CRUD", "credentials"],
        ["data source integration", "request methods", "parsing data", "query execution", "network resources"],
        ["Reward answers that distinguish retrieving data from updating it.", "High-mark answers justify which connection method suits the context."],
        ["Explain how an app should connect to an external API and why credentials matter.", "Describe the steps involved in storing form data in a database."]
      ),
      point(
        "dsd-ca6",
        "6",
        "6.4",
        "Select deployment methods for a software project",
        "Choose suitable deployment methods such as local, server, web, cloud, mobile, containerised, or orchestrated deployment based on context and operational needs.",
        ["deployment", "cloud", "container", "web-based", "server installation", "mobile platform"],
        ["release target selection", "operational fit", "scalability", "installation model"],
        ["Credit justification of the deployment target, not just naming one.", "Reward answers that consider platform, users, and maintenance implications."],
        ["Explain why a cloud-based deployment may be more suitable than local installation for a distributed team.", "Describe one situation where local deployment would still make sense."]
      ),
    ],
  },
  {
    id: "dsd-ca7",
    code: "7",
    title: "Testing a software solution",
    summary:
      "The official testing strand for DSD 2025, spanning test types, testing techniques, security checks, and structured test data.",
    officialSourceId: "dsd-spec-2025",
    points: [
      point(
        "dsd-ca7",
        "7",
        "7.1",
        "Select and apply functional, non-functional, front-end, and security testing",
        "Use the right test type at the right stage, including unit, smoke, integration, system, load, compatibility, browser, vulnerability, static, and dynamic testing.",
        ["unit testing", "integration testing", "load testing", "browser compatibility", "vulnerability scanning", "static analysis"],
        ["test selection by lifecycle stage", "security testing", "front-end rendering checks", "non-functional quality checks"],
        ["Reward answers that match the test type to the risk or feature being checked.", "High-scoring responses distinguish functional from non-functional aims."],
        ["Explain why integration testing is needed even if unit tests already pass.", "Describe how front-end testing differs from security testing."]
      ),
      point(
        "dsd-ca7",
        "7",
        "7.2",
        "Select and apply testing techniques",
        "Choose acceptance, alpha, beta, open-box, closed-box, manual, or automated techniques to show a solution meets its requirements.",
        ["alpha testing", "beta testing", "acceptance testing", "open-box testing", "closed-box testing", "automation"],
        ["manual versus automated trade-offs", "internal versus external testing", "requirements validation"],
        ["Reward answers that connect a technique to who performs it and why.", "Better answers justify automation rather than assuming it is always superior."],
        ["Explain when beta testing is more useful than alpha testing.", "Describe one reason a team would still use manual testing in an automated pipeline."]
      ),
      point(
        "dsd-ca7",
        "7",
        "7.3",
        "Select tests and test data",
        "Plan valid, invalid, extreme, erroneous, expected, and regression test evidence so functionality can be checked and re-checked after changes.",
        ["valid data", "invalid data", "extreme data", "erroneous data", "regression testing", "expected result"],
        ["test planning", "pre-requisites", "actual versus expected results", "re-test after change"],
        ["Reward precise choice of test data and expected outcome.", "Credit answers that explain why regression testing is needed after changes."],
        ["Design test data for a field that accepts ages 16 to 120.", "Explain the difference between valid extreme and invalid extreme data."]
      ),
    ],
  },
  {
    id: "dsd-ca8",
    code: "8",
    title: "Change, maintain, and support software",
    summary:
      "The maintenance strand: why software changes over time and how teams should control, communicate, and test those changes.",
    officialSourceId: "dsd-spec-2025",
    points: [
      point(
        "dsd-ca8",
        "8",
        "8.1",
        "Understand why digital products change over time",
        "Recognise how regulation, new technology, competition, user feedback, vulnerabilities, zero-day issues, failures, and business process changes drive maintenance and iterative improvement.",
        ["maintenance", "zero day", "future-proofing", "iterative development", "user feedback"],
        ["preventive change", "corrective change", "adaptive change", "competition-driven improvement"],
        ["Credit answers that identify both the change driver and the consequence for the product.", "Better responses separate foreseeable maintenance from reactive fixes."],
        ["Explain two reasons a live product may need updating after release.", "Describe how user feedback can trigger iterative improvement."]
      ),
      point(
        "dsd-ca8",
        "8",
        "8.2",
        "Understand the software change management process",
        "Identify issues, document changes, communicate with technical and non-technical audiences, schedule updates, regression test, and release software in a controlled way.",
        ["change management", "release control", "regression testing", "documentation", "stakeholder communication"],
        ["issue tracking", "planned release", "reactive release", "audience-aware communication"],
        ["Reward sequence and control in the change process, not isolated steps.", "Strong answers show why communication and regression testing protect release quality."],
        ["Explain why documented change control matters before a production release.", "Describe how a team should communicate changes differently to developers and clients."]
      ),
    ],
  },
];

export const DSD_CURRICULUM_POINTS = DSD_CURRICULUM_AREAS.flatMap((area) => area.points);
