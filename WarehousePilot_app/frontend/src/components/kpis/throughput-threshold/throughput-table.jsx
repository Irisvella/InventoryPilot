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
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Throughput Data</h2>
            <Table 
                aria-label="Throughput Threshold Table" 
                className="w-full"
                classNames={{
                    wrapper: "dark:bg-gray-800",
                    th: "dark:bg-gray-800 dark:text-white",
                    td: "dark:bg-gray-800 dark:text-gray-300",
                    tr: "dark:hover:bg-gray-700"
                }}
                bottomContent={
                    totalPages > 0 ? (
                      <div className="flex w-full justify-center">
                     <Pagination
                                         total={totalPages}
                                         initialPage={1}
                                         current={page}
                                         onChange={(newPage) => setPage(newPage)}
                                         classNames={{
                                           item: "bg-white text-black dark:bg-gray-700 dark:text-white",
                                           cursor: "bg-black text-white dark:bg-blue-600 dark:text-white",
                                         }}
                                       />
                      </div>
                    ) : null
                  }
            >
                <TableHeader>
                    {columns.map((column) => (
                        <TableColumn key={column} className="dark:text-white">{column}</TableColumn>
                    ))}
                </TableHeader>
                <TableBody items={paginatedRows}>
                    {(item) => (
                        <TableRow key={item.key}>
                            <TableCell className="dark:text-gray-300">{item.date}</TableCell>
                            <TableCell className="dark:text-gray-300">{item.picked ? item.picked : "N/A"}</TableCell>
                            <TableCell className="dark:text-gray-300">{item.packed ? item.packed : "N/A"}</TableCell>
                            <TableCell className="dark:text-gray-300">{item.shipped ? item.shipped : "N/A"}</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
