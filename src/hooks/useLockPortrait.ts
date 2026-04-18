import { useEffect } from "react";
import * as ScreenOrientation from "expo-screen-orientation";

export function useLockPortrait() {
  useEffect(() => {
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    return () => {
      void ScreenOrientation.unlockAsync().catch(() => {});
    };
  }, []);
}
