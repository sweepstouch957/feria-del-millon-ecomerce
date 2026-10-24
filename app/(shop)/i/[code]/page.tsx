"use client";

import { useParams } from "next/navigation";
import InvitationClient from "@components/views/invitation/InvitationClient";

/** Enlace corto público de registro de invitados: /i/fdm26 */
export default function InviteLinkPage() {
  const { code } = useParams<{ code: string }>();
  return <InvitationClient linkCode={code} />;
}
