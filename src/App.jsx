import { useState } from "react";
import MainIndex from "./app/dashboard/mainIndex";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <MainIndex />
    </>
  );
}

export default App;
