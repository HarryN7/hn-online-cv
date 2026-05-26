// Single source of truth for CV content.
// Edit this file when something changes — the page will render from it.

const profile = {
  name: 'Harry Nguyen',
  title: 'Technology Manager',
  location: 'Canberra, Australia',
  // Contact details are split to make casual bot-scraping harder.
  // The full address/number is assembled in JS only when the user clicks
  // "Show email" / "Show phone" — so the literal strings never appear
  // in the rendered HTML for crawlers to pick up.
  emailUser: 'harry.nguyen17',
  emailDomain: 'gmail.com',
  phoneParts: ['0468', '434', '786'],
  linkedin: 'https://www.linkedin.com/in/HarryNguyen17',
  about:
    "Technology Manager with with more than 13 years of ICT experience, delivering for major Australian and New Zealand government clients while with Accenture. I have led teams of up to 30+ people across the full software lifecycle — from project estimation and design through to release management and large-scale IT operations. I combine technical depth with the interpersonal skills to align stakeholders, drive continuous improvement, and deliver desired outcomes clients.",
};

// Hero credentials — each item is a single statement.
const heroStats = [
  '13+ years of ICT experience',
  'Highly experienced in ICT delivery and ICT operations management',
  'Australian Citizenship',
  'NV1 Cleared',
];

// Each Accenture role. Newest first.
// `start` / `end` are YYYY-MM. Use 'present' for end if ongoing.
const accentureRoles = [
  {
    id: 'ops-mgr',
    role: 'IT Operations Manager',
    client: 'Australian Tax',
    clientFull: 'Australian Tax',
    program: 'Enterprise Operations Team',
    start: '2024-11',
    end: '2025-10',
    teamSize: '30+',
    color: '#00B5C3',
    summary:
      'Led a 30+ person team to transition into a complex technical landscape from previous managed service incumbent to provide ICT platform support for 50+ enterprise applications, 600+ servers, and enterprise backup & batch management across the organisation.',
    highlights: [
      'Led multiple successful complex enterprise tooling cutovers covering 50+ applications and 600+ servers, with scope shifting up to the final week of each cutover. Received direct positive feedback from senior client executives.',
      'Stood up a new ICT managed-provider service in a complex multi-vendor environment — covering application support, infrastructure support, batch management, and backup management across the organisation.',
      'Managed a newly-formed team through stablisation of BAU operations to meet demanding contract SLAs while learning a complex technical landscape, including peak business-critical delivery periods.',
      'Managed team through adoption of automation and AI to optimise operational work and reduce running costs.',
      'Directly led team ranging from juniors to experts in their field; the team finished the year with zero voluntary exits.',
      'Built trusted working relationships with senior client executives and reported to multiple Accenture Directors daily.',
    ],
    keyWork: [
      'Complex transition-in: scope management, resource ramp-up, ServiceNow design, documentation, knowledge transfer, executive reporting, cutover planning.',
      'Co-organised internal account engagement events including cultural celebrations and panel discussions.',
    ],
    tech: ['ServiceNow', 'Enterprise Backup', 'Enterprise Batch', 'AWS', 'Linux/Windows'],
  },
  {
    id: 'release-mgr',
    role: 'Release Manager',
    client: 'Australian Tax',
    clientFull: 'Australian Tax',
    program: 'Digital Services Team',
    start: '2023-05',
    end: '2024-11',
    teamSize: '300+ branch (12 scrum teams)',
    color: '#0094A7',
    summary:
      'Owned end-to-end ICT release management for a 300+ person branch — coordinating 12 scrum teams releasing functional changes that impact front-facing applications used by millions of Australians.',
    highlights: [
      'Led successful delivery of 6+ major releases spanning ~50 features per release across 10 major Australia-wide applications.',
      'Reshaped the branch\'s release management capability — leadership credited the change with positively shifting how the function is perceived.',
      'Coordinated the release of 300+ features into production across roughly 50 releases, including several significant cross-branch programs.',
      'Built a branch-wide release information hub on SharePoint — a single source of truth for release information that reached 1000+ views in its first two months.',
      'Introduced a "Release Tracker" concept, consolidating previously siloed assurance activities (Test, Business Readiness, Security) into one shared view aligned to a single source of truth for scope.',
      'Created standardised executive email templates promoted by the Delivery Director for branch-wide use.',
      'Significant contributor to a major recompete Request For Quote — drafted key sections, coordinated review of 100+ CVs, and organised a senior leadership photoshoot.',
    ],
    keyWork: [
      'Delivery planning, scope governance, release assurance, business readiness, executive release-summary presentations.',
      'Authored a release strategy for a major program, approved by senior client leadership.',
      'Acted as pseudo-lead for the Release Management Group — first consulted on changes to delivery processes and governance.',
    ],
    tech: ['Azure DevOps', 'SharePoint', 'Confluence', 'JIRA', 'SAFe Agile'],
  },
  {
    id: 'env-mgr',
    role: 'Environment Manager',
    client: 'Australian Tax',
    clientFull: 'Australian Tax',
    program: 'Digital Operations Team',
    start: '2020-06',
    end: '2023-03',
    teamSize: '20+ (within 30+ person Ops team)',
    color: '#0076A7',
    summary:
      'Led the Environment Management function within a 30+ person IT Operations team — maintaining critical applications used by millions of Australians across 15+ test environments for 100+ users',
    highlights: [
      'Delivered ~$1M AUD/yr in infrastructure cost savings through initiatives including environment availability scheduling, RDS multi-AZ → single-AZ in performance environments, S3 lifecycle policies, and Christmas-period shutdowns.',
      'Co-managed delivery of a major data centre migration program — coordinating SMEs to build new environments and decommission on-premise infrastructure for ~$430K/yr in additional savings.',
      'Drove the urgent fix for a critical environment-setup issue blocking the program — coordinated 15+ people to resolve a complex issue within a week.',
      'Self-initiated an engagement with a developer to build a custom incident dashboard providing real-time tracking of bugs and incidents in a single view across multiple tools.',
      'Took on additional role as Resourcing & Onboarding Manager — onboarded 44 people and managed 71 roll-offs in a 9-month window.',
      'Recognised at all levels — including personal thank-you emails from senior client executives and multiple Accenture Managing Directors.',
    ],
    keyWork: [
      'Incident triage and troubleshooting across 10+ programs of work.',
      'Created technical documentation and diagrams shared with senior client executives.',
      'Co-built a Cloud Posture & Cost Optimisation Assessment deck with a Managing Director — recommended for executive-level presentation.',
    ],
    tech: ['AWS', 'RDS', 'S3', 'TFS', 'ServiceNow', 'CloudWatch'],
  },
  {
    id: 'ird-tax',
    role: 'Various Roles: Resource Planning, Defect Manager, Integration Designer, Dev Team Manager',
    client: 'New Zealand Tax',
    clientFull: 'New Zealand Tax',
    program: 'Large-scale Tax System Transformation',
    start: '2016-11',
    end: '2020-05',
    teamSize: 'Mixed Accenture + client developers',
    color: '#2D8B6A',
    summary:
      'Spent nearly 4 years on one of the southern hemisphere\'s largest ICT transformation program, gaining hands-on experience across the full software development lifecycle. Performed in several roles within project estimation, design, defect management, and development phases',
    highlights: [
      'Regularly travelled from Australia to be mainly based on-site in New Zealand for the program',
      'Key contributor in the work-effort estimation team for a multi-million dollar program.',
      'Automated a slow, error-prone IT defect resolution process — measurable improvement in throughput and quality.',
      'Led a small development team responsibile for critical front-facing application to successfully deliver two releases.',
    ],
    keyWork: [
      'Roles rotated: Resource Planning → Defect Manager → Integration Designer → Dev Team Manager.',
      'Based on-site in New Zealand.',
    ],
    tech: ['Integration design', 'Defect management tooling', 'Estimation models'],
  },
  {
    id: 'defence-hr',
    role: 'Various Roles: Packaged Software Design, Data Conversion, ITIL Assessment, Batch Schedule Testing',
    client: 'Defence',
    clientFull: 'Australian Department of Defence',
    program: 'Large-scale system modernisation',
    start: '2012-02',
    end: '2015-11',
    teamSize: 'Project teams across multiple workstreams',
    color: '#9A6B3F',
    summary:
      'First client engagement at Accenture, spanning nearly 4 years across multiple roles in a large ICT modernisation programme.',
    highlights: [
      'Authored a configuration management maturity assessment and improvement recommendation report for the client.',
      'Completed data conversion designs for a large system implementation.',
      'Contributed to the software design team and the batch scheduling test team.',
    ],
    keyWork: [
      'Roles included: Packaged Software Design, Data Conversion, ITIL Maturity Assessment, Batch Schedule Testing.',
    ],
    tech: ['Packaged software', 'Batch scheduling', 'ITIL'],
  },
];

const earlierRoles = [
  { role: 'Language Exchange Event City Manager', period: 'Feb 2016 – Nov 2016' },
  { role: 'English Teacher', period: 'Feb 2016 – Nov 2016' },
  { role: 'Supermarket Nightfill Staff', period: 'Dec 2009 – Sep 2011' },
  { role: "Kids' Soccer Coach", period: 'Mar 2011 – Jul 2011' },
  { role: 'University Ambassador', period: 'Jul 2009 – Dec 2009' },
  { role: 'Indoor Soccer Referee', period: 'Oct 2008 – Feb 2009' },
];

const skills = {
  delivery: {
    title: 'Delivery & Leadership',
    items: [
      'Release Management',
      'IT Operations Management',
      'Environment Management',
      'Team leadership (30+ people)',
      'Stakeholder management (senior executive)',
      'Continuous improvement',
      'Automation and AI Planning',
      'Resource & onboarding management',
      'Scrum / SAFe Agile',
    ],
  },
  technical: {
    title: 'Technical & Tools',
    // Either `items: [...]` (flat chip list) OR `groups: [{ level, items }]`
    // (chips grouped under a small heading per skill level). The renderer
    // handles both shapes.
    groups: [
      { level: 'Highly Advanced', items: ['Microsoft Excel'] },
      { level: 'Advanced', items: ['Microsoft PowerPoint', 'Microsoft Word'] },
      {
        level: 'Proficient',
        items: [
          'AWS',
          'VBA',
          'ServiceNow',
          'JIRA',
          'Confluence',
          'Azure DevOps / TFS',
          'SharePoint',
          'Power BI',
        ],
      },
      { level: 'Basic', items: ['Azure'] },
    ],
  },
};

const softSkills = [
  {
    title: 'Leadership',
    body: 'Led mixed Accenture + client teams across multiple roles and programs — most recently a 30+ person operations team with zero voluntary exits in FY25.',
  },
  {
    title: 'Communication',
    body: 'Comfortable presenting to senior executive audiences. Authored email templates and reporting formats promoted by Delivery Directors for branch-wide use.',
  },
  {
    title: 'Continuous improvement',
    body: 'Consistent track record of finding, designing and implementing improvements — from dashboards (1000+ views) to cost-saving initiatives ($1M+/yr).',
  },
  {
    title: 'Organisation',
    body: 'OneNote / spreadsheet enthusiast — I keep notes on everything, both professionally and personally.',
  },
  {
    title: 'Self-learning',
    body: 'Self-taught multiple foreign languages and several cloud certifications outside work hours. Learning how to self-learn changed my life.',
  },
  {
    title: 'Reliability',
    body: 'Strong intrinsic motivation to exceed expectations — happy to step in where needed, including covering senior roles during leave.',
  },
];

const certifications = [
  {
    name: 'AWS Solutions Architect – Associate',
    date: '20 Jul 2022',
    url: 'https://www.credly.com/badges/9390552f-f942-4f67-bdf7-207407991619?source=linked_in_profile',
  },
  {
    name: 'AWS Cloud Practitioner',
    date: '27 Mar 2022',
    url: 'https://www.youracclaim.com/badges/44c42b09-db04-42a5-b09e-6dbc852759cf/public_url',
  },
  {
    name: 'Microsoft Azure Fundamentals',
    date: '17 Jun 2021',
    url: 'https://www.youracclaim.com/badges/783048c2-bfd0-4e5a-b796-e08dc5d9dfc2/public_url',
  },
  {
    name: 'ICAgile Certified Professional',
    date: '07 Feb 2020',
    url: null,
  },
];

const education = [
  {
    institution: 'University of Canberra',
    qualification: 'Bachelor of Information Technology',
    year: 'Graduated 2011',
    detail: 'GPA: 5.5 · 3 High Distinctions, 8 Distinctions, 9 Credits, 2 Passes',
  },
  {
    institution: 'Dickson College',
    qualification: 'Year 12 Certificate',
    year: 'Graduated 2008',
    detail: null,
  },
];

const languages = [
  { name: 'English', level: 'Native' },
  { name: 'Spanish', level: 'Conversational' },
  { name: 'Vietnamese', level: 'Conversational' },
  { name: 'Mandarin Chinese', level: 'Conversational' },
];

const interests = [
  'New technology and AI',
  'Studying languages',
  'Sports — soccer, tennis, chess, table tennis, badminton',
  'Travelling and volunteering overseas',
  'Parenting',
  'Continuous self-improvement',
];

const volunteerWork = [
  {
    title: 'Volunteer work in Vietnam, Costa Rica, and Colombia',
    body: 'Taught English to less privileged children, community development projects, assisting elderly and homeless people.',
  },
  {
    title: 'iTrack online mentoring',
    body: 'Mentor for The Smith Family.',
  },
];
