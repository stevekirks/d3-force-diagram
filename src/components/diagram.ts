import * as d3 from 'd3';
import { schemePastel1, schemeDark2 } from 'd3-scale-chromatic';
import { Superformula, SuperformulaTypes, SuperformulaTypeObject } from './utils/superformula';
import * as utils from './utils/utils';
import * as searchUtils from './utils/search-matching';
import { Link, Node, Hull } from './data-interfaces';
import Tooltip from './utils/tooltip';
declare var __DATA_SERVICES_URL__: string;

export function load() {

    prepare();

    // Show a loading message
    d3.select('#diagram')
        .append("h3")
        .classed("loading-info", true)
        .html("Loading. This shouldn't take more than a few seconds...");

    // Load the data
    d3.json(__DATA_SERVICES_URL__, (error, response: {nodes: Node[], links: Link[]}) => {
        if (!error) {
            nodes = response.nodes;
            links = response.links;

            // Remove the loading message
            d3.select('#diagram').select(".loading-info").remove();

            // Show the data
            updateSimulation();
        }
    });
}

let nodes: Node[];
let highlightedNodes: Node[] = [];
let links: Link[];
let biggestNodePerGroup: { [key: string]: Node };
let showAllDiagramLabels: boolean = false;

let diagramWidth: number;
let diagramHeight: number;
const nodePadding = 1.5;
const clusterPadding = 6;
const colorScale = d3.scaleOrdinal(schemeDark2.slice());
const rainbow = d3.interpolateRainbow;

let nodeElements: d3.Selection<d3.BaseType, Node, d3.BaseType, any>;
let linkElements: d3.Selection<d3.BaseType, Link, d3.BaseType, any>;
let linkGradients: d3.Selection<d3.BaseType, Link, d3.BaseType, any>;
let hullElements: d3.Selection<d3.BaseType, Hull, d3.BaseType, any>;

let svg: d3.Selection<d3.BaseType, any, HTMLElement, any>;
let svgDefs: d3.Selection<d3.BaseType, any, HTMLElement, any>;

//let tooltip: Tooltip; // Not currently used, but it works if needed

const defaultSuperdupaPath = new Superformula()
            .type(utils.defaultNodeSuperformulaType)
			.size(utils.defaultNodeSuperformulaSize)
            .segments(360);

// zooming
let zoom: d3.ZoomBehavior<Element, {}>;
function zoomed() {
    svg.select(".links").attr("transform", d3.event.transform);
    svg.select(".nodes").attr("transform", d3.event.transform);
    svg.select(".hulls").attr("transform", d3.event.transform);
}
// Force Simulation
let simulation: d3.Simulation<Node, Link>;

function prepare() {
    diagramWidth = document.getElementById("diagram").offsetWidth * 0.9;
    diagramHeight = document.getElementById("diagram").offsetWidth * 0.3;

    svg = d3.select('#diagram')
                .append("svg")
                .classed("graph-svg-diagram", true)
                .attr("width", diagramWidth)
                .attr("height", diagramHeight);
    
    svgDefs = svg.append("defs");

    svg.append("g") // first so it's not on top
			.attr("class", "hulls");

    svg.append("g")
            .attr("class", "links")
            .selectAll("line");

    svg.append("g") // last so it's on top
            .classed("nodes", true)
            .selectAll("path");

    //tooltip = new Tooltip(d3.select('#diagram'));

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
                            let n1 = l.source, n2 = l.target;
                            let d: number = utils.nodeRadiusSizes.default;
                            if (utils.isNodeNotString(n1) && utils.isNodeNotString(n2)) {
                                let combinedRadiuses: number = utils.getRadius(n1) + utils.getRadius(n2);
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

function updateGraph() {
    linkElements = svg.select(".links").selectAll("line").data(links, utils.getLinkGradientId);
    linkGradients = svgDefs.selectAll("linearGradient").data(links, utils.getLinkGradientId);

    nodeElements = svg.select(".nodes").selectAll(".node")
        .data(nodes, utils.getNodeId);

    hullElements = svg.select(".hulls").selectAll("path.hull").data(utils.convexHulls(nodes, utils.getGroup, utils.hullOffset));

    linkGradients.exit().remove();
    let linkGradientsEnter = linkGradients.enter()
        .append("linearGradient")
            .attr("id", utils.getLinkGradientId)
            .attr("gradientUnits", "userSpaceOnUse");
    linkGradientsEnter
        .append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#006eff");
    linkGradientsEnter
        .append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#87eeff");
    linkGradients = linkGradientsEnter.merge(linkGradients);

    linkElements.exit()
        .transition(utils.transitionLinearSecond)
        .style("stroke-opacity", 1e-6)
        .remove();
    const defaultLinkStrokeWidth = 1.5;
    let linkEnterElements = linkElements.enter().append("line")
        .attr("stroke-width", defaultLinkStrokeWidth)
        .attr("stroke", function (d) {
            return "url(#" + utils.getLinkGradientId(d) + ")";
        });
    linkEnterElements
        .on("mouseover", function (d, i) { // note function (not lambda) is reqd for 'this'
            d3.select(this).attr("stroke-width", defaultLinkStrokeWidth * 3);
            //tooltip.Show(d3.select(this), 'wadddddd up');
        })
        .on("mouseout", function (d, i) {
            d3.select(this).attr("stroke-width", defaultLinkStrokeWidth);
            //tooltip.Hide();
        })
        .on('click', PopulateInfoBox)
        .style("stroke-opacity", 1e-6)
        .transition(utils.transitionLinearSecond)
        .style("stroke-opacity", 1);
    linkElements = linkEnterElements.merge(linkElements);

    nodeElements.exit()
        .transition(utils.transitionLinearSecond)
        .style("stroke-opacity", 1e-6)
        .style("fill-opacity", 1e-6)
        .remove();
    let drager: d3.DragBehavior<any, any, any> = d3.drag();
    drager.on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    let nodeEnterElements = nodeElements.enter()
        .append("g")
        .attr("class", "node");
    const defaultNodeStrokeWidth = 1.5;
    nodeEnterElements
        .on('mouseover', function (d, i) { // function (not lambda) is reqd for 'this'
            d3.select(this).select(".node-shape")
                .attr("stroke-width", defaultNodeStrokeWidth * 3);
            let txtEle = d3.select(this).select("text");
            if (Number(txtEle.style("opacity")) === 0) {
                txtEle.classed("temp-show", true)
                    .transition()
                    .duration(200)
                    .style("opacity", 1);
            }
        })
        .on('mouseout', function (d, i) {
            d3.select(this).select(".node-shape")
                .attr("stroke-width", defaultNodeStrokeWidth);
            let txtEle = d3.select(this).select("text");
            if (txtEle.classed("temp-show")) {
                txtEle.classed("temp-show", false)
                    .transition()
                    .duration(200)
                    .style("opacity", 0);
            }
        })
        .on('click', onNodeClick)
        .on('dblclick', onNodeDblclick)
        .call(drager);
    nodeEnterElements.append("path")
            .attr("class", "node-shape")
            .attr("d", defaultSuperdupaPath.getPath)
            .attr("stroke", (d: Node) => colorScale(d.group))
            .attr("fill", (d: Node) => colorScale(d.group))
            .attr("stroke-width", defaultNodeStrokeWidth)
            .style("stroke-opacity", 1e-6)
            .style("fill-opacity", 1e-6)
            .transition(utils.transitionLinearSecond)
            .style("stroke-opacity", 1)
            .style("fill-opacity", 1);
    nodeEnterElements.append("text")
        .classed("node-text", true)
        .style("opacity", nodeTextOpacity)
        .attr("text-anchor", "right")
        .attr("dominant-baseline", "central")
        .attr("transform", (d) => {
            let shiftRight = utils.getRadius(d) + 12;
            return "translate("+shiftRight+",0)";
        })
        .text((d) => { return d.name || d.group });
    nodeElements = nodeEnterElements.merge(nodeElements);

    hullElements.exit()
        .transition(utils.transitionLinearSecond)
        .style("fill-opacity", 1e-6)
        .remove();
    let hullEnterElements = hullElements.enter().append("path")
        .attr("class", "hull")
        .attr("d", utils.drawCluster);
    hullEnterElements
        .style("fill", (d: Node) => colorScale(d.group))
        .style("fill-opacity", 1e-6)
        .transition(utils.transitionLinearSecond)
        .style("fill-opacity", 0.3);
    hullElements = hullEnterElements.merge(hullElements);
}

function updateSimulation() {
    updateGraph();

    biggestNodePerGroup = utils.getBiggestNodesPerGroup(nodes, links);

    simulation.nodes(nodes)
        .on("tick", () => {
            let alpha = simulation.alpha();

            for (let n1 = 0; n1 < nodes.length; n1++) {
                let d = nodes[n1];
                if (d.group) {
                    let biggestNode = biggestNodePerGroup[d.group];
                    if (biggestNode !== d) {
                        let x1 = d.x - biggestNode.x;
                        let y1 = d.y - biggestNode.y;
                        let l = Math.sqrt(x1 * x1 + y1 * y1);
                        let r = utils.getRadius(d) + utils.getRadius(biggestNode);
                        if (l != r) {
                            let ld = (((l - r) / l) * alpha);
                            x1 *= ld;
                            y1 *= ld;
                            nodes[n1].x -= (x1 * 2.8);
                            nodes[n1].y -= (y1 * 2.8);
                            biggestNode.x += x1;
                            biggestNode.y += y1;
                        }
                    }
                }
            }

            hullElements.data(utils.convexHulls(nodes, utils.getGroup, utils.hullOffset))
                .attr("d", utils.drawCluster);

            linkElements
                .attr("x1", (d: Link) => { 
                    return utils.isNodeNotString(d.source) ? d.source.x : 0; 
                })
                .attr("y1", (d: Link) => { 
                    return utils.isNodeNotString(d.source) ? d.source.y : 0;
                })
                .attr("x2", (d: Link) => { 
                    return utils.isNodeNotString(d.target) ? d.target.x : 0; 
                })
                .attr("y2", (d: Link) => { 
                    return utils.isNodeNotString(d.target) ? d.target.y : 0; 
                });
            linkGradients
                .attr("x1", (d: Link) => { 
                    return utils.isNodeNotString(d.source) ? d.source.x : 0; 
                })
                .attr("y1", (d: Link) => { 
                    return utils.isNodeNotString(d.source) ? d.source.y : 0; })
                .attr("x2", (d: Link) => { 
                    return utils.isNodeNotString(d.target) ? d.target.x : 0; 
                })
                .attr("y2", (d: Link) => { 
                    return utils.isNodeNotString(d.target) ? d.target.y : 0; 
                });

            nodeElements
                .attr("transform", (d: Node) => {
                    // Keep nodes within boundary
                    d.x = Math.max((utils.getHighlightedRadius(d) + 10), Math.min(diagramWidth - (utils.getHighlightedRadius(d) + 10), (isNaN(d.x) || d.x === 0 ? diagramWidth / 2 : d.x)));
                    d.y = Math.max((utils.getHighlightedRadius(d) + 10), Math.min(diagramHeight - (utils.getHighlightedRadius(d) + 10), (isNaN(d.y) || d.y === 0 ? diagramHeight / 2 : d.y)));
                    return "translate(" + d.x + "," + d.y + ")"
                });
        });
    simulation.force<d3.ForceLink<Node, Link>>('link').links(links);
    simulation.alphaTarget(0.05).restart();

    // set timeout so the diagram doesn't just keep circling forever
    setTimeout(() => {
        simulation.alphaTarget(0);
    }, 3000);
}

function dragstarted(d: Node) {
    d.fx = d.x;
    d.fy = d.y;
}

let dragSimulationRestarted = false;

function dragged(d: Node) {
    if (!dragSimulationRestarted) {
        simulation.alphaTarget(0.3).restart();
        dragSimulationRestarted = true;
    }
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d: Node) {
    dragSimulationRestarted = false;
    if (!d3.event.active) {
        simulation.alphaTarget(0);
    }
    d.fx = null;
    d.fy = null;
}

let nodeClickTimeoutId: number = null;

function onNodeClick(d: Node) {
    clearTimeout(nodeClickTimeoutId);
    nodeClickTimeoutId = null;

    // First check if the shift key is pressed
    if (d3.event.shiftKey) {
        // with shift key pressed, select multiple, or deselect an already selected node
        
        // check if node is already selected
        let highlightedNodeIdx = utils.findIndex(highlightedNodes, (hn: Node) => utils.GetNodeNameOrGroup(hn) == utils.GetNodeNameOrGroup(d));
        if (highlightedNodeIdx > -1) { // then remove node
            highlightedNodes.splice(highlightedNodeIdx, 1);
        } else { // highlight it
            highlightedNodes.push(d);
            PopulateInfoBox(d);
        }
        highlightNodes(false);
    } else {
        nodeClickTimeoutId = setTimeout(() => {
            // only do something if there wasnt a double-click
            if (nodeClickTimeoutId != null) {
                clearTimeout(nodeClickTimeoutId);
                nodeClickTimeoutId = null;
                
                PopulateInfoBox(d);
                highlightedNodes = [ d ];
                highlightNodes(false);
            }
        }, 200);
    }
}

function onNodeDblclick(d: Node) {
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
        highlightNodes(false);
    }
}

function nodeTextOpacity(d: Node): number {
    let opacity = 0;
    if (showAllDiagramLabels == true || utils.getRadius(d) >= 10) {
        opacity = 1;
    }
    return opacity;
}

function ungroupNodes(d: Node) {
    // Set nodes to the coords of the parent
    for (let k1 = 0; k1 < d.nodes.length; k1++) {
        d.nodes[k1].x = d.x;
        d.nodes[k1].y = d.y;
    }
    // Remove grouped node and bring child nodes up to main array
    for (let k2 = 0; k2 < nodes.length; k2++) {
        if (nodes[k2].group && nodes[k2].nodes && nodes[k2].group === d.group) {
            nodes.splice(k2, 1);
            break;
        }
    }
    Array.prototype.push.apply(nodes, d.nodes);
    // Add internal links
    if (d.internalLinks) {
        for (let k3 = 0; k3 < d.internalLinks.length; k3++) {
            let k3Link = d.internalLinks[k3];
            d.internalLinks[k3].target = k3Link.targetChild;
            d.internalLinks[k3].source = k3Link.sourceChild;
        }
        Array.prototype.push.apply(links, d.internalLinks);
        delete d.internalLinks;
    }
    // Update links
    for (let m = 0; m < d.nodes.length; m++) {
        let childMNode = d.nodes[m];
        for (let l = 0; l < links.length; l++) {
            let lLink = links[l];
            if (lLink.targetChild
					&& ((typeof lLink.targetChild === 'string' && lLink.targetChild === childMNode.name)
					|| (utils.isNodeNotString(lLink.targetChild) && lLink.targetChild.name === childMNode.name))) {
                links[l].target = lLink.targetChild;
                delete links[l].targetChild;
            }
            if (lLink.sourceChild
					&& ((typeof lLink.sourceChild === 'string' && lLink.sourceChild === childMNode.name)
					|| (utils.isNodeNotString(lLink.sourceChild) && lLink.sourceChild.name === childMNode.name))) {
                links[l].source = lLink.sourceChild;
                delete links[l].sourceChild;
            }
        }
    }

    updateSimulation();
}

function regroupNodes(d: Node) {
    let newNodeGroup: Node = { 'group': d.group, 'nodes': [], x: d.x, y: d.y, 'internalLinks': [] };
    for (let k = 0; k < nodes.length; ++k) {
        let kNode = nodes[k];
        if (kNode.group === d.group) {
            // Group child nodes and remove from main array
            nodes.splice(k, 1);
            newNodeGroup.nodes.push(kNode);
            // Update links
            for (let m = 0; m < links.length; m++) {
                let mLink = links[m];
                if (((typeof mLink.target === 'string' && mLink.target === kNode.name)
                    || (utils.isNodeNotString(mLink.target) && mLink.target.name === kNode.name))
                    && (!mLink.targetChild || (utils.isNodeNotString(mLink.targetChild) ? mLink.targetChild.group !== kNode.name : true))) {
                    links[m].targetChild = mLink.target;
                    links[m].target = d.group;
                }
                if (((typeof mLink.source === 'string' && mLink.source === kNode.name)
                    || (utils.isNodeNotString(mLink.source) && mLink.source.name === kNode.name))
                    && (!mLink.sourceChild || (utils.isNodeNotString(mLink.sourceChild) ? mLink.sourceChild.group !== kNode.name : true))) {
                    links[m].sourceChild = mLink.source;
                    links[m].source = d.group;
                }
            }
            k--;
        }
    }
    // Pass through links again and get rid of internal links
    for (let m1 = 0; m1 < links.length; m1++) {
        let m1Link = links[m1];
        if (m1Link.target === d.group && m1Link.target === m1Link.source) {
            newNodeGroup.internalLinks.push(m1Link);
            links.splice(m1, 1);
            m1--;
        }
    }
    nodes.push(newNodeGroup);

    updateSimulation();
}

export function searchForNodes(searchText: string) {
    if (searchText === "") {
        highlightedNodes = [];
    } else {
        let matchedNodes = searchUtils.SearchNodes(searchText, nodeElements);
        highlightedNodes = matchedNodes.data();
    }
    highlightNodes(true);
}

function highlightNodes(makeNodesStandout: boolean) {
    if (highlightedNodes.length == 0) {
        nodeElements.selectAll(".node-shape").transition()
            .duration(750)
            .attr("d", defaultSuperdupaPath.getPath)
            .attr("stroke", (d: Node) => colorScale(d.group))
            .attr("fill", (d: Node) => colorScale(d.group))
            .style("stroke-opacity", 1)
            .style("fill-opacity", 1);
        nodeElements.selectAll(".node-text")
            .transition()
                .duration(750)
                .style("stroke-opacity", 1)
                .style("fill-opacity", 1);
        linkElements
            .transition()
                .duration(750)
                .style("stroke-opacity", 1);
        hullElements
            .transition()
                .duration(750)
                .style("fill", (d: Node) => colorScale(d.group))
                .style("fill-opacity", 0.3);
    } else {
        let matchedNodesData = highlightedNodes;
        let matchedNodes = searchUtils.GetMatchedNodes(matchedNodesData, nodeElements);
        let matchedLinks = searchUtils.GetMatchedLinks(matchedNodesData, linkElements);
        let unmatchedLinks = searchUtils.GetUnmatchedLinks(matchedNodesData, linkElements);
        let neighbourNodes = searchUtils.GetNeighbourNodes(matchedNodesData, matchedLinks.data(), nodeElements);
        let highlightedAndNeighbourNodesData = matchedNodesData.concat(neighbourNodes.data());
        let unmatchedNodes = searchUtils.GetUnmatchedNodes(highlightedAndNeighbourNodesData, nodeElements);
        let matchedHulls = searchUtils.GetMatchedHulls(matchedNodesData, hullElements);
        let unmatchedHulls = searchUtils.GetUnmatchedHulls(matchedHulls.data(), hullElements);

        // while originally I used easing, because we want to highlight already highlighted nodes I chose to use two transitions instead
        let eB = d3.easeBackOut.overshoot(10);

        const highlightColor = '#32f272';
        const everythingElseColor = '#31d8ea';
        const everythingElseOpacity = 0.2;
        
        if (makeNodesStandout == true) {
            let bigSuperdupaPath = new Superformula().type(() => "gear");
            let highlightedSuperdupaPath = new Superformula().type(() => "gear");
            matchedNodes.selectAll(".node-shape")
                .transition()
                .duration(550)
                .attr("d", bigSuperdupaPath.size((d) => { 
                    return 5 * utils.getHighlightedRadius(d); 
                }).getPath)
                .attr("stroke", (d: Node) => highlightColor)
                .attr("fill", (d: Node) => highlightColor)
                .style("stroke-opacity", 1)
                .style("fill-opacity", 1)
                .transition()
                .duration(450)
                .attr("d", highlightedSuperdupaPath.size((d) => { 
                    return 3 * utils.getHighlightedRadius(d); 
                }).getPath);
        } else {
            let bigDefaultSuperdupaPath = new Superformula().type(utils.defaultNodeSuperformulaType);
            matchedNodes.selectAll(".node-shape")
                .transition()
                .duration(450)
                .attr("d", bigDefaultSuperdupaPath.size((d) => { 
                    return 2 * utils.getHighlightedRadius(d); 
                }).getPath)
                .attr("stroke", (d: Node) => highlightColor)
                .attr("fill", (d: Node) => highlightColor)
                .style("stroke-opacity", 1)
                .style("fill-opacity", 1);
        }
        
        matchedNodes.selectAll(".node-text")
            .transition()
                .duration(750)
                .style("stroke-opacity", 1)
                .style("fill-opacity", 1);
        
        neighbourNodes.selectAll(".node-shape")
            .transition()
                .duration(750)
                .attr("d", defaultSuperdupaPath.getPath)
                .attr("stroke", (d: Node) => everythingElseColor)
                .attr("fill", (d: Node) => everythingElseColor)
                .style("stroke-opacity", 1)
                .style("fill-opacity", 1);
        neighbourNodes.selectAll(".node-text")
            .transition()
                .duration(750)
                .style("stroke-opacity", 1)
                .style("fill-opacity", 1);

        unmatchedNodes.selectAll(".node-shape")
            .transition()
                .duration(750)
                .attr("d", defaultSuperdupaPath.getPath)
                .attr("stroke", (d: Node) => everythingElseColor)
                .attr("fill", (d: Node) => everythingElseColor)
                .style("stroke-opacity", everythingElseOpacity)
                .style("fill-opacity", everythingElseOpacity);
        unmatchedNodes.selectAll(".node-text")
            .transition()
                .duration(750)
                .style("stroke-opacity", 1e-6)
                .style("fill-opacity", 1e-6);

        matchedLinks
            .transition()
                .duration(750)
                .style("stroke-opacity", 1);
        unmatchedLinks
            .transition()
                .duration(750)
                .style("stroke-opacity", everythingElseOpacity);

        matchedHulls
            .transition()
                .duration(750)
                .style("fill", highlightColor)
                .style("fill-opacity", 0.2);
        unmatchedHulls
            .transition()
                .duration(750)
                .style("fill", everythingElseColor)
                .style("fill-opacity", 0.08);
    }
}

export function showAllLabels(show: boolean) {
    showAllDiagramLabels = show;
    d3.selectAll('.node-text').style('opacity', nodeTextOpacity);
}

// Info Box
function PopulateInfoBox(nodeOrLink: Node | Link) {
    let divServiceDetails = d3.select("#info-box");
    let title = utils.GetNodeOrLinkTitle(nodeOrLink);
    let notes = !utils.isLinkNotNode(nodeOrLink) ? (nodeOrLink.notes || '') : '';
    divServiceDetails.select(".title").text(title);
    divServiceDetails.select(".notes").text(notes);

    let tableElement = divServiceDetails.select(".table");
    divServiceDetails.select(".table")
        .selectAll('tr')
        .remove();

    let timestamp = nodeOrLink.timestamp || '';
    divServiceDetails.select(".timestamp").text(timestamp);

    if (nodeOrLink.details) { // node or link
        let tableData = d3.entries(nodeOrLink.details);
        tableElement
            .data(tableData)
            .enter()
            .append('tr')
            .data((row, i) => d3.values(row))
            .enter()
            .append('td')
            .text(d => d);
    } else if (!utils.isLinkNotNode(nodeOrLink) && nodeOrLink.group && nodeOrLink.nodes) { // group
        tableElement
            .selectAll('tr')
            .data(nodeOrLink.nodes)
            .enter()
            .append('tr')
            .selectAll('td')
            .data((row, i) => [row.name])
            .enter()
            .append('td')
            .text(function (d) { return d; });
    }
}