"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip,
} from "@heroui/react";
import { Search, ChevronLeft, ChevronRight, Download, Pencil, CheckCircle, Loader2 } from "lucide-react";
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, isWithinInterval,
} from "date-fns";
import {
  formatCurrency, formatDate, paymentStatusColors,
  paymentStatusLabels, paymentMethodLabels,
} from "@/lib/utils";
import { updatePayment } from "@/lib/actions/payments";
import type { PaymentWithRelations, PaymentStatus } from "@/types";

type DatePreset = "all" | "today" | "week" | "month" | "custom";

interface Props {
  payments: PaymentWithRelations[];
  onEdit: (p: PaymentWithRelations) => void;
  onUpdated?: (p: PaymentWithRelations) => void;
}

export function PaymentsList({ payments, onEdit, onUpdated }: Props) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  // Set de IDs en proceso — permite múltiples cobros simultáneos
  const [cobrandoIds, setCobrandoIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const now = new Date();
    return payments.filter((p) => {
      if (nameFilter && !p.patient?.name?.toLowerCase().includes(nameFilter.toLowerCase())) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      const pDate = new Date(p.createdAt);
      if (datePreset === "today" && !isWithinInterval(pDate, { start: startOfDay(now), end: endOfDay(now) })) return false;
      if (datePreset === "week" && !isWithinInterval(pDate, { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) })) return false;
      if (datePreset === "month" && !isWithinInterval(pDate, { start: startOfMonth(now), end: endOfMonth(now) })) return false;
      if (datePreset === "custom" && customStart && customEnd) {
        if (!isWithinInterval(pDate, { start: startOfDay(new Date(customStart)), end: endOfDay(new Date(customEnd)) })) return false;
      }
      return true;
    });
  }, [payments, nameFilter, statusFilter, datePreset, customStart, customEnd]);

  const totalCobrado = useMemo(
    () => filtered.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0),
    [filtered]
  );

  const handleCobrar = async (payment: PaymentWithRelations) => {
    // Agrega el ID al Set (no sobreescribe los demás)
    setCobrandoIds((prev) => new Set(prev).add(payment.id));
    const result = await updatePayment(payment.id, { status: "PAID", method: payment.method });
    // Remueve el ID del Set al terminar
    setCobrandoIds((prev) => {
      const next = new Set(prev);
      next.delete(payment.id);
      return next;
    });
    if (!result.error && onUpdated) {
      onUpdated(result.data as PaymentWithRelations);
    }
  };

  const exportCSV = () => {
    const BOM = "\uFEFF";
    const headers = ["Paciente", "Tratamiento", "Monto", "Estado", "Método", "Fecha"];
    const rows = filtered.map((p) => [
      p.patient.name, p.treatment, p.amount.toFixed(2),
      paymentStatusLabels[p.status], paymentMethodLabels[p.method] ?? p.method,
      formatDate(p.createdAt),
    ]);
    const csv = BOM + [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "pagos_dentalflow.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const columns: ColumnDef<PaymentWithRelations>[] = useMemo(() => [
    {
      accessorKey: "patient",
      header: "Paciente",
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{row.original.patient.name}</p>
          <p className="text-xs text-gray-400">{row.original.treatment}</p>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Monto",
      cell: ({ getValue }) => (
        <div className="text-center">
          <span className="text-sm font-semibold text-gray-900">{formatCurrency(getValue() as number)}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ getValue }) => {
        const s = getValue() as PaymentStatus;
        return (
          <div className="text-center">
            <Chip size="sm" color={paymentStatusColors[s] as any} variant="flat">
              {paymentStatusLabels[s]}
            </Chip>
          </div>
        );
      },
    },
    {
      accessorKey: "method",
      header: "Método",
      cell: ({ getValue }) => (
        <div className="text-center">
          <span className="text-sm text-gray-500">{paymentMethodLabels[getValue() as string] ?? getValue() as string}</span>
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Fecha",
      cell: ({ getValue }) => (
        <div className="text-center">
          <span className="text-sm text-gray-400">{formatDate(getValue() as string)}</span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const p = row.original;
        const isPending = p.status === "PENDING" || p.status === "PARTIAL";
        const isCobrando = cobrandoIds.has(p.id);
        return (
          <div className="flex items-center justify-center gap-1">
            {isPending && (
              <button
                onClick={() => handleCobrar(p)}
                disabled={isCobrando}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-w-[70px] justify-center"
              >
                {isCobrando
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Cobrar</>
                  : <><CheckCircle className="w-3.5 h-3.5" /> Cobrar</>
                }
              </button>
            )}
            <button
              onClick={() => onEdit(p)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
    },
  ], [onEdit, cobrandoIds]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="p-4 border-b border-gray-100 space-y-3">
        <div className="flex flex-wrap gap-2">
          {(["all", "today", "week", "month", "custom"] as DatePreset[]).map((p) => (
            <button key={p} onClick={() => setDatePreset(p)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                datePreset === p ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {{ all: "Todo", today: "Hoy", week: "Esta semana", month: "Este mes", custom: "Rango" }[p]}
            </button>
          ))}
          {datePreset === "custom" && (
            <div className="flex gap-2">
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-primary-400" />
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-primary-400" />
            </div>
          )}
        </div>

        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" placeholder="Buscar por paciente..." value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-400 transition-colors w-52" />
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-primary-400 bg-white text-gray-700">
            <option value="all">Todos los estados</option>
            <option value="PAID">Cobrados</option>
            <option value="PENDING">Pendientes</option>
            <option value="PARTIAL">Parcial</option>
            <option value="CANCELLED">Cancelados</option>
          </select>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-gray-500">
              Total cobrado: <span className="font-semibold text-primary-600">{formatCurrency(totalCobrado)}</span>
            </span>
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
          </div>
        </div>
      </div>

      <Table aria-label="Tabla de pagos" removeWrapper
        classNames={{ th: "bg-gray-50 text-gray-600 text-xs font-medium", td: "py-3" }}>
        <TableHeader>
          {table.getHeaderGroups()[0].headers.map((h) => (
            <TableColumn key={h.id}>{h.column.columnDef.header as string}</TableColumn>
          ))}
        </TableHeader>
        <TableBody emptyContent="No hay pagos registrados">
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="hover:bg-gray-50 transition-colors">
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
        <span className="text-xs text-gray-400">{filtered.length} registros</span>
        <div className="flex items-center gap-1">
          <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <span className="text-xs text-gray-600 px-2">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
          </span>
          <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
}