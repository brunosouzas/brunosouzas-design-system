// Remotion Studio root: registers every scene of the catalogue as one
// composition per format and language, in a folder named after the scene.
// The ids, sizes and frame rate come from the scene data (src/scenes/catalogue.ts);
// this file only maps each scene id to its React component.
// Scene.tsx and scene.ts share a folder (design §9); the explicit extensions keep
// a case-insensitive file system (macOS) from resolving `./Scene` to scene.ts.
import React from "react";
import { Composition, Folder } from "remotion";
import { compositionsOf } from "./scenes/catalogue";
import { scenes } from "./scenes";
import { CircuitBreakerStatesScene, type SceneProps } from "./scenes/circuit-breaker-states/Scene.tsx";
import { circuitBreakerStates } from "./scenes/circuit-breaker-states/scene.ts";

import { PublishSubscribeScene } from "./scenes/publish-subscribe/Scene.tsx";

const components: Record<string, React.FC<SceneProps>> = {
  "publish-subscribe": PublishSubscribeScene,
  [circuitBreakerStates.id]: CircuitBreakerStatesScene,
};

const componentOf = (sceneId: string): React.FC<SceneProps> => {
  const component = components[sceneId];
  if (!component) throw new Error(`scene ${sceneId} is in src/scenes/index.ts but has no component in src/Root.tsx`);
  return component;
};

export const RemotionRoot: React.FC = () => (
  <>
    {scenes.map((scene) => (
      <Folder key={scene.id} name={scene.id}>
        {compositionsOf(scene).map((composition) => (
          <Composition<any, SceneProps>
            key={composition.id}
            id={composition.id}
            component={componentOf(scene.id)}
            durationInFrames={composition.durationInFrames}
            fps={composition.fps}
            width={composition.width}
            height={composition.height}
            defaultProps={{ lang: composition.lang, format: composition.format }}
          />
        ))}
      </Folder>
    ))}
  </>
);
