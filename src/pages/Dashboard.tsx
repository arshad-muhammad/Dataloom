import { ComponentType, useState, useEffect, useRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  PieChart as PieChartIcon, 
  LineChart as LineChartIcon, 
  TrendingUp, 
  TrendingDown,
  Plus,
  Users,
  DollarSign,
  Activity,
  Download,
  Share2,
  Eye,
  FileText,
  Calendar,
  ArrowRight,
  Table,
  MessageSquare,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useData } from "@/lib/DataContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  ResponsiveContainer,
  Cell
} from 'recharts';
import { exportDashboardReport, exportAsPDF } from "@/lib/export-utils";
import { toast } from "@/components/ui/use-toast";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  trend: 'up' | 'down';
}

const MetricCard = ({ title, value, change, icon: Icon, trend }: MetricCardProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer ${
      isVisible ? 'animate-fade-in' : 'opacity-0'
    }`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <Badge 
                variant={trend === 'up' ? 'default' : 'secondary'}
                className={`flex items-center gap-1 ${
                  trend === 'up' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {change}
              </Badge>
            </div>
          </div>
          <div className={`p-3 rounded-full transition-all duration-300 group-hover:scale-110 ${
            trend === 'up' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
          }`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface ChartPlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  delay?: number;
}

const ChartPlaceholder = ({ title, description, icon: Icon, delay = 0 }: ChartPlaceholderProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`h-64 bg-gradient-to-br from-muted/50 to-muted rounded-lg flex flex-col items-center justify-center space-y-4 group hover:from-muted/70 hover:to-muted/90 transition-all duration-500 cursor-pointer ${
      isVisible ? 'animate-fade-in' : 'opacity-0'
    }`}>
      <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
        <Icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-300" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        View Details <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
};

interface DataItem {
  [key: string]: string | number | null;
}

interface PieDataItem {
  name: string;
  value: number;
}

interface ChartConfig {
  id: string;
  type: 'bar' | 'line' | 'pie';
  title: string;
  xAxis: string;
  yAxis?: string;
  data: DataItem[] | PieDataItem[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const { currentDataset, isProcessing } = useData();
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [showChartDialog, setShowChartDialog] = useState(false);
  const [newChartConfig, setNewChartConfig] = useState<Partial<ChartConfig>>({
    type: 'bar',
    xAxis: '',
    yAxis: ''
  });
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentDataset) {
      // Create default charts based on data types
      const defaultCharts: ChartConfig[] = [];
      
      // Create charts for numeric columns
      currentDataset.summary.numericColumns.forEach((numericCol, index) => {
        if (index < 2) { // Limit to 2 default numeric charts
          defaultCharts.push({
            id: `numeric-${index}`,
            type: 'bar',
            title: `${numericCol} Distribution`,
            xAxis: currentDataset.summary.categoricalColumns[0] || numericCol,
            yAxis: numericCol,
            data: currentDataset.preview
          });
        }
      });

      // Create pie chart for first categorical column
      if (currentDataset.summary.categoricalColumns.length > 0) {
        const catCol = currentDataset.summary.categoricalColumns[0];
        const pieData = processPieChartData(currentDataset.preview, catCol);
        defaultCharts.push({
          id: 'categorical-0',
          type: 'pie',
          title: `${catCol} Distribution`,
          xAxis: catCol,
          data: pieData
        });
      }

      setCharts(defaultCharts);
    }
  }, [currentDataset]);

  const processPieChartData = (data: DataItem[], category: string): PieDataItem[] => {
    const counts: { [key: string]: number } = {};
    data.forEach(item => {
      const value = item[category]?.toString() || 'Unknown';
      counts[value] = (counts[value] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const handleCreateChart = () => {
    if (!newChartConfig.title || !newChartConfig.xAxis) return;

    const chartData = newChartConfig.type === 'pie' 
      ? processPieChartData(currentDataset.preview, newChartConfig.xAxis)
      : currentDataset.preview;

    const newChart: ChartConfig = {
      id: Date.now().toString(),
      type: newChartConfig.type!,
      title: newChartConfig.title,
      xAxis: newChartConfig.xAxis,
      yAxis: newChartConfig.yAxis,
      data: chartData
    };

    setCharts(prev => [...prev, newChart]);
    setShowChartDialog(false);
    setNewChartConfig({ type: 'bar', xAxis: '', yAxis: '' });
  };

  const renderChart = (chart: ChartConfig) => {
    const commonProps = {
      width: "100%",
      height: 300,
      data: chart.data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chart.type) {
      case 'bar':
        return (
          <RechartsBarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chart.xAxis} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={chart.yAxis} fill="#8884d8" />
          </RechartsBarChart>
        );
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chart.xAxis} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={chart.yAxis} stroke="#8884d8" />
          </LineChart>
        );
      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={chart.data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chart.data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    if (isProcessing) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 500);
      return () => clearInterval(interval);
    } else {
      setProgress(100);
    }
  }, [isProcessing]);

  const handleExportReport = async () => {
    if (!currentDataset || !dashboardRef.current) return;

    try {
      const fileName = `dataloom-report-${new Date().toISOString().split('T')[0]}`;
      
      // Add a temporary class to ensure all content is visible for capture
      dashboardRef.current.classList.add('export-mode');
      
      await exportAsPDF(dashboardRef.current, fileName);
      
      // Remove the temporary class
      dashboardRef.current.classList.remove('export-mode');

      toast({
        title: "Report Generated",
        description: "Your dashboard has been exported successfully.",
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export the dashboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!currentDataset) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 p-6">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">No Dataset Loaded</h1>
          <p className="text-lg text-muted-foreground">
            Please upload a dataset to view analytics and insights.
          </p>
          <Button onClick={() => navigate('/upload')}>
            Upload Data
          </Button>
        </div>
      </div>
    );
  }

  const metrics = [
    { 
      title: "Total Records", 
      value: currentDataset.rowCount.toLocaleString(), 
      change: "+100%", 
      icon: FileText, 
      trend: 'up' as const 
    },
    { 
      title: "Numeric Columns", 
      value: currentDataset.summary.numericColumns.length.toString(), 
      change: "+100%", 
      icon: Activity, 
      trend: 'up' as const 
    },
    { 
      title: "Categorical Columns", 
      value: currentDataset.summary.categoricalColumns.length.toString(), 
      change: "+100%", 
      icon: Table, 
      trend: 'up' as const 
    },
    { 
      title: "Date Columns", 
      value: currentDataset.summary.dateColumns.length.toString(), 
      change: "+100%", 
      icon: Calendar, 
      trend: 'up' as const 
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6" ref={dashboardRef}>
      {/* Header Section */}
      <div className="text-center space-y-4 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
          <Calendar className="w-4 h-4" />
          Dataset: {currentDataset.name || "Untitled Dataset"}
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent print:text-primary">
          Analytics Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Comprehensive insights and analytics for your data with real-time visualizations
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button 
            className="group print:hidden"
            onClick={handleExportReport}
            disabled={!currentDataset}
          >
            <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" />
            Export Report
          </Button>
          <Button variant="outline" className="group print:hidden">
            <Share2 className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
            Share Dashboard
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div key={metric.title} style={{ animationDelay: `${index * 100}ms` }}>
            <MetricCard {...metric} />
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Data Visualizations</h2>
          <Dialog open={showChartDialog} onOpenChange={setShowChartDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Chart
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Chart</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chart Type</label>
                  <Select
                    value={newChartConfig.type}
                    onValueChange={(value: 'bar' | 'line' | 'pie') => 
                      setNewChartConfig(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select chart type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Chart Title</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={newChartConfig.title || ''}
                    onChange={(e) => setNewChartConfig(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter chart title"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {newChartConfig.type === 'pie' ? 'Category' : 'X-Axis'} Column
                  </label>
                  <Select
                    value={newChartConfig.xAxis}
                    onValueChange={(value) => 
                      setNewChartConfig(prev => ({ ...prev, xAxis: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentDataset.columns.map(column => (
                        <SelectItem key={column} value={column}>{column}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(newChartConfig.type === 'bar' || newChartConfig.type === 'line') && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Y-Axis Column</label>
                    <Select
                      value={newChartConfig.yAxis}
                      onValueChange={(value) => 
                        setNewChartConfig(prev => ({ ...prev, yAxis: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentDataset.summary.numericColumns.map(column => (
                          <SelectItem key={column} value={column}>{column}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button 
                  className="w-full"
                  onClick={handleCreateChart}
                  disabled={!newChartConfig.title || !newChartConfig.xAxis || 
                    (newChartConfig.type !== 'pie' && !newChartConfig.yAxis)}
                >
                  Create Chart
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {charts.map((chart) => (
            <Card key={chart.id} className="animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">{chart.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCharts(prev => prev.filter(c => c.id !== chart.id))}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  {renderChart(chart)}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Progress Section */}
      {isProcessing && (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Data Processing Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Analysis Completion</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground">
            Your data is being processed and analyzed. Charts will appear once complete.
          </p>
        </CardContent>
      </Card>
      )}

      {/* Data Preview */}
        <Card className="animate-fade-in">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
            <Table className="w-5 h-5 text-primary" />
            Data Preview
            </CardTitle>
          </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead>
              <tr>
                {currentDataset.columns.map((column) => (
                  <th
                    key={column}
                    className="px-4 py-2 text-left text-sm font-semibold text-muted-foreground"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {currentDataset.preview.map((row, i) => (
                <tr key={i}>
                  {currentDataset.columns.map((column) => (
                    <td key={column} className="px-4 py-2 text-sm">
                      {row[column]?.toString()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          </CardContent>
        </Card>

      {/* Column Statistics */}
      <div className="grid lg:grid-cols-2 gap-8">
        {currentDataset.summary.numericColumns.map((column) => (
          <Card key={column} className="animate-fade-in">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
                <BarChart className="w-5 h-5 text-primary" />
                {column} Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minimum:</span>
                  <span className="font-semibold">{currentDataset.summary.statistics[column].min}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Maximum:</span>
                  <span className="font-semibold">{currentDataset.summary.statistics[column].max}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average:</span>
                  <span className="font-semibold">{currentDataset.summary.statistics[column].avg.toFixed(2)}</span>
                </div>
              </div>
          </CardContent>
        </Card>
        ))}

        {currentDataset.summary.categoricalColumns.map((column) => (
          <Card key={column} className="animate-fade-in">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-primary" />
                {column} Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unique Values:</span>
                  <span className="font-semibold">{currentDataset.summary.statistics[column].uniqueValues}</span>
                </div>
              </div>
          </CardContent>
        </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start gap-2 group hover:bg-primary/5 transition-all duration-300"
              onClick={() => navigate('/chat')}
            >
              <MessageSquare className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" />
              <div className="text-left">
                <div className="font-semibold">Chat with Data</div>
                <div className="text-sm text-muted-foreground">Ask questions about your data</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start gap-2 group hover:bg-primary/5 transition-all duration-300"
            >
              <Download className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" />
              <div className="text-left">
                <div className="font-semibold">Export Analysis</div>
                <div className="text-sm text-muted-foreground">Download detailed report</div>
              </div>
            </Button>
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-start gap-2 group hover:bg-primary/5 transition-all duration-300"
              onClick={() => navigate('/upload')}
              >
              <FileText className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                <div className="text-left">
                <div className="font-semibold">Upload New Data</div>
                <div className="text-sm text-muted-foreground">Add another dataset</div>
                </div>
              </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
