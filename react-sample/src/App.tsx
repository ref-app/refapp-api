import * as React from "react";
import { AtsConfigPreview } from "./AtsConfigPreview";
import { RefappAtsConfig } from "./lib/ats-types";
import "./style.css";

export default function App() {
  const [atsConfig, setAtsConfig] = React.useState<RefappAtsConfig>();

  React.useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/ref-app/refapp-api/main/config-examples/Cost%20Centers%2C%20existing%20project%2C%20Swedish.json"
    ).then((response) => {
      response.json().then((config) => {
        setAtsConfig(config);
      });
    });
  });

  return (
    <div>
      <h1>Refapp configuration UI sample</h1>
      {atsConfig && <AtsConfigPreview configFields={atsConfig.config.fields} />}
    </div>
  );
}
