const fs = require('fs').promises;
const path = require('path');

class LeetCodeVideoGenerator {
    constructor(options = {}) {
        this.geminiApiKey = this.getApiKey(options.geminiApiKey || options.apiKey);
        this.outputDir = options.outputDir || path.join(__dirname, 'generated_videos');
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
    }

    getApiKey(providedKey) {
        if (providedKey) return providedKey;
        if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
        return 'AIzaSyB8aViqFr12veLR77wQAOVBZlbCb2KOQsU';
    }

    createScriptGenerationPrompt(question) {
        const questionData = typeof question === 'string' ? {title: question} : question;
        const title = questionData.title || questionData.name || 'Unknown Problem';
        const difficulty = questionData.difficulty || 'Medium';
        const category = questionData.category || 'Data Structures & Algorithms';
        const description = questionData.description || 'A challenging programming problem.';

        return `You are a precision video script generator for LeetCode tutorials. Create EXACTLY 8 scenes with precise timing and concise, non-overlapping content.

STRICT REQUIREMENTS:
- Each script must be EXACTLY 25-35 words per scene (for precise timing)
- Focus on core concepts only, no filler words
- Include specific data structure visualizations
- Mention exact array indices, hash table operations, etc.
- Scripts must be educational but concise

PROBLEM: ${title} (${difficulty})
CATEGORY: ${category}
DESCRIPTION: ${description}

Return ONLY this JSON (no markdown, no explanations):

{
  "metadata": {
    "title": "${title} - LeetCode Solution",
    "duration": "8 minutes",
    "topic": "${category}",
    "difficulty": "${difficulty}",
    "total_scenes": 8,
    "theme": "minimal_black",
    "primary_color": "#00ff88",
    "secondary_color": "#0088ff", 
    "background_color": "#000000",
    "text_color": "#ffffff",
    "accent_color": "#ff4444",
    "problem_url": "${questionData.link || 'https://leetcode.com/problems/'}",
    "target_audience": "Interview Preparation"
  },
  "scenes": [
    {
      "scene_id": 1,
      "timestamp": "00:00-01:00",
      "title": "Problem Statement",
      "script": "${title}: Given array of integers and target, return indices where two numbers sum to target. Each input has exactly one solution.",
      "data_structures": ["array"],
      "key_concepts": ["two_pointer", "indices"]
    },
    {
      "scene_id": 2,
      "timestamp": "01:00-02:00", 
      "title": "Example Visualization",
      "script": "Example: nums=[2,7,11,15], target=9. We need indices where nums[i]+nums[j]=target. Answer: [0,1] because nums[0]+nums[1]=2+7=9.",
      "data_structures": ["array", "indices"],
      "key_concepts": ["example_trace", "sum_calculation"]
    },
    {
      "scene_id": 3,
      "timestamp": "02:00-03:00",
      "title": "Brute Force Approach", 
      "script": "Brute force: nested loops check every pair. Outer loop i=0 to n-2, inner loop j=i+1 to n-1. Time O(n²), Space O(1).",
      "data_structures": ["nested_loops"],
      "key_concepts": ["time_complexity", "space_complexity"]
    },
    {
      "scene_id": 4,
      "timestamp": "03:00-04:00",
      "title": "Hash Map Optimization",
      "script": "Optimal: Use hash map to store value→index mapping. For each number, check if target-number exists in map. Time O(n), Space O(n).",
      "data_structures": ["hash_map", "array"],
      "key_concepts": ["complement", "lookup"]
    },
    {
      "scene_id": 5,
      "timestamp": "04:00-05:00",
      "title": "Algorithm Implementation",
      "script": "Code: Create empty map. Iterate array: complement=target-nums[i]. If complement in map, return [map[complement], i]. Else map[nums[i]]=i.",
      "data_structures": ["hash_map", "variables"],
      "key_concepts": ["algorithm_steps", "implementation"]
    },
    {
      "scene_id": 6,
      "timestamp": "05:00-06:00",
      "title": "Step-by-Step Trace",
      "script": "Trace [2,7,11,15], target=9: i=0, complement=7, map empty, store map[2]=0. i=1, complement=2, found map[2]=0, return [0,1].",
      "data_structures": ["execution_trace", "hash_map"],
      "key_concepts": ["step_by_step", "variable_tracking"]
    },
    {
      "scene_id": 7,
      "timestamp": "06:00-07:00",
      "title": "Edge Cases",
      "script": "Edge cases: duplicate values [3,3], target=6 returns [0,1]. Empty array impossible. Single element impossible. All cases handled by algorithm.",
      "data_structures": ["special_arrays"],
      "key_concepts": ["edge_cases", "validation"]
    },
    {
      "scene_id": 8,
      "timestamp": "07:00-08:00",
      "title": "Complexity Summary",
      "script": "Final solution: Time O(n) single pass, Space O(n) hash map storage. Optimal for interview. Pattern applies to similar complement-finding problems.",
      "data_structures": ["complexity_chart"],
      "key_concepts": ["big_o", "optimization"]
    }
  ]
}`;
    }

    createVideoCodeGenerationPrompt(scriptJson) {
        return `You are a precision HTML/CSS generator for technical video content. Create pixel-perfect, minimalistic designs with ZERO text overflow.

CRITICAL REQUIREMENTS:
- Pure black background (#000000) ONLY
- Font sizes calculated to fit 1920x1080 exactly
- No text must exceed container bounds
- Data structures rendered as clean visual diagrams
- Monospace font for all code
- White text (#ffffff) with accent colors for highlighting
- Maximum content width: 1800px (100px margin each side)
- Maximum content height: 980px (50px margin top/bottom)

SCENE CONTENT: ${JSON.stringify(scriptJson, null, 2)}

For each scene, create appropriate visualizations:
- Arrays: horizontal boxes with indices
- Hash Maps: key→value pairs in tables
- Code: syntax highlighted with line numbers
- Traces: step-by-step variable states
- Complexity: clean O(n) notation

Return ONLY this JSON structure with complete HTML for all ${scriptJson.scenes?.length || 8} scenes:

{
  "metadata": {
    "theme": "ultra_minimal",
    "primary_color": "#00ff88",
    "secondary_color": "#0088ff",
    "background_color": "#000000", 
    "text_color": "#ffffff",
    "accent_color": "#ff4444"
  },
  "scenes": [
    {
      "scene_id": 1,
      "html": "<div class='title primary' style='font-size: 64px; font-weight: bold; margin-bottom: 40px; text-align: center;'>${scriptJson.metadata?.title || 'LeetCode Problem'}</div><div class='subtitle secondary' style='font-size: 32px; margin-bottom: 60px; text-align: center;'>Problem Statement & Analysis</div><div class='content' style='font-size: 24px; line-height: 1.6; max-width: 1400px; text-align: center;'>Given an array of integers and a target value,<br>find <span class='accent' style='color: #ff4444; font-weight: bold;'>two indices</span> where numbers sum to target.<br><br><span class='accent' style='color: #ff4444;'>Constraint:</span> Exactly one solution exists.</div>"
    },
    {
      "scene_id": 2,
      "html": "<div class='title secondary' style='font-size: 48px; margin-bottom: 40px; text-align: center;'>Example Visualization</div><div class='array-demo' style='display: flex; flex-direction: column; align-items: center; gap: 30px;'><div class='array-container' style='display: flex; gap: 15px; align-items: center;'><div class='array-label' style='font-size: 28px; margin-right: 20px;'>nums =</div><div class='array-element' style='background: #1a1a1a; border: 2px solid #333; padding: 15px 20px; font-size: 24px; position: relative;'>2<div style='position: absolute; bottom: -25px; left: 50%; transform: translateX(-50%); font-size: 16px; color: #888;'>0</div></div><div class='array-element' style='background: #1a1a1a; border: 2px solid #00ff88; padding: 15px 20px; font-size: 24px; position: relative; color: #00ff88;'>7<div style='position: absolute; bottom: -25px; left: 50%; transform: translateX(-50%); font-size: 16px; color: #888;'>1</div></div><div class='array-element' style='background: #1a1a1a; border: 2px solid #333; padding: 15px 20px; font-size: 24px; position: relative;'>11<div style='position: absolute; bottom: -25px; left: 50%; transform: translateX(-50%); font-size: 16px; color: #888;'>2</div></div><div class='array-element' style='background: #1a1a1a; border: 2px solid #333; padding: 15px 20px; font-size: 24px; position: relative;'>15<div style='position: absolute; bottom: -25px; left: 50%; transform: translateX(-50%); font-size: 16px; color: #888;'>3</div></div></div><div class='target' style='font-size: 28px; margin: 20px 0;'>target = <span class='accent' style='color: #ff4444;'>9</span></div><div class='result' style='font-size: 24px; color: #00ff88;'>Answer: [0, 1] because nums[0] + nums[1] = 2 + 7 = 9</div></div>"
    },
    {
      "scene_id": 3,
      "html": "<div class='title accent' style='font-size: 48px; margin-bottom: 40px; text-align: center;'>Brute Force Approach</div><div class='algorithm-container' style='display: flex; flex-direction: column; align-items: center; gap: 40px;'><div class='nested-loops' style='background: #1a1a1a; padding: 30px; border-radius: 10px; font-family: monospace; font-size: 20px; line-height: 1.6;'><div>for (let i = 0; i < nums.length - 1; i++) {</div><div style='margin-left: 40px;'>for (let j = i + 1; j < nums.length; j++) {</div><div style='margin-left: 80px;'>if (nums[i] + nums[j] === target) {</div><div style='margin-left: 120px; color: #00ff88;'>return [i, j];</div><div style='margin-left: 80px;'>}</div><div style='margin-left: 40px;'>}</div><div>}</div></div><div class='complexity-analysis' style='display: flex; gap: 60px; font-size: 24px;'><div class='time-complexity'>Time: <span class='accent' style='color: #ff4444; font-weight: bold;'>O(n²)</span></div><div class='space-complexity'>Space: <span class='primary' style='color: #00ff88; font-weight: bold;'>O(1)</span></div></div></div>"
    },
    {
      "scene_id": 4,
      "html": "<div class='title primary' style='font-size: 48px; margin-bottom: 40px; text-align: center;'>Hash Map Optimization</div><div class='hashmap-container' style='display: flex; flex-direction: column; align-items: center; gap: 40px;'><div class='concept' style='font-size: 24px; text-align: center; max-width: 1200px; line-height: 1.6;'>Store each number and its index in a hash map.<br>For each element, check if <span class='accent' style='color: #ff4444;'>complement = target - current</span> exists.</div><div class='hashmap-visual' style='display: flex; flex-direction: column; background: #1a1a1a; padding: 25px; border-radius: 10px;'><div class='hashmap-header' style='display: flex; font-size: 20px; font-weight: bold; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px;'><div style='width: 150px; text-align: center; color: #0088ff;'>Value</div><div style='width: 80px; text-align: center;'>→</div><div style='width: 150px; text-align: center; color: #00ff88;'>Index</div></div><div class='hashmap-entry' style='display: flex; font-size: 18px; margin: 8px 0;'><div style='width: 150px; text-align: center; background: #333; padding: 8px; border-radius: 5px;'>2</div><div style='width: 80px; text-align: center; color: #888;'>→</div><div style='width: 150px; text-align: center; background: #333; padding: 8px; border-radius: 5px;'>0</div></div><div class='hashmap-entry' style='display: flex; font-size: 18px; margin: 8px 0;'><div style='width: 150px; text-align: center; background: #333; padding: 8px; border-radius: 5px;'>7</div><div style='width: 80px; text-align: center; color: #888;'>→</div><div style='width: 150px; text-align: center; background: #333; padding: 8px; border-radius: 5px;'>1</div></div></div><div class='complexity-improved' style='display: flex; gap: 60px; font-size: 24px;'><div class='time-complexity'>Time: <span class='primary' style='color: #00ff88; font-weight: bold;'>O(n)</span></div><div class='space-complexity'>Space: <span class='secondary' style='color: #0088ff; font-weight: bold;'>O(n)</span></div></div></div>"
    },
    {
      "scene_id": 5,
      "html": "<div class='title secondary' style='font-size: 48px; margin-bottom: 30px; text-align: center;'>Algorithm Implementation</div><div class='code-container' style='background: #0a0a0a; border: 2px solid #333; border-radius: 10px; padding: 25px; font-family: monospace; max-width: 1400px;'><div class='code-header' style='color: #00ff88; font-size: 18px; margin-bottom: 20px; font-weight: bold;'>JavaScript Solution</div><div class='code-line' style='font-size: 16px; line-height: 1.8; margin: 4px 0;'><span style='color: #666; width: 30px; display: inline-block;'>1</span><span style='color: #0088ff;'>function</span> <span style='color: #ffffff;'>twoSum(nums, target) {</span></div><div class='code-line' style='font-size: 16px; line-height: 1.8; margin: 4px 0;'><span style='color: #666; width: 30px; display: inline-block;'>2</span><span style='margin-left: 20px; color: #0088ff;'>const</span> <span style='color: #ffffff;'>map = </span><span style='color: #0088ff;'>new</span> <span style='color: #ffffff;'>Map();</span></div><div class='code-line' style='font-size: 16px; line-height: 1.8; margin: 4px 0;'><span style='color: #666; width: 30px; display: inline-block;'>3</span><span style='margin-left: 20px; color: #0088ff;'>for</span> <span style='color: #ffffff;'>(</span><span style='color: #0088ff;'>let</span> <span style='color: #ffffff;'>i = 0; i < nums.length; i++) {</span></div><div class='code-line' style='font-size: 16px; line-height: 1.8; margin: 4px 0; background: rgba(255, 68, 68, 0.2); padding: 2px 5px;'><span style='color: #666; width: 30px; display: inline-block;'>4</span><span style='margin-left: 40px; color: #0088ff;'>const</span> <span style='color: #ffffff;'>complement = target - nums[i];</span></div><div class='code-line' style='font-size: 16px; line-height: 1.8; margin: 4px 0; background: rgba(255, 68, 68, 0.2); padding: 2px 5px;'><span style='color: #666; width: 30px; display: inline-block;'>5</span><span style='margin-left: 40px; color: #0088ff;'>if</span> <span style='color: #ffffff;'>(map.has(complement)) {</span></div><div class='code-line' style='font-size: 16px; line-height: 1.8; margin: 4px 0;'><span style='color: #666; width: 30px; display: inline-block;'>6</span><span style='margin-left: 60px; color: #0088ff;'>return</span> <span style='color: #ffffff;'>[map.get(complement), i];</span></div><div class='code-line' style='font-size: 16px; line-height: 1.8; margin: 4px 0;'><span style='color: #666; width: 30px; display: inline-block;'>7</span><span style='margin-left: 40px; color: #ffffff;'>}</span></div><div class='code-line' style='font-size: 16px; line-height: 1.8; margin: 4px 0;'><span style='color: #666; width: 30px; display: inline-block;'>8</span><span style='margin-left: 40px; color: #ffffff;'>map.set(nums[i], i);</span></div><div class='code-line' style='font-size: 16px; line-height: 1.8; margin: 4px 0;'><span style='color: #666; width: 30px; display: inline-block;'>9</span><span style='margin-left: 20px; color: #ffffff;'>}</span></div><div class='code-line' style='font-size: 16px; line-height: 1.8; margin: 4px 0;'><span style='color: #666; width: 30px; display: inline-block;'>10</span><span style='color: #ffffff;'>}</span></div></div>"
    },
    {
      "scene_id": 6,
      "html": "<div class='title accent' style='font-size: 48px; margin-bottom: 30px; text-align: center;'>Step-by-Step Trace</div><div class='trace-container' style='display: flex; flex-direction: column; gap: 25px; max-width: 1600px;'><div class='trace-setup' style='text-align: center; font-size: 22px; margin-bottom: 20px;'>nums = [2, 7, 11, 15], target = 9</div><div class='trace-steps' style='display: flex; flex-direction: column; gap: 20px;'><div class='step' style='background: #1a1a1a; padding: 20px; border-radius: 8px; border-left: 4px solid #0088ff;'><div style='font-size: 18px; color: #0088ff; margin-bottom: 8px;'>Step 1: i = 0, nums[0] = 2</div><div style='font-size: 16px;'>complement = 9 - 2 = 7 | map = {} (empty) | Store: map[2] = 0</div></div><div class='step' style='background: #1a1a1a; padding: 20px; border-radius: 8px; border-left: 4px solid #00ff88;'><div style='font-size: 18px; color: #00ff88; margin-bottom: 8px;'>Step 2: i = 1, nums[1] = 7</div><div style='font-size: 16px;'>complement = 9 - 7 = 2 | map = {2: 0} | Found! Return [0, 1]</div></div></div><div class='final-result' style='text-align: center; font-size: 24px; color: #00ff88; font-weight: bold; margin-top: 20px;'>Result: [0, 1] ✓</div></div>"
    },
    {
      "scene_id": 7,
      "html": "<div class='title primary' style='font-size: 48px; margin-bottom: 40px; text-align: center;'>Edge Cases</div><div class='edge-cases-container' style='display: flex; flex-direction: column; gap: 30px; max-width: 1400px;'><div class='case' style='background: #1a1a1a; padding: 25px; border-radius: 10px;'><div class='case-title' style='font-size: 22px; color: #0088ff; margin-bottom: 15px;'>Case 1: Duplicate Values</div><div class='case-example' style='font-size: 18px; line-height: 1.6;'>Input: nums = [3, 3], target = 6<br>Output: [0, 1]<br><span style='color: #888;'>Algorithm handles duplicates correctly</span></div></div><div class='case' style='background: #1a1a1a; padding: 25px; border-radius: 10px;'><div class='case-title' style='font-size: 22px; color: #ff4444; margin-bottom: 15px;'>Case 2: Invalid Inputs</div><div class='case-example' style='font-size: 18px; line-height: 1.6;'>Empty array: Impossible by constraint<br>Single element: Impossible by constraint<br><span style='color: #888;'>Problem guarantees exactly one solution</span></div></div><div class='case' style='background: #1a1a1a; padding: 25px; border-radius: 10px;'><div class='case-title' style='font-size: 22px; color: #00ff88; margin-bottom: 15px;'>Case 3: Large Numbers</div><div class='case-example' style='font-size: 18px; line-height: 1.6;'>Works with negative numbers and large values<br>Hash map lookup remains O(1)<br><span style='color: #888;'>Algorithm scales efficiently</span></div></div></div>"
    },
    {
      "scene_id": 8,
      "html": "<div class='title secondary' style='font-size: 48px; margin-bottom: 40px; text-align: center;'>Complexity Summary</div><div class='summary-container' style='display: flex; flex-direction: column; align-items: center; gap: 40px;'><div class='complexity-table' style='background: #1a1a1a; border-radius: 10px; padding: 30px;'><div class='table-header' style='display: flex; font-size: 22px; font-weight: bold; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px;'><div style='width: 200px; text-align: center; color: #ffffff;'>Approach</div><div style='width: 150px; text-align: center; color: #ff4444;'>Time</div><div style='width: 150px; text-align: center; color: #0088ff;'>Space</div></div><div class='table-row' style='display: flex; font-size: 18px; margin: 10px 0; opacity: 0.7;'><div style='width: 200px; text-align: center;'>Brute Force</div><div style='width: 150px; text-align: center; color: #ff4444;'>O(n²)</div><div style='width: 150px; text-align: center; color: #0088ff;'>O(1)</div></div><div class='table-row' style='display: flex; font-size: 18px; margin: 10px 0; background: rgba(0, 255, 136, 0.1); padding: 8px; border-radius: 5px;'><div style='width: 200px; text-align: center; color: #00ff88; font-weight: bold;'>Hash Map</div><div style='width: 150px; text-align: center; color: #00ff88; font-weight: bold;'>O(n)</div><div style='width: 150px; text-align: center; color: #00ff88; font-weight: bold;'>O(n)</div></div></div><div class='key-insights' style='text-align: center; font-size: 20px; max-width: 1200px; line-height: 1.6;'><div style='color: #00ff88; font-weight: bold; margin-bottom: 15px;'>Key Insights</div><div>✓ Trade space for time: O(n) space for O(n) time<br>✓ Single pass through array<br>✓ Pattern applies to complement-finding problems</div></div></div>"
    }
  ]
}`;
    }
    createThumbnailHtmlPrompt(scriptJson) {
        return `You are a pixel-perfect thumbnail designer for technical YouTube videos. Generate HTML/CSS for a 1280x720 thumbnail.
    
    REQUIREMENTS:
    - Clean, eye-catching design
    - Problem title prominently displayed
    - Code snippet or algorithm visualization
    - LeetCode difficulty indicator
    - Dark background with bright accent colors
    - NO text overflow
    
    PROBLEM: ${scriptJson.metadata.title}
    DIFFICULTY: ${scriptJson.metadata.difficulty}
    TOPIC: ${scriptJson.metadata.topic}
    KEY CONCEPTS: ${JSON.stringify(scriptJson.scenes[0].key_concepts || [])}
    
    Return ONLY this complete HTML (no markdown, no explanations):
    
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="UTF-8">
    <title>${scriptJson.metadata.title} - YouTube Thumbnail</title>
    <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    .container {
      width: 1280px;
      height: 720px;
      position: relative;
      background-image: url('background.png');
      background-size: cover;
      background-position: center;
      font-family: 'Montserrat', sans-serif;
      overflow: hidden;
    }
    .main-title {
      position: absolute;
      top: 40px;
      left: 60px;
      font-size: 64px;
      font-weight: 900;
      line-height: 1.1;
      background: linear-gradient(135deg, #ffffff, ${scriptJson.metadata.primary_color || '#00ff88'});
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.5);
      letter-spacing: -1px;
    }
    .subtitle {
      position: absolute;
      top: 260px;
      left: 60px;
      font-size: 32px;
      font-weight: 700;
      color: #ffffff;
      text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.7);
      margin-top: 30px;
    }
    .difficulty {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      color: #000000;
      font-weight: bold;
      margin-left: 15px;
    }
    .easy {
      background-color: #00ff88;
    }
    .medium {
      background-color: #ffcc00;
    }
    .hard {
      background-color: #ff4444;
    }
    .code-block {
      position: absolute;
      top: 360px;
      left: 60px;
      font-family: 'Courier New', monospace;
      font-size: 24px;
      line-height: 1.6;
      background: rgba(0, 0, 0, 0.7);
      padding: 20px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.1);
        border-left: 5px solid ${scriptJson.metadata.primary_color || '#00ff88'};
    }
    .code-line {
      margin-bottom: 12px;
      color: #ffffff;
    }
    .key {
      color: ${scriptJson.metadata.secondary_color || '#0088ff'};
    }
    .value {
      color: ${scriptJson.metadata.accent_color || '#ff4444'};
    }
    </style>
    </head>
    <body>
    <div class="container">
      <div class="main-title">${scriptJson.metadata.title.toUpperCase()}<br><span style="color: ${scriptJson.metadata.primary_color || '#00ff88'};">SOLVED!</span></div>
      <div class="subtitle">
        LeetCode • ${scriptJson.metadata.difficulty} 
        <span class="difficulty ${scriptJson.metadata.difficulty.toLowerCase()}">${scriptJson.metadata.difficulty}</span>
      </div>
      <div class="code-block">
        <div class="code-line"><span class="key">Problem:</span> ${scriptJson.scenes[0].script.substring(0, 50)}...</div>
        <div class="code-line"><span class="value">Solution:</span> ${scriptJson.metadata.topic}</div>
        <div class="code-line"><span class="key">TC:</span> O(n) | <span class="key">SC:</span> O(n)</div>
      </div>
    </div>
    </body>
    </html>`;
    }

    async generateThumbnailHtml(scriptJson) {
        const prompt = this.createThumbnailHtmlPrompt(scriptJson);
        const response = await this.callGeminiAPI(prompt);

        try {
            const content = response.candidates[0].content.parts[0].text;
            // Extract complete HTML
            return content.trim();
        } catch (error) {
            console.error('❌ Error parsing thumbnail response:', error.message);
            throw new Error(`Failed to generate thumbnail HTML: ${error.message}`);
        }
    }
    async generateVideoPipeline(leetcodeQuestions) {
        console.log('🚀 Starting enhanced video generation pipeline...');
        console.log(`📅 ${new Date().toISOString()} - User: prafullKrRj`);

        if (!this.geminiApiKey) {
            throw new Error('Gemini API key could not be found.');
        }

        await fs.mkdir(this.outputDir, {recursive: true});
        const results = [];

        for (let i = 0; i < leetcodeQuestions.length; i++) {
            const question = leetcodeQuestions[i];
            const questionTitle = question.title || question.name || question || `Question_${i + 1}`;

            console.log(`\n📝 Processing ${i + 1}/${leetcodeQuestions.length}: ${questionTitle}`);

            try {
                console.log('  🔄 Generating comprehensive script...');
                const scriptJson = await this.generateScriptJson(question);

                console.log('  🔄 Generating visual code...');
                const videoCodeJson = await this.generateVideoCodeJson(scriptJson);

                const questionDir = path.join(this.outputDir, this.sanitizeFileName(questionTitle));
                await fs.mkdir(questionDir, {recursive: true});

                await fs.writeFile(
                    path.join(questionDir, 'script.json'),
                    JSON.stringify(scriptJson, null, 2)
                );

                await fs.writeFile(
                    path.join(questionDir, 'video_code.json'),
                    JSON.stringify(videoCodeJson, null, 2)
                );

                results.push({
                    question: questionTitle,
                    success: true,
                    outputPath: questionDir,
                    scenes: scriptJson.scenes?.length || 0,
                    estimatedDuration: scriptJson.metadata?.duration || '10-12 minutes'
                });

                console.log(`  ✅ Generated ${scriptJson.scenes?.length || 0} scenes for: ${questionTitle}`);

            } catch (error) {
                console.error(`  ❌ Error processing ${questionTitle}:`, error.message);
                results.push({
                    question: questionTitle,
                    success: false,
                    error: error.message
                });
            }

            // Rate limiting
            if (i < leetcodeQuestions.length - 1) {
                console.log('  ⏳ Rate limiting: waiting 3 seconds...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        return results;
    }

    async generateScriptJson(question) {
        const prompt = this.createScriptGenerationPrompt(question);
        const response = await this.callGeminiAPI(prompt);
        return this.parseGeminiResponse(response);
    }

    async generateVideoCodeJson(scriptJson) {
        const prompt = this.createVideoCodeGenerationPrompt(scriptJson);
        const response = await this.callGeminiAPI(prompt);
        return this.parseGeminiResponse(response);
    }

    async callGeminiAPI(prompt) {
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.8,
                topK: 40,
                topP: 0.9,
                maxOutputTokens: 8192,
            }
        };

        try {
            const response = await fetch(`${this.baseUrl}?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Gemini API call failed:', error.message);
            throw error;
        }
    }

    parseGeminiResponse(response) {
        try {
            const content = response.candidates[0].content.parts[0].text;
            let jsonString = content.trim();

            // Extract JSON from markdown if present
            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                jsonString = jsonMatch[1].trim();
            }

            const parsed = JSON.parse(jsonString);

            // Validate structure
            if (!parsed.metadata || !parsed.scenes || !Array.isArray(parsed.scenes)) {
                throw new Error('Invalid JSON structure: missing metadata or scenes');
            }

            if (parsed.scenes.length < 6) {
                throw new Error(`Insufficient scenes: got ${parsed.scenes.length}, expected at least 6`);
            }

            return parsed;
        } catch (error) {
            console.error('❌ Error parsing response:', error.message);
            throw new Error(`Failed to parse Gemini response: ${error.message}`);
        }
    }

    sanitizeFileName(name) {
        return String(name)
            .replace(/[^a-z0-9\s-]/gi, '')
            .replace(/\s+/g, '_')
            .toLowerCase()
            .substring(0, 50);
    }
}

module.exports = LeetCodeVideoGenerator;