// Modified from source https://github.com/d3/d3-plugins/blob/master/superformula/superformula.js
import * as d3 from 'd3';

let _symbol = d3.symbol(),
    _line = d3.line();

class Superformula {
    _type: (d: any) => string;
    _size: (d: any) => number;
    _segments: number;

    constructor() {

        // defaults
        this._type = (d) => "circle";
        this._size = (d) => 1;
        this._segments = 360;

        this.getPath = this.getPath.bind(this);
    }
    
    type(f: (d: any) => string){
        this._type = f;
        return this;
    }
    size(f: (d: any) => number){
        this._size = f;
        return this;
    }
    segments(d: number){
        this._segments = d;
        return this;
    }

    getPath(d: any): string {
        let sType: SuperformulaTypeObject;
        let typeKey = this._type(d);
        if (_superformulaTypes.hasOwnProperty(typeKey)) {
            sType = _superformulaTypes[typeKey];
        }
        return this._superformulaPath(sType, this._segments, this._size(d));
    }

    allTypes(): string[] {
        return d3.keys(_superformulaTypes);
    }

    _superformulaPath(params: SuperformulaTypeObject, n: number, diameter: number): string {
        let i: number = -1,
            dt: number = 2 * Math.PI / n,
            t: number,
            r: number = 0,
            x: number,
            y: number;
        let ts: number[] = [];
        let points: [number, number][] = [];

        while (++i < n) {
            t = params.m * (i * dt - Math.PI) / 4;
            t = Math.pow(Math.abs(Math.pow(Math.abs(Math.cos(t) / params.a), params.n2)
            + Math.pow(Math.abs(Math.sin(t) / params.b), params.n3)), -1 / params.n1);
            if (t > r) r = t;
            ts.push(t);
        }

        r = diameter * Math.SQRT1_2 / r;
        i = -1; while (++i < n) {
            x = (t = ts[i] * r) * Math.cos(i * dt);
            y = t * Math.sin(i * dt);
            points.push([Math.abs(x) < 1e-6 ? 0 : x, Math.abs(y) < 1e-6 ? 0 : y]);
        }

        return _line(points) + "Z";
    }
}

interface SuperformulaTypeObject {
    m: number, n1: number, n2: number, n3: number, a: number, b: number
}

interface SuperformulaTypes {
    asterisk: SuperformulaTypeObject,
    bean: SuperformulaTypeObject,
    butterfly: SuperformulaTypeObject,
    circle: SuperformulaTypeObject,
    clover: SuperformulaTypeObject,
    cloverFour: SuperformulaTypeObject,
    cross: SuperformulaTypeObject,
    diamond: SuperformulaTypeObject,
    drop: SuperformulaTypeObject,
    ellipse: SuperformulaTypeObject,
    gear: SuperformulaTypeObject,
    heart: SuperformulaTypeObject,
    heptagon: SuperformulaTypeObject,
    octagon: SuperformulaTypeObject,
    hexagon: SuperformulaTypeObject,
    malteseCross: SuperformulaTypeObject,
    pentagon: SuperformulaTypeObject,
    rectangle: SuperformulaTypeObject,
    roundedStar: SuperformulaTypeObject,
    square: SuperformulaTypeObject,
    star: SuperformulaTypeObject,
    triangle: SuperformulaTypeObject,
    [key: string]: SuperformulaTypeObject
}

let _superformulaTypes: SuperformulaTypes = {
    asterisk: {m: 12, n1: .3, n2: 0, n3: 10, a: 1, b: 1},
    bean: {m: 2, n1: 1, n2: 4, n3: 8, a: 1, b: 1},
    butterfly: {m: 3, n1: 1, n2: 6, n3: 2, a: .6, b: 1},
    circle: {m: 4, n1: 2, n2: 2, n3: 2, a: 1, b: 1},
    clover: {m: 6, n1: .3, n2: 0, n3: 10, a: 1, b: 1},
    cloverFour: {m: 8, n1: 10, n2: -1, n3: -8, a: 1, b: 1},
    cross: {m: 8, n1: 1.3, n2: .01, n3: 8, a: 1, b: 1},
    diamond: {m: 4, n1: 1, n2: 1, n3: 1, a: 1, b: 1},
    drop: {m: 1, n1: .5, n2: .5, n3: .5, a: 1, b: 1},
    ellipse: {m: 4, n1: 2, n2: 2, n3: 2, a: 9, b: 6},
    gear: {m: 19, n1: 100, n2: 50, n3: 50, a: 1, b: 1},
    heart: {m: 1, n1: .8, n2: 1, n3: -8, a: 1, b: .18},
    heptagon: {m: 7, n1: 1000, n2: 400, n3: 400, a: 1, b: 1},
    octagon: {m: 8, n1: 1000, n2: 300, n3: 300, a: 1, b: 1},
    hexagon: {m: 6, n1: 1000, n2: 400, n3: 400, a: 1, b: 1},
    malteseCross: {m: 8, n1: .9, n2: .1, n3: 100, a: 1, b: 1},
    pentagon: {m: 5, n1: 1000, n2: 600, n3: 600, a: 1, b: 1},
    rectangle: {m: 4, n1: 100, n2: 100, n3: 100, a: 2, b: 1},
    roundedStar: {m: 5, n1: 2, n2: 7, n3: 7, a: 1, b: 1},
    square: {m: 4, n1: 100, n2: 100, n3: 100, a: 1, b: 1},
    star: {m: 6, n1: 90, n2: 100, n3: 100, a: 1, b: 1},
    triangle: {m: 3, n1: 100, n2: 200, n3: 200, a: 1, b: 1}
};

export { Superformula, SuperformulaTypes, SuperformulaTypeObject };