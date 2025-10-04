import { requireNativeView } from 'expo';
import * as React from 'react';

import { FileUtilModuleViewProps } from './FileUtilModule.types';

const NativeView: React.ComponentType<FileUtilModuleViewProps> = requireNativeView('FileUtil');

export default function MyModuleView(props: FileUtilModuleViewProps) {
  return <NativeView {...props} />;
}
