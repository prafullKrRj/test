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

        return `Create a concise 8-scene LeetCode tutorial script focused on clear explanations and data structure visualization.

REQUIREMENTS:
- Each scene: 20-25 words (concise and clear)
- Focus on algorithm explanation, not storytelling
- Emphasize data structure operations
- Technical accuracy over engagement tricks
- Direct, educational tone

PROBLEM: ${title} (${difficulty})
CATEGORY: ${category}

Return ONLY this JSON:

{
  "metadata": {
    "title": "${title}",
    "duration": "6 minutes",
    "difficulty": "${difficulty}",
    "theme": "minimal_tech"
  },
  "scenes": [
    {
      "scene_id": 1,
      "timestamp": "00:00-00:45",
      "title": "Problem Overview",
      "script": "Problem: Find two array indices where numbers sum to target. Input: array and target integer. Output: two indices. Constraint: exactly one solution exists.",
      "focus": "problem_statement"
    },
    {
      "scene_id": 2,
      "timestamp": "00:45-01:30",
      "title": "Example Walkthrough",
      "script": "Example: nums=[2,7,11,15], target=9. Check: 2+7=9 at indices 0,1. Answer: [0,1]. Visual: highlight matching pair in array representation.",
      "focus": "example_demonstration"
    },
    {
      "scene_id": 3,
      "timestamp": "01:30-02:15",
      "title": "Brute Force Analysis",
      "script": "Brute force: nested loops check all pairs. Outer loop i=0 to n-2, inner j=i+1 to n-1. Time complexity O(n²), space O(1).",
      "focus": "complexity_analysis"
    },
    {
      "scene_id": 4,
      "timestamp": "02:15-03:00",
      "title": "Hash Map Approach",
      "script": "Optimal solution: use hash map for O(1) lookups. Store number→index pairs. For each element, check if complement exists in map.",
      "focus": "data_structure_introduction"
    },
    {
      "scene_id": 5,
      "timestamp": "03:00-03:45",
      "title": "Algorithm Implementation",
      "script": "Algorithm: iterate array, calculate complement=target-current. If complement in map, return indices. Else store current number and index in map.",
      "focus": "algorithm_steps"
    },
    {
      "scene_id": 6,
      "timestamp": "03:45-04:30",
      "title": "Step-by-Step Execution",
      "script": "Trace: i=0, nums[0]=2, complement=7, map empty, store map[2]=0. i=1, nums[1]=7, complement=2, found map[2]=0, return [0,1].",
      "focus": "execution_trace"
    },
    {
      "scene_id": 7,
      "timestamp": "04:30-05:15",
      "title": "Edge Cases",
      "script": "Edge cases: duplicate values [3,3] target=6 returns [0,1]. Negative numbers handled normally. Single element impossible by constraint.",
      "focus": "edge_case_handling"
    },
    {
      "scene_id": 8,
      "timestamp": "05:15-06:00",
      "title": "Complexity Summary",
      "script": "Final complexity: Time O(n) single pass, Space O(n) hash map storage. Pattern applies to complement-finding problems like 3Sum.",
      "focus": "complexity_and_patterns"
    }
  ]
}`;
    }

    createVideoCodeGenerationPrompt(scriptJson) {
        return `Generate minimal, clean HTML for technical LeetCode tutorial scenes. Focus on data structure visualization and code clarity.

DESIGN PRINCIPLES:
- Clean white/light backgrounds
- Simple sans-serif fonts
- Clear data structure diagrams
- Minimal colors: #2563eb (blue), #059669 (green), #dc2626 (red), #374151 (gray)
- No animations or fancy effects
- Channel logo: simple text top-right

CONTENT: ${JSON.stringify(scriptJson, null, 2)}

Return ONLY this JSON:

{
  "metadata": {
    "theme": "minimal_clean",
    "colors": {
      "primary": "#2563eb",
      "success": "#059669", 
      "warning": "#dc2626",
      "text": "#374151",
      "background": "#ffffff"
    }
  },
  "scenes": [
    {
      "scene_id": 1,
      "html": "<div style='background:#f9fafb;height:100vh;font-family:Inter,sans-serif;padding:40px'><div style='position:absolute;top:20px;right:30px;color:#6b7280;font-weight:600'>CodeMaster</div><div style='max-width:800px;margin:0 auto;padding-top:100px'><h1 style='font-size:36px;color:#374151;margin-bottom:20px'>${scriptJson.metadata?.title || 'Two Sum Problem'}</h1><div style='background:#fff;padding:30px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1)'><h2 style='color:#2563eb;margin-bottom:15px'>Problem Statement</h2><p style='font-size:18px;line-height:1.6;color:#374151'>Given an array of integers and target value, return indices of two numbers that sum to target.</p><div style='background:#f3f4f6;padding:15px;border-radius:6px;margin-top:15px;font-family:monospace'><strong>Input:</strong> nums = [2,7,11,15], target = 9<br><strong>Output:</strong> [0,1]<br><strong>Explanation:</strong> nums[0] + nums[1] = 2 + 7 = 9</div></div></div></div>"
    },
    {
      "scene_id": 2,
      "html": "<div style='background:#f9fafb;height:100vh;font-family:Inter,sans-serif;padding:40px'><div style='position:absolute;top:20px;right:30px;color:#6b7280;font-weight:600'>CodeMaster</div><div style='max-width:900px;margin:0 auto;padding-top:80px'><h2 style='font-size:28px;color:#374151;margin-bottom:30px;text-align:center'>Example Visualization</h2><div style='background:#fff;padding:40px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1)'><div style='text-align:center;margin-bottom:30px'><div style='font-size:16px;color:#6b7280;margin-bottom:15px'>nums = [2, 7, 11, 15], target = 9</div><div style='display:flex;justify-content:center;gap:10px;margin:20px 0'><div style='border:2px solid #2563eb;background:#dbeafe;padding:15px 20px;border-radius:6px;font-weight:600'>2<div style='font-size:12px;color:#6b7280;margin-top:5px'>index 0</div></div><div style='border:2px solid #059669;background:#d1fae5;padding:15px 20px;border-radius:6px;font-weight:600'>7<div style='font-size:12px;color:#6b7280;margin-top:5px'>index 1</div></div><div style='border:1px solid #d1d5db;padding:15px 20px;border-radius:6px;color:#6b7280'>11<div style='font-size:12px;margin-top:5px'>index 2</div></div><div style='border:1px solid #d1d5db;padding:15px 20px;border-radius:6px;color:#6b7280'>15<div style='font-size:12px;margin-top:5px'>index 3</div></div></div><div style='font-size:18px;color:#374151;margin-top:20px'>2 + 7 = 9 ✓</div><div style='background:#059669;color:white;padding:10px 20px;border-radius:6px;display:inline-block;margin-top:15px'>Answer: [0, 1]</div></div></div></div></div>"
    },
    {
      "scene_id": 3,
      "html": "<div style='background:#f9fafb;height:100vh;font-family:Inter,sans-serif;padding:40px'><div style='position:absolute;top:20px;right:30px;color:#6b7280;font-weight:600'>CodeMaster</div><div style='max-width:800px;margin:0 auto;padding-top:80px'><h2 style='font-size:28px;color:#374151;margin-bottom:30px'>Brute Force Approach</h2><div style='background:#fff;padding:30px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1)'><div style='background:#1f2937;color:#f9fafb;padding:20px;border-radius:6px;font-family:monospace;font-size:14px;line-height:1.6'><div style='color:#6b7280'>// Brute Force Solution</div><div><span style='color:#3b82f6'>for</span> (let i = 0; i < nums.length - 1; i++) {</div><div>  <span style='color:#3b82f6'>for</span> (let j = i + 1; j < nums.length; j++) {</div><div>    <span style='color:#3b82f6'>if</span> (nums[i] + nums[j] === target) {</div><div>      <span style='color:#3b82f6'>return</span> [i, j];</div><div>    }</div><div>  }</div><div>}</div></div><div style='margin-top:20px;display:flex;gap:30px;justify-content:center'><div style='text-align:center'><div style='color:#dc2626;font-weight:600'>Time Complexity</div><div style='font-size:20px;color:#374151'>O(n²)</div></div><div style='text-align:center'><div style='color:#059669;font-weight:600'>Space Complexity</div><div style='font-size:20px;color:#374151'>O(1)</div></div></div></div></div></div>"
    },
    {
      "scene_id": 4,
      "html": "<div style='background:#f9fafb;height:100vh;font-family:Inter,sans-serif;padding:40px'><div style='position:absolute;top:20px;right:30px;color:#6b7280;font-weight:600'>CodeMaster</div><div style='max-width:900px;margin:0 auto;padding-top:80px'><h2 style='font-size:28px;color:#374151;margin-bottom:30px'>Hash Map Solution</h2><div style='background:#fff;padding:30px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1)'><div style='margin-bottom:25px'><h3 style='color:#2563eb;margin-bottom:10px'>Key Insight</h3><p style='color:#374151;font-size:16px'>Use hash map to store seen numbers and their indices for O(1) lookup time.</p></div><div style='background:#f3f4f6;padding:20px;border-radius:6px;margin-bottom:20px'><h4 style='color:#374151;margin-bottom:15px'>Hash Map Structure</h4><div style='display:flex;justify-content:center;gap:40px'><div style='text-align:center'><div style='font-weight:600;color:#2563eb;margin-bottom:10px'>Value → Index</div><div style='font-family:monospace;font-size:14px'><div>2 → 0</div><div>7 → 1</div><div>11 → 2</div><div>15 → 3</div></div></div></div></div><div style='display:flex;gap:30px;justify-content:center'><div style='text-align:center'><div style='color:#059669;font-weight:600'>Time Complexity</div><div style='font-size:20px;color:#374151'>O(n)</div></div><div style='text-align:center'><div style='color:#dc2626;font-weight:600'>Space Complexity</div><div style='font-size:20px;color:#374151'>O(n)</div></div></div></div></div></div>"
    },
    {
      "scene_id": 5,
      "html": "<div style='background:#f9fafb;height:100vh;font-family:Inter,sans-serif;padding:40px'><div style='position:absolute;top:20px;right:30px;color:#6b7280;font-weight:600'>CodeMaster</div><div style='max-width:800px;margin:0 auto;padding-top:60px'><h2 style='font-size:28px;color:#374151;margin-bottom:30px'>Optimized Implementation</h2><div style='background:#fff;padding:30px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1)'><div style='background:#1f2937;color:#f9fafb;padding:20px;border-radius:6px;font-family:monospace;font-size:13px;line-height:1.8'><div style='color:#6b7280'>// Hash Map Solution</div><div><span style='color:#3b82f6'>function</span> <span style='color:#f9fafb'>twoSum</span>(nums, target) {</div><div>  <span style='color:#3b82f6'>const</span> map = <span style='color:#3b82f6'>new</span> Map();</div><div></div><div>  <span style='color:#3b82f6'>for</span> (let i = 0; i < nums.length; i++) {</div><div>    <span style='color:#3b82f6'>const</span> complement = target - nums[i];</div><div>    </div><div>    <span style='color:#3b82f6'>if</span> (map.has(complement)) {</div><div>      <span style='color:#3b82f6'>return</span> [map.get(complement), i];</div><div>    }</div><div>    </div><div>    map.set(nums[i], i);</div><div>  }</div><div>}</div></div><div style='margin-top:20px'><h4 style='color:#2563eb;margin-bottom:10px'>Algorithm Steps</h4><ol style='color:#374151;line-height:1.8'><li>Calculate complement = target - current number</li><li>Check if complement exists in hash map</li><li>If found, return stored index and current index</li><li>If not found, store current number and index</li></ol></div></div></div></div>"
    },
    {
      "scene_id": 6,
      "html": "<div style='background:#f9fafb;height:100vh;font-family:Inter,sans-serif;padding:40px'><div style='position:absolute;top:20px;right:30px;color:#6b7280;font-weight:600'>CodeMaster</div><div style='max-width:1000px;margin:0 auto;padding-top:60px'><h2 style='font-size:28px;color:#374151;margin-bottom:30px;text-align:center'>Step-by-Step Execution</h2><div style='background:#fff;padding:30px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1)'><div style='text-align:center;margin-bottom:25px;font-family:monospace'>nums = [2, 7, 11, 15], target = 9</div><div style='display:flex;flex-direction:column;gap:20px'><div style='border:1px solid #2563eb;background:#eff6ff;padding:20px;border-radius:6px'><div style='font-weight:600;color:#2563eb;margin-bottom:10px'>Step 1: i = 0, nums[0] = 2</div><div style='color:#374151;font-size:14px'>complement = 9 - 2 = 7</div><div style='color:#374151;font-size:14px'>map.has(7) = false</div><div style='color:#374151;font-size:14px'>map.set(2, 0) → map = {2: 0}</div></div><div style='border:2px solid #059669;background:#f0fdf4;padding:20px;border-radius:6px'><div style='font-weight:600;color:#059669;margin-bottom:10px'>Step 2: i = 1, nums[1] = 7</div><div style='color:#374151;font-size:14px'>complement = 9 - 7 = 2</div><div style='color:#374151;font-size:14px'>map.has(2) = true ✓</div><div style='color:#374151;font-size:14px'>return [map.get(2), 1] = [0, 1]</div></div></div><div style='text-align:center;margin-top:25px'><div style='background:#059669;color:white;padding:15px 30px;border-radius:6px;display:inline-block;font-weight:600'>Solution found: [0, 1]</div></div></div></div></div>"
    },
    {
      "scene_id": 7,
      "html": "<div style='background:#f9fafb;height:100vh;font-family:Inter,sans-serif;padding:40px'><div style='position:absolute;top:20px;right:30px;color:#6b7280;font-weight:600'>CodeMaster</div><div style='max-width:900px;margin:0 auto;padding-top:80px'><h2 style='font-size:28px;color:#374151;margin-bottom:30px'>Edge Cases</h2><div style='background:#fff;padding:30px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1)'><div style='display:grid;grid-template-columns:1fr 1fr;gap:25px'><div style='border:1px solid #d1d5db;padding:20px;border-radius:6px'><h4 style='color:#2563eb;margin-bottom:15px'>Duplicate Values</h4><div style='background:#f8fafc;padding:15px;border-radius:4px;font-family:monospace;font-size:14px;margin-bottom:10px'>nums = [3, 3]<br>target = 6<br>output = [0, 1]</div><p style='color:#374151;font-size:14px'>Algorithm checks complement before storing, handling duplicates correctly.</p></div><div style='border:1px solid #d1d5db;padding:20px;border-radius:6px'><h4 style='color:#2563eb;margin-bottom:15px'>Negative Numbers</h4><div style='background:#f8fafc;padding:15px;border-radius:4px;font-family:monospace;font-size:14px;margin-bottom:10px'>nums = [-1, -2, -3, -4]<br>target = -6<br>output = [1, 2]</div><p style='color:#374151;font-size:14px'>Hash map works with negative numbers without modification.</p></div></div><div style='margin-top:25px;padding:20px;background:#f0f9ff;border-radius:6px;border-left:4px solid #2563eb'><h4 style='color:#374151;margin-bottom:10px'>Problem Constraints</h4><ul style='color:#374151;font-size:14px;line-height:1.6'><li>Exactly one valid solution exists (guaranteed)</li><li>Cannot use same element twice</li><li>Array length ≥ 2</li></ul></div></div></div></div>"
    },
    {
      "scene_id": 8,
      "html": "<div style='background:#f9fafb;height:100vh;font-family:Inter,sans-serif;padding:40px'><div style='position:absolute;top:20px;right:30px;color:#6b7280;font-weight:600'>CodeMaster</div><div style='max-width:800px;margin:0 auto;padding-top:80px'><h2 style='font-size:28px;color:#374151;margin-bottom:30px'>Complexity Analysis</h2><div style='background:#fff;padding:30px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1)'><div style='display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-bottom:30px'><div style='text-align:center;padding:20px;border:1px solid #fca5a5;background:#fef2f2;border-radius:6px'><h3 style='color:#dc2626;margin-bottom:10px'>Brute Force</h3><div style='color:#374151;font-size:14px;margin-bottom:15px'>Time: O(n²)<br>Space: O(1)</div><div style='color:#6b7280;font-size:12px'>Nested loops check all pairs</div></div><div style='text-align:center;padding:20px;border:1px solid #86efac;background:#f0fdf4;border-radius:6px'><h3 style='color:#059669;margin-bottom:10px'>Hash Map</h3><div style='color:#374151;font-size:14px;margin-bottom:15px'>Time: O(n)<br>Space: O(n)</div><div style='color:#6b7280;font-size:12px'>Single pass with O(1) lookups</div></div></div><div style='border-top:1px solid #e5e7eb;padding-top:20px'><h4 style='color:#2563eb;margin-bottom:15px'>Pattern Applications</h4><div style='color:#374151;font-size:14px;line-height:1.6'><p>This complement pattern applies to:</p><ul style='margin:10px 0;padding-left:20px'><li>Three Sum (3Sum)</li><li>Four Sum (4Sum)</li><li>Two Sum variations (sorted array, BST)</li><li>Subarray sum problems</li></ul></div></div></div></div></div>"
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
    estimateTextDuration(text) {
        // Type checking to handle non-string inputs
        if (typeof text !== 'string') {
            console.warn(`Warning: Expected string but got ${typeof text}`);
            // Handle non-string input gracefully
            if (text === null || text === undefined) {
                return this.defaultSceneDuration;
            }
            // Convert to string if possible
            text = String(text);
        }

        // Now we can safely use string methods
        const words = text.split(/\s+/).filter(word => word.length > 0);

        // Calculate duration based on word count (approx 2-3 words per second for natural speech)
        const wordDuration = 0.4; // seconds per word
        return Math.max(this.defaultSceneDuration, Math.ceil(words.length * wordDuration));
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