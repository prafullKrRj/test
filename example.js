const AutomatedVideoPipeline = require('./pipeline.js');
const path = require("node:path");

const testQuestions = [
    {
        title: "Two Sum",
        difficulty: "Easy",
        category: "Array, Hash Table",
        link: "https://leetcode.com/problems/two-sum/",
        description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order."
    },
    {
        title: "Valid Parentheses",
        difficulty: "Easy",
        category: "String, Stack",
        link: "https://leetcode.com/problems/valid-parentheses/",
        description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if: Open brackets must be closed by the same type of brackets, and open brackets must be closed in the correct order."
    }
];

async function runExample() {
    console.log('🚀 Starting video generation process');

    const pipeline = new AutomatedVideoPipeline({
        outputDir: path.join(__dirname, 'generated_problems')
    });

    try {
        const results = await pipeline.run(testQuestions);

        console.log('\n✅ Pipeline completed successfully');

        // Display successful videos
        const successfulVideos = results.rendering.filter(r => r.success);
        if (successfulVideos.length > 0) {
            console.log('\n📺 Generated Videos:');
            successfulVideos.forEach((video, i) => {
                console.log(`  ${i+1}. ${video.question}`);
                console.log(`     📁 Video: ${video.videoPath}`);
                console.log(`     🖼️ Thumbnail: ${video.thumbnailPath}`);
            });
        }

        return results;
    } catch (error) {
        console.error('❌ Error running example:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    runExample();
}

module.exports = { testQuestions, runExample };