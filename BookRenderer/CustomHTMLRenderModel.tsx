import {
  HTMLElementModel,
  HTMLContentModel,
  defaultHTMLElementModels,
} from 'react-native-render-html';

// // Define <svg> as a block-level element with children
// export const customHTMLElementModels = {
//   svg: HTMLElementModel.fromCustomModel({
//     tagName: 'svg',
//     contentModel: HTMLContentModel.mixed, // allow children like <path>, <circle>, etc.
//   }),
//   path: HTMLElementModel.fromCustomModel({
//     tagName: 'path',
//     contentModel: HTMLContentModel.none, // self closing
//   }),
//   circle: HTMLElementModel.fromCustomModel({
//     tagName: 'circle',
//     contentModel: HTMLContentModel.none,
//   }),
//   rect: HTMLElementModel.fromCustomModel({
//     tagName: 'rect',
//     contentModel: HTMLContentModel.none,
//   }),
// };

// 👇 extend the default svg model
export const customHTMLElementModels = {
  svg: defaultHTMLElementModels.svg.extend({
    contentModel: HTMLContentModel.mixed,
    mixedUAStyles: {
      maxWidth: 300,
      maxHeight: 300, // or some safe cap
      width: 300,
      height: 'auto',
    },
  }),
  circle: defaultHTMLElementModels.span.extend({
    contentModel: HTMLContentModel.none, // self-closing
  }),
  path: defaultHTMLElementModels.span.extend({
    contentModel: HTMLContentModel.none,
  }),
  rect: defaultHTMLElementModels.span.extend({
    contentModel: HTMLContentModel.none,
  }),
};
