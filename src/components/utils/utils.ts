import * as d3 from 'd3';
import { Link, Node, Hull } from '../data-interfaces';


export const nodeRadiusSizes = { default: 3, node: 3, group: 7 };
export const hullOffset = 15;
export const nodeStateNormal = "node-state-normal";
export const nodeStateHovered = "node-state-hover";
            
export function defaultNodeSuperformulaType(d: Node): string {
    let shapeType = "circle";
    if (d.nodes) {
        shapeType = "circle"// "octagon";
    }
    return shapeType;
}

export function defaultNodeSuperformulaSize(d: Node): number {
    return 2 * getRadius(d);
}

// Transform the list of nodes into groups
export function getBiggestNodesPerGroup(nodes: Node[], links: Link[]) {
    const groupedDictionaryOfNodes: { [key: string]: Node } = {};
    for (const node of nodes) {
        if (node.group) {
            const group = strToLowerOrEmpty(node.group);
            groupedDictionaryOfNodes[group] = groupedDictionaryOfNodes[group] || node;
            groupedDictionaryOfNodes[group] = (!groupedDictionaryOfNodes[group] 
                || ((groupedDictionaryOfNodes[group].size || nodeRadiusSizes.default) < (node.size || nodeRadiusSizes.default)))
                ? node
                : groupedDictionaryOfNodes[group];
            if (!groupedDictionaryOfNodes[group].size) {
                groupedDictionaryOfNodes[group].size = getRadius(groupedDictionaryOfNodes[group]);
            }
        }
    }

    for (const groupedDicPropName of d3.keys(groupedDictionaryOfNodes)) {
        let groupedDic = groupedDictionaryOfNodes[groupedDicPropName];
        if (groupedDic.size === nodeRadiusSizes.default) {
            let nodeWithMostNumberOfInternalLinks = null;
            // If the biggest node is the default size, ensure the biggest node is the one with the most "internal" links
            for (const jNode of groupedDic.nodes!) {
                const nodeWithLinkCount = { 'node': jNode, 'numberOfInternalLinks': 0 };
                const nodeName = nodeWithLinkCount.node.name;
                for (const kLink of links) {
                    let isInternalLink = false;
                    if (strEquals(kLink.source, nodeName) || strEquals(kLink.sourceChild, nodeName)) {
                        for (const lNode of groupedDic.nodes!) {
                            if (strEquals(kLink.target, lNode.name) || strEquals(kLink.targetChild, lNode.name)) {
                                isInternalLink = true;
                                break;
                            }
                        }
                    } else if (strEquals(kLink.target, nodeName) || strEquals(kLink.targetChild, nodeName)) {
                        for (const lNode of groupedDic.nodes!) {
                            if (strEquals(kLink.source, lNode.name) || strEquals(kLink.sourceChild, lNode.name)) {
                                isInternalLink = true;
                                break;
                            }
                        }
                    }
                    if (isInternalLink) {
                        nodeWithLinkCount.numberOfInternalLinks++;
                    }
                }
                if (!nodeWithMostNumberOfInternalLinks || nodeWithLinkCount.numberOfInternalLinks > nodeWithMostNumberOfInternalLinks.numberOfInternalLinks) {
                    nodeWithMostNumberOfInternalLinks = nodeWithLinkCount;
                }
            }
            groupedDic = nodeWithMostNumberOfInternalLinks!.node;
        }
    }
    return groupedDictionaryOfNodes;
}

export function getRadius(d: Node): number {
    let resultRadius = nodeRadiusSizes.node;
    if (d.size) {
        resultRadius = d.size;
    } else if (d.nodes) {
        resultRadius = nodeRadiusSizes.group;
        let biggestSize = d.nodes[0].size || nodeRadiusSizes.default;
        for (const iNode of d.nodes) {
            biggestSize = (iNode.size || nodeRadiusSizes.default) > biggestSize
                ? (iNode.size || nodeRadiusSizes.default)
                : biggestSize;
        }
        resultRadius = biggestSize > resultRadius ? biggestSize : resultRadius;
    }
    return resultRadius;
}

export function getHighlightedRadius(d: Node): number {
    const resultRadius = getRadius(d) + Math.sqrt(getRadius(d));
    return resultRadius;
}

// For Hulls
export function convexHulls(nodes: Node[]): Hull[] {
    const hulls: {[key: string]: Array<[number, number]>} = {};

    // create point sets
    for (const n of nodes) {
        if (n.nodes || !n.group) {
            continue;
        }
        const i: string = strToLowerOrEmpty(n.group);
        if (!hulls.hasOwnProperty(i)) {
            hulls[i] = [];
        }
        const offsetAndRadius = hullOffset + getRadius(n) + Math.sqrt(getRadius(n));
        hulls[i].push([(n.x || 0) - offsetAndRadius, (n.y || 0) - offsetAndRadius]);
        hulls[i].push([(n.x || 0) - offsetAndRadius, (n.y || 0) + offsetAndRadius]);
        hulls[i].push([(n.x || 0) + offsetAndRadius, (n.y || 0) - offsetAndRadius]);
        hulls[i].push([(n.x || 0) + offsetAndRadius, (n.y || 0) + offsetAndRadius]);
    }

    // create convex hulls
    const hullset: Hull[] = [];
    for (const i of Object.keys(hulls)) {
        const newHull = d3.polygonHull(hulls[i]);
        if (newHull) {
            hullset.push({ group: i, path: newHull });
        }
    }

    return hullset;
}

export function drawCluster(d: {path: Array<[number, number]>}): string | null {
    const curve = d3.line().curve(d3.curveCardinalClosed.tension(0.85));
    const clusterPath = curve(d.path);
    return clusterPath; // 0.8
}

export function getGroup(n: Node): string | null { return n.group || null; }
// End For Hulls

// Reusable transition
export function transitionLinear(duration: number): d3.Transition<d3.BaseType, any, any, any> { 
    return d3.transition()
        .duration(duration)
        .ease(d3.easeLinear) as any;
}

export function isNodeNotString(x: Node | string): x is Node {
    return typeof x !== "string";
}

export function isLinkNotNode(x: Node | Link): x is Link {
    return (x as Link).source !== undefined;
}

export function getNodeId(d: Node | string): string {
    let nodeId: string = '';
    if (isNodeNotString(d)) {
        if (d.name && d.group) {
            nodeId = d.group + '-' + d.name;
        } else if (d.name) {
            nodeId = d.name;
        } else if (d.group) {
            nodeId = d.group;
        }
    } else {
        nodeId = d;
    }
    return nodeId;
}

function getLinkSourceName(d: Link): string {
    if (d.sourceChild) {
        if (isNodeNotString(d.sourceChild)) {
            return d.sourceChild.name!;
        } else {
            return d.sourceChild
        }
    } else {
        if (isNodeNotString(d.source)) {
            return d.source.name!;
        } else {
            return d.source;
        }
    }
}

function getLinkTargetName(d: Link): string {
    if (d.targetChild) {
        if (isNodeNotString(d.targetChild)) {
            return d.targetChild.name!;
        } else {
            return d.targetChild
        }
    } else {
        if (isNodeNotString(d.target)) {
            return d.target.name!;
        } else {
            return d.target;
        }
    }
}

export function getLinkGradientId(d: Link) {
    const gradientId: string = "linkGrad-" + getLinkSourceName(d) + getLinkTargetName(d);
    return gradientId.replace(/ /g, "_").replace(/\(|\)/g, "__").replace(/[^A-Za-z\w\-\:\.]/g, "___");
}

// The Node Name or Group is used to identify the node
export function getNodeNameOrGroup(node: Node): string {
    return node.name || node.group || '';
}

export function getNodeNameAndGroup(node: Node): string {
    return (node.group || '') + '-' + (node.name || '');
}

export function getLinkSourceNameOrGroup(link: Link): string {
    return (typeof link.source === 'string') ? link.source : getNodeNameOrGroup(link.source);
}

export function getLinkTargetNameOrGroup(link: Link): string {
    return (typeof link.target === 'string') ? link.target : getNodeNameOrGroup(link.target);
}

// The title can be used to identify the node or link
export function getNodeOrLinkTitle(nodeOrLink: Node | Link): string {
    let title = '';
    if (isLinkNotNode(nodeOrLink)) {
        const sourceName = getLinkSourceNameOrGroup(nodeOrLink);
        const targetName = getLinkTargetNameOrGroup(nodeOrLink);;
        title = "Link: " + sourceName + " - " + targetName;
    } else {
        title = getNodeNameOrGroup(nodeOrLink);
    }
    return title;
}

export function doGroupsMatch(node1: Node, node2: Node): boolean {
    return node1 && node2 && node1.group != null && node2.group != null
    && strToLowerOrEmpty(node1.group) === strToLowerOrEmpty(node2.group);
}

export function findIndex(arr: any[], callback: (arg: any) => boolean): number {
    for (let i = 0; i < arr.length; i++) {
        if (callback(arr[i]) === true) {
            return i;
        }
    }
    return -1;
}

export function nodeTextShiftRight(d: Node, multiplier?: number) {
    const shiftRight = (getRadius(d) + 1) * (multiplier || 1.5);
    return "translate("+shiftRight+",0)";
}

export function nodeTextOpacity(d: Node): number {
    let opacity = 0;
    if (getRadius(d) >= 10) {
        opacity = 1;
    }
    return opacity;
}

export function darkenIfInvertedBackground(color: string, isInverted: boolean): string {
    return isInverted ? d3.hsl(color).darker(2).toString() : color;
}

export function setSimulationAlpha(simulation: d3.Simulation<Node, Link>) {
    simulation
        .alpha(1)
        .alphaMin(0.01)
        .alphaDecay(0.02)
        .alphaTarget(0);
}

/**
 * Safe, flexible string equals, case insensitive
 */
export function strEquals(val1: any | undefined, val2: any | undefined) {
    return val1 != null && val2 != null 
    && typeof val1 === 'string' && typeof val2 === 'string' 
    && val1.toLowerCase() === val2.toLowerCase();
}

export function strToLowerOrEmpty(val: string | undefined | null): string {
    return (val && val != null) ? val.toLowerCase() : '';
}