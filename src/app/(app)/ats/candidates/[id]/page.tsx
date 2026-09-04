"use client";

import { useParams } from "next/navigation";
import { PersonProfilePage } from "@/components/recruitment/person-profile";

export default function CandidateProfileRoute() {
  const { id } = useParams<{ id: string }>();
  return <PersonProfilePage applicationId={id} />;
}
