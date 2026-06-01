import * as React from "react";
console.log(
  "[SSR layer] useState:",
  typeof React.useState,
  "| exports:",
  Object.keys(React).length,
);
