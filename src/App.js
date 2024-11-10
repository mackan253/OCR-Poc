import React, { useState } from 'react';
import Tesseract from 'tesseract.js';

function App() {
  const [items, setItems] = useState([]);
  const [imageUrl, setImageUrl] = useState(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      processImage(url);
    }
  };

  const parseReceiptText = (text) => {
    const lines = text.split('\n');
    const items = [];

    // Regular expression to match lines with item and price
    // Matches: ItemName ... Price (e.g., "Geim 149,00")
    const itemPriceRegex = /^(.+?)\s+(\d+,\d{2})(?:\s|$)/;

    lines.forEach((line) => {
      const match = line.match(itemPriceRegex);
      if (match) {
        const itemName = match[1].trim();
        const price = match[2].trim();
        items.push({ name: itemName, price });
      }
    });

    return items;
  };

  const processImage = async (url) => {
    setItems([]);
    try {
      const {
        data: { text },
      } = await Tesseract.recognize(url, 'swe', {
        logger: (m) => console.log(m),
        });

      // Debug: Log the OCR text to the console
      console.log('OCR Text:', text);

      const parsedItems = parseReceiptText(text);

      if (parsedItems.length === 0) {
        alert('No items found.');
      } else {
        setItems(parsedItems);
      }
    } catch (error) {
      console.error('OCR failed:', error);
      alert('Error processing image.');
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>OCR Receipt Scanner POC</h1>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {imageUrl && (
        <img src={imageUrl} alt="Uploaded" style={{ width: '200px', marginTop: '20px' }} />
      )}
      <div>
        <h3>Extracted Items:</h3>
        {items.length > 0 ? (
          <table style={{ margin: '0 auto', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid black', padding: '5px' }}>Item</th>
                <th style={{ border: '1px solid black', padding: '5px' }}>Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid black', padding: '5px' }}>{item.name}</td>
                  <td style={{ border: '1px solid black', padding: '5px' }}>{item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No items extracted.</p>
        )}
      </div>
    </div>
  );
}

export default App;
