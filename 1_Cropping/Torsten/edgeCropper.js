// Ensure OpenCV.js is loaded before this script
function detectReceiptEdges(inputImage) {
    // Convert image to grayscale
    const gray = new cv.Mat();
    cv.cvtColor(inputImage, gray, cv.COLOR_RGBA2GRAY);

    // Apply Gaussian blur to reduce noise
    const blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

    // Edge detection using Canny
    const edges = new cv.Mat();
    cv.Canny(blurred, edges, 50, 150);

    // Find contours
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    // Find the largest contour (assuming it's the receipt)
    let largestContour = null;
    let maxArea = 0;

    for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour, false);
        
        if (area > maxArea) {
            maxArea = area;
            largestContour = contour;
        }
    }

    // Get bounding rectangle
    if (largestContour) {
        const rect = cv.boundingRect(largestContour);
        
        // Crop image to receipt edges
        const croppedImage = inputImage.roi(rect);
        return croppedImage;
    }

    return null;
}

// Usage example
function processReceiptImage(imageElement) {
    const src = cv.imread(imageElement);
    const croppedReceipt = detectReceiptEdges(src);
    
    if (croppedReceipt) {
        cv.imshow('outputCanvas', croppedReceipt);
    }
}