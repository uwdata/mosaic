/* 
    Query lifecycle: queued -> ready -> running -> done (canceled?)
    1. Queries are queued in the graph
    2. When Query is ready to be processed (indegrees = 0), execute it
    3. Mark it running
    4. When finished, decrease the indegrees of all its predecessors
*/

export type NodeId = number;
export type NodeState = 'queued' | 'ready' | 'running' | 'done' | 'canceled';

export interface DependencyGraphNode<T> {
  id: NodeId;
  item: T;
  priority: number;
  indegree: number;
  dependents: Set<NodeId>; // loop over each dependent, subtract indegree
  state: NodeState;
}

export interface AddNodeOptions {
  priority: number;
  deps?: Iterable<NodeId>;
}

/**
 * Dependency-aware scheduler graph.
 * Nodes become runnable when indegree reaches zero, and are emitted by priority.
 */
export class DependencyGraph<T = unknown> {
  private nodes: Map<NodeId, DependencyGraphNode<T>>;
  private readyQueues: NodeId[][];
  private nextId: number;
  private running: number;

  constructor(ranks: number = 3) {
    this.nodes = new Map();
    this.readyQueues = Array.from({ length: ranks }, () => []);
    this.nextId = 1;
    this.running = 0;
  }

  hasReady(): boolean {
    return this.readyQueues.some(q => q.length > 0);
  }
  /**
   * Add a node and (optionally) dependency edges.
   * @returns The assigned node id.
   */
  add(item: T, { priority, deps = [] }: AddNodeOptions): NodeId {

    const id = this.nextId++;
    const node: DependencyGraphNode<T> = {
      id,
      item,
      priority,
      indegree: 0,
      dependents: new Set(),
      state: 'queued'
    };
    this.nodes.set(id, node);

    const uniqueDeps = new Set(deps);
    for (const depId of uniqueDeps) {
      const dep = this.nodes.get(depId);
      if (!dep || dep.state === 'done' || dep.state === 'canceled') continue;
      dep.dependents.add(id);
      node.indegree += 1;
    }

    if (node.indegree === 0) {
      node.state = 'ready';
      this.readyQueues[priority].push(id);
    }

    return id;
  }

  /**
   * Pop the next runnable node by priority and mark it as running.
   */
  popReady(): DependencyGraphNode<T> | undefined {

    for (const queue of this.readyQueues) {

      while (queue.length) {

        const id = queue.shift()!; // inefficient?
        const node = this.nodes.get(id);

        if (!node || node.state !== 'ready') continue;

        node.state = 'running';
        this.running += 1;
        return node;
      }
    }
  }

  /**
   * Mark a node as done and release dependent nodes.
   */
  markDone(id: NodeId): void {

    const node = this.nodes.get(id);
    if (!node || node.state === 'done' || node.state === 'canceled') return;

    if (node.state === 'running') {
      this.running -= 1;
    }

    node.state = 'done';
    this.releaseDependents(node.dependents);
    this.nodes.delete(id);
  }

  /**
   * Remove all nodes that pass the predicate.
   * Removed nodes are treated like canceled work and release dependents.
   */
  removeWhere(test: (node: DependencyGraphNode<T>) => boolean): DependencyGraphNode<T>[] {
    const ids: NodeId[] = [];
    const removed: DependencyGraphNode<T>[] = [];

    for (const node of this.nodes.values()) {
      
      if (node.state === 'done' || node.state === 'canceled') continue;
      if (test(node)) {
        ids.push(node.id);
        removed.push(node);
      }
    }

    if (ids.length === 0) return removed;

    const set = new Set(ids);

    for (const id of ids) {
      const node = this.nodes.get(id);
      if (!node) continue;
      if (node.state === 'running') {
        this.running -= 1;
      }
      node.state = 'canceled';
    }

    for (const id of ids) {
      const node = this.nodes.get(id);
      if (!node) continue;

      for (const depId of node.dependents) {
        if (set.has(depId)) continue;
        const dep = this.nodes.get(depId);
        if (!dep || dep.state !== 'queued') continue;
        dep.indegree = Math.max(0, dep.indegree - 1);
        if (dep.indegree === 0) {
          dep.state = 'ready';
          this.readyQueues[dep.priority].push(dep.id);
        }
      }
    }

    for (const id of ids) {
      this.nodes.delete(id);
    }

    return removed;
  }

  /**
   * Clear all queued/running nodes.
   * @returns Removed nodes.
   */
  clear(): DependencyGraphNode<T>[] {
    const removed: DependencyGraphNode<T>[] = [];
    for (const node of this.nodes.values()) {
      if (node.state !== 'done' && node.state !== 'canceled') {
        removed.push(node);
      }
    }
    this.nodes.clear();
    this.running = 0;
    this.readyQueues = this.readyQueues.map(() => []);
    return removed;
  }

  items(): Iterable<[NodeId, DependencyGraphNode<T>]> {
    return this.nodes.entries();
  }

  get(id: NodeId): DependencyGraphNode<T> | undefined {
    return this.nodes.get(id);
  }

  private releaseDependents(dependents: Set<NodeId>): void {
    for (const depId of dependents) {
      const dep = this.nodes.get(depId);

      if (!dep || dep.state !== 'queued') continue;

      dep.indegree -= 1;
      if (dep.indegree === 0) {
        dep.state = 'ready';
        this.readyQueues[dep.priority].push(dep.id);
      }
    }
  }
}
