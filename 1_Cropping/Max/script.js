// Custom error class for image processing errors
class ImageProcessingError extends Error {
    constructor(message, stage, details = {}) {
        super(message);
        this.name = 'ImageProcessingError';
        this.stage = stage;
        this.details = details;
    }
}

// Wait for OpenCV.js to be ready
function onOpenCvReady() {
    console.log('OpenCV.js is ready!');
    document.getElementById('fileInput').removeAttribute('disabled');
}
if (typeof cv !== 'undefined') {
    onOpenCvReady();
} else {
    document.addEventListener('opencv4nodejs_loaded', onOpenCvReady);
}

// File input handling
document.getElementById('fileInput').addEventListener('change', handleImageUpload);

async function handleImageUpload(e) {
    try {
        const file = e.target.files[0];
        if (!file) {
            throw new ImageProcessingError('No file selected', 'file-input');
        }

        console.log('Processing file:', {
            name: file.name,
            type: file.type,
            size: `${(file.size / 1024).toFixed(2)} KB`
        });

        const img = await loadImage(file);
        processImage(img);
    } catch (error) {
        console.error('Error handling image upload:', error);
        if (error instanceof ImageProcessingError) {
            console.error(`Stage: ${error.stage}, Details:`, error.details);
        }
    }
}

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new ImageProcessingError('Failed to load image', 'image-loading'));
            img.src = e.target.result;
        };
        
        reader.onerror = () => reject(new ImageProcessingError('Failed to read file', 'file-reading'));
        reader.readAsDataURL(file);
    });
}

function processImage(img) {
    try {
        console.log('Starting image processing...');
        
        // Setup canvases
        const originalCanvas = document.getElementById('originalCanvas');
        const croppedCanvas = document.getElementById('croppedCanvas');
        
        // Set canvas dimensions
        originalCanvas.width = img.width;
        originalCanvas.height = img.height;
        croppedCanvas.width = img.width;
        croppedCanvas.height = img.height;
        
        // Draw original image
        const ctxOriginal = originalCanvas.getContext('2d');
        ctxOriginal.drawImage(img, 0, 0);
        
        // Convert to OpenCV format
        const src = cv.imread(originalCanvas);
        console.log('Image loaded into OpenCV:', {
            width: src.cols,
            height: src.rows,
            channels: src.channels()
        });
        
        // Process the image
        const processed = preprocessImage(src);
        console.log('test1');
        if (!processed || processed.isDeleted()) {
            throw new Error('Processed image is not a valid Mat or has been deleted.');
        }
        if (!croppedCanvas) {
            throw new Error('Canvas element "croppedCanvas" not found.');
        }


        // Display result
        cv.imshow(croppedCanvas, processed);
        console.log('test2');
        // Cleanup
        src.delete();
        processed.delete();
        console.log('test3');
        
        console.log('Processing completed successfully!');
    } catch (error) {
        console.error('Error processing image:', error);
        if (error instanceof ImageProcessingError) {
            console.error(`Stage: ${error.stage}, Details:`, error.details);
        }
    }
}

function preprocessImage(src) {
    const mats = new Set(); // Track all created Mats for cleanup
    let result = null; // Initialize result outside of cleanup scope

    try {
        console.log('Starting preprocessing steps...');
        
        // Convert to grayscale
        const gray = new cv.Mat();
        mats.add(gray);
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        console.log('Converted to grayscale');
        
        // Apply Gaussian blur
        const blurred = new cv.Mat();
        mats.add(blurred);
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
        console.log('Applied Gaussian blur');
        
        // Apply adaptive threshold
        const binary = new cv.Mat();
        mats.add(binary);
        cv.adaptiveThreshold(
            blurred,
            binary,
            255,
            cv.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv.THRESH_BINARY,
            11,
            2
        );
        console.log('Applied adaptive threshold');
        
        // Find contours
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        mats.add(hierarchy);
        cv.findContours(
            binary,
            contours,
            hierarchy,
            cv.RETR_EXTERNAL,
            cv.CHAIN_APPROX_SIMPLE
        );
        console.log(`Found ${contours.size()} contours`);
        
        // Find the largest contour
        let maxArea = 0;
        let maxContourIndex = -1;
        for (let i = 0; i < contours.size(); i++) {
            const area = cv.contourArea(contours.get(i));
            if (area > maxArea) {
                maxArea = area;
                maxContourIndex = i;
            }
        }
        
        if (maxContourIndex === -1) {
            throw new ImageProcessingError('No significant contours found', 'contour-detection');
        }
        
        // Get the result image
        const result = src.clone();
        mats.add(result);
        
        // Draw the largest contour
        const color = new cv.Scalar(255, 0, 0, 255);
        cv.drawContours(result, contours, maxContourIndex, color, 2);
        
        console.log('Preprocessing completed successfully');
        return result;
    } catch (error) {
        throw new ImageProcessingError(
            `Preprocessing failed: ${error.message}`,
            'preprocessing',
            { originalError: error }
        );
    } 
}