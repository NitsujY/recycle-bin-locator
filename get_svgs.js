const { renderToStaticMarkup } = require('react-dom/server.node');
const React = require('react');
const icons = require('@heroicons/react/24/outline');
const solidIcons = require('@heroicons/react/24/solid');

console.log('ArchiveBox', renderToStaticMarkup(React.createElement(icons.ArchiveBoxIcon)));
console.log('TrashIcon', renderToStaticMarkup(React.createElement(icons.TrashIcon)));
console.log('CubeIcon', renderToStaticMarkup(React.createElement(icons.CubeIcon)));
console.log('LightBulbIcon', renderToStaticMarkup(React.createElement(icons.LightBulbIcon)));
console.log('NewspaperIcon', renderToStaticMarkup(React.createElement(icons.NewspaperIcon)));
console.log('Cog6ToothIcon', renderToStaticMarkup(React.createElement(icons.Cog6ToothIcon)));
console.log('BoltIcon', renderToStaticMarkup(React.createElement(solidIcons.BoltIcon)));
