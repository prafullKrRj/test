const fs = require('fs').promises;
const path = require('path');
const VideoGenerator = require('./video'); // Assuming VideoGenerator is in a separate file
const {exec} = require('child_process');
const {promisify} = require('util');
const os = require('os');

const execAsync = promisify(exec);

class SimpleVideoGenerator {
    constructor(scriptFile = 'script.json', videoCodeFile = 'video_code.json') {
        this.scriptFile = scriptFile;
        this.videoCodeFile = videoCodeFile;
        this.outputDir = path.join(__dirname, 'output');
        this.outputDir = path.join(__dirname, 'output');
        this.tempDir = path.join(this.outputDir, 'temp');
        this.scenesDir = path.join(this.outputDir, 'scenes');
        this.maxConcurrency = Math.max(1, Math.min(2, os.cpus().length - 1)); // Reduced concurrency
    }

    async init() {
        try {
            // Create output directories
            await fs.mkdir(this.outputDir, {recursive: true});
            await fs.mkdir(this.tempDir, {recursive: true});
            await fs.mkdir(this.scenesDir, {recursive: true});

            console.log('📁 Created output directories');

            // Load script and video data
            this.scriptData = await this.loadJson(this.scriptFile);
            this.videoData = await this.loadJson(this.videoCodeFile);

            if (!this.scriptData?.scenes || !this.videoData?.scenes) {
                throw new Error('Invalid script or video data structure');
            }

            console.log(`📝 Loaded ${this.scriptData.scenes.length} scenes from script`);
            console.log(`🎬 Loaded ${this.videoData.scenes.length} scenes from video code`);

            return true;
        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            return false;
        }
    }

    async loadJson(filename) {
        try {
            const data = await fs.readFile(filename, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`❌ Failed to load ${filename}:`, error.message);
            return null;
        }
    }

    async checkFfmpeg() {
        try {
            const {stdout} = await execAsync('ffmpeg -version');
            if (stdout) {
                console.log('✅ FFmpeg is installed');
                return true;
            }
        } catch (error) {
            console.error('❌ FFmpeg is not installed or not in PATH');
            console.error('Please install FFmpeg: https://ffmpeg.org/download.html');
            return false;
        }
        return false;
    }

    async processSceneWithVideoGenerator(scene, videoCode, sceneIndex) {
        const sceneId = scene.scene_id;
        console.log(`\n🎬 Processing scene ${sceneIndex + 1}/${this.totalScenes}: ${scene.title} (ID: ${sceneId})`);

        try {
            // Create a VideoGenerator instance for this scene
            const sceneOutputDir = path.join(this.scenesDir, `scene_${sceneId}`);
            const videoGenerator = new VideoGenerator({
                outputDir: sceneOutputDir
            });

            // Generate video for this scene using VideoGenerator
            console.log(`🎥 Generating video for scene ${sceneId}...`);
            const sceneVideoPath = await videoGenerator.generateVideo(videoCode.html, scene.script);

            if (!sceneVideoPath) {
                throw new Error(`Failed to generate video for scene ${sceneId}`);
            }

            // Move the generated video to a standardized location
            const standardizedPath = path.join(this.scenesDir, `scene_${sceneId}_final.mp4`);

            // Copy the file to standardized location
            await fs.copyFile(sceneVideoPath, standardizedPath);

            console.log(`✅ Successfully processed scene ${sceneId}`);
            console.log(`📁 Scene video saved to: ${standardizedPath}`);

            return standardizedPath;
        } catch (error) {
            console.error(`❌ Error processing scene ${sceneId}:`, error.message);
            return null;
        }
    }

    async processScenesConcurrently(scenePairs) {
        const results = [];
        console.log(`🚀 Processing scenes in batches with max concurrency: ${this.maxConcurrency}`);

        // Process in smaller batches to manage memory usage
        for (let i = 0; i < scenePairs.length; i += this.maxConcurrency) {
            const batch = scenePairs.slice(i, i + this.maxConcurrency);
            console.log(`\n📦 Processing batch ${Math.floor(i/this.maxConcurrency) + 1}: scenes ${i+1} to ${Math.min(i+this.maxConcurrency, scenePairs.length)}`);

            const batchPromises = batch.map(async ({scene, videoCode}, batchIndex) => {
                const index = i + batchIndex;
                const result = await this.processSceneWithVideoGenerator(scene, videoCode, index);

                // Force garbage collection if available
                if (global.gc) {
                    global.gc();
                }

                return result;
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults.filter(Boolean));

            // Small delay between batches to allow memory cleanup
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return results;
    }

    async concatenateVideos(videoFiles, outputFile) {
        if (videoFiles.length === 0) {
            console.error('❌ No videos to concatenate');
            return false;
        }

        try {
            console.log(`🔄 Concatenating ${videoFiles.length} scene videos...`);

            // Create a temporary concat file
            const concatFile = path.join(this.tempDir, 'concat_list.txt');
            const fileContent = videoFiles.map(file => `file '${file.replace(/'/g, "'\\''")}'`).join('\n');
            await fs.writeFile(concatFile, fileContent);

            console.log(`📝 Concat file created with ${videoFiles.length} entries`);

            // Run FFmpeg to concatenate videos
            const ffmpegCommand = `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c copy "${outputFile}"`;
            console.log(`🔧 Running FFmpeg command: ${ffmpegCommand}`);

            await execAsync(ffmpegCommand);

            // Clean up concat file
            await fs.unlink(concatFile).catch(() => {});

            console.log(`✅ Successfully concatenated videos to: ${outputFile}`);
            return true;
        } catch (error) {
            console.error('❌ Error concatenating videos:', error.message);
            return false;
        }
    }

    async validateSceneVideos(videoFiles) {
        const validVideos = [];

        for (const videoFile of videoFiles) {
            try {
                // Check if file exists and has content
                const stats = await fs.stat(videoFile);
                if (stats.size > 0) {
                    validVideos.push(videoFile);
                    console.log(`✅ Valid scene video: ${path.basename(videoFile)} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
                } else {
                    console.warn(`⚠️ Empty scene video file: ${videoFile}`);
                }
            } catch (error) {
                console.warn(`⚠️ Invalid scene video file: ${videoFile} - ${error.message}`);
            }
        }

        return validVideos;
    }

    async generateVideo() {
        try {
            // Check if FFmpeg is installed
            const ffmpegInstalled = await this.checkFfmpeg();
            if (!ffmpegInstalled) {
                throw new Error('FFmpeg is required but not installed');
            }

            // Initialize
            const initialized = await this.init();
            if (!initialized) {
                throw new Error('Failed to initialize');
            }

            // Match scenes from script and video code
            const scenePairs = [];
            for (const scene of this.scriptData.scenes) {
                const matchingVideoCode = this.videoData.scenes.find(v => v.scene_id === scene.scene_id);
                if (matchingVideoCode) {
                    scenePairs.push({scene, videoCode: matchingVideoCode});
                } else {
                    console.warn(`⚠️ Warning: No video code found for scene ${scene.scene_id}`);
                }
            }

            if (scenePairs.length === 0) {
                throw new Error('No matching scenes found between script and video code');
            }

            this.totalScenes = scenePairs.length;
            console.log(`🎬 Processing ${scenePairs.length} scenes`);

            // Process scenes using VideoGenerator class
            console.log(`🚀 Starting scene processing with max concurrency: ${this.maxConcurrency}`);
            const sceneVideos = await this.processScenesConcurrently(scenePairs);

            if (sceneVideos.length === 0) {
                throw new Error('No scene videos were successfully generated');
            }

            // Validate generated scene videos
            const validSceneVideos = await this.validateSceneVideos(sceneVideos);

            if (validSceneVideos.length === 0) {
                throw new Error('No valid scene videos found');
            }

            console.log(`📊 Generated ${validSceneVideos.length} out of ${scenePairs.length} scenes successfully`);

            // Sort videos by scene order (extract scene_id from filename)
            validSceneVideos.sort((a, b) => {
                const aId = parseInt(path.basename(a).match(/scene_(\d+)/)?.[1] || '0');
                const bId = parseInt(path.basename(b).match(/scene_(\d+)/)?.[1] || '0');
                return aId - bId;
            });
            console.log('📋 Sorted scene order for concatenation:', validSceneVideos.map(v => path.basename(v)).join(', '));

            // Concatenate all scene videos
            console.log(`\n🔄 Concatenating ${validSceneVideos.length} videos...`);
            const finalVideo = path.join(this.outputDir, 'final_video.mp4');
            const concatSuccess = await this.concatenateVideos(validSceneVideos, finalVideo);

            if (!concatSuccess) {
                throw new Error('Failed to concatenate scene videos');
            }

            // Generate summary
            const finalStats = await fs.stat(finalVideo);
            console.log(`\n🎉 Video generation complete!`);
            console.log(`📁 Final video: ${finalVideo}`);
            console.log(`📊 Final video size: ${(finalStats.size / 1024 / 1024).toFixed(2)} MB`);
            console.log(`🎬 Total scenes processed: ${validSceneVideos.length}/${scenePairs.length}`);

            return finalVideo;
        } catch (error) {
            console.error('\n❌ Video generation failed:', error.message);
            return null;
        } finally {
            // Clean up resources
            await this.cleanup();
        }
    }

    async cleanup() {
        try {
            console.log('🧹 Cleaning up temporary files...');

            // Clean up temp directory but keep scenes for debugging
            const tempFiles = await fs.readdir(this.tempDir).catch(() => []);
            for (const file of tempFiles) {
                await fs.unlink(path.join(this.tempDir, file)).catch(() => {});
            }

            console.log('🧹 Resources cleaned up');
        } catch (error) {
            console.error('⚠️ Error during cleanup:', error.message);
        }
    }
}

async function main() {
    console.log('🎥 Advanced Video Generator with Scene Processing');
    console.log('='.repeat(60));

    // Enable garbage collection if run with --expose-gc
    console.log(`🧹 Garbage collection ${global.gc ? 'enabled' : 'not enabled'} (run with node --expose-gc for better memory handling)`);

    const generator = new SimpleVideoGenerator();

    try {
        const result = await generator.generateVideo();

        if (result) {
            console.log('\n🎉 SUCCESS!');
            console.log(`📁 Final video: ${result}`);
            console.log('\n💡 Scene videos are preserved in the output/scenes directory for debugging');
        } else {
            console.error('\n❌ Video generation failed');
            process.exit(1);
        }
    } catch (error) {
        console.error('\n💥 Critical error:', error);
        process.exit(1);
    }
}
// Export the class for use as a module
module.exports = SimpleVideoGenerator;

// Run if called directly
if (require.main === module) {
    main();
}