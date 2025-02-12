import React, { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';

const BarcodeScanner = () => {
  const [scannedResult, setScannedResult] = useState('');
  const [error, setError] = useState('');
  const codeReaderRef = useRef(null);

  useEffect(() => {
    // Initialize the code reader with specific hints
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.UPC_A,
    ]);
    codeReaderRef.current = new BrowserMultiFormatReader(hints);

    return () => {
      // Clean up the reader on component unmount
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        decodeImage(img);
      };
      img.onerror = () => {
        console.error('Failed to load the image.');
        setError('Failed to load the image.');
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      console.error('Failed to read the file.');
      setError('Failed to read the file.');
    };
    reader.readAsDataURL(file);

    // Reset the input value to allow the same file to be selected again
    event.target.value = '';
  };

  const decodeImage = async (img) => {
    if (!codeReaderRef.current) {
      console.error('Decoder is not initialized.');
      setError('Decoder is not initialized.');
      return;
    }

    try {
      const result = await codeReaderRef.current.decodeFromImageElement(img);
      setScannedResult(result.getText());
      setError('');
    } catch (err) {
      console.error('Decoding error:', err);
      setError('No barcode found or unable to decode.');
    }
  };

  return (
    <div>
      <h2>Upload Image to Scan Barcode</h2>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {scannedResult && <p>Scanned Barcode: {scannedResult}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default BarcodeScanner;
