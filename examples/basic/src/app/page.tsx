import React from "react";
import Counter from "./Counter";

// Mock a database call so we have an async server component like the blog example.
const db = {
  user: {
    async findFirst() {
      return { name: "Sanku" };
    },
  },
};

export default async function Page() {
  const user = await db.user.findFirst();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>{user.name}</p>
      <Counter />
    </div>
  );
}
