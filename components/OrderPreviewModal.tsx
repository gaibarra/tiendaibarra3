import React, { useCallback, useState, useEffect } from 'react';
import { useShop } from '../contexts/ShopContext';
import { generatePdf, openPdfPreview } from '../services/pdfService';
import { sendWhatsAppOrder } from '../services/whatsappService';
import { DownloadIcon, WhatsAppIcon } from './Icons';

interface OrderPreviewModalProps {
  onClose: () => void;
}

const OrderPreviewModal: React.FC<OrderPreviewModalProps> = ({ onClose }) => {
  const { cart, cartTotal, companyInfo, addOrder, clearCart } = useShop();
  // Ya no mantenemos iframe interno ni estado de carga

  // Genera previsualización automática cuando se abre el modal (y hay companyInfo)
  // Solo limpiar URL cuando se desmonta el modal
  // Sin efecto de limpieza porque no generamos ObjectURL persistente

  const handleDownloadPdf = useCallback(() => {
    if (!companyInfo) return;
    generatePdf('pdf-content', `pedido-${companyInfo.name.replace(/\s/g, '_')}`);
  }, [companyInfo]);

  const handlePreview = useCallback(() => {
    if (!companyInfo) return;
    openPdfPreview('pdf-content', `pedido-${companyInfo.name.replace(/\s/g, '_')}`);
  }, [companyInfo]);

  const handleSendOrder = useCallback(async () => {
    if (!companyInfo) return;
    try {
      await sendWhatsAppOrder(cart, cartTotal, companyInfo);
    } catch (e) {
      console.error('Failed to prepare WhatsApp message', e);
      // continue to attempt saving the order even if WhatsApp prep fails
    }

    try {
      await addOrder({ items: cart, total: cartTotal });
      clearCart();
      onClose();
    } catch (error) {
      console.error("Failed to save order", error);
      alert("Hubo un error al guardar tu pedido. Por favor, contacta directamente a la tienda.");
    }
  }, [cart, cartTotal, companyInfo, addOrder, clearCart, onClose]);
  
  if (!companyInfo) {
    return (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg p-8">Cargando...</div>
       </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold">Resumen del Pedido</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
        </div>
        
    <div className="overflow-y-auto p-6" id="pdf-content">
      <div className="p-8 border border-gray-100 rounded-md bg-white shadow-sm">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{companyInfo.name}</h1>
                        <p className="text-sm text-gray-500">{companyInfo.address}</p>
                        <p className="text-sm text-gray-500">{companyInfo.email} | {companyInfo.phone}</p>
                    </div>
                    <div>
                        <p className="text-lg font-semibold">PEDIDO</p>
                        <p className="text-sm text-gray-500">Fecha: {new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                <table className="w-full text-left table-auto">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="px-4 py-2 font-semibold">Producto</th>
                            <th className="px-4 py-2 font-semibold text-center">Cant.</th>
                            <th className="px-4 py-2 font-semibold text-right">Precio Unit.</th>
                            <th className="px-4 py-2 font-semibold text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cart.map(item => (
                             <tr key={`${item.productId}-${item.variantId}`} className="border-b">
                                <td className="px-4 py-2">{item.name} <span className="text-gray-500 text-sm">({item.variantName})</span></td>
                                <td className="px-4 py-2 text-center">{item.quantity}</td>
                                <td className="px-4 py-2 text-right">${item.price.toFixed(2)}</td>
                                <td className="px-4 py-2 text-right">${(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end mt-8">
                    <div className="w-full max-w-xs">
                        <div className="flex justify-between font-bold text-xl text-gray-800">
                            <span>TOTAL:</span>
                            <span>${cartTotal.toFixed(2)}</span>
                        </div>
                        <p className="text-right text-xs text-gray-500 mt-2">Pago contra entrega.</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="p-4 border-t bg-gray-50">
            <p className="text-sm text-center text-gray-600 mb-4">Abre la vista previa (puedes imprimir o descargar ahí) o descarga directo.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={handlePreview} className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                Abrir Vista Previa
              </button>
              <button onClick={handleDownloadPdf} className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                <DownloadIcon /> Descargar PDF
              </button>
              <button onClick={handleSendOrder} className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600">
                <WhatsAppIcon /> Enviar y Guardar Pedido
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPreviewModal;
