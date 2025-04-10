/* The upload button as well as the blue information icon were tested*/ 
import React, { useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Tooltip } from "@heroui/tooltip";
import { Divider } from "@heroui/divider";
import SideBar from "../dashboard_sidebar1/App";

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
    <div>
    <SideBar/>
    <div className="flex flex-col items-center justify-center h-screen">
    <Card className="max-w-[1000px] w-full h-[500px] flex flex-col justify-between">
      <CardHeader className="flex justify-center items-center">
        <p className="text-2xl font-bold text-center">Upload OA Report File</p>
      </CardHeader>
      <Divider />
      <CardBody className="flex flex-col items-center justify-center space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".xlsx, .xlsm, .csv"
            onChange={handleFileChange}
            className="border p-2 rounded"
          />
          <Tooltip
            content={
              <div className="text-sm max-w-xs">
                <p><strong>Accepted formats:</strong> .xlsx, .xlsm, .csv</p>
                <p><strong>Required columns with exact names and capitalization:</strong></p>
                <ul className="list-disc list-inside">
                  <li>275</li>
                  <li>NoCommande</li>
                  <li>QteAProd</li>
                  <li>NoProd</li>
                  <li>Departement</li>
                  <li>LineUpNo</li>
                  <li>MaxDate</li>
                  <li>NomClientLiv</li>
                  <li>ProjectType</li>
                  <li>StatutOA</li>
                  <li>LOC / AREA / MODEL FINAL</li>
                </ul>
                <p>Rows with missing or invalid values may be skipped.</p>
              </div>
            }
            placement="right"
          >
            <span className="text-blue-600 cursor-pointer text-lg">ℹ️</span> 
          </Tooltip>
        </div>

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
    </div>
    </div>
  );
};

export default OAInput;
