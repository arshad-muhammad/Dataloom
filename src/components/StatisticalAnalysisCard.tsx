import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Activity, AlertCircle } from "lucide-react";
import type { StatisticalAnalysis } from "@/lib/statistics";

type Props = {
  analysis: StatisticalAnalysis;
  numericColumn: string;
  groupColumn: string;
};

export function StatisticalAnalysisCard({ analysis, numericColumn, groupColumn }: Props) {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Statistical Analysis: {numericColumn} by {groupColumn}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* T-Test Results */}
        <div className="space-y-2">
          <h3 className="font-semibold">T-Test Results</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">p-value:</span>
              <p className="font-medium">{analysis.tTest.pValue.toFixed(4)}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">t-statistic:</span>
              <p className="font-medium">{analysis.tTest.tStat.toFixed(4)}</p>
            </div>
          </div>
          {analysis.tTest.significant && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Significant Difference</AlertTitle>
              <AlertDescription>
                The t-test indicates a statistically significant difference between the groups (p < 0.05).
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* ANOVA Results */}
        <div className="space-y-2">
          <h3 className="font-semibold">ANOVA Results</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">p-value:</span>
              <p className="font-medium">{analysis.anova.pValue.toFixed(4)}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">F-statistic:</span>
              <p className="font-medium">{analysis.anova.fStat.toFixed(4)}</p>
            </div>
          </div>
          {analysis.anova.significant && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Significant Difference</AlertTitle>
              <AlertDescription>
                The ANOVA test indicates significant differences between groups (p < 0.05).
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Intragroup Analysis */}
        <div className="space-y-2">
          <h3 className="font-semibold">Intragroup Analysis</h3>
          <div className="space-y-4">
            {Object.entries(analysis.intraGroupAnalysis).map(([group, stats]) => (
              <div key={group} className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">{group}</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Mean:</span>
                    <p className="font-medium">{stats.mean.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Std Dev:</span>
                    <p className="font-medium">{stats.stdDev.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CV (%):</span>
                    <p className="font-medium">{stats.coefficientOfVariation.toFixed(2)}%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Count:</span>
                    <p className="font-medium">{stats.count}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 