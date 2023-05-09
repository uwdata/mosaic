/**
 * Create a new priority queue instance.
 * @param {number} ranks An integer number of rank-order priority levels.
 * @returns A priority queue instance.
 */
export function priorityQueue(ranks) {
	// one list for each integer priority level
	const queue = Array.from(
		{ length: ranks },
		() => ({ head: null, tail: null })
	);

	return {
		/**
		 * Indicate if the queue is empty.
		 * @returns [boolean] true if empty, false otherwise.
		 */
		isEmpty() {
			return queue.every(list => !list.head);
		},

		/**
		 * Insert an item into the queue with a given priority rank.
		 * @param {*} item The item to add.
		 * @param {number} rank The integer priority rank.
		 *  Priority ranks are integers starting at zero.
		 *  Lower ranks indicate higher priority.
		 */
		insert(item, rank) {
			const list = queue[rank];
			if (!list) {
				throw new Error(`Invalid queue priority rank: ${rank}`);
			}

			const node = { item, next: null };
			if (list.head === null) {
				list.head = list.tail = node;
			} else {
				list.tail = (list.tail.next = node);
			}
		},

		/**
		 * Remove a set of items from the queue, regardless of priority rank.
		 * If a provided item is not in the queue it will be ignored.
		 * @param {(item: *) => boolean} test A predicate function to test
		 * 	if an item should be removed (true to drop, false to keep).
		 */
		remove(test) {
			for (const list of queue) {
				let { head, tail } = list;
				for (let prev = null, curr = head; curr; prev = curr, curr = curr.next) {
					if (test(curr.item)) {
						if (curr === head) {
							head = curr.next;
						} else {
							prev.next = curr.next;
						}
						if (curr === tail) tail = prev || head;
					}
				}
				list.head = head;
				list.tail = tail;
			}
		},

		/**
		 * Remove and return the next highest priority item.
		 * @returns {*} The next item in the queue,
		 *  or undefined if this queue is empty.
		 */
		next() {
			for (const list of queue) {
				const { head } = list;
				if (head !== null) {
					list.head = head.next;
					if (list.tail === head) {
						list.tail = null;
					}
					return head.item;
				}
			}
		}
	};
}
