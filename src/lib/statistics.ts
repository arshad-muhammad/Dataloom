import { jStat } from 'jstat';

interface GroupStats {
  mean: number;
  variance: number;
  count: number;
}

export interface StatisticalAnalysis {
  tTest: {
    pValue: number;
    tStat: number;
    significant: boolean;
  };
  anova: {
    pValue: number;
    fStat: number;
    significant: boolean;
  };
  intraGroupAnalysis: {
    [group: string]: {
      mean: number;
      variance: number;
      stdDev: number;
      count: number;
      coefficientOfVariation: number;
    };
  };
}

// Helper function to calculate mean
function calculateMean(values: number[]): number {
  if (values.length === 0) return NaN;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

// Helper function to calculate variance
function calculateVariance(values: number[], mean: number): number {
  if (values.length < 2 || isNaN(mean)) return NaN;
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
}

// Helper function to calculate standard deviation
function calculateStdDev(variance: number): number {
  return isNaN(variance) ? NaN : Math.sqrt(variance);
}

// Perform t-test between two groups
function performTTest(group1: number[], group2: number[]): { pValue: number; tStat: number } {
  if (group1.length < 2 || group2.length < 2) {
    console.warn('T-test requires at least 2 values in each group');
    return { pValue: NaN, tStat: NaN };
  }

  try {
    const ttest = jStat.ttest(group1, group2, { tails: 2 });
    const tscore = jStat.tscore(group1, group2);
    
    // Check for valid results
    if (isNaN(ttest) || isNaN(tscore)) {
      console.warn('T-test produced invalid results');
      return { pValue: NaN, tStat: NaN };
    }
    
    return { pValue: ttest, tStat: tscore };
  } catch (error) {
    console.error('Error performing t-test:', error);
    return { pValue: NaN, tStat: NaN };
  }
}

// Perform one-way ANOVA
function performANOVA(groups: number[][]): { pValue: number; fStat: number } {
  // Check if we have at least 2 groups with at least 2 values each
  if (groups.length < 2 || groups.some(group => group.length < 2)) {
    console.warn('ANOVA requires at least 2 groups with at least 2 values each');
    return { pValue: NaN, fStat: NaN };
  }

  try {
    const fstat = jStat.anovafscore(...groups);
    const pValue = jStat.anovaftest(...groups);
    
    // Check for valid results
    if (isNaN(fstat) || isNaN(pValue)) {
      console.warn('ANOVA produced invalid results');
      return { pValue: NaN, fStat: NaN };
    }
    
    return { pValue, fStat: fstat };
  } catch (error) {
    console.error('Error performing ANOVA:', error);
    return { pValue: NaN, fStat: NaN };
  }
}

// Perform intragroup analysis
function performIntraGroupAnalysis(data: { [group: string]: number[] }): {
  [group: string]: {
    mean: number;
    variance: number;
    stdDev: number;
    count: number;
    coefficientOfVariation: number;
  };
} {
  const results: Record<string, {
    mean: number;
    variance: number;
    stdDev: number;
    count: number;
    coefficientOfVariation: number;
  }> = {};

  for (const [group, values] of Object.entries(data)) {
    if (values.length === 0) {
      results[group] = {
        mean: NaN,
        variance: NaN,
        stdDev: NaN,
        count: 0,
        coefficientOfVariation: NaN
      };
      continue;
    }

    const mean = calculateMean(values);
    const variance = calculateVariance(values, mean);
    const stdDev = calculateStdDev(variance);

    results[group] = {
      mean,
      variance,
      stdDev,
      count: values.length,
      coefficientOfVariation: !isNaN(stdDev) && mean !== 0 ? (stdDev / mean) * 100 : NaN
    };
  }

  return results;
}

export function performStatisticalAnalysis(
  numericColumn: number[],
  groupColumn: string[],
  groupsToCompare?: string[]
): StatisticalAnalysis {
  // Group data
  const groupedData: { [key: string]: number[] } = {};
  numericColumn.forEach((value, index) => {
    const group = groupColumn[index];
    if (!groupedData[group]) {
      groupedData[group] = [];
    }
    groupedData[group].push(value);
  });

  // Get unique groups
  const groups = groupsToCompare || Object.keys(groupedData);
  
  // Prepare data for analysis
  const groupArrays = groups.map(group => groupedData[group] || []);

  // Perform t-test (between first two groups)
  const tTestResult = groups.length >= 2 
    ? performTTest(groupArrays[0], groupArrays[1])
    : { pValue: 1, tStat: 0 };

  // Perform ANOVA
  const anovaResult = performANOVA(groupArrays);

  // Perform intragroup analysis
  const intraGroupResult = performIntraGroupAnalysis(groupedData);

  return {
    tTest: {
      pValue: tTestResult.pValue,
      tStat: tTestResult.tStat,
      significant: tTestResult.pValue < 0.05
    },
    anova: {
      pValue: anovaResult.pValue,
      fStat: anovaResult.fStat,
      significant: anovaResult.pValue < 0.05
    },
    intraGroupAnalysis: intraGroupResult
  };
} 