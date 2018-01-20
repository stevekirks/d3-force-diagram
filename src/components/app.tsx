import * as React from "react";
import * as diagram from './diagram';
import './app.scss';
import './forms.scss';

export interface AppProps { }
export interface AppState { inputHighlightText: string, showAllLabels: boolean }

export class App extends React.Component<AppProps, AppState> {

    constructor(props: AppProps) {
        super(props);
        this.state = {
            inputHighlightText : '',
            showAllLabels: false
        }

        this.handleInputHighlightText = this.handleInputHighlightText.bind(this);
        this.handleShowAllLabels = this.handleShowAllLabels.bind(this);
        this.updateInputHighlightText = this.updateInputHighlightText.bind(this);
    }

    componentDidMount() {
        diagram.load(this.updateInputHighlightText);
    }

    updateInputHighlightText(txt: string) {
        this.setState({inputHighlightText: txt});
        diagram.highlightNodes(txt);
    }

    handleInputHighlightText(event: React.ChangeEvent<HTMLInputElement>) {
        let newVal = event.currentTarget.value;
        this.updateInputHighlightText(newVal);
        event.preventDefault();
    }

    handleShowAllLabels(event: React.ChangeEvent<HTMLInputElement>) {
        let newVal = event.currentTarget.checked;
        this.setState({showAllLabels: newVal});
        diagram.showAllLabels(newVal);
    }

    render() {
        return <div className="box">

            <div className="header">
                <h1>Diagram</h1>
                <div className="config-box">
                    <label>Search</label>
                    <input name="inputSearch" type="text" onChange={this.handleInputHighlightText} value={this.state.inputHighlightText} />
                    <button id="btnHighlight" onClick={() => diagram.highlightNodes(this.state.inputHighlightText)}>Highlight</button>
                    <span className="spacer"></span>
                    <input id="chkboxShowAllLabels" type="checkbox" checked={this.state.showAllLabels} onChange={this.handleShowAllLabels} />
                    <label htmlFor="chkboxShowAllLabels">Show all labels</label>
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