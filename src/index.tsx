import './index.css';
import './forms.css';
import * as diagram from './diagram';
import { getUrlParameterAsArray, setUrlParameterAsArray, getUrlParameter, setUrlParameter } from './utils/url-query-param-utils';

const urlParamLabelShowOnlyHighlighted = 'showHlOnly';
const urlParamLabelHighlightedNodes = 'hlNodes';

let initShowOnlyHighlighted = getUrlParameter(urlParamLabelShowOnlyHighlighted) === 'y';
const initHighlightedNodeNames = getUrlParameterAsArray(urlParamLabelHighlightedNodes);
if (initShowOnlyHighlighted && initHighlightedNodeNames.length === 0) {
    setUrlParameter(urlParamLabelShowOnlyHighlighted, '');
    initShowOnlyHighlighted = false;
}

let inputHighlightText = '';
let showAllLabels = false;
let showOnlyHighlighted = initShowOnlyHighlighted;
let highlightedNodeNames = initHighlightedNodeNames;
let invertBackground = false;
let hasForceSimulation = true;

const setInputHighlightText = (pInputHighlightText: string) => {
    inputHighlightText = pInputHighlightText;
    (document.getElementById('inInputSearch') as HTMLInputElement).value = pInputHighlightText;
};

const setShowAllLabels = (pShowAllLabels: boolean) => {
    showAllLabels = pShowAllLabels;
    (document.getElementById('chkboxShowAllLabels') as HTMLInputElement).checked = pShowAllLabels;
};

const setShowOnlyHighlighted = (pShowOnlyHighlighted: boolean) => {
    showOnlyHighlighted = pShowOnlyHighlighted;
    (document.getElementById('lblSearch') as HTMLLabelElement).className = pShowOnlyHighlighted ? 'disabled' : '';
    (document.getElementById('inInputSearch') as HTMLInputElement).disabled = pShowOnlyHighlighted;
    (document.getElementById('btnHighlight') as HTMLButtonElement).disabled = pShowOnlyHighlighted;
    (document.getElementById('chkboxShowAllLabels') as HTMLInputElement).disabled = pShowOnlyHighlighted;
    (document.getElementById('chkboxShowOnlyHighlighted') as HTMLInputElement).checked = pShowOnlyHighlighted;
}

const setHighlightedNodeNames = (pHighlightedNodeNames: string[]) => {
    highlightedNodeNames = pHighlightedNodeNames;
    (document.getElementById('chkboxShowOnlyHighlighted') as HTMLButtonElement).disabled = pHighlightedNodeNames.length === 0;
}

const setInvertBackground = (pInvertBackground: boolean) => {
    invertBackground = pInvertBackground;
    (document.getElementById('chkboxInvertBackground') as HTMLInputElement).checked = pInvertBackground;
    (document.getElementById('diagram') as HTMLDivElement).className = pInvertBackground ? 'inverted' : '';
}

const setHasForceSimulation = (pHasForceSimulation: boolean) => {
    hasForceSimulation = pHasForceSimulation;
    (document.getElementById('chkboxHasForceSimulation') as HTMLInputElement).checked = pHasForceSimulation;
}

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

const handleInputHighlightText = (event: Event): void => {
    const newVal = (event.currentTarget as HTMLInputElement).value;
    updateInputHighlightText(newVal);
    event.preventDefault();
}

const handleShowAllLabels = (event: Event) => {
    const newVal = (event.currentTarget as HTMLInputElement).checked;
    updateShowAllLabels(newVal);
    console.log('handleShowAllLabels: ' + newVal);
}

const handleShowOnlyHighlighted = (event: Event) => {
    const newVal = (event.currentTarget as HTMLInputElement).checked;
    setShowOnlyHighlighted(newVal);
    setUrlParameter(urlParamLabelShowOnlyHighlighted, newVal ? 'y' : '');
    diagram.showOnlyHighlighted(newVal);
    if (newVal === true && showAllLabels === true) {
        updateShowAllLabels(false);
    }
}

const handleInvertBackground = (event: Event) => {
    const newVal = (event.currentTarget as HTMLInputElement).checked;
    setInvertBackground(newVal);
    diagram.invertBackground(newVal);
}

const handleHasForceSimulation = (event: Event) => {
    const newVal = (event.currentTarget as HTMLInputElement).checked;
    setHasForceSimulation(newVal);
    diagram.setHasForceSimulation(newVal);
}

const initialiseApp = () => {
    setInputHighlightText(inputHighlightText);
    setShowAllLabels(showAllLabels);
    setShowOnlyHighlighted(showOnlyHighlighted);
    setHighlightedNodeNames(highlightedNodeNames);
    setInvertBackground(invertBackground);
    setHasForceSimulation(hasForceSimulation);

    (document.getElementById('btnHighlight') as HTMLButtonElement).onclick = handleSearchForNodesClick;
    (document.getElementById('inInputSearch') as HTMLInputElement).addEventListener('input', handleInputHighlightText);
    (document.getElementById('chkboxShowAllLabels') as HTMLInputElement).onchange = handleShowAllLabels;
    (document.getElementById('chkboxShowOnlyHighlighted') as HTMLInputElement).onchange = handleShowOnlyHighlighted;
    (document.getElementById('chkboxInvertBackground') as HTMLInputElement).onchange = handleInvertBackground;
    (document.getElementById('chkboxHasForceSimulation') as HTMLInputElement).onchange = handleHasForceSimulation;
    diagram.load(handleHighlightedNodesChanged, highlightedNodeNames, showOnlyHighlighted);
}

window.onload = initialiseApp;