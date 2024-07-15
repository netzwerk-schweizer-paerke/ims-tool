import React, { FC, MutableRefObject, ReactNode, useEffect, useRef, useState } from "react";

interface UpdateRef {
  [key: number]: () => void;
}

const updateRef: UpdateRef = {};
let updateRefCount = 0;

interface XarrowProviderProps {
  children: ReactNode;
  instanceCount: MutableRefObject<number>;
}

const XarrowProvider: FC<XarrowProviderProps> = ({ children, instanceCount }) => {
  const [, setRender] = useState({});
  const updateXarrow = () => setRender({});
  useEffect(() => {
    instanceCount.current = updateRefCount;
    updateRef[instanceCount.current] = updateXarrow;
  }, []);
  return <XarrowContext.Provider value={updateXarrow}>{children}</XarrowContext.Provider>;
};

interface XelemProviderProps {
  children: ReactNode;
  instanceCount: MutableRefObject<number>;
}

const XelemProvider: FC<XelemProviderProps> = ({ children, instanceCount }) => {
  return (
    <XelemContext.Provider value={updateRef[instanceCount.current]}>
      {children}
    </XelemContext.Provider>
  );
};

interface XwrapperProps {
  children: ReactNode;
}

const Xwrapper: FC<XwrapperProps> = ({ children }) => {
  const instanceCount = useRef(updateRefCount);
  const [, setRender] = useState({});
  useEffect(() => {
    updateRefCount++;
    setRender({});
    return () => {
      delete updateRef[instanceCount.current];
    };
  }, []);

  return (
    <XelemProvider instanceCount={instanceCount}>
      <XarrowProvider instanceCount={instanceCount}>{children}</XarrowProvider>
    </XelemProvider>
  );
};

export const XelemContext = React.createContext<() => void>(() => {});
export const XarrowContext = React.createContext<() => void>(() => {});
export default Xwrapper;
