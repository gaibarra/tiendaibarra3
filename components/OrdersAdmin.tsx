import React, { useState } from 'react';
import { useShop } from '../contexts/ShopContext';
import { Order } from '../types';
import { ChevronDownIcon } from './Icons';
import ConfirmModal from './ConfirmModal';

const OrdersAdmin: React.FC = () => {
    const { orders, confirmOrder, loading } = useShop();
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [orderToConfirm, setOrderToConfirm] = useState<string | null>(null);

    const handleConfirmRequest = (orderId: string) => {
        setOrderToConfirm(orderId);
    };

    const executeConfirm = async () => {
        if (!orderToConfirm) return;
        setConfirmingId(orderToConfirm);
        try {
            await confirmOrder(orderToConfirm);
        } catch (error) {
            console.error("Failed to confirm order", error);
            alert("Error al confirmar el pedido.");
        } finally {
            setConfirmingId(null);
            setOrderToConfirm(null);
        }
    };

    const toggleExpand = (orderId: string) => {
        setExpandedOrderId(prevId => (prevId === orderId ? null : orderId));
    };

    const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
        const isExpanded = expandedOrderId === order.id;

        return (
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200 transition-shadow hover:shadow-md">
                <div 
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => toggleExpand(order.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`order-details-${order.id}`}
                >
                    <div>
                        <p className="font-semibold text-gray-800">Pedido #{order.id.slice(-6)}</p>
                        <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                            {order.status === 'pending' ? 'Pendiente' : 'Confirmado'}
                        </span>
                        <ChevronDownIcon className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </div>
                
                <div 
                    id={`order-details-${order.id}`}
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[500px] pt-4 mt-4 border-t' : 'max-h-0'}`}
                >
                    <h4 className="text-md font-semibold text-gray-700 mb-2">Artículos del Pedido:</h4>
                    <ul className="divide-y divide-gray-100">
                        {order.order_items.map(item => (
                             <li key={item.id} className="py-3 flex justify-between items-start text-sm">
                                <div className="flex-grow">
                                    <p className="font-medium text-gray-800 flex items-center">
                                        <span className="inline-flex items-center justify-center w-6 h-6 mr-3 bg-indigo-100 text-[var(--color-primary)] text-xs font-bold rounded-full ring-2 ring-indigo-200">
                                            {item.quantity}
                                        </span>
                                        <span>{item.product_name}</span>
                                    </p>
                                    <p className="ml-9 text-gray-500">{item.variant_name}</p>
                                </div>
                                <div className="text-right flex-shrink-0 ml-4">
                                    <p className="text-gray-600">${item.price.toFixed(2)} c/u</p>
                                    <p className="font-medium text-gray-800">${(item.quantity * item.price).toFixed(2)}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                         <p className="font-bold text-lg">Total: ${order.total.toFixed(2)}</p>
                         {order.status === 'pending' && (
                             <button 
                                onClick={() => handleConfirmRequest(order.id)} 
                                disabled={confirmingId === order.id}
                                className="px-3 py-2 bg-[var(--color-primary)] text-white text-sm font-medium rounded-md hover:opacity-90 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)]">
                                 {confirmingId === order.id ? 'Confirmando...' : 'Confirmar y Descontar Stock'}
                             </button>
                         )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Gestión de Pedidos</h2>
            {loading ? <p>Cargando pedidos...</p> :
            orders.length === 0 ? (
                <p className="text-gray-500">No hay pedidos todavía.</p>
            ) : (
                <div className="space-y-4">
                    {orders.map(order => <OrderCard key={order.id} order={order} />)}
                </div>
            )}
            <ConfirmModal
                isOpen={!!orderToConfirm}
                onClose={() => setOrderToConfirm(null)}
                onConfirm={executeConfirm}
                title="Confirmar Pedido"
                message="¿Confirmar este pedido y descontar el inventario? Esta acción no se puede deshacer."
                confirmButtonText="Confirmar Pedido"
            />
        </div>
    );
};

export default OrdersAdmin;