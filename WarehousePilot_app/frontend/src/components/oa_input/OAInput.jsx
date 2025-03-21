import React, { useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Divider } from "@heroui/divider";

const OAInput = () => {
  const [file, setFile] = useState(null);
  const [uploadResponse, setUploadResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file before uploading.");
      console.error("❌ No file selected.");
      return;
    }
  
    const formData = new FormData();
    formData.append("file", file);
  
    setLoading(true);
    setError(null);
    setUploadResponse(null);
  
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authorization token found");
        console.error("❌ No authorization token found.");
        setLoading(false);
        return;
      }
  
      console.log("📤 Sending file to backend...");
      console.log("🔍 API URL:", `${API_BASE_URL}oa_input/oa_in/`);
      console.log("🔍 Headers:", {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });
  
      const response = await axios.post(
        `${API_BASE_URL}oa_input/oa_in/`, 
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      console.log("✅ Upload successful:", response.data);
      setUploadResponse(response.data);
    } catch (err) {
      console.error("❌ Error uploading file:", err);
      console.error("🔍 Error response:", err.response?.data);
      setError(`Failed to upload file: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-[500px] h-[300px] flex flex-col justify-between">
      <CardHeader className="flex justify-center items-center">
        <p className="text-2xl font-bold text-center">Upload XLSM File</p>
      </CardHeader>
      <Divider />
      <CardBody className="flex flex-col items-center space-y-4">
        <input
          type="file"
          accept=".xlsm"
          onChange={handleFileChange}
          className="border p-2 rounded"
        />
        <button
          onClick={handleUpload}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </CardBody>
      <Divider />
      <CardFooter className="text-center">
        {error && <p className="text-red-500">{error}</p>}
        {uploadResponse && <p className="text-green-500">Upload Successful!</p>}
      </CardFooter>
    </Card>
  );
};

export default OAInput;
