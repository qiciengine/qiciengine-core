A free JavaScript game engine library for making HTML5 games.
=======

### How to build

Here we use [npm-run-script](https://docs.npmjs.com/cli/run-script) to install dependent packages and build. 
```sh
npm run install-grunt-cli
npm run install-dev
npm run build
```

The commands above are defined in [package.json](package.json)
```js
"scripts": {
    "install-grunt-cli": "npm install -g grunt-cli",
    "install-dev": "npm install --only=dev",
    "build": "grunt default"
}
```