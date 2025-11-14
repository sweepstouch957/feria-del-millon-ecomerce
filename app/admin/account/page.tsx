// src/app/(artist)/mi-cuenta/MiCuentaClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@components/ui/tabs";
import { Separator } from "@components/ui/separator";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@components/ui/avatar";
import { Switch } from "@components/ui/switch";

import {
  Loader2,
  User as UserIcon,
  Camera,
  Mail,
  Phone,
  MapPin,
  IdCard,
  Globe,
  Instagram,
  Facebook as FacebookIcon,
  Save,
} from "lucide-react";

import { toast } from "sonner";
import { useAuth } from "@provider/authProvider";
import { useUser, useUpdateUser } from "@hooks/queries/useUser";
import type {
  DocumentType,
  UpdateUserPayload,
} from "@services/users.service";
import { uploadCampaignImage as uploadProfileImage } from "@services/upload.service"; // renómbralo si tienes otro servicio

// ─────────────────────────────────────────────────────────────
// Esquema de validación
// ─────────────────────────────────────────────────────────────

const documentTypes: DocumentType[] = ["CC", "NIT", "CE", "PP", "OTRO", "INE"];

const ProfileFormSchema = z.object({
  firstName: z.string().max(120).optional().or(z.literal("")),
  lastName: z.string().max(120).optional().or(z.literal("")),
  email: z.string().email("Email inválido"),
  mobile: z.string().max(50).optional().or(z.literal("")),
  image: z.string().url("URL de imagen inválida").optional().or(z.literal("")),
  documentType: z
    .enum(documentTypes as [DocumentType, ...DocumentType[]])
    .optional()
    .or(z.literal("").transform(() => undefined)),
  documentNumber: z.string().max(80).optional().or(z.literal("")),
  city: z.string().max(120).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  instagram: z.string().max(120).optional().or(z.literal("")),
  facebook: z.string().max(120).optional().or(z.literal("")),
  website: z.string().max(200).optional().or(z.literal("")),
  active: z.boolean().optional(),
});

type ProfileFormValues = z.infer<typeof ProfileFormSchema>;

// Helper para iniciales
const getInitials = (name?: string, last?: string) => {
  if (!name && !last) return "AR";
  const n = (name || "").trim();
  const l = (last || "").trim();
  return `${n[0] ?? ""}${l[0] ?? ""}`.toUpperCase() || "AR";
};

// Helper para roles bonitos
const roleLabels: Record<string, string> = {
  superuser: "Superuser",
  staff: "Staff",
  curador: "Curador",
  cajero: "Cajero",
  artista: "Artista",
};

export default function MiCuentaClient() {
  const { user, isAuthLoading, isAuthenticated } = useAuth();
  const userId = user?.id || user?._id;

  const {
    data: userDoc,
    isLoading: userLoading,
    isFetching: userFetching,
  } = useUser(userId);

  const updateUser = useUpdateUser(userId || "");

  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | undefined>();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      mobile: "",
      image: "",
      documentType: "CC",
      documentNumber: "",
      city: "",
      address: "",
      instagram: "",
      facebook: "",
      website: "",
      active: true,
    },
  });

  // Reset form cuando llega el user
  useEffect(() => {
    if (!userDoc) return;
    form.reset({
      firstName: userDoc.firstName || "",
      lastName: userDoc.lastName || "",
      email: userDoc.email || "",
      mobile: userDoc.mobile || "",
      image: userDoc.image || "",
      documentType: (userDoc.documentType as DocumentType) || "CC",
      documentNumber: userDoc.documentNumber || "",
      city: userDoc.city || "",
      address: userDoc.address || "",
      instagram: userDoc.instagram || "",
      facebook: userDoc.facebook || "",
      website: userDoc.website || "",
      active: userDoc.active ?? true,
    });
    setPreviewImage(userDoc.image);
  }, [userDoc, form]);

  const isSaving = updateUser.isPending;

  const rolesBadges = useMemo(() => {
    if (!userDoc?.roles) return [];
    return Object.entries(userDoc.roles)
      .filter(([_, v]) => v)
      .map(([k]) => roleLabels[k] || k);
  }, [userDoc?.roles]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!userId) return;

    const payload: UpdateUserPayload = {
      firstName: values.firstName || undefined,
      lastName: values.lastName || undefined,
      email: values.email,
      mobile: values.mobile || undefined,
      image: values.image || undefined,
      documentType: values.documentType,
      documentNumber: values.documentNumber || undefined,
      city: values.city || undefined,
      address: values.address || undefined,
      instagram: values.instagram || undefined,
      facebook: values.facebook || undefined,
      website: values.website || undefined,
      active: values.active ?? true,
    };

    try {
      await updateUser.mutateAsync(payload);
      toast.success("Perfil actualizado correctamente");
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "No se pudo actualizar el perfil";
      toast.error(msg);
    }
  };

  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const localPreview = URL.createObjectURL(file);
      setPreviewImage(localPreview);

      // Subida real
      const url = await uploadProfileImage(file);


      form.setValue("image", url.url, { shouldDirty: true, shouldValidate: true });
      setPreviewImage(url.url);
      toast.success("Imagen subida correctamente");
    } catch (err: any) {
      console.error(err);
      toast.error("Error al subir la imagen");
    } finally {
      setUploadingImage(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-gray-600">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Cargando sesión…
      </div>
    );
  }

  if (!isAuthenticated || !userId) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-gray-600">
        Debes iniciar sesión para acceder a tu cuenta.
      </div>
    );
  }

  if (userLoading && !userDoc) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-gray-600">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Cargando tu perfil…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              Mi cuenta
            </h1>
            <p className="text-gray-600">
              Gestiona tu perfil de artista y tus datos de contacto.
            </p>
          </div>
          <Button
            type="submit"
            form="artist-profile-form"
            disabled={isSaving}
            className="h-10"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando…
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar cambios
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList
            className="
              inline-flex w-full md:w-auto items-center justify-start 
              rounded-xl border border-gray-200 bg-white p-1 gap-2
              shadow-sm
            "
          >
            <TabsTrigger
              value="profile"
              className="
                data-[state=active]:bg-gray-900 data-[state=active]:text-white
                data-[state=inactive]:text-gray-700
                px-4 py-2 rounded-lg text-sm font-medium
                transition-colors flex items-center gap-2
                hover:bg-gray-100 data-[state=active]:hover:bg-gray-800
              "
            >
              <UserIcon className="w-4 h-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger
              value="social"
              className="
                data-[state=active]:bg-gray-900 data-[state=active]:text-white
                data-[state=inactive]:text-gray-700
                px-4 py-2 rounded-lg text-sm font-medium
                transition-colors flex items-center gap-2
                hover:bg-gray-100 data-[state=active]:hover:bg-gray-800
              "
            >
              <Globe className="w-4 h-4" />
              Redes y web
            </TabsTrigger>
          </TabsList>

          {/* Contenedor principal */}
          <div
            className="
              bg-white border border-gray-100 rounded-2xl 
              shadow-sm p-6 md:p-8
              grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]
            "
          >
            {/* Columna izquierda: Avatar + resumen */}
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="relative">
                  <Avatar className="w-28 h-28 border-2 border-gray-200 shadow-sm">
                    {previewImage && (
                      <AvatarImage  className="" src={previewImage} alt="Foto de perfil" />
                    )}
                    <AvatarFallback className="bg-gray-100 text-gray-700 text-2xl font-semibold">
                      {getInitials(userDoc?.firstName, userDoc?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="profile-image-input"
                    className="
                      absolute -bottom-2 -right-2
                      inline-flex items-center justify-center
                      w-9 h-9 rounded-full bg-gray-900 text-white
                      border border-white shadow-md cursor-pointer
                      hover:bg-gray-800
                      transition-colors
                    "
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                    <input
                      id="profile-image-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageFileChange}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl font-semibold tracking-tight">
                    {userDoc?.firstName || userDoc?.lastName
                      ? `${userDoc?.firstName ?? ""} ${
                          userDoc?.lastName ?? ""
                        }`.trim()
                      : "Artista sin nombre"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {userDoc?.email || "Sin correo"}
                  </p>
                </div>

                {rolesBadges.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {rolesBadges.map((r) => (
                      <span
                        key={r}
                        className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{userDoc?.email}</span>
                </div>
                {userDoc?.mobile && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{userDoc.mobile}</span>
                  </div>
                )}
                {userDoc?.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{userDoc.city}</span>
                  </div>
                )}
                {userDoc?.documentNumber && (
                  <div className="flex items-center gap-2">
                    <IdCard className="w-4 h-4 text-gray-400" />
                    <span>
                      {userDoc.documentType ?? "CC"} ·{" "}
                      {userDoc.documentNumber}
                    </span>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">
                    Cuenta activa
                  </p>
                  <p className="text-xs text-gray-500">
                    Si la desactivas, tu perfil podría dejar de mostrarse
                    públicamente.
                  </p>
                </div>
                <Switch
                className={""}
                  checked={form.watch("active") ?? true}
                  onCheckedChange={(value) =>
                    form.setValue("active", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
              </div>
            </div>

            {/* Columna derecha: formulario tabs */}
            <form
              id="artist-profile-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <TabsContent
                value="profile"
                className="space-y-6 data-[state=inactive]:hidden"
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className={""} htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      placeholder="Tu nombre"
                      {...form.register("firstName")}
                    />
                    {form.formState.errors.firstName && (
                      <p className="text-xs text-red-500">
                        {form.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className={""} htmlFor="lastName">Apellidos</Label>
                    <Input
                      id="lastName"
                      placeholder="Tus apellidos"
                      {...form.register("lastName")}
                    />
                    {form.formState.errors.lastName && (
                      <p className="text-xs text-red-500">
                        {form.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className={""} htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@correo.com"
                    {...form.register("email")}
                  />
                  {form.formState.errors.email && (
                    <p className="text-xs text-red-500">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className={""} htmlFor="mobile">Teléfono</Label>
                  <Input
                    id="mobile"
                    placeholder="+57 ..."
                    {...form.register("mobile")}
                  />
                  {form.formState.errors.mobile && (
                    <p className="text-xs text-red-500">
                      {form.formState.errors.mobile.message}
                    </p>
                  )}
                </div>

                <Separator className={""} />

                <div className="grid md:grid-cols-[1fr_2fr] gap-4">
                  <div className="space-y-1.5">
                    <Label className={""} htmlFor="documentType">Tipo de documento</Label>
                    <select
                      id="documentType"
                      className="h-10 px-3 py-2 rounded-md border bg-white text-sm"
                      value={form.watch("documentType") || "CC"}
                      onChange={(e) =>
                        form.setValue(
                          "documentType",
                          e.target.value as DocumentType,
                          {
                            shouldDirty: true,
                            shouldValidate: true,
                          }
                        )
                      }
                    >
                      {documentTypes.map((dt) => (
                        <option key={dt} value={dt}>
                          {dt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className={""} htmlFor="documentNumber">Número de documento</Label>
                    <Input
                      id="documentNumber"
                      placeholder="Documento"
                      {...form.register("documentNumber")}
                    />
                    {form.formState.errors.documentNumber && (
                      <p className="text-xs text-red-500">
                        {form.formState.errors.documentNumber.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className={""} htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      placeholder="Ciudad"
                      {...form.register("city")}
                    />
                    {form.formState.errors.city && (
                      <p className="text-xs text-red-500">
                        {form.formState.errors.city.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className={""} htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      placeholder="Dirección"
                      {...form.register("address")}
                    />
                    {form.formState.errors.address && (
                      <p className="text-xs text-red-500">
                        {form.formState.errors.address.message}
                      </p>
                    )}
                  </div>
                </div>

                <Separator className={""} />

                <div className="space-y-1.5">
                  <Label className={""} htmlFor="image">URL de imagen (opcional)</Label>
                  <Input
                    id="image"
                    placeholder="https://..."
                    {...form.register("image")}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v) setPreviewImage(v);
                    }}
                  />
                  {form.formState.errors.image && (
                    <p className="text-xs text-red-500">
                      {form.formState.errors.image.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Puedes pegar una URL de imagen si ya la tienes alojada, o
                    subir una desde el botón de cámara sobre el avatar.
                  </p>
                </div>
              </TabsContent>

              <TabsContent
                value="social"
                className="space-y-6 data-[state=inactive]:hidden"
              >
                <div className="space-y-1.5">
                  <Label className={""} htmlFor="website">Sitio web</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Globe className="w-4 h-4" />
                    </span>
                    <Input
                      id="website"
                      placeholder="https://tusitio.com"
                      className="pl-9"
                      {...form.register("website")}
                    />
                  </div>
                  {form.formState.errors.website && (
                    <p className="text-xs text-red-500">
                      {form.formState.errors.website.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label  className={""} htmlFor="instagram">Instagram</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Instagram className="w-4 h-4" />
                    </span>
                    <Input
                      id="instagram"
                      placeholder="@tuusuario"
                      className="pl-9"
                      {...form.register("instagram")}
                    />
                  </div>
                  {form.formState.errors.instagram && (
                    <p className="text-xs text-red-500">
                      {form.formState.errors.instagram.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className={""} htmlFor="facebook">Facebook</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <FacebookIcon className="w-4 h-4" />
                    </span>
                    <Input
                      id="facebook"
                      placeholder="Perfil o página"
                      className="pl-9"
                      {...form.register("facebook")}
                    />
                  </div>
                  {form.formState.errors.facebook && (
                    <p className="text-xs text-red-500">
                      {form.formState.errors.facebook.message}
                    </p>
                  )}
                </div>
              </TabsContent>
            </form>
          </div>

          {/* Pequeño indicador de loading si está refetching */}
          {userFetching && (
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Actualizando datos…
            </div>
          )}
        </Tabs>
      </div>
    </div>
  );
}
