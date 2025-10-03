import React from 'react';
import { Svg, Path, Circle, Rect } from 'react-native-svg';
import { CustomRendererProps } from 'react-native-render-html';

export function SvgRenderer({ tnode }: CustomRendererProps<any>) {
  const props = tnode.domNode?.attribs || {};

  return (
    <Svg width={props.width || '100'} height={props.height || '100'} viewBox={props.viewBox}>
      {tnode.children.map((child: any, i: number) => {
        const cProps = child.domNode?.attribs || {};
        switch (child.tagName) {
          case 'path':
            return <Path key={i} {...cProps} />;
          case 'circle':
            return <Circle key={i} {...cProps} />;
          case 'rect':
            return <Rect key={i} {...cProps} />;
          default:
            return null;
        }
      })}
    </Svg>
  );
}
