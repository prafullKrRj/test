const LeetCodeVideoGenerator = require('./video-generator.js');
const VideoGenerator = require('./video.js');
const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');

class AutomatedVideoPipeline {
    constructor(options = {}) {
        this.contentGenerator = new LeetCodeVideoGenerator(options);
        this.videoRenderer = new VideoGenerator(options);
        this.baseOutputDir = options.outputDir || path.join(__dirname, 'problems');
    }

    async run(questions) {
        console.log('🚀 Starting video generation process');

        let generationResults = [];
        let renderingResults = [];

        try {
            // Step 1: Generate content (scripts and video code)
            generationResults = await this.contentGenerator.generateVideoPipeline(questions);

            // Step 2: Render videos for successful generations
            const successfulGenerations = generationResults.filter(result => result.success);

            if (successfulGenerations.length === 0) {
                console.log('❌ No successful script generations found');
                return { generation: generationResults, rendering: [] };
            }

            // Initialize renderer
            const rendererInitialized = await this.videoRenderer.init();
            if (!rendererInitialized) {
                throw new Error('Failed to initialize video renderer');
            }

            // Render each video and thumbnail
            for (const item of successfulGenerations) {
                try {
                    const result = await this.processQuestion(item);
                    renderingResults.push(result);
                } catch (error) {
                    console.error(`❌ Error processing ${item.question}:`, error.message);
                    renderingResults.push({
                        question: item.question,
                        success: false,
                        error: error.message
                    });
                }
            }

            return { generation: generationResults, rendering: renderingResults };

        } catch (error) {
            console.error('❌ Pipeline failed:', error.message);
            throw error;
        } finally {
            // Clean up
            await this.videoRenderer.cleanup();
        }
    }

    async processQuestion(item) {
        const questionName = item.question;
        const questionDir = item.outputPath;
        const contentDir = path.join(questionDir, 'content');

        // Create content directory
        await fs.mkdir(contentDir, { recursive: true });

        // Read script and video code JSON files
        const scriptJsonPath = path.join(questionDir, 'script.json');
        const videoCodeJsonPath = path.join(questionDir, 'video_code.json');

        const scriptJsonContent = await fs.readFile(scriptJsonPath, 'utf8');
        const videoCodeJsonContent = await fs.readFile(videoCodeJsonPath, 'utf8');

        const scriptJson = JSON.parse(scriptJsonContent);
        const videoCodeJson = JSON.parse(videoCodeJsonContent);

        // Step 1: Render video
        console.log(`🎬 Rendering video for: ${questionName}`);
        const videoPath = await this.renderVideo(scriptJson, videoCodeJson, contentDir);

        // Step 2: Generate and render thumbnail
        console.log(`🖼️ Generating thumbnail for: ${questionName}`);
        const thumbnailPath = await this.generateThumbnail(scriptJson, contentDir);

        return {
            question: questionName,
            success: true,
            videoPath,
            thumbnailPath
        };
    }

    async renderVideo(scriptJson, videoCodeJson, outputDir) {
        const videoFileName = 'final_video.mp4';
        const outputPath = path.join(outputDir, videoFileName);

        try {
            const result = await this.videoRenderer.generateVideo(scriptJson, videoCodeJson);

            // Move video to final destination
            await fs.rename(result, outputPath);
            return outputPath;
        } catch (error) {
            console.error('❌ Error generating video:', error);
            throw error;
        }
    }

    async generateThumbnail(scriptJson, outputDir) {
        try {
            // Generate thumbnail HTML
            const thumbnailHtml = await this.contentGenerator.generateThumbnailHtml(scriptJson);

            // Save HTML file
            const htmlPath = path.join(outputDir, 'thumbnail.html');
            await fs.writeFile(htmlPath, thumbnailHtml);

            // Render thumbnail using puppeteer
            const thumbnailPath = path.join(outputDir, 'thumbnail.png');
            await this.renderThumbnailImage(htmlPath, thumbnailPath);

            return thumbnailPath;
        } catch (error) {
            console.error('❌ Error generating thumbnail:', error);
            throw error;
        }
    }

    async renderThumbnailImage(htmlPath, outputPath) {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: "new",
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            await page.setViewport({
                width: 1280,
                height: 720,
                deviceScaleFactor: 1
            });

            // Load HTML file
            await page.goto(`file://${htmlPath}`, {
                waitUntil: ['networkidle0', 'domcontentloaded']
            });

            // Add background image (a placeholder that should be replaced)
            await page.evaluate(() => {
                const style = document.createElement('style');
                style.textContent = `
                .container {
                    background: linear-gradient(135deg, #000000 0%, #333333 100%);
                }`;
                document.head.appendChild(style);
            });

            // Take screenshot
            await page.screenshot({
                path: outputPath,
                type: 'png',
                fullPage: false
            });

            return outputPath;
        } catch (error) {
            console.error('❌ Error rendering thumbnail:', error);
            throw error;
        } finally {
            if (browser) await browser.close();
        }
    }
}

module.exports = AutomatedVideoPipeline;