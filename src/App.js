import React, { useState } from 'react';
import Tesseract from 'tesseract.js';

function App() {
  const [ocrResult, setOcrResult] = useState('No text scanned');
  const [imageUrl, setImageUrl] = useState(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      processImage(url);
    }
  };

  const processImage = async (url) => {
    setOcrResult('Processing...');
    try {
      const { data: { text } } = await Tesseract.recognize(
        url,
        'eng',
        { logger: m => console.log(m) } // Logs OCR progress to console
      );
      setOcrResult(text);
    } catch (error) {
      console.error('OCR failed:', error);
      setOcrResult('Error processing image.');
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>OCR Receipt Scanner POC</h1>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {imageUrl && <img src={imageUrl} alt="Uploaded" style={{ width: '200px', marginTop: '20px' }} />}
      <div>
        <h3>OCR Result:</h3>
        <p>{ocrResult}</p>
      </div>
    </div>
  );
}

export default App;
