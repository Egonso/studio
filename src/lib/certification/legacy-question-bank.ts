import type { ExamDefinition, ExamQuestion, ExamSection } from './types';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const rawExamSections: Array<
  Omit<ExamSection, 'id' | 'questions'> & {
    questions: Array<Omit<ExamQuestion, 'id'>>;
  }
> = [
  {
    title: "Module 1 \u2013 Technical Essentials",
    questions: [
      {
        text: "What is the fundamental idea behind neural networks in AI?",
        options: [
          "They store huge databases efficiently.",
          "They mimic the structure and function of the human brain to learn from data.",
          "They perform complex mathematical calculations faster than conventional computers.",
          "They are mainly responsible for encrypting data."
        ],
        correctAnswer: 1,
        explanation: "Neural networks are inspired by biological neural networks and use layers of \u2018neurons\u2019 with weighted connections to recognise patterns in data, mimicking a core function of human intelligence."
      },
      {
        text: "What is meant by \u2018tokenisation\u2019 in the context of language models?",
        options: [
          "Encrypting text messages.",
          "Breaking text down into smaller units (words, sub-words).",
          "Converting text into a list of numbers (vector).",
          "Training a model on specific technical terms."
        ],
        correctAnswer: 1,
        explanation: "Tokenisation is the process of breaking input text into basic units that the model can process."
      },
      {
        text: "Which technology is central to the performance of modern LLMs such as GPT?",
        options: [
          "Blockchain technology.",
          "Relational databases.",
          "The Transformer architecture with self-attention.",
          "Decision-tree algorithms."
        ],
        correctAnswer: 2,
        explanation: "The Transformer architecture, especially the self-attention mechanism, enables models to understand and weight contexts and relationships between words even across longer passages of text."
      },
      {
        text: "What is the main purpose of Retrieval Augmented Generation (RAG)?",
        options: [
          "Training AI models with entirely new data.",
          "Generating the most creative and fictional texts possible.",
          "Combining LLM capabilities with the retrieval of relevant information from an external knowledge base.",
          "Automatically improving grammar in AI-generated texts."
        ],
        correctAnswer: 2,
        explanation: "RAG allows an LLM to retrieve specific information before generating a response, reducing hallucinations and basing answers on verified sources."
      },
      {
        text: "Which potential advantage of offline or open-source LLMs is often highlighted for SMEs?",
        options: [
          "They are always more powerful than cloud-based models like GPT-4.",
          "They potentially offer more control over data protection and data security, as data does not need to leave the organisation.",
          "They require absolutely no technical expertise to set up.",
          "They are automatically updated with the latest information every day."
        ],
        correctAnswer: 1,
        explanation: "Because the models can be run locally, sensitive company data can be better protected as it does not need to be sent to external cloud providers."
      },
      {
        text: "What are \u2018hallucinations\u2019 in AI models?",
        options: [
          "The ability of the AI to generate creative images.",
          "Error messages that the system produces when overloaded.",
          "When the AI generates convincing-sounding but factually incorrect or fabricated information.",
          "Visual effects that may occur when interacting with the AI."
        ],
        correctAnswer: 2,
        explanation: "Hallucinations occur when an LLM fills knowledge gaps with plausible-sounding but inaccurate or fabricated statements."
      },
      {
        text: "Which data-protection principle is particularly relevant in AI development, meaning privacy is considered from the outset?",
        options: [
          "Privacy by Obscurity.",
          "Privacy by Policy.",
          "Privacy by Design.",
          "Privacy by Default."
        ],
        correctAnswer: 2,
        explanation: "Privacy by Design (Article 25 GDPR) requires that data-protection aspects are implemented technically and organisationally from the very conception and development of systems."
      },
      {
        text: "What is a possible \u2018bias\u2019 in an AI system?",
        options: [
          "A deliberately built-in malfunction.",
          "The speed at which the system learns.",
          "A necessary feature to improve accuracy.",
          "The tendency of the system to systematically disadvantage certain groups or make incorrect assumptions, often due to imbalanced training data."
        ],
        correctAnswer: 3,
        explanation: "Bias in AI refers to systematic distortions that cause the AI to deliver unfair, inaccurate or discriminatory results."
      },
      {
        text: "What role does the \u2018system prompt\u2019 fulfil in prompt engineering?",
        options: [
          "It provides the AI with a role, instructions or context before the user prompt is processed.",
          "It contains the user\u2019s actual question to the AI.",
          "It is a summary of the AI\u2019s response.",
          "It is used solely for troubleshooting."
        ],
        correctAnswer: 0,
        explanation: "The system prompt is used to steer the AI\u2019s behaviour by giving it a role or basic instructions, setting the framework for the interaction."
      },
      {
        text: "What does \u2018Security by Design\u2019 mean in the context of AI systems?",
        options: [
          "Security measures are integrated into the AI system\u2019s architecture from the outset.",
          "The AI is supposed to learn to protect itself from hackers.",
          "The system\u2019s design should look as attractive as possible.",
          "Only security experts are allowed to use the system."
        ],
        correctAnswer: 0,
        explanation: "Analogous to Privacy by Design, Security by Design means that security aspects are considered and built in as an integral part throughout the entire development cycle."
      },
      {
        text: "Which statement about open-source LLMs is correct?",
        options: [
          "They often offer more flexibility and customisation options than proprietary models.",
          "Their source code is not publicly accessible.",
          "They are always free to use, without any restrictions.",
          "They are developed exclusively by large technology corporations."
        ],
        correctAnswer: 0,
        explanation: "Because the code is accessible, open-source LLMs can be adapted or modified by companies for specific purposes, which is usually not possible with closed models."
      },
      {
        text: "In the analogy \u2018Model = Engine, Tool = Car\u2019: What would a \u2018Super-Agent\u2019 be?",
        options: [
          "An intelligent driver who coordinates various cars (tools) to solve a complex task.",
          "A particularly powerful engine (model).",
          "A car with many different engines.",
          "A very simple toolbox (tool)."
        ],
        correctAnswer: 0,
        explanation: "A Super-Agent is a higher-level system that orchestrates various specialised tools to process a complex workflow."
      }
    ],
    videos: [
      "Introduction to AI Fundamentals - Momo",
      "AI Ethics - Zoltan",
      "The AI Act - Elisabeth"
    ]
  },
  {
    title: "Module 2 \u2013 Legal Foundations",
    questions: [
      {
        text: "What is the primary regulatory approach of the EU AI Act?",
        options: [
          "A ban on all AI use in the EU.",
          "A technology-neutral, risk-based approach.",
          "A purely voluntary commitment for companies.",
          "A tax on AI-generated revenue."
        ],
        correctAnswer: 1,
        explanation: "The AI Act classifies AI systems according to their potential risk and attaches different obligations, rather than regulating specific technologies."
      },
      {
        text: "Which risk category in the AI Act carries the most extensive obligations for providers?",
        options: [
          "Minimal risk.",
          "Limited risk (transparency obligations).",
          "High-risk.",
          "Prohibited practices."
        ],
        correctAnswer: 2,
        explanation: "Providers of high-risk AI systems must meet stringent requirements regarding risk management, data quality, documentation and human oversight, among others."
      },
      {
        text: "Which of the following AI applications falls under prohibited practices according to the AI Act (Art. 5)?",
        options: [
          "A customer-service chatbot.",
          "An AI system for quality control in production.",
          "A system that uses subliminal techniques to influence a person\u2019s behaviour and cause them harm.",
          "An AI-based system for supply-chain optimisation."
        ],
        correctAnswer: 2,
        explanation: "Article 5 explicitly prohibits AI systems that use manipulative or exploitative techniques to substantially distort behaviour and are likely to cause harm."
      },
      {
        text: "What is NOT one of the main requirements for providers of high-risk AI systems under the AI Act?",
        options: [
          "Establishing a risk management system.",
          "Using exclusively open-source software components.",
          "Ensuring high data quality and data governance.",
          "Implementing human oversight."
        ],
        correctAnswer: 1,
        explanation: "The AI Act does not prescribe what type of software components (open-source or proprietary) must be used; it sets requirements for the overall system."
      },
      {
        text: "An SME uses standard software for workforce scheduling. When could this system be classified as high-risk?",
        options: [
          "When the software was expensive.",
          "When it is cloud-based.",
          "When it falls under the area \u2018Employment, human-resources management\u2019 in Annex III AND has significant effects on careers or working conditions.",
          "When it comes from a US company."
        ],
        correctAnswer: 2,
        explanation: "The high-risk classification depends on whether the application falls within one of the areas listed in Annex III and has potentially significant impacts."
      },
      {
        text: "Which obligation typically falls on the deployer of a high-risk AI system?",
        options: [
          "To re-certify the system themselves.",
          "To create entirely new technical documentation from scratch.",
          "To use the system in accordance with the provider\u2019s instructions for use and to monitor its operation.",
          "The system must necessarily be operated on in-house hardware."
        ],
        correctAnswer: 2,
        explanation: "Deployers of high-risk systems must ensure intended use and carry out human oversight and monitoring, among other obligations."
      },
      {
        text: "What is the primary purpose of the technical documentation of a high-risk AI system?",
        options: [
          "As marketing material for the product.",
          "As evidence to market surveillance authorities that the system meets the requirements of the AI Act.",
          "As training material for end users.",
          "As a basis for the system\u2019s pricing."
        ],
        correctAnswer: 1,
        explanation: "Technical documentation is the central element for demonstrating the system\u2019s conformity with the legal requirements."
      },
      {
        text: "An AI system analyses job applications. Why is data quality (data governance) particularly critical here?",
        options: [
          "Because applicants would otherwise have to wait too long for a response.",
          "Because imbalanced or faulty training data can lead to discriminatory recommendations (bias).",
          "Because the AI would otherwise make too many spelling mistakes.",
          "Because storing the data is very expensive."
        ],
        correctAnswer: 1,
        explanation: "In the HR domain the risk is high that historical bias in the data is learned and reproduced by the AI, leading to unfair discrimination."
      },
      {
        text: "What does \u2018post-market monitoring\u2019 mean for providers of high-risk AI systems?",
        options: [
          "Discontinuing marketing for the product after sale.",
          "Actively monitoring the system\u2019s performance and safety after placing it on the market and taking corrective action where necessary.",
          "Observing the system\u2019s price after market launch.",
          "Collecting only positive customer feedback."
        ],
        correctAnswer: 1,
        explanation: "The provider must establish a process to collect data from real-world use, review the system for new risks and, where appropriate, issue updates or recalls."
      },
      {
        text: "The AI Act is an EU Regulation. What does this mean for member states such as Germany?",
        options: [
          "Germany must first transpose the AI Act into its own national law.",
          "The Regulation applies directly in Germany and takes precedence over conflicting national law.",
          "Each federal state can enact its own, differing AI rules.",
          "The Regulation is merely a non-binding recommendation for German companies."
        ],
        correctAnswer: 1,
        explanation: "EU Regulations apply directly in every member state and do not require transposition into national law."
      },
      {
        text: "Which objective does the AI Act NOT primarily pursue?",
        options: [
          "Protecting the fundamental rights and safety of EU citizens.",
          "Promoting innovation and the acceptance of AI in the EU.",
          "Creating a unified internal market for AI systems.",
          "Establishing standards for the energy efficiency of AI algorithms."
        ],
        correctAnswer: 3,
        explanation: "Although sustainability is mentioned, the AI Act\u2019s main focus is on safety, fundamental rights and market regulation, not on specific energy-efficiency standards."
      },
      {
        text: "The AI Act\u2019s rules take effect on a staggered basis. Which rules are expected to become effective first?",
        options: [
          "The obligations for high-risk systems.",
          "The transparency obligations for chatbots and deepfakes.",
          "The prohibitions on certain AI practices (Art. 5).",
          "The rules for GPAI models with systemic risk."
        ],
        correctAnswer: 2,
        explanation: "According to the timeline, the prohibitions under Article 5 come into force just 6 months after the Regulation enters into force, as these practices are considered particularly harmful."
      }
    ],
    videos: [
      "AI Psychology and Trust Building",
      "Prompt Engineering and Data-Protection Compliance",
      "Implementing the EU AI Act in D-A-CH"
    ]
  },
  {
    title: "Module 3 \u2013 Ethics & Communication",
    questions: [
      {
        text: "What is the main difference between deontological and utilitarian ethics?",
        options: [
          "Deontology focuses on rules and duties; utilitarianism focuses on the consequences of an action.",
          "Deontology is only relevant for companies; utilitarianism only for individuals.",
          "Deontology originates in Asia; utilitarianism in Europe.",
          "Deontology evaluates emotions; utilitarianism only evaluates facts."
        ],
        correctAnswer: 0,
        explanation: "Deontology judges an action by its conformity with moral rules, while utilitarianism evaluates it by its consequences and overall benefit."
      },
      {
        text: "Which of the following principles does NOT belong to the EU\u2019s 7 key requirements for trustworthy AI?",
        options: [
          "Transparency.",
          "Maximisation of corporate profit.",
          "Technical robustness and safety.",
          "Diversity, non-discrimination and fairness."
        ],
        correctAnswer: 1,
        explanation: "The EU ethics guidelines focus on fundamental rights and societal well-being. Profit maximisation is a corporate goal, but not an ethical principle under these guidelines."
      },
      {
        text: "What is the purpose of an \u2018AI logbook\u2019 in terms of transparency in an SME?",
        options: [
          "To record the working hours of AI developers.",
          "To document the costs of using AI systems.",
          "To make important AI-assisted decisions and their rationale traceable.",
          "To list employees\u2019 favourite AI tools."
        ],
        correctAnswer: 2,
        explanation: "An AI logbook serves to make transparent how AI systems were used for relevant decisions, supporting accountability and error analysis."
      },
      {
        text: "Why is a \u2018data check\u2019 for fairness important before applying AI to company data?",
        options: [
          "To ensure there is enough storage space.",
          "To prevent the AI from learning and amplifying historical imbalances or bias in the data.",
          "To check the data for viruses.",
          "To make the data more readable for the AI."
        ],
        correctAnswer: 1,
        explanation: "An active data check helps to identify and counteract the risk that an AI makes discriminatory decisions based on biased data."
      },
      {
        text: "What is meant by \u2018audience mapping\u2019 in internal communication about AI?",
        options: [
          "A map showing where AI servers are located.",
          "An analysis of which employees know the most about AI.",
          "Identifying different internal target groups and tailoring communication messages to their needs and level of knowledge.",
          "Software for automatically distributing messages within the company."
        ],
        correctAnswer: 2,
        explanation: "Audience mapping means understanding the internal \u2018landscape\u2019 of addressees and tailoring communication specifically to each group to achieve maximum acceptance."
      },
      {
        text: "Which question should a good external FAQ on AI for customers NOT leave unanswered?",
        options: [
          "Which browser does the CEO use?",
          "How does the company ensure data protection when using AI?",
          "What did the AI programmer have for lunch yesterday?",
          "What is the marketing director\u2019s favourite football team?"
        ],
        correctAnswer: 1,
        explanation: "Data protection is a core concern for customers. An external FAQ should proactively and transparently explain what measures are taken to protect personal data."
      },
      {
        text: "What is the core principle of \u2018Strategic Empathy\u2019 in communication (e.g. about the AI Act)?",
        options: [
          "Using as many technical terms as possible to demonstrate competence.",
          "Putting yourself in the other person\u2019s perspective and emotional state and tailoring your communication accordingly.",
          "Clearly and unambiguously asserting your own opinion.",
          "Always agreeing with the other person, even if you hold a different view."
        ],
        correctAnswer: 1,
        explanation: "Strategic Empathy means seeing the world through another\u2019s eyes (their concerns, their knowledge) and crafting your message so that it is understood and creates a connection."
      },
      {
        text: "Which \u2018don\u2019t\u2019 applies to communication about AI on social media?",
        options: [
          "Making unrealistic promises about AI\u2019s capabilities (\u2018AI solves all problems\u2019).",
          "Explaining the benefits of AI for customers.",
          "Responding to critical questions and comments.",
          "Linking to further information (e.g. FAQ)."
        ],
        correctAnswer: 0,
        explanation: "Exaggerated or false promises undermine credibility and lead to disappointment. A realistic portrayal is crucial for lasting trust."
      },
      {
        text: "An employee expresses fear that AI will make her job redundant. Which response shows the least Strategic Empathy?",
        options: [
          "\u2018You don\u2019t need to worry about that \u2013 that\u2019s nonsense.\u2019",
          "\u2018I understand that new technologies can cause concern. Let\u2019s talk about how AI can specifically support you.\u2019",
          "\u2018I hear that concern often. It\u2019s important that we talk openly about how tasks will change and what new opportunities arise.\u2019",
          "\u2018It\u2019s true that tasks will change due to AI. That\u2019s why we\u2019re investing in training so you can learn to use the new tools.\u2019"
        ],
        correctAnswer: 0,
        explanation: "This response directly dismisses the concern and does not take the employee\u2019s emotions seriously. It blocks the dialogue rather than opening it."
      },
      {
        text: "What does \u2018accountability\u2019 mean in the context of AI ethics?",
        options: [
          "That the AI itself is responsible for its mistakes.",
          "That there are clear responsibilities and mechanisms to ensure that AI systems and their decisions can be reviewed and justified.",
          "That all AI systems must be open source.",
          "That only holders of a doctorate in computer science may develop AI."
        ],
        correctAnswer: 1,
        explanation: "Accountability means that there are defined individuals or processes responsible for the design, deployment and impact of AI systems who can render account for them."
      },
      {
        text: "Which element should a good internal email announcing new AI policies contain?",
        options: [
          "As long a list as possible of all articles of the AI Act.",
          "Vague wording so as not to alarm anyone.",
          "A request for employees to search for the policies on the internet themselves.",
          "A clear rationale (why?), a summary of the key rules and a reference to further information/contacts."
        ],
        correctAnswer: 3,
        explanation: "An effective announcement email should provide context (why?), make the key points understandable (what?), show the benefits and name clear next steps (what next?)."
      },
      {
        text: "Why is linking ethics and law (AI Act) so important for SMEs when using AI?",
        options: [
          "Because ethical conduct often anticipates or supplements legal requirements and builds trust, which is a competitive advantage.",
          "Because the AI Act conclusively addresses all ethical questions.",
          "Because ethics is always more expensive than mere legal compliance.",
          "Because ethics only matters for large corporations."
        ],
        correctAnswer: 0,
        explanation: "Ethical principles are often reflected in legal requirements. A demonstrably ethical approach to AI builds trust with customers and employees, going beyond mere compliance."
      }
    ],
    videos: [
      "AI Communication and Trust Building",
      "AI Agents and Automation",
      "Legal Implementation of the EU AI Act"
    ]
  }
];

export const legacyExamSections: ExamSection[] = rawExamSections.map(
  (section, sectionIndex) => ({
    ...section,
    id: `legacy-section-${sectionIndex + 1}`,
    questions: section.questions.map((question, questionIndex) => ({
      ...question,
      id: `${slugify(section.title)}-${questionIndex + 1}`,
    })),
  }),
);

export const LEGACY_EXAM_DEFINITION: ExamDefinition = {
  id: 'legacy-euki-exam',
  version: 'legacy-v1',
  title: 'EU AI Act Competency Exam',
  passThreshold: 70,
  questionTimeLimitSeconds: 120,
  sections: legacyExamSections,
};
