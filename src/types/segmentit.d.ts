declare module 'segmentit' {
  export interface SegmentResult {
    w: string;
    p: number;
  }

  export class Segment {
    doSegment(text: string): SegmentResult[];
  }

  export function useDefault(segment: Segment): Segment;
}
