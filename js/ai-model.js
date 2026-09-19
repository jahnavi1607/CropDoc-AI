import { pipeline, RawImage } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";

const MODEL_ID = "onnx-community/mobilenet_v2_1.0_224-plant-disease-identification-ONNX";
let classifierPromise = null;

export async function loadModel() {
  if (!classifierPromise) {
    classifierPromise = pipeline("image-classification", MODEL_ID, {
      device: "wasm",
      dtype: "fp32",
      progress_callback: (info) => {
        if (info.status === "progress" && typeof info.progress === "number") {
          console.log(`CropDoc AI model download: ${info.progress.toFixed(0)}%`);
        }
      }
    });
  }
  return classifierPromise;
}

export async function classifyImage(blob) {
  const classifier = await loadModel();
  const image = await RawImage.fromBlob(blob);
  return await classifier(image, { top_k: 3 });
}

export { MODEL_ID };
