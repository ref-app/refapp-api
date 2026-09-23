import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Theme,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Container,
  createTheme,
  CssBaseline,
  MenuItem,
  Select,
  TextField,
  ThemeProvider,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import * as React from "react";
import { AtsConfigPreview } from "./AtsConfigPreview";
import { RefappAtsConfig } from "./lib/ats-types";
import "./style.css";
import { z } from "zod";
import { fromPairs, map, random } from "lodash";

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
type ConfigFile = (typeof configFiles)[number];
const toConfigFile = (value: unknown) =>
  z
    .enum(["", ...configFiles])
    .catch("")
    .parse(value);

const createOurTheme = (): Theme => {
  return createTheme({
    typography: {
      fontFamily: "Ubuntu, sans-serif",
      h1: { fontSize: 22 },
      // Originally style of h5, repurposed here for h2 (Refapp config "header")
      h2: { fontSize: "1.5rem", lineHeight: 1.334, fontWeight: 400 },
      // Match size of body1, but make bold (Refapp config "subheader")
      h3: { fontSize: "1rem", lineHeight: 1.5, fontWeight: 600 },
    },
    palette: {
      primary: {
        main: "#fd954b",
      },
      background: {
        default: "#b16834",
      },
    },
  });
};

const configMethods = ["sample", "live"] as const;
const defaultConfigMethod = configMethods[0];
type ConfigMethod = (typeof configMethods)[number];
const toConfigMethod = (value: unknown) =>
  z.enum(configMethods).catch(defaultConfigMethod).parse(value);

/**
 * "account" is Refapp's Account Integration, where the bearer token alone
 * identifies the account. "partner" is an ATS partner integration, where each
 * customer is identified by a separate provider key.
 */
const liveModes = ["account", "partner"] as const;
const defaultLiveMode = liveModes[0];
type LiveMode = (typeof liveModes)[number];
const toLiveMode = (value: unknown) =>
  z.enum(liveModes).catch(defaultLiveMode).parse(value);

type LiveEndpoints = { config: string; post: string };
const defaultLiveEndpoints: Record<LiveMode, LiveEndpoints> = {
  account: {
    config: "https://app.refapp.com/webhooks/account-integration/config",
    post: "https://app.refapp.com/webhooks/account-integration",
  },
  partner: { config: "", post: "" },
};

const safeUrl = (url: string) => {
  try {
    return new URL(url);
  } catch (_) {
    return undefined;
  }
};

const createConfigError = (message: string): RefappAtsConfig => ({
  config: {
    fields: [
      {
        id: "error",
        type: "text",
        label: message ?? "An error occurred",
      },
    ],
  },
});

const fetchFromGitHub = async (
  atsConfigFile: ConfigFile
): Promise<RefappAtsConfig> => {
  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/ref-app/refapp-api/main/config-examples/${encodeURIComponent(
        atsConfigFile
      )}`
    );
    const config = await response.json();
    return config;
  } catch (e) {
    return createConfigError(e instanceof Error ? e.message : String(e));
  }
};

const fetchFromRefapp = async (
  configEndpoint: string,
  atsSecret: string,
  customerSecret: string | undefined
): Promise<RefappAtsConfig> => {
  try {
    const response = await fetch(configEndpoint, {
      headers: {
        Authorization: `Bearer ${atsSecret}`,
        ...(customerSecret !== undefined && {
          "X-Provider-Key": customerSecret,
        }),
      },
    });
    const config = await response.json();
    if (!response.ok) {
      return createConfigError(config.message);
    }
    return config;
  } catch (e) {
    return createConfigError(e instanceof Error ? e.message : String(e));
  }
};

const generateCandidate = (recruiterDomain: string) => {
  const candidateId = Math.random().toString(36).slice(2);
  const jobId = Math.random().toString(36).slice(2);
  return {
    "id": candidateId,
    "first-name": "John",
    "last-name": "Doe",
    "email": `john.doe.${candidateId}@private.example`,
    "phone": `+467017406${random(0, 94) + 5}`,
    "language": "en",
    "job": {
      id: jobId,
      title: `Job #${jobId}`,
    },
    "recruiter": {
      "first-name": "Richard",
      "last-name": "Roe",
      "email": `richard.roe@${recruiterDomain}`,
    },
  };
};

const submitLive = async (
  postEndpoint: string,
  atsSecret: string,
  customerSecret: string | undefined,
  customerDomain: string,
  dataObject: Record<string, any>
): Promise<string> => {
  try {
    const response = await fetch(postEndpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${atsSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "partner-event": {
          ...(customerSecret !== undefined && {
            company: { uuid: customerSecret },
          }),
          "candidate": generateCandidate(customerDomain),
          "partner-result": {},
          "webhook-data": dataObject,
        },
      }),
    });
    const json = await response.json();
    return JSON.stringify(json, undefined, 2);
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
};

export default function App() {
  const [configMethod, setConfigMethod] =
    React.useState<ConfigMethod>(defaultConfigMethod);
  const [atsConfigFile, setAtsConfigFile] = React.useState<ConfigFile | "">("");
  const [atsConfig, setAtsConfig] = React.useState<RefappAtsConfig>();
  const [liveMode, setLiveMode] = React.useState<LiveMode>(defaultLiveMode);
  const [liveEndpoints, setLiveEndpoints] =
    React.useState<Record<LiveMode, LiveEndpoints>>(defaultLiveEndpoints);
  const { config: liveConfigEndpoint, post: livePostEndpoint } =
    liveEndpoints[liveMode];
  const setLiveEndpoint = (endpoint: keyof LiveEndpoints, value: string) =>
    setLiveEndpoints((endpoints) => ({
      ...endpoints,
      [liveMode]: { ...endpoints[liveMode], [endpoint]: value },
    }));
  const [liveAtsSecret, setLiveAtsSecret] = React.useState<string>("");
  const [liveCustomerSecret, setLiveCustomerSecret] =
    React.useState<string>("");
  const [liveCustomerDomain, setLiveCustomerDomain] =
    React.useState<string>("");
  const [submitResults, setSubmitResults] = React.useState<string>("");
  const [resetTrigger, setResetTrigger] = React.useState<number>(0);
  const theme = React.useMemo(() => createOurTheme(), []);
  // Account Integration has no provider key: the token identifies the account
  const liveProviderKey =
    liveMode === "partner" ? liveCustomerSecret : undefined;

  React.useEffect(() => {
    const configEndpointUrl = safeUrl(liveConfigEndpoint);
    const postEndpointUrl = safeUrl(livePostEndpoint);
    if (configMethod === "sample" && atsConfigFile !== "") {
      fetchFromGitHub(atsConfigFile).then((atsConfig) =>
        setAtsConfig(atsConfig)
      );
    } else if (
      configMethod === "live" &&
      configEndpointUrl !== undefined &&
      configEndpointUrl.pathname.length > 0 &&
      postEndpointUrl !== undefined &&
      postEndpointUrl.pathname.length > 0 &&
      liveAtsSecret.length > 0 &&
      (liveProviderKey === undefined || liveProviderKey.length > 0)
    ) {
      fetchFromRefapp(liveConfigEndpoint, liveAtsSecret, liveProviderKey).then(
        (atsConfig) => setAtsConfig(atsConfig)
      );
    } else {
      setAtsConfig(undefined);
    }
  }, [
    configMethod,
    atsConfigFile,
    liveConfigEndpoint,
    liveAtsSecret,
    liveProviderKey,
    resetTrigger,
  ]);

  const handleChange = (event: React.SyntheticEvent) => {
    const accordion = event.currentTarget.closest("[id^='config-']");
    if (accordion) {
      setConfigMethod(toConfigMethod(accordion.id.substring(7)));
    }
  };

  const handleSubmit = (formData: FormData) => {
    const dataObject = fromPairs(Array.from(formData));
    submitLive(
      livePostEndpoint,
      liveAtsSecret,
      liveProviderKey,
      liveCustomerDomain,
      dataObject
    ).then((result) => setSubmitResults(result));
  };

  const onReset = () => {
    console.log("onReset");
    setSubmitResults("");
    setResetTrigger((count) => count + 1);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container sx={{ display: "flex", flexDirection: "column", my: 2 }}>
        {/* All Accordions must share a common parent for the final rounded corners to work. */}
        <Box>
          <Accordion
            id="config-sample"
            expanded={configMethod === "sample"}
            onChange={handleChange}
            disableGutters
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h1">
                Refapp configuration UI sample
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Select
                value={atsConfigFile}
                onChange={(e) => setAtsConfigFile(toConfigFile(e.target.value))}
                sx={{
                  width: 1,
                }}
              >
                {configFiles.map((f) => (
                  <MenuItem key={f} value={f}>
                    {f}
                  </MenuItem>
                ))}
              </Select>
            </AccordionDetails>
          </Accordion>
          <Accordion
            id="config-live"
            expanded={configMethod === "live"}
            onChange={handleChange}
            disableGutters
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h1">Live Refapp test</Typography>
            </AccordionSummary>
            <AccordionDetails
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <ToggleButtonGroup
                exclusive
                fullWidth
                color="primary"
                value={liveMode}
                onChange={(_, value) => {
                  if (value !== null) {
                    setLiveMode(toLiveMode(value));
                  }
                }}
              >
                <ToggleButton value="account">Account integration</ToggleButton>
                <ToggleButton value="partner">ATS partner</ToggleButton>
              </ToggleButtonGroup>
              <TextField
                key={`${liveMode}-config`}
                label={"Configuration Endpoint"}
                value={liveConfigEndpoint}
                onChange={(e) =>
                  setLiveEndpoint("config", e.currentTarget.value)
                }
              />
              <TextField
                key={`${liveMode}-post`}
                label={"POST Endpoint"}
                value={livePostEndpoint}
                onChange={(e) => setLiveEndpoint("post", e.currentTarget.value)}
              />
              <TextField
                label={liveMode === "account" ? "Account token" : "ATS secret"}
                value={liveAtsSecret}
                onChange={(e) => setLiveAtsSecret(e.currentTarget.value)}
              />
              {liveMode === "partner" && (
                <TextField
                  label={"Customer secret"}
                  value={liveCustomerSecret}
                  onChange={(e) => setLiveCustomerSecret(e.currentTarget.value)}
                />
              )}
              <TextField
                label={"Customer email domain"}
                value={liveCustomerDomain}
                onChange={(e) => setLiveCustomerDomain(e.currentTarget.value)}
              />
            </AccordionDetails>
          </Accordion>
        </Box>

        {atsConfig && (
          <Card sx={{ mt: 2 }}>
            <CardContent>
              {configMethod === "live" ? (
                <AtsConfigPreview
                  configFields={atsConfig.config.fields}
                  onReset={onReset}
                  onSubmit={handleSubmit}
                />
              ) : (
                <AtsConfigPreview
                  configFields={atsConfig.config.fields}
                  onReset={onReset}
                />
              )}
            </CardContent>
          </Card>
        )}

        {submitResults && (
          <Card sx={{ mt: 2 }}>
            <Box
              sx={{
                whiteSpace: "pre",
                m: 2,
                p: 1,
                bgcolor: "grey.50",
                borderColor: "grey.300",
                borderWidth: 1,
                borderStyle: "solid",
                fontFamily: "monospace",
              }}
            >
              {submitResults}
            </Box>
          </Card>
        )}
      </Container>
    </ThemeProvider>
  );
}
