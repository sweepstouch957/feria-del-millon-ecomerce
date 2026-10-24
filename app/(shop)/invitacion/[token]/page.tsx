"use client";

import { useParams } from "next/navigation";
import InvitationClient from "@components/views/invitation/InvitationClient";

export default function InvitationPage() {
  const { token } = useParams<{ token: string }>();
  return <InvitationClient token={token} />;
}
