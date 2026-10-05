import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import { useRefresh } from "./shared";

export function useInvoices() {
  return useQuery(orpc.invoices.list.queryOptions());
}

export function useInvoice(id: string) {
  return useQuery(orpc.invoices.get.queryOptions({ input: { id }, enabled: !!id }));
}

export function usePayments() {
  return useQuery(orpc.invoices.payments.queryOptions());
}

function useInvoiceMutation<T>(factory: (opts: { onSuccess: () => void }) => T) {
  const qc = useQueryClient();
  const refresh = useRefresh();
  return factory({
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orpc.invoices.key() });
      refresh();
    },
  });
}

export function useCreateInvoice() {
  return useMutation(useInvoiceMutation((o) => orpc.invoices.create.mutationOptions(o)));
}
export function useUpdateInvoice() {
  return useMutation(useInvoiceMutation((o) => orpc.invoices.update.mutationOptions(o)));
}
export function useSetInvoiceStatus() {
  return useMutation(useInvoiceMutation((o) => orpc.invoices.setStatus.mutationOptions(o)));
}
export function useDeleteInvoice() {
  return useMutation(useInvoiceMutation((o) => orpc.invoices.remove.mutationOptions(o)));
}
export function useDuplicateInvoice() {
  return useMutation(useInvoiceMutation((o) => orpc.invoices.duplicate.mutationOptions(o)));
}
export function useAddPayment() {
  return useMutation(useInvoiceMutation((o) => orpc.invoices.addPayment.mutationOptions(o)));
}
