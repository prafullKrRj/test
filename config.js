require('dotenv').config();

module.exports = {
    // Gemini API Configuration
    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-1.5-flash-latest',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.8,
            maxOutputTokens: 8192,
        }
    },

    // Video Generation Settings
    video: {
        resolution: {
            width: 1920,
            height: 1080
        },
        fps: 30,
        defaultDuration: 600, // 10 minutes in seconds
        outputFormat: 'mp4',
        quality: 'high'
    },

    // Theme Configuration
    themes: {
        dark: {
            primary_color: "#1e88e5",
            secondary_color: "#43a047",
            background_color: "#121212",
            text_color: "#ffffff",
            accent_color: "#ff7043",
            code_background: "#1e1e1e",
            code_text: "#d4d4d4"
        },
        light: {
            primary_color: "#1976d2",
            secondary_color: "#388e3c",
            background_color: "#ffffff",
            text_color: "#212121",
            accent_color: "#f57c00",
            code_background: "#f5f5f5",
            code_text: "#333333"
        }
    },

    // LeetCode Categories
    categories: {
        "Array": ["sorting", "two-pointers", "sliding-window"],
        "String": ["pattern-matching", "palindrome", "substring"],
        "Dynamic Programming": ["memoization", "tabulation", "optimization"],
        "Tree": ["traversal", "binary-tree", "bst"],
        "Graph": ["dfs", "bfs", "shortest-path"],
        "Linked List": ["manipulation", "reversal", "cycle-detection"],
        "Hash Table": ["mapping", "counting", "lookup"],
        "Stack": ["monotonic", "expression-evaluation", "backtracking"],
        "Queue": ["bfs", "sliding-window", "scheduling"],
        "Heap": ["priority-queue", "top-k", "merge"]
    },

    // Directory Structure
    directories: {
        output: './generated_content',
        videos: './rendered_videos',
        temp: './temp',
        reports: './reports'
    }
};