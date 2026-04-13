"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listTechniques } from "@services/techniques.service";
import {
  getMyApplications,
  updateApplication,
  submitApplication,
  type ArtworkImageEntry,
  type ArtistApplication,
} from "@services/applications.service";

type Step = 0 | 1 | 2 | 3 | 4;

/**
 * Encapsulates ALL wizard state, queries, and mutations for the
 * convocatoria application form.
 *
 * This keeps the UI component thin and makes the logic independently testable.
 */
export function useApplicationWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appId = searchParams.get("appId");
  const queryClient = useQueryClient();

  // ── Step navigation ─────────────────────────────────────────────────
  const [step, setStep] = useState<Step>(0);

  // ── Application doc ─────────────────────────────────────────────────
  const [appDoc, setAppDoc] = useState<ArtistApplication | null>(null);

  // ── UI feedback ─────────────────────────────────────────────────────
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── Form fields ─────────────────────────────────────────────────────
  const [bio, setBio] = useState("");
  const [cvUrl, setCvUrl] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [projectReview, setProjectReview] = useState("");
  const [artworkImages, setArtworkImages] = useState<ArtworkImageEntry[]>([]);
  const [detailImageUrl, setDetailImageUrl] = useState("");
  const [montageImageUrl, setMontageImageUrl] = useState("");

  // ── Queries ─────────────────────────────────────────────────────────
  const { data: apps, isLoading } = useQuery({
    queryKey: ["my-applications"],
    queryFn: getMyApplications,
  });

  const { data: techniques = [] } = useQuery({
    queryKey: ["techniques"],
    queryFn: listTechniques,
    staleTime: 1000 * 60 * 30,
  });

  // ── Sync server state → local form ─────────────────────────────────
  useEffect(() => {
    if (!apps) return;
    const current = appId ? apps.find((a) => a._id === appId) : apps[0];
    if (!current) return;

    setAppDoc(current as ArtistApplication);
    setBio(current.bio || "");
    setCvUrl(current.cvUrl || "");
    setProfilePhotoUrl(current.profilePhotoUrl || "");
    setProjectReview(current.projectReview || "");
    setArtworkImages(current.artworkImages || []);
    setDetailImageUrl(current.detailImageUrl || "");
    setMontageImageUrl(current.montageImageUrl || "");

    // Only advance step if paid
    if (current.isPaid) {
      if (current.bio || current.cvUrl) setStep(2);
      else setStep(1);
    }
  }, [apps, appId]);

  // ── Mutations ───────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (variables: {
      id: string;
      payload: Partial<ArtistApplication>;
    }) => updateApplication(variables.id, variables.payload),
    onSuccess: (updated) => {
      setAppDoc(updated as unknown as ArtistApplication);
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
    },
    onError: (e: any) => {
      setError(e?.response?.data?.error || e?.message || "Error al guardar");
    },
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => submitApplication(id),
    onSuccess: () => {
      setSuccess(
        "¡Tu postulación fue enviada exitosamente! Recibirás un email de confirmación."
      );
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
      router.push("/convocatoria/mi-solicitud");
    },
    onError: (e: any) => {
      setError(e?.response?.data?.error || e?.message || "Error al enviar");
    },
  });

  // ── Helpers ─────────────────────────────────────────────────────────
  const formPayload = {
    bio,
    cvUrl,
    profilePhotoUrl,
    projectReview,
    artworkImages,
    detailImageUrl,
    montageImageUrl,
  };

  const handleSave = async (nextStep: Step) => {
    if (!appDoc) return;
    setError("");
    await updateMutation.mutateAsync({ id: appDoc._id, payload: formPayload });
    setStep(nextStep);
  };

  const handleSubmit = async () => {
    if (!appDoc) return;
    setError("");
    await updateMutation.mutateAsync({ id: appDoc._id, payload: formPayload });
    await submitMutation.mutateAsync(appDoc._id);
  };

  const addArtworkImage = () => {
    setArtworkImages((prev) => [
      ...prev,
      {
        url: "",
        title: "",
        technique: "",
        dimensions: "",
        year: undefined,
        price: undefined,
        role: "project",
      },
    ]);
  };

  const updateImage = (
    i: number,
    field: keyof ArtworkImageEntry,
    value: string | number
  ) => {
    setArtworkImages((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const removeImage = (i: number) => {
    setArtworkImages((prev) => prev.filter((_, idx) => idx !== i));
  };

  return {
    // Navigation
    step,
    setStep,
    router,

    // Data
    appDoc,
    techniques,
    isLoading,

    // Form fields
    bio,
    setBio,
    cvUrl,
    setCvUrl,
    profilePhotoUrl,
    setProfilePhotoUrl,
    projectReview,
    setProjectReview,
    artworkImages,
    detailImageUrl,
    setDetailImageUrl,
    montageImageUrl,
    setMontageImageUrl,

    // Artwork image helpers
    addArtworkImage,
    updateImage,
    removeImage,

    // Actions
    handleSave,
    handleSubmit,

    // UI
    error,
    success,
    isSaving: updateMutation.isPending,
    isSubmitting: submitMutation.isPending,
  };
}
