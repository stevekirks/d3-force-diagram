import * as d3 from 'd3';
import { Superformula, SuperformulaTypes, SuperformulaTypeObject } from './utils/superformula';
import * as utils from './utils/utils';
import * as searchUtils from './utils/search-matching';
import { Link, Node, Hull } from './data-interfaces';
import * as constants from './constants';
import Tooltip from './utils/tooltip';
import { DiagramStyles } from './diagram-styles';
import { linkGradientColorEnd } from './constants';

export function load(highlightedNodesChangedCallbackArg: (hasHighlightedNodes: boolean) => void) {
    highlightedNodesChangedCallback = highlightedNodesChangedCallbackArg;

    prepare();

    
    // Show a loading message
    d3.select('#diagram')
        .append("h3")
        .classed("loading-info", true)
        .html("Loading. This shouldn't take more than a few seconds...");

    // Load the data
    const dataUrl: string = process.env.REACT_APP_DATA_SERVICES_URL!;
    d3.json(dataUrl).then(((response: {nodes: Node[], links: Link[]}) => {
        nodes = response.nodes;
        links = response.links;

        // Remove the loading message
        d3.select('#diagram').select(".loading-info").remove();

        // Show the data
        updateSimulation();
    }));
}

export function searchForNodes(searchText: string) {
    if (searchText === "") {
        highlightedNodes = [];
        hasSearchedForNodes = false;
    } else {
        const matchedNodes = searchUtils.SearchNodes(searchText, nodeElements);
        highlightedNodes = matchedNodes.data();
        hasSearchedForNodes = true;
    }
    highlightNodes();
}

export function showAllLabels(show: boolean) {
    if (show === true) {
        d3.selectAll('.node-text').style('opacity', 1);
    } else {
        highlightNodes();
    }
}

export function showOnlyHighlighted(show: boolean) {
    diagramStyles.showOnlyHighlighted = show;
    highlightNodes();
}

export function invertBackground(invert: boolean) {
    diagramStyles.invertedBackground = invert;
    highlightNodes();
}

export function setHasForceSimulation(dropForce: boolean) {
    hasForceSimulation = dropForce;
    updateSimulation();
}

let highlightedNodesChangedCallback: (hasHighlightedNodes: boolean) => void;

let nodes: Node[];
let highlightedNodes: Node[] = [];
let links: Link[];
let biggestNodePerGroup: { [key: string]: Node };

let diagramWidth: number;
let diagramHeight: number;
const nodePadding = 1.5;
const clusterPadding = 6;
const rainbow = d3.interpolateRainbow;

let nodeElements: d3.Selection<d3.BaseType, Node, d3.BaseType, any>;
let linkElements: d3.Selection<d3.BaseType, Link, d3.BaseType, any>;
let linkGradients: d3.Selection<d3.BaseType, Link, d3.BaseType, any>;
let hullElements: d3.Selection<d3.BaseType, Hull, d3.BaseType, any>;

let svg: d3.Selection<d3.BaseType, any, HTMLElement, any>;
let svgDefs: d3.Selection<d3.BaseType, any, HTMLElement, any>;

let hasSearchedForNodes: boolean = false;
let hasForceSimulation: boolean = true;

// let tooltip: Tooltip; // Not currently used, but it works if needed

const defaultSuperdupaPath = new Superformula()
            .type(utils.defaultNodeSuperformulaType)
			.size(utils.defaultNodeSuperformulaSize)
            .segments(360);

const diagramStyles = new DiagramStyles();

// zooming
let zoom: d3.ZoomBehavior<Element, {}>;
function zoomed() {
    svg.select(".links").attr("transform", d3.event.transform);
    svg.select(".nodes").attr("transform", d3.event.transform);
    svg.select(".hulls").attr("transform", d3.event.transform);
}
// Force Simulation
let simulation: d3.Simulation<Node, Link> = d3.forceSimulation<Node,Link>();

function prepare() {
    diagramWidth = Math.floor(Number(window.getComputedStyle(document.getElementById("diagram")!).width!.replace('px', ''))) - 10;
    diagramHeight = Math.floor(Number(window.getComputedStyle(document.getElementById("diagram")!).height!.replace('px', ''))) - 10;

    svg = d3.select('#diagram')
                .append("svg")
                .classed("graph-svg-diagram", true)
                .attr("width", diagramWidth)
                .attr("height", diagramHeight);
    
    svgDefs = svg.append("defs");

    svg.append("g") // first so it's not on top
			.classed("hulls", true);

    svg.append("g")
            .classed("links", true);

    svg.append("g") // last so it's on top
            .classed("nodes", true);

    // tooltip = new Tooltip(d3.select('#diagram'));

    // zooming
    zoom = d3.zoom()
        .scaleExtent([1, 40])
        .translateExtent([[0, 0], [diagramWidth, diagramHeight]])
        .on("zoom", zoomed);

    svg.call(zoom)
        .on("dblclick.zoom", null); // disable double-click zoom

    // Force Simulation
    simulation = d3.forceSimulation<Node,Link>()
        .force("link", d3.forceLink()
            .id((d: Node) => utils.GetNodeNameOrGroup(d))
            .distance((l: Link, i: number) => {
                const n1 = l.source;
                const n2 = l.target;
                let d: number = utils.nodeRadiusSizes.default;
                if (utils.isNodeNotString(n1) && utils.isNodeNotString(n2)) {
                    const combinedRadiuses: number = utils.getRadius(n1) + utils.getRadius(n2);
                    d = (n1.group === n2.group
                        ? combinedRadiuses
                        : combinedRadiuses * 5);
                }
                return d;
            })
            .strength((l: Link) => {
                let s: number = 0.3;
                if (typeof l.source !== "string" && typeof l.target !== "string") {
                    s = (l.source.group === l.target.group ? 0.01 : 0.3);
                }
                return s;
            })
            )
        .force("collide", d3.forceCollide().radius((d: Node) => utils.getRadius(d) + 20))
        .force("charge", d3.forceManyBody().strength(-500).distanceMin(100))
        .force("x", d3.forceX(diagramWidth / 2))
        .force("y", d3.forceY(diagramHeight / 2));
}

function tickHulls() {
    hullElements.data(utils.convexHulls(nodes, utils.getGroup, utils.hullOffset))
        .attr("d", utils.drawCluster);
}

function tickLinks() {
    linkElements
        .attr("x1", (d: Link) => { 
            return utils.isNodeNotString(d.source) && d.source.x ? d.source.x : 0; 
        })
        .attr("y1", (d: Link) => { 
            return utils.isNodeNotString(d.source) && d.source.y ? d.source.y : 0;
        })
        .attr("x2", (d: Link) => { 
            return utils.isNodeNotString(d.target) && d.target.x ? d.target.x : 0; 
        })
        .attr("y2", (d: Link) => { 
            return utils.isNodeNotString(d.target) && d.target.y ? d.target.y : 0; 
        });
    linkGradients
        .attr("x1", (d: Link) => { 
            return utils.isNodeNotString(d.source) && d.source.x ? d.source.x : 0; 
        })
        .attr("y1", (d: Link) => { 
            return utils.isNodeNotString(d.source) && d.source.y ? d.source.y : 0; })
        .attr("x2", (d: Link) => { 
            return utils.isNodeNotString(d.target) && d.target.x ? d.target.x : 0; 
        })
        .attr("y2", (d: Link) => { 
            return utils.isNodeNotString(d.target) && d.target.y ? d.target.y : 0; 
        });
}

function updateSimulation() {
    linkElements = svg.select(".links").selectAll("line").data(links, utils.getLinkGradientId);
    linkGradients = svgDefs.selectAll("linearGradient").data(links, utils.getLinkGradientId);

    nodeElements = svg.select(".nodes").selectAll(".node")
        .data(nodes, utils.getNodeId);

    hullElements = svg.select(".hulls").selectAll("path.hull").data(utils.convexHulls(nodes, utils.getGroup, utils.hullOffset));

    linkGradients.exit().remove();
    const linkGradientsEnter = linkGradients.enter()
        .append("linearGradient");
    linkGradientsEnter.append("stop");
    linkGradientsEnter.append("stop");
    diagramStyles.applyLinkGradientDefault(linkGradientsEnter);
    linkGradients = linkGradientsEnter.merge(linkGradients);

    linkElements.exit()
        .transition(utils.transitionLinearSecond)
        .style("stroke-opacity", 1e-6)
        .remove();
    const linkEnterElements = linkElements.enter().append("line");
    linkEnterElements
        .on("mouseover", function (d, i) { // note function (not lambda) is reqd for 'this'
            diagramStyles.applyLinkMouseOver(d3.select(this));
            // tooltip.Show(d3.select(this), 'a message');
        })
        .on("mouseout", function (d, i) {
            diagramStyles.applyLinkMouseOut(d3.select(this));
            // tooltip.Hide();
        })
        .on('click', PopulateInfoBox)
        .style("stroke-opacity", 1e-6);
    diagramStyles.applyLinkDefault(linkEnterElements);
    linkElements = linkEnterElements.merge(linkElements);

    nodeElements.exit()
        .transition(utils.transitionLinearSecond)
        .style("stroke-opacity", 1e-6)
        .style("fill-opacity", 1e-6)
        .remove();
    const drager: d3.DragBehavior<any, any, any> = d3.drag();
    drager
        .on("drag", dragged)
        .on("end", dragended);
    const nodeEnterElements = nodeElements.enter()
        .append("g")
        .classed("node", true);
    nodeEnterElements
        .on('mouseover', function (d, i) { // function (not lambda) is reqd for 'this'
            diagramStyles.applyNodeMouseOver(d3.select(this));
        })
        .on('mouseout', function (d, i) {
            diagramStyles.applyNodeMouseOut(d3.select(this));
        })
        .on('click', onNodeClick)
        .on('dblclick', onNodeDblclick)
        .call(drager);
    nodeEnterElements.append("path")
        .classed("node-shape", true);
    nodeEnterElements.append("text")
        .classed("node-text", true);
    diagramStyles.applyNodeDefault(nodeEnterElements);
    nodeElements = nodeEnterElements.merge(nodeElements);

    hullElements.exit()
        .transition(utils.transitionLinearSecond)
        .style("fill-opacity", 1e-6)
        .remove();
    const hullEnterElements = hullElements.enter().append("path")
        .classed("hull", true)
        .style("fill-opacity", 1e-6);
    diagramStyles.applyHullDefault(hullEnterElements);
    hullElements = hullEnterElements.merge(hullElements);
    
    biggestNodePerGroup = utils.getBiggestNodesPerGroup(nodes, links);

    simulation.nodes(nodes)
        .on("tick", () => {
            const alpha = simulation.alpha();

            // Force the node groups to cluster
            for (const d of nodes) {
                if (d.group) {
                    const biggestNode = biggestNodePerGroup[d.group];
                    if (biggestNode !== d) {
                        biggestNode.x = biggestNode.x || 0;
                        biggestNode.y = biggestNode.y || 0;
                        d.x = d.x || 0;
                        d.y = d.y || 0;
                        const x1 = d.x - biggestNode.x;
                        const y1 = d.y - biggestNode.y;
                        const l = Math.sqrt(x1 * x1 + y1 * y1); // dist between node and biggest node
                        const r = (utils.getRadius(d) * 1.6) + utils.getRadius(biggestNode); // ideal dist between node and biggest node
                        if (l !== r) {
                            // as decay falls from 1 to 0, set a mostly consistant multiplier with small peak
                            const alphaMultiplier = -0.9 * Math.pow(alpha - 1, 2) - 0.9 * (alpha - 1) + 0.7;
                            const l1 = l - r;
                            const t = (l1 / l);
                            const xr = ((1-t) * biggestNode.x) + (t * d.x);
                            const yr = ((1-t) * biggestNode.y) + (t * d.y);
                            const xd = d.x - xr;
                            const yd = d.y - yr;
                            d.x = (d.x || 0) - (xd * 0.49 * alphaMultiplier);
                            d.y = (d.y || 0) - (yd * 0.49 * alphaMultiplier);
                            const bxr = ((1-t) * d.x) + (t * biggestNode.x);
                            const byr = ((1-t) * d.y) + (t * biggestNode.y);
                            const bxd = biggestNode.x - bxr;
                            const byd = biggestNode.y - byr;
                            biggestNode.x -= (bxd * 0.49 * alphaMultiplier);
                            biggestNode.y -= (byd * 0.49 * alphaMultiplier);
                        }
                    }
                }
            }

            tickHulls();

            tickLinks();

            nodeElements
                .attr("transform", (d: Node) => {
                    // Keep nodes within boundary
                    d.x = Math.max((utils.getHighlightedRadius(d) + 10), Math.min(diagramWidth - (utils.getHighlightedRadius(d) + 10), (isNaN(d.x!) || d.x === 0 ? diagramWidth / 2 : d.x!)));
                    d.y = Math.max((utils.getHighlightedRadius(d) + 10), Math.min(diagramHeight - (utils.getHighlightedRadius(d) + 10), (isNaN(d.y!) || d.y === 0 ? diagramHeight / 2 : d.y!)));
                    return "translate(" + d.x + "," + d.y + ")"
                });
        });
    simulation.force<d3.ForceLink<Node, Link>>('link')!.links(links);
    utils.setSimulationAlpha(simulation);
    if (hasForceSimulation) {
        simulation.restart();
    } else {
        simulation.stop();
    }
}

let dragSimulationRestarted = false;
let nodeClickTimeoutId: number | null = null;
let nodeDragTimeoutId: number | null = null;

function dragged(d: Node, idx: any, n: any) {
    if (hasForceSimulation) {
        if (!dragSimulationRestarted) {
            simulation.alphaTarget(0.02).restart();
            dragSimulationRestarted = true;
        }
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    } else {
        d.x = d3.event.x;
        d.y = d3.event.y;
        d3.select(n[idx])
            .attr("transform", "translate(" + d.x + "," + d.y + ")");
        tickHulls();
        tickLinks();
    }
}

function dragended(d: Node) {
    if (hasForceSimulation) {
        if (!d3.event.active && dragSimulationRestarted) {
            dragSimulationRestarted = false;
            simulation.alphaTarget(0);
        }
        d.fx = null;
        d.fy = null;
    }
}

function onNodeClick(d: Node) {
    clearTimeout(nodeClickTimeoutId!);
    nodeClickTimeoutId = null;
    clearTimeout(nodeDragTimeoutId!);
    nodeDragTimeoutId = null;

    hasSearchedForNodes = false;

    // First check if the shift key is pressed
    if (d3.event.shiftKey) {
        // with shift key pressed, select multiple, or deselect an already selected node
        
        // check if node is already selected
        const highlightedNodeIdx = utils.findIndex(highlightedNodes, (hn: Node) => utils.GetNodeNameOrGroup(hn) === utils.GetNodeNameOrGroup(d));
        if (highlightedNodeIdx > -1) { // then remove node
            highlightedNodes.splice(highlightedNodeIdx, 1);
        } else { // highlight it
            highlightedNodes.push(d);
            PopulateInfoBox(d);
        }
        highlightNodes();
    } else {
        nodeClickTimeoutId = window.setTimeout(() => {
            // only do something if there wasnt a double-click
            if (nodeClickTimeoutId != null) {
                clearTimeout(nodeClickTimeoutId);
                nodeClickTimeoutId = null;
                
                PopulateInfoBox(d);
                highlightedNodes = [ d ];
                highlightNodes();
            }
        }, 200);
    }
}

function onNodeDblclick(d: Node) {
    clearTimeout(nodeDragTimeoutId!);
    nodeDragTimeoutId = null;

    if (!d3.event.shiftKey) {
        // cancel single click timer
        if (nodeClickTimeoutId != null) {
            clearTimeout(nodeClickTimeoutId);
            nodeClickTimeoutId = null;
        }
    
        if (d.nodes) { // A grouped node
            ungroupNodes(d);
        } else if (d.name) { // a single node
            regroupNodes(d);
        }

        // Clear any highlighted nodes (animation time causes issues if it's before the grouping)
        highlightedNodes = [];
        hasSearchedForNodes = false;
        highlightNodes();
    }
}

function ungroupNodes(d: Node) {
    // Set nodes to the coords of the parent (with random amount)
    for (const k1 of d.nodes!) {
        k1.x = d.x! + (((1 + Math.random()) * ((utils.getRadius(d) * 1.3) + utils.getRadius(k1))) * (Math.random() < 0.5 ? -1 : 1));
        k1.y = d.y! + (((1 + Math.random()) * ((utils.getRadius(d) * 1.3) + utils.getRadius(k1))) * (Math.random() < 0.5 ? -1 : 1));
    }
    // Remove grouped node and bring child nodes up to main array
    for (const k2 of nodes) {
        if (k2.group && k2.nodes && k2.group === d.group) {
            nodes.splice(nodes.indexOf(k2), 1);
            break;
        }
    }
    Array.prototype.push.apply(nodes, d.nodes);
    // Add internal links
    if (d.internalLinks) {
        for (const k3Link of d.internalLinks) {
            k3Link.target = k3Link.targetChild!;
            k3Link.source = k3Link.sourceChild!;
        }
        Array.prototype.push.apply(links, d.internalLinks);
        delete d.internalLinks;
    }
    // Update links
    for (const childMNode of d.nodes!) {
        for (const lLink of links) {
            if (lLink.targetChild
					&& ((typeof lLink.targetChild === 'string' && lLink.targetChild === childMNode.name)
					|| (utils.isNodeNotString(lLink.targetChild) && lLink.targetChild.name === childMNode.name))) {
                lLink.target = lLink.targetChild;
                delete lLink.targetChild;
            }
            if (lLink.sourceChild
					&& ((typeof lLink.sourceChild === 'string' && lLink.sourceChild === childMNode.name)
					|| (utils.isNodeNotString(lLink.sourceChild) && lLink.sourceChild.name === childMNode.name))) {
                lLink.source = lLink.sourceChild;
                delete lLink.sourceChild;
            }
        }
    }

    updateSimulation();
}

function regroupNodes(d: Node) {
    const newNodeGroup: Node = { 'group': d.group, 'nodes': [], x: d.x, y: d.y, 'internalLinks': [] };
    for (let k = 0; k < nodes.length; ++k) {
        const kNode = nodes[k];
        if (kNode.group === d.group) {
            // Group child nodes and remove from main array
            nodes.splice(k, 1);
            newNodeGroup.nodes!.push(kNode);
            // Update links
            for (const mLink of links) {
                if (((typeof mLink.target === 'string' && mLink.target === kNode.name)
                    || (utils.isNodeNotString(mLink.target) && mLink.target.name === kNode.name))
                    && (!mLink.targetChild || (utils.isNodeNotString(mLink.targetChild) ? mLink.targetChild.group !== kNode.name : true))) {
                    mLink.targetChild = mLink.target;
                    mLink.target = d.group;
                }
                if (((typeof mLink.source === 'string' && mLink.source === kNode.name)
                    || (utils.isNodeNotString(mLink.source) && mLink.source.name === kNode.name))
                    && (!mLink.sourceChild || (utils.isNodeNotString(mLink.sourceChild) ? mLink.sourceChild.group !== kNode.name : true))) {
                    mLink.sourceChild = mLink.source;
                    mLink.source = d.group;
                }
            }
            k--;
        }
    }
    // Pass through links again and get rid of internal links
    for (let m1 = 0; m1 < links.length; m1++) {
        const m1Link = links[m1];
        if (m1Link.target === d.group && m1Link.target === m1Link.source) {
            newNodeGroup.internalLinks!.push(m1Link);
            links.splice(m1, 1);
            m1--;
        }
    }
    nodes.push(newNodeGroup);

    updateSimulation();
}

function highlightNodes() {
    highlightedNodesChangedCallback(highlightedNodes.length > 0);
    if (highlightedNodes.length === 0) {
        diagramStyles.applyNodeDefault(nodeElements);
        diagramStyles.applyLinkDefault(linkElements);
        diagramStyles.applyLinkGradientDefault(linkGradients);
        diagramStyles.applyHullDefault(hullElements);
    } else {
        const matchedNodesData = highlightedNodes;
        const matchedNodes = searchUtils.GetMatchedNodes(matchedNodesData, nodeElements);
        const matchedLinks = searchUtils.GetMatchedLinks(matchedNodesData, linkElements, diagramStyles.showOnlyHighlighted);
        const matchedLinkGradients = searchUtils.GetMatchedLinks(matchedNodesData, linkGradients, diagramStyles.showOnlyHighlighted);
        const unmatchedLinks = searchUtils.GetUnmatchedLinks(matchedNodesData, linkElements, diagramStyles.showOnlyHighlighted);
        const unmatchedLinkGradients = searchUtils.GetUnmatchedLinks(matchedNodesData, linkGradients, diagramStyles.showOnlyHighlighted);
        const neighbourNodes = searchUtils.GetNeighbourNodes(matchedNodesData, matchedLinks.data(), nodeElements);
        const highlightedAndNeighbourNodesData = matchedNodesData.concat(neighbourNodes.data());
        const unmatchedNodes = searchUtils.GetUnmatchedNodes(highlightedAndNeighbourNodesData, nodeElements);
        const matchedHulls = searchUtils.GetMatchedHulls(matchedNodesData, hullElements);
        const unmatchedHulls = searchUtils.GetUnmatchedHulls(matchedHulls.data(), hullElements);

        if (hasSearchedForNodes === true) {
            diagramStyles.applyNodeSearch(matchedNodes);
        } else {
            diagramStyles.applyNodeHighlight(matchedNodes);
        }

        diagramStyles.applyNodeHighlightedNeighbour(neighbourNodes);
        diagramStyles.applyNodeUnhighlighted(unmatchedNodes);
        diagramStyles.applyLinkHighlight(matchedLinks);
        diagramStyles.applyLinkUnhighlighted(unmatchedLinks);
        diagramStyles.applyLinkGradientHighlight(matchedLinkGradients);
        diagramStyles.applyLinkGradientUnhighlighted(unmatchedLinkGradients);
        diagramStyles.applyHullHighlight(matchedHulls);
        diagramStyles.applyHullUnhighlighted(unmatchedHulls);
    }
}

// Info Box
function PopulateInfoBox(nodeOrLink: Node | Link) {
    const divServiceDetails = d3.select("#info-box");
    const title = utils.GetNodeOrLinkTitle(nodeOrLink);
    const notes = !utils.isLinkNotNode(nodeOrLink) ? (nodeOrLink.notes || '') : '';
    divServiceDetails.select(".title").text(title);
    divServiceDetails.select(".notes").text(notes);

    const tableElement = divServiceDetails.select(".table");
    divServiceDetails.select(".table")
        .selectAll("tr")
        .remove();

    const timestamp = nodeOrLink.timestamp || '';
    divServiceDetails.select(".timestamp").text(timestamp);

    if (nodeOrLink.details) { // node or link
        const tableData = d3.entries(nodeOrLink.details);
        tableElement
            .selectAll("tr")
                .data(tableData)
                .enter()
                .append("tr")
            .selectAll("tr")
                .data((row: { key: string, value: any }) => d3.values(row))
                .enter()
                .append("td")
                .text((d: string) => d);
    } else if (!utils.isLinkNotNode(nodeOrLink) && nodeOrLink.group && nodeOrLink.nodes) { // group
        tableElement
            .selectAll("tr")
                .data(nodeOrLink.nodes)
                .enter()
                .append("tr")
            .selectAll("td")
                .data((row: Node) => [row.name])
                .enter()
                .append("td")
                .text((d: string) => d);
    }
}