# Product Mockup Automation

Playwright automation scripts for generating product mockups using AI image generation.

## Setup

1. Install dependencies:
```bash
cd automation
npm install
```

2. Install Playwright browsers:
```bash
npm run setup
```

## Step 1: Design to Product Mockup (ChatGPT)

Automates the generation of embossed notebook mockups using ChatGPT.

### Usage

```bash
# Basic usage
node step1-chatgpt.js --color blue --design "watercolor floral pattern with roses"

# With a custom design image
node step1-chatgpt.js --color pink --design "cute cat illustration" --designImage "./my-cat.png"

# Specify output folder
node step1-chatgpt.js --color purple --design "geometric pattern" --output ./my-output
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--color` | Notebook color: blue, grey, pink, purple | blue |
| `--design` | Description of the design (required) | - |
| `--designImage` | Path to design image file | - |
| `--output` | Output folder for results | ./output |
| `--headless` | Run without browser window | false |

### First Run

On first run, the browser will open and you'll need to:
1. Log in to ChatGPT with your account
2. The automation will detect login and continue automatically
3. Your session will be saved for future runs

### Output

Generated images are saved to the `output/` folder with timestamps:
- `mockup_blue_2024-01-17T12-30-45.png`

## Using with the Web UI

1. Fill in the prompt generator on the web UI
2. Copy the command shown in the "Automation" section
3. Run the command in your terminal

## Troubleshooting

### "Could not find message input area"
ChatGPT's UI may have updated. Please open an issue with a screenshot.

### Login keeps timing out
Increase the login timeout in the script or log in manually first, then run the script.

### Images not uploading
Make sure the template images exist in `Template Images for Product Listing/` folder.
