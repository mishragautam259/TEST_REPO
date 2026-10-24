import { MemoryItem } from '../types';

// Creates a sleek, modern dark-friendly SVG screenshot data URL for sample data
function createSampleScreenshot(title: string, subtitle: string, highlight: string, accentColor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#090d16"/>
      </linearGradient>
      <linearGradient id="header" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${accentColor}"/>
        <stop offset="100%" stop-color="#6366f1"/>
      </linearGradient>
    </defs>
    <!-- Window frame -->
    <rect width="600" height="380" rx="12" fill="url(#bg)" stroke="#1e293b" stroke-width="2"/>
    <!-- Browser/App top bar -->
    <path d="M0,0 h600 a12,12 0 0 1 12,12 v36 h-624 v-36 a12,12 0 0 1 12,-12 z" fill="#131d31"/>
    <circle cx="28" cy="24" r="5" fill="#ef4444" opacity="0.8"/>
    <circle cx="44" cy="24" r="5" fill="#f59e0b" opacity="0.8"/>
    <circle cx="60" cy="24" r="5" fill="#10b981" opacity="0.8"/>
    <rect x="100" y="14" width="380" height="20" rx="6" fill="#0b1120" stroke="#1e293b" stroke-width="1"/>
    <text x="120" y="28" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" fill="#64748b">canvas.university.edu/courses/cs301/lecture-notes</text>
    
    <!-- Content card -->
    <rect x="28" y="70" width="544" height="280" rx="8" fill="#111827" stroke="#1f2937"/>
    <rect x="28" y="70" width="544" height="6" rx="3" fill="url(#header)"/>
    
    <text x="50" y="115" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="17" font-weight="bold" fill="#f1f5f9">${title}</text>
    <text x="50" y="140" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" fill="#94a3b8">${subtitle}</text>
    
    <!-- Email/Note body lines -->
    <rect x="50" y="165" width="500" height="10" rx="3" fill="#1f2937"/>
    <rect x="50" y="185" width="460" height="10" rx="3" fill="#1f2937"/>
    
    <!-- Highlight Callout Box -->
    <rect x="50" y="215" width="500" height="70" rx="8" fill="#042f2e" stroke="#0d9488" stroke-width="1.2"/>
    <text x="70" y="244" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="bold" fill="#2dd4bf">⚡ LECTURE SUMMARY &amp; EXAM ALERT</text>
    <text x="70" y="268" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="600" fill="#ccfbf1">${highlight}</text>
    
    <text x="50" y="325" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" fill="#64748b">CS301 Lecture 14 · Prof. Dr. Marcus Sterling · Dept of Computer Science</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// Sample memories to showcase immediate search functionality including college notes
export const INITIAL_SAMPLE_MEMORIES: MemoryItem[] = [
  {
    id: 'sample-college-notes-1',
    type: 'note',
    title: 'College Notes: CS301 Graph Algorithms & Dijkstra',
    description: 'Detailed college lecture notes from Prof. Marcus Sterling on Graph Algorithms. Covers Dijkstra’s Shortest Path, Bellman-Ford, Priority Queue optimization, time complexity O((V + E) log V), and negative cycle caveats for the upcoming midterm.',
    originalText: `CS301: Algorithms & Data Structures — Lecture 14
Professor: Dr. Marcus Sterling | Stanford Hall Rm 302
Topic: Single-Source Shortest Path (SSSP)

1. DIJKSTRA'S ALGORITHM
- Purpose: Finds shortest paths from a single source vertex to all other vertices in a weighted graph with non-negative edge weights.
- Key Invariant: Vertices are partitioned into Known (visited) and Unknown. In each step, pick unknown vertex u with minimum dist[u], then relax all outgoing edges (u, v).
- Data Structure: Min-Heap / Priority Queue (Binary Heap gives O((V + E) log V); Fibonacci Heap theoretically achieves O(E + V log V)).
- Critical Limitation: FAILS when edges have negative weights! For negative weights, use Bellman-Ford algorithm (O(V * E)).

2. KEY EXAM WARNINGS
- Question 3 on Homework 4 is due this Thursday, Oct 16th at 11:59 PM.
- Midterm Exam 2 covers Lecture 10 through 16 on Friday, November 7, 2026 in Johnson Auditorium.
- Bring a single 8.5x11 handwritten formula cheat sheet.`,
    extractedDetails: {
      text: 'CS301 Graph Algorithms, Dijkstra vs Bellman-Ford, min-heap time complexity O((V+E)log V), negative edge weight warning.',
      dates: ['October 16, 2026', 'November 7, 2026'],
      deadlines: ['Homework 4 due Oct 16, 2026 at 11:59 PM', 'Midterm 2 on Nov 7, 2026'],
      names: ['Dr. Marcus Sterling', 'CS301', 'Stanford Hall', 'Johnson Auditorium'],
    },
    imageBase64: createSampleScreenshot(
      'CS301: Graph Algorithms & Dijkstra SSSP',
      'Course: Algorithms & Data Structures · Prof. Dr. Marcus Sterling',
      'Midterm covers Dijkstra vs Bellman-Ford. HW4 due Oct 16 at 11:59 PM!',
      '#0d9488'
    ),
    createdAt: Date.now() - 1000 * 60 * 60 * 12, // 12 hours ago
    tags: ['college', 'notes', 'cs301', 'algorithms', 'exam'],
  },
  {
    id: 'sample-internship-2',
    type: 'screenshot',
    title: 'Google DeepMind Internship Deadline',
    description: 'Screenshot of an email confirmation regarding Summer Research Internship. Specifically notes the strict deadline of November 15, 2026 at 11:59 PM PST for submitting portfolio projects.',
    extractedDetails: {
      text: 'Subject: Summer Research Internship Application. Strict deadline notice for all portfolio submissions and interview scheduling.',
      dates: ['November 15, 2026', 'December 1, 2026'],
      deadlines: ['November 15, 2026 at 11:59 PM PST'],
      names: ['Sarah Chen', 'DeepMind Campus Recruitment', 'Dr. Aris Vance'],
    },
    imageBase64: createSampleScreenshot(
      'DeepMind Research Internship Application',
      'From: Sarah Chen (recruiting@deepmind.com) · To: Me',
      'Final submission deadline: Friday, November 15, 2026 at 11:59 PM PST',
      '#0d9488'
    ),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
    tags: ['career', 'internship', 'deadline'],
  },
  {
    id: 'sample-flight-3',
    type: 'screenshot',
    title: 'Flight Confirmation to San Francisco',
    description: 'Screenshot of United Airlines booking confirmation for flight UA-482 departing from Tokyo to SFO on December 12, 2026, gate B24.',
    extractedDetails: {
      text: 'Confirmation code: K7L9PQ. Seat 14A Economy Plus. Terminal 3.',
      dates: ['December 12, 2026', 'December 13, 2026'],
      deadlines: ['Check-in closes 60 mins before departure'],
      names: ['United Airlines', 'Flight UA 482'],
    },
    imageBase64: createSampleScreenshot(
      'United Airlines Confirmation: UA 482',
      'Booking Ref: #K7L9PQ · Passenger: Jyotisman',
      'Flight Date: December 12, 2026 · Departs 10:45 AM Gate B24',
      '#7c3aed'
    ),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
    tags: ['travel', 'flight'],
  },
  {
    id: 'sample-voice-4',
    type: 'transcript',
    title: 'Voice memo: Dr. Bennett Dental Appointment',
    description: 'Voice transcript dictating Dr. Bennett dental cleaning appointment scheduled for next Tuesday Oct 14 at 2:30 PM. Remember to bring insurance card.',
    originalText: 'Voice note recorded at 3:15pm: "Hey remember you have the dental checkup with Dr. Bennett next Tuesday, October 14th at 2:30 PM. His clinic is on 4th Avenue suite 200, and you need to bring your physical MetLife insurance card."',
    extractedDetails: {
      text: 'Dental checkup with Dr. Bennett on October 14 at 2:30 PM on 4th Ave suite 200. Bring MetLife card.',
      dates: ['October 14, 2026'],
      deadlines: ['October 14, 2026 at 2:30 PM'],
      names: ['Dr. Bennett', 'MetLife Insurance'],
    },
    createdAt: Date.now() - 1000 * 60 * 60 * 18, // 18 hours ago
    tags: ['health', 'appointment'],
  },
  {
    id: 'sample-wifi-5',
    type: 'note',
    title: 'Apartment Wi-Fi & Gate Keycode',
    description: 'Pasted note with guest Wi-Fi credentials for Skyline Lofts 4B: Network "SkylineGuest-5G", Password "CosmicAurora99!". Gate code #4910.',
    originalText: 'Skyline Lofts Unit 4B codes:\nWi-Fi SSID: SkylineGuest-5G\nPassword: CosmicAurora99!\nBuilding Gate Code: #4910\nTrash chute located near elevator B on the 4th floor.',
    extractedDetails: {
      text: 'SSID: SkylineGuest-5G, Pass: CosmicAurora99!, Gate Code: #4910',
      dates: [],
      deadlines: [],
      names: ['Skyline Lofts'],
    },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 8, // 8 days ago
    tags: ['home', 'passwords'],
  },
];
