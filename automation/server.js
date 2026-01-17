/**
 * Local Automation Server
 *
 * Provides an API for the web UI to trigger Playwright automation.
 *
 * Usage:
 *   node server.js
 *
 * Then open http://localhost:3000 in your browser.
 */

import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Enable CORS for local development
app.use(cors());
app.use(express.json());

// Serve the main index.html from parent directory
app.use(express.static(path.join(__dirname, '..')));

// Store running processes
const runningProcesses = new Map();

// API: Run Step 1 automation
app.post('/api/run-step1', (req, res) => {
    const { color, design, inspirationId, designUrl } = req.body;

    // Build command arguments
    const args = ['step1-chatgpt.js', '--color', color || 'blue'];

    if (inspirationId) {
        args.push('--inspirationId', inspirationId);
    } else if (designUrl && design) {
        args.push('--designUrl', designUrl, '--design', design);
    } else if (design) {
        args.push('--design', design);
    } else {
        return res.status(400).json({ error: 'Missing design or inspirationId' });
    }

    console.log(`\n🚀 Starting Step 1 automation...`);
    console.log(`   Command: node ${args.join(' ')}`);

    // Generate a unique ID for this run
    const runId = Date.now().toString();

    // Spawn the process
    const child = spawn('node', args, {
        cwd: __dirname,
        stdio: ['ignore', 'pipe', 'pipe']
    });

    let output = '';

    child.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log(text);
    });

    child.stderr.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.error(text);
    });

    child.on('close', (code) => {
        console.log(`\n✅ Step 1 automation finished with code ${code}`);
        runningProcesses.delete(runId);
    });

    runningProcesses.set(runId, { child, output: '' });

    res.json({
        success: true,
        runId,
        message: 'Automation started. Browser window should open shortly.'
    });
});

// API: Check automation status
app.get('/api/status/:runId', (req, res) => {
    const process = runningProcesses.get(req.params.runId);
    if (!process) {
        return res.json({ running: false, completed: true });
    }
    res.json({ running: true, output: process.output });
});

// API: Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', server: 'automation-server' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🎨 Product Mockup Automation Server                      ║
║                                                            ║
║   Open in browser: http://localhost:${PORT}                  ║
║                                                            ║
║   The "Run Automation" button will now work!               ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);
});
