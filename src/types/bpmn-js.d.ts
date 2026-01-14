/**
 * Type declarations for bpmn-js modules
 * These modules don't ship with TypeScript declarations
 */

declare module 'bpmn-js/dist/bpmn-modeler.production.min.js' {
  import Modeler from 'bpmn-js/lib/Modeler';
  export default Modeler;
}

declare module 'bpmn-js/dist/bpmn-navigated-viewer.production.min.js' {
  import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
  export default NavigatedViewer;
}
