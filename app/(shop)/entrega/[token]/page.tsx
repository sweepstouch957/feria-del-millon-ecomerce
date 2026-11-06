"use client";

import { useParams } from "next/navigation";
import DeliveryClient from "@components/views/delivery/DeliveryClient";

export default function DeliveryPage() {
  const { token } = useParams<{ token: string }>();
  return <DeliveryClient token={token} />;
}
