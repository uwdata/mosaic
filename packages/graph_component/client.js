import { 
    Cosmograph, 
    CosmographHistogram, 
    CosmographSearch, 
    CosmographTimeline 
  } from '@cosmograph/cosmograph';
  import { throttle } from './util/throttle.js';
  
  export class CosmographClient {
    constructor(targetElement, histogramElement, searchElement, timelineElement) {
      // Create containers for all components
      this._element = targetElement || document.createElement('div');
      this._histogramElement = histogramElement || document.createElement('div');
      this._searchElement = searchElement || document.createElement('div');
      this._timelineElement = timelineElement || document.createElement('div');
  
      document.body.appendChild(this._element);
      document.body.appendChild(this._histogramElement);
      document.body.appendChild(this._searchElement);
      document.body.appendChild(this._timelineElement);
  
      // Initialize the main Cosmograph instance
      this._cosmograph = new Cosmograph(this._element, {
        nodeColor: (node) => node.color || '#b3b3b3',
        nodeSize: (node) => node.size || 4,
        linkWidth: 1,
        renderHoveredNodeRing: true,
        hoveredNodeRingColor: 'red',
        focusedNodeRingColor: 'yellow',
        showDynamicLabels: true,
        backgroundColor: '#222222',
      });
  
      // Initialize the Histogram component
      this._histogram = new CosmographHistogram(this._cosmograph, this._histogramElement, {
        accessor: (node) => node.size,
        barCount: 30,
      });
  
      // Initialize the Search component
      this._search = new CosmographSearch(this._cosmograph, this._searchElement, {
        accessors: [
          { label: 'name', accessor: (node) => node.name },
          { label: 'value', accessor: (node) => node.value },
        ],
        maxVisibleItems: 5,
        events: {
          onSelect: (node) => this.zoomToNode(node),
        },
      });
  
      // Initialize the Timeline component
      this._timeline = new CosmographTimeline(this._cosmograph, this._timelineElement, {
        accessor: (node) => node.time,
        animationSpeed: 50,
        events: {
          onAnimationPlay: () => console.log('Animation started'),
          onBarHover: (start, end) => console.log(`Hovered from ${start} to ${end}`),
        },
      });
  
      // Throttle updates for performance optimization
      this._requestUpdate = throttle(() => this.requestQuery(), true);
  
      // Attach event handlers
      this._cosmograph.onClick = this.onClick.bind(this);
      this._cosmograph.onZoom = this.onZoom.bind(this);
      this._cosmograph.onSimulationEnd = this.onSimulationEnd.bind(this);
    }
  
    /** Configuration Methods */
    setConfig(config) {
      this._cosmograph.setConfig(config);
      return this;
    }
  
    setData(nodes, links) {
      this._cosmograph.setData(nodes, links);
      this._histogram.setConfig({ data: nodes });
      this._search.setData(nodes);
      this._timeline.setConfig({ data: nodes });
      return this;
    }
  
    setZoomLevel(value, duration = 0) {
      this._cosmograph.setZoomLevel(value, duration);
    }
  
    /** Node Methods */
    selectNode(node, selectAdjacentNodes = false) {
      if (selectAdjacentNodes) {
        const adjacentNodes = this.getAdjacentNodes(node.id);
        this._cosmograph.selectNodes([node, ...adjacentNodes]);
      } else {
        this._cosmograph.selectNode(node);
      }
    }
  
    unselectNodes() {
      this._cosmograph.unselectNodes();
    }
  
    focusNode(node) {
      this._cosmograph.focusNode(node);
    }
  
    getAdjacentNodes(id) {
      return this._cosmograph.getAdjacentNodes(id);
    }
  
    getSelectedNodes() {
      return this._cosmograph.getSelectedNodes();
    }
  
    getNodePositions() {
      return this._cosmograph.getNodePositions();
    }
  
    /** Zooming Methods */
    fitView(duration = 250) {
      this._cosmograph.fitView(duration);
    }
  
    fitViewByNodeIds(ids, duration = 250) {
      this._cosmograph.fitViewByNodeIds(ids, duration);
    }
  
    zoomToNode(node) {
      this._cosmograph.zoomToNode(node);
    }
  
    getZoomLevel() {
      return this._cosmograph.getZoomLevel();
    }
  
    /** Timeline Control */
    playTimelineAnimation() {
      this._timeline.playAnimation();
    }
  
    pauseTimelineAnimation() {
      this._timeline.pauseAnimation();
    }
  
    stopTimelineAnimation() {
      this._timeline.stopAnimation();
    }
  
    setTimelineSelection(range) {
      this._timeline.setSelection(range);
    }
  
    /** Simulation Methods */
    start(alpha = 1) {
      this._cosmograph.start(alpha);
    }
  
    pause() {
      this._cosmograph.pause();
    }
  
    restart() {
      this._cosmograph.restart();
    }
  
    isSimulationRunning() {
      return this._cosmograph.isSimulationRunning;
    }
  
    /** Event Handlers */
    onClick(clickedNode, index, position, event) {
      console.log(`Clicked on node ${clickedNode?.id || 'empty space'}`);
    }
  
    onZoom(event) {
      console.log('Zoom event:', event);
    }
  
    onSimulationEnd() {
      console.log('Simulation ended');
    }
  
    /** Query and Update Handling */
    requestQuery(query) {
      const q = query || this.query();
      return this._coordinator.requestQuery(this, q).then((data) => {
        this.setData(data.nodes, data.links);
      });
    }
  
    requestUpdate() {
      this._requestUpdate();
    }
  
    /** Destroy Graph */
    remove() {
      this._cosmograph.remove();
      console.log('Graph instance destroyed');
    }
  }
  