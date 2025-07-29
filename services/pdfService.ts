
// This assumes pdf.js is loaded from a CDN and available on the window object.
declare const pdfjsLib: any;

/**
 * Extracts all text content from a given PDF file.
 * @param file The PDF file to process.
 * @param onProgress A callback function to report progress (percentage, current page, total pages).
 * @returns A promise that resolves to the full text content of the PDF.
 */
export const extractTextFromPdf = async (
  file: File,
  onProgress: (progress: number, currentPage: number, totalPages: number) => void
): Promise<string> => {
  const fileReader = new FileReader();

  return new Promise((resolve, reject) => {
    fileReader.onload = async (event) => {
      if (!event.target?.result) {
        return reject(new Error('Failed to read file.'));
      }

      try {
        const loadingTask = pdfjsLib.getDocument({ data: event.target.result });
        const pdf = await loadingTask.promise;
        const totalPages = pdf.numPages;
        let fullText = '';

        onProgress(0, 0, totalPages);

        for (let i = 1; i <= totalPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n\n';
          
          const progress = Math.round((i / totalPages) * 100);
          onProgress(progress, i, totalPages);
        }

        resolve(fullText);
      } catch (error) {
        console.error('Error parsing PDF:', error);
        if (error instanceof Error && error.name === 'PasswordException') {
            reject(new Error('Could not open PDF. The file is password-protected.'));
        } else {
            reject(new Error('Failed to parse the PDF file. It might be corrupted or in an unsupported format.'));
        }
      }
    };

    fileReader.onerror = () => {
      reject(new Error('Error reading the file.'));
    };

    fileReader.readAsArrayBuffer(file);
  });
};
