import { GoogleGenAI, Type } from "@google/genai";
import type { PaperAnalysis } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Updated schema with refined descriptions and the new 'oneLiner' field.
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "The full title of the paper." },
    authors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of all author names." },
    abstract: { type: Type.STRING, description: "The complete abstract of the paper." },
    keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of keywords provided in the paper." },
    doi: { type: Type.STRING, description: "The Digital Object Identifier (DOI) of the paper, if available." },
    publicationDetails: {
      type: Type.OBJECT,
      properties: {
        journalName: { type: Type.STRING, description: "Name of the journal or conference." },
        publicationYear: { type: Type.STRING, description: "Year of publication only (e.g., '2023')." },
        volume: { type: Type.STRING, description: "Journal volume number." },
        issue: { type: Type.STRING, description: "Journal issue number." },
        pageNumbers: { type: Type.STRING, description: "Page range of the paper." },
      },
       required: ["journalName", "publicationYear"]
    },
    identifiedSections: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Names of the main sections found (e.g., Introduction, Methods)." },
    keyFindings: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A concise, single-sentence summary of a key finding." },
    methodologies: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A concise, single-sentence summary of a primary research method used." },
    conclusions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A concise, single-sentence summary of a main conclusion." },
    researchGap: { type: Type.STRING, description: "Clearly state the specific problem or gap in existing knowledge that the paper aims to fill." },
    summary: {
      type: Type.OBJECT,
      properties: {
        oneLiner: { type: Type.STRING, description: "A single, compelling sentence that summarizes the core contribution and finding of the paper. A TL;DR." },
        significance: { type: Type.STRING, description: "Explain *why* this research matters to its field. What impact could it have?" },
        contributions: { type: Type.STRING, description: "The novel or unique contributions made by this paper." },
        limitations: { type: Type.STRING, description: "Acknowledged constraints and limitations of the study." },
        futureResearch: { type: Type.STRING, description: "Suggested areas for future investigation." },
      },
      required: ["oneLiner", "significance", "contributions", "limitations", "futureResearch"]
    },
  },
  required: ["title", "authors", "abstract", "keyFindings", "methodologies", "conclusions", "summary"]
};


export const analyzePaper = async (paperText: string): Promise<PaperAnalysis> => {
  if (paperText.trim().length < 100) {
      throw new Error("Extracted text is too short to be a valid academic paper. Please check the PDF content.");
  }

  // The prompt now aligns with the fully-featured schema.
  const prompt = `
    # Task: Analyze the provided academic paper.

    ## Phase 1: Metadata Extraction
    Carefully extract the following bibliographic details from the text. If a specific field is not available, use an empty string or an empty array.
    - Title
    - All Authors
    - DOI
    - Publication Details (Journal, Year, Volume, Issue, Pages, etc.)
    - Keywords

    ## Phase 2: Content Synthesis & Analysis
    Act as an expert researcher summarizing this paper for a colleague. Synthesize the core concepts and findings from the paper to provide the following insights based on the JSON schema.
    - **Identified Sections:** List the main sections of the paper (e.g., Introduction, Methods, Results, Discussion).
    - **Research Gap:** What specific problem or gap does this paper address?
    - **Methodologies:** What were the primary methods used?
    - **Key Findings:** What are the most important results? Each finding should be a clear, concise sentence.
    - **Conclusions:** What are the main conclusions drawn by the authors?
    - **Comprehensive Summary:** Generate a detailed summary covering the paper's significance, contributions, limitations, and suggestions for future work.
    - **One-Line Summary / TL;DR:** A single, compelling sentence that captures the paper's core finding and contribution.

    PAPER TEXT:
    ---
    ${paperText.substring(0, 30000)}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
      throw new Error("The API returned an empty response. The paper might be too complex or not in a standard format.");
    }

    return JSON.parse(jsonText) as PaperAnalysis;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw new Error("Failed to analyze the paper with AI. Please try again or with a different file.");
  }
};
