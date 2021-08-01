<p align="right">
  <a href="https://github.com/stevekirks/d3-force-diagram/actions/workflows/deploy.yml">
    <img src="https://github.com/stevekirks/d3-force-diagram/actions/workflows/deploy.yml/badge.svg" alt="cd" />
  </a>
</p>

<h1 align="center">D3 Force Diagram | <a href="https://stevekirks.github.io/d3-force-diagram">Demo</a></h1>

Built using [Typescript](https://www.typescriptlang.org/) and [d3 v7](https://d3js.org/)

### Features
-   node highlighting (type in search field or click one or more nodes)
-   node dragging (click and drag a node)
-   node selection and display of metadata (single-click a node)
-   node hierarchy up to two levels in depth (double-click a node to explode or re-group)

### Usage
Clone this repository, copy the ./public/data file to ./dist/data, then run
```
npx parcel ./public/index.html
```
Parcel builds the source files into the ./dist folder and runs a web server.

### Data format
Sample data is stored in the `public/data` folder.
