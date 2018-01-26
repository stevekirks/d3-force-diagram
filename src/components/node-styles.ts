import * as d3 from 'd3';
import * as utils from './utils/utils';
import { Superformula, SuperformulaTypes, SuperformulaTypeObject } from './utils/superformula';
import * as constants from './constants';
import { Link, Node, Hull, NodeStateProperties } from './data-interfaces';
import { BaseType } from 'd3';

const defaultSupaDupaPath = new Superformula()
    .type(utils.defaultNodeSuperformulaType)
    .size(utils.defaultNodeSuperformulaSize)
    .segments(360);

const nodeStateDefault: NodeStateProperties = { 
    className: "node-state-default", 
    nodeTextShiftMultiplier: 1,
    shapeSuperformula: defaultSupaDupaPath
};
const nodeStateHighlight: NodeStateProperties = { 
    className: "node-state-highlight", 
    nodeTextShiftMultiplier: 1.5,
    shapeSuperformula: new Superformula()
        .type(utils.defaultNodeSuperformulaType)
        .size((d) => { 
            return 2 * utils.getHighlightedRadius(d); 
        })
};
const nodeStateSearch: NodeStateProperties = { 
    className: "node-state-search", 
    nodeTextShiftMultiplier: 1.8, 
    shapeSuperformula: new Superformula()
        .type(() => "gear")
        .size((d) => { 
            return 3 * utils.getHighlightedRadius(d); 
        })
};
const nodeStateHighlightNeighbour: NodeStateProperties = { 
    className: "node-state-highlight-neighbour", 
    nodeTextShiftMultiplier: 1.4, 
    shapeSuperformula: defaultSupaDupaPath
};
const nodeStateUnhighlighted: NodeStateProperties = { 
    className: "node-state-unhighlighted", 
    nodeTextShiftMultiplier: 1, 
    shapeSuperformula: defaultSupaDupaPath
};
            
export class NodeStyles {

    mouseOverLock: any = {};
    mouseOutLock: any = {};
    showOnlyHighlighted: boolean = false;

    constructor() {
        this.nodeTextOpacity = this.nodeTextOpacity.bind(this);
    }

    applyDefault(nodeEles: d3.Selection<BaseType, Node, BaseType, any>) {
        clearStates(nodeEles);
        nodeEles.classed(nodeStateDefault.className, true);
        let nodeShape = nodeEles.selectAll(".node-shape");
        let nodeText = nodeEles.selectAll(".node-text");
        nodeShape
            .transition(utils.transitionLinearSecond)
            .attr("d", (d: Node) => nodeStateDefault.shapeSuperformula.getPath(d))
            .attr("stroke-width", (d: Node) => 1)
            .attr("stroke", (d: Node) => constants.colorScale(d.group))
            .attr("fill", (d: Node) => constants.colorScale(d.group))
            .style("stroke-opacity", 1)
            .style("fill-opacity", 1);
        nodeText
            .style("opacity", this.nodeTextOpacity)
            .attr("text-anchor", "right")
            .attr("dominant-baseline", "central")
            .attr("transform", (d: Node) => {
                return utils.nodeTextShiftRight(d);
            })
            .text((d: Node) => { return d.name || d.group });
    }

    applySearch(nodeEles: d3.Selection<BaseType, Node, BaseType, any>) {
        clearStates(nodeEles);
        nodeEles.classed(nodeStateSearch.className, true);
        let nodeShape = nodeEles.selectAll(".node-shape");
        let nodeText = nodeEles.selectAll(".node-text");
        let bigSuperdupaPath = new Superformula().type(() => "gear");
        nodeShape
            .transition()
            .duration(550)
            .attr("d", (d: Node) => bigSuperdupaPath.size((d) => { 
                return 5 * utils.getHighlightedRadius(d); 
            }).getPath(d))
            .attr("stroke", (d: Node) => constants.highlightColor)
            .attr("fill", (d: Node) => constants.highlightColor)
            .style("stroke-opacity", 1)
            .style("fill-opacity", 1)
            .transition()
            .duration(450)
            .attr("d", (d: Node) => nodeStateSearch.shapeSuperformula.getPath(d));
        nodeText
            .transition()
            .duration(750)
            .style("opacity", 1)
            .attr("transform", (d: Node) => {
                return utils.nodeTextShiftRight(d, nodeStateSearch.nodeTextShiftMultiplier);
            });
    }

    applyHighlight(nodeEles: d3.Selection<BaseType, Node, BaseType, any>) {
        clearStates(nodeEles);
        nodeEles.classed(nodeStateHighlight.className, true);
        let nodeShape = nodeEles.selectAll(".node-shape");
        let nodeText = nodeEles.selectAll(".node-text");
        nodeShape.transition()
            .duration(450)
            .attr("d", (d: Node) => nodeStateHighlight.shapeSuperformula.getPath(d))
            .attr("stroke", (d: Node) => constants.highlightColor)
            .attr("fill", (d: Node) => constants.highlightColor)
            .style("stroke-opacity", 1)
            .style("fill-opacity", 1);
        nodeText
            .transition()
            .duration(750)
            .style("opacity", 1)
            .attr("transform", (d: Node) => {
                return utils.nodeTextShiftRight(d, nodeStateHighlight.nodeTextShiftMultiplier);
            });
    }

    applyHighlightedNeighbour(nodeEles: d3.Selection<BaseType, Node, BaseType, any>) {
        clearStates(nodeEles);
        nodeEles.classed(nodeStateHighlightNeighbour.className, true);
        let nodeShape = nodeEles.selectAll(".node-shape");
        let nodeText = nodeEles.selectAll(".node-text");
        nodeShape.transition()
            .duration(750)
            .attr("d", (d: Node) => nodeStateHighlightNeighbour.shapeSuperformula.getPath(d))
            .attr("stroke", (d: Node) => constants.everythingElseColor)
            .attr("fill", (d: Node) => constants.everythingElseColor)
            .style("stroke-opacity", 1)
            .style("fill-opacity", 1);
        nodeText.transition()
            .duration(750)
            .style("opacity", 1);
    }

    applyUnhighlighted(nodeEles: d3.Selection<BaseType, Node, BaseType, any>) {
        clearStates(nodeEles);
        nodeEles.classed(nodeStateUnhighlighted.className, true);
        let nodeShape = nodeEles.selectAll(".node-shape");
        let nodeText = nodeEles.selectAll(".node-text");
        nodeShape.transition()
                .duration(750)
                .attr("d", (d: Node) => nodeStateUnhighlighted.shapeSuperformula.getPath(d))
                .attr("stroke", (d: Node) => constants.everythingElseColor)
                .attr("fill", (d: Node) => constants.everythingElseColor)
                .style("stroke-opacity", this.showOnlyHighlighted ? 0 : constants.everythingElseOpacity)
                .style("fill-opacity", this.showOnlyHighlighted ? 0 : constants.everythingElseOpacity);
        nodeText.transition()
                .duration(750)
                .style("opacity", 0)
                .attr("transform", (d) => {
                    return utils.nodeTextShiftRight(d as Node);
                });
    }

    applyMouseOver(nodeEles: d3.Selection<BaseType, Node, BaseType, any>) {
        let nodeState = getNodeStateProperties(nodeEles);
        let nodeShape = nodeEles.selectAll(".node-shape");
        let nodeText = nodeEles.selectAll(".node-text");
        // A transition can already occur on a node, therefore using a custom tween
        let mouseOverTransition = d3.select(this.mouseOverLock)
            .transition()
            .duration(200);
        mouseOverTransition
            .tween("style:stroke-width", function() {
                var i = d3.interpolateNumber(1, 10);
                return function(t) { nodeShape.style("stroke-width", i(t)); };
            });
        mouseOverTransition
            .tween("attr:transform", function() {
                let nodeData = nodeEles.data()[0];
                let shiftFrom = utils.nodeTextShiftRight(nodeData, nodeState.nodeTextShiftMultiplier);
                let shiftTo = utils.nodeTextShiftRight(nodeData, nodeState.nodeTextShiftMultiplier * 1.1);
                var i = d3.interpolateString(shiftFrom, shiftTo);
                return function(t) { 
                    nodeText.attr("transform", i(t)); 
                };
            });
        if (this.showOnlyHighlighted == false && Number(nodeText.style("opacity")) < 1) {
            nodeText.classed("temp-show", true);
            mouseOverTransition
                .tween("style:opacity", function() {
                    var i = d3.interpolateNumber(Number(nodeText.style("opacity")), 1);
                    return function(t) { nodeText.style("opacity", i(t)); };
                });
        }
    }

    applyMouseOut(nodeEles: d3.Selection<BaseType, Node, BaseType, any>) {
        let nodeState = getNodeStateProperties(nodeEles);
        let nodeShape = nodeEles.selectAll(".node-shape");
        let nodeText = nodeEles.selectAll(".node-text");
        // A transition can already occur on a node, therefore using a custom tween
        let mouseOutTransition = d3.select(this.mouseOutLock)
            .transition()
            .duration(200);
        mouseOutTransition
            .tween("style:stroke-width", function() {
                var i = d3.interpolateNumber(10, 1);
                return function(t) { nodeShape.style("stroke-width", i(t)); };
            });
        mouseOutTransition
            .tween("attr:transform", function() {
                let nodeData = nodeEles.data()[0];
                let shiftTo = utils.nodeTextShiftRight(nodeData, nodeState.nodeTextShiftMultiplier);
                let shiftFrom = utils.nodeTextShiftRight(nodeData, nodeState.nodeTextShiftMultiplier * 1.1);
                var i = d3.interpolateString(shiftFrom, shiftTo);
                return function(t) { nodeText.attr("transform", i(t)); };
            });
        if (nodeText.classed("temp-show")) {
            nodeText.classed("temp-show", false);
            mouseOutTransition
                .tween("style:opacity", function() {
                    var i = d3.interpolateNumber(1, 0);
                    return function(t) { nodeText.style("opacity", i(t)); };
                });
        }
    }

    nodeTextOpacity(d: Node): number {
        let opacity = 0;
        if (utils.getRadius(d) >= 10) {
            opacity = 1;
        }
        return opacity;
    }
}

function clearStates(nodeEles: d3.Selection<BaseType, Node, BaseType, any>) {
    nodeEles.classed(nodeStateDefault.className, false);
    nodeEles.classed(nodeStateHighlight.className, false);
    nodeEles.classed(nodeStateSearch.className, false);
    nodeEles.classed(nodeStateHighlightNeighbour.className, false);
    nodeEles.classed(nodeStateUnhighlighted.className, false);
}

function getNodeStateProperties(nodeEles: d3.Selection<BaseType, Node, BaseType, any>): NodeStateProperties {
    if (nodeEles.classed(nodeStateDefault.className)) {
        return nodeStateDefault;
    } else if (nodeEles.classed(nodeStateHighlight.className)) {
        return nodeStateHighlight;
    } else if (nodeEles.classed(nodeStateSearch.className)) {
        return nodeStateSearch;
    } else if (nodeEles.classed(nodeStateHighlightNeighbour.className)) {
        return nodeStateHighlightNeighbour;
    } else if (nodeEles.classed(nodeStateUnhighlighted.className)) {
        return nodeStateUnhighlighted;
    }
}