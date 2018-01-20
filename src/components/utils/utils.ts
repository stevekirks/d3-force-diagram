import * as d3 from 'd3';
import { schemePastel1 } from 'd3-scale-chromatic';
import { Superformula, SuperformulaTypes, SuperformulaTypeObject } from './superformula';
import { Link, Node, Hull } from '../data-interfaces';


export const nodeRadiusSizes = { default: 3, node: 3, group: 7 };
export const hullOffset = 15;
            
export function defaultNodeSuperformulaType(d: Node) {
    var shapeType = "circle";
    if (d.nodes) {
        shapeType = "circle"//"octagon";
    }
    return shapeType;
}

export function defaultNodeSuperformulaSize(d: Node) {
    return 2 * getRadius(d);
}

// Transform the list of nodes into groups
export function getBiggestNodesPerGroup(nodes: Node[], links: Link[]) {
    let groupedDictionaryOfNodes: { [key: string]: Node } = {};
    for (var i = 0; i < nodes.length; i++) {
        var group = nodes[i].group;
        if (group) {
            groupedDictionaryOfNodes[group] = groupedDictionaryOfNodes[group] || nodes[i];
            groupedDictionaryOfNodes[group] = (!groupedDictionaryOfNodes[group] || groupedDictionaryOfNodes[group].size < nodes[i].size)
                ? nodes[i]
                : groupedDictionaryOfNodes[group];
            if (!groupedDictionaryOfNodes[group].size) {
                groupedDictionaryOfNodes[group].size = getRadius(groupedDictionaryOfNodes[group]);
            }
        }
    }

    for (let groupedDicPropName of d3.keys(groupedDictionaryOfNodes)) {
        let groupedDic = groupedDictionaryOfNodes[groupedDicPropName];
        if (groupedDic.size === nodeRadiusSizes.default) {
            let nodeWithMostNumberOfInternalLinks = null;
            // If the biggest node is the default size, ensure the biggest node is the one with the most "internal" links
            for (let j = 0; j < groupedDic.nodes.length; j++) {
                let nodeWithLinkCount = { 'node': groupedDic.nodes[j], 'numberOfInternalLinks': 0 };
                let nodeName = nodeWithLinkCount.node.name;
                for (let k = 0; k < links.length; k++) {
                    let isInternalLink = false;
                    if (links[k].source === nodeName || links[k].sourceChild === nodeName) {
                        for (let l = 0; l < groupedDic.nodes.length; l++) {
                            if (links[k].target === groupedDic.nodes[l].name || links[k].targetChild === groupedDic.nodes[l].name) {
                                isInternalLink = true;
                                break;
                            }
                        }
                    } else if (links[k].target === nodeName || links[k].targetChild === nodeName) {
                        for (let l = 0; l < groupedDic.nodes.length; l++) {
                            if (links[k].source === groupedDic.nodes[l].name || links[k].sourceChild === groupedDic.nodes[l].name) {
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
            groupedDic = nodeWithMostNumberOfInternalLinks.node;
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
        for (let i = 0; i < d.nodes.length; i++) {
            biggestSize = (d.nodes[i].size || nodeRadiusSizes.default) > biggestSize
                ? (d.nodes[i].size || nodeRadiusSizes.default)
                : biggestSize;
        }
        resultRadius = biggestSize > resultRadius ? biggestSize : resultRadius;
    }
    return resultRadius;
}

export function getHighlightedRadius(d: Node) {
    var resultRadius = getRadius(d) + Math.sqrt(getRadius(d));
    return resultRadius;
}

// For Hulls
export function convexHulls(nodes: Node[], index: (n: Node) => string, offset: number) {
    let hulls: {[key: string]: [number, number][]} = {};

    // create point sets
    for (let k = 0; k < nodes.length; ++k) {
        let n = nodes[k];
        if (n.nodes) continue;
        let i = index(n);
        if (!i) {
            continue;
        }
        if (!hulls.hasOwnProperty(i)) {
            hulls[i] = [];
        }
        let offsetAndRadius = offset + getRadius(n) + Math.sqrt(getRadius(n));
        hulls[i].push([(n.x || 0) - offsetAndRadius, (n.y || 0) - offsetAndRadius]);
        hulls[i].push([(n.x || 0) - offsetAndRadius, (n.y || 0) + offsetAndRadius]);
        hulls[i].push([(n.x || 0) + offsetAndRadius, (n.y || 0) - offsetAndRadius]);
        hulls[i].push([(n.x || 0) + offsetAndRadius, (n.y || 0) + offsetAndRadius]);
    }

    // create convex hulls
    let hullset: Hull[] = [];
    for (let i in hulls) {
        hullset.push({ group: i, path: d3.polygonHull(hulls[i]) });
    }

    return hullset;
}

export function drawCluster(d: {path: [number, number][]}) {
    var curve = d3.line().curve(d3.curveCardinalClosed.tension(0.85));
    var clusterPath = curve(d.path);
    return clusterPath; // 0.8
}

export function getGroup(n: Node) { return n.group; }
// End For Hulls

// Reusable transition
export let transitionLinearSecond = d3.transition(null)
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
            return d.sourceChild.name;
        } else {
            return d.sourceChild
        }
    } else {
        if (isNodeNotString(d.source)) {
            return d.source.name;
        } else {
            return d.source;
        }
    }
}

function getLinkTargetName(d: Link): string {
    if (d.targetChild) {
        if (isNodeNotString(d.targetChild)) {
            return d.targetChild.name;
        } else {
            return d.targetChild
        }
    } else {
        if (isNodeNotString(d.target)) {
            return d.target.name;
        } else {
            return d.target;
        }
    }
}

export function getLinkGradientId(d: Link) {
    let gradientId: string = "linkGrad-" + getLinkSourceName(d) + getLinkTargetName(d);
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
        let sourceName = GetLinkSourceNameOrGroup(nodeOrLink);
        let targetName = GetLinkTargetNameOrGroup(nodeOrLink);;
        title = "Link: " + sourceName + " - " + targetName;
    } else {
        title = GetNodeNameOrGroup(nodeOrLink);
    }
    return title;
}

export function findIndex(arr: any[], callback: (arg: any) => boolean): number {
    for (let i = 0; i < arr.length; i++) {
        if (callback(arr[i]) == true) {
            return i;
        }
    }
    return -1;
}