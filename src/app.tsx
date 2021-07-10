import './app.css';
import './forms.css';
import * as diagram from './diagram';
import { ChangeEvent, useEffect, useState } from 'react';
import { getUrlParameterAsArray, setUrlParameterAsArray, getUrlParameter, setUrlParameter } from './utils/url-query-param-utils';

export interface AppState {
  inputHighlightText: string;
  showAllLabels: boolean;
  showOnlyHighlighted: boolean;
  highlightedNodeNames: string[];
  invertBackground: boolean;
  hasForceSimulation: boolean;
}

const urlParamLabelShowOnlyHighlighted = 'showHlOnly';
const urlParamLabelHighlightedNodes = 'hlNodes';

let initShowOnlyHighlighted = getUrlParameter(urlParamLabelShowOnlyHighlighted) === 'y';
const initHighlightedNodeNames = getUrlParameterAsArray(urlParamLabelHighlightedNodes);
if (initShowOnlyHighlighted && initHighlightedNodeNames.length === 0) {
  setUrlParameter(urlParamLabelShowOnlyHighlighted, '');
  initShowOnlyHighlighted = false;
}

export default function App() {
  
  const [inputHighlightText, setInputHighlightText] = useState('');
  const [showAllLabels, setShowAllLabels] = useState(false);
  const [showOnlyHighlighted, setShowOnlyHighlighted] = useState(initShowOnlyHighlighted);
  const [highlightedNodeNames, setHighlightedNodeNames] = useState(initHighlightedNodeNames);
  const [invertBackground, setInvertBackground] = useState(false);
  const [hasForceSimulation, setHasForceSimulation] = useState(true);

  useEffect(() => {
    diagram.load(handleHighlightedNodesChanged, highlightedNodeNames, showOnlyHighlighted);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateShowAllLabels = (pShowAllLabels: boolean) => {
    setShowAllLabels(pShowAllLabels);
    diagram.showAllLabels(pShowAllLabels);
  }

  const updateInputHighlightText = (txt: string) => {
    setInputHighlightText(txt);
    diagram.searchForNodes(txt);
  }

  const handleHighlightedNodesChanged = (pHighlightedNodeNames: string[]) => {
    setHighlightedNodeNames(pHighlightedNodeNames);
    setUrlParameterAsArray(urlParamLabelHighlightedNodes, pHighlightedNodeNames);
    if (pHighlightedNodeNames.length === 0 && showOnlyHighlighted) {
      setShowOnlyHighlighted(false);
      setUrlParameter(urlParamLabelShowOnlyHighlighted, '');
    }
  }

  const handleSearchForNodesClick = () => {
    diagram.searchForNodes(inputHighlightText);
  }

  const handleInputHighlightText = (event: ChangeEvent<HTMLInputElement>) => {
    const newVal = event.currentTarget.value;
    updateInputHighlightText(newVal);
    event.preventDefault();
  }

  const handleShowAllLabels = (event: ChangeEvent<HTMLInputElement>) => {
    const newVal = event.currentTarget.checked;
    updateShowAllLabels(newVal);
  }

  const handleShowOnlyHighlighted = (event: ChangeEvent<HTMLInputElement>) => {
    const newVal = event.currentTarget.checked;
    setShowOnlyHighlighted(newVal);
    setUrlParameter(urlParamLabelShowOnlyHighlighted, newVal ? 'y' : '');
    diagram.showOnlyHighlighted(newVal);
    if (newVal === true && showAllLabels === true) {
      updateShowAllLabels(false);
    }
  }

  const handleInvertBackground = (event: ChangeEvent<HTMLInputElement>) => {
    const newVal = event.currentTarget.checked;
    setInvertBackground(newVal);
    diagram.invertBackground(newVal);
  }

  const handleHasForceSimulation = (event: ChangeEvent<HTMLInputElement>) => {
    const newVal = event.currentTarget.checked;
    setHasForceSimulation(newVal);
    diagram.setHasForceSimulation(newVal);
  }

  return (
    <div>
      <div className="header row">
        <h1 className="col-4">Service Registry Diagram</h1>
        <div className="col-8 config-box">
          <label className={showOnlyHighlighted ? 'disabled' : ''}>Search</label>
          <input
            name="inputSearch"
            type="text"
            onChange={handleInputHighlightText}
            value={inputHighlightText}
            disabled={showOnlyHighlighted}
          />
          <button id="btnHighlight" onClick={handleSearchForNodesClick} disabled={showOnlyHighlighted}>
            Highlight
          </button>
          <input
            id="chkboxShowAllLabels"
            type="checkbox"
            checked={showAllLabels}
            onChange={handleShowAllLabels}
            disabled={showOnlyHighlighted}
          />
          <label htmlFor="chkboxShowAllLabels">Show all labels</label>
          <input
            id="chkboxShowOnlyHighlighted"
            type="checkbox"
            checked={showOnlyHighlighted}
            onChange={handleShowOnlyHighlighted}
            disabled={highlightedNodeNames.length === 0}
          />
          <label htmlFor="chkboxShowOnlyHighlighted">Show only highlighted</label>
          <input id="chkboxInvertBackground" type="checkbox" checked={invertBackground} onChange={handleInvertBackground} />
          <label htmlFor="chkboxInvertBackground">Invert Background</label>
          <input id="chkboxHasForceSimulation" type="checkbox" checked={hasForceSimulation} onChange={handleHasForceSimulation} />
          <label htmlFor="chkboxHasForceSimulation">Force</label>
        </div>
      </div>

      <div className="content">
        <div id="diagram" className={invertBackground ? 'inverted' : ''} />
        <div id="info-box">
          <h2 className="title">Diagram</h2>
          <div className="notes" />
          <table className="table" />
          <div className="timestamp" />
        </div>
      </div>
    </div>
  )
}
