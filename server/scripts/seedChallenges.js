/**
 * Challenge Seed Script
 * Run: node scripts/seedChallenges.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Helper: serialize test-case values to strings (schema requires String)
const s = (v) => JSON.stringify(v);

const CHALLENGES = [
  /* ── EASY ──────────────────────────────────────────────────────── */
  {
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume exactly one solution exists.',
    difficulty: 'easy',
    category: 'arrays',
    tags: ['array', 'hash-table'],
    companies: ['Google', 'Amazon', 'Facebook'],
    starterCode: {
      javascript: `function twoSum(nums, target) {\n  // Your code here\n}`,
      python: `def two_sum(nums, target):\n    # Your code here\n    pass`,
    },
    testCases: [
      { input: s([[2,7,11,15], 9]),   expectedOutput: s([0,1]), isHidden: false },
      { input: s([[3,2,4], 6]),        expectedOutput: s([1,2]), isHidden: false },
      { input: s([[3,3], 6]),          expectedOutput: s([0,1]), isHidden: true  },
    ],
    isDailyChallenge: true,
    dailyDate: new Date(),
    isActive: true,
  },
  {
    title: 'Reverse a String',
    description: 'Write a function that reverses a string. The input string is given as an array of characters. Reverse in-place with O(1) extra memory.',
    difficulty: 'easy',
    category: 'strings',
    tags: ['string', 'two-pointers'],
    companies: ['Microsoft', 'Apple'],
    starterCode: {
      javascript: `function reverseString(s) {\n  // modify s in-place\n}`,
      python: `def reverse_string(s):\n    # modify s in-place\n    pass`,
    },
    testCases: [
      { input: s([['h','e','l','l','o']]),          expectedOutput: s(['o','l','l','e','h']), isHidden: false },
      { input: s([['H','a','n','n','a','h']]),      expectedOutput: s(['h','a','n','n','a','H']), isHidden: false },
    ],
    isActive: true,
  },
  {
    title: 'Valid Parentheses',
    description: "Given a string s containing just '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    difficulty: 'easy',
    category: 'stack-queue',
    tags: ['string', 'stack'],
    companies: ['Amazon', 'Bloomberg', 'Facebook'],
    starterCode: {
      javascript: `function isValid(s) {\n  // Your code here\n}`,
      python: `def is_valid(s):\n    # Your code here\n    pass`,
    },
    testCases: [
      { input: s(['()']),     expectedOutput: s(true),  isHidden: false },
      { input: s(['()[]{}']), expectedOutput: s(true),  isHidden: false },
      { input: s(['(]']),     expectedOutput: s(false), isHidden: false },
      { input: s(['{[]}']),   expectedOutput: s(true),  isHidden: true  },
    ],
    isActive: true,
  },
  {
    title: 'Best Time to Buy and Sell Stock',
    description: 'Given prices[i] as the price on day i, find the maximum profit from a single buy-sell pair. Return 0 if no profit is possible.',
    difficulty: 'easy',
    category: 'arrays',
    tags: ['array', 'dynamic-programming'],
    companies: ['Amazon', 'Facebook', 'Microsoft'],
    starterCode: {
      javascript: `function maxProfit(prices) {\n  // Your code here\n}`,
      python: `def max_profit(prices):\n    # Your code here\n    pass`,
    },
    testCases: [
      { input: s([[7,1,5,3,6,4]]), expectedOutput: s(5), isHidden: false },
      { input: s([[7,6,4,3,1]]),   expectedOutput: s(0), isHidden: false },
    ],
    isActive: true,
  },
  {
    title: 'Climbing Stairs',
    description: 'You can climb 1 or 2 steps at a time. Given n steps, how many distinct ways can you climb to the top?',
    difficulty: 'easy',
    category: 'dynamic-programming',
    tags: ['math', 'dynamic-programming', 'memoization'],
    companies: ['Amazon', 'Google'],
    starterCode: {
      javascript: `function climbStairs(n) {\n  // Your code here\n}`,
      python: `def climb_stairs(n):\n    # Your code here\n    pass`,
    },
    testCases: [
      { input: s([2]), expectedOutput: s(2), isHidden: false },
      { input: s([3]), expectedOutput: s(3), isHidden: false },
      { input: s([5]), expectedOutput: s(8), isHidden: true  },
    ],
    isActive: true,
  },
  {
    title: 'Contains Duplicate',
    description: 'Given an integer array nums, return true if any value appears at least twice in the array, and false if every element is distinct.',
    difficulty: 'easy',
    category: 'hashing',
    tags: ['array', 'hash-table', 'sorting'],
    companies: ['Adobe', 'Palantir', 'Yahoo'],
    starterCode: {
      javascript: `function containsDuplicate(nums) {\n  // Your code here\n}`,
      python: `def contains_duplicate(nums):\n    # Your code here\n    pass`,
    },
    testCases: [
      { input: s([[1,2,3,1]]),   expectedOutput: s(true),  isHidden: false },
      { input: s([[1,2,3,4]]),   expectedOutput: s(false), isHidden: false },
      { input: s([[1,1,1,3,3,4,3,2,4,2]]), expectedOutput: s(true), isHidden: true },
    ],
    isActive: true,
  },

  /* ── MEDIUM ─────────────────────────────────────────────────────── */
  {
    title: 'Longest Substring Without Repeating Characters',
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    difficulty: 'medium',
    category: 'sliding-window',
    tags: ['hash-table', 'string', 'sliding-window'],
    companies: ['Amazon', 'Bloomberg', 'Facebook', 'Google'],
    starterCode: {
      javascript: `function lengthOfLongestSubstring(s) {\n  // Your code here\n}`,
      python: `def length_of_longest_substring(s):\n    # Your code here\n    pass`,
    },
    testCases: [
      { input: s(['abcabcbb']), expectedOutput: s(3), isHidden: false },
      { input: s(['bbbbb']),    expectedOutput: s(1), isHidden: false },
      { input: s(['pwwkew']),   expectedOutput: s(3), isHidden: true  },
    ],
    isActive: true,
  },
  {
    title: 'Group Anagrams',
    description: 'Given an array of strings strs, group the anagrams together. You can return the answer in any order.',
    difficulty: 'medium',
    category: 'hashing',
    tags: ['array', 'hash-table', 'string', 'sorting'],
    companies: ['Facebook', 'Amazon', 'Uber'],
    starterCode: {
      javascript: `function groupAnagrams(strs) {\n  // Your code here\n}`,
      python: `def group_anagrams(strs):\n    # Your code here\n    pass`,
    },
    testCases: [
      { input: s([['eat','tea','tan','ate','nat','bat']]), expectedOutput: s([['bat'],['nat','tan'],['ate','eat','tea']]), isHidden: false },
      { input: s([['']]),                                  expectedOutput: s([['']]),                                     isHidden: false },
    ],
    isActive: true,
  },
  {
    title: 'Maximum Subarray',
    description: 'Given an integer array nums, find the subarray with the largest sum, and return its sum.',
    difficulty: 'medium',
    category: 'dynamic-programming',
    tags: ['array', 'dynamic-programming', 'divide-and-conquer'],
    companies: ['LinkedIn', 'Google', 'Microsoft'],
    starterCode: {
      javascript: `function maxSubArray(nums) {\n  // Your code here\n}`,
      python: `def max_sub_array(nums):\n    # Your code here\n    pass`,
    },
    testCases: [
      { input: s([[-2,1,-3,4,-1,2,1,-5,4]]), expectedOutput: s(6),  isHidden: false },
      { input: s([[1]]),                       expectedOutput: s(1),  isHidden: false },
      { input: s([[5,4,-1,7,8]]),              expectedOutput: s(23), isHidden: true  },
    ],
    isActive: true,
  },
  {
    title: '3Sum',
    description: 'Given an integer array nums, return all triplets [i, j, k] such that nums[i] + nums[j] + nums[k] == 0. The solution set must not contain duplicate triplets.',
    difficulty: 'medium',
    category: 'two-pointers',
    tags: ['array', 'two-pointers', 'sorting'],
    companies: ['Facebook', 'Amazon', 'Microsoft'],
    starterCode: {
      javascript: `function threeSum(nums) {\n  // Your code here\n}`,
      python: `def three_sum(nums):\n    # Your code here\n    pass`,
    },
    testCases: [
      { input: s([[-1,0,1,2,-1,-4]]), expectedOutput: s([[-1,-1,2],[-1,0,1]]), isHidden: false },
      { input: s([[0,1,1]]),           expectedOutput: s([]),                   isHidden: false },
    ],
    isActive: true,
  },
  {
    title: 'Container With Most Water',
    description: 'Given an integer array height, find two lines that together with the x-axis form a container that holds the most water. Return the maximum amount of water the container can store.',
    difficulty: 'medium',
    category: 'two-pointers',
    tags: ['array', 'two-pointers', 'greedy'],
    companies: ['Facebook', 'Amazon', 'Google'],
    starterCode: {
      javascript: `function maxArea(height) {\n  // Your code here\n}`,
      python: `def max_area(height):\n    # Your code here\n    pass`,
    },
    testCases: [
      { input: s([[1,8,6,2,5,4,8,3,7]]), expectedOutput: s(49), isHidden: false },
      { input: s([[1,1]]),                 expectedOutput: s(1),  isHidden: true  },
    ],
    isActive: true,
  },
  {
    title: 'Product of Array Except Self',
    description: 'Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i]. Must run in O(n) without using division.',
    difficulty: 'medium',
    category: 'arrays',
    tags: ['array', 'prefix-sum'],
    companies: ['Facebook', 'Amazon', 'Microsoft', 'Apple'],
    starterCode: {
      javascript: `function productExceptSelf(nums) {\n  // Your code here\n}`,
      python: `def product_except_self(nums):\n    # Your code here\n    pass`,
    },
    testCases: [
      { input: s([[1,2,3,4]]),       expectedOutput: s([24,12,8,6]),   isHidden: false },
      { input: s([[-1,1,0,-3,3]]),   expectedOutput: s([0,0,9,0,0]),   isHidden: true  },
    ],
    isActive: true,
  },

  /* ── HARD ───────────────────────────────────────────────────────── */
  {
    title: 'Trapping Rain Water',
    description: 'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
    difficulty: 'hard',
    category: 'two-pointers',
    tags: ['array', 'two-pointers', 'dynamic-programming', 'stack', 'monotonic-stack'],
    companies: ['Google', 'Amazon', 'Goldman Sachs'],
    starterCode: {
      javascript: `function trap(height) {\n  // Your code here\n}`,
      python: `def trap(height):\n    # Your code here\n    pass`,
    },
    testCases: [
      { input: s([[0,1,0,2,1,0,1,3,2,1,2,1]]), expectedOutput: s(6), isHidden: false },
      { input: s([[4,2,0,3,2,5]]),               expectedOutput: s(9), isHidden: false },
    ],
    isActive: true,
  },
  {
    title: 'Longest Valid Parentheses',
    description: "Given a string containing just '(' and ')', return the length of the longest valid (well-formed) parentheses substring.",
    difficulty: 'hard',
    category: 'stack-queue',
    tags: ['string', 'dynamic-programming', 'stack'],
    companies: ['Amazon', 'Microsoft'],
    starterCode: {
      javascript: `function longestValidParentheses(s) {\n  // Your code here\n}`,
      python: `def longest_valid_parentheses(s):\n    # Your code here\n    pass`,
    },
    testCases: [
      { input: s(['(()']),    expectedOutput: s(2), isHidden: false },
      { input: s([')()())']), expectedOutput: s(4), isHidden: false },
      { input: s(['']),       expectedOutput: s(0), isHidden: true  },
    ],
    isActive: true,
  },
  {
    title: 'N-Queens',
    description: 'Place n queens on an n×n chessboard such that no two queens attack each other. Return all distinct solutions.',
    difficulty: 'hard',
    category: 'backtracking',
    tags: ['array', 'backtracking'],
    companies: ['Google', 'Amazon'],
    starterCode: {
      javascript: `function solveNQueens(n) {\n  // Your code here\n}`,
      python: `def solve_n_queens(n):\n    # Your code here\n    pass`,
    },
    testCases: [
      { input: s([4]), expectedOutput: s([['.Q..','...Q','Q...','..Q.'],['..Q.','Q...','...Q','.Q..']]), isHidden: false },
      { input: s([1]), expectedOutput: s([['Q']]),                                                        isHidden: false },
    ],
    isActive: true,
  },
  {
    title: 'Median of Two Sorted Arrays',
    description: 'Given two sorted arrays nums1 and nums2, return the median of the two sorted arrays. The overall run time complexity should be O(log(m+n)).',
    difficulty: 'hard',
    category: 'binary-search',
    tags: ['array', 'binary-search', 'divide-and-conquer'],
    companies: ['Google', 'Amazon', 'Microsoft', 'Apple'],
    starterCode: {
      javascript: `function findMedianSortedArrays(nums1, nums2) {\n  // Your code here\n}`,
      python: `def find_median_sorted_arrays(nums1, nums2):\n    # Your code here\n    pass`,
    },
    testCases: [
      { input: s([[1,3],[2]]),   expectedOutput: s(2.0), isHidden: false },
      { input: s([[1,2],[3,4]]), expectedOutput: s(2.5), isHidden: false },
    ],
    isActive: true,
  },
];

async function seed() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI not set in .env');

    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB Atlas');

    const { default: Challenge } = await import('../models/Challenge.js');

    const existingTitles = CHALLENGES.map(c => c.title);
    const deleted = await Challenge.deleteMany({ title: { $in: existingTitles } });
    console.log(`🗑️  Removed ${deleted.deletedCount} existing challenge(s)`);

    const inserted = await Challenge.insertMany(CHALLENGES);
    console.log(`✅ Seeded ${inserted.length} challenges!\n`);

    const byCat = {};
    CHALLENGES.forEach(c => { byCat[c.difficulty] = (byCat[c.difficulty] || 0) + 1; });
    console.log('📊 Summary:');
    Object.entries(byCat).forEach(([k, v]) => console.log(`   ${k}: ${v}`));

  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected. Done!');
    process.exit(0);
  }
}

seed();
