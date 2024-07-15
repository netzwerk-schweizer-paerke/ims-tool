import { useContext, useLayoutEffect, useState } from "react";
import { XelemContext } from "./Xwrapper";

// Typing the noop function to match the expected context value type
const noop: () => void = () => {};

// Typing the useXarrow hook to explicitly state it returns a function of type () => void
const useXarrow = (): () => void => {
  const [, setRender] = useState<{}>({});
  const reRender: () => void = () => setRender({});

  let updateXarrow: () => void = useContext(XelemContext);
  if (!updateXarrow) updateXarrow = noop;

  useLayoutEffect(() => {
    updateXarrow();
  });

  return reRender;
};

export default useXarrow;
