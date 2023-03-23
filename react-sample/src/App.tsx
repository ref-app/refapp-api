import { Theme } from "@emotion/react";
import {
  Box,
  createTheme,
  MenuItem,
  Select,
  ThemeProvider,
  Typography,
} from "@mui/material";
import * as React from "react";
import { AtsConfigPreview } from "./AtsConfigPreview";
import { RefappAtsConfig } from "./lib/ats-types";
import "./style.css";

/**
 * From the config-examples directory in this repository
 */
const configFiles = [
  "Cost Centers, existing project, English.json",
  "Cost Centers, existing project, Swedish.json",
  "Cost Centers.json",
  "External Recruitment, pre-filled values from default project template.json",
  "Project Templates, existing project, English.json",
  "Project Templates, existing project, Swedish.json",
  "Project Templates.json",
] as const;

const createOurTheme = (): Theme => {
  return createTheme({
    typography: {
      fontFamily: "Ubuntu, sans-serif",
      h1: { fontSize: 20 },
      h2: { fontSize: 18 },
      h3: { fontSize: 16 },
      h4: { fontSize: 14 },
    },
  });
};

export default function App() {
  const [atsConfigFile, setAtsConfigFile] = React.useState<string>();
  const [atsConfig, setAtsConfig] = React.useState<RefappAtsConfig>();
  const theme = React.useMemo(() => createOurTheme(), []);

  React.useEffect(() => {
    if (!atsConfigFile) {
      return;
    }
    fetch(
      `https://raw.githubusercontent.com/ref-app/refapp-api/main/config-examples/${encodeURIComponent(
        atsConfigFile
      )}`
    ).then((response) => {
      response.json().then((config) => {
        setAtsConfig(config);
      });
    });
  }, [atsConfigFile]);

  return (
    <ThemeProvider theme={theme}>
      <Box display="flex" flexDirection="column" gap={2}>
        <Typography variant="h1">Refapp configuration UI sample</Typography>
        <Select
          value={atsConfigFile}
          onChange={(e) => setAtsConfigFile(e.target.value)}
        >
          {configFiles.map((f) => (
            <MenuItem key={f} value={f}>
              {f}
            </MenuItem>
          ))}
        </Select>

        {atsConfig && (
          <AtsConfigPreview configFields={atsConfig.config.fields} />
        )}
      </Box>
    </ThemeProvider>
  );
}
