/**
 * seed.js — seeds sample challenges into MongoDB
 * Run with: node seed.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

dotenv.config({ path: join(__dirname, '../server/.env') });

// Inline mini-schema so we can run this standalone
const challengeSchema = new mongoose.Schema({
  title: String, slug: { type: String, unique: true, sparse: true },
  description: String, difficulty: String, category: String,
  tags: [String], companies: [String], topics: [String],
  starterCode: { javascript: String, python: String, java: String, cpp: String },
  testCases: [{ input: String, expectedOutput: String, isHidden: Boolean }],
  hints: [String], constraints: [String],
  examples: [{ input: String, output: String, explanation: String }],
  isAiGenerated: { type: Boolean, default: false },
  isDailyChallenge: { type: Boolean, default: false },
  dailyDate: Date,
  totalAttempts: { type: Number, default: 0 },
  totalSolved: { type: Number, default: 0 },
  acceptanceRate: { type: Number, default: 0 },
  points: { type: Number, default: 10 },
  timeLimit: { type: Number, default: 2000 },
  memoryLimit: { type: Number, default: 256 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Challenge = mongoose.model('Challenge', challengeSchema);

const CHALLENGES = [
  {
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    difficulty: 'easy', category: 'arrays',
    tags: ['array', 'hash-map'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'],
    points: 10,
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6',      output: '[1,2]', explanation: '' },
    ],
    testCases: [
      { input: '2 7 11 15\n9', expectedOutput: '0 1', isHidden: false },
      { input: '3 2 4\n6',     expectedOutput: '1 2', isHidden: false },
      { input: '3 3\n6',       expectedOutput: '0 1', isHidden: true  },
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Only one valid answer exists.'],
    hints: ['Think about using a hash map.', 'Can you do it in one pass?'],
    starterCode: {
      javascript: '/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n    // Write your solution here\n};\n',
      python: 'def two_sum(nums, target):\n    # Write your solution here\n    pass\n',
      java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your solution here\n        return {};\n    }\n};\n',
    },
    isDailyChallenge: true,
    dailyDate: new Date(),
  },
  {
    title: 'Valid Parentheses',
    description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.\n\nAn input string is valid if:\n- Open brackets must be closed by the same type of brackets.\n- Open brackets must be closed in the correct order.\n- Every close bracket has a corresponding open bracket of the same type.',
    difficulty: 'easy', category: 'stack-queue',
    tags: ['stack', 'string'], companies: ['Amazon', 'Google'],
    points: 10,
    examples: [
      { input: 's = "()"',     output: 'true',  explanation: '' },
      { input: 's = "()[]{}"', output: 'true',  explanation: '' },
      { input: 's = "(]"',     output: 'false', explanation: '' },
    ],
    testCases: [
      { input: '()',     expectedOutput: 'true',  isHidden: false },
      { input: '()[]{}', expectedOutput: 'true', isHidden: false },
      { input: '(]',     expectedOutput: 'false', isHidden: false },
      { input: '([)]',   expectedOutput: 'false', isHidden: true  },
      { input: '{[]}',   expectedOutput: 'true',  isHidden: true  },
    ],
    constraints: ['1 <= s.length <= 10^4', 's consists of parentheses only \'()[]{}\'.'],
    hints: ['Use a stack.', 'Push opening brackets, pop and check for closing brackets.'],
    starterCode: {
      javascript: '/**\n * @param {string} s\n * @return {boolean}\n */\nfunction isValid(s) {\n    // Write your solution here\n};\n',
      python: 'def is_valid(s: str) -> bool:\n    # Write your solution here\n    pass\n',
    },
  },
  {
    title: 'Maximum Subarray',
    description: 'Given an integer array nums, find the subarray with the largest sum, and return its sum.\n\nThis is the classic Kadane\'s algorithm problem.',
    difficulty: 'medium', category: 'dynamic-programming',
    tags: ['array', 'dynamic-programming', 'divide-and-conquer'], companies: ['Amazon', 'Adobe', 'Microsoft'],
    points: 25,
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' },
      { input: 'nums = [1]',                       output: '1', explanation: '' },
    ],
    testCases: [
      { input: '-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6', isHidden: false },
      { input: '1',                       expectedOutput: '1', isHidden: false },
      { input: '5 4 -1 7 8',             expectedOutput: '23', isHidden: false },
      { input: '-1 -2 -3',               expectedOutput: '-1', isHidden: true  },
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    hints: ['Think about Kadane\'s algorithm.', 'At each position, decide whether to extend the previous subarray or start new.'],
    starterCode: {
      javascript: '/**\n * @param {number[]} nums\n * @return {number}\n */\nfunction maxSubArray(nums) {\n    // Write your solution here\n};\n',
      python: 'def max_sub_array(nums):\n    # Write your solution here\n    pass\n',
    },
  },
  {
    title: 'Binary Search',
    description: 'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.',
    difficulty: 'easy', category: 'binary-search',
    tags: ['array', 'binary-search'], companies: ['Google', 'Amazon', 'Microsoft'],
    points: 10,
    examples: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4',  explanation: '9 exists in nums and its index is 4.' },
      { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1', explanation: '2 does not exist in nums so return -1.' },
    ],
    testCases: [
      { input: '-1 0 3 5 9 12\n9', expectedOutput: '4',  isHidden: false },
      { input: '-1 0 3 5 9 12\n2', expectedOutput: '-1', isHidden: false },
      { input: '5\n5',             expectedOutput: '0',  isHidden: true  },
    ],
    constraints: ['1 <= nums.length <= 10^4', '-10^4 < nums[i], target < 10^4', 'All the integers in nums are unique.'],
    hints: ['Use left and right pointers.', 'Compute mid = (left + right) // 2.'],
    starterCode: {
      javascript: '/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nfunction search(nums, target) {\n    // Write your solution here\n};\n',
      python: 'def search(nums, target):\n    # Write your solution here\n    pass\n',
    },
  },
  {
    title: 'Merge Two Sorted Lists',
    description: 'You are given the heads of two sorted linked lists list1 and list2.\n\nMerge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.\n\nReturn the head of the merged linked list.',
    difficulty: 'easy', category: 'linked-lists',
    tags: ['linked-list', 'recursion'], companies: ['Amazon', 'Microsoft', 'Google'],
    points: 10,
    examples: [
      { input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '[1,1,2,3,4,4]', explanation: '' },
      { input: 'list1 = [], list2 = []',             output: '[]',           explanation: '' },
    ],
    testCases: [
      { input: '1 2 4\n1 3 4', expectedOutput: '1 1 2 3 4 4', isHidden: false },
      { input: '\n',           expectedOutput: '',             isHidden: false },
    ],
    constraints: ['The number of nodes in both lists is in the range [0, 50].', '-100 <= Node.val <= 100'],
    hints: ['Use a dummy head node.', 'Compare values at each step.'],
    starterCode: {
      javascript: 'function mergeTwoLists(list1, list2) {\n    // Write your solution here\n};\n',
      python: 'def merge_two_lists(list1, list2):\n    # Write your solution here\n    pass\n',
    },
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    difficulty: 'medium', category: 'sliding-window',
    tags: ['string', 'sliding-window', 'hash-map'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Adobe'],
    points: 25,
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"',    output: '1', explanation: 'The answer is "b", with the length of 1.' },
    ],
    testCases: [
      { input: 'abcabcbb', expectedOutput: '3', isHidden: false },
      { input: 'bbbbb',    expectedOutput: '1', isHidden: false },
      { input: 'pwwkew',   expectedOutput: '3', isHidden: false },
      { input: '',          expectedOutput: '0', isHidden: true  },
    ],
    constraints: ['0 <= s.length <= 5 * 10^4', 's consists of English letters, digits, symbols and spaces.'],
    hints: ['Use a sliding window with a set.', 'When you find a repeat, shrink the window from the left.'],
    starterCode: {
      javascript: '/**\n * @param {string} s\n * @return {number}\n */\nfunction lengthOfLongestSubstring(s) {\n    // Write your solution here\n};\n',
      python: 'def length_of_longest_substring(s: str) -> int:\n    # Write your solution here\n    pass\n',
    },
  },
  {
    title: 'Number of Islands',
    description: 'Given an m x n 2D binary grid which represents a map of \'1\'s (land) and \'0\'s (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.',
    difficulty: 'medium', category: 'graphs',
    tags: ['dfs', 'bfs', 'graph', 'matrix'], companies: ['Amazon', 'Google', 'Microsoft', 'Uber'],
    points: 25,
    examples: [
      { input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: '1', explanation: '' },
      { input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: '3', explanation: '' },
    ],
    testCases: [
      { input: '11110\n11010\n11000\n00000', expectedOutput: '1', isHidden: false },
      { input: '11000\n11000\n00100\n00011', expectedOutput: '3', isHidden: false },
    ],
    constraints: ['m == grid.length', 'n == grid[i].length', '1 <= m, n <= 300', 'grid[i][j] is \'0\' or \'1\'.'],
    hints: ['Use DFS or BFS.', 'Mark visited land cells to avoid counting twice.'],
    starterCode: {
      javascript: '/**\n * @param {character[][]} grid\n * @return {number}\n */\nfunction numIslands(grid) {\n    // Write your solution here\n};\n',
      python: 'def num_islands(grid):\n    # Write your solution here\n    pass\n',
    },
  },
  {
    title: 'Climbing Stairs',
    description: 'You are climbing a staircase. It takes n steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
    difficulty: 'easy', category: 'dynamic-programming',
    tags: ['dynamic-programming', 'math', 'recursion'], companies: ['Amazon', 'Apple', 'Adobe'],
    points: 10,
    examples: [
      { input: 'n = 2', output: '2', explanation: '1. 1 step + 1 step\n2. 2 steps' },
      { input: 'n = 3', output: '3', explanation: '1. 1+1+1\n2. 1+2\n3. 2+1' },
    ],
    testCases: [
      { input: '2', expectedOutput: '2', isHidden: false },
      { input: '3', expectedOutput: '3', isHidden: false },
      { input: '5', expectedOutput: '8', isHidden: true  },
    ],
    constraints: ['1 <= n <= 45'],
    hints: ['This is similar to Fibonacci.', 'f(n) = f(n-1) + f(n-2).'],
    starterCode: {
      javascript: '/**\n * @param {number} n\n * @return {number}\n */\nfunction climbStairs(n) {\n    // Write your solution here\n};\n',
      python: 'def climb_stairs(n: int) -> int:\n    # Write your solution here\n    pass\n',
    },
  },
  {
    title: 'LRU Cache',
    description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the LRUCache class:\n- LRUCache(int capacity) Initialize the LRU cache with positive size capacity.\n- int get(int key) Return the value of the key if the key exists, otherwise return -1.\n- void put(int key, int value) Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.',
    difficulty: 'hard', category: 'hashing',
    tags: ['hash-map', 'linked-list', 'design'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Uber'],
    points: 50,
    examples: [
      { input: 'LRUCache(2), put(1,1), put(2,2), get(1), put(3,3), get(2), put(4,4), get(1), get(3), get(4)',
        output: '1, -1, -1, 3, 4', explanation: 'Follow LRU eviction policy.' },
    ],
    testCases: [
      { input: '2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\nget 3', expectedOutput: '1\n-1\n3', isHidden: false },
    ],
    constraints: ['1 <= capacity <= 3000', '0 <= key <= 10^4', '0 <= value <= 10^5'],
    hints: ['Use a doubly linked list + hash map.', 'The head of the list is the most recently used.'],
    starterCode: {
      javascript: 'class LRUCache {\n    /**\n     * @param {number} capacity\n     */\n    constructor(capacity) {\n        // Initialize your data structure\n    }\n\n    /**\n     * @param {number} key\n     * @return {number}\n     */\n    get(key) {\n        // Return value or -1\n    }\n\n    /**\n     * @param {number} key\n     * @param {number} value\n     * @return {void}\n     */\n    put(key, value) {\n        // Insert or update\n    }\n}\n',
      python: 'class LRUCache:\n    def __init__(self, capacity: int):\n        pass\n\n    def get(self, key: int) -> int:\n        pass\n\n    def put(self, key: int, value: int) -> None:\n        pass\n',
    },
  },
  {
    title: 'Coin Change',
    description: 'You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money.\n\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.\n\nYou may assume that you have an infinite number of each kind of coin.',
    difficulty: 'medium', category: 'dynamic-programming',
    tags: ['dynamic-programming', 'breadth-first-search'], companies: ['Amazon', 'Google', 'Microsoft', 'Uber'],
    points: 25,
    examples: [
      { input: 'coins = [1,5,11], amount = 11', output: '1',  explanation: '11 = 11.' },
      { input: 'coins = [2], amount = 3',        output: '-1', explanation: '3 cannot be made.' },
    ],
    testCases: [
      { input: '1 5 11\n11', expectedOutput: '1',  isHidden: false },
      { input: '2\n3',       expectedOutput: '-1', isHidden: false },
      { input: '1\n0',       expectedOutput: '0',  isHidden: true  },
    ],
    constraints: ['1 <= coins.length <= 12', '1 <= coins[i] <= 2^31 - 1', '0 <= amount <= 10^4'],
    hints: ['Use bottom-up DP.', 'dp[i] = min coins to make amount i.'],
    starterCode: {
      javascript: '/**\n * @param {number[]} coins\n * @param {number} amount\n * @return {number}\n */\nfunction coinChange(coins, amount) {\n    // Write your solution here\n};\n',
      python: 'def coin_change(coins, amount):\n    # Write your solution here\n    pass\n',
    },
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const existing = await Challenge.countDocuments();
    if (existing > 0) {
      console.log(`⚠️  ${existing} challenges already exist. Skipping duplicate seed.`);
      console.log('   To re-seed, drop the challenges collection first.');
      process.exit(0);
    }

    const inserted = await Challenge.insertMany(
      CHALLENGES.map((ch, i) => ({
        ...ch,
        slug: ch.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + i,
        acceptanceRate: Math.floor(Math.random() * 40) + 30,
        totalAttempts:  Math.floor(Math.random() * 5000) + 1000,
        totalSolved:    Math.floor(Math.random() * 2000) + 200,
      }))
    );

    console.log(`🎉 Seeded ${inserted.length} challenges successfully!`);
    console.log('Titles:');
    inserted.forEach((c, i) => console.log(`  ${i + 1}. ${c.title} [${c.difficulty}]`));

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
}

seed();
