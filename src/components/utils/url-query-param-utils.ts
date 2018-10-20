export function getUrlParameter(sParam: string): string | null {
    const sPageURL = decodeURIComponent(window.location.search.substring(1));
    return getKeysFromString(sPageURL, sParam);
};

export function setUrlParameter(sParam: string, sValue: string) {
    const sPageURL = decodeURIComponent(window.location.search.substring(1));
    
    const sURLQueryParams = updateKeysInString(sPageURL, [{sParam, sValue}]);

    const queryFilters = "?" + sURLQueryParams;
    window.history.pushState({}, "", queryFilters);
};

const paramArraySeparator: string = "},{";

export function getUrlParameterAsArray(sParam: string): string[] {
    const paramValueStr = getUrlParameter(sParam);
    if (paramValueStr === null) {
        return [];
    }
    if (paramValueStr.length > 1) {
        const p = paramValueStr.substring(1, paramValueStr.length - 1);
        const paramValues = p.split(paramArraySeparator).map(s => s
            .replace(/zzamp/g,"&")
            .replace(/zzeq/g,"=")
            .replace(/zzhash/g,"#")
            .replace(/zzpercent/g,"%"));
        return paramValues;
    }
    return [];
}

export function setUrlParameterAsArray(sParam: string, sValueArray: string[]) {
    let sValue = '';
    if (sValueArray.length > 0) {
        sValue = "{" + sValueArray.map(s => s
            .replace(/&/g,"zzamp")
            .replace(/=/g,"zzeq")
            .replace(/#/g,"zzhash")
            .replace(/%/g,"zzpercent"))
            .join(paramArraySeparator) + "}";
    }
    setUrlParameter(sParam, sValue);
}

function getKeysFromString(keysString: string, sParam: string): string | null {
    const sURLVariables = keysString.split('&');
    for (const sUrlVariable of sURLVariables) {
        const sParameterName = sUrlVariable.split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? null : sParameterName[1];
        }
    }
    return null;
}

function updateKeysInString(keysString: string, paramPairs: Array<{sParam: string, sValue: string}>): string {
    const sURLVariables = keysString.length > 0 ? keysString.split('&') : [];
    for (const paramPair of paramPairs) {
        let parameterUpdated = false;
        for (let i = 0; i < sURLVariables.length; i++) {
            const sParameterName = sURLVariables[i].split('=');
    
            if (sParameterName[0] === paramPair.sParam) {
                sURLVariables[i] = paramPair.sParam+'='+(paramPair.sValue||'');
                parameterUpdated = true;
            }
        }
        if (parameterUpdated === false) {
            sURLVariables.push(paramPair.sParam+'='+(paramPair.sValue||''));
        }
    }
    return sURLVariables.join('&');
}