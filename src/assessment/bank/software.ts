import type { Question } from "../types";

// Original questions written for Talent Incarnation. Ids are permanent.
export const software: Question[] = [
  // Difficulty 1
  {
    id: "sw-001", domain: "software", topic: "Programming fundamentals", difficulty: 1,
    prompt: "Which data type is the natural choice for storing whether a user is logged in?",
    options: ["String", "Boolean", "Floating-point number", "Array"],
    correct: 1,
    explanation: "A logged-in flag has exactly two states, true or false, which is what a Boolean represents.",
  },
  {
    id: "sw-002", domain: "software", topic: "Version control", difficulty: 1,
    prompt: "In Git, what does `git commit` do?",
    options: [
      "Uploads your changes to the remote server",
      "Downloads the latest changes from teammates",
      "Records the staged changes as a new snapshot in your local repository",
      "Deletes untracked files",
    ],
    correct: 2,
    explanation: "A commit saves the staged changes locally. Sending them to a remote is a separate step, `git push`.",
  },
  {
    id: "sw-003", domain: "software", topic: "Web & APIs", difficulty: 1,
    prompt: "Which HTTP method is conventionally used to read a resource without changing it?",
    options: ["GET", "POST", "DELETE", "PATCH"],
    correct: 0,
    explanation: "GET is defined as a safe method: it retrieves data and should not modify server state.",
  },
  {
    id: "sw-004", domain: "software", topic: "Data structures & algorithms", difficulty: 1,
    prompt: "An array holds 10 items and uses zero-based indexing. What is the index of the last item?",
    options: ["10", "11", "1", "9"],
    correct: 3,
    explanation: "Zero-based indexes run from 0 to length − 1, so the last of 10 items is at index 9.",
  },
  {
    id: "sw-005", domain: "software", topic: "Databases", difficulty: 1,
    prompt: "In a relational database, what is a primary key?",
    options: [
      "The first column that was created in a table",
      "A column or set of columns whose value uniquely identifies each row",
      "A password that protects the table",
      "The column the table is sorted by",
    ],
    correct: 1,
    explanation: "A primary key uniquely identifies each row; the database rejects duplicates and nulls in it.",
  },
  {
    id: "sw-006", domain: "software", topic: "Testing & quality", difficulty: 1,
    prompt: "What is the main purpose of a unit test?",
    options: [
      "To measure how fast the whole application loads",
      "To check that the user interface looks right on phones",
      "To verify that a small piece of code behaves correctly in isolation",
      "To deploy code to production",
    ],
    correct: 2,
    explanation: "Unit tests exercise one small unit, such as a function, separately from the rest of the system.",
  },

  // Difficulty 2
  {
    id: "sw-007", domain: "software", topic: "Data structures & algorithms", difficulty: 2,
    prompt: "Which data structure removes items in the same order they were added (first in, first out)?",
    options: ["Stack", "Queue", "Binary search tree", "Hash set"],
    correct: 1,
    explanation: "A queue is FIFO. A stack is the opposite: last in, first out.",
  },
  {
    id: "sw-008", domain: "software", topic: "Programming fundamentals", difficulty: 2,
    prompt: "A function solves a problem by calling itself on a smaller input until it reaches a base case. What is this technique called?",
    options: ["Iteration", "Polymorphism", "Encapsulation", "Recursion"],
    correct: 3,
    explanation: "Recursion is a function calling itself. The base case is what stops the chain of calls.",
  },
  {
    id: "sw-009", domain: "software", topic: "Web & APIs", difficulty: 2,
    prompt: "A server responds with HTTP status 404. What does that mean?",
    options: [
      "The requested resource was not found",
      "The request succeeded",
      "The server crashed while handling the request",
      "The client must log in first",
    ],
    correct: 0,
    explanation: "404 Not Found means the server has nothing at that URL. A crash is 500; needing to log in is 401.",
  },
  {
    id: "sw-010", domain: "software", topic: "Databases", difficulty: 2,
    prompt: "In SQL, which clause filters individual rows before any grouping happens?",
    options: ["HAVING", "ORDER BY", "WHERE", "GROUP BY"],
    correct: 2,
    explanation: "WHERE filters rows before GROUP BY runs. HAVING filters the groups afterwards.",
  },
  {
    id: "sw-011", domain: "software", topic: "Version control", difficulty: 2,
    prompt: "Two developers changed the same line of a file on different branches. What happens when the branches are merged?",
    options: [
      "Git silently keeps the newer change",
      "Git reports a merge conflict that someone must resolve",
      "Git deletes the file",
      "Git keeps both lines automatically, one after the other",
    ],
    correct: 1,
    explanation: "Git cannot decide between two edits to the same line, so it stops and marks a conflict for a person to resolve.",
  },
  {
    id: "sw-012", domain: "software", topic: "Testing & quality", difficulty: 2,
    prompt: "After fixing a bug, you add a test that fails without the fix and passes with it. What kind of test is this?",
    options: ["Load test", "Smoke test", "Usability test", "Regression test"],
    correct: 3,
    explanation: "A regression test pins down a fixed bug so that it is caught if it ever comes back.",
  },

  // Difficulty 3
  {
    id: "sw-013", domain: "software", topic: "Data structures & algorithms", difficulty: 3,
    prompt: "What is the worst-case time complexity of binary search on a sorted array of n elements?",
    options: ["O(n)", "O(n log n)", "O(log n)", "O(1)"],
    correct: 2,
    explanation: "Each comparison halves the remaining range, so at most about log₂ n steps are needed.",
  },
  {
    id: "sw-014", domain: "software", topic: "Data structures & algorithms", difficulty: 3,
    prompt: "What is the average-case time to look up a value by key in a well-sized hash table?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    correct: 0,
    explanation: "Hashing jumps straight to the bucket for a key, giving constant time on average. Many collisions can degrade it.",
  },
  {
    id: "sw-015", domain: "software", topic: "Web & APIs", difficulty: 3,
    prompt: "In REST conventions, what distinguishes PUT from POST?",
    options: [
      "PUT can carry a request body and POST cannot",
      "PUT is idempotent: repeating the same request leaves the same final state",
      "PUT is encrypted and POST is not",
      "PUT is only for deleting resources",
    ],
    correct: 1,
    explanation: "PUT replaces the resource at a known URL, so sending it twice has the same effect as once. POST may create a new resource each time.",
  },
  {
    id: "sw-016", domain: "software", topic: "Databases", difficulty: 3,
    prompt: "What trade-off does adding an index to a table column make?",
    options: [
      "Faster writes in exchange for slower reads",
      "Less storage in exchange for slower queries",
      "Stronger security in exchange for more storage",
      "Faster lookups on that column in exchange for slower writes and extra storage",
    ],
    correct: 3,
    explanation: "An index speeds up searches on its column, but it must be stored and updated on every insert, update and delete.",
  },
  {
    id: "sw-017", domain: "software", topic: "Programming fundamentals", difficulty: 3,
    prompt: "What is the practical difference between passing an argument by value and by reference?",
    options: [
      "By value passes a copy; by reference lets the function modify the caller's original data",
      "By value is only for numbers; by reference is only for text",
      "By reference is always faster and has no other effect",
      "There is no difference in behaviour",
    ],
    correct: 0,
    explanation: "With pass by value the function works on a copy. With pass by reference it works on the caller's data, so changes are visible outside.",
  },
  {
    id: "sw-018", domain: "software", topic: "Systems & concurrency", difficulty: 3,
    prompt: "What is a race condition?",
    options: [
      "Two programs competing for the fastest benchmark result",
      "A loop that never terminates",
      "A bug where the result depends on the timing of concurrent operations on shared state",
      "A network request that times out",
    ],
    correct: 2,
    explanation: "When concurrent operations touch shared state without coordination, the outcome depends on how they happen to interleave.",
  },

  // Difficulty 4
  {
    id: "sw-019", domain: "software", topic: "Data structures & algorithms", difficulty: 4,
    prompt: "You need the k smallest values from a stream of n numbers, where n is huge and k is small. Which approach is most efficient?",
    options: [
      "Sort all n numbers, then take the first k",
      "Keep a max-heap of size k, replacing its top when a smaller number arrives",
      "Insert every number into a linked list kept in sorted order",
      "Compare every pair of numbers",
    ],
    correct: 1,
    explanation: "A size-k max-heap gives O(n log k) time and O(k) memory. Sorting everything costs O(n log n) time and O(n) memory.",
  },
  {
    id: "sw-020", domain: "software", topic: "Databases", difficulty: 4,
    prompt: "A bank transfer debits one account and credits another. Which transaction property guarantees that either both happen or neither does?",
    options: ["Isolation", "Durability", "Consistency", "Atomicity"],
    correct: 3,
    explanation: "Atomicity makes a transaction all-or-nothing: if any step fails, every step is rolled back.",
  },
  {
    id: "sw-021", domain: "software", topic: "Systems & concurrency", difficulty: 4,
    prompt: "Thread A holds lock 1 and waits for lock 2, while thread B holds lock 2 and waits for lock 1. Which practice prevents this deadlock?",
    options: [
      "Always acquiring locks in the same global order",
      "Adding more threads",
      "Making each thread sleep briefly before locking",
      "Using larger locks",
    ],
    correct: 0,
    explanation: "If every thread takes locks in one agreed order, a circular wait cannot form, and a circular wait is required for deadlock.",
  },
  {
    id: "sw-022", domain: "software", topic: "Web & APIs", difficulty: 4,
    prompt: "A page served from app.example.com calls an API at api.other.com, and the browser blocks the page from reading the response. What needs to change?",
    options: [
      "The page must use HTTP instead of HTTPS",
      "The user must disable their firewall",
      "The API must send CORS headers that allow the page's origin",
      "The API must respond more quickly",
    ],
    correct: 2,
    explanation: "Browsers enforce the same-origin policy. The API opts in to cross-origin reads with headers such as Access-Control-Allow-Origin.",
  },
  {
    id: "sw-023", domain: "software", topic: "Testing & quality", difficulty: 4,
    prompt: "A test passes locally but fails intermittently in CI with no code changes. What is the most likely cause?",
    options: [
      "The CI server uses a different keyboard layout",
      "The test depends on timing, execution order or shared state",
      "The test has too many assertions",
      "The programming language is interpreted",
    ],
    correct: 1,
    explanation: "Intermittent failures usually come from nondeterminism: timeouts, test ordering, shared data or real network calls.",
  },
  {
    id: "sw-024", domain: "software", topic: "Programming fundamentals", difficulty: 4,
    prompt: "What makes a function \"pure\"?",
    options: [
      "It is written without any loops",
      "It only accepts numbers as arguments",
      "It has been reviewed and approved",
      "It returns the same output for the same input and has no side effects",
    ],
    correct: 3,
    explanation: "A pure function depends only on its arguments and changes nothing outside itself, which makes it easy to test and reason about.",
  },

  // Difficulty 5
  {
    id: "sw-025", domain: "software", topic: "Data structures & algorithms", difficulty: 5,
    prompt: "Quicksort always picks the first element as the pivot. What is its running time on input that is already sorted?",
    options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
    correct: 2,
    explanation: "On sorted input a first-element pivot splits n items into 0 and n − 1 every time, giving n levels of O(n) work.",
  },
  {
    id: "sw-026", domain: "software", topic: "Databases", difficulty: 5,
    prompt: "A transaction runs at READ COMMITTED isolation. Which anomaly can it still experience?",
    options: [
      "A non-repeatable read: reading the same row twice returns different committed values",
      "A dirty read: seeing another transaction's uncommitted change",
      "A lost commit: its own committed data disappearing",
      "A torn page: reading half of a row",
    ],
    correct: 0,
    explanation: "READ COMMITTED prevents dirty reads, but each statement sees the latest committed data, so a row can change between two reads.",
  },
  {
    id: "sw-027", domain: "software", topic: "Systems & concurrency", difficulty: 5,
    prompt: "According to the CAP theorem, when a network partition occurs, a distributed data store must choose between which two properties?",
    options: [
      "Performance and cost",
      "Consistency and availability",
      "Latency and throughput",
      "Security and scalability",
    ],
    correct: 1,
    explanation: "During a partition, a node either refuses some requests to stay consistent or answers with possibly stale data to stay available.",
  },
  {
    id: "sw-028", domain: "software", topic: "Web & APIs", difficulty: 5,
    prompt: "A client retries a payment request after a timeout, not knowing whether the first attempt succeeded. How should the API prevent a double charge?",
    options: [
      "Reject every retry",
      "Ask the client to wait longer before retrying",
      "Process retries only at night",
      "Accept an idempotency key and return the original result for a repeated key",
    ],
    correct: 3,
    explanation: "With an idempotency key the server recognises a repeated request and returns the stored result instead of charging again.",
  },
  {
    id: "sw-029", domain: "software", topic: "Systems & concurrency", difficulty: 5,
    prompt: "When a popular cache entry expires, hundreds of requests miss at once and all query the database. Which mitigation addresses this directly?",
    options: [
      "Increase the database's disk size",
      "Disable caching for popular keys",
      "Let only one request recompute the value while the others wait or get the stale value",
      "Shorten the cache expiry time",
    ],
    correct: 2,
    explanation: "This is a cache stampede. Coalescing the recomputation (single-flight) or serving stale data while refreshing keeps the load off the database.",
  },
  {
    id: "sw-030", domain: "software", topic: "Data structures & algorithms", difficulty: 5,
    prompt: "Which algorithm finds shortest paths from one source in a graph with non-negative edge weights, and what is its running time with a binary heap?",
    options: [
      "Dijkstra's algorithm, O((V + E) log V)",
      "Depth-first search, O(V + E)",
      "Bellman–Ford, O(log V)",
      "Kruskal's algorithm, O(E log E)",
    ],
    correct: 0,
    explanation: "Dijkstra's algorithm with a binary heap runs in O((V + E) log V). DFS does not account for weights, and Kruskal's builds a spanning tree.",
  },
];
