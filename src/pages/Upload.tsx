import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload as UploadIcon, FileSpreadsheet, CheckCircle, AlertCircle, Table } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { uploadFile } from "@/lib/supabase";
import { parseFile } from "@/lib/data-processing";
import { useData } from "@/lib/DataContext";

export default function Upload() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setCurrentDataset, setIsProcessing } = useData();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    console.group('File Upload Debug');
    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString()
    });
    
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/excel',
      'application/x-excel',
      'application/x-msexcel'
    ];

    // Check both MIME type and file extension
    const isValidExtension = /\.(csv|xlsx|xls)$/i.test(file.name);
    const isValidType = allowedTypes.includes(file.type);

    console.log('File validation:', {
      isValidExtension,
      isValidType,
      allowedTypes,
      fileType: file.type
    });

    if (!isValidType && !isValidExtension) {
      console.warn('File validation failed');
      console.groupEnd();
      
      setUploadStatus('error');
      toast({
        title: "Invalid File Type",
        description: `File type "${file.type}" is not supported. Please upload a CSV or Excel file (.csv, .xlsx, .xls)`,
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadedFile(file);
      setUploadStatus('uploading');
      console.log('Starting file upload to Supabase...');

      // Upload to Supabase
      const timestamp = Date.now();
      const path = `uploads/${timestamp}`;
      await uploadFile(file, path);
      console.log('File uploaded to Supabase successfully');

      // Parse and process the file
      console.log('Starting file parsing...');
      setUploadStatus('processing');
      const datasetInfo = await parseFile(file);
      console.log('File parsed successfully:', {
        rowCount: datasetInfo.rowCount,
        columns: datasetInfo.columns,
        numericColumns: datasetInfo.summary.numericColumns,
        categoricalColumns: datasetInfo.summary.categoricalColumns,
        dateColumns: datasetInfo.summary.dateColumns
      });
      
      // Store the dataset info in context
      setCurrentDataset(datasetInfo);
      
      setUploadStatus('success');
      console.log('File processing completed successfully');
      console.groupEnd();

      toast({
        title: "File Processed Successfully",
        description: `Processed ${datasetInfo.rowCount.toLocaleString()} rows of data.`,
      });
    } catch (error) {
      console.error('File processing error:', error);
      console.groupEnd();

      setUploadStatus('error');
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const proceedToAnalysis = () => {
    setIsProcessing(true);
    navigate('/dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Upload Your Data</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Upload your CSV or Excel files to start analyzing your data with AI. 
          We support files up to 100MB with millions of rows.
        </p>
      </div>

      <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors duration-300">
        <CardContent className="p-8">
          <div
            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
              dragActive 
                ? 'border-primary bg-primary/5 scale-105' 
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/20'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileInput}
              accept=".csv,.xlsx,.xls"
            />
            
            {uploadStatus === 'idle' && (
              <>
                <UploadIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Drop your files here</h3>
                <p className="text-muted-foreground mb-4">
                  or click to browse your computer
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports CSV, XLSX, XLS files up to 100MB
                </p>
              </>
            )}

            {uploadStatus === 'uploading' && (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                <h3 className="text-xl font-semibold mb-2">Uploading...</h3>
                <p className="text-muted-foreground">Uploading your file</p>
              </>
            )}

            {uploadStatus === 'processing' && (
              <>
                <div className="w-16 h-16 mx-auto mb-4">
                  <Table className="w-full h-full text-primary animate-pulse" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Processing...</h3>
                <p className="text-muted-foreground">Analyzing your data</p>
              </>
            )}

            {uploadStatus === 'success' && uploadedFile && (
              <>
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Upload Successful!</h3>
                <p className="text-muted-foreground mb-4">
                  {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
                <Button 
                  onClick={proceedToAnalysis}
                  className="gradient-primary text-white border-0"
                >
                  Start Analysis
                </Button>
              </>
            )}

            {uploadStatus === 'error' && (
              <>
                <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
                <h3 className="text-xl font-semibold mb-2">Upload Failed</h3>
                <p className="text-muted-foreground mb-4">
                  Please upload a valid CSV or Excel file
                </p>
                <Button 
                  onClick={() => setUploadStatus('idle')}
                  variant="outline"
                >
                  Try Again
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            File Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-card-foreground">Supported Formats</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• CSV (.csv)</li>
              <li>• Excel (.xlsx, .xls)</li>
              <li>• Maximum file size: 100MB</li>
              <li>• Up to 1 million rows</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-card-foreground">Best Practices</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Include column headers in first row</li>
              <li>• Use consistent data formats</li>
              <li>• Avoid merged cells in Excel</li>
              <li>• Clean data works best</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
