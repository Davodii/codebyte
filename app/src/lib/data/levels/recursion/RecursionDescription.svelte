<p>
    <strong>Recursion</strong> is when a function calls itself to solve a smaller version
    of the same problem. Each call works on a simpler input until it hits a
    <em>base case</em> — a condition so simple it can be answered directly.
</p>
<p>
    The <strong>Fibonacci sequence</strong> is a classic example: to find
    <code>fib(n)</code>, you need <code>fib(n-1)</code> and <code>fib(n-2)</code>.
    Watch how the recursion tree expands outwards and then collapses back as each
    call returns its value to its parent.
</p>
