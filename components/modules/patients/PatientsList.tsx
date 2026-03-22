"use client";

import { useState, useMemo } from "react";
import {
  useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel,
  type ColumnDef, type SortingState,
} from "@tanstack/react-table";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Avatar,
} from "@heroui/react";
import { ChevronLeft, ChevronRight, Pencil, AlertCircle } from "lucide-react";
import { formatDate, getInitials, formatCurrency } from "@/lib/utils";
import type { Patient } from "@/types";

type PatientWithCount = Patient & {
  _count: { appointments: number; payments: number };
  pendingDebt: number;
};

interface Props {
  patients: PatientWithCount[];
  onEdit: (patient: PatientWithCount) => void;
}

export function PatientsList({ patients, onEdit }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<PatientWithCount>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Paciente",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar
            name={getInitials(row.original.name)}
            size="sm"
            classNames={{
              base: "bg-primary-100 shrink-0",
              name: "text-primary-700 font-semibold text-xs",
            }}
          />
          <div>
            <p className="text-sm font-medium text-gray-900">{row.original.name}</p>
            <p className="text-xs text-gray-400">{row.original.email ?? "—"}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Teléfono",
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: "birthDate",
      header: "Nacimiento",
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600">
          {getValue() ? formatDate(getValue() as string) : "—"}
        </span>
      ),
    },
    {
      id: "appointments",
      header: "Citas",
      cell: ({ row }) => (
        <Chip size="sm" variant="flat" color="primary">
          {row.original._count.appointments}
        </Chip>
      ),
    },
    {
      id: "debt",
      header: "Deuda",
      cell: ({ row }) => {
        const debt = row.original.pendingDebt;
        if (!debt || debt === 0) return <span className="text-xs text-gray-300">—</span>;
        return (
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span className="text-xs font-semibold text-red-600">{formatCurrency(debt)}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <button
          onClick={() => onEdit(row.original)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ], [onEdit]);

  const table = useReactTable({
    data: patients,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  const totalDebt = useMemo(
    () => patients.reduce((sum, p) => sum + (p.pendingDebt ?? 0), 0),
    [patients]
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      {totalDebt > 0 && (
        <div className="px-4 py-2.5 border-b border-gray-100 flex justify-end">
          <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Deuda total: <span className="font-bold ml-1">{formatCurrency(totalDebt)}</span>
          </div>
        </div>
      )}

      <Table
        aria-label="Tabla de pacientes"
        removeWrapper
        classNames={{ th: "bg-gray-50 text-gray-600 text-xs font-medium", td: "py-3" }}
      >
        <TableHeader>
          {table.getHeaderGroups()[0].headers.map((header) => (
            <TableColumn
              key={header.id}
              onClick={header.column.getToggleSortingHandler()}
              className={header.column.getCanSort() ? "cursor-pointer select-none" : ""}
            >
              {header.column.columnDef.header as string}
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody emptyContent="No se encontraron pacientes">
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className={`hover:bg-gray-50 transition-colors ${
                row.original.pendingDebt > 0 ? "border-l-2 border-l-red-300" : ""
              }`}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {cell.column.columnDef.cell
                    ? (cell.column.columnDef.cell as Function)(cell.getContext())
                    : String(cell.getValue() ?? "")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          {patients.length} paciente{patients.length !== 1 ? "s" : ""}
          {table.getPageCount() > 1 && (
            <span className="ml-1 text-gray-300">
              · página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            </span>
          )}
        </span>
        {table.getPageCount() > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
