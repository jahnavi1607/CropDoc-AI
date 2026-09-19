# CropDoc AI

CropDoc AI is a browser-based crop disease screening prototype for a college project.

## What it does

- Upload a crop-leaf image.
- Runs a real image-classification model in the browser.
- Shows the top 3 model predictions and confidence.
- Displays crop/disease information, symptoms, prevention and general management.
- Supports English, Telugu, Hindi, Tamil and Kannada UI.
- Includes browser text-to-speech controls.
- Includes a simple offline-style FAQ chatbot for the current result.
- Responsive design for desktop and mobile.
- No API key is required for the model.

## Model

The project uses:

`onnx-community/mobilenet_v2_1.0_224-plant-disease-identification-ONNX`

The model is an ONNX version of a MobileNetV2 plant-disease classifier associated with the PlantVillage dataset. It is intended as a screening/demo model, not a replacement for professional agricultural diagnosis.

## Run locally

Because the app uses ES modules and loads the model from the web, do not open `index.html` directly with `file://`.

### VS Code + Live Server

1. Open this folder in VS Code.
2. Install the **Live Server** extension if needed.
3. Right-click `index.html`.
4. Choose **Open with Live Server**.
5. Upload a leaf image.
6. Click **Analyze with AI**.
7. The first model load may take time because model files need to be downloaded and cached by the browser.

## GitHub

You can upload all files in this folder to a GitHub repository. Do not add model files manually; the browser loads the model from Hugging Face.

## Important limitation

The model's training classes are based on a PlantVillage-style dataset and may not cover every crop, disease, field condition or camera situation. A prediction should be treated as a screening result and confirmed with a qualified local agricultural expert when important.

## Project structure

```text
CropDoc-AI/
├── index.html
├── style.css
├── script.js
├── README.md
├── .gitignore
└── js/
    ├── ai-model.js
    ├── disease-data.js
    ├── translations.js
    └── voice.js
```
