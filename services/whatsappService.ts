import { CartItem, CompanyInfo } from '../types';

export const sendWhatsAppOrder = async (
  cart: CartItem[],
  total: number,
  companyInfo: CompanyInfo | null
): Promise<void> => {
  if (!companyInfo) {
    console.error("Company info is not available to send WhatsApp order.");
    alert("No se pudo obtener la información de contacto de la tienda.");
    return;
  }

  let message = `¡Hola ${companyInfo.name}! 👋\n\nQuisiera hacer el siguiente pedido:\n\n`;

  for (const item of cart) {
    message += `*${item.name}* (${item.variantName})\n`;
  message += `   - Cantidad: ${item.quantity}\n`;
  message += `   - Precio unitario: $${item.price.toFixed(2)}\n`;
  message += `   - Total producto: $${(item.price * item.quantity).toFixed(2)}\n`;
    // if (item.description) {
    //   message += `   - Descripción: ${item.description}\n`;
    // }
    // message += `\n`;
  }

  message += `*Total del Pedido: $${total.toFixed(2)}*\n\n`;
  message += 'Quedo a la espera de la confirmación. ¡Gracias!';

  const encodedMessage = encodeURIComponent(message);
  // Note: using wa.me / whatsapp client prefill only supports text. Attaching media programmatically
  // requires the WhatsApp Business API. Here we include thumb/image URLs inline so recipients may
  // see or preview them. If you need true media attachments, integrate the Business API.
  const whatsappUrl = `https://wa.me/${companyInfo.phone}?text=${encodedMessage}`;

  window.open(whatsappUrl, '_blank');
};
