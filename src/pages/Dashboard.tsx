
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  PieChart, 
  LineChart, 
  TrendingUp, 
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  Download,
  Share2,
  Eye,
  FileText,
  Calendar,
  ArrowRight
} from "lucide-react";
import { useState, useEffect } from "react";

const MetricCard = ({ title, value, change, icon: Icon, trend }: {
  title: string;
  value: string;
  change: string;
  icon: any;
  trend: 'up' | 'down';
}) => {
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

const ChartPlaceholder = ({ title, description, icon: Icon, delay = 0 }: {
  title: string;
  description: string;
  icon: any;
  delay?: number;
}) => {
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

export default function Dashboard() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(73), 500);
    return () => clearTimeout(timer);
  }, []);

  const metrics = [
    { title: "Total Records", value: "1,234", change: "+12.5%", icon: FileText, trend: 'up' as const },
    { title: "Active Users", value: "847", change: "+8.2%", icon: Users, trend: 'up' as const },
    { title: "Revenue", value: "$12,450", change: "-2.1%", icon: DollarSign, trend: 'down' as const },
    { title: "Engagement", value: "94.2%", change: "+5.7%", icon: Activity, trend: 'up' as const },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      {/* Header Section */}
      <div className="text-center space-y-4 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
          <Calendar className="w-4 h-4" />
          Updated 2 minutes ago
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Analytics Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Comprehensive insights and analytics for your data with real-time visualizations
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button className="group">
            <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" />
            Export Report
          </Button>
          <Button variant="outline" className="group">
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

      {/* Progress Section */}
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

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="animate-fade-in">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <BarChart className="w-5 h-5 text-primary" />
              Revenue Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartPlaceholder 
              title="Upload a dataset to see visualizations"
              description="Interactive charts will appear here"
              icon={BarChart}
              delay={200}
            />
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Distribution Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartPlaceholder 
              title="Data insights will appear here"
              description="Comprehensive breakdowns and trends"
              icon={PieChart}
              delay={400}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 animate-fade-in">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <LineChart className="w-5 h-5 text-primary" />
              Performance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartPlaceholder 
              title="Time-series analysis"
              description="Track your data performance over time with detailed trend analysis"
              icon={LineChart}
              delay={600}
            />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: "Upload New Data", desc: "Add more datasets to analyze", icon: FileText },
              { title: "Create Report", desc: "Generate comprehensive reports", icon: BarChart },
              { title: "Schedule Analysis", desc: "Set up automated insights", icon: Calendar }
            ].map((action, index) => (
              <Button 
                key={action.title}
                variant="outline" 
                className="h-auto p-4 flex flex-col items-start gap-2 group hover:bg-primary/5 transition-all duration-300"
                style={{ animationDelay: `${800 + index * 100}ms` }}
              >
                <action.icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                <div className="text-left">
                  <div className="font-semibold">{action.title}</div>
                  <div className="text-sm text-muted-foreground">{action.desc}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
