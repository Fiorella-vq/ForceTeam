import React, { useState, useEffect } from "react";
import getState from "./flux";

export const Context = React.createContext(null);

const injectContext = (PassedComponent) => {
  return (props) => {
    const [store, setStoreState] = useState(getState({ getStore, getActions, setStore }).store);
    const [actions, setActions] = useState({});

    function getStore() {
      return store;
    }

    function getActions() {
      return actions;
    }

    function setStore(updatedStore) {
      setStoreState(prevStore => ({ ...prevStore, ...updatedStore }));
    }

    useEffect(() => {
      const initialActions = getState({ getStore, getActions, setStore }).actions;
      setActions(initialActions);

      // Llamar a cualquier acción de carga inicial si existe
      if (initialActions.loadUserFromStorage) {
        initialActions.loadUserFromStorage();
      }
    }, []);

    return (
      <Context.Provider value={{ store, actions }}>
        <PassedComponent {...props} />
      </Context.Provider>
    );
  };
};

export default injectContext;
