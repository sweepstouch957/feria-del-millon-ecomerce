"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listMyArtistOrders,
  setArtistItemDelivery,
  type ArtistOrder,
} from "@services/order.service";

export function useArtistOrders(enabled = true) {
  return useQuery<ArtistOrder[]>({
    queryKey: ["artist-orders"],
    queryFn: () => listMyArtistOrders(),
    enabled,
    staleTime: 30_000,
  });
}

export function useSetItemDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      itemId,
      deliveryStatus,
    }: {
      orderId: string;
      itemId: string;
      deliveryStatus: "pending" | "delivered" | "returned";
    }) => setArtistItemDelivery(orderId, itemId, deliveryStatus),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["artist-orders"] }),
  });
}
