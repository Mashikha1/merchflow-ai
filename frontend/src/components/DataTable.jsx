import { useEffect, useState } from 'react'
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { Button } from './ui/Button'

export function DataTable({ columns, data, loading, onRowSelectionChange }) {
    const [sorting, setSorting] = useState([])
    const [rowSelection, setRowSelection] = useState({})

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            rowSelection,
        },
        initialState: {
            pagination: { pageSize: 10 }
        }
    })

    useEffect(() => {
        if (!onRowSelectionChange) return
        const selected = table.getFilteredSelectedRowModel().rows.map((r) => r.original)
        onRowSelectionChange(selected)
    }, [rowSelection])

    return (
        <div className="w-full">
            <div className="rounded-lg border border-border-subtle bg-white overflow-hidden shadow-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-[13px] text-left">
                        <thead className="bg-app-sidebar border-b border-border-subtle text-content-secondary font-medium">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th key={header.id} className="h-10 px-4 align-middle whitespace-nowrap text-xs uppercase tracking-wider">
                                            {header.isPlaceholder ? null : (
                                                <div
                                                    className={`flex items-center gap-1 ${header.column.getCanSort() ? 'cursor-pointer select-none hover:text-content-primary' : ''
                                                        }`}
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                    {header.column.getCanSort() && (
                                                        <div className="w-4">
                                                            {{
                                                                asc: <ChevronUp className="h-3.5 w-3.5" />,
                                                                desc: <ChevronDown className="h-3.5 w-3.5" />,
                                                            }[header.column.getIsSorted()] ?? (
                                                                    <ChevronsUpDown className="h-3.5 w-3.5 opacity-30" />
                                                                )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {loading ? (
                                <tr>
                                    <td colSpan={columns.length} className="h-32 text-center text-content-tertiary">
                                        Loading data...
                                    </td>
                                </tr>
                            ) : table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        className="hover:bg-app-card-muted transition-colors data-[state=selected]:bg-app-active"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="p-4 align-middle text-content-primary">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} className="h-32 text-center text-content-tertiary">
                                        No results found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-border-subtle bg-white">
                    <div className="text-[12px] text-content-secondary font-medium">
                        {table.getFilteredSelectedRowModel().rows.length} of{" "}
                        {table.getFilteredRowModel().rows.length} row(s) selected.
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="h-8 px-3 text-xs"
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="h-8 px-3 text-xs"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
