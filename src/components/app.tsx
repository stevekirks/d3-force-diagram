
import './app.css';
import './forms.css';
import * as diagram from './diagram';
import * as React from "react";

export interface AppState { 
    inputHighlightText: string, 
    showAllLabels: boolean, 
    showOnlyHighlighted: boolean, 
    hasHighlightedNodes: boolean,
    invertBackground: boolean,
    hasForceSimulation: boolean
}

export class App extends React.Component<{}, AppState> {

    constructor(props: {}) {
        super(props);
        this.state = {
            inputHighlightText : '',
            showAllLabels: false,
            showOnlyHighlighted: false,
            hasHighlightedNodes: false,
            invertBackground: false,
            hasForceSimulation: true
        }

        this.handleInputHighlightText = this.handleInputHighlightText.bind(this);
        this.handleShowAllLabels = this.handleShowAllLabels.bind(this);
        this.handleShowOnlyHighlighted = this.handleShowOnlyHighlighted.bind(this);
        this.highlightedNodeCountChanged = this.highlightedNodeCountChanged.bind(this);
        this.updateShowAllLabels = this.updateShowAllLabels.bind(this);
        this.updateInputHighlightText = this.updateInputHighlightText.bind(this);
        this.handleInvertBackground = this.handleInvertBackground.bind(this);
        this.handleHasForceSimulation = this.handleHasForceSimulation.bind(this);
        this.handleSearchForNodesClick = this.handleSearchForNodesClick.bind(this);
    }

    public componentDidMount() {
        diagram.load(this.highlightedNodeCountChanged);
    }

    public render() {
        return <div>

            <div className="header row">
                <h1 className="col-4">Service Registry Diagram</h1>
                <div className="col-8 config-box">
                    <label className={this.state.showOnlyHighlighted ? "disabled" : ""}>Search</label>
                    <input name="inputSearch" type="text" 
                        onChange={this.handleInputHighlightText} 
                        value={this.state.inputHighlightText} 
                        disabled={this.state.showOnlyHighlighted} />
                    <button id="btnHighlight" 
                        onClick={this.handleSearchForNodesClick}
                        disabled={this.state.showOnlyHighlighted}>Highlight</button>
                    <input id="chkboxShowAllLabels" type="checkbox" 
                        checked={this.state.showAllLabels} 
                        onChange={this.handleShowAllLabels} 
                        disabled={this.state.showOnlyHighlighted} />
                    <label htmlFor="chkboxShowAllLabels">Show all labels</label>
                    <input id="chkboxShowOnlyHighlighted" type="checkbox" 
                        checked={this.state.showOnlyHighlighted} 
                        onChange={this.handleShowOnlyHighlighted}
                        disabled={!this.state.hasHighlightedNodes} />
                    <label htmlFor="chkboxShowOnlyHighlighted">Show only highlighted</label>
                    <input id="chkboxInvertBackground" type="checkbox" 
                        checked={this.state.invertBackground} 
                        onChange={this.handleInvertBackground} />
                    <label htmlFor="chkboxInvertBackground">Invert Background</label>
                    <input id="chkboxHasForceSimulation" type="checkbox" 
                        checked={this.state.hasForceSimulation} 
                        onChange={this.handleHasForceSimulation} />
                    <label htmlFor="chkboxHasForceSimulation">Force</label>
                </div>
            </div>

            <div className="content">
                <div id="diagram" className={this.state.invertBackground ? "inverted" : ""} />
                <div id="info-box">
                    <h2 className="title"/>
                    <div className="notes"/>
                    <table className="table"/>
                    <div className="timestamp"/>
                </div>
            </div>

    </div>;
    }

    private highlightedNodeCountChanged(hasNodesHighlighed: boolean) {
        this.setState({hasHighlightedNodes: hasNodesHighlighed});
    }

    private updateShowAllLabels(showAllLabels: boolean) {
        this.setState({showAllLabels});
        diagram.showAllLabels(showAllLabels);
    }

    private updateInputHighlightText(txt: string) {
        this.setState({inputHighlightText: txt});
        diagram.searchForNodes(txt);
    }

    private handleSearchForNodesClick() {
        diagram.searchForNodes(this.state.inputHighlightText)
    }

    private handleInputHighlightText(event: React.ChangeEvent<HTMLInputElement>) {
        const newVal = event.currentTarget.value;
        this.updateInputHighlightText(newVal);
        event.preventDefault();
    }

    private handleShowAllLabels(event: React.ChangeEvent<HTMLInputElement>) {
        const newVal = event.currentTarget.checked;
        this.updateShowAllLabels(newVal);
    }

    private handleShowOnlyHighlighted(event: React.ChangeEvent<HTMLInputElement>) {
        const newVal = event.currentTarget.checked;
        this.setState({showOnlyHighlighted: newVal});
        diagram.showOnlyHighlighted(newVal);
        if (newVal === true && this.state.showAllLabels === true) {
            this.updateShowAllLabels(false);
        }
    }

    private handleInvertBackground(event: React.ChangeEvent<HTMLInputElement>) {
        const newVal = event.currentTarget.checked;
        this.setState({invertBackground: newVal});
        diagram.invertBackground(newVal);
    }

    private handleHasForceSimulation(event: React.ChangeEvent<HTMLInputElement>) {
        const newVal = event.currentTarget.checked;
        this.setState({hasForceSimulation: newVal});
        diagram.setHasForceSimulation(newVal);
    }
}