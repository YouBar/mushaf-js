interface CacheNode<T> {
  key: string;
  value: T;
  prev: CacheNode<T> | null;
  next: CacheNode<T> | null;
}

export class LRUCache<T> {
  private capacity: number;
  private map: Map<string, CacheNode<T>>;
  private head: CacheNode<T>;
  private tail: CacheNode<T>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.map = new Map();

    // Sentinel nodes to avoid null checks
    this.head = { key: '', value: null as unknown as T, prev: null, next: null };
    this.tail = { key: '', value: null as unknown as T, prev: null, next: null };
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key: string): T | null {
    const node = this.map.get(key);
    if (!node) return null;
    this.moveToFront(node);
    return node.value;
  }

  set(key: string, value: T): void {
    const existing = this.map.get(key);
    if (existing) {
      existing.value = value;
      this.moveToFront(existing);
      return;
    }

    const node: CacheNode<T> = { key, value, prev: null, next: null };
    this.map.set(key, node);
    this.insertAtFront(node);

    if (this.map.size > this.capacity) {
      this.evictLRU();
    }
  }

  has(key: string): boolean {
    return this.map.has(key);
  }

  delete(key: string): void {
    const node = this.map.get(key);
    if (!node) return;
    this.removeNode(node);
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get size(): number {
    return this.map.size;
  }

  private insertAtFront(node: CacheNode<T>): void {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next!.prev = node;
    this.head.next = node;
  }

  private removeNode(node: CacheNode<T>): void {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }

  private moveToFront(node: CacheNode<T>): void {
    this.removeNode(node);
    this.insertAtFront(node);
  }

  private evictLRU(): void {
    const lru = this.tail.prev;
    if (!lru || lru === this.head) return;
    this.removeNode(lru);
    this.map.delete(lru.key);
  }
}
