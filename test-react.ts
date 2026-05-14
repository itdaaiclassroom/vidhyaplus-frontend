import React from 'react';
import { renderToString } from 'react-dom/server';
import { ArucoMarkerSvg } from './src/components/ArucoMarkerSvg';

const html = renderToString(React.createElement(ArucoMarkerSvg, { id: 10, size: 110, fill: true, className: 'w-full h-full flex items-center justify-center' }));
console.log(html);
