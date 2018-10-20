import * as d3 from 'd3';
import { Link, Node, Hull } from '../data-interfaces';
import * as utils from './utils';

// Search for nodes using given text (this is not an exact match)
export function SearchNodes(searchText: string, nodeElements: d3.Selection<d3.BaseType, Node, d3.BaseType, any>): d3.Selection<d3.BaseType, Node, d3.BaseType, any> {
    const matchedNodes = nodeElements
        .filter((d: Node) => {
            const title = utils.getNodeOrLinkTitle(d);
            if (title.length > 0) {
                return title.toLowerCase().indexOf(searchText.toLowerCase()) !== -1;
            }
            return false;
        });
    return matchedNodes;
}

// Get the nodes matching those highlighted
export function GetMatchedNodes(highlightedNodes: Node[], nodeElements: d3.Selection<d3.BaseType, Node, d3.BaseType, any>): d3.Selection<d3.BaseType, Node, d3.BaseType, any> {
    const unmatchedNodes = nodeElements
        .filter((d: Node) => {
            const nodeNameOrGroup = utils.getNodeNameOrGroup(d);
            if (nodeNameOrGroup.length > 0) {
                for (const highlightedNode of highlightedNodes) {
                    const highlightedNodeNameOrGroup = utils.getNodeNameOrGroup(highlightedNode);
                    if (utils.strEquals(nodeNameOrGroup, highlightedNodeNameOrGroup)) {
                        return true;
                    }
                }
            }
            return false;
        });
    return unmatchedNodes;
}

// Get the nodes not matching those highlighted
export function GetUnmatchedNodes(highlightedNodes: Node[], nodeElements: d3.Selection<d3.BaseType, Node, d3.BaseType, any>): d3.Selection<d3.BaseType, Node, d3.BaseType, any> {
    return nodeElements.filter(a => GetMatchedNodes(highlightedNodes, nodeElements).data().indexOf(a) === -1);
}

// Get the links to the highlighted nodes
export function GetMatchedLinks(highlightedNodes: Node[], linkElements: d3.Selection<d3.BaseType, Link, d3.BaseType, any>, onlyLinksWithHighlightedSourceAndTarget: boolean): d3.Selection<d3.BaseType, Link, d3.BaseType, any> {
    const matchedLinks = linkElements
        .filter((l: Link) => {
            const linkSourceNameOrGroup = utils.getLinkSourceNameOrGroup(l);
            const linkTargetNameOrGroup = utils.getLinkTargetNameOrGroup(l);
            let highlightedSourceFound = false;
            let highlightedTargetFound = false;
            // Either the source of the target must be a highlighted node
            for (const highlightedNode of highlightedNodes) {
                const nodeNameOrGroup = utils.getNodeNameOrGroup(highlightedNode);
                if (onlyLinksWithHighlightedSourceAndTarget === true) {
                    if (utils.strEquals(nodeNameOrGroup, linkSourceNameOrGroup)) {
                        highlightedSourceFound = true;
                    }
                    if (utils.strEquals(nodeNameOrGroup, linkTargetNameOrGroup)) {
                        highlightedTargetFound = true;
                    }
                }
                else if (utils.strEquals(nodeNameOrGroup, linkSourceNameOrGroup) || utils.strEquals(nodeNameOrGroup, linkTargetNameOrGroup)) {
                    return true;
                }
            }
            return highlightedSourceFound && highlightedTargetFound;
        });
    return matchedLinks;
}

// Get the links with no direct connection to the highlighted nodes
export function GetUnmatchedLinks(highlightedNodes: Node[], linkElements: d3.Selection<d3.BaseType, Link, d3.BaseType, any>, onlyLinksWithHighlightedSourceAndTarget: boolean): d3.Selection<d3.BaseType, Link, d3.BaseType, any> {
    return linkElements.filter(a => GetMatchedLinks(highlightedNodes, linkElements, onlyLinksWithHighlightedSourceAndTarget).data().indexOf(a) === -1);
}

// Get the hulls with highlighted nodes inside
export function GetMatchedHulls(highlightedNodes: Node[], hullElements: d3.Selection<d3.BaseType, Hull, d3.BaseType, any>): d3.Selection<d3.BaseType, Hull, d3.BaseType, any> {
    const matchedHulls = hullElements
        .filter((h: Hull) => {
            if (h.group.length > 0) {
                for (const highlightedNode of highlightedNodes) {
                    if (utils.strEquals(h.group, highlightedNode.group)) {
                        return true;
                    }
                }
            }
            return false;
        });
    return matchedHulls;
}

// Get the hulls with highlighted nodes inside
export function GetUnmatchedHulls(highlightedHulls: Hull[], hullElements: d3.Selection<d3.BaseType, Hull, d3.BaseType, any>): d3.Selection<d3.BaseType, Hull, d3.BaseType, any> {
    return hullElements.filter(a => GetMatchedHulls(highlightedHulls, hullElements).data().indexOf(a) === -1);
}

export function GetNeighbourNodes(highlightedNodes: Node[], highlightedLinks: Link[],
    nodeElements: d3.Selection<d3.BaseType, Node, d3.BaseType, any>): d3.Selection<d3.BaseType, Node, d3.BaseType, any> {
        // get list of nodes that are neighbours to the highlighted nodes
        const nodeNeighbourNamesOrGroups: string[] = [];
        const highlightedNodeNamesOrGroups: string[] = highlightedNodes.map(n => utils.getNodeNameOrGroup(n));
        for (const highlightedLink of highlightedLinks) {
            const linkSourceNameOrGroup = utils.getLinkSourceNameOrGroup(highlightedLink);
            const linkTargetNameOrGroup = utils.getLinkTargetNameOrGroup(highlightedLink);            
            if (highlightedNodeNamesOrGroups.some(nog => utils.strEquals(nog, linkSourceNameOrGroup)) && !highlightedNodeNamesOrGroups.some(nog => utils.strEquals(nog, linkTargetNameOrGroup))) {
                // the target node is a neighbour
                nodeNeighbourNamesOrGroups.push(linkTargetNameOrGroup);
            } else if (!highlightedNodeNamesOrGroups.some(nog => utils.strEquals(nog, linkSourceNameOrGroup)) && highlightedNodeNamesOrGroups.some(nog => utils.strEquals(nog, linkTargetNameOrGroup))) {
                // the source node is a neighbour
                nodeNeighbourNamesOrGroups.push(linkSourceNameOrGroup);
            }
        }
        // now that we have a list of nodes that are neighbours, filter by them
        const neighbourNodeElements = nodeElements.filter((n: Node) => {
            const nameOrGroup = utils.getNodeNameOrGroup(n);
            return nodeNeighbourNamesOrGroups.indexOf(nameOrGroup) > -1;
        });
        return neighbourNodeElements;
}