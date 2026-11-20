import { describe, it, expect } from 'vitest';
import { PriorityQueue } from '../src/util/priority-queue.js';

function drain<T>(queue: PriorityQueue<T>): T[] {
  const items: T[] = [];
  for (let item = queue.next(); item !== undefined; item = queue.next()) {
    items.push(item);
  }
  return items;
}

describe('PriorityQueue', () => {
  it('dequeues by priority rank, FIFO within rank', () => {
    const queue = new PriorityQueue<string>(3);
    queue.insert('n1', 1);
    queue.insert('h1', 0);
    queue.insert('n2', 1);
    queue.insert('l1', 2);
    queue.insert('h2', 0);
    expect(drain(queue)).toEqual(['h1', 'h2', 'n1', 'n2', 'l1']);
  });

  it('removes items matching a predicate', () => {
    const queue = new PriorityQueue<number>(1);
    [1, 2, 3, 4, 5].forEach(n => queue.insert(n, 0));
    queue.remove(n => n % 2 === 0);
    expect(drain(queue)).toEqual([1, 3, 5]);
  });

  it('removes consecutive items after a kept item', () => {
    const queue = new PriorityQueue<number>(1);
    [1, 2, 3, 4].forEach(n => queue.insert(n, 0));
    queue.remove(n => n === 2 || n === 3);
    expect(drain(queue)).toEqual([1, 4]);
  });

  it('removes runs of items at the head and tail', () => {
    const queue = new PriorityQueue<number>(1);
    [1, 2, 3, 4, 5, 6].forEach(n => queue.insert(n, 0));
    queue.remove(n => n !== 3);
    expect(drain(queue)).toEqual([3]);
  });

  it('maintains the tail across removals', () => {
    const queue = new PriorityQueue<number>(1);
    [1, 2, 3].forEach(n => queue.insert(n, 0));
    queue.remove(n => n >= 2);
    queue.insert(4, 0);
    expect(drain(queue)).toEqual([1, 4]);
  });

  it('removes all items', () => {
    const queue = new PriorityQueue<number>(1);
    [1, 2].forEach(n => queue.insert(n, 0));
    queue.remove(() => true);
    expect(queue.isEmpty()).toBe(true);
    queue.insert(3, 0);
    expect(drain(queue)).toEqual([3]);
  });
});
