import * as React from "react";
import * as diagram from './diagram';
import './app.css';

export interface AppProps { }
export interface AppState { inputHighlightText: string }

export class App extends React.Component<AppProps, AppState> {

    constructor(props: AppProps) {
        super(props);
        this.state = {
            inputHighlightText : ''
        }

        this.handleInputHighlightText = this.handleInputHighlightText.bind(this);
    }

    componentDidMount() {
        diagram.load();
    }

    handleInputHighlightText(event: React.ChangeEvent<HTMLInputElement>) {
        let newVal = event.currentTarget.value;
        this.setState({inputHighlightText: newVal})
        diagram.highlightNodes(newVal);
        event.preventDefault();
    }

    render() {
        return <div className="box">

            <div className="header">
                <h1>Diagram</h1>
                <div className="config-box">
                    Search
                    <input name="inputSearch" type="text" onChange={this.handleInputHighlightText} />
                    <button id="btnHighlight" onClick={() => diagram.highlightNodes(this.state.inputHighlightText)}>Highlight</button>
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