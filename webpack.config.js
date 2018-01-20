const webpack = require('webpack');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
var path = require('path');
var nodeModulesPath = path.resolve(__dirname, 'node_modules');

module.exports = (env) => {
    const isDevBuild = !(env && env.prod);

    const extractSass = new ExtractTextPlugin({
        filename: "diagram.css",
        disable: isDevBuild
    });

    return {
        entry: "./src/index.tsx",
        output: {
            filename: "diagram.js",
            path: __dirname + "/dist"
        },
        devtool: "source-map",
        resolve: {
            extensions: [".ts", ".tsx", ".js", ".json"]
        },
        module: {
            rules: [
                { test: /\.tsx?$/, loader: "awesome-typescript-loader" },
                { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },
                //{ test: /\.css?$/, loader: "style-loader!css-loader" },
                {
                    test: /\.scss|css$/,
                    use: extractSass.extract({
                        use: [{
                            loader: "css-loader", options: { minimize: true }
                        }, {
                            loader: "sass-loader"
                        }],
                        // use style-loader in development
                        fallback: "style-loader"
                    })
                }
            ]
        },
        plugins: isDevBuild ? [
            extractSass
        ] : [
            extractSass,
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify('production')
            }),
            new webpack.optimize.UglifyJsPlugin()
        ]
    }
};