import React, { useState, useEffect, useRef } from 'react';
import { useBranding } from '../contexts/BrandingContext';
import { supabase } from '../services/supabaseClient';
import { Branding } from '../types';
import { getContrastColor } from '../utils/colors';

interface ColorInputProps {
    label: string;
    name: keyof Omit<Branding, 'id' | 'logo_url'>;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ColorInput: React.FC<ColorInputProps> = ({ label, name, value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="mt-1 flex items-center gap-2">
            <input
                type="color"
                name={name}
                value={value}
                onChange={onChange}
                className="w-10 h-10 p-1 border-gray-300 rounded-md"
            />
            <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)] sm:text-sm"
            />
        </div>
    </div>
);

const BrandingAdmin: React.FC = () => {
  const { branding, updateBranding, refreshBranding } = useBranding();
  const [localBranding, setLocalBranding] = useState(branding);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(branding.logo_url || null);
  const objectUrlRef = useRef<string | null>(null);
  const [uploadErrorMsg, setUploadErrorMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const lastFileRef = useRef<File | null>(null);

  const primaryButtonTextColor = getContrastColor(localBranding.primary_color);

  useEffect(() => {
    setLocalBranding(branding);
  }, [branding]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalBranding({ ...localBranding, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  lastFileRef.current = file;
    const fileName = `${Date.now()}_${file.name}`;
    // show immediate local preview while upload runs
    try {
      // revoke previous object URL if any
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      const localPreview = URL.createObjectURL(file);
      objectUrlRef.current = localPreview;
      setPreviewUrl(localPreview);
    } catch (err) {
      // ignore preview creation errors
      console.debug('Could not create local preview', err);
    }
    try {
      setUploading(true);
      setUploadErrorMsg(null);
  const bucket = 'logo-image';
      const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);
      if (uploadError) {
        console.error('Logo upload error', uploadError);
        // Keep local preview and show actionable message to the admin
        setUploadErrorMsg(
          `Error al subir el logo: ${uploadError.message || uploadError.name || 'Error desconocido'}. ` +
            `Comprueba que el bucket '${bucket}' exista en Supabase Storage o usa otro nombre.`
        );
        // keep local preview even when upload fails
        setUploading(false);
        return;
      }
      // clear previous upload errors
      setUploadErrorMsg(null);
      const { data: publicData } = await supabase.storage.from(bucket).getPublicUrl(fileName);
      const publicUrl = (publicData as any)?.publicUrl ?? (publicData as any)?.data?.publicUrl ?? null;
      if (publicUrl) {
        // replace preview with the public URL from storage
        setLocalBranding({ ...localBranding, logo_url: publicUrl });
        // revoke local object url if it exists (we now use the public url)
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }
        setPreviewUrl(publicUrl);
        setUploading(false);
      } else {
        setUploadErrorMsg('Logo subido, pero no se pudo obtener la URL pública. Revisa el dashboard de Supabase.');
        setUploading(false);
      }
    } catch (err: any) {
      console.error('Failed to upload logo', err);
      setUploadErrorMsg(`Error inesperado al subir el logo: ${err?.message ?? String(err)}`);
      setUploading(false);
    }
  };

  const retryUpload = async () => {
    const file = lastFileRef.current;
    if (!file) return;
    // reuse existing upload logic by calling handleFileChange-like flow
    const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
    await handleFileChange(fakeEvent);
  };

  const clearPreview = () => {
    if (objectUrlRef.current) {
      try {
        URL.revokeObjectURL(objectUrlRef.current);
      } catch {}
      objectUrlRef.current = null;
    }
    lastFileRef.current = null;
    setPreviewUrl(localBranding.logo_url || null);
    setUploadErrorMsg(null);
  };

  // If user manually edits/pastes the logo_url input, reflect it in the preview
  useEffect(() => {
    setPreviewUrl(localBranding.logo_url || null);
  }, [localBranding.logo_url]);

  // cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const handleSave = async () => {
    // Prevent saving only while an upload is pending. If upload failed, allow saving so admin can persist other changes.
    if (uploading) {
      setUploadErrorMsg('La imagen aún se está subiendo. Espera a que finalice la subida o reintenta.');
      return;
    }
    // If we have a local object URL and no upload error, block saving because the image wasn't persisted.
    if (objectUrlRef.current && !uploadErrorMsg) {
      setUploadErrorMsg('La imagen aún no se ha subido. Espera a que finalice la subida o reintenta.');
      return;
    }
    setIsSaving(true);
    setSaveSuccess(false);
    const { logo_url, primary_color, secondary_color, accent_color, text_color } = localBranding;
    const { error } = await updateBranding({ logo_url, primary_color, secondary_color, accent_color, text_color });
    setIsSaving(false);
    if (!error) {
        // Ensure global branding is refreshed so header and other components reflect the saved logo
        try {
          await refreshBranding();
        } catch (e) {
          // ignore refresh errors, still show success
        }
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    } else {
        alert('Error al guardar los cambios.');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-[var(--color-text)]">Personalización de Marca</h2>
      <div className="space-y-6 max-w-lg">
        <div>
      <label className="block text-sm font-medium text-gray-700">Logo</label>
      <div className="mt-1 flex items-center gap-4">
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <input
          type="text"
          name="logo_url"
          value={localBranding.logo_url}
          onChange={handleChange}
          placeholder="O pega una URL directa"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)] sm:text-sm"
        />
      </div>
      {uploadErrorMsg && (
        <div className="mt-2 p-2 border border-red-200 bg-red-50 rounded text-sm text-red-700">
          <div className="mb-2">{uploadErrorMsg}</div>
          <div className="flex gap-2">
            <button
              onClick={retryUpload}
              className="px-3 py-1 bg-[var(--color-primary)] rounded disabled:opacity-60"
              disabled={uploading}
              style={{ color: primaryButtonTextColor }}
            >
              Reintentar
            </button>
            <button
              onClick={clearPreview}
              className="px-3 py-1 border rounded"
            >
              Limpiar preview
            </button>
          </div>
        </div>
      )}
      {/* preview */}
      <div className="mt-3">
        {previewUrl ? (
          <img src={previewUrl} alt="Vista previa del logo" className="h-20 w-40 object-contain rounded-md border" />
        ) : (
          <div className="h-20 w-40 bg-gray-100 rounded-md flex items-center justify-center text-sm text-gray-400 border">No hay logo</div>
        )}
      </div>
        </div>
        
        <ColorInput label="Color Primario (Botones, Links)" name="primary_color" value={localBranding.primary_color} onChange={handleChange} />
        <ColorInput label="Color Secundario (Fondos)" name="secondary_color" value={localBranding.secondary_color} onChange={handleChange} />
        <ColorInput label="Color de Acento (Notificaciones)" name="accent_color" value={localBranding.accent_color} onChange={handleChange} />
        <ColorInput label="Color del Texto Principal" name="text_color" value={localBranding.text_color} onChange={handleChange} />

        <div className="flex items-center gap-4">
            <button
                onClick={handleSave}
                disabled={isSaving || uploading}
                className="px-6 py-2 bg-[var(--color-primary)] rounded-md shadow-sm hover:opacity-90 disabled:bg-gray-400"
                style={{ color: primaryButtonTextColor }}
            >
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            {saveSuccess && <span className="text-green-600">¡Guardado con éxito!</span>}
        </div>
      </div>
    </div>
  );
};

export default BrandingAdmin;
