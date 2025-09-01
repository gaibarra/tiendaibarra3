import React, { useState, useEffect } from 'react';
import { useShop } from '../contexts/ShopContext';
import { CompanyInfo } from '../types';

interface InputFieldProps {
    label: string;
    name: keyof Omit<CompanyInfo, 'id'>;
    value: string;
    type?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputField: React.FC<InputFieldProps> = ({ label, name, value, type="text", onChange }) => (
     <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        <input
            type={type}
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)] sm:text-sm"
        />
    </div>
);


const CompanyInfoAdmin: React.FC = () => {
    const { companyInfo, updateCompanyInfo } = useShop();
    const [localInfo, setLocalInfo] = useState(companyInfo);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        setLocalInfo(companyInfo);
    }, [companyInfo]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!localInfo) return;
        setLocalInfo({ ...localInfo, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        if (!localInfo) return;
        setIsSaving(true);
        setSaveSuccess(false);
        const { name, address, phone, email } = localInfo;
        const { error } = await updateCompanyInfo({ name, address, phone, email });
        setIsSaving(false);
        if (!error) {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } else {
            alert('Error al guardar la información.');
        }
    };

    if (!localInfo) {
        return <p>Cargando información de la empresa...</p>
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Información de la Empresa</h2>
            <div className="space-y-4 max-w-lg">
                <InputField label="Nombre de la Empresa" name="name" value={localInfo.name} onChange={handleChange} />
                <InputField label="Dirección" name="address" value={localInfo.address} onChange={handleChange} />
                <InputField label="Teléfono (solo números, para WhatsApp)" name="phone" value={localInfo.phone} onChange={handleChange} />
                <InputField label="Email de Contacto" name="email" value={localInfo.email} type="email" onChange={handleChange} />
                
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-md shadow-sm hover:opacity-90 disabled:bg-gray-400"
                    >
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                    {saveSuccess && <span className="text-green-600">¡Guardado con éxito!</span>}
                </div>
            </div>
        </div>
    );
};

export default CompanyInfoAdmin;