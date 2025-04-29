import { useCallback } from "react";

const useSubmitOnEnter = (submitFunction, preventDefault = true) => {
  return useCallback(
    (e) => {
      if (e.key === "Enter") {
        if (preventDefault) e.preventDefault();
        submitFunction(e);
      }
    },
    [submitFunction, preventDefault]
  );
};

export default useSubmitOnEnter;
