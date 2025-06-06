const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');
const {exec} = require('child_process');
const {promisify} = require('util');

const execAsync = promisify(exec);

class VideoGenerator {
    constructor(options = {}) {
        this.outputDir = options.outputDir || path.join(__dirname, 'output');
        this.tempDir = path.join(this.outputDir, 'temp');
        this.browser = null;
        this.ffmpegAvailable = false;
        this.apiKey = options.apiKey || 'AIzaSyB8aViqFr12veLR77wQAOVBZlbCb2KOQsU';
        this.defaultSceneDuration = 15; // seconds per scene
    }

    async init() {
        try {
            console.log('🔧 Initializing VideoGenerator...');

            this.ffmpegAvailable = await this.checkFfmpeg();
            if (!this.ffmpegAvailable) {
                console.error('❌ FFmpeg is required but not available');
                return false;
            }

            await fs.mkdir(this.outputDir, {recursive: true});
            await fs.mkdir(this.tempDir, {recursive: true});
            console.log(`📁 Directories created: ${this.outputDir}, ${this.tempDir}`);

            this.browser = await puppeteer.launch({
                headless: "new",
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--allow-running-insecure-content',
                    '--disable-features=VizDisplayCompositor'
                ],
                timeout: 60000
            });

            console.log('✅ VideoGenerator initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Initialization error:', error.message);
            return false;
        }
    }

    async checkFfmpeg() {
        try {
            await execAsync('ffmpeg -version');
            console.log('✅ FFmpeg is available');
            return true;
        } catch (error) {
            console.error('❌ FFmpeg not found. Please install: https://ffmpeg.org/download.html');
            return false;
        }
    }

    async renderSceneToImage(html, outputFile, sceneId) {
        let page;
        try {
            console.log(`🖼️ Rendering scene ${sceneId} with precision layout...`);

            // Enhanced HTML wrapper with exact measurements
            const preciseHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        html, body { 
            width: 1920px; 
            height: 1080px; 
            background: #000000;
            color: #ffffff;
            font-family: 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
            overflow: hidden;
            position: relative;
        }
        .scene-wrapper {
            width: 1920px;
            height: 1080px;
            padding: 50px 60px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            position: absolute;
            top: 0;
            left: 0;
        }
        .content-container {
            width: 100%;
            max-width: 1800px;
            max-height: 980px;
            overflow: hidden;
            text-align: center;
        }
        /* Precise typography */
        .title { font-size: 72px; line-height: 1.1; }
        .subtitle { font-size: 36px; line-height: 1.2; }
        .content { font-size: 28px; line-height: 1.4; }
        .small-text { font-size: 20px; line-height: 1.3; }
        
        /* Color system */
        .primary { color: #00ff88; }
        .secondary { color: #0088ff; }
        .accent { color: #ff4444; }
        .muted { color: #888888; }
        
        /* Text truncation safety */
        .truncate {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .wrap {
            word-wrap: break-word;
            hyphens: auto;
        }
    </style>
</head>
<body>
    <div class="scene-wrapper">
        <div class="content-container">
            ${html}
        </div>
    </div>
</body>
</html>`;

            const timestamp = Date.now();
            const htmlFile = path.join(this.tempDir, `scene_${sceneId}_${timestamp}.html`);

            await fs.writeFile(htmlFile, preciseHtml);

            page = await this.browser.newPage();

            // Set exact viewport
            await page.setViewport({
                width: 1920,
                height: 1080,
                deviceScaleFactor: 1
            });

            // Load and wait for fonts
            await page.goto(`file://${htmlFile}`, {
                waitUntil: ['networkidle0', 'domcontentloaded'],
                timeout: 45000
            });

            // Wait for font loading and layout stabilization
            await page.waitForTimeout(3000);

            // Take precise screenshot
            await page.screenshot({
                path: outputFile,
                type: 'png',
                clip: {
                    x: 0,
                    y: 0,
                    width: 1920,
                    height: 1080
                },
                omitBackground: false
            });

            console.log(`✅ Scene ${sceneId} rendered with precision`);

            await fs.unlink(htmlFile).catch(() => {});
            return true;

        } catch (error) {
            console.error(`❌ Error rendering scene ${sceneId}:`, error.message);
            return false;
        } finally {
            if (page) await page.close().catch(() => {});
        }
    }

    parseDuration(timestamp) {
        // Parse "00:00-01:30" format to get duration in seconds
        const parts = timestamp.split('-');
        if (parts.length !== 2) return this.defaultSceneDuration;

        const endTime = parts[1];
        const [minutes, seconds] = endTime.split(':').map(Number);
        const startTime = parts[0];
        const [startMin, startSec] = startTime.split(':').map(Number);

        const endTotalSeconds = (minutes * 60) + seconds;
        const startTotalSeconds = (startMin * 60) + startSec;

        return Math.max(5, endTotalSeconds - startTotalSeconds); // Minimum 5 seconds
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

    async createSceneAudio(script, duration, outputFile) {
        try {
            console.log(`🔊 Creating audio (${duration}s) for script: "${script.substring(0, 50)}..."`);

            // Calculate words per minute for more natural pacing
            const words = script.split(/\s+/).filter(w => w.length > 0);
            const wordsPerMinute = 150; // Natural speaking pace
            const naturalDuration = Math.max(duration, (words.length / wordsPerMinute) * 60);

            // Create a pleasant background tone with varying frequency
            const frequency = 440 + (Math.random() * 200); // Vary between 440-640 Hz
            const command = `ffmpeg -y -f lavfi -i "sine=frequency=${frequency}:duration=${naturalDuration}" -ar 44100 -ac 2 -filter:a "volume=0.1" "${outputFile}"`;

            await execAsync(command);
            console.log(`✅ Audio created (${naturalDuration}s)`);
            return naturalDuration;
        } catch (error) {
            console.error('❌ Error creating audio:', error.message);
            return await this.createSilentAudio(duration, outputFile);
        }
    }

    async createSilentAudio(duration, outputFile) {
        try {
            const command = `ffmpeg -y -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=44100" -t ${duration} "${outputFile}"`;
            await execAsync(command);
            return duration;
        } catch (error) {
            console.error('❌ Error creating silent audio:', error.message);
            return false;
        }
    }

    async createSceneVideo(imageFile, duration, outputFile) {
        try {
            console.log(`🎥 Creating scene video (${duration}s)`);

            await fs.access(imageFile);

            // Add subtle zoom effect to make static images more dynamic
            const command = `ffmpeg -y -loop 1 -i "${imageFile}" -c:v libx264 -t ${duration} -pix_fmt yuv420p -r 30 -vf "scale=1920:1080,zoompan=z='min(zoom+0.001,1.2)':d=${duration * 30}:x=iw/2-(iw/zoom/2):y=ih/2-(ih/zoom/2)" "${outputFile}"`;

            await execAsync(command);

            const stats = await fs.stat(outputFile);
            console.log(`✅ Scene video created (${Math.round(stats.size / 1024)}KB)`);
            return true;
        } catch (error) {
            console.error('❌ Error creating scene video:', error.message);
            return false;
        }
    }

    async combineSceneAudioVideo(videoFile, audioFile, outputFile) {
        try {
            await fs.access(videoFile);
            await fs.access(audioFile);

            const command = `ffmpeg -y -i "${videoFile}" -i "${audioFile}" -c:v copy -c:a aac -shortest -strict experimental "${outputFile}"`;
            await execAsync(command);

            return true;
        } catch (error) {
            console.error('❌ Error combining scene audio/video:', error.message);
            return false;
        }
    }

    async concatenateScenes(sceneFiles, outputFile) {
        try {
            console.log(`🔗 Concatenating ${sceneFiles.length} scenes...`);

            // Create concat file list
            const concatFile = path.join(this.tempDir, `concat_${Date.now()}.txt`);
            const concatContent = sceneFiles.map(file => `file '${file}'`).join('\n');
            await fs.writeFile(concatFile, concatContent);

            const command = `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c copy "${outputFile}"`;
            await execAsync(command);

            await fs.unlink(concatFile).catch(() => {});

            const stats = await fs.stat(outputFile);
            console.log(`✅ Final video created (${Math.round(stats.size / 1024)}KB)`);
            return true;
        } catch (error) {
            console.error('❌ Error concatenating scenes:', error.message);
            return false;
        }
    }

    async generateVideo(scriptData, videoCodeData) {
        console.log('🚀 Starting multi-scene video generation...');

        const timestamp = Date.now();
        let sceneFiles = [];

        try {
            if (!this.browser) {
                const initialized = await this.init();
                if (!initialized) throw new Error('Failed to initialize VideoGenerator');
            }

            const scenes = videoCodeData?.scenes || [];
            if (scenes.length === 0) {
                throw new Error('No scenes found in video code data');
            }

            console.log(`🎬 Processing ${scenes.length} scenes...`);

            // Process each scene
            for (let i = 0; i < scenes.length; i++) {
                const scene = scenes[i];
                const scriptScene = scriptData?.scenes?.[i];
                const sceneId = scene.scene_id || (i + 1);

                console.log(`\n📺 Processing Scene ${sceneId}...`);

                if (!scene.html) {
                    console.warn(`⚠️ Scene ${sceneId} has no HTML content, skipping...`);
                    continue;
                }

                // File paths for this scene
                const imageFile = path.join(this.tempDir, `scene_${sceneId}_${timestamp}.png`);
                const audioFile = path.join(this.tempDir, `scene_${sceneId}_${timestamp}.wav`);
                const videoFile = path.join(this.tempDir, `scene_${sceneId}_${timestamp}.mp4`);
                const sceneOutputFile = path.join(this.tempDir, `scene_${sceneId}_final_${timestamp}.mp4`);

                try {
                    // 1. Render scene to image
                    const renderSuccess = await this.renderSceneToImage(scene.html, imageFile, sceneId);
                    if (!renderSuccess) {
                        console.error(`❌ Failed to render scene ${sceneId}, skipping...`);
                        continue;
                    }

                    // 2. Get duration and script
                    const duration = scriptScene?.timestamp ?
                        this.parseDuration(scriptScene.timestamp) : this.defaultSceneDuration;
                    const script = scriptScene?.script || `Scene ${sceneId} content`;

                    // 3. Create audio
                    const actualDuration = await this.createSceneAudio(script, duration, audioFile);
                    if (!actualDuration) {
                        console.error(`❌ Failed to create audio for scene ${sceneId}, skipping...`);
                        continue;
                    }

                    // 4. Create video from image
                    const videoSuccess = await this.createSceneVideo(imageFile, actualDuration, videoFile);
                    if (!videoSuccess) {
                        console.error(`❌ Failed to create video for scene ${sceneId}, skipping...`);
                        continue;
                    }

                    // 5. Combine audio and video
                    const combineSuccess = await this.combineSceneAudioVideo(videoFile, audioFile, sceneOutputFile);
                    if (!combineSuccess) {
                        console.error(`❌ Failed to combine audio/video for scene ${sceneId}, skipping...`);
                        continue;
                    }

                    sceneFiles.push(sceneOutputFile);
                    console.log(`✅ Scene ${sceneId} completed (${actualDuration}s)`);

                    // Cleanup intermediate files
                    await Promise.all([
                        fs.unlink(imageFile).catch(() => {}),
                        fs.unlink(audioFile).catch(() => {}),
                        fs.unlink(videoFile).catch(() => {})
                    ]);

                } catch (sceneError) {
                    console.error(`❌ Error processing scene ${sceneId}:`, sceneError.message);
                    continue;
                }
            }

            if (sceneFiles.length === 0) {
                throw new Error('No scenes were successfully processed');
            }

            // Concatenate all scenes
            const finalOutputFile = path.join(this.outputDir, `video_${timestamp}.mp4`);
            const concatSuccess = await this.concatenateScenes(sceneFiles, finalOutputFile);

            if (!concatSuccess) {
                throw new Error('Failed to concatenate scenes');
            }

            // Cleanup scene files
            await Promise.all(sceneFiles.map(file =>
                fs.unlink(file).catch(() => {})
            ));

            const stats = await fs.stat(finalOutputFile);
            const totalDuration = sceneFiles.length * this.defaultSceneDuration;

            console.log(`\n🎉 Video generation completed!`);
            console.log(`📁 Output: ${finalOutputFile}`);
            console.log(`⏱️ Duration: ~${totalDuration}s`);
            console.log(`📊 Size: ${Math.round(stats.size / 1024 / 1024)}MB`);
            console.log(`🎬 Scenes: ${sceneFiles.length}/${scenes.length} successful`);

            return finalOutputFile;

        } catch (error) {
            console.error('❌ Video generation failed:', error.message);

            // Cleanup on error
            await Promise.all(sceneFiles.map(file =>
                fs.unlink(file).catch(() => {})
            ));

            throw error;
        }
    }

    async cleanup() {
        try {
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
                console.log('🧹 Browser closed');
            }
        } catch (error) {
            console.error('⚠️ Error during cleanup:', error.message);
        }
    }

}

module.exports = VideoGenerator;