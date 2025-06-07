import * as XLSX from 'xlsx';
import * as Papa from 'papaparse';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google AI with API key
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Missing Gemini API key. Please add VITE_GEMINI_API_KEY to your environment variables.');
}

const genAI = new GoogleGenerativeAI(apiKey);

export interface DatasetInfo {
  name?: string;
  columns: string[];
  rowCount: number;
  preview: Record<string, string | number>[];
  summary: {
    numericColumns: string[];
    categoricalColumns: string[];
    dateColumns: string[];
    statistics: Record<string, {
      min?: number;
      max?: number;
      avg?: number;
      uniqueValues?: number;
    }>;
  };
}

export interface AnalysisResult {
  textSummary: string;
  visualizationType?: string;
  chartData?: Record<string, string | number>[];
  tableData?: Record<string, string | number>[];
}

export const parseFile = async (file: File): Promise<DatasetInfo> => {
  console.group('File Parsing Debug');
  console.log('Starting file parse:', {
    name: file.name,
    type: file.type,
    size: file.size
  });

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e: ProgressEvent<FileReader>) => {
      try {
        if (!e.target?.result) {
          throw new Error('Failed to read file content');
        }

        console.log('File read successfully, processing content...');
        let data: Record<string, string | number>[];
        let columns: string[];
        
        if (file.name.endsWith('.csv')) {
          console.log('Processing CSV file...');
          const csv = Papa.parse(e.target.result as string, {
            header: true,
            skipEmptyLines: true
          });

          if (csv.errors.length > 0) {
            console.error('CSV parsing errors:', csv.errors);
            throw new Error(`CSV parsing failed: ${csv.errors[0].message}`);
          }

          data = csv.data as Record<string, string | number>[];
          columns = csv.meta.fields || [];
          console.log('CSV processed:', {
            rowCount: data.length,
            columns: columns
          });
        } else {
          console.log('Processing Excel file...');
          try {
            // Handle Excel files
            let buffer: ArrayBuffer;
            if (typeof e.target.result === 'string') {
              // Convert binary string to ArrayBuffer
              console.log('Converting binary string to ArrayBuffer...');
              const binary = e.target.result;
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i) & 0xff;
              }
              buffer = bytes.buffer;
            } else {
              buffer = e.target.result as ArrayBuffer;
            }

            console.log('Reading Excel workbook...');
            const workbook = XLSX.read(buffer, { type: 'array' });
            console.log('Available sheets:', workbook.SheetNames);

            if (workbook.SheetNames.length === 0) {
              throw new Error('Excel file contains no sheets');
            }

            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            if (!firstSheet) {
              throw new Error('Failed to read first sheet');
            }
            
            // Convert sheet to JSON with options
            console.log('Converting sheet to JSON...');
            data = XLSX.utils.sheet_to_json(firstSheet, {
              raw: false, // Convert all numbers to strings
              defval: '', // Default value for empty cells
            });
            
            if (data.length === 0) {
              throw new Error('No data found in Excel sheet');
            }

            columns = Object.keys(data[0] || {});
            console.log('Excel processed:', {
              rowCount: data.length,
              columns: columns
            });
          } catch (error) {
            console.error('Excel processing error:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to process Excel file');
          }
        }

        if (data.length === 0) {
          throw new Error('No data found in file');
        }

        if (columns.length === 0) {
          throw new Error('No columns found in file');
        }

        console.log('Analyzing column types...');
        // Analyze column types
        const numericColumns: string[] = [];
        const categoricalColumns: string[] = [];
        const dateColumns: string[] = [];
        const statistics: Record<string, {
          min?: number;
          max?: number;
          avg?: number;
          uniqueValues?: number;
        }> = {};

        columns.forEach(col => {
          const values = data.map(row => row[col]);
          const sample = values.find(v => v !== undefined && v !== null && v !== '');

          if (sample !== undefined) {
            const numValue = Number(sample);
            if (!isNaN(numValue)) {
              numericColumns.push(col);
              const numericValues = values
                .map(v => Number(v))
                .filter(v => !isNaN(v));
              
              if (numericValues.length > 0) {
                statistics[col] = {
                  min: Math.min(...numericValues),
                  max: Math.max(...numericValues),
                  avg: numericValues.reduce((a, b) => a + b, 0) / numericValues.length
                };
              }
            } else if (!isNaN(Date.parse(String(sample)))) {
              dateColumns.push(col);
            } else {
              categoricalColumns.push(col);
              const validValues = values.filter(v => v !== undefined && v !== null && v !== '');
              statistics[col] = {
                uniqueValues: new Set(validValues).size
              };
            }
          } else {
            categoricalColumns.push(col);
            statistics[col] = {
              uniqueValues: 0
            };
          }
        });

        console.log('Column analysis complete:', {
          numericColumns,
          categoricalColumns,
          dateColumns
        });

        const result: DatasetInfo = {
          name: file.name,
          columns,
          rowCount: data.length,
          preview: data.slice(0, 10),
          summary: {
            numericColumns,
            categoricalColumns,
            dateColumns,
            statistics
          }
        };

        console.log('File parsing completed successfully');
        console.groupEnd();
        resolve(result);
      } catch (error) {
        console.error('File parsing error:', error);
        console.groupEnd();
        reject(error);
      }
    };

    reader.onerror = () => {
      console.error('FileReader error:', reader.error);
      console.groupEnd();
      reject(new Error('Failed to read file: ' + (reader.error?.message || 'Unknown error')));
    };

    try {
      console.log('Starting file read...');
      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        // For Excel files, read as ArrayBuffer
        reader.readAsArrayBuffer(file);
      }
    } catch (error) {
      console.error('Error initiating file read:', error);
      console.groupEnd();
      reject(new Error('Failed to start file reading: ' + (error instanceof Error ? error.message : 'Unknown error')));
    }
  });
};

export const analyzeData = async (
  data: Record<string, string | number>[],
  columns: string[],
  query: string
): Promise<AnalysisResult> => {
  try {
    // Initialize the model with the correct configuration
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Prepare the data for analysis
    const dataContext = {
      columns: columns.join(', '),
      rowCount: data.length,
      sampleData: JSON.stringify(data.slice(0, 3), null, 2)
    };

    // Create a more structured prompt
    const prompt = `
      You are a data analyst assistant. Analyze this dataset and answer the query.
      
      Dataset Information:
      - Columns: ${dataContext.columns}
      - Number of rows: ${dataContext.rowCount}
      
      Sample data (first 3 rows):
      ${dataContext.sampleData}
      
      User Query: ${query}
      
      Respond with a JSON object containing these exact keys:
      {
        "textSummary": "A detailed explanation of the findings",
        "visualizationType": "bar" | "line" | "pie" | null,
        "chartData": [] // Array of data points if visualization is needed
      }
      
      Important: Return ONLY the JSON object, no markdown formatting or code blocks.
      Focus on providing accurate insights and clear explanations.
    `;

    // Generate the response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean the response text - remove markdown formatting if present
    const cleanedText = text
      .replace(/```json\n?/g, '')  // Remove ```json
      .replace(/```\n?/g, '')      // Remove closing ```
      .trim();                     // Remove extra whitespace

    // Parse the JSON response
    try {
      const analysisResult = JSON.parse(cleanedText);
      return {
        textSummary: analysisResult.textSummary || "Analysis completed successfully.",
        visualizationType: analysisResult.visualizationType,
        chartData: analysisResult.chartData,
        tableData: analysisResult.tableData
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Raw AI response:', text);
      console.log('Cleaned response:', cleanedText);
      
      // If JSON parsing fails, return the raw text as a summary
      return {
        textSummary: cleanedText || "Analysis completed, but the response format was unexpected.",
        visualizationType: undefined,
        chartData: undefined,
        tableData: undefined
      };
    }
  } catch (error) {
    console.error('AI Analysis Error:', error);
    
    // Provide more specific error messages based on the error type
    let errorMessage = "I encountered an error while analyzing your data. ";
    
    if (error instanceof Error) {
      if (error.message.includes('404')) {
        errorMessage += "The AI model is currently unavailable. Please try again later.";
      } else if (error.message.includes('429')) {
        errorMessage += "Too many requests. Please wait a moment and try again.";
      } else if (error.message.includes('403')) {
        errorMessage += "API key validation failed. Please check your API key configuration.";
      } else {
        errorMessage += "Please try rephrasing your question or try again later.";
      }
    }

    throw new Error(errorMessage);
  }
};

export const generateChartConfig = (
  type: string, 
  data: Record<string, string | number>[]
) => {
  // Convert AI response data into Recharts configuration
  switch (type.toLowerCase()) {
    case 'bar':
      return {
        type: 'bar',
        data: data,
        config: {
          xAxisDataKey: Object.keys(data[0])[0],
          bars: Object.keys(data[0]).slice(1).map(key => ({
            dataKey: key,
            fill: `#${Math.floor(Math.random()*16777215).toString(16)}`
          }))
        }
      };
    case 'line':
      return {
        type: 'line',
        data: data,
        config: {
          xAxisDataKey: Object.keys(data[0])[0],
          lines: Object.keys(data[0]).slice(1).map(key => ({
            dataKey: key,
            stroke: `#${Math.floor(Math.random()*16777215).toString(16)}`
          }))
        }
      };
    case 'pie':
      return {
        type: 'pie',
        data: data.map(item => ({
          name: item.name || item.category || Object.values(item)[0],
          value: Number(Object.values(item)[1])
        }))
      };
    default:
      return {
        type: 'bar',
        data: data
      };
  }
}; 