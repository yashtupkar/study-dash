const mongoose = require('mongoose');
const Subject = require('./models/Subject');
const fs = require('fs');
const dotenv = require('dotenv');

let envConfig = {};
if (fs.existsSync('.env')) {
  envConfig = dotenv.parse(fs.readFileSync('.env'));
}

const MONGO_URI = envConfig.MONGO_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/study-dash';

const subjectsData = [
  {
    key: 'quant',
    name: 'Quantitative Aptitude',
   topics: [
  "Number System",
  "HCF & LCM",
  "Decimal Fractions",
  "Simplification",
  "Percentage",
  "Ratio & Proportion",
  "Average",
  "Ages",
  "Profit & Loss",
  "Discount",
  "Simple Interest",
  "Compound Interest",
  "Partnership",
  "Time & Work",
  "Pipes & Cisterns",
  "Time, Speed & Distance",
  "Boats & Streams",
  "Mixture & Allegation",
  "Surds & Indices",
  "Mensuration",
  "Probability",
  "Permutation & Combination",
  "Elementary Statistics",
  "Data Interpretation"
]
  },
  {
    key: 'reasoning',
    name: 'Reasoning Ability',
topics: [
  "Number Series",
  "Alphabet Series",
  "Coding-Decoding",
  "Analogy",
  "Classification",
  "Blood Relations",
  "Direction Sense",
  "Clock & Calendar",
  "Cubes & Dice",
  "Syllogism",
  "Statement & Conclusions",
  "Statement & Arguments",
  "Decision Making",
  "Seating Arrangement",
  "Mirror Images",
  "Embedded Figures",
  "Non-Verbal Reasoning",
  "Data Analysis (Charts & Tables)"
]
  },
  {
    key: 'english',
    name: 'English Language',
    topics: [
  "Error Spotting",
  "Sentence Improvement",
  "Sentence Correction",
  "Fill in the Blanks",
  "Sentence Completion",
  "Para Jumbles",
  "Jumbled Sentences",
  "Reading Comprehension",
  "Synonyms",
  "Antonyms",
  "Idioms & Phrases",
  "One Word Substitution",
  "Vocabulary",
  "Grammar",
  "Active & Passive Voice",
  "Direct & Indirect Speech"
]
  },
  {
    key: 'ga',
    name: 'General Awareness',
   topics: [
  "Current Affairs",
  "Indian Polity",
  "Indian Constitution",
  "Modern History",
  "Ancient History",
  "Medieval History",
  "Indian Geography",
  "World Geography",
  "Indian Economy",
  "General Science",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Awareness",
  "Internet Awareness",
  "Science & Technology",
  "Climate Change",
  "Sustainable Development Goals",
  "Government Schemes",
  "Union Budget",
  "Awards & Honours",
  "Books & Authors",
  "Sports",
  "National & International Organisations",
  "National Parks & Wildlife Sanctuaries",
  "Important Monuments",
  "Ports & Power Plants",
  "Coal Sector in India"
]
  },
  {
    key: 'cs',
    name: 'Computer Science',
    topics: [
  "Programming Fundamentals",
  "C Programming",
  "Data Structures",
  "Algorithms",
  "Time Complexity",
  "Computer Organization",
  "Computer Architecture",
  "Digital Logic",
  "Boolean Algebra",
  "Number Systems",
  "Operating System",
  "Process Management",
  "CPU Scheduling",
  "Deadlocks",
  "Memory Management",
  "Virtual Memory",
  "File Systems",
  "Database Management System",
  "ER Model",
  "SQL",
  "Normalization",
  "Transactions",
  "Information System",
  "Software Engineering",
  "SDLC",
  "Agile Model",
  "Software Testing",
  "Computer Networks",
  "OSI Model",
  "TCP/IP",
  "IP Addressing",
  "Subnetting",
  "Routing",
  "HTTP",
  "DNS",
  "Network Security Basics",
  "Web Technologies",
  "HTML",
  "CSS",
  "JavaScript Basics"
]
  }
];

const seedDB = async () => {
  try {
    console.log(`Connecting to MongoDB at: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected. Seeding subjects...');

    // Clear current subjects
    await Subject.deleteMany({});
    console.log('Old subjects deleted.');

    // Insert new ones
    await Subject.insertMany(subjectsData);
    console.log('Subjects seeded successfully!');

    mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
};

seedDB();
