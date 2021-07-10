import * as d3 from 'd3';
import './tooltip.css';

export default class Tooltip {
  private TooltipElement: d3.Selection<HTMLDivElement, any, HTMLElement, any>;

  // On instantiation, set the relative parent that the x and y coordinates will be calculated from
  constructor(relativeParentElement: d3.Selection<Element, any, HTMLElement, any>) {
    this.TooltipElement = relativeParentElement
      .append('div')
      .classed('tooltip', true)
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('top', '0')
      .style('left', '0');
  }

  public Show(ele: d3.Selection<d3.BaseType, any, any, any>, html: string) {
    const bbox = (ele.node() as any).getBBox();
    this.TooltipElement.html(html)
      .style('top', bbox.y + bbox.height / 2 - 30 + 'px')
      .style('left', bbox.x + bbox.width / 2 + 'px')
      .transition()
      .duration(200)
      .style('opacity', 1);
  }

  public Hide() {
    this.TooltipElement.transition().duration(100).style('opacity', 0).transition().style('top', 0).style('left', 0);
  }
}
