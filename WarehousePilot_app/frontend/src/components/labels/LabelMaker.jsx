import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom"; 
import {Card, CardHeader, CardBody, CardFooter} from "@heroui/card";
import {Divider} from "@heroui/divider";

const LabelMaker = () => {
  const { picklist_item_id } = useParams(); 
  const [labelData, setLabelData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    async function fetchLabelData() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No authorization token found");
          setLoading(false);
          return;
        }
        const response = await axios.get(
          `${API_BASE_URL}/label_maker/${picklist_item_id}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setLabelData(response.data);
      } catch (err) {
        console.error("Error fetching label data:", err);
        setError("Failed to load label data");
      } finally {
        setLoading(false);
      }
    }

    fetchLabelData();
  }, [picklist_item_id]); 

  if (loading) {
    return <div>Loading Label Data...</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  if (!labelData) {
    return <div>No label data found.</div>;
  }

  const decodedImageUrl = labelData.SKU_COLOR_IMAGE
    ? decodeURIComponent(labelData.SKU_COLOR_IMAGE).replace(/^\/+/, "")
    : null;
    
  return (
    <Card className="max-w-[500px] h-[400px]">
      <CardHeader className="flex justify-center items-center">
        <p className="text-5xl font-bold text-center"> {labelData.ORDER_NUMBER || "ORDER NB"} </p>
      </CardHeader>
      <Divider />
      <CardBody className="flex flex-1">

      <div className="grid grid-cols-2 gap-4 items-start w-full h-full">
        {/* Left column */}
        <div className="border-r border-gray-300 pr-4 flex flex-col space-y-2 text-xl h-full flex-grow">
        <div>
            <strong>AREA:</strong> {labelData.AREA || "AREA"}
          </div>
          <div>
            <strong>LINE UP:</strong> {labelData.LINEUP_NB || "LINE UP NB"}
          </div>
          <div>
            <strong>MODEL:</strong> {labelData.MODEL_NB || "MODEL CODE"}
          </div>
          <div>
            <strong>SKU:</strong><br/> {labelData.SKU_COLOR || "SKU COLOR"}
          </div>
          <div>
            <strong>QTY:</strong> {labelData.QTY || "QTY"}
          </div>
        </div>

        {/* Right column */}
        <div className="pl-4 flex items-center justify-center h-full">
          <img
            src={decodedImageUrl}
            alt="SKU_COLOR_IMAGE"
            className="max-h-64 object-contain"
          />
        </div>
      </div>
      
      </CardBody>
      <Divider />
      <CardFooter className="flex justify-center items-center">
        <p className="text-center items-center"> BARCODE HERE</p>
      </CardFooter>
    </Card>
  );
}

export default LabelMaker;
