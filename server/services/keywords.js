/**
 * Local skill/keyword extraction. Used by the heuristic analyzer (when no AI key
 * is configured or the model call fails) and as a cheap pre-filter for job-fit
 * scoring. Each entry is a canonical label plus aliases matched case-insensitively
 * on word boundaries.
 */

const SKILLS = {
  // Languages
  JavaScript: ['javascript', 'js', 'es6', 'ecmascript'],
  TypeScript: ['typescript', 'ts'],
  Python: ['python'],
  Java: ['java'],
  'C++': ['c\\+\\+', 'cpp'],
  'C#': ['c#', 'csharp'],
  Go: ['golang', 'go lang'],
  Rust: ['rust'],
  Ruby: ['ruby'],
  PHP: ['php'],
  Kotlin: ['kotlin'],
  Swift: ['swift'],
  Scala: ['scala'],
  SQL: ['sql'],
  Bash: ['bash', 'shell scripting'],
  HTML: ['html', 'html5'],
  CSS: ['css', 'css3'],
  Dart: ['dart'],
  MATLAB: ['matlab'],

  // Frontend
  React: ['react', 'react\\.js', 'reactjs'],
  'Next.js': ['next\\.js', 'nextjs'],
  Angular: ['angular', 'angularjs'],
  'Vue.js': ['vue', 'vue\\.js', 'vuejs'],
  Svelte: ['svelte'],
  Redux: ['redux'],
  Zustand: ['zustand'],
  'Tailwind CSS': ['tailwind', 'tailwindcss', 'tailwind css'],
  Sass: ['sass', 'scss'],
  Vite: ['vite'],
  Webpack: ['webpack'],
  'React Native': ['react native'],
  Flutter: ['flutter'],

  // Backend
  'Node.js': ['node', 'node\\.js', 'nodejs'],
  Express: ['express', 'express\\.js', 'expressjs'],
  NestJS: ['nestjs', 'nest\\.js'],
  Django: ['django'],
  Flask: ['flask'],
  FastAPI: ['fastapi'],
  'Spring Boot': ['spring boot', 'springboot', 'spring framework'],
  '.NET': ['\\.net', 'dotnet', 'asp\\.net'],
  'Ruby on Rails': ['rails', 'ruby on rails'],
  GraphQL: ['graphql'],
  'REST APIs': ['restful', 'rest api', 'rest apis', 'restful api', 'restful apis', 'rest services'],
  gRPC: ['grpc'],
  Microservices: ['microservices', 'microservice', 'micro-services'],
  WebSockets: ['websocket', 'websockets', 'socket\\.io'],

  // Data stores
  MongoDB: ['mongodb', 'mongo', 'mongoose'],
  PostgreSQL: ['postgresql', 'postgres'],
  MySQL: ['mysql'],
  Redis: ['redis'],
  SQLite: ['sqlite'],
  DynamoDB: ['dynamodb'],
  Elasticsearch: ['elasticsearch', 'elastic search', 'opensearch'],
  Cassandra: ['cassandra'],
  Firebase: ['firebase', 'firestore'],
  Kafka: ['kafka'],
  RabbitMQ: ['rabbitmq'],

  // Cloud / DevOps
  AWS: ['aws', 'amazon web services', 'ec2', 's3', 'lambda'],
  Azure: ['azure'],
  GCP: ['gcp', 'google cloud'],
  Docker: ['docker', 'containers', 'containerization'],
  Kubernetes: ['kubernetes', 'k8s'],
  Terraform: ['terraform'],
  'CI/CD': ['ci/cd', 'ci cd', 'continuous integration', 'continuous delivery', 'continuous deployment'],
  'GitHub Actions': ['github actions'],
  Jenkins: ['jenkins'],
  Linux: ['linux', 'unix'],
  Nginx: ['nginx'],
  Git: ['git', 'github', 'gitlab', 'bitbucket'],
  Vercel: ['vercel'],
  Serverless: ['serverless'],

  // Testing / quality
  Jest: ['jest'],
  Cypress: ['cypress'],
  Playwright: ['playwright'],
  Selenium: ['selenium'],
  'Unit Testing': ['unit testing', 'unit tests', 'tdd', 'test-driven'],
  Mocha: ['mocha'],
  PyTest: ['pytest'],

  // Data / ML
  'Machine Learning': ['machine learning', 'ml'],
  'Deep Learning': ['deep learning'],
  TensorFlow: ['tensorflow'],
  PyTorch: ['pytorch'],
  'scikit-learn': ['scikit-learn', 'sklearn'],
  Pandas: ['pandas'],
  NumPy: ['numpy'],
  NLP: ['nlp', 'natural language processing'],
  'Computer Vision': ['computer vision', 'opencv'],
  LLMs: ['llm', 'llms', 'large language models', 'generative ai', 'genai'],
  LangChain: ['langchain', 'langgraph'],
  Spark: ['spark', 'pyspark'],
  Hadoop: ['hadoop'],
  Airflow: ['airflow'],
  ETL: ['etl', 'data pipelines', 'data pipeline'],
  Tableau: ['tableau'],
  'Power BI': ['power bi', 'powerbi'],
  Excel: ['ms excel', 'microsoft excel', 'spreadsheets', 'excel spreadsheets'],
  Statistics: ['statistics', 'statistical'],
  'Data Analysis': ['data analysis', 'data analytics'],
  Snowflake: ['snowflake'],

  // Practices / concepts
  Agile: ['agile', 'scrum', 'kanban'],
  'System Design': ['system design', 'distributed systems', 'scalable systems'],
  'Data Structures': ['data structures', 'algorithms'],
  OOP: ['oop', 'object-oriented', 'object oriented'],
  Security: ['security', 'owasp', 'authentication', 'authorization', 'oauth', 'jwt'],
  Accessibility: ['accessibility', 'a11y', 'wcag'],
  'Responsive Design': ['responsive design', 'responsive web design', 'mobile-first'],
  'UI/UX': ['ui/ux', 'ux', 'user experience', 'figma'],
  'Performance Optimization': ['performance optimization', 'performance tuning', 'optimization'],
  Observability: ['observability', 'monitoring', 'logging', 'prometheus', 'grafana', 'datadog'],
  'API Design': ['api design'],
  'Product Management': ['product management', 'roadmap'],
  'Project Management': ['project management', 'jira'],

  // Soft skills (kept narrow to avoid noise)
  Communication: ['communication', 'communicate'],
  Leadership: ['leadership', 'led a team', 'mentoring', 'mentored', 'mentor'],
  Collaboration: ['collaboration', 'cross-functional', 'collaborate', 'collaborated'],
  'Problem Solving': ['problem solving', 'problem-solving'],
  Stakeholder: ['stakeholder', 'stakeholders'],
};

// Build one regex per canonical skill. Aliases may contain regex syntax on purpose
// (e.g. C++ escaping). Boundaries handle symbols like "c#" / ".net" and stop "js"
// matching inside "node.js" or "java" inside "javascript".
const MATCHERS = Object.entries(SKILLS).map(([label, aliases]) => ({
  label,
  regex: new RegExp(`(?:^|[^a-z0-9+#.])(?:${aliases.join('|')})(?![a-z0-9+#])`, 'gi'),
}));

/** Soft skills are reported, but weighted lower than hard skills when scoring. */
const SOFT_SKILLS = new Set(['Communication', 'Leadership', 'Collaboration', 'Problem Solving', 'Stakeholder', 'Agile']);

/**
 * Count occurrences of each known skill in `text`.
 * @returns {Map<string, number>} canonical label -> count
 */
export const extractSkills = (text) => {
  const counts = new Map();
  if (!text) return counts;
  const haystack = ` ${text.toLowerCase()} `;
  for (const { label, regex } of MATCHERS) {
    regex.lastIndex = 0;
    const matches = haystack.match(regex);
    if (matches?.length) counts.set(label, matches.length);
  }
  return counts;
};

export const isSoftSkill = (label) => SOFT_SKILLS.has(label);

/** True if `text` mentions the canonical skill (or one of its aliases). */
export const mentionsSkill = (text, label) => {
  const matcher = MATCHERS.find((m) => m.label === label);
  if (!matcher || !text) return false;
  matcher.regex.lastIndex = 0;
  return matcher.regex.test(` ${text.toLowerCase()} `);
};

const STOPWORDS = new Set(
  `a about above after again against all also am an and any are as at be because been before being below between both
  but by can could did do does doing down during each etc few for from further had has have having he her here hers
  him his how i if in into is it its itself just me more most my no nor not of off on once only or other our ours out
  over own same she should so some such than that the their theirs them then there these they this those through to
  too under until up very was we were what when where which while who whom why will with would you your yours
  role team work working company job candidate candidates position looking ideal including strong experience years
  year ability able skills skill knowledge understanding etc new well using use used across within must plus preferred
  required requirements responsibilities qualifications nice benefits salary apply opportunity join us our we're you'll
  we'll who'll environment various related relevant equivalent degree bachelor bachelors master masters field minimum
  excellent good great highly level based help build develop support ensure provide make day days time full part
  per range offer include includes etc e.g i.e`.split(/\s+/)
);

/**
 * Pick out frequent non-stopword terms (unigrams + bigrams) from a job description
 * that are not already known skills — e.g. domain words like "payments", "compliance".
 */
export const extractKeyTerms = (text, { limit = 12, exclude = new Set() } = {}) => {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9+#./\s-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^[-./]+|[-./]+$/g, ''))
    .filter((w) => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w));

  const counts = new Map();
  const bump = (term, by = 1) => counts.set(term, (counts.get(term) || 0) + by);
  for (let i = 0; i < words.length; i += 1) {
    bump(words[i]);
    if (i + 1 < words.length) bump(`${words[i]} ${words[i + 1]}`, 1.5);
  }

  const excluded = new Set([...exclude].map((e) => e.toLowerCase()));
  return [...counts.entries()]
    .filter(([term, count]) => count >= 2 && !excluded.has(term))
    .filter(([term]) => !extractSkills(term).size) // skills are handled separately
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit * 2)
    // Drop unigrams already covered by a chosen bigram.
    .reduce((acc, [term]) => {
      if (acc.length >= limit) return acc;
      if (acc.some((t) => t.includes(term) || term.includes(t))) return acc;
      acc.push(term);
      return acc;
    }, []);
};

export const SKILL_LABELS = Object.keys(SKILLS);
