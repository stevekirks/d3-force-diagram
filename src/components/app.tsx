import * as React from "react";
import * as diagram from './diagram';
import './app.scss';
import './forms.scss';

export interface AppProps { }
export interface AppState { inputHighlightText: string, showAllLabels: boolean, showOnlyHighlighted: boolean, hasHighlightedNodes: boolean }

export class App extends React.Component<AppProps, AppState> {

    constructor(props: AppProps) {
        super(props);
        this.state = {
            inputHighlightText : '',
            showAllLabels: false,
            showOnlyHighlighted: false,
            hasHighlightedNodes: false
        }

        this.handleInputHighlightText = this.handleInputHighlightText.bind(this);
        this.handleShowAllLabels = this.handleShowAllLabels.bind(this);
        this.handleShowOnlyHighlighted = this.handleShowOnlyHighlighted.bind(this);
        this.highlightedNodeCountChanged = this.highlightedNodeCountChanged.bind(this);
        this.updateShowAllLabels = this.updateShowAllLabels.bind(this);
        this.updateInputHighlightText = this.updateInputHighlightText.bind(this);
    }

    componentDidMount() {
        diagram.load(this.highlightedNodeCountChanged);
    }

    highlightedNodeCountChanged(hasNodesHighlighed: boolean) {
        this.setState({hasHighlightedNodes: hasNodesHighlighed});
    }

    updateShowAllLabels(showAllLabels: boolean) {
        this.setState({showAllLabels: showAllLabels});
        diagram.showAllLabels(showAllLabels);
    }

    updateInputHighlightText(txt: string) {
        this.setState({inputHighlightText: txt});
        diagram.searchForNodes(txt);
    }

    handleInputHighlightText(event: React.ChangeEvent<HTMLInputElement>) {
        let newVal = event.currentTarget.value;
        this.updateInputHighlightText(newVal);
        event.preventDefault();
    }

    handleShowAllLabels(event: React.ChangeEvent<HTMLInputElement>) {
        let newVal = event.currentTarget.checked;
        this.updateShowAllLabels(newVal);
    }

    handleShowOnlyHighlighted(event: React.ChangeEvent<HTMLInputElement>) {
        let newVal = event.currentTarget.checked;
        this.setState({showOnlyHighlighted: newVal});
        diagram.showOnlyHighlighted(newVal);
        if (newVal == true && this.state.showAllLabels == true) {
            this.updateShowAllLabels(false);
        }
    }

    render() {
        let chkboxShowOnlyHighlighted = <span></span>;
        if (this.state.hasHighlightedNodes == true) {
            chkboxShowOnlyHighlighted = <div>
                <span className="spacer"></span>
                <input id="chkboxShowOnlyHighlighted" type="checkbox" checked={this.state.showOnlyHighlighted} onChange={this.handleShowOnlyHighlighted} />
                <label htmlFor="chkboxShowOnlyHighlighted">Show only highlighted</label>
            </div>;
        }

        return <div className="box">

            <div className="header">
                <h1>Diagram</h1>
                <div className="config-box">
                    <label>Search</label>
                    <input name="inputSearch" type="text" 
                        onChange={this.handleInputHighlightText} 
                        value={this.state.inputHighlightText} 
                        disabled={this.state.showOnlyHighlighted} />
                    <button id="btnHighlight" 
                        onClick={() => diagram.searchForNodes(this.state.inputHighlightText)}
                        disabled={this.state.showOnlyHighlighted}>Highlight</button>
                    <span className="spacer"></span>
                    <input id="chkboxShowAllLabels" type="checkbox" 
                        checked={this.state.showAllLabels} 
                        onChange={this.handleShowAllLabels} 
                        disabled={this.state.showOnlyHighlighted} />
                    <label htmlFor="chkboxShowAllLabels">Show all labels</label>
                    {chkboxShowOnlyHighlighted}
                </div>
            </div>

            <div className="content">
                <div id="diagram"></div>
                <div id="info-box">
                    <h2 className="title"></h2>
                    <div className="notes"></div>
                    <table className="table"></table>
                    <div className="timestamp"></div>
                </div>
            </div>

    </div>;
    }
}