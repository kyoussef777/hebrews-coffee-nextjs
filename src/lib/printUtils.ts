/**
 * Shared utility functions for printing order labels
 */

/**
 * Prints an order label with popup and auto-close functionality
 * @param orderId - The order ID to print
 * @param orderNumber - Optional order number for filename
 * @param configId - Optional label configuration ID
 * @param setLoadingState - Optional function to set loading state
 * @returns Promise that resolves when print operation is initiated
 */
export const printOrderLabel = async (
  orderId: string,
  orderNumber?: number,
  configId?: string,
  setLoadingState?: (loading: boolean) => void
): Promise<void> => {
  try {
    if (setLoadingState) {
      setLoadingState(true);
    }
    
    // Build API URL with optional config parameter
    const apiUrl = configId && configId !== 'default' && configId !== 'app-default'
      ? `/api/orders/${orderId}/label?config=${configId}`
      : `/api/orders/${orderId}/label`;
    
    // Fetch the PDF and create a blob URL
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      // If it's a JSON error response, try to get the error message
      try {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to generate label');
      } catch {
        alert('Failed to generate label');
      }
      return;
    }
    
    // Get the PDF as a blob and create an object URL
    const blob = await response.blob();
    const pdfUrl = window.URL.createObjectURL(blob);
    
    // Open the PDF in a new popup window
    const printWindow = window.open(pdfUrl, '_blank', 'width=800,height=600');
    
    if (printWindow) {
      // Auto-close tracking variables
      let windowClosed = false;
      
      const cleanupAndClose = () => {
        if (windowClosed) return;
        windowClosed = true;
        
        try {
          if (!printWindow.closed) {
            printWindow.close();
          }
        } catch {
          console.log('Auto-close blocked by browser, window will remain open');
        }
        
        // Clean up the blob URL
        window.URL.revokeObjectURL(pdfUrl);
        
        // Focus back to main window
        window.focus();
      };
      
      // Wait for the PDF to load, then trigger print and auto-close
      printWindow.onload = () => {
        setTimeout(() => {
          try {
            printWindow.print();
            
            // Primary: Listen for afterprint event to close immediately after printing
            printWindow.addEventListener('afterprint', () => {
              setTimeout(() => {
                cleanupAndClose();
              }, 500);
            });
            
            // Secondary: 7-second timeout fallback to ensure print dialog has appeared
            setTimeout(() => {
              if (!windowClosed) {
                console.log('Print window auto-close after timeout');
                cleanupAndClose();
              }
            }, 7000);
            
            // Tertiary: Focus back to main window after a delay
            setTimeout(() => {
              if (!windowClosed) {
                window.focus();
              }
            }, 8000);
            
          } catch (error) {
            console.error('Error triggering print:', error);
            cleanupAndClose();
          }
        }, 1000);
      };
      
      // Handle case where onload doesn't fire (fallback)
      setTimeout(() => {
        if (!windowClosed && printWindow.document && printWindow.document.readyState === 'complete') {
          try {
            printWindow.print();
          } catch (error) {
            console.error('Error in fallback print trigger:', error);
          }
        }
      }, 2000);
      
    } else {
      // Fallback: create a temporary link for download if popup blocked
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = pdfUrl;
      a.download = `order-${orderNumber || orderId}-label.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up the blob URL
      setTimeout(() => {
        window.URL.revokeObjectURL(pdfUrl);
      }, 1000);
    }
    
  } catch (error) {
    console.error('Error printing label:', error);
    alert('Failed to print label');
  } finally {
    if (setLoadingState) {
      setLoadingState(false);
    }
  }
};