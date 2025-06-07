declare module 'jstat' {
  export interface JStat {
    ttest(arr1: number[], arr2: number[], options?: { tails?: number }): number;
    tscore(arr1: number[], arr2: number[]): number;
    anovafscore(...arrays: number[][]): number;
    anovaftest(...arrays: number[][]): number;
  }

  const jStat: JStat;
  export { jStat };
} 