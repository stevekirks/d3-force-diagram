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
    nodeTextShiftMultiplier: 1.2,
    shapeSuperformula: new Superformula()
        .type(utils.defaultNodeSuperformulaType)
        .size((d) => { 
            return 1.5 * utils.getHighlightedRadius(d); 
        })
};
const nodeStateSearch: NodeStateProperties = { 
    className: "node-state-search", 
    nodeTextShiftMultiplier: 1.2, 
    shapeSuperformula: new Superformula()
        .type(() => "gear")
        .size((d) => { 
            return 2 * utils.getHighlightedRadius(d); 
        })
};
const nodeStateHighlightNeighbour: NodeStateProperties = { 
    className: "node-state-highlight-neighbour", 
    nodeTextShiftMultiplier: 1.1, 
    shapeSuperformula: defaultSupaDupaPath
};
const nodeStateUnhighlighted: NodeStateProperties = { 
    className: "node-state-unhighlighted", 
    nodeTextShiftMultiplier: 1, 
    shapeSuperformula: defaultSupaDupaPath
};
            
export class DiagramStyles {

    public showOnlyHighlighted: boolean = false;
    public invertedBackground: boolean = false;
    private mouseOverLock: any = {};
    private mouseOutLock: any = {};

    public applyNodeDefault(nodeEles: d3.Selection<BaseType, Node, BaseType, any>) {
        clearStates(nodeEles);
        nodeEles.classed(nodeStateDefault.className, true);
        const nodeShape = nodeEles.selectAll(".node-shape");
        const nodeText = nodeEles.selectAll(".node-text");
        nodeShape
            .transition(utils.transitionLinearSecond)
            .attr("d", (d: Node) => nodeStateDefault.shapeSuperformula.getPath(d))
            .attr("stroke-width", (d: Node) => 1)
            .attr("stroke", (d: Node) => constants.colorScale(d.group))
            .attr("fill", (d: Node) => constants.colorScale(d.group))
            .style("stroke-opacity", 1)
            .style("fill-opacity", 1);
        nodeText
            .style("opacity", utils.nodeTextOpacity)
            .attr("text-anchor", "right")
            .attr("dominant-baseline", "central")
            .attr("transform", (d: Node) => {
                return utils.nodeTextShiftRight(d);
            })
            .text((d: Node) => d.name || d.group);
    }

    public applyNodeSearch(nodeEles: d3.Selection<BaseType, Node, BaseType, any>) {
        clearStates(nodeEles);
        nodeEles.classed(nodeStateSearch.className, true);
        const nodeShape = nodeEles.selectAll(".node-shape");
        const nodeText = nodeEles.selectAll(".node-text");
        const bigSuperdupaPath = new Superformula().type(() => "gear");
        nodeShape
            .transition()
            .duration(550)
            .attr("d", (d: Node) => bigSuperdupaPath.size((bd) => { 
                return 5 * utils.getHighlightedRadius(bd); 
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

    public applyNodeHighlight(nodeEles: d3.Selection<BaseType, Node, BaseType, any>) {
        clearStates(nodeEles);
        nodeEles.classed(nodeStateHighlight.className, true);
        const nodeShape = nodeEles.selectAll(".node-shape");
        const nodeText = nodeEles.selectAll(".node-text");
        nodeShape.transition()
            .duration(450)
            .attr("d", (d: Node) => nodeStateHighlight.shapeSuperformula.getPath(d))
            .attr("stroke", (d: Node) => utils.darkenIfInvertedBackground(constants.highlightColor, this.invertedBackground))
            .attr("fill", (d: Node) => utils.darkenIfInvertedBackground(constants.highlightColor, this.invertedBackground))
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

    public applyNodeHighlightedNeighbour(nodeEles: d3.Selection<BaseType, Node, BaseType, any>) {
        clearStates(nodeEles);
        nodeEles.classed(nodeStateHighlightNeighbour.className, true);
        const nodeShape = nodeEles.selectAll(".node-shape");
        const nodeText = nodeEles.selectAll(".node-text");
        nodeShape.transition()
            .duration(750)
            .attr("d", (d: Node) => nodeStateHighlightNeighbour.shapeSuperformula.getPath(d))
            .attr("stroke", (d: Node) => utils.darkenIfInvertedBackground(constants.everythingElseColor, this.invertedBackground))
            .attr("fill", (d: Node) => utils.darkenIfInvertedBackground(constants.everythingElseColor, this.invertedBackground))
            .style("stroke-opacity", 1)
            .style("fill-opacity", 1);
        nodeText.transition()
            .duration(750)
            .style("opacity", 1);
    }

    public applyNodeUnhighlighted(nodeEles: d3.Selection<BaseType, Node, BaseType, any>) {
        clearStates(nodeEles);
        nodeEles.classed(nodeStateUnhighlighted.className, true);
        const nodeShape = nodeEles.selectAll(".node-shape");
        const nodeText = nodeEles.selectAll(".node-text");
        nodeShape.transition()
                .duration(750)
                .attr("d", (d: Node) => nodeStateUnhighlighted.shapeSuperformula.getPath(d))
                .attr("stroke", (d: Node) => utils.darkenIfInvertedBackground(constants.everythingElseColor, this.invertedBackground))
                .attr("fill", (d: Node) => utils.darkenIfInvertedBackground(constants.everythingElseColor, this.invertedBackground))
                .style("stroke-opacity", this.showOnlyHighlighted ? 0 : constants.everythingElseOpacity)
                .style("fill-opacity", this.showOnlyHighlighted ? 0 : constants.everythingElseOpacity);
        nodeText.transition()
                .duration(750)
                .style("opacity", 0)
                .attr("transform", (d) => {
                    return utils.nodeTextShiftRight(d as Node);
                });
    }

    public applyNodeMouseOver(nodeEles: d3.Selection<BaseType, Node, BaseType, any>) {
        const nodeState = getNodeStateProperties(nodeEles);
        const nodeShape = nodeEles.selectAll(".node-shape");
        const nodeText = nodeEles.selectAll(".node-text");
        // A transition can already occur on a node, therefore using a custom tween
        const mouseOverTransition = d3.select(this.mouseOverLock)
            .transition()
            .duration(200);
        mouseOverTransition
            .tween("style:stroke-width", () => {
                const i = d3.interpolateNumber(1, 10);
                return (t: any) => { nodeShape.style("stroke-width", i(t)); };
            });
        mouseOverTransition
            .tween("attr:transform", () => {
                const nodeData = nodeEles.data()[0];
                const shiftFrom = utils.nodeTextShiftRight(nodeData, nodeState.nodeTextShiftMultiplier);
                const shiftTo = utils.nodeTextShiftRight(nodeData, nodeState.nodeTextShiftMultiplier * 1.1);
                const i = d3.interpolateString(shiftFrom, shiftTo);
                return (t: any) => { 
                    nodeText.attr("transform", i(t)); 
                };
            });
        if (this.showOnlyHighlighted === false && Number(nodeText.style("opacity")) < 1) {
            nodeText.classed("temp-show", true);
            mouseOverTransition
                .tween("style:opacity", () => {
                    const i = d3.interpolateNumber(Number(nodeText.style("opacity")), 1);
                    return (t: any) => { nodeText.style("opacity", i(t)); };
                });
        }
    }

    public applyNodeMouseOut(nodeEles: d3.Selection<BaseType, Node, BaseType, any>) {
        const nodeState = getNodeStateProperties(nodeEles);
        const nodeShape = nodeEles.selectAll(".node-shape");
        const nodeText = nodeEles.selectAll(".node-text");
        // A transition can already occur on a node, therefore using a custom tween
        const mouseOutTransition = d3.select(this.mouseOutLock)
            .transition()
            .duration(200);
        mouseOutTransition
            .tween("style:stroke-width", () => {
                const i = d3.interpolateNumber(10, 1);
                return (t: any) => { nodeShape.style("stroke-width", i(t)); };
            });
        mouseOutTransition
            .tween("attr:transform", () => {
                const nodeData = nodeEles.data()[0];
                const shiftTo = utils.nodeTextShiftRight(nodeData, nodeState.nodeTextShiftMultiplier);
                const shiftFrom = utils.nodeTextShiftRight(nodeData, nodeState.nodeTextShiftMultiplier * 1.1);
                const i = d3.interpolateString(shiftFrom, shiftTo);
                return (t: any) => { nodeText.attr("transform", i(t)); };
            });
        if (nodeText.classed("temp-show")) {
            nodeText.classed("temp-show", false);
            mouseOutTransition
                .tween("style:opacity", () => {
                    const i = d3.interpolateNumber(1, 0);
                    return (t: any) => { nodeText.style("opacity", i(t)); };
                });
        }
    }

    public applyLinkDefault(linkEles: d3.Selection<BaseType, Link, BaseType, any>) {
        linkEles
            .attr("stroke-width", constants.defaultLinkStrokeWidth)
            .attr("stroke", (d) => {
                return "url(#" + utils.getLinkGradientId(d) + ")";
            })
            .transition(utils.transitionLinearSecond)
            .style("stroke-opacity", 1);
    }

    public applyLinkHighlight(linkEles: d3.Selection<BaseType, Link, BaseType, any>) {
        linkEles
            .transition()
                .duration(750)
                .style("stroke-opacity", 1);
    }

    public applyLinkMouseOver(linkEles: d3.Selection<BaseType, Link, BaseType, any>) {
        linkEles
            .attr("stroke-width", constants.defaultLinkStrokeWidth * 3);
    }

    public applyLinkMouseOut(linkEles: d3.Selection<BaseType, Link, BaseType, any>) {
        linkEles
            .attr("stroke-width", constants.defaultLinkStrokeWidth);
    }

    public applyLinkUnhighlighted(linkEles: d3.Selection<BaseType, Link, BaseType, any>) {
        linkEles
            .transition()
                .duration(750)
                .style("stroke-opacity", this.showOnlyHighlighted ? 0 : constants.everythingElseOpacity);
    }

    public applyLinkGradientDefault(linkGradientEles: d3.Selection<BaseType, Link, BaseType, any>) {
        const stopOne = linkGradientEles.selectAll("stop:nth-child(1)");
        const stopTwo = linkGradientEles.selectAll("stop:nth-child(2)");
        linkGradientEles
            .attr("id", utils.getLinkGradientId)
            .attr("gradientUnits", "userSpaceOnUse");
        stopOne
            .attr("offset", "0%")
            .attr("stop-color", constants.linkGradientColorStart);
        stopTwo
            .attr("offset", "100%")
            .attr("stop-color", this.invertedBackground ? constants.linkGradientColorEndInverted : constants.linkGradientColorEnd);
    }

    public applyLinkGradientHighlight(linkGradientEles: d3.Selection<BaseType, Link, BaseType, any>) {
        linkGradientEles.selectAll("stop:nth-child(2)")
            .transition()
                .duration(750)
                .attr("stop-color", this.invertedBackground ? constants.linkGradientColorEndInverted : constants.linkGradientColorEnd);
    }

    public applyLinkGradientUnhighlighted(linkGradientEles: d3.Selection<BaseType, Link, BaseType, any>) {
        linkGradientEles.selectAll("stop:nth-child(2)")
            .transition()
                .duration(750)
                .attr("stop-color", this.invertedBackground ? constants.linkGradientColorEndInverted : constants.linkGradientColorEnd);
    }

    public applyHullDefault(hullEles: d3.Selection<BaseType, Hull, BaseType, any>) {
        hullEles
            .attr("d", utils.drawCluster)
            .transition()
                .duration(750)
                .style("fill", (d: Node) => constants.colorScale(d.group))
                .style("fill-opacity", 0.3);
    }

    public applyHullHighlight(hullEles: d3.Selection<BaseType, Hull, BaseType, any>) {
        hullEles
            .transition()
                .duration(750)
                .style("fill", constants.highlightColor)
                .style("fill-opacity", this.showOnlyHighlighted ? 0 : 0.2);
    }

    public applyHullUnhighlighted(hullEles: d3.Selection<BaseType, Hull, BaseType, any>) {
        hullEles
            .transition()
                .duration(750)
                .style("fill", constants.everythingElseColor)
                .style("fill-opacity", this.showOnlyHighlighted ? 0 : 0.08);
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
    return nodeStateDefault;
}