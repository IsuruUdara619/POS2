import { get, post } from './api';

export interface WhatsAppStatus {
  isConnected: boolean;
  isInitializing: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasQRCode: boolean;
  qrCode?: string | null;
  lastConnectedAt: string | null;
  loadingProgress: number;
}

export const whatsappService = {
  getStatus: () => get('/whatsapp/status') as Promise<WhatsAppStatus>,
  
  initialize: () => post('/whatsapp/initialize', {}),
  
  disconnect: () => post('/whatsapp/disconnect', {}),
  
  sendInvoice: (phoneNumber: string, invoiceData: any) => 
    post('/whatsapp/send-invoice', { phoneNumber, invoiceData }),
};
