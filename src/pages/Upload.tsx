
import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload as UploadIcon, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Upload() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const navigate = useNavigate();

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
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      setUploadStatus('error');
      return;
    }

    setUploadedFile(file);
    setUploadStatus('uploading');

    // Simulate upload process
    setTimeout(() => {
      setUploadStatus('success');
    }, 2000);
  };

  const proceedToAnalysis = () => {
    navigate('/chat/demo-dataset');
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
                <p className="text-muted-foreground">Processing your file</p>
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
