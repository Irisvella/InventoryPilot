import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Divider } from "@heroui/divider";

const AllLabels = () => {
  const { order_id } = useParams();
  const [labels, setLabels] = useState([]);
  const [error, setError] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${API_BASE_URL}/label_maker/order/${order_id}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setLabels(response.data.labels);
      } catch (err) {
        console.error("Error fetching labels:", err);
        setError("Could not load labels.");
      }
    };

    fetchLabels();
  }, [order_id]);

  const handlePrint = () => {
    window.print();
  };

  if (error) return <div className="text-red-500">{error}</div>;
  if (!labels.length) return <div>Loading labels...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">All Labels for Order #{order_id}</h2>
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 print:hidden"
        >
          Print All Labels
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {labels.map((label, idx) => {
          const image = label.SKU_COLOR_IMAGE
            ? decodeURIComponent(label.SKU_COLOR_IMAGE).replace(/^\/+/, "")
            : null;

          return (
            <Card
              key={idx}
              className="max-w-[500px] w-full print:break-inside-avoid"
            >
              <CardHeader className="flex justify-between items-center px-4">
                <p className="text-3xl font-bold">Order #{label.ORDER_NUMBER}</p>
                <span className="text-sm text-gray-600">{label.SEQUENCE}</span>
              </CardHeader>
              <Divider />
              <CardBody className="flex flex-1">
                <div className="grid grid-cols-2 gap-4 w-full h-full">
                  {/* Left column */}
                  <div className="border-r border-gray-300 pr-4 flex flex-col space-y-2 text-xl">
                    <div><strong>AREA:</strong> {label.AREA || "AREA"}</div>
                    <div><strong>LINE UP:</strong> {label.LINEUP_NB || "LINEUP"}</div>
                    <div><strong>MODEL:</strong> {label.MODEL_NB || "MODEL"}</div>
                    <div><strong>SKU:</strong><br />{label.SKU_COLOR || "SKU"}</div>
                    <div><strong>QTY:</strong> {label.QTY || "QTY"}</div>
                  </div>

                  {/* Right column */}
                  <div className="flex items-center justify-center">
                    {image && (
                      <img
                        src={image}
                        alt="SKU_COLOR_IMAGE"
                        className="max-h-40 object-contain"
                      />
                    )}
                  </div>
                </div>
              </CardBody>
              <Divider />
              <CardFooter className="text-center">
                <p>BARCODE HERE</p>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AllLabels;
