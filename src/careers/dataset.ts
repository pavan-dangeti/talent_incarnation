// Curated careers dataset. Original summaries written for Talent Incarnation.
// It deliberately contains no salary figures, hiring statistics or company
// names: nothing here should be read as market data. Ids are permanent because
// chat messages store citations by passage id.
import type { Domain } from "@/assessment/types";

export const SECTIONS = {
  overview: "Overview",
  work: "Day-to-day work",
  skills: "Core skills",
  start: "How to get started",
  related: "Related roles",
} as const;
export type SectionKey = keyof typeof SECTIONS;

export type Role = {
  id: string;
  title: string;
  domain: Domain;
  sections: Record<SectionKey, string>;
};

export type Guide = { id: string; title: string; body: string };

export const ROLES: Role[] = [
  {
    id: "frontend-developer",
    title: "Frontend Developer",
    domain: "software",
    sections: {
      overview:
        "A frontend developer builds the part of a web application that people see and use in the browser. The role turns designs into working, responsive and accessible interfaces and connects them to data from servers.",
      work:
        "Typical work includes building pages and reusable components, wiring them to APIs, fixing layout and browser bugs, improving loading speed, and reviewing interface changes with designers. Frontend developers also write tests for components and take part in code review.",
      skills:
        "Core skills are HTML, CSS and JavaScript, usually with TypeScript and a component framework such as React. Important supporting skills are accessibility, responsive layout, calling HTTP APIs, version control with Git, browser developer tools and component testing.",
      start:
        "Start with HTML, CSS and plain JavaScript before a framework. Build small complete projects, such as a to-do app and a page that loads data from a public API, publish them, and read other people's code. Learn Git early and make accessibility a habit from the first project.",
      related:
        "Frontend developers often move towards full-stack development by learning backend skills, or towards design engineering and UI design by deepening visual and interaction skills. Mobile development is a close neighbour because it shares interface thinking.",
    },
  },
  {
    id: "backend-developer",
    title: "Backend Developer",
    domain: "software",
    sections: {
      overview:
        "A backend developer builds the server side of an application: the APIs, business logic and data storage that the interface depends on. The role is responsible for correctness, security and performance of the parts users do not see.",
      work:
        "Typical work includes designing and implementing APIs, modelling data and writing database queries, integrating with other services, handling authentication and permissions, and investigating production errors. Backend developers write automated tests and review each other's changes.",
      skills:
        "Core skills are one server-side language such as Java, Python, Go or JavaScript, relational databases and SQL, HTTP and API design, and data structures and algorithms. Important supporting skills are testing, security basics, caching, and reasoning about concurrency and failures.",
      start:
        "Pick one language and build a small API with a real database: create, read, update and delete records, then add login. Learn SQL properly instead of relying only on libraries. Deploy the project somewhere, add tests, and practise explaining the design choices you made.",
      related:
        "Backend developers often grow into full-stack development, DevOps and site reliability work, or data engineering, since all three build on servers, databases and automation.",
    },
  },
  {
    id: "mobile-developer",
    title: "Mobile Developer",
    domain: "software",
    sections: {
      overview:
        "A mobile developer builds applications for phones and tablets, either natively for Android or iOS or with a cross-platform framework. The role cares about touch interaction, limited screen space, unreliable networks and battery use.",
      work:
        "Typical work includes building screens and navigation, storing data on the device, calling APIs, handling offline use, testing on different devices and screen sizes, and preparing releases for app stores.",
      skills:
        "Core skills are Kotlin for Android or Swift for iOS, or a cross-platform framework such as Flutter or React Native. Important supporting skills are interface layout, state management, working with APIs, local storage, platform design guidelines, and debugging on real devices.",
      start:
        "Choose one platform and build a simple complete app, such as a notes or expense tracker that saves data on the device. Then add a network call and handle the case where the network is unavailable. Publishing even a small app teaches the full release process.",
      related:
        "Mobile developers share many skills with frontend developers and can move between the two. Some specialise further in one platform, and others move towards backend development to build the services their apps use.",
    },
  },
  {
    id: "devops-engineer",
    title: "DevOps Engineer",
    domain: "software",
    sections: {
      overview:
        "A DevOps engineer builds and maintains the systems that take software from a developer's machine to reliable operation in production. The closely related site reliability engineer role focuses on keeping services available and fast.",
      work:
        "Typical work includes maintaining build and deployment pipelines, managing cloud infrastructure as code, setting up monitoring and alerts, responding to incidents, and removing repetitive manual work through automation.",
      skills:
        "Core skills are Linux, networking fundamentals, scripting, continuous integration and delivery, containers, and at least one cloud platform. Important supporting skills are infrastructure as code, monitoring and logging, security basics, and calm, systematic troubleshooting.",
      start:
        "Get comfortable on the Linux command line, then automate something real: write a pipeline that tests and deploys one of your own projects. Learn containers by packaging that project, and add basic monitoring. Understanding how applications are built makes the infrastructure work easier.",
      related:
        "DevOps engineers often come from backend development or system administration. Common directions are site reliability engineering, platform engineering and cloud security.",
    },
  },
  {
    id: "qa-engineer",
    title: "QA Engineer",
    domain: "software",
    sections: {
      overview:
        "A QA engineer, or software tester, finds problems before users do and helps a team build quality into its process. The role covers planning what to test, testing by hand, and writing automated tests.",
      work:
        "Typical work includes designing test cases from requirements, exploratory testing of new features, writing and maintaining automated tests, reporting bugs clearly with steps to reproduce them, and checking that fixed bugs stay fixed.",
      skills:
        "Core skills are test design, attention to detail, clear written communication, and automation with a programming language and a testing framework. Important supporting skills are API testing, basic SQL, understanding of how web applications work, and awareness of accessibility and performance.",
      start:
        "Practise on real applications: write test cases for a sign-up flow and report what you find as if to a developer. Learn one programming language well enough to automate those tests in a browser and against an API. Reading bug reports in open-source projects shows what good reports look like.",
      related:
        "QA engineers often move into test automation engineering, which is close to software development, or into backend development, DevOps or product roles, because testing builds broad knowledge of how a product behaves.",
    },
  },
  {
    id: "data-analyst",
    title: "Data Analyst",
    domain: "data-ai",
    sections: {
      overview:
        "A data analyst turns existing data into answers that help people make decisions. The role focuses on describing what has happened and why, and on communicating findings clearly to people who are not data specialists.",
      work:
        "Typical work includes pulling data with SQL, cleaning it, exploring it for patterns, building charts and dashboards, and writing up findings with a recommendation. Analysts spend much of their time clarifying the question being asked and checking that the data can be trusted.",
      skills:
        "Core skills are SQL, spreadsheets, descriptive statistics and data visualisation. Important supporting skills are a dashboard tool, Python or R for analysis, an understanding of the business area, and the ability to explain results simply and honestly.",
      start:
        "Learn SQL first and practise on public datasets. Complete two or three small analyses from question to written conclusion, with charts, and publish them. Learn basic statistics, especially averages, distributions and correlation, and practise explaining a finding in one paragraph.",
      related:
        "Data analysts often grow into data science by adding machine learning and deeper statistics, into analytics engineering or data engineering by focusing on pipelines, or into product and business roles that rely on data.",
    },
  },
  {
    id: "data-scientist",
    title: "Data Scientist",
    domain: "data-ai",
    sections: {
      overview:
        "A data scientist uses statistics and machine learning to answer questions and make predictions from data. Compared with a data analyst, the role puts more weight on modelling, experimentation and uncertainty.",
      work:
        "Typical work includes framing a problem so that data can answer it, preparing data, building and evaluating models, designing and analysing experiments such as A/B tests, and explaining results and their limits to decision makers.",
      skills:
        "Core skills are statistics and probability, Python with data libraries, SQL, and machine learning methods together with honest model evaluation. Important supporting skills are experiment design, data visualisation, and communicating uncertainty clearly.",
      start:
        "Build a base in statistics and Python, then complete end-to-end projects: define a question, prepare the data, train a simple model, evaluate it properly on held-out data and write up what it can and cannot do. Simple models that are well evaluated teach more than complex ones that are not.",
      related:
        "Data scientists commonly move towards machine learning engineering by focusing on putting models into production, or towards research and specialised fields such as natural language processing. Many start as data analysts.",
    },
  },
  {
    id: "ml-engineer",
    title: "Machine Learning Engineer",
    domain: "data-ai",
    sections: {
      overview:
        "A machine learning engineer builds and operates the software systems that train models and serve their predictions reliably. The role sits between data science and software engineering.",
      work:
        "Typical work includes building training and data pipelines, turning experimental models into dependable services, measuring model quality over time, reducing latency and cost, and increasingly building applications on large language models with retrieval and evaluation.",
      skills:
        "Core skills are strong software engineering in Python, machine learning fundamentals, a deep learning framework, and model evaluation. Important supporting skills are data pipelines, deployment with containers and cloud services, monitoring, and for language-model applications, prompt design, retrieval and systematic evaluation.",
      start:
        "Become a solid programmer first, then learn machine learning fundamentals. Take one model all the way: train it, wrap it in an API, deploy it, and measure its quality with a fixed evaluation set. Showing that you can evaluate and operate a model matters more than the model's complexity.",
      related:
        "Machine learning engineers usually come from backend development or data science. Nearby roles are data engineer, research engineer and MLOps or platform engineer.",
    },
  },
  {
    id: "data-engineer",
    title: "Data Engineer",
    domain: "data-ai",
    sections: {
      overview:
        "A data engineer builds the pipelines and storage that move data from where it is created to where analysts, data scientists and applications can use it. The role is responsible for data being complete, correct and on time.",
      work:
        "Typical work includes writing pipelines that extract, transform and load data, modelling tables in a data warehouse, scheduling and monitoring jobs, fixing data quality problems, and controlling cost and access.",
      skills:
        "Core skills are SQL, Python, data modelling, and pipeline and workflow tools. Important supporting skills are a cloud data warehouse, distributed processing concepts, testing data quality, and software engineering practices such as version control and code review.",
      start:
        "Get very good at SQL and comfortable in Python. Build a small pipeline that pulls data from a public API on a schedule, cleans it, loads it into a database and checks its quality. Learning how to model tables for analysis is as important as learning tools.",
      related:
        "Data engineers often come from backend development or data analysis. Common directions are analytics engineering, machine learning engineering and data platform or architecture roles.",
    },
  },
  {
    id: "ux-designer",
    title: "UX Designer",
    domain: "ui-ux",
    sections: {
      overview:
        "A UX designer shapes how a product works for the people using it: what steps a task takes, how information is organised and whether people can achieve their goal without confusion.",
      work:
        "Typical work includes talking to users, mapping user flows, sketching wireframes, building prototypes, running usability tests and refining the design from what is learned. UX designers work closely with product managers and developers throughout.",
      skills:
        "Core skills are user research basics, information architecture, interaction design, wireframing and prototyping, and usability testing. Important supporting skills are accessibility, clear writing for interfaces, a design tool such as Figma, and explaining design decisions with evidence.",
      start:
        "Learn the fundamentals of usability and practise on real problems: pick an everyday app, test it with three people, and redesign one flow based on what you saw. A portfolio should show your process and reasoning, including what you changed after testing, not only final screens.",
      related:
        "UX designers often become product designers by adding visual design, specialise as UX researchers or interaction designers, or move into product management.",
    },
  },
  {
    id: "ui-designer",
    title: "UI Designer",
    domain: "ui-ux",
    sections: {
      overview:
        "A UI designer designs the visual and interactive surface of a product: layout, typography, colour, components and their states. The aim is an interface that is clear, consistent and pleasant to use.",
      work:
        "Typical work includes designing screens and components, defining styles for type, colour and spacing, specifying states such as hover, focus, error and loading, maintaining a design system, and working with developers so the built result matches the design.",
      skills:
        "Core skills are visual hierarchy, typography, colour and contrast, layout and spacing, and component design in a tool such as Figma. Important supporting skills are accessibility, responsive design, design systems and tokens, and enough understanding of HTML and CSS to design what can be built.",
      start:
        "Study visual fundamentals, then practise by rebuilding well-made interfaces to understand their spacing and type. Design a small set of components with all their states and use them to assemble a few screens. Check contrast and keyboard focus from the beginning.",
      related:
        "UI designers often grow into product design by adding research and flow design, into design systems work, or towards frontend development as design engineers.",
    },
  },
  {
    id: "ux-researcher",
    title: "UX Researcher",
    domain: "ui-ux",
    sections: {
      overview:
        "A UX researcher studies the people who use a product so that teams can make decisions from evidence rather than assumption. The role plans studies, gathers data and turns it into findings a team can act on.",
      work:
        "Typical work includes planning research with clear questions, recruiting participants, running interviews and usability tests, designing surveys, analysing results, and presenting findings and their limits to designers, product managers and engineers.",
      skills:
        "Core skills are interviewing, usability testing, survey design, and qualitative and quantitative analysis. Important supporting skills are choosing the right method for a question, recognising bias in samples and questions, basic statistics, and clear storytelling.",
      start:
        "Practise the core methods on a small scale: interview five people about how they do a task, run a usability test on an existing app, and write a short report that separates what you observed from what you concluded. Learning to ask about past behaviour instead of opinions is an early key skill.",
      related:
        "UX researchers sometimes move into UX or product design, product management, or data analysis. People often enter research from psychology, social science or design backgrounds.",
    },
  },
  {
    id: "product-designer",
    title: "Product Designer",
    domain: "ui-ux",
    sections: {
      overview:
        "A product designer is responsible for a feature from the first understanding of the problem to the final interface. The role combines UX design, UI design and a view of what the product and business need.",
      work:
        "Typical work includes defining the problem with product managers, researching with users, designing flows and detailed screens, prototyping, testing, and following the feature through development and after release to see whether it worked.",
      skills:
        "Core skills are interaction design, visual design, prototyping and usability testing. Important supporting skills are product thinking, using data to judge outcomes, design systems, accessibility, and close collaboration with engineers.",
      start:
        "Build both sides: process skills such as research and flows, and craft skills such as layout and type. Take one project from a real problem to a tested prototype and document the decisions and trade-offs. Showing how a design changed in response to evidence is the strongest part of a portfolio.",
      related:
        "Product designers usually develop from UX or UI design. Later directions include leading design teams, specialising in design systems or research, and product management.",
    },
  },
];

export const GUIDES: Guide[] = [
  {
    id: "guide-analyst-vs-scientist",
    title: "Data analyst or data scientist?",
    body:
      "Both roles work with data, but with a different emphasis. A data analyst mainly explains what has happened using SQL, descriptive statistics and visualisation, and communicates it to decision makers. A data scientist puts more weight on prediction and experimentation, using statistics and machine learning. Data analysis is a common starting point, and analysts move towards data science by adding programming in Python, statistics and model evaluation.",
  },
  {
    id: "guide-ux-vs-ui",
    title: "UX design or UI design?",
    body:
      "UX design is about how a product works: the steps, structure and whether people can complete their task. UI design is about the visual and interactive surface: layout, type, colour and components. They overlap heavily, and a product designer does both. People who enjoy research and problem framing tend towards UX, and people who enjoy visual craft and detail tend towards UI.",
  },
  {
    id: "guide-frontend-vs-backend",
    title: "Frontend or backend development?",
    body:
      "Frontend development builds what users see and interact with in the browser, so it rewards interest in interfaces, design detail and accessibility. Backend development builds APIs, business logic and data storage, so it rewards interest in data, correctness and systems. Both need programming fundamentals, Git and testing, and a full-stack developer works on both sides. Trying a small project of each kind is the most reliable way to find a preference.",
  },
  {
    id: "guide-using-results",
    title: "How to use an assessment result",
    body:
      "An assessment score is an estimate from a small number of questions, so treat it as a starting point, not a verdict. Look at the topic breakdown to see which areas were weakest, read the explanations for the questions you missed, and choose one or two topics to study before trying again. A higher score in a domain suggests related roles may suit your current skills, but interest and practice matter as much as the score.",
  },
];

/** A retrievable passage. `id` is what the model cites and what messages store. */
export type Passage = { id: string; title: string; section: string; text: string };

export const PASSAGES: Passage[] = [
  ...ROLES.flatMap((role) =>
    (Object.keys(SECTIONS) as SectionKey[]).map((key) => ({
      id: `${role.id}#${key}`,
      title: role.title,
      section: SECTIONS[key],
      text: role.sections[key],
    })),
  ),
  ...GUIDES.map((g) => ({ id: g.id, title: g.title, section: "Guide", text: g.body })),
];

export const PASSAGE_BY_ID = new Map(PASSAGES.map((p) => [p.id, p]));
