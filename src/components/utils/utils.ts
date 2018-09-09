import * as d3 from 'd3';
import { schemePastel1 } from 'd3-scale-chromatic';
import { Link, Node, Hull } from '../data-interfaces';


export const nodeRadiusSizes = { default: 3, node: 3, group: 7 };
export const hullOffset = 15;
export const nodeStateNormal = "node-state-normal";
export const nodeStateHovered = "node-state-hover";
            
export function defaultNodeSuperformulaType(d: Node) {
    let shapeType = "circle";
    if (d.nodes) {
        shapeType = "circle"// "octagon";
    }
    return shapeType;
}

export function defaultNodeSuperformulaSize(d: Node) {
    return 2 * getRadius(d);
}

// Transform the list of nodes into groups
export function getBiggestNodesPerGroup(nodes: Node[], links: Link[]) {
    const groupedDictionaryOfNodes: { [key: string]: Node } = {};
    for (const node of nodes) {
        const group = node.group;
        if (group) {
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
                    if (kLink.source === nodeName || kLink.sourceChild === nodeName) {
                        for (const lNode of groupedDic.nodes!) {
                            if (kLink.target === lNode.name || kLink.targetChild === lNode.name) {
                                isInternalLink = true;
                                break;
                            }
                        }
                    } else if (kLink.target === nodeName || kLink.targetChild === nodeName) {
                        for (const lNode of groupedDic.nodes!) {
                            if (kLink.source === lNode.name || kLink.sourceChild === lNode.name) {
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

export function getRadius(d: Node) {
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

export function getHighlightedRadius(d: Node) {
    const resultRadius = getRadius(d) + Math.sqrt(getRadius(d));
    return resultRadius;
}

// For Hulls
export function convexHulls(nodes: Node[], index: (n: Node) => string, offset: number) {
    const hulls: {[key: string]: Array<[number, number]>} = {};

    // create point sets
    for (const n of nodes) {
        if (n.nodes) {
            continue;
        }
        const i = index(n);
        if (!i) {
            continue;
        }
        if (!hulls.hasOwnProperty(i)) {
            hulls[i] = [];
        }
        const offsetAndRadius = offset + getRadius(n) + Math.sqrt(getRadius(n));
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

export function drawCluster(d: {path: Array<[number, number]>}) {
    const curve = d3.line().curve(d3.curveCardinalClosed.tension(0.85));
    const clusterPath = curve(d.path);
    return clusterPath; // 0.8
}

export function getGroup(n: Node) { return n.group; }
// End For Hulls

// Reusable transition
export let transitionLinearSecond = d3.transition(undefined)
        .duration(1000)
        .ease(d3.easeLinear);

export function isNodeNotString(x: Node | string): x is Node {
    return typeof x !== "string";
}

export function isLinkNotNode(x: Node | Link): x is Link {
    return (x as Link).source !== undefined;
}

export function getNodeId(d: Node | string): string {
    return isNodeNotString(d) 
        ? (d.name ? d.group + '-' + d.name : d.group)
        : d;
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
    return gradientId.replace(/ /g, "");
}

// The Node Name or Group is used to identify the node
export function GetNodeNameOrGroup(node: Node): string {
    return node.name || node.group;
}

export function GetLinkSourceNameOrGroup(link: Link): string {
    return (typeof link.source === 'string') ? link.source : (link.source.name || link.source.group);
}

export function GetLinkTargetNameOrGroup(link: Link): string {
    return (typeof link.target === 'string') ? link.target : (link.target.name || link.target.group);
}

// The title can be used to identify the node or link
export function GetNodeOrLinkTitle(nodeOrLink: Node | Link): string {
    let title = '';
    if (isLinkNotNode(nodeOrLink)) {
        const sourceName = GetLinkSourceNameOrGroup(nodeOrLink);
        const targetName = GetLinkTargetNameOrGroup(nodeOrLink);;
        title = "Link: " + sourceName + " - " + targetName;
    } else {
        title = GetNodeNameOrGroup(nodeOrLink);
    }
    return title;
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
    const shiftRight = (getRadius(d) + 12) * (multiplier || 1);
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

export function simulationAlpha(simulation: d3.Simulation<Node, Link>) {
    simulation
        .alphaMin(0.001)
        .alphaTarget(0.05)
        .alphaDecay(0.04);
}