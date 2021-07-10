import { Superformula } from './utils/superformula';

export interface Node {
  name?: string;
  group?: string;
  details?: { [key: string]: object };
  notes?: string;
  size?: number;
  nodes?: Node[];
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  internalLinks?: Link[];
  timestamp?: string;
}

export interface Link {
  source: string | Node;
  target: string | Node;
  sourceChild?: string | Node;
  targetChild?: string | Node;
  details?: { [key: string]: object };
  timestamp?: string;
}

export interface Hull {
  group: string;
  path: [number, number][];
}

export interface NodeStateProperties {
  className: string;
  nodeTextShiftMultiplier: number;
  shapeSuperformula: Superformula;
}
