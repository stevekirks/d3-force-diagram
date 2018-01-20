import * as d3 from 'd3';
import { Link, Node, Hull } from '../data-interfaces';
import * as utils from './utils';

// Search for nodes using given text (this is not an exact match)
export function SearchNodes(searchText: string, nodeElements: d3.Selection<d3.BaseType, Node, d3.BaseType, any>): d3.Selection<d3.BaseType, Node, d3.BaseType, any> {
    let matchedNodes = nodeElements
        .filter((d: Node) => {
            let title = utils.GetNodeOrLinkTitle(d);
            if (title.length > 0) {
                return title.toLowerCase().indexOf(searchText.toLowerCase()) !== -1;
            }
            return false;
        });
    return matchedNodes;
}

// Get the nodes matching those highlighted
export function GetMatchedNodes(highlightedNodes: Node[], nodeElements: d3.Selection<d3.BaseType, Node, d3.BaseType, any>): d3.Selection<d3.BaseType, Node, d3.BaseType, any> {
    let unmatchedNodes = nodeElements
        .filter((d: Node) => {
            let nodeNameOrGroup = utils.GetNodeNameOrGroup(d);
            if (nodeNameOrGroup.length > 0) {
                for (let i = 0; i < highlightedNodes.length; i++) {
                    let highlightedNode = highlightedNodes[i];
                    let highlightedNodeNameOrGroup = utils.GetNodeNameOrGroup(highlightedNode);
                    if (nodeNameOrGroup == highlightedNodeNameOrGroup) {
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
    let unmatchedNodes = nodeElements
        .filter((d: Node) => {
            let nodeNameOrGroup = utils.GetNodeNameOrGroup(d);
            if (nodeNameOrGroup.length > 0) {
                let matchesHighlightedNode = false;
                for (let i = 0; i < highlightedNodes.length; i++) {
                    let highlightedNode = highlightedNodes[i];
                    let highlightedNodeNameOrGroup = utils.GetNodeNameOrGroup(highlightedNode);
                    if (nodeNameOrGroup == highlightedNodeNameOrGroup) {
                        matchesHighlightedNode = true;
                        break;
                    }
                }
                return !matchesHighlightedNode;
            }
            return false;
        });
    return unmatchedNodes;
}

// Get the links to the highlighted nodes
export function GetMatchedLinks(highlightedNodes: Node[], linkElements: d3.Selection<d3.BaseType, Link, d3.BaseType, any>): d3.Selection<d3.BaseType, Link, d3.BaseType, any> {
    let matchedLinks = linkElements
        .filter((l: Link) => {
            let linkSourceNameOrGroup = utils.GetLinkSourceNameOrGroup(l);
            let linkTargetNameOrGroup = utils.GetLinkTargetNameOrGroup(l);
            // Either the source of the target must be a highlighted node
            for (let i = 0; i < highlightedNodes.length; i++) {
                let highlightedNode = highlightedNodes[i];
                let nodeNameOrGroup = utils.GetNodeNameOrGroup(highlightedNode);
                if (nodeNameOrGroup == linkSourceNameOrGroup || nodeNameOrGroup == linkTargetNameOrGroup) {
                    return true;
                }
            }
            return false;
        });
    return matchedLinks;
}

// Get the links with no direct connection to the highlighted nodes
export function GetUnmatchedLinks(highlightedNodes: Node[], linkElements: d3.Selection<d3.BaseType, Link, d3.BaseType, any>): d3.Selection<d3.BaseType, Link, d3.BaseType, any> {
    let unmatchedLinks = linkElements
        .filter((l: Link) => {
            let linkSourceNameOrGroup = utils.GetLinkSourceNameOrGroup(l);
            let linkTargetNameOrGroup = utils.GetLinkTargetNameOrGroup(l);
            // Neither the source of the target must be a highlighted node
            let matchesHighlightedNode = false;
            for (let i = 0; i < highlightedNodes.length; i++) {
                let highlightedNode = highlightedNodes[i];
                let nodeNameOrGroup = utils.GetNodeNameOrGroup(highlightedNode);
                if (nodeNameOrGroup == linkSourceNameOrGroup || nodeNameOrGroup == linkTargetNameOrGroup) {
                    matchesHighlightedNode = true;
                    break;
                }
            }
            return !matchesHighlightedNode;
        });
    return unmatchedLinks;
}

// Get the hulls with highlighted nodes inside
export function GetMatchedHulls(highlightedNodes: Node[], hullElements: d3.Selection<d3.BaseType, Hull, d3.BaseType, any>): d3.Selection<d3.BaseType, Hull, d3.BaseType, any> {
    let matchedHulls = hullElements
        .filter((h: Hull) => {
            if (h.group.length > 0) {
                for (let i = 0; i < highlightedNodes.length; i++) {
                    let highlightedNode = highlightedNodes[i];
                    if (h.group == highlightedNode.group) {
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
    let unmatchedHulls = hullElements
        .filter((h: Hull) => {
            if (h.group.length > 0) {
                let matchesHighlightedHull = false;
                for (let i = 0; i < highlightedHulls.length; i++) {
                    let highlightedHull = highlightedHulls[i];
                    if (h.group == highlightedHull.group) {
                        matchesHighlightedHull = true;
                        break;
                    }
                }
                return !matchesHighlightedHull;
            }
            return false;
        });
    return unmatchedHulls;
}

export function GetNeighbourNodes(highlightedNodes: Node[], highlightedLinks: Link[],
    nodeElements: d3.Selection<d3.BaseType, Node, d3.BaseType, any>): d3.Selection<d3.BaseType, Node, d3.BaseType, any> {
        // get list of nodes that are neighbours to the highlighted nodes
        let nodeNeighbourNamesOrGroups: string[] = [];
        let highlightedNodeNamesOrGroups: string[] = highlightedNodes.map(n => utils.GetNodeNameOrGroup(n));
        for (let i = 0; i < highlightedLinks.length; i++) {
            let highlightedLink = highlightedLinks[i];
            let linkSourceNameOrGroup = utils.GetLinkSourceNameOrGroup(highlightedLink);
            let linkTargetNameOrGroup = utils.GetLinkTargetNameOrGroup(highlightedLink);            
            if (highlightedNodeNamesOrGroups.some(nog => nog == linkSourceNameOrGroup) && !highlightedNodeNamesOrGroups.some(nog => nog == linkTargetNameOrGroup)) {
                // the target node is a neighbour
                nodeNeighbourNamesOrGroups.push(linkTargetNameOrGroup);
            } else if (!highlightedNodeNamesOrGroups.some(nog => nog == linkSourceNameOrGroup) && highlightedNodeNamesOrGroups.some(nog => nog == linkTargetNameOrGroup)) {
                // the source node is a neighbour
                nodeNeighbourNamesOrGroups.push(linkSourceNameOrGroup);
            }
        }
        // now that we have a list of nodes that are neighbours, filter by them
        let neighbourNodeElements = nodeElements.filter((n: Node) => {
            let nameOrGroup = utils.GetNodeNameOrGroup(n);
            return nodeNeighbourNamesOrGroups.indexOf(nameOrGroup) > -1;
        });
        return neighbourNodeElements;
}