"use client";

import React, { useEffect, useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount((prev) => prev + 1);
  }, []);
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}
