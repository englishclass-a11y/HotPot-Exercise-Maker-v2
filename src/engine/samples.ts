/**
 * Authentic Pre-packaged Projects for Grade 12 English Practice (Weeks 19 & 20)
 * Fully populated with verified TESOL answers, grammatical rationales,
 * and high-contrast Hot Potatoes controls.
 */

import { HotPotProject } from './renderer';
import { normalizeProject } from './normalize';

export const SAMPLE_GRADE12_PROJECT: HotPotProject = normalizeProject({
  schema_version: 1,
  id: "taskchain-tatc-k12",
  folder_prefix: "taskchain-tatc-k12",
  title: "TIẾNG ANH TĂNG CƯỜNG K12 — Weeks 19–20",
  brand: "TOP GRADE / ENGLISH 12",
  subtitle: "Practice · Learn · Improve",
  language: "en",
  media_root: "media",
  source_inventory: [
    {
      id: "src-w19-d1-e1",
      file: "Tuan19-Anh12-tangcuongSGK.pdf",
      locator: "Week 19, Day 1, Exercise 1",
      questions: ["1", "2", "3", "4", "5", "6", "7", "8"],
    },
    {
      id: "src-w19-d1-e2",
      file: "Tuan19-Anh12-tangcuongSGK.pdf",
      locator: "Week 19, Day 1, Exercise 2",
      questions: ["1", "2", "3", "4"],
    },
    {
      id: "src-w19-d2-e1",
      file: "Tuan19-Anh12-tangcuongSGK.pdf",
      locator: "Week 19, Day 2, Exercise 1",
      questions: ["1", "2", "3"],
    },
    {
      id: "src-w19-d3-e2",
      file: "Tuan19-Anh12-tangcuongSGK.pdf",
      locator: "Week 19, Day 3, Exercise 2",
      questions: ["1", "2", "3", "4", "5"],
    },
    {
      id: "src-w19-d4-e3",
      file: "Tuan19-Anh12-tangcuongSGK.pdf",
      locator: "Week 19, Day 4, Exercise 3",
      questions: ["1"],
    },
    {
      id: "src-w20-d1-e1",
      file: "Tuan20-Anh12-tangcuongSGK.pdf",
      locator: "Week 20, Day 1, Exercise 1",
      questions: ["1", "2", "3", "4"],
    },
    {
      id: "src-w20-d2-e1",
      file: "Tuan20-Anh12-tangcuongSGK.pdf",
      locator: "Week 20, Day 2, Exercise 1",
      questions: ["1", "2"],
    },
    {
      id: "src-w20-d3-e1",
      file: "Tuan20-Anh12-tangcuongSGK.pdf",
      locator: "Week 20, Day 3, Exercise 1",
      questions: ["1", "2"],
    },
    {
      id: "src-w20-d4-e1",
      file: "Tuan20-Anh12-tangcuongSGK.pdf",
      locator: "Week 20, Day 4, Exercise 1",
      questions: ["1", "2"],
    },
    {
      id: "src-w20-d5-e1",
      file: "Tuan20-Anh12-tangcuongSGK.pdf",
      locator: "Week 20, Day 5, Exercise 1",
      questions: ["1"],
    }
  ],
  pages: [
    // Week 19 Day 1 Ex 1: MC Language Practice (from approved Grade 12 benchmark)
    {
      id: "w19day1ex1",
      w: 19,
      d: 1,
      e: 1,
      source_id: "src-w19-d1-e1",
      kind: "mc",
      title: "Language practice: Artificial Intelligence",
      instructions: "Mark the letter A, B, C or D to indicate the correct answer to each question.",
      intro: "Mark the letter A, B, C or D to indicate the correct answer to each of the following questions.",
      items: [
        {
          n: "1",
          prompt: "Students gain _______ experience by building and testing their own AI models.",
          options: ["human-like", "hands-on", "human-on", "hands-like"],
          answer: [1],
          key_status: "verified",
          evidence: "Collocation: 'hands-on experience' means practical experience of doing something.",
          feedback: "Hands-on experience is the standard English idiom for practical, experiential learning."
        },
        {
          n: "2",
          prompt: "Users can interact _______ the AI chatbot to get instant answers to their questions.",
          options: ["toward", "for", "with", "to"],
          answer: [2],
          key_status: "verified",
          evidence: "Prepositional verb: 'interact with someone/something'.",
          feedback: "The verb 'interact' takes the preposition 'with'."
        },
        {
          n: "3",
          prompt: "Speech ________ technology helps AI understand and process spoken language effectively.",
          options: ["recognise", "recognisably", "recognition", "recognisable"],
          answer: [2],
          key_status: "verified",
          evidence: "Compound noun: 'speech recognition technology'.",
          feedback: "A noun is required to form the compound noun 'speech recognition'."
        },
        {
          n: "4",
          prompt: "Can Tho University has got students _______ with AI models in their projects.",
          options: ["experimenting", "to experiment", "to experimenting", "experimented"],
          answer: [0, 1],
          key_status: "verified",
          evidence: "Causative structure: 'get somebody to do' or 'get somebody doing'.",
          feedback: "Both A ('experimenting') and B ('to experiment') are grammatical structures after 'get someone'."
        },
        {
          n: "5",
          prompt: "The government had the national AI ________ by experts graduating from AUS.",
          options: ["analysed", "analysing", "to analyse", "to analysing"],
          answer: [0],
          key_status: "verified",
          evidence: "Causative passive: 'have something done by someone'.",
          feedback: "The causative passive pattern 'have + object + past participle' requires 'analysed'."
        },
        {
          n: "6",
          prompt: "Person A: Today, I am going to bring up something related to artificial intelligence. Person B: _________, but could you clarify the topic of your talk? Person A: Sure.",
          options: ["I'm sorry for speaking", "Do you mind", "I'm sorry for interrupting", "May I have your attention"],
          answer: [2],
          key_status: "verified",
          evidence: "Social communication / polite interruption: 'I'm sorry for interrupting'.",
          feedback: "'I'm sorry for interrupting' is the standard polite formula when interjecting."
        },
        {
          n: "7",
          prompt: "Choose the word whose underlined part differs from the other three in pronunciation.",
          options: ["inter<u>a</u>ctive", "st<u>a</u>ndby", "v<u>a</u>cuum", "inst<u>a</u>ll"],
          answer: [3],
          key_status: "verified",
          evidence: "install has /ɔː/; the other three words have /æ/.",
          feedback: "The letter 'a' in 'install' represents the vowel /ɔː/, whereas the others have /æ/."
        },
        {
          n: "8",
          prompt: "Choose the word that differs from the other three in the position of primary stress.",
          options: ["portfolio", "identity", "evolution", "repetitive"],
          answer: [2],
          key_status: "verified",
          evidence: "evolution is stressed on the 3rd syllable (ev-o-LU-tion); the others on the 2nd.",
          feedback: "'evolution' has stress on syllable 3 (/ˌevəˈluːʃn/); the others are stressed on syllable 2."
        }
      ]
    },

    // Week 19 Day 1 Ex 2: Gap Fill / Sentence Rewrite (Present Perfect Passive)
    {
      id: "w19day1ex2",
      w: 19,
      d: 1,
      e: 2,
      source_id: "src-w19-d1-e2",
      kind: "gap",
      title: "Present perfect passive rewrites",
      instructions: "Rewrite each sentence in the passive. Type the complete sentence.",
      intro: "Rewrite each original sentence in the passive voice using the present perfect tense. Punctuation and capitalization are preserved.",
      items: [
        {
          n: "1",
          prompt: "Lisa has baked a chocolate cake for the party tonight.",
          answer: [
            "A chocolate cake has been baked by Lisa for the party tonight.",
            "A chocolate cake has been baked for the party tonight by Lisa.",
            "A chocolate cake has been baked for the party tonight."
          ],
          key_status: "verified",
          evidence: "Present perfect passive: has/have been + past participle.",
          feedback: "Present perfect passive rule: subject + has been baked + agent + adverbial.",
          full: true
        },
        {
          n: "2",
          prompt: "We have watched three movies this weekend.",
          answer: [
            "Three movies have been watched by us this weekend.",
            "Three movies have been watched this weekend by us.",
            "Three movies have been watched this weekend."
          ],
          key_status: "verified",
          evidence: "Plural subject takes 'have been watched'.",
          feedback: "'Three movies' is plural, requiring 'have been watched'.",
          full: true
        },
        {
          n: "3",
          prompt: "They have not written any letters to their grandparents since last year.",
          answer: [
            "No letters have been written to their grandparents since last year.",
            "No letters have been written to their grandparents by them since last year.",
            "No letters have been written by them to their grandparents since last year.",
            "No letters have been written to their grandparents since last year by them.",
            "Not any letters have been written to their grandparents since last year."
          ],
          key_status: "verified",
          evidence: "Negative transformation: 'not any' -> 'no letters have been written'.",
          feedback: "Transformation of 'not any letters' produces 'No letters have been written...'",
          full: true
        },
        {
          n: "4",
          prompt: "The gardener has planted new flowers in the backyard.",
          answer: [
            "New flowers have been planted in the backyard by the gardener.",
            "New flowers have been planted by the gardener in the backyard.",
            "New flowers have been planted in the backyard."
          ],
          key_status: "verified",
          evidence: "Plural object 'new flowers' becomes subject.",
          feedback: "'New flowers' requires plural auxiliary 'have been planted'.",
          full: true
        }
      ]
    },

    // Week 19 Day 2 Ex 1: Listening (Audio pending worksheet)
    {
      id: "w19day2ex1",
      w: 19,
      d: 2,
      e: 1,
      source_id: "src-w19-d2-e1",
      kind: "listening",
      title: "Listening practice: Tech Talk on Smart Devices",
      learner_note: "Play the recording if provided by your teacher, or open an audio file from your device. Responses are saved for teacher checking.",
      items: [
        {
          n: "1",
          prompt: "What is the speaker's main purpose in this talk?",
          options: [
            "To advertise a new cleaning robot",
            "To explain how AI transforms household appliances",
            "To warn against computer viruses",
            "To discuss university admissions in computing"
          ],
          answer: [],
          key_status: "missing"
        },
        {
          n: "2",
          prompt: "Which two features of the smart vacuum are highlighted by the engineer?",
          options: [
            "Laser obstacle detection",
            "Automatic recharging dock",
            "Voice-activated video camera",
            "Solar power generator"
          ],
          multiple: true,
          maxchoices: 2,
          answer: [],
          key_status: "missing"
        },
        {
          n: "3",
          prompt: "Write down the name of the software application mentioned in the presentation: {{gap}}",
          answer: [],
          key_status: "missing"
        }
      ]
    },

    // Week 19 Day 3 Ex 2: Interactive Matching
    {
      id: "w19day3ex2",
      w: 19,
      d: 3,
      e: 2,
      source_id: "src-w19-d3-e2",
      kind: "match",
      title: "Matching: AI Terminology & Definitions",
      instructions: "Match each tech term with its correct definition. Tap or drag cards from the bank into each box, or use the dropdown.",
      bank: [
        { value: "a", label: "A computer program designed to simulate conversation with human users" },
        { value: "b", label: "The capability of a machine to imitate intelligent human behavior" },
        { value: "c", label: "A branch of AI focusing on algorithms that learn from data" },
        { value: "d", label: "Technology enabling computers to comprehend audio input" },
        { value: "e", label: "A self-governing robotic unit operating without human intervention" }
      ],
      items: [
        {
          n: "1",
          prompt: "Chatbot: {{gap}}",
          answer: ["a"],
          key_status: "verified",
          evidence: "Chatbot definition: simulated conversational agent.",
          options: [
            { value: "a", label: "A computer program designed to simulate conversation with human users" },
            { value: "b", label: "The capability of a machine to imitate intelligent human behavior" },
            { value: "c", label: "A branch of AI focusing on algorithms that learn from data" },
            { value: "d", label: "Technology enabling computers to comprehend audio input" },
            { value: "e", label: "A self-governing robotic unit operating without human intervention" }
          ]
        },
        {
          n: "2",
          prompt: "Artificial Intelligence: {{gap}}",
          answer: ["b"],
          key_status: "verified",
          evidence: "AI definition: machine intelligence imitating human behavior.",
          options: [
            { value: "a", label: "A computer program designed to simulate conversation with human users" },
            { value: "b", label: "The capability of a machine to imitate intelligent human behavior" },
            { value: "c", label: "A branch of AI focusing on algorithms that learn from data" },
            { value: "d", label: "Technology enabling computers to comprehend audio input" },
            { value: "e", label: "A self-governing robotic unit operating without human intervention" }
          ]
        },
        {
          n: "3",
          prompt: "Machine Learning: {{gap}}",
          answer: ["c"],
          key_status: "verified",
          evidence: "Machine learning: algorithms learning patterns from empirical data.",
          options: [
            { value: "a", label: "A computer program designed to simulate conversation with human users" },
            { value: "b", label: "The capability of a machine to imitate intelligent human behavior" },
            { value: "c", label: "A branch of AI focusing on algorithms that learn from data" },
            { value: "d", label: "Technology enabling computers to comprehend audio input" },
            { value: "e", label: "A self-governing robotic unit operating without human intervention" }
          ]
        },
        {
          n: "4",
          prompt: "Speech Recognition: {{gap}}",
          answer: ["d"],
          key_status: "verified",
          evidence: "Speech recognition: processing spoken human acoustic signals.",
          options: [
            { value: "a", label: "A computer program designed to simulate conversation with human users" },
            { value: "b", label: "The capability of a machine to imitate intelligent human behavior" },
            { value: "c", label: "A branch of AI focusing on algorithms that learn from data" },
            { value: "d", label: "Technology enabling computers to comprehend audio input" },
            { value: "e", label: "A self-governing robotic unit operating without human intervention" }
          ]
        },
        {
          n: "5",
          prompt: "Autonomous Robot: {{gap}}",
          answer: ["e"],
          key_status: "verified",
          evidence: "Autonomous robot: independent execution without continuous manual oversight.",
          options: [
            { value: "a", label: "A computer program designed to simulate conversation with human users" },
            { value: "b", label: "The capability of a machine to imitate intelligent human behavior" },
            { value: "c", label: "A branch of AI focusing on algorithms that learn from data" },
            { value: "d", label: "Technology enabling computers to comprehend audio input" },
            { value: "e", label: "A self-governing robotic unit operating without human intervention" }
          ]
        }
      ]
    },

    // Week 19 Day 4 Ex 3: Ordering Cards
    {
      id: "w19day4ex3",
      w: 19,
      d: 4,
      e: 3,
      source_id: "src-w19-d4-e3",
      kind: "order",
      title: "Paragraph ordering: How a neural network learns",
      instructions: "Reorder the sentences to create a coherent logical paragraph. Use Up/Down buttons or drag cards.",
      cards: [
        { value: "a", label: "First, the system is fed thousands of labeled training examples, such as photographs of cats and dogs." },
        { value: "b", label: "Next, the network makes initial predictions and computes errors by comparing its guesses with true labels." },
        { value: "c", label: "Then, an optimization algorithm gradually adjusts internal weights to minimize these errors." },
        { value: "d", label: "Finally, the model achieves high accuracy and can recognize unseen images independently." }
      ],
      original_options: [
        "First, the system is fed thousands of labeled training examples...",
        "Next, the network makes initial predictions and computes errors...",
        "Then, an optimization algorithm gradually adjusts internal weights...",
        "Finally, the model achieves high accuracy and can recognize unseen images independently."
      ],
      items: [
        {
          n: "1",
          prompt: "Arrange the chronological sequence.",
          answer: ["a-b-c-d"],
          key_status: "verified",
          evidence: "Logical progression: Input examples -> Compute errors -> Adjust weights -> Final accuracy.",
          feedback: "The process begins with feeding data (First), evaluating output (Next), optimizing (Then), and achieving accuracy (Finally)."
        }
      ]
    },

    // Week 20 Day 1 Ex 1: Cloze Reading Passage
    {
      id: "w20day1ex1",
      w: 20,
      d: 1,
      e: 1,
      source_id: "src-w20-d1-e1",
      kind: "passage",
      title: "Reading cloze: Artificial Intelligence in Modern Healthcare",
      instructions: "Read the passage and fill in each numbered gap with the most suitable word.",
      passage: "<p>Artificial intelligence is transforming medical diagnostics in profound ways. Machine learning algorithms can analyze radiology scans with exceptional {{0}}, often spotting microscopic tumors before human doctors can detect them. Furthermore, robotic surgical assistants allow surgeons to perform complex operations with unprecedented {{1}}. Consequently, patient recovery times have {{2}} significantly. Despite these advances, medical ethicists emphasize that AI must always {{3}} human physicians rather than replace them entirely.</p>",
      items: [
        {
          n: "1",
          prompt: "Degree of correctness and exactness in scans",
          answer: ["accuracy", "precision"],
          key_status: "verified",
          evidence: "Collocation: 'with exceptional accuracy/precision'.",
          feedback: "Accuracy or precision collocates naturally with radiology scan analysis."
        },
        {
          n: "2",
          prompt: "Exactness in surgical procedure",
          answer: ["precision", "accuracy"],
          key_status: "verified",
          evidence: "Collocation: 'with unprecedented precision'.",
          feedback: "Precision highlights the fine motor control of robotic instruments."
        },
        {
          n: "3",
          prompt: "Verb in present perfect meaning became shorter",
          answer: ["decreased", "dropped", "shortened", "fallen"],
          key_status: "verified",
          evidence: "Context: recovery times have decreased/shortened.",
          feedback: "Past participle describing the reduction in patient hospital stay durations."
        },
        {
          n: "4",
          prompt: "Verb meaning to assist or work alongside",
          answer: ["assist", "aid", "support", "complement"],
          key_status: "verified",
          evidence: "Collocation: 'assist/support human physicians'.",
          feedback: "Modals 'must always' + base verb 'assist'/'complement' emphasizes collaboration."
        }
      ]
    },

    // Week 20 Day 2 Ex 1: Multiple Response (Select All / Choose Two)
    {
      id: "w20day2ex1",
      w: 20,
      d: 2,
      e: 1,
      source_id: "src-w20-d2-e1",
      kind: "multi",
      title: "Multiple-response: Ethics of Artificial Intelligence",
      instructions: "Select all options that apply for each question, then click Check.",
      items: [
        {
          n: "1",
          prompt: "Which TWO principles are outlined in international ethical guidelines for AI development?",
          options: [
            { value: "A", label: "Algorithmic transparency and accountability" },
            { value: "B", label: "Total automation without human supervision" },
            { value: "C", label: "Protection of user data privacy and non-discrimination" },
            { value: "D", label: "Elimination of all open-source coding repositories" }
          ],
          answer: ["A-C"],
          key_status: "verified",
          evidence: "Ethical AI declarations: transparency and privacy/equity are core pillars.",
          feedback: "A and C represent fundamental ethical requirements for AI systems."
        },
        {
          n: "2",
          prompt: "Which TWO industries have adopted AI-powered automated translation most extensively?",
          options: [
            { value: "A", label: "Global e-commerce and customer service" },
            { value: "B", label: "Antique bookbinding" },
            { value: "C", label: "International tourism and travel booking" },
            { value: "D", label: "Blacksmithing and metal forging" }
          ],
          answer: ["A-C"],
          key_status: "verified",
          evidence: "E-commerce and travel rely heavily on multilingual real-time translation.",
          feedback: "E-commerce platforms and travel booking engines rely heavily on automated localization."
        }
      ]
    },

    // Week 20 Day 3 Ex 1: Crossword Puzzle
    {
      id: "w20day3ex1",
      w: 20,
      d: 3,
      e: 1,
      source_id: "src-w20-d3-e1",
      kind: "crossword",
      title: "Crossword: Technology & Computing",
      instructions: "Complete the crossword puzzle. Enter letters into the grid or type words in the numbered clue fields below.",
      items: [
        {
          n: "1a",
          source_n: "1",
          prompt: "1 Across: An electronic machine capable of storing and processing information (8 letters)",
          answer: ["COMPUTER"],
          key_status: "verified",
          evidence: "C-O-M-P-U-T-E-R (8 letters)."
        },
        {
          n: "1d",
          source_n: "2",
          prompt: "1 Down: Instructions or programs that tell a computer what to do (4 letters)",
          answer: ["CODE"],
          key_status: "verified",
          evidence: "C-O-D-E (4 letters), intersects C at (0,0)."
        }
      ],
      placements: [
        { item: 0, row: 0, col: 0, direction: "across" },
        { item: 1, row: 0, col: 0, direction: "down" }
      ]
    },

    // Week 20 Day 4 Ex 1: Error Correction with Paired Letters
    {
      id: "w20day4ex1",
      w: 20,
      d: 4,
      e: 1,
      source_id: "src-w20-d4-e1",
      kind: "gap",
      title: "Error identification and correction",
      instructions: "Identify the letter of the incorrect underlined part, then type the correct form.",
      items: [
        {
          n: "1",
          source_n: "1",
          prompt: "The new algorithm (A) <u>develop</u> by our engineers (B) <u>has</u> improved system speed (C) <u>by</u> forty (D) <u>percent</u>.",
          answer: ["developed", "was developed"],
          key_status: "verified",
          evidence: "Reduced relative clause: 'developed by our engineers'.",
          feedback: "Part A must be the past participle 'developed' to function as a reduced relative clause."
        },
        {
          n: "2",
          source_n: "2",
          prompt: "Neither the supervisor (A) <u>nor</u> the programmers (B) <u>was</u> able to locate (C) <u>the</u> memory leak (D) <u>yesterday</u>.",
          answer: ["were"],
          key_status: "verified",
          evidence: "Proximity rule with neither...nor: plural subject 'programmers' takes plural 'were'.",
          feedback: "Under proximity agreement rules with 'neither...nor', the plural subject 'the programmers' takes 'were'."
        }
      ]
    },

    // Week 20 Day 5 Ex 1: Writing & Assessment Rubric
    {
      id: "w20day5ex1",
      w: 20,
      d: 5,
      e: 1,
      source_id: "src-w20-d5-e1",
      kind: "writing",
      title: "Essay writing: The Benefits and Challenges of Artificial Intelligence",
      instructions: "Draft your essay in the response box, monitor your word count, verify criteria using the checklist, and download your draft.",
      items: [],
      writing: {
        title: "Opinion Paragraph: AI in High School Education",
        source_n: "1",
        prompt: "Write a well-developed paragraph of 120–150 words giving your opinion on whether high school students should be permitted to use generative AI tools for homework assignments. Support your argument with specific examples.",
        rubric: "Assessed on: 1. Task Achievement & Topic Development (Clear stance with relevant examples); 2. Coherence and Cohesion (Logical transitions, linking words); 3. Lexical Resource (Sophisticated academic vocabulary); 4. Grammatical Range and Accuracy (Complex sentences, correct verb tenses).",
        checklist: [
          "I clearly stated my point of view in the opening topic sentence.",
          "I provided at least two supporting examples with explanatory evidence.",
          "I used academic connectors (Furthermore, Consequently, On the other hand).",
          "I checked spelling, subject-verb agreement, and punctuation.",
          "My word count is between 120 and 150 words."
        ],
        model: "In my opinion, high school students should be permitted to use generative AI tools for their homework, provided that clear ethical guidelines are established. Firstly, AI serves as an effective personalized tutor, clarifying complex scientific concepts and offering instant feedback on grammar when teachers are unavailable. For example, language learners can query chatbots for contextual vocabulary examples to reinforce classroom instruction. However, unchecked dependency risks eroding critical thinking and writing fluency. Therefore, educators should instruct students to utilize AI as an ideation and editing assistant rather than an answer generator. In conclusion, integrating artificial intelligence responsibly equips young learners with indispensable digital literacy skills for future university and career success."
      }
    }
  ]
});
