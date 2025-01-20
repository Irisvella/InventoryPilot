import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Typography, CircularProgress, Box } from '@mui/material';

const columns = [
  { field: 'sku_color_id', headerName: 'SKU Color ID', width: 150 },
  { field: 'qty', headerName: 'Quantity', width: 150 },
  { field: 'warehouse_number', headerName: 'Warehouse Number', width: 200 },
  // Do not add 'inventory_id' here if you don't want it to be displayed
];

const StockLevelsPreview = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null);  // Error handling

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authorization token is missing');
      setLoading(false);
      return;
    }

    // Fetch inventory data from the backend
    fetch('http://127.0.0.1:8000/inventory/inventorypreview/', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    .then(response => response.json())
    .then(data => {
      if (Array.isArray(data)) {
        // Ensure rows have a unique id using inventory_id, but don't display it
        setRows(data.map(part => ({
          id: part.inventory_id,  // Unique id for each row (required by DataGrid)
          sku_color_id: part.sku_color_id,
          qty: part.qty,
          warehouse_number: part.warehouse_number,
          inventory_id: part.inventory_id,  // This will be used internally but not displayed
        })));
      } else {
        setError('Failed to fetch valid data');
      }
      setLoading(false);
    })
    .catch(error => {
      console.error('Failed to fetch inventory data:', error);
      setError('Failed to load data');
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <Box mt={10} display="flex" flexDirection="column" alignItems="center">
        <Typography variant="h6">
          Inventory Overview
        </Typography>
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Typography variant="body1" color="error">{error}</Typography>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns} // 'inventory_id' is not in columns, so it won't be displayed
            pageSize={5}
            page={0}  // Start from the first page
            rowsPerPageOptions={[10]}  // Only allow 10 rows per page option
            pagination
            getRowId={(row) => row.inventory_id}  // Ensure row id is based on inventory_id
          />
        )}
      </Box>
    </div>
  );
};

export default StockLevelsPreview;

