/**
 * Step 1 Automation: Design to Product Mockup
 *
 * This script automates the ChatGPT interaction for generating embossed notebook mockups.
 *
 * Usage:
 *   # Text-only (ChatGPT imagines the design):
 *   node step1-chatgpt.js --color blue --design "watercolor floral pattern with roses"
 *
 *   # With local design image:
 *   node step1-chatgpt.js --color pink --design "cute cat" --designImage "./my-design.png"
 *
 *   # From Inspiration Library (fetches image + description automatically):
 *   node step1-chatgpt.js --color blue --inspirationId "abc123-uuid"
 *
 *   # With design URL (from Supabase or any URL):
 *   node step1-chatgpt.js --color purple --designUrl "https://..." --design "floral pattern"
 *
 * Options:
 *   --color          Notebook color: blue, grey, pink, purple (default: blue)
 *   --design         Description of the design for Image B
 *   --designImage    Path to local design image file
 *   --designUrl      URL to design image (will be downloaded)
 *   --inspirationId  Supabase inspiration ID (fetches image + description)
 *   --output         Output folder for downloaded images (default: ./output)
 *   --headless       Run in headless mode (default: false for first run to login)
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase config (same as web UI)
const SUPABASE_URL = 'https://jyosixwjbsahcctyakdi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_S5JGtvltlC1Q314L50QR4A_zYvzDjCR';

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        color: 'blue',
        design: '',
        designImage: '',
        designUrl: '',
        inspirationId: '',
        output: path.join(__dirname, 'output'),
        headless: process.env.HEADLESS === 'true'
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--color':
                options.color = args[++i];
                break;
            case '--design':
                options.design = args[++i];
                break;
            case '--designImage':
                options.designImage = args[++i];
                break;
            case '--designUrl':
                options.designUrl = args[++i];
                break;
            case '--inspirationId':
                options.inspirationId = args[++i];
                break;
            case '--output':
                options.output = args[++i];
                break;
            case '--headless':
                options.headless = args[++i] === 'true';
                break;
        }
    }

    return options;
}

// Fetch inspiration from Supabase
async function fetchInspiration(id) {
    const url = `${SUPABASE_URL}/rest/v1/inspirations?id=eq.${id}&select=*`;

    const response = await fetch(url, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch inspiration: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data || data.length === 0) {
        throw new Error(`Inspiration not found: ${id}`);
    }

    return data[0];
}

// Download image from URL to temp file
async function downloadImage(url, outputPath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(outputPath);

        protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                // Follow redirect
                downloadImage(response.headers.location, outputPath)
                    .then(resolve)
                    .catch(reject);
                return;
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(outputPath);
            });
        }).on('error', (err) => {
            fs.unlink(outputPath, () => {});
            reject(err);
        });
    });
}

// Generate the prompt for Step 1
function generatePrompt(color, designDescription) {
    const colorDescriptions = {
        blue: 'A PLAIN blue PU-leather notebook',
        grey: 'A PLAIN grey PU-leather notebook',
        pink: 'A PLAIN pink PU-leather notebook',
        purple: 'A PLAIN purple PU-leather notebook'
    };

    const imageA = colorDescriptions[color] || colorDescriptions.blue;
    const imageB = designDescription || '[Describe Image B]';
    const imageC = 'A blue PU notebook with an embossed dog design';

    return `Create the image using the instructions below. Do not use python.

IMAGE A — BASE NOTEBOOK (EDIT THIS IMAGE)
Describe Image A in one sentence:
${imageA}

IMAGE B — DESIGN SOURCE (ARTWORK ONLY)
Describe Image B in one sentence:
${imageB}

IMAGE C — EMBOSSING & LIGHTING REFERENCE (REFERENCE ONLY)
Describe Image C in one sentence:
${imageC}

HOW EACH IMAGE MAY BE USED

IMAGE A (Base Notebook)
This image defines and must retain:
• notebook shape, size, thickness, proportions
• camera angle, perspective, framing
• lighting direction and shadows
• background and props
• surface material and texture (smooth PU leather)

⚠️ Image A must remain visually identical except for:
• the design that gets translated onto the cover

IMAGE B (Design Source)
Use only:
• the artwork
• the colour palette for the notebook cover

❌ Do NOT copy from Image B:
• lighting
• texture
• background
• composition
• notebook geometry or notebook size or notebook features or stitching or any other effects

IMAGE C (Reference Only)
Image C exists ONLY to teach:
• how strong embossing should look in photography
• how lighting reveals raised texture
• how shadows and highlights prove depth

❌ NEVER copy from Image C:
• any artwork or motif
• any colours
• any layout or composition
• any props or objects

If any design cue from Image C appears in the output, the result is INVALID.

CORE TASK
Edit IMAGE A so that:
• The notebook cover colour matches the colour from IMAGE B
• The artwork from IMAGE B is applied to the notebook cover
• The artwork appears as a REAL, MANUFACTURED, UV-EMBOSSED / TESSELLATED PRINT
• The notebook surface remains smooth everywhere except the embossed design

This is a photorealistic image edit, not a new generation.

NON-NEGOTIABLE EMBOSSING RULES
• This is NOT flat printing.
• You MUST exaggerate embossing depth so it is clearly visible in photos
• Embossing must read as ~4–6mm at normal viewing distance
• Embossing must be obvious without zooming
• If embossing is subtle, the result is WRONG

HEIGHT VARIATION IS REQUIRED
• Primary edges / outer silhouette → highest relief
• Major internal forms → medium relief
• Minor details → shallow relief
• Background leather → zero relief

The design must appear PRESSED INTO the leather via pressure and UV curing — not painted or stuck on top.

EDGE & SHADOW BEHAVIOUR (PROOF OF EMBOSS)
To prove embossing, you MUST show:
• Clear contact shadows where raised ink meets flat leather
• Shadow falloff on the down-light side of raised edges
• Bright highlight bands on the light-facing edges
• Micro self-shadowing between overlapping raised forms
• Soft, rounded, organically pressed edges (no sharp cutouts)

If there are no visible shadows hugging the artwork edges, embossing is not convincing.

LEATHER INTERACTION (REALISM)
• PU leather grain must continue seamlessly through embossed areas
• Grain compresses slightly near raised edges
• Base leather stays smooth everywhere except the design

❌ No stickers
❌ No decals
❌ No floating layers
❌ No white outlines

LIGHTING (DO NOT IGNORE)
Use strong raking light similar to Image C:
• Catch raised edges with specular highlights
• Cast visible micro-shadows across the surface
• Increase local contrast around embossed regions
• Make depth obvious even at thumbnail size

Flat lighting = failure.

POSITION & GEOMETRY (LOCKED)
• Keep notebook geometry, camera angle, perspective, and placement identical to Image A
• Do NOT change notebook thickness, edges, spine, ribbons, or page block
• Apply the design in a natural, premium placement on the cover
• Do NOT move, rotate, or resize the design arbitrarily

RENDERING CONSTRAINTS
• Photorealistic product photography (not illustration)
• No painterly textures
• No canvas or paper grain
• No CAD bevels or uniform extrusion

FINAL SELF-VALIDATION (MANDATORY)
Before outputting, ask yourself:
• Does the notebook still look exactly like Image A?
• Is the artwork ONLY from Image B?
• Does the embossing read clearly at normal viewing distance?
• Would a customer believe they could feel this with their fingertips?

If any answer is "no", fix it before outputting.
If not, increase embossing depth, edge highlights, and contact shadows until it passes.

Ensure the output is a high quality 4k resolution image with absolutely no fuzziness or grain.`;
}

// Main automation function
async function runStep1Automation(options) {
    console.log('\n🎨 Step 1: Design to Product Mockup Automation');
    console.log('━'.repeat(50));

    // Ensure output directory exists
    if (!fs.existsSync(options.output)) {
        fs.mkdirSync(options.output, { recursive: true });
    }

    // Handle inspiration ID - fetch from Supabase
    if (options.inspirationId) {
        console.log(`📥 Fetching inspiration: ${options.inspirationId}`);
        try {
            const inspiration = await fetchInspiration(options.inspirationId);
            options.design = inspiration.description;
            options.designUrl = inspiration.file_url;
            console.log(`   ✅ Found: "${inspiration.description}"`);
        } catch (error) {
            console.error(`\n❌ Error fetching inspiration: ${error.message}`);
            process.exit(1);
        }
    }

    // Handle design URL - download to temp file
    let imageBPath = options.designImage;
    if (options.designUrl && !imageBPath) {
        console.log(`📥 Downloading design image...`);
        const tempDir = path.join(options.output, '.temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        const tempFile = path.join(tempDir, `design_${Date.now()}.png`);
        try {
            await downloadImage(options.designUrl, tempFile);
            imageBPath = tempFile;
            console.log(`   ✅ Downloaded to temp file`);
        } catch (error) {
            console.error(`\n❌ Error downloading image: ${error.message}`);
            process.exit(1);
        }
    }

    console.log(`📓 Notebook Color: ${options.color}`);
    console.log(`🖼️  Design: ${options.design}`);
    if (imageBPath) {
        console.log(`📷 Design Image: ${imageBPath}`);
    }
    console.log(`📁 Output: ${options.output}`);
    console.log('━'.repeat(50));

    // Validate inputs
    if (!options.design) {
        console.error('\n❌ Error: --design is required (or use --inspirationId)');
        console.log('Usage:');
        console.log('  node step1-chatgpt.js --color blue --design "your design description"');
        console.log('  node step1-chatgpt.js --color blue --inspirationId "uuid-from-library"');
        process.exit(1);
    }

    // Set up paths to template images
    const templateDir = path.join(__dirname, '..', 'Template Images for Product Listing');
    const imageAPath = path.join(templateDir, `${options.color}.png`);
    const imageCPath = path.join(templateDir, 'bluedog.png');

    // Verify template images exist
    if (!fs.existsSync(imageAPath)) {
        console.error(`\n❌ Error: Base notebook image not found: ${imageAPath}`);
        console.log(`Available colors: blue, grey, pink, purple`);
        process.exit(1);
    }
    if (!fs.existsSync(imageCPath)) {
        console.error(`\n❌ Error: Emboss reference image not found: ${imageCPath}`);
        process.exit(1);
    }

    // Check for local design image
    if (options.designImage && !imageBPath) {
        imageBPath = options.designImage;
    }
    if (imageBPath && !fs.existsSync(imageBPath)) {
        console.error(`\n❌ Error: Design image not found: ${imageBPath}`);
        process.exit(1);
    }

    // Generate the prompt
    const prompt = generatePrompt(options.color, options.design);

    // Set up browser with persistent context (to keep login session)
    const userDataDir = path.join(__dirname, '.browser-data');

    console.log('\n🚀 Launching browser...');

    const browser = await chromium.launchPersistentContext(userDataDir, {
        headless: options.headless,
        viewport: { width: 1280, height: 900 },
        args: ['--disable-blink-features=AutomationControlled']
    });

    const page = browser.pages()[0] || await browser.newPage();

    try {
        // Navigate to ChatGPT
        console.log('🌐 Opening ChatGPT...');
        await page.goto('https://chat.openai.com/', { waitUntil: 'networkidle' });

        // Wait a moment for page to stabilize
        await page.waitForTimeout(2000);

        // Check if we need to log in
        const needsLogin = await page.locator('button:has-text("Log in")').isVisible().catch(() => false);

        if (needsLogin) {
            console.log('\n⚠️  Please log in to ChatGPT in the browser window.');
            console.log('   After logging in, the automation will continue automatically.\n');

            // Wait for the chat interface to appear (indicates successful login)
            await page.waitForSelector('[data-testid="send-button"], button[data-testid="send-button"], form textarea', {
                timeout: 300000 // 5 minutes to log in
            });
            console.log('✅ Login detected, continuing...\n');
        }

        // Wait for chat interface
        console.log('⏳ Waiting for chat interface...');
        await page.waitForSelector('textarea, [contenteditable="true"]', { timeout: 30000 });
        await page.waitForTimeout(1000);

        // Find the message input area
        const inputSelectors = [
            '#prompt-textarea',
            'textarea[data-id="root"]',
            'div[contenteditable="true"]',
            'textarea'
        ];

        let inputArea = null;
        for (const selector of inputSelectors) {
            inputArea = await page.$(selector);
            if (inputArea) break;
        }

        if (!inputArea) {
            throw new Error('Could not find message input area');
        }

        // Upload images first (using the attachment button)
        console.log('📎 Uploading images...');

        // Find the file input or attachment button
        const fileInput = await page.$('input[type="file"]');

        if (fileInput) {
            // Prepare images to upload
            const imagesToUpload = [imageAPath, imageCPath];
            if (imageBPath) {
                imagesToUpload.splice(1, 0, imageBPath); // Insert design image as Image B
            }

            console.log(`   📷 Image A (Base): ${path.basename(imageAPath)}`);
            if (imageBPath) {
                console.log(`   🎨 Image B (Design): ${path.basename(imageBPath)}`);
            } else {
                console.log(`   🎨 Image B (Design): [No image - using description only]`);
            }
            console.log(`   📐 Image C (Reference): ${path.basename(imageCPath)}`);

            // Upload all images
            await fileInput.setInputFiles(imagesToUpload);

            // Wait for uploads to process
            await page.waitForTimeout(3000);
            console.log('✅ Images uploaded');
        } else {
            console.log('⚠️  Could not find file upload input, proceeding with text only');
        }

        // Type the prompt
        console.log('✍️  Entering prompt...');
        await inputArea.click();
        await page.waitForTimeout(500);

        // Use clipboard to paste the prompt (faster and more reliable)
        await page.evaluate((text) => {
            navigator.clipboard.writeText(text);
        }, prompt);

        await page.keyboard.press('Control+v');
        await page.waitForTimeout(1000);

        // Send the message
        console.log('📤 Sending message...');

        // Try different methods to send
        const sendButton = await page.$('button[data-testid="send-button"]')
            || await page.$('button:has-text("Send")')
            || await page.$('button[aria-label*="Send"]');

        if (sendButton) {
            await sendButton.click();
        } else {
            // Try pressing Enter
            await page.keyboard.press('Enter');
        }

        console.log('\n⏳ Waiting for ChatGPT to generate image...');
        console.log('   (This may take 30-60 seconds)\n');

        // Wait for response - look for an image in the response
        await page.waitForSelector('img[alt*="image"], img[src*="oaidalleapiprodscus"], div[data-message-author-role="assistant"] img', {
            timeout: 120000 // 2 minutes
        });

        console.log('✅ Image generated!');

        // Wait a bit more for the image to fully load
        await page.waitForTimeout(3000);

        // Find and download the generated image
        console.log('💾 Downloading generated image...');

        const generatedImages = await page.$$('div[data-message-author-role="assistant"] img');

        if (generatedImages.length > 0) {
            // Get the last image (most recent generation)
            const lastImage = generatedImages[generatedImages.length - 1];
            const imageSrc = await lastImage.getAttribute('src');

            if (imageSrc) {
                // Generate output filename
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                const outputFilename = `mockup_${options.color}_${timestamp}.png`;
                const outputPath = path.join(options.output, outputFilename);

                // Download the image
                const imageResponse = await page.request.get(imageSrc);
                const imageBuffer = await imageResponse.body();
                fs.writeFileSync(outputPath, imageBuffer);

                console.log(`\n🎉 Success! Image saved to:`);
                console.log(`   ${outputPath}\n`);
            }
        } else {
            console.log('\n⚠️  Could not find generated image. Please download manually from the browser.');
        }

        // Keep browser open for review unless in headless mode
        if (!options.headless) {
            console.log('📺 Browser will stay open for review.');
            console.log('   Press Ctrl+C to close.\n');

            // Keep the script running
            await new Promise(() => {});
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);

        // Take a screenshot for debugging
        const screenshotPath = path.join(options.output, 'error-screenshot.png');
        await page.screenshot({ path: screenshotPath });
        console.log(`📸 Error screenshot saved to: ${screenshotPath}`);

        throw error;
    } finally {
        if (options.headless) {
            await browser.close();
        }
    }
}

// Run the automation
const options = parseArgs();
runStep1Automation(options).catch(console.error);
