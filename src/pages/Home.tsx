import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, BarChart, MessageSquare, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "next-themes";
import { useAnalytics } from "@/hooks/use-analytics";
import { DemoDataService } from "@/lib/demo-data";

export default function Home() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({});
  const { theme } = useTheme();
  const { trackPageView, trackFeatureUsage } = useAnalytics();
  const demoService = DemoDataService.getInstance();

  useEffect(() => {
    trackPageView('/home');
  }, [trackPageView]);

  // Analytics tracking function
  const trackFeatureClick = (feature: string) => {
    trackFeatureUsage(feature);
  };

  // Handle navigation with loading state and error handling
  const handleNavigation = async (path: string, feature: string) => {
    try {
      setIsLoading(prev => ({ ...prev, [feature]: true }));
      trackFeatureClick(feature);
      
      // Simulate loading for demo purposes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      navigate(path);
    } catch (error) {
      console.error('Navigation error:', error);
      toast({
        title: "Error",
        description: "Failed to navigate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(prev => ({ ...prev, [feature]: false }));
    }
  };

  // Load demo data
  const loadDemoData = async () => {
    try {
      setIsLoading(prev => ({ ...prev, demo: true }));
      trackFeatureUsage('demo');
      
      const dataset = await demoService.loadDemoData();
      
      toast({
        title: "Demo Data Loaded",
        description: `Successfully loaded ${dataset.name} with ${dataset.rows.toLocaleString()} records.`,
      });
      
      navigate("/dashboard");
    } catch (error) {
      console.error('Demo data error:', error);
      toast({
        title: "Error",
        description: "Failed to load demo data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(prev => ({ ...prev, demo: false }));
    }
  };

  const features = [
    {
      icon: Upload,
      title: "Upload Your Data",
      description: "Import CSV, Excel files and get instant AI-powered insights",
      action: () => handleNavigation("/upload", "upload"),
      buttonText: "Upload Data",
      gradient: "from-blue-500 to-purple-600",
      loadingKey: "upload"
    },
    {
      icon: MessageSquare,
      title: "Chat with Your Data",
      description: "Ask natural language questions and get intelligent answers",
      action: () => handleNavigation("/chat", "chat"),
      buttonText: "Start Chatting",
      gradient: "from-purple-500 to-pink-600",
      loadingKey: "chat"
    },
    {
      icon: BarChart,
      title: "Visual Dashboard",
      description: "Auto-generated charts and comprehensive data visualizations",
      action: () => handleNavigation("/dashboard", "dashboard"),
      buttonText: "View Dashboard",
      gradient: "from-green-500 to-blue-600",
      loadingKey: "dashboard"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            DataLoom
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Transform your spreadsheets into intelligent insights. Upload your data, ask questions in plain English, 
          and get AI-powered analysis with beautiful visualizations.
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button 
            size="lg" 
            onClick={() => handleNavigation("/upload", "upload")}
            className="gradient-primary text-white border-0 hover:opacity-90 transition-all duration-200 px-8"
            disabled={isLoading.upload}
          >
            {isLoading.upload ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span> Loading...
              </span>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Get Started
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={loadDemoData}
            disabled={isLoading.demo}
            className="px-8 hover-lift"
          >
            {isLoading.demo ? "Loading Demo..." : "Try Demo"}
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card 
            key={index} 
            className="group hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-card hover-lift"
          >
            <CardContent className="p-6 space-y-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-card-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
              <Button 
                onClick={feature.action}
                className="w-full mt-4 hover:bg-primary/90 transition-colors duration-200"
                disabled={isLoading[feature.loadingKey]}
              >
                {isLoading[feature.loadingKey] ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Loading...
                  </span>
                ) : (
                  feature.buttonText
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Section */}
      <div className="grid md:grid-cols-3 gap-6 py-8">
        <div className="text-center animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="text-3xl font-bold text-primary">10,000+</div>
          <div className="text-muted-foreground">Files Analyzed</div>
        </div>
        <div className="text-center animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="text-3xl font-bold text-primary">50M+</div>
          <div className="text-muted-foreground">Data Points Processed</div>
        </div>
        <div className="text-center animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="text-3xl font-bold text-primary">99.9%</div>
          <div className="text-muted-foreground">Accuracy Rate</div>
        </div>
      </div>
    </div>
  );
}
