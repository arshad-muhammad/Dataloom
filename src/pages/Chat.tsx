import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, BarChart, Download, AlertCircle, Image, FileText } from "lucide-react";
import { useData } from "@/lib/DataContext";
import { analyzeData, generateChartConfig } from "@/lib/data-processing";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { exportAsImage, exportAsPDF } from "@/lib/export-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart as RechartsBarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ChartData {
  [key: string]: string | number;
}

interface BarConfig {
  dataKey: string;
  fill: string;
}

interface LineConfig {
  dataKey: string;
  stroke: string;
}

interface ChartConfig {
  xAxisDataKey: string;
  bars?: BarConfig[];
  lines?: LineConfig[];
}

interface Visualization {
  type: 'bar' | 'line' | 'pie';
  data: ChartData[];
  config?: ChartConfig;
}

interface Message {
  id: string;
  type: 'user' | 'ai' | 'error';
  content: string;
  timestamp: Date;
  visualization?: Visualization;
  tableData?: Record<string, string | number>[];
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { currentDataset } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Initial message based on dataset status
    const initialMessage: Message = currentDataset
      ? {
      id: '1',
      type: 'ai',
          content: `I've analyzed your dataset with ${currentDataset.rowCount.toLocaleString()} rows and ${currentDataset.columns.length} columns. What would you like to know about your data?`,
      timestamp: new Date()
    }
      : {
          id: '1',
          type: 'ai',
          content: "Please upload a dataset first to start the analysis. Once uploaded, I can help you analyze it with natural language queries.",
          timestamp: new Date()
        };

    setMessages([initialMessage]);
  }, [currentDataset]);

  useEffect(() => {
    // Scroll to bottom with a slight delay to ensure content is rendered
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end"
      });
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;
    if (!currentDataset) {
      toast({
        title: "No Dataset",
        description: "Please upload a dataset first.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      console.log('Analyzing data with query:', inputValue);
      console.log('Dataset preview:', currentDataset.preview);
      
      const result = await analyzeData(
        currentDataset.preview,
        currentDataset.columns,
        inputValue
      );

      console.log('Analysis result:', result);

      let visualization;
      if (result.visualizationType && result.chartData) {
        visualization = {
          type: result.visualizationType as 'bar' | 'line' | 'pie',
          data: result.chartData,
          config: generateChartConfig(result.visualizationType, result.chartData)
        };
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: result.textSummary,
        timestamp: new Date(),
        visualization,
        tableData: result.tableData
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Analysis error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'error',
        content: error instanceof Error ? error.message : "An unexpected error occurred while analyzing your data.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Analysis Error",
        description: error instanceof Error ? error.message : "Failed to analyze the data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderVisualization = (visualization: Message['visualization']) => {
    if (!visualization) return null;

    const { type, data, config } = visualization;

    return (
      <div className="w-full h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' && config?.bars && (
            <RechartsBarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xAxisDataKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              {config.bars.map((bar, index) => (
                <Bar key={index} dataKey={bar.dataKey} fill={bar.fill} />
              ))}
            </RechartsBarChart>
          )}
          {type === 'line' && config?.lines && (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xAxisDataKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              {config.lines.map((line, index) => (
                <Line 
                  key={index} 
                  type="monotone" 
                  dataKey={line.dataKey} 
                  stroke={line.stroke} 
                />
              ))}
            </LineChart>
          )}
          {type === 'pie' && (
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label
              />
              <Tooltip />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  const renderTable = (data: Message['tableData']) => {
    if (!data || data.length === 0) return null;

    return (
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead>
            <tr>
              {Object.keys(data[0]).map((key) => (
                <th
                  key={key}
                  className="px-4 py-2 text-left text-sm font-semibold text-muted-foreground"
                >
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row, i) => (
              <tr key={i}>
                {Object.values(row).map((value, j) => (
                  <td key={j} className="px-4 py-2 text-sm">
                    {value?.toString()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const handleExport = async (type: 'image' | 'pdf') => {
    if (!chatContainerRef.current || messages.length === 0) {
      toast({
        title: "Nothing to Export",
        description: "Start a conversation first to export the chat.",
        variant: "destructive",
      });
      return;
    }

    try {
      const fileName = `chat-export-${new Date().toISOString().split('T')[0]}`;
      
      if (type === 'image') {
        await exportAsImage(chatContainerRef.current, fileName);
      } else {
        await exportAsPDF(chatContainerRef.current, fileName);
      }

      toast({
        title: "Export Successful",
        description: `Chat exported as ${type.toUpperCase()} successfully.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export the chat. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Chat with Your Data</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Ask questions in natural language and get AI-powered insights from your data
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col overflow-hidden">
            <CardHeader className="border-b shrink-0">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                AI Data Assistant
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <ScrollArea className="flex-1 px-4" style={{ height: 'calc(100% - 73px)' }}>
                <div className="py-4 space-y-4" ref={chatContainerRef}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div
                        className={`max-w-[85%] p-4 rounded-lg shadow-sm break-words ${
                        message.type === 'user'
                            ? 'bg-primary text-primary-foreground ml-4'
                            : message.type === 'error'
                            ? 'bg-destructive/10 text-destructive mr-4'
                            : 'bg-muted mr-4'
                        }`}
                      >
                        {message.type === 'error' && (
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4" />
                            <span className="font-medium">Error</span>
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </p>
                        {message.visualization && (
                          <div className="mt-4 bg-background rounded-md p-2 overflow-hidden">
                            {renderVisualization(message.visualization)}
                          </div>
                        )}
                        {message.tableData && (
                          <div className="mt-4 bg-background rounded-md overflow-x-auto">
                            {renderTable(message.tableData)}
                          </div>
                        )}
                        <p className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                  <div ref={messagesEndRef} className="h-px" />
              </div>
              </ScrollArea>

              <div className="border-t p-4 bg-background shrink-0">
                <div className="flex gap-2">
                  <Input
                    placeholder={
                      currentDataset
                        ? "Ask about your data..."
                        : "Upload a dataset to start analyzing..."
                    }
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isProcessing && sendMessage()}
                    disabled={!currentDataset || isProcessing}
                    className="flex-1"
                  />
                  <Button 
                    onClick={sendMessage}
                    disabled={!currentDataset || isProcessing}
                    size="icon"
                    className="shrink-0"
                  >
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                    <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => navigate('/dashboard')}
              >
                <BarChart className="w-4 h-4 mr-2" />
                View Dashboard
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    disabled={!currentDataset || messages.length === 0}
                  >
                <Download className="w-4 h-4 mr-2" />
                Export Results
              </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleExport('image')} className="cursor-pointer">
                    <Image className="w-4 h-4 mr-2" />
                    Export as Image
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')} className="cursor-pointer">
                    <FileText className="w-4 h-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Sample Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p className="cursor-pointer hover:text-foreground" onClick={() => setInputValue("What are the top 5 highest values?")}>
                "What are the top 5 highest values?"
              </p>
              <p className="cursor-pointer hover:text-foreground" onClick={() => setInputValue("Show me trends over time")}>
                "Show me trends over time"
              </p>
              <p className="cursor-pointer hover:text-foreground" onClick={() => setInputValue("Which category has the best performance?")}>
                "Which category has the best performance?"
              </p>
              <p className="cursor-pointer hover:text-foreground" onClick={() => setInputValue("Create a summary report")}>
                "Create a summary report"
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
