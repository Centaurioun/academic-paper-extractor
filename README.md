# Academic Paper Extractor

A React application for extracting and analyzing academic papers using Google's Gemini AI. This tool allows users to upload PDF documents and extract key information such as abstracts, methodologies, results, and conclusions using advanced AI processing.

## Features

- 📄 PDF document upload and processing
- 🤖 AI-powered content extraction using Gemini AI
- 📊 Structured data presentation with collapsible sections
- 💾 Export functionality for extracted data
- 🎨 Modern, responsive user interface built with React and TypeScript

## Technology Stack

- **Frontend**: React 19.1.1 with TypeScript
- **Build Tool**: Vite 6.2.0
- **AI Integration**: Google Gemini AI (@google/genai)
- **Styling**: Modern CSS with responsive design

## Prerequisites

- Node.js (version 18 or higher recommended)
- A Google Gemini API key

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Centaurioun/academic-paper-extractor.git
   cd academic-paper-extractor
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Create a `.env.local` file in the root directory
   - Add your Gemini API key:
     ```
     GEMINI_API_KEY=your_gemini_api_key_here
     ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   - Navigate to `http://localhost:5173` (or the port shown in your terminal)

## Usage

1. **Upload a PDF**: Click the upload area and select an academic paper in PDF format
2. **AI Processing**: The application will automatically process the document using Gemini AI
3. **View Results**: Extracted information will be displayed in organized sections
4. **Export Data**: Use the export buttons to save the extracted data in your preferred format

## Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally

## Project Structure

```
├── components/           # React components
│   ├── Accordion.tsx    # Collapsible content sections
│   ├── ExportButtons.tsx # Data export functionality
│   ├── FileList.tsx     # File management interface
│   ├── FileUpload.tsx   # PDF upload component
│   ├── icons.tsx        # Icon components
│   └── ResultsDisplay.tsx # Extracted data presentation
├── services/            # Service layer
│   ├── geminiService.ts # Gemini AI integration
│   └── pdfService.ts    # PDF processing utilities
├── App.tsx             # Main application component
├── types.ts            # TypeScript type definitions
└── index.tsx           # Application entry point
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please:
- Check the existing [Issues](https://github.com/Centaurioun/academic-paper-extractor/issues)
- Create a new issue if needed
- Provide detailed information about the problem and your environment
