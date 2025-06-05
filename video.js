const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');
const {exec} = require('child_process');
const {promisify} = require('util');
const say = require('say');

const execAsync = promisify(exec);

class VideoGenerator {
    constructor(options = {}) {
        this.outputDir = options.outputDir || path.join(__dirname, 'output');
        this.tempDir = path.join(this.outputDir, 'temp');
        this.browser = null;
        this.ffmpegAvailable = false;
    }

    async init() {
        try {
            // Check FFmpeg first
            this.ffmpegAvailable = await this.checkFfmpeg();
            if (!this.ffmpegAvailable) {
                return false;
            }

            // Create output and temp directories
            await fs.mkdir(this.outputDir, {recursive: true});
            await fs.mkdir(this.tempDir, {recursive: true});

            // Launch browser for rendering HTML
            this.browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            return true;
        } catch (error) {
            console.error('❌ Initialization error:', error);
            return false;
        }
    }

    async checkFfmpeg() {
        try {
            await execAsync('ffmpeg -version');
            console.log('✅ FFmpeg is installed');
            return true;
        } catch (error) {
            console.error('❌ FFmpeg is not installed or not in PATH');
            console.error('Please install FFmpeg: https://ffmpeg.org/download.html');
            return false;
        }
    }

    async renderHtmlToImage(html, outputFile) {
        try {
            // Create a temporary HTML file
            const htmlFile = path.join(this.tempDir, 'temp.html');
            await fs.writeFile(htmlFile, html);

            // Render and screenshot
            const page = await this.browser.newPage();
            await page.setViewport({width: 1920, height: 1080});
            await page.goto(`file://${htmlFile}`, {waitUntil: 'networkidle0'});
            await page.screenshot({path: outputFile});
            await page.close();

            // Clean up
            await fs.unlink(htmlFile).catch(() => {
            });
            return true;
        } catch (error) {
            console.error('❌ Error rendering HTML:', error.message);
            return false;
        }
    }

    async createAudioFromText(text, outputFile) {
        try {
            // Create a Promise wrapper for the 'say' library
            return new Promise((resolve, reject) => {
                // Use say.export to create an audio file from text
                say.export(text, null, 1.0, outputFile, (err) => {
                    if (err) {
                        console.error('❌ Error generating speech:', err);
                        reject(err);
                    } else {
                        console.log('✅ Speech generated successfully');
                        resolve(true);
                    }
                });
            });
        } catch (error) {
            console.error('❌ Error creating audio from text:', error.message);
            return false;
        }
    }

// Fallback to silent audio if TTS fails
    async createSilentAudio(duration, outputFile) {
        try {
            await execAsync(`ffmpeg -y -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=44100" -t ${duration} "${outputFile}"`);
            return true;
        } catch (error) {
            console.error('❌ Error creating silent audio:', error.message);
            return false;
        }
    }

    async createVideoFromImage(imageFile, duration, outputFile) {
        try {
            await execAsync(`ffmpeg -y -loop 1 -i "${imageFile}" -c:v libx264 -t ${duration} -pix_fmt yuv420p "${outputFile}"`);
            return true;
        } catch (error) {
            console.error('❌ Error creating video from image:', error.message);
            return false;
        }
    }

    async combineAudioVideo(videoFile, audioFile, outputFile) {
        try {
            await execAsync(`ffmpeg -y -i "${videoFile}" -i "${audioFile}" -c:v copy -c:a aac -shortest "${outputFile}"`);
            return true;
        } catch (error) {
            console.error('❌ Error combining audio and video:', error.message);
            return false;
        }
    }

    // Estimate how long the video should be based on script length
    estimateTextDuration(text) {
        // Average person speaks ~150 words per minute, or 2.5 words per second
        // Adding a bit of buffer for pauses and natural speech
        const words = text.split(/\s+/).length;
        return Math.max(3, Math.ceil(words / 2)); // Minimum 3 seconds
    }

    async generateVideo(html, script) {
        console.log('🚀 Starting video generation process');

        try {
            // Initialize
            const initialized = await this.init();
            if (!initialized) {
                throw new Error('Failed to initialize');
            }

            // Create filenames
            const imageFile = path.join(this.tempDir, 'frame.png');
            const duration = this.estimateTextDuration(script);
            const videoFile = path.join(this.tempDir, 'video.mp4');
            const outputFile = path.join(this.outputDir, 'output.mp4');

            console.log(`⏱️ Estimated video duration: ${duration}s`);

            // Step 1: Render HTML to image
            console.log('📸 Rendering HTML to image...');
            const renderSuccess = await this.renderHtmlToImage(html, imageFile);
            if (!renderSuccess) {
                throw new Error('Failed to render HTML to image');
            }

            // Step 2: Create audio file from script
            console.log('🔊 Generating speech from script...');
            const audioFile = path.join(this.tempDir, 'audio.wav');
            let audioSuccess = false;

            try {
                audioSuccess = await this.createAudioFromText(script, audioFile);
            } catch (error) {
                console.log('⚠️ TTS failed, falling back to silent audio');
                audioSuccess = await this.createSilentAudio(duration, audioFile);
            }

            if (!audioSuccess) {
                throw new Error('Failed to create audio file');
            }

            // Step 3: Create video from image
            console.log('🎥 Creating video from image...');
            const videoSuccess = await this.createVideoFromImage(imageFile, duration, videoFile);
            if (!videoSuccess) {
                throw new Error('Failed to create video file');
            }

            // Step 4: Combine audio and video
            console.log('🔄 Combining audio and video...');
            const combineSuccess = await this.combineAudioVideo(videoFile, audioFile, outputFile);
            if (!combineSuccess) {
                throw new Error('Failed to combine audio and video');
            }

            // Clean up intermediate files
            await fs.unlink(imageFile).catch(() => {
            });
            await fs.unlink(audioFile).catch(() => {
            });
            await fs.unlink(videoFile).catch(() => {
            });

            console.log('✅ Video created successfully!');
            console.log(`📁 Output file: ${outputFile}`);

            return outputFile;
        } catch (error) {
            console.error('❌ Error generating video:', error);
            return false;
        } finally {
            // Cleanup
            await this.cleanup();
        }
    }

    async cleanup() {
        try {
            // Close the browser if it's open
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
            }
            console.log('🧹 Resources cleaned up');
        } catch (error) {
            console.error('⚠️ Error during cleanup:', error.message);
        }
    }
}

module.exports = VideoGenerator;

// Example usage
if (require.main === module) {
    (async () => {
        const generator = new VideoGenerator();
        const sampleHtml = `
          <div style="width: 1280px; height: 720px; background: linear-gradient(to right, #1a2a6c, #b21f1f, #fdbb2d); display: flex; justify-content: center; align-items: center;">
            <h1 style="color: white; font-size: 48px; text-align: center; font-family: Arial;">Sample Video Generator</h1>
          </div>
        `;
        const sampleScript = "This is a sample video generated with our new VideoGenerator class. It takes HTML and a script to create a simple video.";

        const result = await generator.generateVideo(sampleHtml, sampleScript);
        if (result) {
            console.log('🎉 Success!');
        } else {
            console.error('❌ Failed to generate video.');
            process.exit(1);
        }
    })();
}