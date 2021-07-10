import * as d3 from 'd3';
import { schemeDark2 } from 'd3-scale-chromatic';

export const colorScale = d3.scaleOrdinal(schemeDark2.slice());
export const defaultNodeStrokeWidth = 1.5;
export const defaultLinkStrokeWidth = 1.5;
export const highlightColor = '#32f272';
export const everythingElseColor = '#31d8ea';
export const everythingElseOpacity = 0.2;
export const linkGradientColorStart = '#006eff';
export const linkGradientColorEnd = '#87eeff';
export const linkGradientColorEndInverted = '#2f5359';
