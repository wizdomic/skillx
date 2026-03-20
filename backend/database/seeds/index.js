require('dotenv').config({ path: '../../.env' })
const mongoose = require('mongoose')
const Skill    = require('../../src/models/Skill')
const { MONGODB_URI } = require('../../src/config/env')

// ── Top 20 most valuable skills for India 2026 (marked with ⭐) ───────────────
// 1. Prompt Engineering     6. System Design         11. Spring Boot
// 2. React / Next.js        7. AWS / Cloud           12. PostgreSQL
// 3. Python + ML            8. TypeScript            13. LangChain / AI Agents
// 4. Data Analysis + SQL    9. Flutter               14. Performance Marketing
// 5. DevOps / CI-CD        10. UI/UX Design          15. Financial Modeling
// 16. Digital Marketing    17. English Communication  18. Cybersecurity
// 19. Webflow / No-code    20. Content Creation

// ── Learning paths ────────────────────────────────────────────────────────────
// Frontend Dev:     HTML/CSS → JavaScript → TypeScript → React → Next.js → System Design
// Backend Dev:      Python → Django/FastAPI → PostgreSQL → Docker → AWS → System Design
// AI/ML Engineer:   Python → Statistics → ML → Deep Learning → LangChain → Prompt Engineering
// DevOps Engineer:  Linux → Docker → Kubernetes → Terraform → CI/CD → AWS
// Mobile Dev:       Dart → Flutter  OR  Kotlin → Android Development
// Data Analyst:     Excel → SQL → Python → Power BI → Tableau → Statistics
// Full Stack (Java):Java → Spring Boot → SQL → Docker → AWS → System Design
// Digital Marketer: Social Media → SEO → Google Ads → Analytics → Performance Marketing

const SKILLS = [
  // ── Programming & Tech (existing) ────────────────────────────────────────
  { name: 'JavaScript',            category: 'Programming' },
  { name: 'Python',                category: 'Programming' },
  { name: 'React',                 category: 'Programming' },
  { name: 'Node.js',               category: 'Programming' },
  { name: 'TypeScript',            category: 'Programming' },
  { name: 'SQL',                   category: 'Programming' },
  { name: 'Machine Learning',      category: 'Programming' },
  { name: 'Go',                    category: 'Programming' },
  { name: 'Rust',                  category: 'Programming' },
  { name: 'Java',                  category: 'Programming' },
  { name: 'C++',                   category: 'Programming' },
  { name: 'C#',                    category: 'Programming' },
  { name: 'Swift',                 category: 'Programming' },
  { name: 'Kotlin',                category: 'Programming' },
  { name: 'PHP',                   category: 'Programming' },
  { name: 'Ruby',                  category: 'Programming' },
  { name: 'Dart',                  category: 'Programming' },
  { name: 'Flutter',               category: 'Programming' },
  { name: 'React Native',          category: 'Programming' },
  { name: 'Vue.js',                category: 'Programming' },
  { name: 'Angular',               category: 'Programming' },
  { name: 'Next.js',               category: 'Programming' },
  { name: 'Django',                category: 'Programming' },
  { name: 'FastAPI',               category: 'Programming' },
  { name: 'Docker',                category: 'Programming' },
  { name: 'Kubernetes',            category: 'Programming' },
  { name: 'AWS',                   category: 'Programming' },
  { name: 'Git & GitHub',          category: 'Programming' },
  { name: 'Linux / Shell',         category: 'Programming' },
  { name: 'Data Structures',       category: 'Programming' },
  { name: 'System Design',         category: 'Programming' },
  { name: 'Blockchain',            category: 'Programming' },
  { name: 'Cybersecurity',         category: 'Programming' },
  { name: 'Deep Learning',         category: 'Programming' },
  { name: 'Computer Vision',       category: 'Programming' },
  { name: 'NLP',                   category: 'Programming' },
  { name: 'Data Analysis',         category: 'Programming' },
  { name: 'Power BI',              category: 'Programming' },
  { name: 'Tableau',               category: 'Programming' },

  // ── Programming & Tech (new — India 2026 job-ready) ──────────────────────
  { name: 'Spring Boot',           category: 'Programming' },
  { name: 'Azure',                 category: 'Programming' },
  { name: 'Google Cloud (GCP)',    category: 'Programming' },
  { name: 'PostgreSQL',            category: 'Programming' },
  { name: 'MongoDB',               category: 'Programming' },
  { name: 'Redis',                 category: 'Programming' },
  { name: 'Firebase',              category: 'Programming' },
  { name: 'Supabase',              category: 'Programming' },
  { name: 'Terraform',             category: 'Programming' },
  { name: 'CI/CD Pipelines',       category: 'Programming' },
  { name: 'GitHub Actions',        category: 'Programming' },
  { name: 'GraphQL',               category: 'Programming' },
  { name: 'REST API Design',       category: 'Programming' },
  { name: 'Microservices',         category: 'Programming' },
  { name: 'Android Development',   category: 'Programming' },
  { name: 'iOS Development',       category: 'Programming' },
  { name: 'Testing & QA',          category: 'Programming' },
  { name: 'Selenium',              category: 'Programming' },
  { name: 'Competitive Programming', category: 'Programming' },
  { name: 'HTML & CSS',            category: 'Programming' },
  { name: 'Tailwind CSS',          category: 'Programming' },
  { name: 'Elasticsearch',         category: 'Programming' },

  // ── AI & No-Code (new category — highest demand 2026) ────────────────────
  { name: 'Prompt Engineering',    category: 'AI & No-Code' },
  { name: 'LangChain',             category: 'AI & No-Code' },
  { name: 'AI Agents',             category: 'AI & No-Code' },
  { name: 'Hugging Face',          category: 'AI & No-Code' },
  { name: 'ChatGPT for Work',      category: 'AI & No-Code' },
  { name: 'Stable Diffusion',      category: 'AI & No-Code' },
  { name: 'Midjourney',            category: 'AI & No-Code' },
  { name: 'AI Tools for Business', category: 'AI & No-Code' },
  { name: 'Webflow',               category: 'AI & No-Code' },
  { name: 'Bubble.io',             category: 'AI & No-Code' },
  { name: 'Framer',                category: 'AI & No-Code' },
  { name: 'Notion & Automation',   category: 'AI & No-Code' },
  { name: 'Zapier / Make',         category: 'AI & No-Code' },
  { name: 'Airtable',              category: 'AI & No-Code' },
  { name: 'v0 / Lovable',          category: 'AI & No-Code' },

  // ── Design (existing) ─────────────────────────────────────────────────────
  { name: 'Figma',                 category: 'Design' },
  { name: 'UI/UX Design',          category: 'Design' },
  { name: 'Adobe Illustrator',     category: 'Design' },
  { name: 'Adobe Photoshop',       category: 'Design' },
  { name: 'Adobe XD',              category: 'Design' },
  { name: 'Graphic Design',        category: 'Design' },
  { name: 'Logo Design',           category: 'Design' },
  { name: 'Motion Graphics',       category: 'Design' },
  { name: 'Brand Design',          category: 'Design' },
  { name: 'Typography',            category: 'Design' },
  { name: 'Color Theory',          category: 'Design' },
  { name: 'Canva',                 category: 'Design' },
  { name: 'Video Editing',         category: 'Design' },
  { name: 'After Effects',         category: 'Design' },
  { name: 'Premiere Pro',          category: 'Design' },
  { name: 'Blender 3D',            category: 'Design' },
  { name: 'Illustration',          category: 'Design' },

  // ── Design (new) ─────────────────────────────────────────────────────────
  { name: 'Spline 3D',             category: 'Design' },
  { name: 'Rive Animations',       category: 'Design' },
  { name: 'User Research',         category: 'Design' },
  { name: 'Wireframing',           category: 'Design' },
  { name: 'Design Systems',        category: 'Design' },
  { name: 'DaVinci Resolve',       category: 'Design' },
  { name: 'Thumbnail Design',      category: 'Design' },
  { name: 'Reels / Short Video',   category: 'Design' },

  // ── Language (existing) ──────────────────────────────────────────────────
  { name: 'Spanish',               category: 'Language' },
  { name: 'Mandarin Chinese',      category: 'Language' },
  { name: 'French',                category: 'Language' },
  { name: 'Japanese',              category: 'Language' },
  { name: 'German',                category: 'Language' },
  { name: 'Hindi',                 category: 'Language' },
  { name: 'Arabic',                category: 'Language' },
  { name: 'Portuguese',            category: 'Language' },
  { name: 'Italian',               category: 'Language' },
  { name: 'Korean',                category: 'Language' },
  { name: 'Russian',               category: 'Language' },
  { name: 'Turkish',               category: 'Language' },
  { name: 'Dutch',                 category: 'Language' },
  { name: 'Swedish',               category: 'Language' },
  { name: 'Polish',                category: 'Language' },
  { name: 'Sign Language',         category: 'Language' },
  { name: 'Latin',                 category: 'Language' },
  { name: 'Greek',                 category: 'Language' },

  // ── Language (new — Indian languages + English) ───────────────────────────
  { name: 'English Communication', category: 'Language' },
  { name: 'Business English',      category: 'Language' },
  { name: 'IELTS / TOEFL Prep',    category: 'Language' },
  { name: 'Tamil',                 category: 'Language' },
  { name: 'Telugu',                category: 'Language' },
  { name: 'Bengali',               category: 'Language' },
  { name: 'Marathi',               category: 'Language' },
  { name: 'Gujarati',              category: 'Language' },
  { name: 'Kannada',               category: 'Language' },
  { name: 'Malayalam',             category: 'Language' },
  { name: 'Punjabi',               category: 'Language' },
  { name: 'Sanskrit',              category: 'Language' },

  // ── Music (existing) ─────────────────────────────────────────────────────
  { name: 'Guitar',                category: 'Music' },
  { name: 'Piano',                 category: 'Music' },
  { name: 'Drums',                 category: 'Music' },
  { name: 'Bass Guitar',           category: 'Music' },
  { name: 'Violin',                category: 'Music' },
  { name: 'Cello',                 category: 'Music' },
  { name: 'Ukulele',               category: 'Music' },
  { name: 'Flute',                 category: 'Music' },
  { name: 'Saxophone',             category: 'Music' },
  { name: 'Trumpet',               category: 'Music' },
  { name: 'Singing / Vocals',      category: 'Music' },
  { name: 'Music Production',      category: 'Music' },
  { name: 'Music Theory',          category: 'Music' },
  { name: 'DJing',                 category: 'Music' },
  { name: 'Beat Making',           category: 'Music' },
  { name: 'Sound Design',          category: 'Music' },
  { name: 'Ableton Live',          category: 'Music' },
  { name: 'FL Studio',             category: 'Music' },

  // ── Music (new) ──────────────────────────────────────────────────────────
  { name: 'Tabla',                 category: 'Music' },
  { name: 'Sitar',                 category: 'Music' },
  { name: 'Hindustani Vocals',     category: 'Music' },
  { name: 'Carnatic Music',        category: 'Music' },
  { name: 'Keyboard / Synthesizer', category: 'Music' },

  // ── Business (existing) ──────────────────────────────────────────────────
  { name: 'Public Speaking',       category: 'Business' },
  { name: 'Excel / Spreadsheets',  category: 'Business' },
  { name: 'Project Management',    category: 'Business' },
  { name: 'Product Management',    category: 'Business' },
  { name: 'Business Strategy',     category: 'Business' },
  { name: 'Entrepreneurship',      category: 'Business' },
  { name: 'Sales',                 category: 'Business' },
  { name: 'Negotiation',           category: 'Business' },
  { name: 'Leadership',            category: 'Business' },
  { name: 'HR & Recruitment',      category: 'Business' },
  { name: 'Supply Chain',          category: 'Business' },
  { name: 'Operations',            category: 'Business' },

  // ── Business (new) ───────────────────────────────────────────────────────
  { name: 'Agile & Scrum',         category: 'Business' },
  { name: 'Tally Prime',           category: 'Business' },
  { name: 'SAP Basics',            category: 'Business' },
  { name: 'Business Communication', category: 'Business' },
  { name: 'Cold Emailing & Outreach', category: 'Business' },
  { name: 'Startup Fundraising',   category: 'Business' },
  { name: 'OKRs & Goal Setting',   category: 'Business' },
  { name: 'B2B Sales',             category: 'Business' },

  // ── Marketing (existing) ─────────────────────────────────────────────────
  { name: 'Digital Marketing',     category: 'Marketing' },
  { name: 'SEO',                   category: 'Marketing' },
  { name: 'Content Marketing',     category: 'Marketing' },
  { name: 'Social Media',          category: 'Marketing' },
  { name: 'Email Marketing',       category: 'Marketing' },
  { name: 'Google Ads',            category: 'Marketing' },
  { name: 'Facebook Ads',          category: 'Marketing' },
  { name: 'Copywriting',           category: 'Marketing' },
  { name: 'Growth Hacking',        category: 'Marketing' },
  { name: 'Brand Strategy',        category: 'Marketing' },
  { name: 'Analytics',             category: 'Marketing' },
  { name: 'Affiliate Marketing',   category: 'Marketing' },

  // ── Marketing (new) ──────────────────────────────────────────────────────
  { name: 'Performance Marketing', category: 'Marketing' },
  { name: 'YouTube Marketing',     category: 'Marketing' },
  { name: 'Instagram Marketing',   category: 'Marketing' },
  { name: 'LinkedIn Marketing',    category: 'Marketing' },
  { name: 'WhatsApp Marketing',    category: 'Marketing' },
  { name: 'Content Creation',      category: 'Marketing' },
  { name: 'Influencer Marketing',  category: 'Marketing' },
  { name: 'Podcast Creation',      category: 'Marketing' },
  { name: 'Video Marketing',       category: 'Marketing' },
  { name: 'E-commerce Marketing',  category: 'Marketing' },
  { name: 'Google Analytics 4',    category: 'Marketing' },

  // ── Finance (existing) ───────────────────────────────────────────────────
  { name: 'Personal Finance',      category: 'Finance' },
  { name: 'Stock Trading',         category: 'Finance' },
  { name: 'Crypto & Web3',         category: 'Finance' },
  { name: 'Accounting',            category: 'Finance' },
  { name: 'Financial Modeling',    category: 'Finance' },
  { name: 'Investing',             category: 'Finance' },
  { name: 'Budgeting',             category: 'Finance' },
  { name: 'Tax Planning',          category: 'Finance' },
  { name: 'Real Estate',           category: 'Finance' },
  { name: 'Options Trading',       category: 'Finance' },
  { name: 'Forex Trading',         category: 'Finance' },

  // ── Finance (new — India specific) ───────────────────────────────────────
  { name: 'GST & Taxation',        category: 'Finance' },
  { name: 'Mutual Funds & SIP',    category: 'Finance' },
  { name: 'CA Foundation Prep',    category: 'Finance' },
  { name: 'Tally Accounting',      category: 'Finance' },
  { name: 'Stock Market Analysis', category: 'Finance' },
  { name: 'Insurance Planning',    category: 'Finance' },
  { name: 'Zerodha / Trading Platforms', category: 'Finance' },

  // ── Arts & Crafts (existing) ─────────────────────────────────────────────
  { name: 'Drawing',               category: 'Arts & Crafts' },
  { name: 'Painting',              category: 'Arts & Crafts' },
  { name: 'Watercolor',            category: 'Arts & Crafts' },
  { name: 'Sketching',             category: 'Arts & Crafts' },
  { name: 'Digital Art',           category: 'Arts & Crafts' },
  { name: 'Photography',           category: 'Arts & Crafts' },
  { name: 'Film Making',           category: 'Arts & Crafts' },
  { name: 'Creative Writing',      category: 'Arts & Crafts' },
  { name: 'Screenwriting',         category: 'Arts & Crafts' },
  { name: 'Pottery',               category: 'Arts & Crafts' },
  { name: 'Knitting',              category: 'Arts & Crafts' },
  { name: 'Sewing',                category: 'Arts & Crafts' },
  { name: 'Woodworking',           category: 'Arts & Crafts' },
  { name: 'Jewelry Making',        category: 'Arts & Crafts' },
  { name: 'Origami',               category: 'Arts & Crafts' },
  { name: 'Calligraphy',           category: 'Arts & Crafts' },
  { name: 'Comic Art',             category: 'Arts & Crafts' },
  { name: 'Manga Drawing',         category: 'Arts & Crafts' },

  // ── Arts & Crafts (new) ──────────────────────────────────────────────────
  { name: 'Mehndi / Henna Art',    category: 'Arts & Crafts' },
  { name: 'Rangoli',               category: 'Arts & Crafts' },
  { name: 'Embroidery',            category: 'Arts & Crafts' },
  { name: 'Resin Art',             category: 'Arts & Crafts' },
  { name: 'Street Photography',    category: 'Arts & Crafts' },
  { name: 'Portrait Photography',  category: 'Arts & Crafts' },

  // ── Sports & Fitness (existing) ──────────────────────────────────────────
  { name: 'Yoga',                  category: 'Sports & Fitness' },
  { name: 'Meditation',            category: 'Sports & Fitness' },
  { name: 'Weight Training',       category: 'Sports & Fitness' },
  { name: 'Running',               category: 'Sports & Fitness' },
  { name: 'Swimming',              category: 'Sports & Fitness' },
  { name: 'Cycling',               category: 'Sports & Fitness' },
  { name: 'Martial Arts',          category: 'Sports & Fitness' },
  { name: 'Boxing',                category: 'Sports & Fitness' },
  { name: 'Brazilian Jiu-Jitsu',   category: 'Sports & Fitness' },
  { name: 'Football',              category: 'Sports & Fitness' },
  { name: 'Basketball',            category: 'Sports & Fitness' },
  { name: 'Tennis',                category: 'Sports & Fitness' },
  { name: 'Badminton',             category: 'Sports & Fitness' },
  { name: 'Table Tennis',          category: 'Sports & Fitness' },
  { name: 'Cricket',               category: 'Sports & Fitness' },
  { name: 'Pilates',               category: 'Sports & Fitness' },
  { name: 'Calisthenics',          category: 'Sports & Fitness' },
  { name: 'Dance',                 category: 'Sports & Fitness' },
  { name: 'Hip Hop Dance',         category: 'Sports & Fitness' },
  { name: 'Salsa',                 category: 'Sports & Fitness' },
  { name: 'Climbing',              category: 'Sports & Fitness' },
  { name: 'Surfing',               category: 'Sports & Fitness' },
  { name: 'Skateboarding',         category: 'Sports & Fitness' },

  // ── Sports & Fitness (new) ───────────────────────────────────────────────
  { name: 'Kabaddi',               category: 'Sports & Fitness' },
  { name: 'Kho-Kho',               category: 'Sports & Fitness' },
  { name: 'Zumba',                 category: 'Sports & Fitness' },
  { name: 'Functional Fitness',    category: 'Sports & Fitness' },
  { name: 'Nutrition & Diet',      category: 'Sports & Fitness' },
  { name: 'Personal Training',     category: 'Sports & Fitness' },
  { name: 'Kathak',                category: 'Sports & Fitness' },
  { name: 'Bharatanatyam',         category: 'Sports & Fitness' },

  // ── Cooking (existing) ───────────────────────────────────────────────────
  { name: 'Baking',                category: 'Cooking' },
  { name: 'Pastry & Desserts',     category: 'Cooking' },
  { name: 'Bread Making',          category: 'Cooking' },
  { name: 'Vegetarian Cooking',    category: 'Cooking' },
  { name: 'Vegan Cooking',         category: 'Cooking' },
  { name: 'Italian Cuisine',       category: 'Cooking' },
  { name: 'Indian Cuisine',        category: 'Cooking' },
  { name: 'Japanese Cuisine',      category: 'Cooking' },
  { name: 'Chinese Cuisine',       category: 'Cooking' },
  { name: 'Mexican Cuisine',       category: 'Cooking' },
  { name: 'BBQ & Grilling',        category: 'Cooking' },
  { name: 'Cocktail Making',       category: 'Cooking' },
  { name: 'Coffee Brewing',        category: 'Cooking' },
  { name: 'Knife Skills',          category: 'Cooking' },
  { name: 'Meal Prepping',         category: 'Cooking' },

  // ── Cooking (new) ────────────────────────────────────────────────────────
  { name: 'North Indian Cooking',  category: 'Cooking' },
  { name: 'South Indian Cooking',  category: 'Cooking' },
  { name: 'Street Food Recipes',   category: 'Cooking' },
  { name: 'Fermentation & Pickling', category: 'Cooking' },
  { name: 'Air Fryer Cooking',     category: 'Cooking' },

  // ── Science (existing) ───────────────────────────────────────────────────
  { name: 'Mathematics',           category: 'Science' },
  { name: 'Statistics',            category: 'Science' },
  { name: 'Physics',               category: 'Science' },
  { name: 'Chemistry',             category: 'Science' },
  { name: 'Biology',               category: 'Science' },
  { name: 'Astronomy',             category: 'Science' },
  { name: 'Neuroscience',          category: 'Science' },
  { name: 'Psychology',            category: 'Science' },
  { name: 'Calculus',              category: 'Science' },
  { name: 'Linear Algebra',        category: 'Science' },
  { name: 'Robotics',              category: 'Science' },
  { name: 'Electronics',           category: 'Science' },
  { name: 'Arduino',               category: 'Science' },
  { name: 'Raspberry Pi',          category: 'Science' },

  // ── Science (new) ────────────────────────────────────────────────────────
  { name: 'Quantum Computing',     category: 'Science' },
  { name: 'Biotechnology',         category: 'Science' },
  { name: 'Environmental Science', category: 'Science' },

  // ── Career & Exams (new category — huge in India) ────────────────────────
  { name: 'UPSC Preparation',      category: 'Career & Exams' },
  { name: 'GATE Preparation',      category: 'Career & Exams' },
  { name: 'JEE / NEET Prep',       category: 'Career & Exams' },
  { name: 'MBA / CAT Prep',        category: 'Career & Exams' },
  { name: 'Bank Exam Prep',        category: 'Career & Exams' },
  { name: 'Resume Writing',        category: 'Career & Exams' },
  { name: 'Interview Preparation', category: 'Career & Exams' },
  { name: 'LinkedIn Optimization', category: 'Career & Exams' },
  { name: 'Aptitude & Reasoning',  category: 'Career & Exams' },
  { name: 'Group Discussion',      category: 'Career & Exams' },
  { name: 'Freelancing',           category: 'Career & Exams' },
  { name: 'Portfolio Building',    category: 'Career & Exams' },

  // ── Other (existing) ─────────────────────────────────────────────────────
  { name: 'Chess',                 category: 'Other' },
  { name: 'Poker',                 category: 'Other' },
  { name: 'Speed Reading',         category: 'Other' },
  { name: 'Memory Techniques',     category: 'Other' },
  { name: 'Touch Typing',          category: 'Other' },
  { name: 'Journaling',            category: 'Other' },
  { name: 'Mindfulness',           category: 'Other' },
  { name: 'Time Management',       category: 'Other' },
  { name: 'Habit Building',        category: 'Other' },
  { name: 'Gardening',             category: 'Other' },
  { name: 'Astrology',             category: 'Other' },
  { name: "Rubik's Cube",          category: 'Other' },
  { name: 'Home Repair & DIY',     category: 'Other' },
  { name: 'Car Maintenance',       category: 'Other' },

  // ── Other (new) ──────────────────────────────────────────────────────────
  { name: 'Vastu & Interior Tips', category: 'Other' },
  { name: 'Event Planning',        category: 'Other' },
  { name: 'Pet Training',          category: 'Other' },
  { name: 'Parenting Skills',      category: 'Other' },
  { name: 'Stoicism & Philosophy', category: 'Other' },
]

const seed = async () => {
  await mongoose.connect(MONGODB_URI)
  console.log('✅  Connected to MongoDB')

  await Skill.deleteMany({})
  console.log('🗑️   Cleared existing skills')

  const skills = await Skill.insertMany(SKILLS)
  const cats   = new Set(SKILLS.map(s => s.category)).size
  console.log(`✅  Inserted ${skills.length} skills across ${cats} categories`)
  console.log('\n📊  Breakdown:')
  const counts = {}
  SKILLS.forEach(s => { counts[s.category] = (counts[s.category] || 0) + 1 })
  Object.entries(counts).sort((a,b) => b[1]-a[1]).forEach(([cat, n]) => {
    console.log(`   ${cat.padEnd(25)} ${n} skills`)
  })
  console.log('\n🌱  Seed complete!\n')

  await mongoose.disconnect()
  process.exit(0)
}

seed().catch(err => {
  console.error('❌  Seed failed:', err)
  process.exit(1)
})