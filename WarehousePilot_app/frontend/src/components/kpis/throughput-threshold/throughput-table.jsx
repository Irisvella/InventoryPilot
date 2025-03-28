import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Pagination } from "@heroui/react";
import { useEffect, useState, useMemo } from "react";

export default function ThroughputTable({data}) {
    const [rows, setRows] = useState([]);
    const [page, setPage] = useState(1);
    
    /* useEffect - format data for table */
    useEffect(() => {
        setRows(
            data.map((entry, index) => ({
                key: index + 1,
                date: entry.date,
                picked: entry.picked,
                packed: entry.packed,
                shipped: entry.shipped,
            }))
        );
    }, []);

    /* Pagination */
    const rowsPerPage = 5;
    const paginatedRows = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return rows.slice(start, end);
    }, [page, rows]);
    const totalPages = Math.ceil(rows.length / rowsPerPage);

    const columns = ["Week of", "Picked", "Packed", "Shipped"];

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Throughput Data</h2>
            <Table 
                aria-label="Throughput Threshold Table" 
                className="w-full"
                bottomContent={
                    totalPages > 0 ? (
                      <div className="flex w-full justify-center">
                        <Pagination
                          isCompact
                          showControls
                          showShadow
                          color="primary"
                          page={page}
                          total={totalPages}
                          onChange={(page) => setPage(page)}
                        />
                      </div>
                    ) : null
                  }
            >
                <TableHeader>
                    {columns.map((column) => (
                        <TableColumn key={column}>{column}</TableColumn>
                    ))}
                </TableHeader>
                <TableBody items={paginatedRows}>
                    {(item) => (
                        <TableRow key={item.key}>
                            <TableCell>{item.date}</TableCell>
                            <TableCell>{item.picked ? item.picked : "N/A"}</TableCell>
                            <TableCell>{item.packed ? item.packed : "N/A"}</TableCell>
                            <TableCell>{item.shipped ? item.shipped : "N/A"}</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
